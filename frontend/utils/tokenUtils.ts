import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js';
import { INTERFACE_IDS, LSP4_TOKEN_TYPES } from '@lukso/lsp-smart-contracts';
import { ethers } from 'ethers';
import { eip165ABI } from '@/abis/eip165ABI';
import { erc20ABI } from '@/abis/erc20ABI';
import lsp4Schema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';
import LSP8IdentifiableDigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP8IdentifiableDigitalAsset.json';
import { constants } from '@/app/constants';
import { getLuksoProvider, getProvider } from '@/utils/provider';

export type TokenData = {
  readonly interface: GRAVE_ASSET_TYPES;
  readonly address: string;
  readonly tokenType?: number;
  readonly name?: string;
  readonly symbol?: string;
  readonly decimals?: string;
  readonly balance?: string;
  readonly tokenId?: string;
  metadata?: Record<string, any>;
  image?: string;
};

export enum GRAVE_ASSET_TYPES {
  LSP7DigitalAsset,
  LSP8IdentifiableDigitalAsset,
  UnrecognisedLSP7DigitalAsset,
  UnrecognisedLSP8IdentifiableDigitalAsset,
  Unrecognised,
}

function computeSelector(signature: string): string {
  return ethers.utils
    .keccak256(ethers.utils.toUtf8Bytes(signature))
    .slice(0, 10); // First 4 bytes (8 characters + '0x')
}

function supportsFunction(bytecode: string, selector: string): boolean {
  return bytecode.includes(selector.slice(2)); // Remove '0x' when searching in bytecode
}

const lsp7TransferSelector = computeSelector(
  'transfer(address,address,uint256,bool,bytes)'
);
const lsp8TransferSelector = computeSelector(
  'transfer(address,address,bytes32,bool,bytes)'
);

export const detectLSP = async (
  assetAddress: string
): Promise<GRAVE_ASSET_TYPES> => {
  // fetch digital asset interface details
  try {
    const lspAsset = new ERC725(
      lsp4Schema as ERC725JSONSchema[],
      assetAddress,
      getLuksoProvider()
    );
    if (await lspAsset.supportsInterface(INTERFACE_IDS.LSP7DigitalAsset)) {
      return GRAVE_ASSET_TYPES.LSP7DigitalAsset;
    }
    if (
      await lspAsset.supportsInterface(
        INTERFACE_IDS.LSP8IdentifiableDigitalAsset
      )
    ) {
      return GRAVE_ASSET_TYPES.LSP8IdentifiableDigitalAsset;
    }

    const bytecode = await getProvider().getCode(assetAddress);
    if (supportsFunction(bytecode, lsp7TransferSelector)) {
      return GRAVE_ASSET_TYPES.UnrecognisedLSP7DigitalAsset;
    }
    if (supportsFunction(bytecode, lsp8TransferSelector)) {
      return GRAVE_ASSET_TYPES.UnrecognisedLSP8IdentifiableDigitalAsset;
    }
  } catch (error) {
    console.error('error detecting LSP asset interface', error);
  }

  return GRAVE_ASSET_TYPES.Unrecognised;
};

export const getLSPAssetBasicInfo = async (
  assetAddress: string,
  ownerAddress: string
): Promise<TokenData> => {
  const unrecognizedLsp = {
    address: assetAddress,
    name: 'unrecognised',
    metadata: {},
    interface: GRAVE_ASSET_TYPES.Unrecognised,
  };
  const lspInterface = await detectLSP(assetAddress);
  if (lspInterface === GRAVE_ASSET_TYPES.Unrecognised) {
    return unrecognizedLsp;
  }
  let LSP4TokenType: number, name: string, symbol: string, metadata: any;
  let balance: string = '0',
    decimals;

  // fetch metadata details
  try {
    const lspAsset = new ERC725(
      lsp4Schema as ERC725JSONSchema[],
      assetAddress,
      getLuksoProvider(),
      {
        ipfsGateway: constants.IPFS,
        gas: 20_000_000,
      }
    );
    const assetFetchedData = await lspAsset.fetchData([
      'LSP4TokenType',
      'LSP4TokenName',
      'LSP4TokenSymbol',
      'LSP4Metadata',
    ]);
    LSP4TokenType = Number(assetFetchedData[0].value);
    name = String(assetFetchedData[1].value);
    symbol = String(assetFetchedData[2].value);
    metadata = assetFetchedData[3].value;
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
      lspInterface ===
      (GRAVE_ASSET_TYPES.LSP7DigitalAsset ||
        GRAVE_ASSET_TYPES.UnrecognisedLSP7DigitalAsset)
        ? await contract.decimals()
        : 0;
    if (decimals !== '0') {
      const _balance = await contract
        .balanceOf(ownerAddress)
        .catch((e: any) => {
          console.error('error getting balance', e);
          return undefined;
        });
      balance = _balance
        ? parseFloat(ethers.utils.formatUnits(_balance, decimals)).toFixed(
            LSP4TokenType === LSP4_TOKEN_TYPES.TOKEN ? 4 : 0
          )
        : '0';
    }
  } catch (err) {
    console.error(assetAddress, lspInterface, err);
    return unrecognizedLsp;
  }
  return {
    interface: lspInterface,
    tokenType: LSP4TokenType,
    name: name,
    symbol: symbol,
    address: assetAddress,
    metadata,
    balance,
    decimals,
  };
};

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

