import { Metadata } from 'next';
import GraveSettings from '@/components/GraveSettings';

export const metadata: Metadata = {
  title: 'GRAVE - Settings',
  description: 'List and manage assets in your graveyard',
};

export default function Settings() {
  return <GraveSettings />;
}
