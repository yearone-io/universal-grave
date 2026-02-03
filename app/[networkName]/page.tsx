import { Metadata } from 'next';
import Landing from '@/components/Landing';
import { getNetworkByName } from '@/constants/supportedNetworks';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'GRAVE',
  description: 'A cemetery for unwanted digital assets',
};

export default async function NetworkLandingPage({
  params,
}: {
  params: Promise<{ networkName: string }>;
}) {
  const { networkName } = await params;
  const network = getNetworkByName(networkName);

  if (!network) {
    notFound();
  }

  return <Landing networkName={networkName} />;
}
