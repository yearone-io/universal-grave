import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/src/test/testUtils';
import GraveSettings from '../GraveSettings';

const mockUseProfile = vi.fn();
const mockUseGrave = vi.fn();
const mockHasOlderGraveDelegate = vi.fn();
const mockUrdsMatchLatestForwarder = vi.fn();

vi.mock('@/contexts/ProfileProvider', () => ({
  useProfile: () => mockUseProfile(),
}));

vi.mock('@/contexts/GraveContext', () => ({
  useGrave: () => mockUseGrave(),
}));

vi.mock('@/utils/urdUtils', () => ({
  hasOlderGraveDelegate: (...args: any[]) => mockHasOlderGraveDelegate(...args),
  urdsMatchLatestForwarder: (...args: any[]) =>
    mockUrdsMatchLatestForwarder(...args),
}));

vi.mock('@/constants/supportedNetworks', () => ({
  supportedNetworks: {
    42: {
      universalGraveForwarder:
        '0x9999999999999999999999999999999999999999',
    },
  },
}));

vi.mock('@/components/SignInBox', () => ({
  default: () => <div>SignInBox</div>,
}));

vi.mock('@/components/UpgradeURD', () => ({
  UpgradeURD: ({ oldForwarderAddress }: any) => (
    <div>UpgradeURD:{oldForwarderAddress}</div>
  ),
}));

vi.mock('@/components/GraveSubscription', () => ({
  default: () => <div>GraveSubscription</div>,
}));

vi.mock('@/components/ManageAllowList', () => ({
  default: () => <div>ManageAllowList</div>,
}));

vi.mock('@/components/AdvancedInfoPanel', () => ({
  default: () => <div>AdvancedInfoPanel</div>,
}));

vi.mock('@/components/SendToGravePanel', () => ({
  default: () => <div>SendToGravePanel</div>,
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

describe('GraveSettings', () => {
  beforeEach(() => {
    mockUseProfile.mockReset();
    mockUseGrave.mockReset();
    mockHasOlderGraveDelegate.mockReset();
    mockUrdsMatchLatestForwarder.mockReset();
  });

  it('should show SignInBox when not connected', () => {
    mockUseProfile.mockReturnValue({
      profileDetailsData: null,
      isConnected: false,
      hasActiveSignature: false,
      chainId: 42,
    });
    mockUseGrave.mockReturnValue({
      URDLsp7: null,
      URDLsp8: null,
      oldUrdVersion: null,
      hasUAPSubscription: false,
      setupType: 'none',
    });
    mockHasOlderGraveDelegate.mockReturnValue(null);
    mockUrdsMatchLatestForwarder.mockReturnValue(false);

    render(<GraveSettings networkName="lukso" />);
    expect(screen.getByText('SignInBox')).toBeInTheDocument();
  });

  it('should include Manage Allowlist tab when URDs match latest forwarder', () => {
    mockUseProfile.mockReturnValue({
      profileDetailsData: {
        upWallet: '0x1234567890123456789012345678901234567890',
      },
      isConnected: true,
      hasActiveSignature: true,
      chainId: 42,
    });
    mockUseGrave.mockReturnValue({
      URDLsp7: '0xaaa',
      URDLsp8: '0xbbb',
      oldUrdVersion: null,
      hasUAPSubscription: true,
      setupType: 'uap',
    });
    mockHasOlderGraveDelegate.mockReturnValue(null);
    mockUrdsMatchLatestForwarder.mockReturnValue(true);

    render(<GraveSettings networkName="lukso" />);
    expect(screen.getByText('Manage Allowlist')).toBeInTheDocument();
  });

  it('should render UpgradeURD when old forwarder is detected', async () => {
    mockUseProfile.mockReturnValue({
      profileDetailsData: {
        upWallet: '0x1234567890123456789012345678901234567890',
      },
      isConnected: true,
      hasActiveSignature: true,
      chainId: 42,
    });
    mockUseGrave.mockReturnValue({
      URDLsp7: '0xaaa',
      URDLsp8: '0xbbb',
      oldUrdVersion: null,
      hasUAPSubscription: true,
      setupType: 'uap',
    });
    mockHasOlderGraveDelegate.mockReturnValue(
      '0xold0000000000000000000000000000000000000'
    );
    mockUrdsMatchLatestForwarder.mockReturnValue(true);

    render(<GraveSettings networkName="lukso" />);

    await waitFor(() => {
      expect(screen.getByText(/UpgradeURD:/)).toBeInTheDocument();
    });
  });
});
