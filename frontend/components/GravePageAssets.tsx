'use client';
import LSPAssets from '@/components/LSPAssets';
import { useEffect, useState } from 'react';
import { getGraveVaultFor } from '@/utils/universalProfile';
import { Text } from '@chakra-ui/react';

export default function GravePageAssets({ account }: { account: string }) {
  const [graveVault, setGraveVault] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!graveVault) {
      getGraveVaultFor(account)
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
  }, [account]);

  if (error) {
    return <Text>{error}</Text>;
  }

  return graveVault ? <LSPAssets graveVault={graveVault} /> : <>Loading...</>;
}
