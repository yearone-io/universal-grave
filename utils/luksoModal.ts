'use client';

import { wagmiConfig } from '@/utils/wagmiConfig';

const MODAL_CONNECTORS = {
  eoa: false,
  upMobile: true,
  upExtension: true,
  upAppBrowser: true,
} as const;

type SignInModal = {
  showSignInModal: () => void;
};

let setupPromise: Promise<SignInModal> | null = null;
let activeChainId: number | null = null;
let requestedChainId = 42;
const closeListeners = new Set<() => void>();

export function onUpSignInModalClose(listener: () => void) {
  closeListeners.add(listener);
  return () => {
    closeListeners.delete(listener);
  };
}

async function applyChain(chainId: number) {
  const { setupConnectModal } = await import('@lukso/up-modal');
  setupConnectModal({
    wagmiConfig,
    chainId,
    connectors: { ...MODAL_CONNECTORS },
    skipChainSwitch: false,
    walletConnectApprovalToast: true,
  });
  activeChainId = chainId;
}

export async function openUpSignInModal(chainId?: number) {
  if (chainId) requestedChainId = chainId;
  if (!setupPromise) {
    const chainAtStart = requestedChainId;
    setupPromise = (async () => {
      const { setupLuksoConnector } = await import('@lukso/up-modal');
      const modal = await setupLuksoConnector({
        theme: 'dark',
        wagmiConfig,
        chains: { defaultChainId: chainAtStart, skipChainSwitch: false },
        connectors: { ...MODAL_CONNECTORS },
        walletConnect: { enabled: true, showQrModal: false },
        walletConnectApprovalToast: true,
        onClose: () => {
          closeListeners.forEach(listener => listener());
        },
      });
      activeChainId = chainAtStart;
      return modal;
    })().catch(error => {
      setupPromise = null;
      throw error;
    });
  }

  const modal = await setupPromise;
  if (activeChainId !== requestedChainId) {
    await applyChain(requestedChainId);
  }
  modal.showSignInModal();
}
