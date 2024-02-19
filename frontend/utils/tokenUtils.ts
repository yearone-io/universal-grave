import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js';
import { INTERFACE_IDS, LSP4_TOKEN_TYPES } from '@lukso/lsp-smart-contracts';
import { ethers } from 'ethers';
import { eip165ABI } from '@/abis/eip165ABI';
import { erc20ABI } from '@/abis/erc20ABI';
import lsp4Schema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';
import { constants } from '@/app/constants';
import { getLuksoProvider, getProvider } from '@/utils/provider';

export const getChecksumAddress = (address: string | null) => {
  // Check if the address is valid
  if (!address || !ethers.utils.isAddress(address)) {
    // Handle invalid address
    return address;
  }

  // Convert to checksum address
  return ethers.utils.getAddress(address);
};

export const formatAddress = (address: string | null) => {
  if (!address) return '0x';
  if (address.length < 10) return address; // '0x' is an address
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
  shortName: string;
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
    shortName: 'LSP7',
  },
  [LSPType.LSP8IdentifiableDigitalAsset]: {
    interfaceId: INTERFACE_IDS.LSP8IdentifiableDigitalAsset,
    lsp2Schema: getSupportedStandardObject(lsp4Schema as ERC725JSONSchema[]),
    shortName: 'LSP8',
  },
};

export type TokenInfo = {
  interface: string;
  address?: string;
  name?: string;
  symbol?: string;
  decimals?: string;
  balance?: number;
  label?: string;
  tokenId?: string;
};

export const detectLSP = async (
  assetAddress: string
): Promise<string | null> => {
  // fetch digital asset interface details
  try {
    const contract = new ethers.Contract(
      assetAddress,
      eip165ABI.concat(erc20ABI) as any,
      getProvider()
    );
    const isLSP7 = await contract.supportsInterface(
      INTERFACE_IDS.LSP7DigitalAsset
    );
    if (isLSP7) {
      return LSPType.LSP7DigitalAsset;
    }
    const isLSP8 = await contract.supportsInterface(
      INTERFACE_IDS.LSP8IdentifiableDigitalAsset
    );
    if (isLSP8) {
      return LSPType.LSP8IdentifiableDigitalAsset;
    }
    return null;
  } catch (error) {
    console.error('error detecting LSP asset interface', error);
    return null;
  }
};

export const getLSPAssetBasicInfo = async (
  assetAddress: string,
  ownerAddress: string
): Promise<TokenInfo> => {
  const unrecognizedLsp = {
    type: LSPType.Unknown,
    address: assetAddress,
    name: 'unrecognised',
    metadata: {},
    interface: '',
  };
  const lspType = await detectLSP(assetAddress);
  if (!lspType) {
    return unrecognizedLsp;
  }
  let LSP4TokenType, LSP4Metadata, name, symbol;
  let balance, decimals;

  // fetch metadata details
  try {
    const erc725js = new ERC725(
      lsp4Schema as ERC725JSONSchema[],
      assetAddress,
      getLuksoProvider(),
      {
        ipfsGateway: constants.IPFS,
      }
    );
    [{ value: LSP4TokenType }, { value: name }, { value: symbol }] =
      await erc725js.fetchData([
        'LSP4TokenType',
        'LSP4TokenName',
        'LSP4TokenSymbol',
      ]);
    console.log('LSP4TokenType', LSP4TokenType);
  } catch (error) {
    console.error('error getting metadata', error);
    return unrecognizedLsp;
  }
  // fetch balance details
  try {
    const contract = new ethers.Contract(
      assetAddress,
      eip165ABI.concat(erc20ABI) as any,
      getProvider()
    );
    decimals =
      lspType === LSPType.LSP7DigitalAsset ? await contract.decimals() : 0;
    if (decimals !== '0') {
      const _balance = await contract
        .balanceOf(ownerAddress)
        .catch((e: any) => {
          console.error('error getting balance', e);
          return undefined;
        });
      console.log('balance', _balance);
      balance = _balance
        ? parseFloat(ethers.utils.formatUnits(_balance, decimals)).toFixed(
            LSP4TokenType === LSP4_TOKEN_TYPES.TOKEN ? 4 : 0
          )
        : 0;
    }
  } catch (err) {
    console.error(assetAddress, lspType, err);
    return unrecognizedLsp;
  }
  return {
    interface: lspType,
    name: name as string,
    symbol: symbol as string,
    address: assetAddress,
    balance,
    decimals,
    label: `${
      lspType ? lspTypeOptions[lspType].shortName : ''
    } ${name} (sym) ${formatAddress(assetAddress)}`,
  };
};
