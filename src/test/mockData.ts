import { vi } from 'vitest';

export const mockTxResponse = {
  hash: '0xabcdef1234567890',
  wait: vi.fn().mockResolvedValue({
    status: 1,
    blockNumber: 123456,
    gasUsed: BigInt('21000'),
  }),
};

export const mockProfileDetailsData = {
  upWallet: '0x1234567890123456789012345678901234567890',
  mainUPController: '0x1111111111111111111111111111111111111111',
  profile: null,
  issuedAssets: [],
};

export const mockNetworkConfig = {
  chainId: 42,
  displayName: 'LUKSO Mainnet',
  universalGraveForwarder: '0x9999999999999999999999999999999999999999',
};
