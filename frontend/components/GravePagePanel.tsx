'use client';
import { Box, Button, Text, useColorModeValue } from '@chakra-ui/react';
import { WalletContext } from '@/components/wallet/WalletContext';
import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';

export default function GravePagePanel({ account }: { account: string }) {
  const [isOwner, setIsOwner] = useState<boolean>();
  const walletContext = useContext(WalletContext);
  const { account: connectedAccount, graveVault } = walletContext;
  const createButtonBg = useColorModeValue('light.green.brand', 'dark.white');
  const createButtonColor = useColorModeValue(
    'light.black',
    'var(--chakra-colors-dark-purple-500)'
  );
  const createButtonBorder = useColorModeValue(
    '1px solid black',
    '1px solid var(--chakra-colors-dark-purple-500)'
  );

  useEffect(() => {
    if (connectedAccount) {
      setIsOwner(account.toLowerCase() === connectedAccount?.toLowerCase());
    } else {
      setIsOwner(false);
    }
  }, [connectedAccount]);
  return isOwner ? (
    <Box>
      <Link href="/grave" passHref>
        <Button
          px={6}
          color={createButtonColor}
          bg={createButtonBg}
          _hover={{ bg: createButtonBg }}
          border={createButtonBorder}
          size={['sm', 'sm', 'md', 'md']}
        >
          {`Manage your 🆙 Grave`}
        </Button>
      </Link>
    </Box>
  ) : (
    <Text>You're viewing {account}'s graveyard</Text>
  );
}
