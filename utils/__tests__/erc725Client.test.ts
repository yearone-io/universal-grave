import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserProvider } from 'ethers';
import { getErc725Read } from '@/utils/erc725Client';

const ERC725Mock = vi.hoisted(() => vi.fn());

vi.mock('@erc725/erc725.js', () => ({
  default: ERC725Mock,
  ERC725JSONSchema: {},
}));

describe('erc725Client provider normalization', () => {
  beforeEach(() => {
    ERC725Mock.mockReset();
    ERC725Mock.mockImplementation((_schema: any, _address: string, provider: any) => ({
      provider,
    }));
  });

  it('wraps BrowserProvider requests with { method, params }', async () => {
    const requestSpy = vi.fn().mockResolvedValue('0x');
    const eip1193 = { request: requestSpy };
    const browserProvider = new BrowserProvider(eip1193 as any);

    const instance = getErc725Read([], '0x1111111111111111111111111111111111111111', {
      provider: browserProvider,
    }) as any;

    await instance.provider.request({
      method: 'eth_call',
      params: [{ to: '0x0', data: '0x' }, 'latest'],
    });

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'eth_call',
      params: [{ to: '0x0', data: '0x' }, 'latest'],
    });
  });

  it('wraps send-only providers via request', async () => {
    const sendSpy = vi.fn().mockResolvedValue('0x');
    const sendOnlyProvider = { send: sendSpy };

    const instance = getErc725Read([], '0x1111111111111111111111111111111111111111', {
      provider: sendOnlyProvider,
    }) as any;

    await instance.provider.request({
      method: 'eth_chainId',
      params: [],
    });

    expect(sendSpy).toHaveBeenCalledWith('eth_chainId', []);
  });
});
