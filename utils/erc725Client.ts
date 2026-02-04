import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js';
import { BrowserProvider, JsonRpcProvider } from 'ethers';
import {
  getNetworkConfig,
  supportedNetworks,
} from '@/constants/supportedNetworks';

type ProviderLike = BrowserProvider | JsonRpcProvider | any;

const providerCache = new Map<string, JsonRpcProvider>();
const eip1193Cache = new Map<string, { request: (p: any) => Promise<any> }>();

const getDefaultRpcUrl = (): string => {
  try {
    const networkConfig = getNetworkConfig(
      process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'mainnet'
    );
    return networkConfig.rpcUrl;
  } catch {
    return supportedNetworks['42']?.rpcUrl || '';
  }
};

const getRpcUrl = (chainId?: number, rpcUrl?: string): string => {
  if (rpcUrl) return rpcUrl;
  if (chainId && supportedNetworks[chainId.toString()]) {
    return supportedNetworks[chainId.toString()].rpcUrl;
  }
  return getDefaultRpcUrl();
};

const getReadProvider = (chainId?: number, rpcUrl?: string) => {
  const url = getRpcUrl(chainId, rpcUrl);
  if (!providerCache.has(url)) {
    providerCache.set(url, new JsonRpcProvider(url));
  }
  return providerCache.get(url)!;
};

const toEip1193 = (provider?: ProviderLike, chainId?: number, rpcUrl?: string) => {
  if (!provider) {
    const url = getRpcUrl(chainId, rpcUrl);
    if (eip1193Cache.has(url)) return eip1193Cache.get(url)!;
    const rpc = getReadProvider(chainId, rpcUrl);
    const wrapper = {
      request: async (payload: any) => {
        const method = payload?.method;
        const params = payload?.params ?? [];
        return rpc.send(method, params);
      },
    };
    eip1193Cache.set(url, wrapper);
    return wrapper;
  }

  const base = provider instanceof BrowserProvider ? provider.provider : provider;
  if (typeof base?.request === 'function') {
    return {
      request: async (payload: any) =>
        base.request({ method: payload?.method, params: payload?.params ?? [] }),
    };
  }
  if (typeof base?.send === 'function') {
    return {
      request: async (payload: any) =>
        base.send(payload?.method, payload?.params ?? []),
    };
  }

  return base;
};

export const getErc725Read = (
  schema: ERC725JSONSchema[],
  address: string,
  opts?: {
    provider?: ProviderLike;
    chainId?: number;
    rpcUrl?: string;
    erc725Options?: Record<string, any>;
  }
) => {
  const provider = toEip1193(opts?.provider, opts?.chainId, opts?.rpcUrl);
  return new ERC725(schema, address, provider, opts?.erc725Options);
};

export const isZeroDataError = (error: any) => {
  const msg = error?.message?.toLowerCase?.() || '';
  return (
    error?.name === 'AbiDecodingZeroDataError' ||
    msg.includes('cannot decode zero data') ||
    msg.includes('decode zero data') ||
    msg.includes('zero data')
  );
};

export const getDataSafe = async (
  erc725: ERC725,
  keyOrSchema: any
) => {
  try {
    return await erc725.getData(keyOrSchema);
  } catch (error) {
    if (isZeroDataError(error)) {
      return null;
    }
    throw error;
  }
};

export const fetchDataSafe = async (
  erc725: ERC725,
  keyOrSchema: any
) => {
  try {
    return await erc725.fetchData(keyOrSchema);
  } catch (error) {
    if (isZeroDataError(error)) {
      return null;
    }
    throw error;
  }
};

export const supportsInterfaceSafe = async (
  erc725: ERC725,
  interfaceId: string
) => {
  try {
    const res = await erc725.supportsInterface(interfaceId);
    return !!res;
  } catch (error) {
    if (isZeroDataError(error)) {
      return false;
    }
    throw error;
  }
};
