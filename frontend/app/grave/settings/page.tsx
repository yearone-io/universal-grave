import { Metadata } from 'next';
import GraveSettings from '@/components/GraveSettings';

export const metadata: Metadata = {
  title: 'GRAVE - Settings',
  description: 'List and manage assets in your graveyard',
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

export default function Settings() {
  return <GraveSettings />;
}
