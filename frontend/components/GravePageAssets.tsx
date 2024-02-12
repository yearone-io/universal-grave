'use client';
import LSPAssets from '@/components/LSPAssets';
import { useContext, useEffect, useState } from 'react';
import { getGraveVaultFor } from '@/utils/universalProfile';
import { Text } from '@chakra-ui/react';
import { WalletContext } from '@/components/wallet/WalletContext';

export default function GravePageAssets({
  pageAccount,
}: {
  pageAccount: string;
}) {
  const walletContext = useContext(WalletContext);
  const { networkConfig } = walletContext;
  const [graveVault, setGraveVault] = useState<string | null>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!graveVault) {
      getGraveVaultFor(pageAccount, networkConfig.universalGraveForwarder)
        .then(graveVault => {
          if (graveVault == null) {
            setError('No grave vault found for this account');
          } else {
            setGraveVault(graveVault);
          }
        })
        .catch(reason => {
          console.error('error fetching grave vault', reason);
          setError(reason.message);
        });
    }
  }, []);

  if (error) {
    return <Text>{error}</Text>;
  }

  return graveVault ? <LSPAssets graveVault={graveVault} /> : <>Loading...</>;
}
