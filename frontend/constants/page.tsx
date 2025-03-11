import LandingBox from '@/components/LandingBox';
import { CHAINS } from '@/constants/supportedNetworks';

export default function HomePage() {
  return <LandingBox networkName={CHAINS.LUKSO} />;
}
