import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isSubscribedToUAP,
  getUAPVaultAddress,
  isValidVault,
} from '../uapUtils';
import { ERC725YDataKeys } from '@lukso/lsp-smart-contracts';

const contractMock = {
  getData: vi.fn(),
  owner: vi.fn(),
};

vi.mock('ethers', async () => {
  const actual = await vi.importActual<any>('ethers');
  return {
    ...actual,
    Contract: vi.fn().mockImplementation((address: string) => {
      return contractMock;
    }),
  };
});

describe('uapUtils', () => {
  beforeEach(() => {
    contractMock.getData.mockReset();
    contractMock.owner.mockReset();
  });

  describe('isSubscribedToUAP', () => {
    it('should return true when URD matches protocol address', async () => {
      const protocol = '0x1111111111111111111111111111111111111111';
      contractMock.getData.mockResolvedValue(protocol);
      const result = await isSubscribedToUAP(
        {} as any,
        '0x2222222222222222222222222222222222222222',
        protocol
      );
      expect(result).toBe(true);
    });

    it('should return false when URD is empty', async () => {
      contractMock.getData.mockResolvedValue('0x');
      const result = await isSubscribedToUAP(
        {} as any,
        '0x2222222222222222222222222222222222222222',
        '0x1111111111111111111111111111111111111111'
      );
      expect(result).toBe(false);
    });
  });

  describe('getUAPVaultAddress', () => {
    it('should return null when no vaults exist', async () => {
      contractMock.getData.mockResolvedValue('0x');
      const result = await getUAPVaultAddress(
        {} as any,
        '0x2222222222222222222222222222222222222222'
      );
      expect(result).toBeNull();
    });

    it('should return the first vault address when present', async () => {
      const vaultAddress = '0x3333333333333333333333333333333333333333';
      const lengthKey = ERC725YDataKeys.LSP10['LSP10Vaults[]'].length;
      const indexKey =
        ERC725YDataKeys.LSP10['LSP10Vaults[]'].index +
        '00000000000000000000000000000000';

      contractMock.getData.mockImplementation((key: string) => {
        if (key === lengthKey) {
          return Promise.resolve('0x01');
        }
        if (key === indexKey) {
          return Promise.resolve(
            '0x' + '0'.repeat(24) + vaultAddress.slice(2).toLowerCase()
          );
        }
        return Promise.resolve('0x');
      });

      const result = await getUAPVaultAddress(
        {} as any,
        '0x2222222222222222222222222222222222222222'
      );
      expect(result).toBe(vaultAddress);
    });
  });

  describe('isValidVault', () => {
    it('should return true when owner matches expected', async () => {
      contractMock.owner.mockResolvedValue(
        '0x4444444444444444444444444444444444444444'
      );
      const result = await isValidVault(
        {} as any,
        '0x5555555555555555555555555555555555555555',
        '0x4444444444444444444444444444444444444444'
      );
      expect(result).toBe(true);
    });

    it('should return false when owner mismatches', async () => {
      contractMock.owner.mockResolvedValue(
        '0x6666666666666666666666666666666666666666'
      );
      const result = await isValidVault(
        {} as any,
        '0x5555555555555555555555555555555555555555',
        '0x4444444444444444444444444444444444444444'
      );
      expect(result).toBe(false);
    });
  });
});
