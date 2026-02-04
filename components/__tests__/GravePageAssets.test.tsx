import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/src/test/testUtils';
import GravePageAssets from '@/components/GravePageAssets';

const mockUseProfile = vi.fn();

vi.mock('@/contexts/ProfileProvider', () => ({
  useProfile: () => mockUseProfile(),
}));

const getForwarderAssistantConfigMock = vi.fn();
const getGraveVaultForMock = vi.fn();
const getUpAddressUrdsMock = vi.fn();

vi.mock('@/utils/assistantConfig', () => ({
  getForwarderAssistantConfig: (...args: any[]) =>
    getForwarderAssistantConfigMock(...args),
}));

vi.mock('@/utils/universalProfile', () => ({
  getGraveVaultFor: (...args: any[]) => getGraveVaultForMock(...args),
}));

vi.mock('@/utils/urdUtils', () => ({
  getUpAddressUrds: (...args: any[]) => getUpAddressUrdsMock(...args),
}));

describe('GravePageAssets gating', () => {
  beforeEach(() => {
    mockUseProfile.mockReset();
    getForwarderAssistantConfigMock.mockReset();
    getGraveVaultForMock.mockReset();
    getUpAddressUrdsMock.mockReset();
  });

  it('shows mismatch banner and skips fetches when on wrong network', () => {
    mockUseProfile.mockReturnValue({
      chainId: 42,
      expectedChainId: 4201,
      isNetworkMismatch: true,
      isConnected: true,
      switchNetwork: vi.fn(),
    });

    render(<GravePageAssets graveOwner="0x1111111111111111111111111111111111111111" />);

    expect(screen.getByText('Wrong network')).toBeInTheDocument();
    expect(getForwarderAssistantConfigMock).not.toHaveBeenCalled();
    expect(getGraveVaultForMock).not.toHaveBeenCalled();
  });

  it('prompts to connect when wallet is not connected', () => {
    (window as any).lukso = {};
    mockUseProfile.mockReturnValue({
      chainId: 42,
      expectedChainId: 42,
      isNetworkMismatch: false,
      isConnected: false,
      switchNetwork: vi.fn(),
    });

    render(<GravePageAssets graveOwner="0x1111111111111111111111111111111111111111" />);

    expect(
      screen.getByText('Connect your wallet to load this grave.')
    ).toBeInTheDocument();
  });
});
