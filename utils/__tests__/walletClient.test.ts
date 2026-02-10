import { describe, it, expect, beforeEach, vi } from 'vitest';
const checkControllerPermissionsOnUPMock = vi.fn();
const resolveAnyControllerForUPMock = vi.fn();

vi.mock('@/utils/upAddress', () => ({
  checkControllerPermissionsOnUP: (...args: any[]) =>
    checkControllerPermissionsOnUPMock(...args),
  resolveAnyControllerForUP: (...args: any[]) =>
    resolveAnyControllerForUPMock(...args),
}));

import {
  getWalletAddress,
  getWalletSigner,
  getWalletSignerForUP,
  sendUPMethodTx,
  setWalletClient,
} from '@/utils/walletClient';

const ACCOUNT_FROM_WALLET_CLIENT = '0x1111111111111111111111111111111111111111';
const ACCOUNT_FROM_PROVIDER = '0x2222222222222222222222222222222222222222';
const UNIVERSAL_PROFILE_ADDRESS = '0x3333333333333333333333333333333333333333';
const CONTROLLER_ADDRESS = '0x4444444444444444444444444444444444444444';
const SECOND_ACCOUNT_FROM_PROVIDER = '0x5555555555555555555555555555555555555555';
const originalUserAgent =
  typeof navigator === 'undefined' ? '' : navigator.userAgent;

const makeTransport = () => ({
  request: vi.fn(async ({ method }: { method: string; params?: any[] }) => {
    if (method === 'eth_chainId') return '0x2a';
    if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
      return [ACCOUNT_FROM_PROVIDER];
    }
    throw new Error(`Unsupported method: ${method}`);
  }),
});

