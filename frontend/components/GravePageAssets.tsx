'use client';
import LSPAssets from '@/components/LSPAssets';
import { useContext, useEffect, useState } from 'react';
import { getGraveVaultFor } from '@/utils/universalProfile';
import { Text } from '@chakra-ui/react';
import { WalletContext } from '@/components/wallet/WalletContext';
import { getUpAddressUrds } from '@/utils/urdUtils';

export default function GravePageAssets({
  graveOwner,
}: {
  graveOwner: string;
}) {
  const walletContext = useContext(WalletContext);
  const { networkConfig, provider } = walletContext;
  const [graveVault, setGraveVault] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const fetchGraveVault = async () => {
      if (!graveVault && provider && networkConfig) {
        try {
          const graveVault = await getGraveVaultFor(
            provider,
            graveOwner,
            networkConfig.universalGraveForwarder
          );
          if (graveVault) {
            setGraveVault(graveVault);
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
  }, [
    graveOwner,
    graveVault,
    provider,
    networkConfig,
    setGraveVault,
    setError,
  ]);

  if (error) {
    return <Text>{error}</Text>;
  }
  return graveVault ? (
    <LSPAssets graveVault={graveVault} graveOwner={graveOwner} />
  ) : (
    <>Loading...</>
  );
}
