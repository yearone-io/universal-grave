import { getNetwork } from '@/utils/utils';

export async function getImageFromIPFS(
  ipfsUrl: string,
  chainId: number
): Promise<string> {
  // Replace the 'ipfs://' prefix with the IPFS gateway URL
  const currentNetwork = getNetwork(chainId);
  const gatewayUrl = ipfsUrl.replace(
    'ipfs://',
    currentNetwork ? `${currentNetwork.ipfsGateway}/` : 'https://ipfs.io/ipfs/'
  );

  try {
    const response = await fetch(gatewayUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);

    return imageUrl;
  } catch (error) {
    console.error('Error fetching image from IPFS:', error);
    return '';
  }
}
