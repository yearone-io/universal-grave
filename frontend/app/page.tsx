import './globals.css';
import { Metadata } from 'next';
import { CHAINS } from '@/constants/supportedNetworks';
import LandingBox from '@/components/LandingBox';

export const metadata: Metadata = {
  title: 'GRAVE',
  description: 'A cemetery for unwanted digital assets',
};

export default function HomePage() {
  return <LandingBox networkName={CHAINS.LUKSO} />;
}
