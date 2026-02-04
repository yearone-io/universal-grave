import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/src/test/testUtils';
import userEvent from '@testing-library/user-event';
import VaultURDChecker from '../VaultURDChecker';

const mockUseProfile = vi.fn();
const mockHasVaultURDSet = vi.fn();
const mockSetVaultURD = vi.fn();

vi.mock('@/contexts/ProfileProvider', () => ({
  useProfile: () => mockUseProfile(),
}));

vi.mock('@/utils/vaultCreation', () => ({
  hasVaultURDSet: (...args: any[]) => mockHasVaultURDSet(...args),
  setVaultURD: (...args: any[]) => mockSetVaultURD(...args),
}));

vi.mock('@/utils/walletClient', () => ({
  getWalletProvider: vi.fn(() => ({})),
  assertWalletNetwork: vi.fn().mockResolvedValue(undefined),
}));

describe('VaultURDChecker', () => {
  beforeEach(() => {
    mockUseProfile.mockReset();
    mockHasVaultURDSet.mockReset();
    mockSetVaultURD.mockReset();
  });

  it('should show activate button when URD is missing and call setVaultURD', async () => {
    mockUseProfile.mockReturnValue({
      profileDetailsData: {
        upWallet: '0x1111111111111111111111111111111111111111',
      },
      isNetworkMismatch: false,
    });
    mockHasVaultURDSet.mockResolvedValue(false);
    mockSetVaultURD.mockResolvedValue(undefined);

    render(
      <VaultURDChecker
        vaultAddress="0x2222222222222222222222222222222222222222"
        networkConfig={{
          lsp1UrdVault: '0x3333333333333333333333333333333333333333',
          chainId: 42,
        }}
      />
    );

    const activateButton = await waitFor(() =>
      screen.getByRole('button', { name: /activate vault/i })
    );
    expect(activateButton).toBeInTheDocument();

    await userEvent.click(activateButton);

    await waitFor(() => {
      expect(mockSetVaultURD).toHaveBeenCalled();
    });
  });
});
