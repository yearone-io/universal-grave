'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useProfile } from './ProfileProvider';
import { getUpAddressUrds, IUPForwarderData } from '@/utils/urdUtils';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { detectGraveSetup } from '@/utils/uapUtils';
import { getReadProvider } from '@/utils/erc725Client';

interface GraveContextType {
  // Legacy GRAVE vault (from old forwarder)
  graveVault: string | undefined;
  URDLsp7: string | null;
  URDLsp8: string | null;
  oldUrdVersion: string | null;

  // UAP-based GRAVE detection
  hasUAPSubscription: boolean;
  hasLegacyGrave: boolean;
  setupType: 'none' | 'legacy' | 'uap' | 'both';
  uapVaultAddress: string | null;

  // Methods
  setURDLsp7: (urd: string | null) => void;
  setURDLsp8: (urd: string | null) => void;
  addGraveVault: (graveVault: string) => void;
  refreshGraveData: () => Promise<void>;
  isLoadingGraveData: boolean;
}

const GraveContext = createContext<GraveContextType | undefined>(undefined);

export function GraveProvider({ children }: { children: React.ReactNode }) {
  const { profileDetailsData, isConnected, chainId, isNetworkMismatch } =
    useProfile();

  // Legacy GRAVE state
  const [graveVault, setGraveVault] = useState<string | undefined>(undefined);
  const [URDLsp7, setURDLsp7State] = useState<string | null>(null);
  const [URDLsp8, setURDLsp8State] = useState<string | null>(null);
  const [oldUrdVersion, setOldUrdVersion] = useState<string | null>(null);

  // UAP-based GRAVE state
  const [hasUAPSubscription, setHasUAPSubscription] = useState(false);
  const [hasLegacyGrave, setHasLegacyGrave] = useState(false);
  const [setupType, setSetupType] = useState<
    'none' | 'legacy' | 'uap' | 'both'
  >('none');
  const [uapVaultAddress, setUapVaultAddress] = useState<string | null>(null);

  const [isLoadingGraveData, setIsLoadingGraveData] = useState(false);

  // Track the current refresh operation to prevent concurrent fetches
  const refreshInProgressRef = useRef(false);
  const lastRefreshParamsRef = useRef<string | null>(null);

  const setURDLsp7 = useCallback((urd: string | null) => {
    setURDLsp7State(urd);
  }, []);

  const setURDLsp8 = useCallback((urd: string | null) => {
    setURDLsp8State(urd);
  }, []);

  const addGraveVault = useCallback((vault: string) => {
    setGraveVault(vault);
  }, []);

  const refreshGraveData = useCallback(async () => {
    if (isNetworkMismatch) {
      return;
    }
    if (!isConnected || !profileDetailsData?.upWallet || !chainId) {
      return;
    }

    const currentNetwork = supportedNetworks[chainId];
    if (!currentNetwork) {
      return;
    }

    // Create a unique key for this refresh request
    const refreshKey = `${profileDetailsData.upWallet}-${chainId}`;

    // Prevent concurrent refreshes for the same params
    if (refreshInProgressRef.current && lastRefreshParamsRef.current === refreshKey) {
      return;
    }

    refreshInProgressRef.current = true;
    lastRefreshParamsRef.current = refreshKey;
    setIsLoadingGraveData(true);

    try {
      const readProvider = getReadProvider(
        currentNetwork.chainId,
        currentNetwork.rpcUrl
      );

      // Detect GRAVE setup type (legacy vs UAP)
      const setupInfo = await detectGraveSetup(
        readProvider,
        profileDetailsData.upWallet,
        {
          protocolAddress: currentNetwork.protocolAddress,
          universalGraveForwarder: currentNetwork.universalGraveForwarder,
          previousGraveForwarders: currentNetwork.previousGraveForwarders,
          forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
          addressListScreenerAddress: currentNetwork.addressListScreenerAddress,
          curatedListScreenerAddress: currentNetwork.curatedListScreenerAddress,
          creatorListScreenerAddress: currentNetwork.creatorListScreenerAddress,
          creatorCurationScreenerAddress: currentNetwork.creatorCurationScreenerAddress,
        }
      );

      // Check if params changed during the async operation
      if (lastRefreshParamsRef.current !== refreshKey) {
        return;
      }

      // Update state with detected setup
      setHasUAPSubscription(setupInfo.hasUAPSubscription);
      setHasLegacyGrave(setupInfo.hasLegacyGrave);
      setSetupType(setupInfo.setupType);
      setUapVaultAddress(setupInfo.uapVaultAddress);
      setGraveVault(setupInfo.legacyVaultAddress || undefined);

      // Also fetch legacy URD data for backward compatibility
      try {
        const urdData: IUPForwarderData = await getUpAddressUrds(
          readProvider,
          profileDetailsData.upWallet
        );
        // Check again before setting URD state
        if (lastRefreshParamsRef.current === refreshKey) {
          setURDLsp7State(urdData.lsp7Urd);
          setURDLsp8State(urdData.lsp8Urd);
          setOldUrdVersion(urdData.oldUrdVersion);
        }
      } catch (urdError) {
        // Silently ignore URD fetch errors
      }
    } catch (error) {
      // Silently ignore refresh errors
    } finally {
      // Only clear the in-progress flag if this is still the current refresh
      if (lastRefreshParamsRef.current === refreshKey) {
        refreshInProgressRef.current = false;
        setIsLoadingGraveData(false);
      }
    }
  }, [isConnected, profileDetailsData?.upWallet, chainId, isNetworkMismatch]);

  // Refresh GRAVE data when profile changes
  useEffect(() => {
    if (isConnected && profileDetailsData?.upWallet && !isNetworkMismatch) {
      refreshGraveData();
    } else {
      // Clear GRAVE data when disconnected
      refreshInProgressRef.current = false;
      lastRefreshParamsRef.current = null;
      setGraveVault(undefined);
      setURDLsp7State(null);
      setURDLsp8State(null);
      setOldUrdVersion(null);
      setHasUAPSubscription(false);
      setHasLegacyGrave(false);
      setSetupType('none');
      setUapVaultAddress(null);
    }
  }, [isConnected, profileDetailsData?.upWallet, chainId, isNetworkMismatch, refreshGraveData]);

  const contextValue = useMemo(
    () => ({
      // Legacy GRAVE
      graveVault,
      URDLsp7,
      URDLsp8,
      oldUrdVersion,

      // UAP-based GRAVE
      hasUAPSubscription,
      hasLegacyGrave,
      setupType,
      uapVaultAddress,

      // Methods
      setURDLsp7,
      setURDLsp8,
      addGraveVault,
      refreshGraveData,
      isLoadingGraveData,
    }),
    [
      graveVault,
      URDLsp7,
      URDLsp8,
      oldUrdVersion,
      hasUAPSubscription,
      hasLegacyGrave,
      setupType,
      uapVaultAddress,
      isLoadingGraveData,
      setURDLsp7,
      setURDLsp8,
      addGraveVault,
      refreshGraveData,
    ]
  );

  return (
    <GraveContext.Provider value={contextValue}>
      {children}
    </GraveContext.Provider>
  );
}

export const useGrave = () => {
  const context = useContext(GraveContext);
  if (!context) {
    throw new Error('useGrave must be used within a GraveProvider');
  }
  return context;
};
