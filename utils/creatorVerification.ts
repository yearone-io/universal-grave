import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  getAddress,
  isAddress,
} from 'ethers';
import ERC725 from '@erc725/erc725.js';
import { readAddressMetadata, resolveIpfsUrl } from '@/utils/addressMetadata';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { constants } from '@/app/constants';

export type CreatorVerification = {
  address: string;
  verified: boolean;
  name?: string;
  profileImage?: string;
};

const LSP12_ISSUED_ASSETS_MAP_KEY_PREFIX = '0x74ac2555c10b9349e78f0000';
const LSP12_ISSUED_ASSETS_ARRAY_KEY =
  '0x7c8c3416d6cda87cd42c71ea1843df28ac4850354f988d55ee2eaa47b6dc05cd';

const DATA_READER_ABI = [
  'function getData(bytes32 key) view returns (bytes)',
  'function getData(bytes32[] keys) view returns (bytes[])',
  'function getDataBatch(bytes32[] keys) view returns (bytes[])',
];

const shouldLogDebug = (): boolean => {
  if (process.env.NEXT_PUBLIC_GRAVE_DEBUG === '1') return true;
  if (typeof window !== 'undefined') {
    try {
      return window.localStorage.getItem('grave_debug') === '1';
    } catch {
      return false;
    }
  }
  return false;
};

const debugLog = (...args: any[]) => {
  if (shouldLogDebug()) {
    console.log(...args);
  }
};

const debugError = (...args: any[]) => {
  if (shouldLogDebug()) {
    console.error(...args);
  }
};

const shouldRetryRpcError = (error: any): boolean => {
  const message = String(error?.message || '').toLowerCase();
  const code = error?.code;
  return (
    code === 'SERVER_ERROR' ||
    code === 'NETWORK_ERROR' ||
    code === 'TIMEOUT' ||
    code === -32005 ||
    message.includes('429') ||
    message.includes('too many requests') ||
    message.includes('rate limit') ||
    message.includes('timeout')
  );
};

const wait = (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

const withRetry = async <T>(
  fn: () => Promise<T>,
  label: string,
  attempts = 3
): Promise<T> => {
  let lastError: any;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const canRetry = shouldRetryRpcError(error) && attempt < attempts;
      if (!canRetry) {
        throw error;
      }
      const delayMs = 120 * 2 ** (attempt - 1);
      debugLog(
        `[GRAVE DEBUG][creators] retry ${attempt}/${attempts - 1} for ${label} after error:`,
        error?.message || error
      );
      await wait(delayMs);
    }
  }
  throw lastError;
};

const readDataSingle = async (
  contract: Contract,
  key: string
): Promise<string> => {
  try {
    const value = await withRetry(
      () => contract['getData(bytes32)'](key),
      `getData(bytes32:${key})`
    );
    debugLog('[GRAVE DEBUG][creators] readDataSingle via getData', {
      key,
      bytes: value && value !== '0x' ? (value.length - 2) / 2 : 0,
    });
    return value || '0x';
  } catch (singleError: any) {
    debugLog('[GRAVE DEBUG][creators] getData(bytes32) failed', {
      key,
      message: singleError?.message || String(singleError),
      code: singleError?.code,
    });
    try {
      const values = await withRetry(
        () => contract['getData(bytes32[])']([key]),
        `getData(bytes32[])(${key})`
      );
      debugLog('[GRAVE DEBUG][creators] readDataSingle via getData(bytes32[])', {
        key,
        bytes:
          values?.[0] && values[0] !== '0x' ? (values[0].length - 2) / 2 : 0,
      });
      return values?.[0] || '0x';
    } catch (batchError: any) {
      debugLog('[GRAVE DEBUG][creators] readDataSingle failed', {
        key,
        message: batchError?.message || String(batchError),
        code: batchError?.code,
      });
      return '0x';
    }
  }
};

const readDataBatch = async (
  contract: Contract,
  keys: string[]
): Promise<string[]> => {
  if (!keys.length) return [];
  try {
    const values = await withRetry(
      () => contract['getDataBatch(bytes32[])'](keys),
      `getDataBatch(${keys.length})`
    );
    debugLog('[GRAVE DEBUG][creators] readDataBatch via getDataBatch', {
      keyCount: keys.length,
    });
    return (values || []).map((value: string) => value || '0x');
  } catch (batchError: any) {
    debugLog('[GRAVE DEBUG][creators] getDataBatch(bytes32[]) failed', {
      keyCount: keys.length,
      message: batchError?.message || String(batchError),
      code: batchError?.code,
    });
    try {
      const values = await withRetry(
        () => contract['getData(bytes32[])'](keys),
        `getData(bytes32[])(${keys.length})`
      );
      debugLog(
        '[GRAVE DEBUG][creators] readDataBatch via getData(bytes32[])',
        {
          keyCount: keys.length,
        }
      );
      return (values || []).map((value: string) => value || '0x');
    } catch (legacyBatchError: any) {
      debugLog('[GRAVE DEBUG][creators] getData(bytes32[]) failed', {
        keyCount: keys.length,
        message: legacyBatchError?.message || String(legacyBatchError),
        code: legacyBatchError?.code,
      });
      debugLog('[GRAVE DEBUG][creators] readDataBatch via per-key fallback', {
        keyCount: keys.length,
      });
      const values = await Promise.all(
        keys.map(key => readDataSingle(contract, key))
      );
      return values;
    }
  }
};

