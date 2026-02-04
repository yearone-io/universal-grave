import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AbiCoder } from 'ethers';
import {
  isCuratedListScreenerConfigured,
  isAssetInCuratedList,
} from '../screenerUpdates';

const contractMock = {
  getData: vi.fn(),
  isListed: vi.fn(),
  contains: vi.fn(),
};

vi.mock('ethers', async () => {
  const actual = await vi.importActual<any>('ethers');
  return {
    ...actual,
    Contract: vi.fn().mockImplementation(() => contractMock),
  };
});

describe('screenerUpdates helpers', () => {
  beforeEach(() => {
    contractMock.getData.mockReset();
    contractMock.isListed.mockReset();
    contractMock.contains.mockReset();
  });

  describe('isCuratedListScreenerConfigured', () => {
    it('should return false when no config data exists', async () => {
      contractMock.getData.mockResolvedValue('0x');
      const result = await isCuratedListScreenerConfigured(
        {} as any,
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222'
      );
      expect(result).toBe(false);
    });

    it('should return true when curated list address is set', async () => {
      const coder = new AbiCoder();
      const encoded = coder.encode(
        ['address', 'bool'],
        ['0x3333333333333333333333333333333333333333', true]
      );
      contractMock.getData.mockResolvedValue(encoded);
      const result = await isCuratedListScreenerConfigured(
        {} as any,
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222'
      );
      expect(result).toBe(true);
    });
  });

  describe('isAssetInCuratedList', () => {
    it('should return true when isListed succeeds', async () => {
      contractMock.isListed.mockResolvedValue(true);
      const result = await isAssetInCuratedList(
        {} as any,
        '0x4444444444444444444444444444444444444444',
        '0x5555555555555555555555555555555555555555'
      );
      expect(result).toBe(true);
      expect(contractMock.isListed).toHaveBeenCalled();
    });

    it('should fall back to contains when isListed fails', async () => {
      contractMock.isListed.mockRejectedValue(new Error('not supported'));
      contractMock.contains.mockResolvedValue(true);
      const result = await isAssetInCuratedList(
        {} as any,
        '0x4444444444444444444444444444444444444444',
        '0x5555555555555555555555555555555555555555'
      );
      expect(result).toBe(true);
      expect(contractMock.contains).toHaveBeenCalled();
    });

    it('should return false when both methods fail', async () => {
      contractMock.isListed.mockRejectedValue(new Error('not supported'));
      contractMock.contains.mockRejectedValue(new Error('not supported'));
      const result = await isAssetInCuratedList(
        {} as any,
        '0x4444444444444444444444444444444444444444',
        '0x5555555555555555555555555555555555555555'
      );
      expect(result).toBe(false);
    });
  });
});
