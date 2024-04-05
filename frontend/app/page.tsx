import './globals.css';
import { Metadata } from 'next';
import Landing from '@/components/Landing';
import { constants } from '@/app/constants';

export const metadata: Metadata = {
  title: 'GRAVE',
  description: 'A cemetery for unwanted digital assets',
  openGraph: {
    images: {
      url: `https://${constants.DOMAIN}/images/ghoulie.jpg`,
    },
  },
  twitter: {
    images: `https://${constants.DOMAIN}/images/ghoulie.jpg`,
    card: 'summary_large_image',
  },
};

export default function Home() {
  return <Landing />;
}
