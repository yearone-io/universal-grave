import Footer from '@/components/Footer';
import Header from '@/components/Header';

const DEFAULT_NETWORK = 'lukso';

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header networkName={DEFAULT_NETWORK} />
      <div style={{ flexGrow: 0.9 }}>{children}</div>
      <Footer networkName={DEFAULT_NETWORK} />
    </>
  );
}
