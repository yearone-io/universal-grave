import { Metadata } from 'next';
import GraveDiagnostics from '@/components/GraveDiagnostics';
import { getNetworkByName } from '@/constants/supportedNetworks';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'GRAVE - Diagnostics',
  description: 'Debug on-chain UAP configuration for your profile',
};

export default function Diagnostics({
  params,
}: {
  params: { networkName: string };
}) {
  const network = getNetworkByName(params.networkName);

  if (!network) {
    notFound();
  }

  return <GraveDiagnostics networkName={params.networkName} />;
}
