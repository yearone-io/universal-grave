import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getForwarderAssistantConfig } from '@/utils/assistantConfig';

const getDataMock = vi.fn();

vi.mock('ethers', async () => {
  const actual = await vi.importActual<any>('ethers');
  return {
    ...actual,
    Contract: vi.fn().mockImplementation(() => ({
      getData: getDataMock,
      getDataBatch: vi.fn(),
    })),
  };
});

vi.mock('@/utils/erc725Client', () => ({
  getErc725Read: vi.fn(() => ({
    encodeKeyName: (name: string) => name,
    decodeValueType: vi.fn(),
  })),
}));

describe('getForwarderAssistantConfig BAD_DATA handling', () => {
  beforeEach(() => {
    getDataMock.mockReset();
  });

  it('returns default config when getData throws BAD_DATA', async () => {
    getDataMock.mockRejectedValue({
      code: 'BAD_DATA',
      message: 'could not decode result data',
    });

    const config = await getForwarderAssistantConfig(
      {} as any,
      '0x1111111111111111111111111111111111111111',
      {
        forwarderAssistantAddress: '0x2222222222222222222222222222222222222222',
        addressListScreenerAddress:
          '0x3333333333333333333333333333333333333333',
        curatedListScreenerAddress:
          '0x4444444444444444444444444444444444444444',
        creatorListScreenerAddress:
          '0x5555555555555555555555555555555555555555',
        creatorCurationScreenerAddress:
          '0x6666666666666666666666666666666666666666',
      }
    );

    expect(config.isConfigured).toBe(false);
    expect(config.vaultAddress).toBeNull();
    expect(config.whitelistAddresses).toEqual([]);
  });
});
