import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js';
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import lsp4DigitalAssetSchema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';
import { SupportedStandards } from '@lukso/lsp-smart-contracts';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { constants } from '@/app/constants';
import { fetchDataSafe, getDataSafe } from '@/utils/erc725Client';

export interface LSP3ProfileData {
  name?: string;
  description?: string;
  links?: Array<{ title: string; url: string }>;
  profileImage?: Array<{ url: string }>;
  backgroundImage?: Array<{ url: string }>;
}

export interface LSP4Metadata {
  name?: string;
  description?: string;
  links?: Array<{ title: string; url: string }>;
  images?: Array<Array<{ url: string }>>;
  icon?: Array<{ url: string }>;
}

export type AddressMetadataKind = 'profile' | 'asset' | 'multi' | 'unknown';

export interface AddressMetadata {
  address: string;
  kind: AddressMetadataKind;
  profile?: LSP3ProfileData;
  asset?: LSP4Metadata;
  tokenName?: string;
}

const combinedSchema = [
  ...(lsp3ProfileSchema as ERC725JSONSchema[]),
  ...(lsp4DigitalAssetSchema as ERC725JSONSchema[]),
];

const metadataCache = new Map<string, AddressMetadata>();
const inFlight = new Map<string, Promise<AddressMetadata>>();

const getNetworkConfig = (chainId?: number) => {
  if (!chainId) return null;
  return supportedNetworks[chainId.toString()] || null;
};

const buildCacheKey = (address: string, chainId?: number) =>
  `${chainId ?? 'unknown'}:${address.toLowerCase()}`;

export const resolveIpfsUrl = (url: string, ipfsGateway?: string): string => {
  if (!url) return '';
  const gateway = ipfsGateway || constants.IPFS;
  if (url.startsWith('ipfs://')) {
    return `${gateway}/${url.replace('ipfs://', '')}`;
  }
  if (url.startsWith('/ipfs/')) {
    return `${gateway}${url}`;
  }
  return url;
};

export const readAddressMetadata = async (
  address: string,
  chainId?: number
): Promise<AddressMetadata> => {
  const cacheKey = buildCacheKey(address, chainId);
  const cached = metadataCache.get(cacheKey);
  if (cached) return cached;

  const inflight = inFlight.get(cacheKey);
  if (inflight) return inflight;

  const promise = (async () => {
    const network = getNetworkConfig(chainId);
    if (!network?.rpcUrl) {
      const emptyResult: AddressMetadata = { address, kind: 'unknown' };
      metadataCache.set(cacheKey, emptyResult);
      return emptyResult;
    }

    const erc725 = new ERC725(combinedSchema, address, network.rpcUrl, {
      ipfsGateway: network.ipfsGateway || constants.IPFS,
    });

    let metadata: AddressMetadata = { address, kind: 'unknown' };
    try {
      const supportData = await getDataSafe(erc725, [
        'SupportedStandards:LSP3Profile',
        'SupportedStandards:LSP4DigitalAsset',
        'LSP4TokenName',
      ]);

      const hasSupportData = Array.isArray(supportData);
      const supportsLSP3 =
        supportData?.[0]?.value === SupportedStandards.LSP3Profile.value;
      const supportsLSP4 =
        supportData?.[1]?.value === SupportedStandards.LSP4DigitalAsset.value;
      const tokenName =
        typeof supportData?.[2]?.value === 'string'
          ? (supportData?.[2]?.value as string)
          : undefined;

      const shouldCheckLSP3 = supportsLSP3 || !hasSupportData;
      const shouldCheckLSP4 = supportsLSP4 || !hasSupportData;

      if (shouldCheckLSP3) {
        const profileData = await fetchDataSafe(erc725, 'LSP3Profile');
        const profileValue = profileData?.value as
          | { LSP3Profile?: LSP3ProfileData }
          | undefined;
        if (profileValue?.LSP3Profile) {
          metadata.profile = profileValue.LSP3Profile;
        }
      }

      if (shouldCheckLSP4) {
        const assetData = await fetchDataSafe(erc725, 'LSP4Metadata');
        const assetValue = assetData?.value as
          | { LSP4Metadata?: LSP4Metadata }
          | undefined;
        if (assetValue?.LSP4Metadata) {
          metadata.asset = assetValue.LSP4Metadata;
        }
        metadata.tokenName = tokenName;
      }

      if (metadata.profile && metadata.asset) {
        metadata.kind = 'multi';
      } else if (metadata.profile) {
        metadata.kind = 'profile';
      } else if (metadata.asset) {
        metadata.kind = 'asset';
      }
    } catch (error) {
      metadata = { address, kind: 'unknown' };
    }

    metadataCache.set(cacheKey, metadata);
    return metadata;
  })();

  inFlight.set(cacheKey, promise);
  return promise.finally(() => {
    inFlight.delete(cacheKey);
  });
};
