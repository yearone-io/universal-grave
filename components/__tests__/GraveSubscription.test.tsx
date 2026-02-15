import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@/src/test/testUtils';
import GraveSubscription from '../GraveSubscription';

const mockUseProfile = vi.fn();
const mockUseGrave = vi.fn();
const mockGetForwarderAssistantConfig = vi.fn();
const mockGetAllWhitelistAddresses = vi.fn();
const mockSaveForwarderAssistantConfig = vi.fn();
const mockGetRegisteredVaults = vi.fn();
const mockIsVaultRegistered = vi.fn();
const mockRegisterVaultWithUP = vi.fn();
const mockHasVaultURDSet = vi.fn();
const mockSetVaultURD = vi.fn();
const mockDoesControllerHaveMissingPermissions = vi.fn();
const mockSubscribeAndConfigureGrave = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ networkName: 'lukso' }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual<any>('@chakra-ui/react');
  const toastMock: any = vi.fn();
  toastMock.isActive = vi.fn(() => false);
  toastMock.close = vi.fn();
  return {
    ...actual,
    useToast: () => toastMock,
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
  getNetworkByName: (networkName: string) =>
    networkName === 'lukso'
      ? { chainId: 42, displayName: 'LUKSO Mainnet' }
      : null,
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
  hasVaultURDSet: (...args: any[]) => mockHasVaultURDSet(...args),
  setVaultURD: (...args: any[]) => mockSetVaultURD(...args),
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
  getWalletSignerForUP: vi.fn().mockResolvedValue({}),
  sendUPMethodTx: vi.fn().mockResolvedValue({
    hash: '0x123',
    wait: vi.fn().mockResolvedValue(undefined),
  }),
  hasWalletProvider: vi.fn(() => true),
}));

vi.mock('@/utils/uapSubscription', () => ({
  subscribeToUAP: vi.fn(),
  unsubscribeFromUAP: vi.fn(),
  subscribeAndConfigureGrave: (...args: any[]) =>
    mockSubscribeAndConfigureGrave(...args),
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
    mockHasVaultURDSet.mockReset();
    mockSetVaultURD.mockReset();
    mockDoesControllerHaveMissingPermissions.mockReset();
    mockSubscribeAndConfigureGrave.mockReset();

    mockUseProfile.mockReturnValue({
      profileDetailsData: {
        upWallet: '0x1234567890123456789012345678901234567890',
        mainUPController: '0x9999999999999999999999999999999999999999',
      },
      isConnected: true,
      hasActiveSignature: true,
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
    mockHasVaultURDSet.mockResolvedValue(true);
    mockSetVaultURD.mockResolvedValue(undefined);
    mockSubscribeAndConfigureGrave.mockResolvedValue(undefined);
  });

  it('labels legacy vault entries in the vault selector', async () => {
    const legacyVault = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    mockUseGrave.mockReturnValue({
      hasUAPSubscription: false,
      setupType: 'none',
      uapVaultAddress: null,
      graveVault: legacyVault,
      refreshGraveData: vi.fn(),
      isLoadingGraveData: false,
    });
    mockGetForwarderAssistantConfig.mockResolvedValue(
      makeConfig({
        isConfigured: false,
      })
    );

    render(<GraveSubscription networkName="lukso" />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    expect(screen.getByRole('option', { name: /Legacy Vault/i })).toBeInTheDocument();
  });

  it('calls subscribeAndConfigureGrave when enabling protection', async () => {
    mockUseGrave.mockReturnValue({
      hasUAPSubscription: false,
      setupType: 'none',
      uapVaultAddress: null,
      graveVault: null,
      refreshGraveData: vi.fn(),
      isLoadingGraveData: false,
    });
    mockGetForwarderAssistantConfig.mockResolvedValue(
      makeConfig({
        isConfigured: false,
      })
    );

    render(<GraveSubscription networkName="lukso" />);

    const enableButton = await waitFor(() =>
      screen.getByRole('button', { name: /Enable Protection/i })
    );
    await userEvent.click(enableButton);

    await waitFor(() => {
      expect(mockSubscribeAndConfigureGrave).toHaveBeenCalled();
    });

    const args = mockSubscribeAndConfigureGrave.mock.calls[0];
    expect(args[1]).toBe('0x1234567890123456789012345678901234567890');
    expect(args[3]).toBe(VAULT_ADDRESS);
  });

  it('keeps save disabled when no filter changes are made', async () => {
    mockGetForwarderAssistantConfig.mockResolvedValue(
      makeConfig({
        curatedListAddress: '0x5555555555555555555555555555555555555555',
      })
    );

    render(<GraveSubscription networkName="lukso" />);

    const configureButton = await waitFor(() =>
      screen.getByRole('button', { name: /Configure Filters/i })
    );
    await userEvent.click(configureButton);

    const saveButton = await waitFor(() =>
      screen.getByRole('button', { name: /save changes/i })
    );
    expect(saveButton).toBeDisabled();
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

    render(<GraveSubscription networkName="lukso" />);

    const configureButton = await waitFor(() =>
      screen.getByRole('button', { name: /Configure Filters/i })
    );
    await userEvent.click(configureButton);

    const curatedInputs = await waitFor(() =>
      screen.getAllByPlaceholderText(
        /0x\.\.\. or paste a custom curated list address/i
      )
    );
    await userEvent.clear(curatedInputs[1]);

    const saveButton = await waitFor(() =>
      screen.getByRole('button', { name: /save changes/i })
    );
    expect(saveButton).toBeEnabled();
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
    expect(args[4]).toBe(false);
  });
});
