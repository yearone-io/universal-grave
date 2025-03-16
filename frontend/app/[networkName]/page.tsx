import LandingBox from '@/components/LandingBox';
import { ChainSlugs } from '@/constants/supportedNetworks';

export default async function NetworkPage({
  params,
}: {
  params: { networkName: ChainSlugs };
}) {
  return <LandingBox networkName={await params.networkName} />;
}