describe('walletClient signer resolution', () => {
  beforeEach(() => {
    setWalletClient(null);
    checkControllerPermissionsOnUPMock.mockReset();
    resolveAnyControllerForUPMock.mockReset();
    resolveAnyControllerForUPMock.mockResolvedValue(null);
    localStorage.clear();
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(window.navigator, 'userAgent', {
        configurable: true,
        value: originalUserAgent,
      });
    }
  });

  it('resolves signer from provider-selected account instead of forcing walletClient.account', async () => {
    const transport = makeTransport();
    setWalletClient({
      account: { address: ACCOUNT_FROM_WALLET_CLIENT },
      chain: { id: 42, name: 'LUKSO' },
      transport,
    } as any);

    const signer = await getWalletSigner();
    const signerAddress = await signer.getAddress();

    expect(signerAddress).toBe(ACCOUNT_FROM_PROVIDER);
  });

  it('refreshes cached signer when provider accounts change', async () => {
    let providerAccount = ACCOUNT_FROM_PROVIDER;
    const transport = {
      request: vi.fn(async ({ method }: { method: string; params?: any[] }) => {
        if (method === 'eth_chainId') return '0x2a';
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
          return [providerAccount];
        }
        throw new Error(`Unsupported method: ${method}`);
      }),
    };

    setWalletClient({
      account: { address: ACCOUNT_FROM_WALLET_CLIENT },
      chain: { id: 42, name: 'LUKSO' },
      transport,
    } as any);

    const firstSigner = await getWalletSigner();
    expect(await firstSigner.getAddress()).toBe(ACCOUNT_FROM_PROVIDER);

    providerAccount = SECOND_ACCOUNT_FROM_PROVIDER;

    const secondSigner = await getWalletSigner();
    expect(await secondSigner.getAddress()).toBe(SECOND_ACCOUNT_FROM_PROVIDER);
  });

  it('keeps connected wallet address from wallet client for identity uses', async () => {
    const transport = makeTransport();
    setWalletClient({
      account: { address: ACCOUNT_FROM_WALLET_CLIENT },
      chain: { id: 42, name: 'LUKSO' },
      transport,
    } as any);

    expect(await getWalletAddress()).toBe(ACCOUNT_FROM_WALLET_CLIENT);
  });

  it('prefers the UP signer when the UP account is connected alongside controllers', async () => {
    const transport = {
      request: vi.fn(async ({ method }: { method: string; params?: any[] }) => {
        if (method === 'eth_chainId') return '0x2a';
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
          return [UNIVERSAL_PROFILE_ADDRESS, CONTROLLER_ADDRESS];
        }
        throw new Error(`Unsupported method: ${method}`);
      }),
    };

    setWalletClient({
      account: { address: UNIVERSAL_PROFILE_ADDRESS },
      chain: { id: 42, name: 'LUKSO' },
      transport,
    } as any);

    localStorage.setItem(
      'profileDetailsData',
      JSON.stringify({
        mainUPController: CONTROLLER_ADDRESS,
        connectedWalletAddress: UNIVERSAL_PROFILE_ADDRESS,
      })
    );

    checkControllerPermissionsOnUPMock.mockImplementation(
      async (_provider: any, _upAddress: string, controllerAddress: string) =>
        ({
          hasPermissions:
            controllerAddress.toLowerCase() ===
            CONTROLLER_ADDRESS.toLowerCase(),
          checked: true,
        })
    );

    const upSigner = await getWalletSignerForUP(UNIVERSAL_PROFILE_ADDRESS, {
      requirePermissions: true,
    });
    expect(await upSigner.getAddress()).toBe(UNIVERSAL_PROFILE_ADDRESS);

    // Default signer should remain the provider-selected account.
    const defaultSigner = await getWalletSigner();
    expect(await defaultSigner.getAddress()).toBe(UNIVERSAL_PROFILE_ADDRESS);
  });

  it('falls back to UP default signer when no connected account has explicit UP permissions', async () => {
    const transport = {
      request: vi.fn(async ({ method }: { method: string; params?: any[] }) => {
        if (method === 'eth_chainId') return '0x2a';
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
          return [UNIVERSAL_PROFILE_ADDRESS];
        }
        throw new Error(`Unsupported method: ${method}`);
      }),
    };

    setWalletClient({
      account: { address: UNIVERSAL_PROFILE_ADDRESS },
      chain: { id: 42, name: 'LUKSO' },
      transport,
    } as any);

    checkControllerPermissionsOnUPMock.mockResolvedValue({
      hasPermissions: false,
      checked: true,
    });

    const signer = await getWalletSignerForUP(UNIVERSAL_PROFILE_ADDRESS, {
      requirePermissions: true,
    });
    expect(await signer.getAddress()).toBe(UNIVERSAL_PROFILE_ADDRESS);
  });

  it('falls back to default signer when permission checks are inconclusive', async () => {
    const transport = {
      request: vi.fn(async ({ method }: { method: string; params?: any[] }) => {
        if (method === 'eth_chainId') return '0x2a';
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
          return [UNIVERSAL_PROFILE_ADDRESS];
        }
        throw new Error(`Unsupported method: ${method}`);
      }),
    };

    setWalletClient({
      account: { address: UNIVERSAL_PROFILE_ADDRESS },
      chain: { id: 42, name: 'LUKSO' },
      transport,
    } as any);

    checkControllerPermissionsOnUPMock.mockResolvedValue({
      hasPermissions: false,
      checked: false,
    });

    const signer = await getWalletSignerForUP(UNIVERSAL_PROFILE_ADDRESS, {
      requirePermissions: true,
    });
    expect(await signer.getAddress()).toBe(UNIVERSAL_PROFILE_ADDRESS);
  });

  it('falls back to UP default signer when a discovered permissioned controller is disconnected', async () => {
    const transport = {
      request: vi.fn(async ({ method }: { method: string; params?: any[] }) => {
        if (method === 'eth_chainId') return '0x2a';
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
          return [UNIVERSAL_PROFILE_ADDRESS];
        }
        throw new Error(`Unsupported method: ${method}`);
      }),
    };

    setWalletClient({
      account: { address: UNIVERSAL_PROFILE_ADDRESS },
      chain: { id: 42, name: 'LUKSO' },
      transport,
    } as any);

    resolveAnyControllerForUPMock.mockResolvedValue(CONTROLLER_ADDRESS);
    checkControllerPermissionsOnUPMock.mockImplementation(
      async (_provider: any, _upAddress: string, controllerAddress: string) => ({
        hasPermissions:
          controllerAddress.toLowerCase() === CONTROLLER_ADDRESS.toLowerCase(),
        checked: true,
      })
    );

    const signer = await getWalletSignerForUP(UNIVERSAL_PROFILE_ADDRESS, {
      requirePermissions: true,
    });
    expect(await signer.getAddress()).toBe(UNIVERSAL_PROFILE_ADDRESS);
  });

  it('throws a clear error when a permissioned controller exists but no connected signer matches and signer is not UP', async () => {
    const transport = {
      request: vi.fn(async ({ method }: { method: string; params?: any[] }) => {
        if (method === 'eth_chainId') return '0x2a';
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
          return [ACCOUNT_FROM_PROVIDER];
        }
        throw new Error(`Unsupported method: ${method}`);
      }),
    };

    setWalletClient({
      account: { address: ACCOUNT_FROM_WALLET_CLIENT },
      chain: { id: 42, name: 'LUKSO' },
      transport,
    } as any);

    resolveAnyControllerForUPMock.mockResolvedValue(CONTROLLER_ADDRESS);
    checkControllerPermissionsOnUPMock.mockImplementation(
      async (_provider: any, _upAddress: string, controllerAddress: string) => ({
        hasPermissions:
          controllerAddress.toLowerCase() === CONTROLLER_ADDRESS.toLowerCase(),
        checked: true,
      })
    );

    await expect(
      getWalletSignerForUP(UNIVERSAL_PROFILE_ADDRESS, {
        requirePermissions: true,
      })
    ).rejects.toThrow('A controller with LSP6 permissions exists');
  });

  it('throws no-connected-signer error when permission checks are conclusive and no controller has permissions', async () => {
    const transport = {
      request: vi.fn(async ({ method }: { method: string; params?: any[] }) => {
        if (method === 'eth_chainId') return '0x2a';
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
          return [ACCOUNT_FROM_PROVIDER];
        }
        throw new Error(`Unsupported method: ${method}`);
      }),
    };

    setWalletClient({
      account: { address: ACCOUNT_FROM_WALLET_CLIENT },
      chain: { id: 42, name: 'LUKSO' },
      transport,
    } as any);

    checkControllerPermissionsOnUPMock.mockResolvedValue({
      hasPermissions: false,
      checked: true,
    });

    await expect(
      getWalletSignerForUP(UNIVERSAL_PROFILE_ADDRESS, {
        requirePermissions: true,
      })
    ).rejects.toThrow('No connected Universal Profile signer');
  });

  it('falls back to eth_sendTransaction for mobile UP signer when estimate gas fails', async () => {
    const ethSendTransactionMock = vi.fn(async () => '0xabc');
    const transport = {
      request: vi.fn(async ({ method }: { method: string; params?: any[] }) => {
        if (method === 'eth_chainId') return '0x2a';
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
          return [UNIVERSAL_PROFILE_ADDRESS];
        }
        if (method === 'eth_sendTransaction') {
          return ethSendTransactionMock();
        }
        throw new Error(`Unsupported method: ${method}`);
      }),
    };

    setWalletClient({
      account: { address: UNIVERSAL_PROFILE_ADDRESS },
      chain: { id: 42, name: 'LUKSO' },
      transport,
    } as any);

    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
    });

    const signer = await getWalletSigner();
    const setDataBatchMock = vi.fn(async () => {
      const error = new Error('execution reverted');
      (error as any).code = 'CALL_EXCEPTION';
      (error as any).action = 'estimateGas';
      throw error;
    });
    const upContract = {
      connect: () => ({
        setDataBatch: setDataBatchMock,
      }),
      interface: {
        encodeFunctionData: vi.fn(() => '0xdeadbeef'),
      },
    } as any;

    const tx = await sendUPMethodTx({
      signer,
      upAddress: UNIVERSAL_PROFILE_ADDRESS,
      upContract,
      method: 'setDataBatch',
      args: [[], []],
    });

    expect(tx.hash).toBe('0xabc');
    expect(setDataBatchMock).toHaveBeenCalledTimes(1);
    expect(transport.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'eth_sendTransaction',
        params: [
          expect.objectContaining({
            from: UNIVERSAL_PROFILE_ADDRESS,
            to: UNIVERSAL_PROFILE_ADDRESS,
            data: '0xdeadbeef',
          }),
        ],
      })
    );
  });

  it('does not bypass estimate on non-mobile sessions', async () => {
    const transport = {
      request: vi.fn(async ({ method }: { method: string; params?: any[] }) => {
        if (method === 'eth_chainId') return '0x2a';
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
          return [UNIVERSAL_PROFILE_ADDRESS];
        }
        throw new Error(`Unsupported method: ${method}`);
      }),
    };

    setWalletClient({
      account: { address: UNIVERSAL_PROFILE_ADDRESS },
      chain: { id: 42, name: 'LUKSO' },
      transport,
    } as any);

    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)',
    });

    const signer = await getWalletSigner();
    const setDataBatchMock = vi.fn(async () => {
      const error = new Error('execution reverted');
      (error as any).code = 'CALL_EXCEPTION';
      (error as any).action = 'estimateGas';
      throw error;
    });
    const upContract = {
      connect: () => ({
        setDataBatch: setDataBatchMock,
      }),
      interface: {
        encodeFunctionData: vi.fn(() => '0xdeadbeef'),
      },
    } as any;

    await expect(
      sendUPMethodTx({
        signer,
        upAddress: UNIVERSAL_PROFILE_ADDRESS,
        upContract,
        method: 'setDataBatch',
        args: [[], []],
      })
    ).rejects.toThrow('execution reverted');
  });
});
