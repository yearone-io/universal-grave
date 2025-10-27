import { redirect } from 'next/navigation';
import { CHAINS } from '@/constants/supportedNetworks';

export default function HomePage() {
  // Redirect to mainnet by default
  redirect(`/${CHAINS.LUKSO}`);
}
