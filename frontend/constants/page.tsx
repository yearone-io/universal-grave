import LandingBox from '@/components/LandingBox';
import { ChainSlugs } from '@/constants/supportedNetworks';

export default function HomePage() {
  return <LandingBox networkName={ChainSlugs.LUKSO} />;
}
