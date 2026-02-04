import { describe, it, expect } from 'vitest';
import {
  decodeExecDataValue,
  encodeExecDataValue,
  compareAddressLists,
  hasVaultChanged,
  hasCuratedListChanged,
  haveScreenersChanged,
  buildForwarderScreenerConfig,
} from '../assistantConfig';

describe('assistantConfig helpers', () => {
  describe('decodeExecDataValue', () => {
    it('should decode valid exec data value', () => {
      const execDataValue =
        '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9000000000000000000000000cc8dcfe12590ba2310fd557ef6a1da94fa3a18470000000000000000000000000000000000000000000000000000000000000001';

      const [address, configBytes] = decodeExecDataValue(execDataValue);

      expect(address).toBe('0x8b80c84B9Cd9EB087E6894997AE161d4f9d975b9');
      expect(configBytes).toBe(
        '0x000000000000000000000000cc8dcfe12590ba2310fd557ef6a1da94fa3a18470000000000000000000000000000000000000000000000000000000000000001'
      );
    });

    it('should handle data without 0x prefix', () => {
      const execDataValue =
        '8b80c84b9cd9eb087e6894997ae161d4f9d975b9000000000000000000000000cc8dcfe12590ba2310fd557ef6a1da94fa3a1847';

      const [address, configBytes] = decodeExecDataValue(execDataValue);

      expect(address).toBe('0x8b80c84B9Cd9EB087E6894997AE161d4f9d975b9');
      expect(configBytes).toBe(
        '0x000000000000000000000000cc8dcfe12590ba2310fd557ef6a1da94fa3a1847'
      );
    });

    it('should throw error for data too short', () => {
      expect(() => decodeExecDataValue('0x123')).toThrow(
        'Invalid encoded data: too short'
      );
      expect(() =>
        decodeExecDataValue(
          '0x8b80c84b9cd9eb087e6894997ae161d4f9d975'
        )
      ).toThrow('Invalid encoded data: too short');
    });

    it('should handle minimum valid length (address only)', () => {
      const execDataValue =
        '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9';

      const [address, configBytes] = decodeExecDataValue(execDataValue);

      expect(address).toBe('0x8b80c84B9Cd9EB087E6894997AE161d4f9d975b9');
      expect(configBytes).toBe('0x');
    });
  });

  describe('encodeExecDataValue', () => {
    it('should encode address + config bytes', () => {
      const assistantAddress =
        '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9';
      const configBytes =
        '0x000000000000000000000000cc8dcfe12590ba2310fd557ef6a1da94fa3a1847';

      const encoded = encodeExecDataValue(assistantAddress, configBytes);
      expect(encoded).toBe(
        '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9000000000000000000000000cc8dcfe12590ba2310fd557ef6a1da94fa3a1847'
      );
    });

    it('should accept config bytes without 0x prefix', () => {
      const assistantAddress =
        '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9';
      const configBytes =
        '000000000000000000000000cc8dcfe12590ba2310fd557ef6a1da94fa3a1847';

      const encoded = encodeExecDataValue(assistantAddress, configBytes);
      expect(encoded).toBe(
        '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9000000000000000000000000cc8dcfe12590ba2310fd557ef6a1da94fa3a1847'
      );
    });
  });

  describe('compareAddressLists', () => {
    it('should detect identical lists (case-insensitive)', () => {
      const a = [
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
      ];
      const b = [
        '0x2222222222222222222222222222222222222222',
        '0x1111111111111111111111111111111111111111',
      ];
      expect(compareAddressLists(a, b)).toBe(false);
    });

    it('should detect different lengths', () => {
      const a = ['0x1111111111111111111111111111111111111111'];
      const b = [
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
      ];
      expect(compareAddressLists(a, b)).toBe(true);
    });

    it('should detect different addresses', () => {
      const a = ['0x1111111111111111111111111111111111111111'];
      const b = ['0x3333333333333333333333333333333333333333'];
      expect(compareAddressLists(a, b)).toBe(true);
    });
  });

  describe('hasVaultChanged', () => {
    it('should treat missing current vault as changed', () => {
      expect(
        hasVaultChanged(null, '0x1111111111111111111111111111111111111111')
      ).toBe(true);
    });

    it('should compare case-insensitively', () => {
      expect(
        hasVaultChanged(
          '0xAbcdefabcdefabcdefabcdefabcdefabcdefabcd',
          '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
        )
      ).toBe(false);
    });
  });

  describe('hasCuratedListChanged', () => {
    it('should treat both null as unchanged', () => {
      expect(hasCuratedListChanged(null, null)).toBe(false);
    });

    it('should treat one null as changed', () => {
      expect(
        hasCuratedListChanged(
          null,
          '0x1111111111111111111111111111111111111111'
        )
      ).toBe(true);
    });

    it('should compare case-insensitively', () => {
      expect(
        hasCuratedListChanged(
          '0xAbcdefabcdefabcdefabcdefabcdefabcdefabcd',
          '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
        )
      ).toBe(false);
    });
  });

  describe('haveScreenersChanged', () => {
    it('should detect curated list toggle', () => {
      expect(haveScreenersChanged(false, true)).toBe(true);
    });

    it('should detect creator list toggles', () => {
      expect(haveScreenersChanged(true, true, true, false)).toBe(true);
      expect(haveScreenersChanged(true, true, false, true)).toBe(true);
    });

    it('should detect creator curation toggles', () => {
      expect(haveScreenersChanged(true, true, true, true, true, false)).toBe(
        true
      );
      expect(haveScreenersChanged(true, true, true, true, false, true)).toBe(
        true
      );
    });

    it('should return false when selection unchanged', () => {
      expect(haveScreenersChanged(true, true, true, true, false, false)).toBe(
        false
      );
    });
  });

  describe('buildForwarderScreenerConfig', () => {
    const networkConfig = {
      addressListScreenerAddress: '0x1111111111111111111111111111111111111111',
      curatedListScreenerAddress: '0x2222222222222222222222222222222222222222',
      creatorListScreenerAddress: '0x3333333333333333333333333333333333333333',
      creatorCurationScreenerAddress:
        '0x4444444444444444444444444444444444444444',
    };

    it('should build full screener config with correct order and fields', () => {
      const whitelistAddresses = [
        '0x5555555555555555555555555555555555555555',
      ];
      const curatedListAddress = '0x6666666666666666666666666666666666666666';
      const creatorWhitelistAddresses = [
        '0x7777777777777777777777777777777777777777',
      ];
      const creatorCuratedListAddress =
        '0x8888888888888888888888888888888888888888';

      const config = buildForwarderScreenerConfig(
        whitelistAddresses,
        true,
        curatedListAddress,
        creatorWhitelistAddresses,
        creatorCuratedListAddress,
        true,
        false,
        networkConfig
      );

      expect(config.enableScreeners).toBe(true);
      expect(config.useANDLogic).toBe(true);
      expect(config.selectedScreeners).toHaveLength(4);

      const [creatorListId, creatorCurationId, addressListId, curatedListId] =
        config.selectedScreeners;

      expect(creatorListId.startsWith(networkConfig.creatorListScreenerAddress))
        .toBe(true);
      expect(
        creatorCurationId.startsWith(
          networkConfig.creatorCurationScreenerAddress
        )
      ).toBe(true);
      expect(addressListId.startsWith(networkConfig.addressListScreenerAddress))
        .toBe(true);
      expect(curatedListId.startsWith(networkConfig.curatedListScreenerAddress))
        .toBe(true);

      expect(config.screenerConfigs[creatorListId]).toMatchObject({
        addresses: creatorWhitelistAddresses,
        requireAllCreators: true,
        returnValueWhenInList: false,
      });

      expect(config.screenerConfigs[creatorCurationId]).toMatchObject({
        curatedListAddress: creatorCuratedListAddress,
        requireAllCreators: false,
        returnValueWhenCurated: false,
      });

      expect(config.screenerConfigs[addressListId]).toMatchObject({
        addresses: whitelistAddresses,
        returnValueWhenInList: false,
      });

      expect(config.screenerConfigs[curatedListId]).toMatchObject({
        curatedListAddress,
        returnValueWhenCurated: false,
      });
    });

    it('should omit curated list screeners when not configured', () => {
      const config = buildForwarderScreenerConfig(
        [],
        false,
        null,
        [],
        null,
        false,
        false,
        networkConfig
      );

      expect(config.enableScreeners).toBe(true);
      expect(config.selectedScreeners).toHaveLength(2);
      const [creatorListId, addressListId] = config.selectedScreeners;
      expect(creatorListId.startsWith(networkConfig.creatorListScreenerAddress))
        .toBe(true);
      expect(addressListId.startsWith(networkConfig.addressListScreenerAddress))
        .toBe(true);
    });
  });
});
