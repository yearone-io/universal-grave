import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/src/test/testUtils';
import SignInButton from '../SignInButton';

const mockUseProfile = vi.fn();

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
  });

  it('should prompt network switch when mismatch', async () => {
    const connectAndSign = vi.fn();
    const switchNetwork = vi.fn();
    mockUseProfile.mockReturnValue({
      connectAndSign,
      switchNetwork,
      expectedChainId: 42,
      isNetworkMismatch: true,
    });

    render(<SignInButton />);

    expect(screen.getByText('Switch to LUKSO Mainnet')).toBeInTheDocument();

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
    });

    render(<SignInButton />);

    expect(screen.getByText('Sign In')).toBeInTheDocument();

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(connectAndSign).toHaveBeenCalled();
    expect(switchNetwork).not.toHaveBeenCalled();
  });
});
