import { Metadata } from 'next';
import GraveSettings from '@/components/GraveSettings';
import { getNetworkByName } from '@/constants/supportedNetworks';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'GRAVE - Settings',
  description: 'List and manage assets in your graveyard',
};

export default function Settings({
  params,
}: {
  params: { networkName: string };
}) {
  const network = getNetworkByName(params.networkName);

  if (!network) {
    notFound();
  }

  return <GraveSettings networkName={params.networkName} />;
}