const decodeLsp2Length = (raw: string | null): bigint | null => {
  if (!raw || raw === '0x') return null;
  const hex = raw.slice(2);
  if (hex.length !== 32 && hex.length !== 64) return null;
  return BigInt('0x' + hex);
};

const decodeMapIndex = (raw: string | null): bigint | null => {
  if (!raw || raw === '0x') return null;
  const hex = raw.slice(2);
  if (hex.length !== 40 && hex.length !== 72) return null;
  return BigInt('0x' + hex.slice(8));
};

const parseArrayLength = (raw: string | null): bigint => {
  if (!raw || raw === '0x') return 0n;
  try {
    return BigInt(raw);
  } catch {
    return 0n;
  }
};

export async function getAssetCreators(
  provider: JsonRpcProvider | BrowserProvider,
  assetAddress: string,
  maxItems = 10
): Promise<string[]> {
  try {
    const contract = new Contract(assetAddress, DATA_READER_ABI, provider);

    const baseArrayKey = ERC725.encodeKeyName('LSP4Creators[]');
    const lengthRaw = await readDataSingle(contract, baseArrayKey);
    const length = parseArrayLength(lengthRaw);
    debugLog('[GRAVE DEBUG][creators] LSP4Creators[] length', {
      assetAddress,
      baseArrayKey,
      lengthRaw,
      length: length.toString(),
    });

    if (length <= 0n) return [];

    const count = length > BigInt(maxItems) ? BigInt(maxItems) : length;
    const keyPrefix = baseArrayKey.slice(0, 34);
    const itemKeys: string[] = [];
    for (let i = 0n; i < count; i++) {
      itemKeys.push(keyPrefix + i.toString(16).padStart(32, '0'));
    }

    const values = await readDataBatch(contract, itemKeys);
    const seen = new Set<string>();
    const creators: string[] = [];
    for (const value of values) {
      if (!value || value === '0x') continue;
      let decoded = '';
      // Some assets return non-standard byte length for creators entries.
      // Use the last 20 bytes as the address payload when present.
      const raw = value.replace(/^0x/, '');
      if (raw.length >= 40) {
        decoded = `0x${raw.slice(-40)}`;
      }
      if (!decoded || !isAddress(decoded)) continue;
      const normalized = getAddress(decoded);
      const lower = normalized.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      creators.push(normalized);
    }
    debugLog('[GRAVE DEBUG][creators] decoded creators', {
      assetAddress,
      requestedItems: itemKeys.length,
      returnedItems: values.length,
      creators,
      rawByteSizes: values.map(value =>
        value && value !== '0x' ? (value.length - 2) / 2 : 0
      ),
    });

    return creators;
  } catch (error: any) {
    debugError('[GRAVE DEBUG][creators] getAssetCreators failed', {
      assetAddress,
      message: error?.message || String(error),
      code: error?.code,
    });
    return [];
  }
}

async function fetchCreatorProfile(
  creatorAddress: string,
  chainId: number
): Promise<{ name?: string; profileImage?: string }> {
  try {
    const metadata = await readAddressMetadata(creatorAddress, chainId);

    if (metadata.kind === 'unknown' || !metadata.profile) {
      return {};
    }

    const network = supportedNetworks[chainId.toString()];
    const ipfsGateway = network?.ipfsGateway || constants.IPFS;

    const name = metadata.profile.name;
    let profileImage: string | undefined;

    const profileImageUrl = metadata.profile.profileImage?.[0]?.url;
    if (profileImageUrl) {
      profileImage = resolveIpfsUrl(profileImageUrl, ipfsGateway);
    }

    return { name, profileImage };
  } catch {
    return {};
  }
}

export async function verifyAssetCreators(
  provider: JsonRpcProvider | BrowserProvider,
  assetAddress: string,
  creators: string[],
  chainId: number
): Promise<CreatorVerification[]> {
  const verification: CreatorVerification[] = [];

  for (const creator of creators) {
    const mapKey =
      LSP12_ISSUED_ASSETS_MAP_KEY_PREFIX + assetAddress.toLowerCase().slice(2);
    let mapValue: string | null = null;
    let issuedLengthRaw: string | null = null;

    try {
      const creatorContract = new Contract(creator, DATA_READER_ABI, provider);
      const values = await readDataBatch(creatorContract, [
        mapKey,
        LSP12_ISSUED_ASSETS_ARRAY_KEY,
      ]);
      mapValue = values?.[0] || null;
      issuedLengthRaw = values?.[1] || null;
    } catch {
      verification.push({ address: creator, verified: false });
      continue;
    }

    const index = decodeMapIndex(mapValue);
    const issuedLength = decodeLsp2Length(issuedLengthRaw);
    const verified =
      index !== null && issuedLength !== null && index >= 0n && index < issuedLength;
    debugLog('[GRAVE DEBUG][creators] verify creator', {
      assetAddress,
      creator,
      mapKey,
      mapValue,
      issuedLengthRaw,
      index: index?.toString(),
      issuedLength: issuedLength?.toString(),
      verified,
    });

    // Fetch profile data
    const profile = await fetchCreatorProfile(creator, chainId);

    verification.push({
      address: creator,
      verified,
      name: profile.name,
      profileImage: profile.profileImage,
    });
  }

  return verification;
}

export async function getAssetCreatorVerification(
  provider: JsonRpcProvider | BrowserProvider,
  assetAddress: string,
  chainId: number
): Promise<CreatorVerification[]> {
  const creators = await getAssetCreators(provider, assetAddress);
  if (creators.length === 0) return [];
  return verifyAssetCreators(provider, assetAddress, creators, chainId);
}
