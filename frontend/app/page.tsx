import './globals.css';
import { Metadata } from 'next';
import Landing from '@/components/Landing';

export const metadata: Metadata = {
  title: 'GRAVE',
  description: 'A cemetery for unwanted digital assets',
  openGraph: {
    images: {
      url: 'https://universal-grave.netlify.app/images/ghoulie.jpg',
    },
  },
  twitter: {
    images: 'https://universal-grave.netlify.app/images/ghoulie.jpg',
    card: 'summary_large_image',
  },
};

export default function Home() {
  return <Landing />;
}