export const getTokenIconURL = (LSP4Metadata?: any) => {
  if (LSP4Metadata?.icon?.[0]?.url) {
    const url = LSP4Metadata.icon?.[0]?.url;
    if (url.startsWith('ipfs://')) {
      return `${constants.IPFS_GATEWAY}${url.slice(7)}`;
    } else if (url.startsWith('data:image/')) {
      return url;
    }
  } else if (LSP4Metadata?.images?.[0]?.[0]?.url) {
    const url = LSP4Metadata.images?.[0]?.[0]?.url;
    if (url.startsWith('ipfs://')) {
      return `${constants.IPFS_GATEWAY}${url.slice(7)}`;
    } else if (url.startsWith('data:image/')) {
      return url;
    }
  }
  return null;
};

export const getTokenImageURL = (LSP4Metadata: any) => {
  if (LSP4Metadata.images?.[0]?.[0]?.url) {
    const url = LSP4Metadata.images?.[0]?.[0]?.url;
    if (url.startsWith('ipfs://')) {
      return `${constants.IPFS_GATEWAY}${url.slice(7)}`;
    } else if (url.startsWith('data:image/')) {
      return url;
    }
  }
  return null;
};

export const parseDataURI = (dataUri: string) => {
  // Step 1: Remove the prefix to get the JSON string
  // We split the string by the first comma and take the second part, which is the actual JSON
  const jsonString = dataUri.replace(
    'data:application/json;charset=UTF-8,',
    ''
  );
  // Step 2: Parse the JSON string into an object
  try {
    const jsonObj = JSON.parse(jsonString);
    return jsonObj;
  } catch (e) {
    console.error('Error parsing JSON', e);
    return {};
  }
};

export async function processLSP8Asset(
  asset: TokenData,
  assetOwner: string
): Promise<TokenData[]> {
  const contract = new ethers.Contract(
    asset.address as string,
    LSP8IdentifiableDigitalAsset.abi,
    getProvider()
  );
  const tokenIds = await contract.tokenIdsOf(assetOwner);
  const nfts: TokenData[] = [];

  for (const tokenId of tokenIds) {
    if (asset.tokenType === LSP4_TOKEN_TYPES.COLLECTION) {
      const tokenMetadata = await contract.getDataForTokenId(
        tokenId,
        ERC725.encodeKeyName('LSP4Metadata')
      );
      const decodedMetadata = ERC725.decodeData(
        [{ value: tokenMetadata, keyName: 'LSP4Metadata' }],
        [
          {
            name: 'LSP4Metadata',
            key: ERC725.encodeKeyName('LSP4Metadata'),
            keyType: 'Singleton',
            valueType: 'bytes',
            valueContent: 'VerifiableURI',
          },
        ]
      );

      let image;
      if (decodedMetadata[0]?.value?.url) {
        const parsedMetadata = parseDataURI(decodedMetadata[0].value.url);
        image = getTokenImageURL(parsedMetadata.LSP4Metadata);
        console.log('image', image);
      }
      asset.image = image;
    }
    nfts.push({ ...asset, tokenId: tokenId.toString() });
  }

  return nfts;
}
