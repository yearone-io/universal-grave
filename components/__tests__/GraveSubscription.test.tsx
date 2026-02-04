import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@/src/test/testUtils';
import GraveSubscription from '../GraveSubscription';
import { ZERO_ADDRESS } from '@/constants/addresses';

const mockUseProfile = vi.fn();
const mockUseGrave = vi.fn();
const mockGetForwarderAssistantConfig = vi.fn();
const mockGetAllWhitelistAddresses = vi.fn();
const mockSaveForwarderAssistantConfig = vi.fn();
const mockGetRegisteredVaults = vi.fn();
const mockIsVaultRegistered = vi.fn();
const mockRegisterVaultWithUP = vi.fn();
const mockDoesControllerHaveMissingPermissions = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ networkName: 'lukso' }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual<any>('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => vi.fn(),
  };
});

vi.mock('@/contexts/ProfileProvider', () => ({
  useProfile: () => mockUseProfile(),
}));

vi.mock('@/contexts/GraveContext', () => ({
  useGrave: () => mockUseGrave(),
}));

vi.mock('@/constants/supportedNetworks', () => ({
  supportedNetworks: {
    42: {
      chainId: 42,
      protocolAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      forwarderAssistantAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      addressListScreenerAddress: '0xcccccccccccccccccccccccccccccccccccccccc',
      curatedListScreenerAddress: '0xdddddddddddddddddddddddddddddddddddddddd',
      creatorListScreenerAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      creatorCurationScreenerAddress:
        '0xffffffffffffffffffffffffffffffffffffffff',
      universalGraveForwarder: '0x1111111111111111111111111111111111111111',
      explorer: 'https://explorer.example',
    },
  },
}));

vi.mock('@/utils/assistantConfig', () => ({
  getForwarderAssistantConfig: (...args: any[]) =>
    mockGetForwarderAssistantConfig(...args),
  getAllWhitelistAddresses: (...args: any[]) =>
    mockGetAllWhitelistAddresses(...args),
  saveForwarderAssistantConfig: (...args: any[]) =>
    mockSaveForwarderAssistantConfig(...args),
  removeForwarderAssistant: vi.fn(),
  updateForwarderVaultAddress: vi.fn(),
}));

vi.mock('@/utils/vaultCreation', () => ({
  getRegisteredVaults: (...args: any[]) => mockGetRegisteredVaults(...args),
  isVaultRegistered: (...args: any[]) => mockIsVaultRegistered(...args),
  registerVaultWithUP: (...args: any[]) => mockRegisterVaultWithUP(...args),
  deployVault: vi.fn(),
}));

vi.mock('@/utils/urdUtils', () => ({
  doesControllerHaveMissingPermissions: (...args: any[]) =>
    mockDoesControllerHaveMissingPermissions(...args),
  updateBECPermissions: vi.fn(),
}));

vi.mock('@/utils/walletClient', () => ({
  assertWalletNetwork: vi.fn(),
  getWalletProvider: vi.fn(() => ({})),
  getWalletSigner: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/utils/uapSubscription', () => ({
  subscribeToUAP: vi.fn(),
  unsubscribeFromUAP: vi.fn(),
  subscribeAndConfigureGrave: vi.fn(),
}));

vi.mock('@/components/VaultURDChecker', () => ({
  default: () => <div>VaultURDChecker</div>,
}));

const VAULT_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const makeConfig = (overrides: Partial<any> = {}) => ({
  vaultAddress: VAULT_ADDRESS,
  whitelistAddresses: [],
  curatedListAddress: '',
  useCuratedList: false,
  isConfigured: true,
  executionOrderLSP7: 0,
  executionOrderLSP8: 0,
  listName: 'GraveSafeAssets',
  listLengthMissing: false,
  addressScreenerConfigMissing: false,
  addressListNameMissing: false,
  creatorWhitelistAddresses: [],
  creatorCuratedListAddress: '',
  requireAllCreatorsForList: false,
  requireAllCreatorsForCuration: false,
  creatorListName: 'GraveSafeCreators',
  creatorListLengthMissing: false,
  creatorScreenerConfigMissing: false,
  creatorListNameMissing: false,
  ...overrides,
});

