import { ethers } from 'ethers';
import { getNetworkConfig } from '@/constants/networks';

const UNKNOWN_LUKSO_NETWORK = '0x2a';

export const getProvider = () => {
  const luksoProvider = getLuksoProvider();
  if (typeof luksoProvider === 'string') {
    return new ethers.providers.JsonRpcProvider(luksoProvider);
  }
  return new ethers.providers.Web3Provider(luksoProvider);
};

export const getLuksoProvider = () => {
  const rpcUrl = getNetworkConfig(
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK!
  ).rpcUrl;
  if (window.lukso && window.lukso.chainId === UNKNOWN_LUKSO_NETWORK) {
    return rpcUrl;
  }
  if (window.lukso) {
    return window.lukso;
  }
  return rpcUrl;
};
