import { BrowserProvider, JsonRpcProvider } from 'ethers';
import { getNetworkConfig } from '@/constants/networks';
import { NetworkConfig } from '@/constants/supportedNetworks';

export const getProvider = (networkConfig: NetworkConfig) => {
  const providerNetworkParams = {
    name: networkConfig.name,
    chainId: networkConfig.chainId,
  };
  const luksoProvider = getLuksoProvider(networkConfig);
  if (typeof luksoProvider === 'string') {
    return new JsonRpcProvider(
      luksoProvider,
      providerNetworkParams
    );
  }
  return new BrowserProvider(
    luksoProvider,
    providerNetworkParams
  );
};

export const getLuksoProvider = (networkConfig: NetworkConfig) => {
  const rpcUrl = networkConfig.rpcUrl;
  if (window.lukso && Number(window.lukso.chainId) !== networkConfig.chainId) {
    //if extension is connected to a different network than the app then default to app's rpc url
    //we could instead prompt user to change networks but this is mostly used for viewing data and not interactions
    return rpcUrl;
  }
  if (window.lukso) {
    return window.lukso;
  }
  return rpcUrl;
};
