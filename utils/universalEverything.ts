import { supportedNetworks } from '@/constants/supportedNetworks';

export type UniversalEverythingEntity = 'profile' | 'asset';

export const getUniversalEverythingUrl = (
  chainId: number | undefined,
  entity: UniversalEverythingEntity,
  address: string
): string => {
  const network = chainId ? supportedNetworks[chainId.toString()] : undefined;
  const baseUrl = network?.universalEverythingBaseUrl ||
    'https://universaleverything.io';
  const path = entity === 'profile' ? `/${address}` : `/asset/${address}`;
  const networkParam = network?.universalEverythingNetwork;
  return networkParam ? `${baseUrl}${path}?network=${networkParam}` : `${baseUrl}${path}`;
};
