'use client';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import NewUserBanner from '@/components/NewUserBanner';
import UpgradeBanner from '@/components/UpgradeBanner';
import IncompleteConfigBanner from '@/components/IncompleteConfigBanner';
import { getNetworkByName } from '@/constants/supportedNetworks';
import { notFound } from 'next/navigation';

export default function NetworkLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { networkName: string };
}) {
  const network = getNetworkByName(params.networkName);

  if (!network) {
    notFound();
  }

  return (
    <>
      <Header networkName={params.networkName} />
      <NewUserBanner />
      <UpgradeBanner />
      <IncompleteConfigBanner />
      <div style={{ flexGrow: 0.9 }}>{children}</div>
      <Footer networkName={params.networkName} />
    </>
  );
}
