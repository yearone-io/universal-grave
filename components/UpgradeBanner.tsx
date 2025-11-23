'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Button,
  Flex,
  Text,
  CloseButton,
  Box,
} from '@chakra-ui/react';
import { useGrave } from '@/contexts/GraveContext';
import { useRouter, useParams } from 'next/navigation';

/**
 * UpgradeBanner - Displays a banner prompting users with legacy GRAVE setup to upgrade to UAP
 * Only shows when user has legacy GRAVE but hasn't subscribed to UAP
 */
export default function UpgradeBanner() {
  const { setupType } = useGrave();
  const router = useRouter();
  const params = useParams();
  const networkName = params.networkName as string;

  const [isDismissed, setIsDismissed] = useState(false);

  // Check if banner was dismissed this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('hideUpgradeBanner');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // Only show banner for legacy-only users
  if (setupType !== 'legacy' || isDismissed) {
    return null;
  }

  const handleUpgrade = () => {
    router.push(`/${networkName}/grave/settings`);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('hideUpgradeBanner', 'true');
    setIsDismissed(true);
  };

  return (
    <Box width="100%">
      <Alert
        status="warning"
        variant="solid"
        bg="orange.500"
        color="white"
        py={4}
        px={6}
        borderRadius="0"
      >
        <AlertIcon color="white" />
        <Flex
          flex="1"
          flexDirection={{ base: 'column', md: 'row' }}
          alignItems={{ base: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          gap={3}
        >
          <Text fontSize="md" fontWeight="bold">
            You're using the legacy GRAVE system. Upgrade to the new improved
            protocol for better performance and features!
          </Text>
          <Button
            onClick={handleUpgrade}
            size="sm"
            colorScheme="whiteAlpha"
            bg="white"
            color="orange.600"
            _hover={{ bg: 'gray.100' }}
            fontFamily="Bungee"
            fontSize="14px"
            flexShrink={0}
          >
            UPGRADE NOW
          </Button>
        </Flex>
        <CloseButton
          onClick={handleDismiss}
          position="absolute"
          right={2}
          top={2}
          color="white"
        />
      </Alert>
    </Box>
  );
}
