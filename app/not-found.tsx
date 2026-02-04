import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      <div
        style={{
          maxWidth: 640,
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 36, marginBottom: 12 }}>Page Not Found</h1>
        <p style={{ fontSize: 16, lineHeight: '24px', marginBottom: 24 }}>
          The page you requested does not exist or has moved.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/lukso"
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              textDecoration: 'none',
              background: '#3B2A4D',
              color: '#FFFFFF',
              fontWeight: 600,
            }}
          >
            Go to Mainnet
          </Link>
          <Link
            href="/lukso-testnet"
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              textDecoration: 'none',
              background: '#E2E8F0',
              color: '#1A202C',
              fontWeight: 600,
            }}
          >
            Go to Testnet
          </Link>
        </div>
      </div>
    </div>
  );
}
