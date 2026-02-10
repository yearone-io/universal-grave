import React, { useEffect, useRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import { ProfileProvider, useProfile } from '@/contexts/ProfileProvider';

const openConnectModalMock = vi.fn();
const openChainModalMock = vi.fn();
const switchChainAsyncMock = vi.fn();
const disconnectMock = vi.fn();
const connectAsyncMock = vi.fn();
const resolveUniversalProfileAddressMock = vi.fn();
const resolveMainControllerForUPMock = vi.fn();
const canReadAsUniversalProfileMock = vi.fn();

const walletClientMock = {
  account: { address: '0x1111111111111111111111111111111111111111' },
  chain: { id: 42, name: 'LUKSO' },
  signMessage: vi.fn(async () => '0xsigned'),
};

const useAccountMock = vi.fn();
const useWalletClientMock = vi.fn();

vi.mock('wagmi', () => ({
  useAccount: () => useAccountMock(),
  useConnect: () => ({
    connectAsync: connectAsyncMock,
    connectors: [{ id: 'lukso', name: 'Universal Profile' }],
  }),
  useWalletClient: () => useWalletClientMock(),
  useDisconnect: () => ({ disconnect: disconnectMock }),
  useSwitchChain: () => ({ switchChainAsync: switchChainAsyncMock }),
}));

vi.mock('@rainbow-me/rainbowkit', () => ({
  useConnectModal: () => ({ openConnectModal: openConnectModalMock }),
  useChainModal: () => ({ openChainModal: openChainModalMock }),
}));

vi.mock('@/utils/walletClient', () => ({
  setWalletClient: vi.fn(() => ({ provider: {} })),
}));

vi.mock('@/utils/erc725Client', () => ({
  getErc725Read: vi.fn(() => ({})),
  getReadProvider: vi.fn(() => ({})),
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

vi.mock('@/utils/upAddress', () => ({
  canReadAsUniversalProfile: (...args: any[]) =>
    canReadAsUniversalProfileMock(...args),
  resolveMainControllerForUP: (...args: any[]) =>
    resolveMainControllerForUPMock(...args),
  resolveUniversalProfileAddress: (...args: any[]) =>
    resolveUniversalProfileAddressMock(...args),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({}),
}));

vi.mock('ethers', async () => {
  const actual = await vi.importActual<any>('ethers');
  return {
    ...actual,
    verifyMessage: vi.fn(() => '0x2222222222222222222222222222222222222222'),
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

const ProfileStatus = () => {
  const { isConnected, profileDetailsData } = useProfile();
  return (
    <div>
      {isConnected ? profileDetailsData?.upWallet : 'disconnected'}
    </div>
  );
};

describe('ProfileProvider connect flow', () => {
  const originalUserAgent =
    typeof navigator === 'undefined' ? '' : navigator.userAgent;

  beforeEach(() => {
    openConnectModalMock.mockReset();
    openChainModalMock.mockReset();
    switchChainAsyncMock.mockReset();
    disconnectMock.mockReset();
    connectAsyncMock.mockReset();
    walletClientMock.signMessage.mockClear();
    useAccountMock.mockReset();
    useWalletClientMock.mockReset();
    resolveUniversalProfileAddressMock.mockReset();
    resolveMainControllerForUPMock.mockReset();
    canReadAsUniversalProfileMock.mockReset();
    localStorage.clear();
    resolveUniversalProfileAddressMock.mockImplementation(
      async (_provider: unknown, connectedAddress: string) => ({
        upAddress: connectedAddress,
        source: 'up',
      })
    );
    resolveMainControllerForUPMock.mockImplementation(
      async (
        _provider: unknown,
        _upAddress: string,
        recoveredController: string
      ) => recoveredController
    );
    canReadAsUniversalProfileMock.mockResolvedValue(true);
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(window.navigator, 'userAgent', {
        configurable: true,
        value: originalUserAgent,
      });
    }
  });

  it('opens connect modal when wallet is not connected', async () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
    });
    useAccountMock.mockReturnValue({
      address: undefined,
      chainId: undefined,
      isConnected: false,
      connector: undefined,
    });
    useWalletClientMock.mockReturnValue({ data: null });

    render(
      <ProfileProvider>
        <ConnectOnMount />
      </ProfileProvider>
    );

    await waitFor(() => {
      expect(openConnectModalMock).toHaveBeenCalledTimes(1);
    });
  });

  it('signs and stores profile data when wallet is connected', async () => {
    useAccountMock.mockReturnValue({
      address: walletClientMock.account.address,
      chainId: 42,
      isConnected: true,
      connector: { id: 'lukso' },
    });
    useWalletClientMock.mockReturnValue({ data: walletClientMock });

    render(
      <ProfileProvider>
        <ConnectOnMount />
        <ProfileStatus />
      </ProfileProvider>
    );

    await waitFor(() => {
      expect(walletClientMock.signMessage).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(walletClientMock.account.address)).toBeInTheDocument();
    });
  });
});
