'use client';
import LSPAssets from '@/components/LSPAssets';
import { useContext, useEffect, useState } from 'react';
import { getGraveVaultFor } from '@/utils/universalProfile';
import { Text } from '@chakra-ui/react';
import { WalletContext } from '@/components/wallet/WalletContext';

export default function GravePageAssets({
  pageAccount,
  pageGraveVault = null,
}: {
  pageAccount: string | null;
  pageGraveVault?: string | null;
}) {
  const walletContext = useContext(WalletContext);
  const { networkConfig } = walletContext;
  const [graveVault, setGraveVault] = useState<string | null>(pageGraveVault);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!graveVault && pageAccount) {
      getGraveVaultFor(pageAccount, networkConfig.universalGraveForwarder)
        .then(graveVault => {
          if (!graveVault) {
            setError('No grave vault found for this account');
          } else {
            setGraveVault(graveVault);
          }
        })
        .catch(reason => {
          console.error(reason);
          setError(reason.message);
        });
    }
  }, [pageAccount]);

  if (error) {
    return <Text>{error}</Text>;
  }

  return graveVault ? <LSPAssets graveVault={graveVault} /> : <>Loading...</>;
}
