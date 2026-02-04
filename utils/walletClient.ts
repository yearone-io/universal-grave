import { BrowserProvider } from 'ethers';

let cachedProvider: BrowserProvider | null = null;

export const getWalletProvider = () => {
  if (typeof window === 'undefined' || !window.lukso) {
    throw new Error('Wallet provider not available');
  }
  if (!cachedProvider || (cachedProvider as any).provider !== window.lukso) {
    cachedProvider = new BrowserProvider(window.lukso);
  }
  return cachedProvider;
};

export const getWalletSigner = async () => {
  const provider = getWalletProvider();
  return provider.getSigner();
};

export const assertWalletNetwork = async (expectedChainId: number) => {
  const provider = getWalletProvider();
  const network = await provider.getNetwork();
  const currentChainId = Number(network.chainId);
  if (currentChainId !== expectedChainId) {
    throw new Error(
      `Wrong network. Please switch to chain ${expectedChainId} (current: ${currentChainId}).`
    );
  }
};

export const getWalletAddress = async () => {
  const signer = await getWalletSigner();
  return signer.getAddress();
};
