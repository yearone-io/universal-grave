import React, { useEffect, useRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { ProfileProvider, useProfile } from '@/contexts/ProfileProvider';

const mockGetWalletProvider = vi.fn();

vi.mock('@/utils/walletClient', () => ({
  getWalletProvider: () => mockGetWalletProvider(),
}));

vi.mock('@/utils/erc725Client', () => ({
  getErc725Read: vi.fn(() => ({})),
  fetchDataSafe: vi.fn(async (_erc725: any, key: string) => {
    if (key === 'LSP3Profile') {
      return {
        value: {
          LSP3Profile: {
            name: 'Test Profile',
            profileImage: [],
          },
        },
      };
    }
    if (key === 'LSP12IssuedAssets[]') {
      return { value: [] };
    }
    return { value: null };
  }),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({}),
}));

vi.mock('ethers', async () => {
  const actual = await vi.importActual<any>('ethers');
  return {
    ...actual,
    verifyMessage: vi.fn(() => '0x1111111111111111111111111111111111111111'),
  };
});

const ConnectOnMount = () => {
  const { connectAndSign } = useProfile();
  const didRun = useRef(false);
  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    connectAndSign();
  }, [connectAndSign]);
  return null;
};

describe('ProfileProvider connect flow', () => {
  beforeEach(() => {
    mockGetWalletProvider.mockReset();
    localStorage.clear();
  });

  it('does not double prompt when accountsChanged fires during connect', async () => {
    const handlers: Record<string, (args: any) => void> = {};
    (window as any).lukso = {
      on: (event: string, cb: (args: any) => void) => {
        handlers[event] = cb;
      },
      removeListener: vi.fn(),
    };

    const account = '0x1111111111111111111111111111111111111111';
    const sendMock = vi.fn(async (method: string, params?: any[]) => {
      if (method === 'eth_chainId') {
        return '0x2a';
      }
      if (method === 'eth_requestAccounts') {
        handlers.accountsChanged?.([account]);
        return [account];
      }
      if (method === 'personal_sign') {
        return '0xsigned';
      }
      if (method === 'eth_accounts') {
        return [account];
      }
      return [];
    });

    mockGetWalletProvider.mockReturnValue({ send: sendMock });

    render(
      <ProfileProvider>
        <ConnectOnMount />
      </ProfileProvider>
    );

    await waitFor(() => {
      expect(sendMock).toHaveBeenCalledWith('personal_sign', expect.anything());
    });

    const requestCalls = sendMock.mock.calls.filter(
      ([method]) => method === 'eth_requestAccounts'
    );
    expect(requestCalls).toHaveLength(1);
  });
});
