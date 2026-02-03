import { Metadata } from 'next';
import GraveSettings from '@/components/GraveSettings';
import { getNetworkByName } from '@/constants/supportedNetworks';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'GRAVE - Settings',
  description: 'List and manage assets in your graveyard',
};

export default async function Settings({
  params,
}: {
  params: Promise<{ networkName: string }>;
}) {
  const { networkName } = await params;
  const network = getNetworkByName(networkName);

  if (!network) {
    notFound();
  }

  return <GraveSettings networkName={networkName} />;
}
