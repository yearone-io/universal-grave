import { Metadata } from 'next';
import GraveDiagnostics from '@/components/GraveDiagnostics';
import { getNetworkByName } from '@/constants/supportedNetworks';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'GRAVE - Diagnostics',
  description: 'Debug on-chain UAP configuration for your profile',
};

export default async function Diagnostics({
  params,
}: {
  params: Promise<{ networkName: string }>;
}) {
  const { networkName } = await params;
  const network = getNetworkByName(networkName);

  if (!network) {
    notFound();
  }

  return <GraveDiagnostics networkName={networkName} />;
}