describe('GraveSubscription unique flows', () => {
  beforeEach(() => {
    mockUseProfile.mockReset();
    mockUseGrave.mockReset();
    mockGetForwarderAssistantConfig.mockReset();
    mockGetAllWhitelistAddresses.mockReset();
    mockSaveForwarderAssistantConfig.mockReset();
    mockGetRegisteredVaults.mockReset();
    mockIsVaultRegistered.mockReset();
    mockRegisterVaultWithUP.mockReset();
    mockDoesControllerHaveMissingPermissions.mockReset();

    mockUseProfile.mockReturnValue({
      profileDetailsData: {
        upWallet: '0x1234567890123456789012345678901234567890',
        mainUPController: '0x9999999999999999999999999999999999999999',
      },
      isConnected: true,
      chainId: 42,
      isNetworkMismatch: false,
    });

    mockUseGrave.mockReturnValue({
      hasUAPSubscription: true,
      setupType: 'uap',
      uapVaultAddress: null,
      graveVault: null,
      refreshGraveData: vi.fn(),
      isLoadingGraveData: false,
    });

    mockDoesControllerHaveMissingPermissions.mockResolvedValue([]);
    mockGetRegisteredVaults.mockResolvedValue([VAULT_ADDRESS]);
    mockIsVaultRegistered.mockResolvedValue(true);
  });

  it('shows missing config warnings and migration CTA for non-standard list name', async () => {
    mockGetForwarderAssistantConfig.mockResolvedValue(
      makeConfig({
        listName: 'LegacyList',
        listLengthMissing: true,
        addressListNameMissing: true,
        addressScreenerConfigMissing: true,
        creatorListLengthMissing: true,
        creatorListNameMissing: true,
        creatorScreenerConfigMissing: true,
      })
    );

    render(<GraveSubscription />);

    await waitFor(() => {
      expect(screen.getByText('SAVE CHANGES')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Creator List Configuration Issue/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Asset List Configuration Issue/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Non-Standard List Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /migrate/i })).toBeInTheDocument();
  });

  it('migrates list name with merged addresses and forceListNameUpdate', async () => {
    mockGetForwarderAssistantConfig.mockResolvedValue(
      makeConfig({
        listName: 'LegacyList',
        curatedListAddress: ZERO_ADDRESS,
        creatorWhitelistAddresses: [
          '0x1111111111111111111111111111111111111111',
          'not-an-address',
        ],
      })
    );

    mockGetAllWhitelistAddresses.mockResolvedValue({
      addresses: [
        '0x2222222222222222222222222222222222222222',
        '0x3333333333333333333333333333333333333333',
      ],
      lsp7Addresses: [
        '0x2222222222222222222222222222222222222222',
      ],
      lsp8Addresses: [
        '0x3333333333333333333333333333333333333333',
      ],
      listNameLSP7: 'LegacyList',
      listNameLSP8: 'LegacyList',
    });

    render(<GraveSubscription />);

    const migrateButton = await waitFor(() =>
      screen.getByRole('button', { name: /migrate/i })
    );
    await userEvent.click(migrateButton);

    await waitFor(() => {
      expect(mockSaveForwarderAssistantConfig).toHaveBeenCalled();
    });

    const args = mockSaveForwarderAssistantConfig.mock.calls[0];
    expect(args[2]).toBe(VAULT_ADDRESS); // vaultAddress
    expect(args[3]).toEqual([
      '0x2222222222222222222222222222222222222222',
      '0x3333333333333333333333333333333333333333',
    ]);
    expect(args[4]).toBe(false); // shouldUseCuratedList (ZERO_ADDRESS)
    expect(args[6]).toEqual([
      '0x1111111111111111111111111111111111111111',
    ]); // filtered creator list
    expect(args[13]).toEqual({ forceListNameUpdate: true });
  });

  it('disables save when curated list address is zero', async () => {
    mockGetForwarderAssistantConfig.mockResolvedValue(
      makeConfig({
        curatedListAddress: ZERO_ADDRESS,
      })
    );

    render(<GraveSubscription />);

    const saveButton = await waitFor(() =>
      screen.getByRole('button', { name: /save changes/i })
    );
    expect(saveButton).toBeDisabled();
  });

  it('uses default config payload when subscribed but config incomplete', async () => {
    mockGetForwarderAssistantConfig.mockResolvedValue(
      makeConfig({
        isConfigured: false,
        listName: null,
        executionOrderLSP7: null,
        executionOrderLSP8: null,
      })
    );

    render(<GraveSubscription />);

    const installButton = await waitFor(() =>
      screen.getByRole('button', { name: /install protocol/i })
    );
    await userEvent.click(installButton);

    await waitFor(() => {
      expect(mockSaveForwarderAssistantConfig).toHaveBeenCalled();
    });

    const args = mockSaveForwarderAssistantConfig.mock.calls[0];
    expect(args[3]).toEqual([]); // whitelist
    expect(args[4]).toBe(false); // useCuratedList
    expect(args[5]).toBe(''); // curated list address
    expect(args[6]).toEqual([]); // creator whitelist
    expect(args[7]).toBeNull(); // creator curated list
  });

  it('trims address lists before saving', async () => {
    mockGetForwarderAssistantConfig.mockResolvedValue(
      makeConfig({
        whitelistAddresses: [
          ' 0x4444444444444444444444444444444444444444 ',
          '',
        ],
        curatedListAddress: '0x5555555555555555555555555555555555555555',
        creatorWhitelistAddresses: [
          ' 0x6666666666666666666666666666666666666666 ',
          ' ',
        ],
      })
    );

    render(<GraveSubscription />);

    const saveButton = await waitFor(() =>
      screen.getByRole('button', { name: /save changes/i })
    );
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveForwarderAssistantConfig).toHaveBeenCalled();
    });

    const args = mockSaveForwarderAssistantConfig.mock.calls[0];
    expect(args[3]).toEqual([
      '0x4444444444444444444444444444444444444444',
    ]);
    expect(args[6]).toEqual([
      '0x6666666666666666666666666666666666666666',
    ]);
  });
});
