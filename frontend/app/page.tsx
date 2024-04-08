import './globals.css';
import { Metadata } from 'next';
import Landing from '@/components/Landing';

export const metadata: Metadata = {
  title: 'GRAVE',
  description: 'A cemetery for unwanted digital assets',
};

export default function Home() {
  return <Landing />;
}
