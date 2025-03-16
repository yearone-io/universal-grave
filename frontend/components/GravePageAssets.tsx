'use client';
import LSPAssets from '@/components/LSPAssets';
import { useEffect, useState } from 'react';
import { getGraveVault } from '@/utils/universalProfile';
import { Text } from '@chakra-ui/react';
import { getUpAddressUrds } from '@/utils/urdUtils';
import { networkNameToIdMapping, supportedNetworks } from '@/constants/supportedNetworks';
import { useConnectedAccount } from '@/contexts/ConnectedAccountProvider';

export default function GravePageAssets({
  networkName,
  graveOwner,
}: {
  networkName: string;
  graveOwner: string;
}) {
  const [graveVault, setGraveVault] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const networkId = networkNameToIdMapping[networkName];
  const { graveAssistant } = supportedNetworks[networkId];
  const { globalProvider } = useConnectedAccount();

  useEffect(() => {
    const fetchGraveVault = async () => {
      if (!graveVault) {
        try {
          const graveVault = await getGraveVault(
            globalProvider,
            graveOwner,
            graveAssistant.address
          );
          if (graveVault) {
            setGraveVault(graveVault);
            return;
          }
          // Attempt to retrieve grave vault for users with an old Urd version
          console.log('Attempting to retrieve existing grave vault');
          const urdData = await getUpAddressUrds(globalProvider, graveOwner);
          if (urdData.oldUrdVersion) {
            const oldGraveVault = await getGraveVault(
              globalProvider,
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
    networkId,
    setGraveVault,
    setError,
  ]);

  if (error) {
    return <Text>{error}</Text>;
  }
  return graveVault ? (
    <LSPAssets networkName={networkName} graveVault={graveVault} graveOwner={graveOwner} />
  ) : (
    <>Loading...</>
  );
}
