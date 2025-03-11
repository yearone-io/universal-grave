import { supportedNetworks } from '@/constants/supportedNetworks';

export const getNetwork = (chainId: number | string) => {
  if (!chainId) {
    throw new Error('Chain ID not provided');
  }
  const network = supportedNetworks[chainId];
  if (!network) {
    throw new Error('Network not supported');
  }
  return network;
};

export const formatAddress = (address: string | null) => {
  if (!address) return '0x';
  if (address.length < 10) return address; // '0x' is an address
  return `${address.slice(0, 5)}...${address.slice(-4)}`;
};

export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
};
