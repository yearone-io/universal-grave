import { describe, expect, it } from 'vitest';
import { getUniversalEverythingUrl } from '@/utils/universalEverything';

describe('getUniversalEverythingUrl', () => {
  const address = '0x1234567890abcdef1234567890abcdef12345678';

  it('builds mainnet profile URL without network query', () => {
    const url = getUniversalEverythingUrl(42, 'profile', address);
    expect(url).toBe(`https://universaleverything.io/${address}`);
  });

  it('builds testnet asset URL with network query', () => {
    const url = getUniversalEverythingUrl(4201, 'asset', address);
    expect(url).toBe(
      `https://universaleverything.io/asset/${address}?network=testnet`
    );
  });

  it('falls back to base URL when chain is unknown', () => {
    const url = getUniversalEverythingUrl(undefined, 'asset', address);
    expect(url).toBe(`https://universaleverything.io/asset/${address}`);
  });
});
