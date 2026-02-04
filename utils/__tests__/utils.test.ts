import { describe, it, expect, vi } from 'vitest';
import { getNetwork, formatAddress, truncateText } from '../utils';

vi.mock('@/constants/supportedNetworks', () => ({
  supportedNetworks: {
    42: {
      chainId: 42,
      name: 'LUKSO Mainnet',
      urlName: 'lukso',
      rpcUrl: 'https://rpc.mainnet.lukso.network',
      ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
    },
    4201: {
      chainId: 4201,
      name: 'LUKSO Testnet',
      urlName: 'lukso-testnet',
      rpcUrl: 'https://rpc.testnet.lukso.network',
      ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
    },
  },
}));

describe('utils', () => {
  describe('getNetwork', () => {
    it('should return network for valid chain ID', () => {
      const network = getNetwork(42);
      expect(network).toEqual({
        chainId: 42,
        name: 'LUKSO Mainnet',
        urlName: 'lukso',
        rpcUrl: 'https://rpc.mainnet.lukso.network',
        ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
      });
    });

    it('should handle string chain ID', () => {
      const network = getNetwork('4201');
      expect(network.chainId).toBe(4201);
      expect(network.name).toBe('LUKSO Testnet');
    });

    it('should throw error for missing chain ID', () => {
      expect(() => getNetwork('')).toThrow('Chain ID not provided');
      expect(() => getNetwork(null as any)).toThrow('Chain ID not provided');
      expect(() => getNetwork(undefined as any)).toThrow('Chain ID not provided');
    });

    it('should throw error for unsupported network', () => {
      expect(() => getNetwork(999)).toThrow('Network not supported');
      expect(() => getNetwork('invalid')).toThrow('Network not supported');
    });
  });

  describe('formatAddress', () => {
    it('should format long address correctly', () => {
      const address = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9';
      expect(formatAddress(address)).toBe('0x8b8...75b9');
    });

    it('should return "0x" for null address', () => {
      expect(formatAddress(null)).toBe('0x');
    });

    it('should return original address if shorter than 10 characters', () => {
      expect(formatAddress('0x123')).toBe('0x123');
      expect(formatAddress('0x')).toBe('0x');
    });

    it('should handle empty string', () => {
      expect(formatAddress('')).toBe('0x');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      expect(truncateText(text, 20)).toBe('This is a very lo...');
    });

    it('should return original text if shorter than maxLength', () => {
      const text = 'Short text';
      expect(truncateText(text, 20)).toBe('Short text');
    });

    it('should handle exact length', () => {
      const text = 'Exact length text';
      expect(truncateText(text, 17)).toBe('Exact length text');
    });

    it('should handle edge case with maxLength 3', () => {
      const text = 'Hello';
      expect(truncateText(text, 3)).toBe('...');
    });

    it('should handle empty string', () => {
      expect(truncateText('', 10)).toBe('');
    });
  });
});
