import { describe, expect, it, vi, beforeEach } from 'vitest';

const BASE_CREATORS_KEY =
  '0x114bd03b3a46d48759680d81ebb2b414fda7d030a7105a851867accf1c2352e7';

const contractsByAddress: Record<string, any> = {};
const contractCtorArgs: string[] = [];

vi.mock('ethers', async () => {
  const actual = await vi.importActual<any>('ethers');
  return {
    ...actual,
    Contract: vi.fn().mockImplementation((address: string) => {
      contractCtorArgs.push(address);
      return contractsByAddress[address.toLowerCase()] || {};
    }),
  };
});

vi.mock('@/utils/addressMetadata', () => ({
  readAddressMetadata: vi.fn(async (address: string) => ({
    address,
    kind: 'unknown',
  })),
  resolveIpfsUrl: vi.fn((url: string) => url),
}));

import {
  getAssetCreators,
  verifyAssetCreators,
} from '@/utils/creatorVerification';

const encodeAddressValue = (address: string) =>
  `0x${'0'.repeat(24)}${address.toLowerCase().slice(2)}`;

describe('creatorVerification fallbacks', () => {
  beforeEach(() => {
    Object.keys(contractsByAddress).forEach(key => delete contractsByAddress[key]);
    contractCtorArgs.length = 0;
  });

  it('reads creators via legacy getData(bytes32[]) when getDataBatch fails', async () => {
    const assetAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const creatorA = '0x1111111111111111111111111111111111111111';
    const creatorB = '0x2222222222222222222222222222222222222222';

    contractsByAddress[assetAddress.toLowerCase()] = {
      ['getData(bytes32)']: vi.fn(async (key: string) =>
        key === BASE_CREATORS_KEY
          ? '0x00000000000000000000000000000002'
          : '0x'
      ),
      getData: vi.fn(async (key: string) =>
        key === BASE_CREATORS_KEY
          ? '0x00000000000000000000000000000002'
          : '0x'
      ),
      ['getDataBatch(bytes32[])']: vi.fn(async () => {
        throw new Error('getDataBatch unavailable');
      }),
      getDataBatch: vi.fn(async () => {
        throw new Error('getDataBatch unavailable');
      }),
      ['getData(bytes32[])']: vi.fn(async (keys: string[]) =>
        keys.length === 2
          ? [encodeAddressValue(creatorA), encodeAddressValue(creatorB)]
          : ['0x']
      ),
    };

    const creators = await getAssetCreators({} as any, assetAddress);

    expect(contractCtorArgs).toContain(assetAddress);
    expect(creators).toEqual([creatorA, creatorB]);
  });

  it('falls back to per-key getData when batch methods fail', async () => {
    const assetAddress = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const creator = '0x3333333333333333333333333333333333333333';
    const keyPrefix = BASE_CREATORS_KEY.slice(0, 34);
    const itemKey = `${keyPrefix}${'0'.repeat(31)}0`;

    contractsByAddress[assetAddress.toLowerCase()] = {
      ['getData(bytes32)']: vi.fn(async (key: string) => {
        if (key === BASE_CREATORS_KEY) {
          return '0x00000000000000000000000000000001';
        }
        if (key === itemKey) {
          return encodeAddressValue(creator);
        }
        return '0x';
      }),
      getData: vi.fn(async (key: string) => {
        if (key === BASE_CREATORS_KEY) {
          return '0x00000000000000000000000000000001';
        }
        if (key === itemKey) {
          return encodeAddressValue(creator);
        }
        return '0x';
      }),
      ['getDataBatch(bytes32[])']: vi.fn(async () => {
        throw new Error('getDataBatch unavailable');
      }),
      getDataBatch: vi.fn(async () => {
        throw new Error('getDataBatch unavailable');
      }),
      ['getData(bytes32[])']: vi.fn(async () => {
        throw new Error('legacy getData(bytes32[]) unavailable');
      }),
    };

    const creators = await getAssetCreators({} as any, assetAddress);

    expect(contractCtorArgs).toContain(assetAddress);
    expect(creators).toEqual([creator]);
  });

  it('verifies creator using batch fallback path', async () => {
    const creator = '0x4444444444444444444444444444444444444444';
    const assetAddress = '0x5555555555555555555555555555555555555555';
    const mapKey =
      '0x74ac2555c10b9349e78f0000' + assetAddress.toLowerCase().slice(2);

    contractsByAddress[creator.toLowerCase()] = {
      ['getDataBatch(bytes32[])']: vi.fn(async () => {
        throw new Error('getDataBatch unavailable');
      }),
      getDataBatch: vi.fn(async () => {
        throw new Error('getDataBatch unavailable');
      }),
      ['getData(bytes32[])']: vi.fn(async (keys: string[]) => {
        if (
          keys[0]?.toLowerCase() === mapKey &&
          keys[1]?.toLowerCase() ===
            '0x7c8c3416d6cda87cd42c71ea1843df28ac4850354f988d55ee2eaa47b6dc05cd'
        ) {
          return [
            '0x1234567800000000000000000000000000000002',
            '0x00000000000000000000000000000003',
          ];
        }
        return ['0x', '0x'];
      }),
    };

    const result = await verifyAssetCreators(
      {} as any,
      assetAddress,
      [creator],
      4201
    );

    expect(result).toHaveLength(1);
    expect(result[0].address).toBe(creator);
    expect(result[0].verified).toBe(true);
  });
});
