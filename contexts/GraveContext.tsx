'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { BrowserProvider } from 'ethers';
import { useProfile } from './ProfileProvider';
import { getUpAddressUrds, IUPForwarderData } from '@/utils/urdUtils';
import { getGraveVaultFor } from '@/utils/universalProfile';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { detectGraveSetup } from '@/utils/uapUtils';

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
  const { profileDetailsData, isConnected, chainId } = useProfile();

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

  const setURDLsp7 = (urd: string | null) => {
    setURDLsp7State(urd);
  };

  const setURDLsp8 = (urd: string | null) => {
    setURDLsp8State(urd);
  };

  const addGraveVault = (vault: string) => {
    setGraveVault(vault);
  };

  const refreshGraveData = async () => {
    if (!isConnected || !profileDetailsData?.upWallet || !chainId) {
      console.log('GraveContext: Skipping refreshGraveData, missing data');
      return;
    }

    const currentNetwork = supportedNetworks[chainId];
    if (!currentNetwork) {
      console.log('GraveContext: Network not supported');
      return;
    }

    setIsLoadingGraveData(true);
    try {
      // Get provider
      if (!window.lukso) {
        throw new Error('No wallet provider detected');
      }
      const provider = new BrowserProvider(window.lukso);

      // Detect GRAVE setup type (legacy vs UAP)
      const setupInfo = await detectGraveSetup(
        provider,
        profileDetailsData.upWallet,
        {
          protocolAddress: currentNetwork.protocolAddress,
          universalGraveForwarder: currentNetwork.universalGraveForwarder,
          previousGraveForwarders: currentNetwork.previousGraveForwarders,
          forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
          addressListScreenerAddress: currentNetwork.addressListScreenerAddress,
          curatedListScreenerAddress: currentNetwork.curatedListScreenerAddress,
        }
      );

      // Update state with detected setup
      setHasUAPSubscription(setupInfo.hasUAPSubscription);
      setHasLegacyGrave(setupInfo.hasLegacyGrave);
      setSetupType(setupInfo.setupType);
      setUapVaultAddress(setupInfo.uapVaultAddress);
      setGraveVault(setupInfo.legacyVaultAddress || undefined);

      // Also fetch legacy URD data for backward compatibility
      try {
        const urdData: IUPForwarderData = await getUpAddressUrds(
          provider,
          profileDetailsData.upWallet
        );
        setURDLsp7State(urdData.lsp7Urd);
        setURDLsp8State(urdData.lsp8Urd);
        setOldUrdVersion(urdData.oldUrdVersion);
      } catch (urdError) {
        console.warn('GraveContext: Could not fetch legacy URD data', urdError);
      }

      console.log('GraveContext: Refreshed GRAVE data', {
        setupType: setupInfo.setupType,
        hasUAPSubscription: setupInfo.hasUAPSubscription,
        hasLegacyGrave: setupInfo.hasLegacyGrave,
        uapVault: setupInfo.uapVaultAddress,
        legacyVault: setupInfo.legacyVaultAddress,
      });
    } catch (error) {
      console.error('GraveContext: Error refreshing GRAVE data', error);
    } finally {
      setIsLoadingGraveData(false);
    }
  };

  // Refresh GRAVE data when profile changes
  useEffect(() => {
    if (isConnected && profileDetailsData?.upWallet) {
      refreshGraveData();
    } else {
      // Clear GRAVE data when disconnected
      setGraveVault(undefined);
      setURDLsp7State(null);
      setURDLsp8State(null);
      setOldUrdVersion(null);
      setHasUAPSubscription(false);
      setHasLegacyGrave(false);
      setSetupType('none');
      setUapVaultAddress(null);
    }
  }, [isConnected, profileDetailsData?.upWallet, chainId]);

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
