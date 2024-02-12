import { ethers } from 'ethers';
import { getNetworkConfig } from '@/constants/networks';

const UNKNOWN_LUKSO_NETWORK = '0x2a';

export const getProvider = () => {
  if (window.lukso && window.lukso.chainId === UNKNOWN_LUKSO_NETWORK) {
    return new ethers.providers.JsonRpcProvider(
      getNetworkConfig(process.env.NEXT_PUBLIC_DEFAULT_NETWORK!).rpcUrl
    );
  }

  return new ethers.providers.Web3Provider(window.lukso || window.ethereum);
};

export const getLuksoProvider = () => {
  if (window.lukso && window.lukso.chainId === UNKNOWN_LUKSO_NETWORK) {
    return getNetworkConfig(process.env.NEXT_PUBLIC_DEFAULT_NETWORK!).rpcUrl;
  }
  return window.lukso || window.ethereum;
};
