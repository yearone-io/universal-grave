import { beforeEach, describe, expect, it, vi } from 'vitest';
import { keccak256, toUtf8Bytes } from 'ethers';
import {
  detectLSP,
  GRAVE_ASSET_TYPES,
  shouldPromoteNonStandardLSP7,
  shouldPromoteNonStandardLSP8,
} from '@/utils/tokenUtils';

const mockSupportsInterfaceSafe = vi.fn();

vi.mock('@/utils/erc725Client', async () => {
  const actual = await vi.importActual<any>('@/utils/erc725Client');
  return {
    ...actual,
    getErc725Read: vi.fn(() => ({})),
    supportsInterfaceSafe: (...args: any[]) =>
      mockSupportsInterfaceSafe(...args),
  };
});

const makeTransferSelector = (signature: string) =>
  keccak256(toUtf8Bytes(signature)).slice(2, 10);

describe('detectLSP classification', () => {
  beforeEach(() => {
    mockSupportsInterfaceSafe.mockReset();
  });

  it('returns standard LSP7 when supportsInterface is true', async () => {
    mockSupportsInterfaceSafe
      .mockResolvedValueOnce(true) // LSP7
      .mockResolvedValueOnce(false); // LSP8

    const provider = {
      getCode: vi.fn(),
      getStorage: vi.fn(),
    };

    const result = await detectLSP(
      provider as any,
      '0x1111111111111111111111111111111111111111'
    );

    expect(result).toBe(GRAVE_ASSET_TYPES.LSP7DigitalAsset);
    expect(provider.getCode).not.toHaveBeenCalled();
  });

  it('classifies proxy-backed LSP7 as standard when implementation exposes transfer signature', async () => {
    mockSupportsInterfaceSafe
      .mockResolvedValueOnce(false) // LSP7
      .mockResolvedValueOnce(false); // LSP8

    const assetAddress = '0x1111111111111111111111111111111111111111';
    const implementationAddress = '0x2222222222222222222222222222222222222222';
    const lsp7Selector = makeTransferSelector(
      'transfer(address,address,uint256,bool,bytes)'
    );

    const minimalProxyBytecode =
      '0x363d3d373d3d3d363d73' +
      implementationAddress.slice(2).toLowerCase() +
      '5af43d82803e903d91602b57fd5bf3';
    const implementationBytecode = `0x60006000${lsp7Selector}6000`;

    const provider = {
      getCode: vi.fn(async (address: string) => {
        if (address.toLowerCase() === assetAddress.toLowerCase()) {
          return minimalProxyBytecode;
        }
        if (address.toLowerCase() === implementationAddress.toLowerCase()) {
          return implementationBytecode;
        }
        return '0x';
      }),
      getStorage: vi.fn(async () => '0x'),
    };

    const result = await detectLSP(provider as any, assetAddress);

    expect(result).toBe(GRAVE_ASSET_TYPES.LSP7DigitalAsset);
  });

  it('keeps non-proxy selector-only assets in nonstandard bucket', async () => {
    mockSupportsInterfaceSafe
      .mockResolvedValueOnce(false) // LSP7
      .mockResolvedValueOnce(false); // LSP8

    const lsp7Selector = makeTransferSelector(
      'transfer(address,address,uint256,bool,bytes)'
    );
    const nonProxyBytecode = `0x60006000${lsp7Selector}6000`;

    const provider = {
      getCode: vi.fn(async () => nonProxyBytecode),
      getStorage: vi.fn(async () => '0x'),
    };

    const result = await detectLSP(
      provider as any,
      '0x3333333333333333333333333333333333333333'
    );

    expect(result).toBe(GRAVE_ASSET_TYPES.UnrecognisedLSP7DigitalAsset);
  });
});

describe('nonstandard promotion helpers', () => {
  it('promotes nonstandard LSP7 when token type and core reads are valid', () => {
    const shouldPromote = shouldPromoteNonStandardLSP7({
      tokenType: 0,
      decimals: 18,
      balance: 1n,
    });
    expect(shouldPromote).toBe(true);
  });

  it('does not promote nonstandard LSP7 when balance read failed', () => {
    const shouldPromote = shouldPromoteNonStandardLSP7({
      tokenType: 0,
      decimals: 18,
      balance: undefined,
    });
    expect(shouldPromote).toBe(false);
  });

  it('promotes nonstandard LSP8 when tokenIds probe succeeds', () => {
    const shouldPromote = shouldPromoteNonStandardLSP8({
      tokenType: 2,
      tokenIdsProbeSucceeded: true,
    });
    expect(shouldPromote).toBe(true);
  });
});
