import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js';
import { INTERFACE_IDS } from '@lukso/lsp-smart-contracts';
import { BigNumber, ethers } from 'ethers';
import { eip165ABI } from '@/abis/eip165ABI';
import { erc20ABI } from '@/abis/erc20ABI';
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import lsp4Schema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';
import lsp9Schema from '@erc725/erc725.js/schemas/LSP9Vault.json';
import { constants } from '@/app/constants';

export const formatAddress = (address: string) => {
  return `${address.slice(0, 5)}...${address.slice(-4)}`;
};

//most functions below are copied from https://github.com/lukso-network/universalprofile-test-dapp/blob/main/src/helpers/tokenUtils.ts
export enum LSPType {
  LSP7DigitalAsset = 'LSP7DigitalAsset',
  LSP8IdentifiableDigitalAsset = 'LSP8IdentifiableDigitalAsset',
  Unknown = 'Unknown',
}

export interface LspTypeOption {
  interfaceId: string; // EIP-165
  lsp2Schema: ERC725JSONSchema | null;
  decimals?: string;
}

const getSupportedStandardObject = (schemas: ERC725JSONSchema[]) => {
  try {
    const results = schemas.filter(schema => {
      return schema.name.startsWith('SupportedStandards:');
    });

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    return null;
  }
};

const lspTypeOptions: Record<
  Exclude<LSPType, LSPType.Unknown>,
  LspTypeOption
> = {
  [LSPType.LSP7DigitalAsset]: {
    interfaceId: INTERFACE_IDS.LSP7DigitalAsset,
    lsp2Schema: getSupportedStandardObject(lsp4Schema as ERC725JSONSchema[]),
  },
  [LSPType.LSP8IdentifiableDigitalAsset]: {
    interfaceId: INTERFACE_IDS.LSP8IdentifiableDigitalAsset,
    lsp2Schema: getSupportedStandardObject(lsp4Schema as ERC725JSONSchema[]),
  },
};

export type TokenInfo = {
  type: LSPType;
  address?: string;
  name?: string;
  symbol?: string;
  decimals?: string;
  balance?: number;
  label?: string;
  tokenId?: string;
  metadata?: Record<string, any>;
  baseURI?: string;
};

export const detectLSP = async (
  contractAddress: string,
  addressToCheck: string,
  lspType: Exclude<LSPType, LSPType.Unknown>,
  owned = false
): Promise<TokenInfo | undefined> => {
  if (
    lspType in
    {
      [LSPType.Unknown]: true,
    }
  ) {
    return undefined;
  }

  const provider = new ethers.providers.Web3Provider(window.lukso);

  // EIP-165 detection
  const contract = new ethers.Contract(
    contractAddress,
    eip165ABI.concat(erc20ABI) as any,
    provider
  );

  // Check if the contract implements the LSP interface ID
  let doesSupportInterface: boolean;
  try {
    doesSupportInterface = await contract.supportsInterface(
      lspTypeOptions[lspType].interfaceId
    );
    console.log(
      'doesSupportInterface',
      lspTypeOptions[lspType].interfaceId,
      doesSupportInterface
    );
  } catch (error) {
    doesSupportInterface = false;
  }
  if (!doesSupportInterface) {
    return undefined;
  }

  try {
    let currentDecimals = '0';
    let balance = owned ? 1 : 0;
    try {
      currentDecimals = await contract.decimals();
      if (currentDecimals !== '0') {
        const _balance = await contract
          .balanceOf(addressToCheck)
          .catch((e: any) => {
            console.error('error getting balance', e);
            return undefined;
          });
        balance = BigNumber.from(_balance).toNumber();
      }
    } catch (err) {
      console.error(err);
    }
    // ERC725 detection
    const erc725js = new ERC725(
      lsp3ProfileSchema.concat(
        lsp4Schema,
        [
          {
            name: 'LSP8TokenMetadataBaseURI',
            key: '0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843',
            keyType: 'Singleton',
            valueType: 'string', // note that LSP8 schema seems to have incorrect valueType type so we've modified it
            valueContent: 'URL', // note that LSP8 schema seems to have incorrect valueContent type so we've modified it
          },
        ],
        lsp9Schema
      ) as ERC725JSONSchema[],
      contractAddress,
      window.lukso,
      {
        ipfsGateway: constants.IPFS,
      }
    );

    let [
      { value: name },
      { value: symbol },
      { value: LSP4Metadata },
      { value: LSP8BaseURI },
    ] = await erc725js.fetchData([
      'LSP4TokenName',
      'LSP4TokenSymbol',
      'LSP4Metadata',
      'LSP8TokenMetadataBaseURI',
    ]);
    if (typeof name !== 'string') {
      try {
        name = (await contract.name().call()) as string;
      } catch (err) {
        name = '<undef>';
      }
    }
    if (typeof symbol !== 'string') {
      try {
        symbol = (await contract.symbol().call()) as string;
      } catch (err) {
        symbol = '<undef>';
      }
    }
    let shortType: string = lspType;
    switch (shortType) {
      case LSPType.LSP7DigitalAsset:
        shortType = 'LSP7';
        break;
      case LSPType.LSP8IdentifiableDigitalAsset:
        shortType = 'LSP8';
        break;
    }
    return {
      type: lspType,
      name,
      symbol,
      address: contractAddress,
      balance,
      decimals: currentDecimals,
      metadata: LSP4Metadata as Record<string, any>,
      baseURI: LSP8BaseURI as string,
      label: `${shortType} ${name} (sym) ${contractAddress.substring(
        0,
        10
      )}...`,
    };
  } catch (err) {
    console.error(contractAddress, lspType, err);
    return undefined;
  }
};
