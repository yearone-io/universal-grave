import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js';
import { INTERFACE_IDS, LSP4_TOKEN_TYPES } from '@lukso/lsp-smart-contracts';
import {
  Contract,
  keccak256,
  toUtf8Bytes,
  getAddress,
  isAddress,
  zeroPadValue,
  stripZerosLeft,
  JsonRpcProvider,
  BrowserProvider,
} from 'ethers';
import { eip165ABI } from '@/abis/eip165ABI';
import { erc20ABI } from '@/abis/erc20ABI';
import lsp4Schema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';
import { lsp8IdentifiableDigitalAssetAbi } from '@lukso/lsp-smart-contracts/abi';
import { constants } from '@/app/constants';
import { getLuksoProvider } from '@/utils/provider';

export type TokenData = {
  readonly interface: GRAVE_ASSET_TYPES;
  readonly address: string;
  readonly tokenType?: number;
  readonly name?: string;
  readonly symbol?: string;
  readonly decimals?: string;
  readonly balance?: string | bigint;
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
  return keccak256(toUtf8Bytes(signature)).slice(0, 10); // First 4 bytes (8 characters + '0x')
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

async function getMinimalProxyImplementationAddress(bytecode: string) {
  // https://eips.ethereum.org/EIPS/eip-1167 Minimal Proxy Implementation
  const proxyPattern =
    '363d3d373d3d3d363d73[a-fA-F0-9]{40}5af43d82803e903d91602b57fd5bf3';
  const regex = new RegExp(proxyPattern);
  return regex.test(bytecode) ? '0x' + bytecode.slice(22, 62) : null;
}

async function getBeaconProxyImplementationAddress(
  provider: JsonRpcProvider | BrowserProvider,
  assetAddress: string
) {
  try {
    const hash = keccak256(toUtf8Bytes('eip1967.proxy.beacon'));
    const beaconSlot = zeroPadValue(
      '0x' + (BigInt(hash) - BigInt(1)).toString(16),
      32
    );
    const beaconAddressHex = await provider.getStorage(
      assetAddress,
      beaconSlot
    );
    const beaconAddress = getAddress(stripZerosLeft(beaconAddressHex));
    const beaconContract = new Contract(
      beaconAddress,
      ['function implementation() view returns (address)'],
      provider
    );
    const implementationAddress = await beaconContract.implementation();
    return implementationAddress;
  } catch (error) {
    return null;
  }
}

async function getTransparentProxyImplementationAddress(
  provider: JsonRpcProvider | BrowserProvider,
  proxyAddress: string
): Promise<string | null> {
  /** EIP-1967 implementation slot = bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1) */
  const IMPLEMENTATION_SLOT =
    '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
  try {
    // 1. Read the raw 32-byte word in the implementation slot
    const storageWord = await provider.getStorage(
      proxyAddress,
      IMPLEMENTATION_SLOT
    );

    // 2. Last 20 bytes → address
    const candidate = getAddress('0x' + storageWord.slice(26));

    // 3. Make sure it actually holds code
    const candidateCode = await provider.getCode(candidate);
    return candidateCode !== '0x' ? candidate : null;
  } catch {
    return null;
  }
}

async function getImplementationBytecode(
  provider: JsonRpcProvider | BrowserProvider,
  assetAddress: string
): Promise<string> {
  try {
    const proxyCode = await provider.getCode(assetAddress);
    console.log('[GRAVE DEBUG] Proxy code length:', proxyCode.length);

    const minimalProxy = await getMinimalProxyImplementationAddress(proxyCode);
    console.log('[GRAVE DEBUG] Minimal proxy implementation:', minimalProxy);

    const beaconProxy = await getBeaconProxyImplementationAddress(
      provider,
      assetAddress
    );
    console.log('[GRAVE DEBUG] Beacon proxy implementation:', beaconProxy);

    const transparentProxy = await getTransparentProxyImplementationAddress(
      provider,
      assetAddress
    );
    console.log(
      '[GRAVE DEBUG] Transparent proxy implementation:',
      transparentProxy
    );

    let implementationAddress: string | null =
      minimalProxy || beaconProxy || transparentProxy;

    console.log(
      '[GRAVE DEBUG] Final implementation address:',
      implementationAddress
    );

    return implementationAddress
      ? await provider.getCode(implementationAddress)
      : proxyCode;
  } catch (error) {
    console.error(
      '[GRAVE DEBUG] Error getting implementation bytecode:',
      error
    );
    return '';
  }
}
export const detectLSP = async (
  provider: JsonRpcProvider | BrowserProvider,
  assetAddress: string
): Promise<GRAVE_ASSET_TYPES> => {
  // fetch digital asset interface details
  console.log('[GRAVE DEBUG] detectLSP called for:', assetAddress);
  try {
    const lspAsset = new ERC725(
      lsp4Schema as ERC725JSONSchema[],
      assetAddress,
      getLuksoProvider()
    );

    const supportsLSP7 = await lspAsset.supportsInterface(
      INTERFACE_IDS.LSP7DigitalAsset
    );
    console.log('[GRAVE DEBUG] supportsInterface LSP7:', supportsLSP7);
    if (supportsLSP7) {
      return GRAVE_ASSET_TYPES.LSP7DigitalAsset;
    }

    const supportsLSP8 = await lspAsset.supportsInterface(
      INTERFACE_IDS.LSP8IdentifiableDigitalAsset
    );
    console.log('[GRAVE DEBUG] supportsInterface LSP8:', supportsLSP8);
    if (supportsLSP8) {
      return GRAVE_ASSET_TYPES.LSP8IdentifiableDigitalAsset;
    }

    console.log('[GRAVE DEBUG] Checking bytecode for proxy patterns...');
    const bytecode = await getImplementationBytecode(provider, assetAddress);
    console.log(
      '[GRAVE DEBUG] Implementation bytecode length:',
      bytecode.length
    );

    const hasLSP7Transfer = supportsFunction(bytecode, lsp7TransferSelector);
    console.log(
      '[GRAVE DEBUG] Bytecode has LSP7 transfer selector:',
      hasLSP7Transfer
    );
    if (hasLSP7Transfer) {
      return GRAVE_ASSET_TYPES.UnrecognisedLSP7DigitalAsset;
    }

    const hasLSP8Transfer = supportsFunction(bytecode, lsp8TransferSelector);
    console.log(
      '[GRAVE DEBUG] Bytecode has LSP8 transfer selector:',
      hasLSP8Transfer
    );
    if (hasLSP8Transfer) {
      return GRAVE_ASSET_TYPES.UnrecognisedLSP8IdentifiableDigitalAsset;
    }
  } catch (error) {
    console.error('[GRAVE DEBUG] Error detecting LSP asset interface:', error);
  }
  console.log('[GRAVE DEBUG] Asset unrecognised:', assetAddress);
  return GRAVE_ASSET_TYPES.Unrecognised;
};

export const getLSPAssetBasicInfo = async (
  provider: JsonRpcProvider | BrowserProvider,
  assetAddress: string,
  ownerAddress: string
): Promise<TokenData> => {
  console.log(
    '[GRAVE DEBUG] getLSPAssetBasicInfo called for:',
    assetAddress,
    'owner:',
    ownerAddress
  );
  const unrecognizedLsp = {
    address: assetAddress,
    name: 'unrecognised',
    metadata: {},
    interface: GRAVE_ASSET_TYPES.Unrecognised,
  };
  const lspInterface = await detectLSP(provider, assetAddress);
  console.log('[GRAVE DEBUG] Detected interface type:', lspInterface);
  if (lspInterface === GRAVE_ASSET_TYPES.Unrecognised) {
    console.log('[GRAVE DEBUG] Returning unrecognized asset');
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
    console.log('[GRAVE DEBUG] Fetching LSP4 metadata...');
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
    console.log('[GRAVE DEBUG] Metadata fetched:', {
      LSP4TokenType,
      name,
      symbol,
    });
  } catch (error) {
    console.error('[GRAVE DEBUG] Error getting metadata:', error);
    return unrecognizedLsp;
  }
  // fetch balance details
  try {
    const contract = new Contract(
      assetAddress,
      eip165ABI.concat(erc20ABI) as any,
      provider
    );
    console.log('[GRAVE DEBUG] Fetching decimals and balance...');
    decimals =
      lspInterface === GRAVE_ASSET_TYPES.LSP7DigitalAsset ||
      lspInterface === GRAVE_ASSET_TYPES.UnrecognisedLSP7DigitalAsset
        ? await contract.decimals()
        : 0;
    console.log('[GRAVE DEBUG] Decimals:', decimals);

    // Fetch balance for all LSP7 tokens (both divisible and non-divisible)
    if (
      lspInterface === GRAVE_ASSET_TYPES.LSP7DigitalAsset ||
      lspInterface === GRAVE_ASSET_TYPES.UnrecognisedLSP7DigitalAsset
    ) {
      balance = await contract.balanceOf(ownerAddress).catch((e: any) => {
        console.error('[GRAVE DEBUG] Error getting balance:', e);
        return undefined;
      });
      console.log('[GRAVE DEBUG] Balance:', balance);
    }
  } catch (err) {
    console.error(
      '[GRAVE DEBUG] Error in balance fetch section:',
      assetAddress,
      lspInterface,
      err
    );
    return unrecognizedLsp;
  }
  console.log('[GRAVE DEBUG] Final token data:', {
    interface: lspInterface,
    tokenType: LSP4TokenType,
    name,
    symbol,
    address: assetAddress,
    balance,
    decimals,
  });
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
  if (!address || !isAddress(address)) {
    // Handle invalid address
    return address;
  }

  // Convert to checksum address
  return getAddress(address);
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
  if (LSP4Metadata?.images?.[0]?.[0]?.url) {
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
  provider: JsonRpcProvider | BrowserProvider,
  asset: TokenData,
  assetOwner: string
): Promise<TokenData[]> {
  const contract = new Contract(
    asset.address as string,
    lsp8IdentifiableDigitalAssetAbi,
    provider
  );
  const tokenIds = await contract.tokenIdsOf(assetOwner);
  const nfts: TokenData[] = [];
  for (const tokenId of tokenIds) {
    if (asset.tokenType === LSP4_TOKEN_TYPES.COLLECTION) {
      try {
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
        }
        asset.image = image;
      } catch (e) {
        console.error('Error fetching metadata', e);
      }
    }
    nfts.push({ ...asset, tokenId: tokenId.toString() });
  }

  return nfts;
}

export const getEnoughDecimals = (value: number) => {
  if (value < 1 && value >= 0.01) {
    return 2;
  } else if (value < 0.01 && value >= 0.0001) {
    return 4;
  } else if (value < 0.0001 && value >= 0.000001) {
    return 6;
  } else if (value < 0.000001 && value >= 0.00000001) {
    return 8;
  } else if (value < 0.00000001 && value >= 0.0000000001) {
    return 10;
  } else if (value < 0.0000000001 && value >= 0.000000000001) {
    return 12;
  } else if (value < 0.000000000001 && value >= 0.00000000000001) {
    return 14;
  } else if (value < 0.00000000000001 && value >= 0.0000000000000001) {
    return 16;
  } else if (value < 0.0000000000000001 && value >= 0.000000000000000001) {
    return 18;
  }

  return 0;
};
