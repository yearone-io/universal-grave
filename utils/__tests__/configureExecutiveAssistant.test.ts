import { describe, it, expect, vi } from 'vitest';
import ERC725 from '@erc725/erc725.js';
import { AbiCoder } from 'ethers';
import uapSchema from '@/schemas/UAP.json';
import configureExecutiveAssistantWithUnifiedSystem, {
  encodeTupleKeyValue,
  computeAddressListDiff,
} from '../configureExecutiveAssistant';

describe('configureExecutiveAssistant helpers', () => {
  describe('encodeTupleKeyValue', () => {
    it('should concatenate encoded values in ERC725 tuple format', () => {
      const erc725 = new ERC725([]);
      const assistantAddress =
        '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9';
      const configBytes = '0x1234';

      const expected =
        '0x' +
        erc725.encodeValueType('address', assistantAddress).slice(2) +
        erc725.encodeValueType('bytes', configBytes).slice(2);

      const result = encodeTupleKeyValue('(Address,Bytes)', '(address,bytes)', [
        assistantAddress,
        configBytes,
      ]);

      expect(result).toBe(expected);
    });

    it('should throw on mismatched tuple length', () => {
      expect(() =>
        encodeTupleKeyValue('(Address,Bytes)', '(address,bytes)', [
          '0x1111111111111111111111111111111111111111',
        ])
      ).toThrow('Expected array of length: 2');
    });
  });

  describe('computeAddressListDiff', () => {
    const erc725 = new ERC725(
      uapSchema as any,
      '0x0000000000000000000000000000000000000000'
    );
    const listName = 'GraveSafeAssets';
    const listLengthKey = erc725.encodeKeyName(`${listName}[]`);
    const keyPrefix = listLengthKey.slice(0, 34);
    const addr1 = '0x1111111111111111111111111111111111111111';
    const addr2 = '0x2222222222222222222222222222222222222222';

    const createUpContract = (data: Record<string, string>) => ({
      getData: vi.fn().mockImplementation((key: string) => {
        return Promise.resolve(data[key] || '0x');
      }),
    });

    it('should return no changes when list is identical', async () => {
      const data: Record<string, string> = {
        [listLengthKey]: erc725.encodeValueType('uint256', 2n),
        [keyPrefix + '00000000000000000000000000000000']:
          erc725.encodeValueType('address', addr1),
        [keyPrefix + '00000000000000000000000000000001']:
          erc725.encodeValueType('address', addr2),
      };

      const upContract = createUpContract(data);
      const result = await computeAddressListDiff(
        erc725,
        upContract,
        listName,
        [addr1, addr2]
      );

      expect(result.keys).toHaveLength(0);
      expect(result.values).toHaveLength(0);
    });

    it('should generate removal keys when list shrinks', async () => {
      const data: Record<string, string> = {
        [listLengthKey]: erc725.encodeValueType('uint256', 2n),
        [keyPrefix + '00000000000000000000000000000000']:
          erc725.encodeValueType('address', addr1),
        [keyPrefix + '00000000000000000000000000000001']:
          erc725.encodeValueType('address', addr2),
      };

      const upContract = createUpContract(data);
      const result = await computeAddressListDiff(
        erc725,
        upContract,
        listName,
        [addr1]
      );

      const removedIndexKey = keyPrefix + '00000000000000000000000000000001';
      const removedMapKey = erc725.encodeKeyName(`${listName}Map:<address>`, [
        addr2,
      ]);

      expect(result.keys).toContain(listLengthKey);
      expect(result.keys).toContain(removedIndexKey);
      expect(result.keys).toContain(removedMapKey);
      const removedMapIndex = result.keys.indexOf(removedMapKey);
      expect(result.values[removedMapIndex]).toBe('0x');
    });

    it('should handle expanding list without clear operations', async () => {
      const data: Record<string, string> = {
        [listLengthKey]: erc725.encodeValueType('uint256', 1n),
        [keyPrefix + '00000000000000000000000000000000']:
          erc725.encodeValueType('address', addr1),
      };

      const upContract = createUpContract(data);
      const result = await computeAddressListDiff(
        erc725,
        upContract,
        listName,
        [addr1, addr2]
      );

      const clearOperations = result.values.filter(value => value === '0x');
      expect(clearOperations.length).toBe(0);
      expect(result.keys).toContain(listLengthKey);
    });

    it('should update map and index keys when reordering', async () => {
      const data: Record<string, string> = {
        [listLengthKey]: erc725.encodeValueType('uint256', 2n),
        [keyPrefix + '00000000000000000000000000000000']:
          erc725.encodeValueType('address', addr1),
        [keyPrefix + '00000000000000000000000000000001']:
          erc725.encodeValueType('address', addr2),
      };

      const upContract = createUpContract(data);
      const result = await computeAddressListDiff(
        erc725,
        upContract,
        listName,
        [addr2, addr1]
      );

      const mapKey1 = erc725.encodeKeyName(`${listName}Map:<address>`, [addr1]);
      const mapKey2 = erc725.encodeKeyName(`${listName}Map:<address>`, [addr2]);
      const indexKey0 = keyPrefix + '00000000000000000000000000000000';
      const indexKey1 = keyPrefix + '00000000000000000000000000000001';

      expect(result.keys).toContain(mapKey1);
      expect(result.keys).toContain(mapKey2);
      expect(result.keys).toContain(indexKey0);
      expect(result.keys).toContain(indexKey1);
    });
  });

  describe('configureExecutiveAssistantWithUnifiedSystem', () => {
    const erc725 = new ERC725(
      uapSchema as any,
      '0x0000000000000000000000000000000000000000'
    );
    const typeId =
      '0x29ddb589b1fb5fc7cf394961c1adf5f8c6454761adf795e67fe149f658abe895';
    const assistantAddress =
      '0x1111111111111111111111111111111111111111';
    const assistantConfigData = '0x1234';
    const screenerConfig = {
      enableScreeners: false,
      selectedScreeners: [],
      screenerConfigs: {},
      useANDLogic: true,
    };

    it('should write type config for new assistant', async () => {
      const upContract = {
        getData: vi.fn().mockResolvedValue('0x'),
      };

      const result = await configureExecutiveAssistantWithUnifiedSystem(
        erc725,
        upContract,
        typeId,
        assistantAddress,
        assistantConfigData,
        screenerConfig,
        42,
        {}
      );

      const typeConfigKey = erc725.encodeKeyName('UAPTypeConfig:<bytes32>', [
        typeId,
      ]);
      const executiveConfigKey = erc725.encodeKeyName(
        'UAPExecutiveConfig:<bytes32>:<uint256>',
        [typeId, '0']
      );

      expect(result.keys).toContain(typeConfigKey);
      expect(result.keys).toContain(executiveConfigKey);
    });

    it('should skip type config when assistant already exists', async () => {
      const existing = erc725.encodeValueType('address[]', [
        '0x2222222222222222222222222222222222222222',
        assistantAddress,
      ]);
      const upContract = {
        getData: vi.fn().mockResolvedValue(existing),
      };

      const result = await configureExecutiveAssistantWithUnifiedSystem(
        erc725,
        upContract,
        typeId,
        assistantAddress,
        assistantConfigData,
        screenerConfig,
        42,
        {}
      );

      const typeConfigKey = erc725.encodeKeyName('UAPTypeConfig:<bytes32>', [
        typeId,
      ]);
      const executiveConfigKey = erc725.encodeKeyName(
        'UAPExecutiveConfig:<bytes32>:<uint256>',
        [typeId, '1']
      );

      expect(result.keys).not.toContain(typeConfigKey);
      expect(result.keys).toContain(executiveConfigKey);
    });

    it('should write screener config and list name for address list screener', async () => {
      const upContract = {
        getData: vi.fn().mockResolvedValue('0x'),
      };
      const screenerAddress =
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      const addr1 = '0x1111111111111111111111111111111111111111';
      const addressListId = `${screenerAddress}_loaded_0`;
      const screenerConfigWithList = {
        enableScreeners: true,
        selectedScreeners: [addressListId],
        screenerConfigs: {
          [addressListId]: {
            addresses: [addr1],
            returnValueWhenInList: false,
          },
        },
        useANDLogic: true,
      };

      const result = await configureExecutiveAssistantWithUnifiedSystem(
        erc725,
        upContract,
        typeId,
        assistantAddress,
        assistantConfigData,
        screenerConfigWithList,
        42,
        {}
      );

      const screenerConfigKey = erc725.encodeKeyName(
        'UAPScreenerConfig:<bytes32>:<uint256>',
        [typeId, '0']
      );
      const listNameKey = erc725.encodeKeyName(
        'UAPAddressListName:<bytes32>:<uint256>',
        [typeId, '0']
      );
      const listLengthKey = erc725.encodeKeyName('GraveSafeAssets[]');

      expect(result.keys).toContain(screenerConfigKey);
      expect(result.keys).toContain(listNameKey);
      expect(result.keys).toContain(listLengthKey);

      const coder = new AbiCoder();
      const configBytes = coder.encode(['bool'], [false]);
      const expectedValue =
        '0x' +
        assistantAddress.toLowerCase().slice(2) +
        screenerAddress.toLowerCase().slice(2) +
        configBytes.slice(2);

      const valueIndex = result.keys.indexOf(screenerConfigKey);
      expect(result.values[valueIndex]).toBe(expectedValue);

      const listNameValue = erc725.encodeValueType('string', 'GraveSafeAssets');
      const listNameIndex = result.keys.indexOf(listNameKey);
      expect(result.values[listNameIndex]).toBe(listNameValue);
    });
  });
});
