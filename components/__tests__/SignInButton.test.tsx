import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/src/test/testUtils';
import SignInButton from '../SignInButton';

const mockUseProfile = vi.fn();
const originalUserAgent =
  typeof navigator === 'undefined' ? '' : navigator.userAgent;

vi.mock('@/contexts/ProfileProvider', () => ({
  useProfile: () => mockUseProfile(),
}));

vi.mock('@/constants/supportedNetworks', () => ({
  supportedNetworks: {
    42: { displayName: 'LUKSO Mainnet' },
  },
}));

describe('SignInButton', () => {
  beforeEach(() => {
    mockUseProfile.mockReset();
    (window as any).lukso = undefined;
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(window.navigator, 'userAgent', {
        configurable: true,
        value: originalUserAgent,
      });
    }
  });

  it('should prompt network switch when mismatch', async () => {
    const connectAndSign = vi.fn();
    const switchNetwork = vi.fn();
    mockUseProfile.mockReturnValue({
      connectAndSign,
      switchNetwork,
      expectedChainId: 42,
      isNetworkMismatch: true,
      isSigningIn: false,
    });

    render(<SignInButton />);

    expect(screen.getByText(/^Switch(?: to LUKSO Mainnet)?$/)).toBeInTheDocument();

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(switchNetwork).toHaveBeenCalledWith(42);
    expect(connectAndSign).not.toHaveBeenCalled();
  });

  it('should connect when on correct network', async () => {
    const connectAndSign = vi.fn();
    const switchNetwork = vi.fn();
    mockUseProfile.mockReturnValue({
      connectAndSign,
      switchNetwork,
      expectedChainId: 42,
      isNetworkMismatch: false,
      isSigningIn: false,
    });

    render(<SignInButton />);

    expect(screen.getByText('Sign In')).toBeInTheDocument();

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(connectAndSign).toHaveBeenCalled();
    expect(switchNetwork).not.toHaveBeenCalled();
  });

  it('shows loading state while sign-in is pending', () => {
    mockUseProfile.mockReturnValue({
      connectAndSign: vi.fn(),
      switchNetwork: vi.fn(),
      expectedChainId: 42,
      isNetworkMismatch: false,
      isSigningIn: true,
    });

    render(<SignInButton />);

    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('shows a mobile prompt while waiting for app confirmation', async () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
    });

    mockUseProfile.mockReturnValue({
      connectAndSign: vi.fn(),
      switchNetwork: vi.fn(),
      expectedChainId: 42,
      isNetworkMismatch: false,
      isSigningIn: true,
    });

    render(<SignInButton />);

    expect(
      await screen.findByText(/Select profile, sign, then return here\./i)
    ).toBeInTheDocument();
  });
});
