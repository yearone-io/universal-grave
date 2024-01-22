'use client';
import LSPAssets from '@/components/LSPAssets';
import { useEffect, useState } from 'react';
import { getGraveVaultFor } from '@/utils/universalProfile';
import { useToast } from '@chakra-ui/react';

export default function GravePageAssets({ account }: { account: string }) {
  const [graveVault, setGraveVault] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!graveVault) {
      getGraveVaultFor(account)
        .then(graveVault => {
          setGraveVault(graveVault);
        })
        .catch(reason => {
          toast({
            title: 'Error',
            description: reason.message,
            status: 'error',
            duration: 9000,
            isClosable: true,
          });
        });
    }
  }, [account]);
  return <LSPAssets graveVault={graveVault} />;
}
