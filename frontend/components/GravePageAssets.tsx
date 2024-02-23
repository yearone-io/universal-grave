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
  const { networkConfig } = walletContext;
  const [graveVault, setGraveVault] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!graveVault) {
      getGraveVaultFor(graveOwner, networkConfig.universalGraveForwarder)
        .then(async graveVault => {
          if (graveVault) {
            return setGraveVault(graveVault);
          }
          // check if the user has an old Urd version
          // and thus potentially a different grave vault
          const urdData = await getUpAddressUrds(graveOwner);
          if (urdData.oldUrdVersion) {
            const oldGraveVault = await getGraveVaultFor(graveOwner, urdData.oldUrdVersion);
            if (oldGraveVault) {
              return setGraveVault(oldGraveVault);
            }
          } 
          setError('No GRAVE vault found for this account');
        })
        .catch(reason => {
          console.error(reason);
          setError(reason.message);
        });
    }
  }, [graveOwner]);

  if (error) {
    return <Text>{error}</Text>;
  }
  return graveVault ? <LSPAssets graveVault={graveVault} /> : <>Loading...</>;
}
