import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mergeUniversalReceiverDelegatePermissions } from '@/utils/urdUtils';
import { resolveMainControllerForUP } from '@/utils/upAddress';

const getDataMock = vi.fn();

vi.mock('ethers', async () => {
  const actual = await vi.importActual<any>('ethers');
  return {
    ...actual,
    Contract: vi.fn().mockImplementation(() => ({
      getData: getDataMock,
    })),
  };
});

const UP = '0x0000000000000000000000000000000000000001';
const RECOVERED = '0x0000000000000000000000000000000000000002';
const CONNECTED = '0x0000000000000000000000000000000000000003';
const CONTROLLER_BITMAP = `0x${'0'.repeat(60)}01`;

describe('controller permission updates', () => {
  beforeEach(() => {
    getDataMock.mockReset();
  });

  it('adds only the universal-receiver bits and keeps the rest of the bitmap', () => {
    const changeOwnerAndEditPermissions = 0x1n | 0x4n;

    expect(
      mergeUniversalReceiverDelegatePermissions(changeOwnerAndEditPermissions)
    ).toBe(changeOwnerAndEditPermissions | 0x60n);
  });

  it('leaves an unknown high bit in place', () => {
    const customBit = 1n << 255n;

    expect(mergeUniversalReceiverDelegatePermissions(customBit)).toBe(
      customBit | 0x60n
    );
  });

  it('refuses to create a controller from an empty bitmap', () => {
    expect(() => mergeUniversalReceiverDelegatePermissions(0n)).toThrow(
      /not a controller/
    );
  });

  it('uses the recovered controller and does not search the controller array', async () => {
    getDataMock.mockImplementation(async (key: string) =>
      key.toLowerCase().endsWith(RECOVERED.slice(2)) ? CONTROLLER_BITMAP : '0x'
    );

    await expect(
      resolveMainControllerForUP({} as any, UP, RECOVERED, CONNECTED)
    ).resolves.toBe(RECOVERED);

    expect(getDataMock).toHaveBeenCalledTimes(1);
  });

  it('uses the connected account when that account is the controller', async () => {
    getDataMock.mockImplementation(async (key: string) =>
      key.toLowerCase().endsWith(CONNECTED.slice(2)) ? CONTROLLER_BITMAP : '0x'
    );

    await expect(
      resolveMainControllerForUP({} as any, UP, RECOVERED, CONNECTED)
    ).resolves.toBe(CONNECTED);
  });

  it('fails when neither signing address is a controller', async () => {
    getDataMock.mockResolvedValue('0x');

    await expect(
      resolveMainControllerForUP({} as any, UP, RECOVERED, CONNECTED)
    ).rejects.toThrow(/not a controller/);
  });
});
