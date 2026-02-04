import { describe, it, expect, vi } from 'vitest';
import { getUpAddressUrds } from '@/utils/urdUtils';

const getDataBatchMock = vi.fn();

vi.mock('ethers', async () => {
  const actual = await vi.importActual<any>('ethers');
  return {
    ...actual,
    Contract: vi.fn().mockImplementation(() => ({
      getDataBatch: getDataBatchMock,
    })),
  };
});

describe('getUpAddressUrds BAD_DATA handling', () => {
  it('returns null URDs when getDataBatch throws BAD_DATA', async () => {
    getDataBatchMock.mockRejectedValue({
      code: 'BAD_DATA',
      message: 'could not decode result data',
    });

    const result = await getUpAddressUrds(
      {} as any,
      '0x1111111111111111111111111111111111111111'
    );

    expect(result).toEqual({
      lsp7Urd: null,
      lsp8Urd: null,
      oldUrdVersion: null,
    });
  });
});
