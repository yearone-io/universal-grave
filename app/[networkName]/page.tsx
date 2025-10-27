import { Metadata } from 'next';
import Landing from '@/components/Landing';
import { getNetworkByName } from '@/constants/supportedNetworks';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'GRAVE',
  description: 'A cemetery for unwanted digital assets',
};

export default function NetworkLandingPage({
  params,
}: {
  params: { networkName: string };
}) {
  const network = getNetworkByName(params.networkName);

  if (!network) {
    notFound();
  }

  return <Landing networkName={params.networkName} />;
}
