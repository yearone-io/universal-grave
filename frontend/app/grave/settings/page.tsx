import { Metadata } from 'next';
import GraveSettings from '@/components/GraveSettings';
import { constants } from '@/app/constants';

export const metadata: Metadata = {
  title: 'GRAVE - Settings',
  description: 'List and manage assets in your graveyard',
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

export default function Settings() {
  return <GraveSettings />;
}
