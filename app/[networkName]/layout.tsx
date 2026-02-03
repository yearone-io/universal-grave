'use client';

import { use } from 'react';
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
  params: Promise<{ networkName: string }>;
}) {
  const { networkName } = use(params);
  const network = getNetworkByName(networkName);

  if (!network) {
    notFound();
  }

  return (
    <>
      <Header networkName={networkName} />
      <NewUserBanner />
      <UpgradeBanner />
      <IncompleteConfigBanner />
      <div style={{ flexGrow: 0.9 }}>{children}</div>
      <Footer networkName={networkName} />
    </>
  );
}
