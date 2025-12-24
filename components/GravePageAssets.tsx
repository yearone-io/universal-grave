'use client';
import LSPAssets from '@/components/LSPAssets';
import { useEffect, useState } from 'react';
import { getGraveVaultFor } from '@/utils/universalProfile';
import { Text } from '@chakra-ui/react';
import { getUpAddressUrds } from '@/utils/urdUtils';
import { useProfile } from '@/contexts/ProfileProvider';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { BrowserProvider } from 'ethers';
import { getForwarderAssistantConfig } from '@/utils/assistantConfig';

export default function GravePageAssets({
  graveOwner,
  vaultAddressOverride,
}: {
  graveOwner: string;
  vaultAddressOverride?: string | null;
}) {
  const { chainId } = useProfile();
  const [graveVault, setGraveVault] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const networkConfig = chainId ? supportedNetworks[chainId.toString()] : null;

  // Use override if provided
  useEffect(() => {
    if (vaultAddressOverride) {
      setGraveVault(vaultAddressOverride);
    }
  }, [vaultAddressOverride]);

  useEffect(() => {
    const fetchGraveVault = async () => {
      // Skip fetching if vault override is provided
      if (vaultAddressOverride) return;

      if (!graveVault && networkConfig && window.lukso) {
        try {
          const provider = new BrowserProvider(window.lukso);

          // First, try to get vault from UAP forwarder assistant configuration
          const forwarderConfig = await getForwarderAssistantConfig(
            provider,
            graveOwner,
            {
              forwarderAssistantAddress:
                networkConfig.forwarderAssistantAddress,
              addressListScreenerAddress:
                networkConfig.addressListScreenerAddress,
              curatedListScreenerAddress:
                networkConfig.curatedListScreenerAddress,
              creatorListScreenerAddress:
                networkConfig.creatorListScreenerAddress,
              creatorCurationScreenerAddress:
                networkConfig.creatorCurationScreenerAddress,
            }
          );

          if (forwarderConfig.vaultAddress) {
            setGraveVault(forwarderConfig.vaultAddress);
            return;
          }

          // Fallback to legacy GRAVE forwarder for backwards compatibility
          const vault = await getGraveVaultFor(
            provider,
            graveOwner,
            networkConfig.universalGraveForwarder
          );
          if (vault) {
            setGraveVault(vault);
            return;
          }

          // Attempt to retrieve grave vault for users with an old Urd version
          const urdData = await getUpAddressUrds(provider, graveOwner);
          if (urdData.oldUrdVersion) {
            const oldGraveVault = await getGraveVaultFor(
              provider,
              graveOwner,
              urdData.oldUrdVersion
            );
            if (oldGraveVault) {
              setGraveVault(oldGraveVault);
              return;
            }
          }
          setError('No GRAVE vault found for this account');
        } catch (error) {
          console.error(error);
          setError('Error fetching GRAVE vault');
        }
      }
    };

    fetchGraveVault();
  }, [graveOwner, graveVault, networkConfig, vaultAddressOverride]);

  if (error) {
    return <Text>{error}</Text>;
  }
  return graveVault ? (
    <LSPAssets graveVault={graveVault} graveOwner={graveOwner} />
  ) : (
    <>Loading...</>
  );
}
