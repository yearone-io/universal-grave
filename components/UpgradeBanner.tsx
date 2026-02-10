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
import { useRouter, useParams, usePathname } from 'next/navigation';

/**
 * UpgradeBanner - Displays a banner prompting users with legacy GRAVE setup to upgrade to UAP
 * Only shows when user has legacy GRAVE but hasn't subscribed to UAP
 */
export default function UpgradeBanner() {
  const { setupType } = useGrave();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
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

  // Check if we're on the settings page
  const isOnSettingsPage = pathname?.includes('/grave/settings');

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
        status="info"
        variant="solid"
        bg="dark.teal.500"
        color="dark.purple.500"
        py={4}
        px={6}
        pr={12}
        borderRadius="lg"
        border="2px solid"
        borderColor="dark.teal.700"
        position="relative"
      >
        <AlertIcon color="dark.teal.700" />
        <Flex
          flex="1"
          flexDirection={{ base: 'column', md: 'row' }}
          alignItems={{ base: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          gap={3}
        >
          <Text fontSize="md" fontWeight="bold" color="dark.purple.500">
            You're using the legacy GRAVE system. Upgrade to the new improved
            protocol for better performance and features!
          </Text>
          {!isOnSettingsPage && (
            <Button
              onClick={handleUpgrade}
              size="sm"
              bg="dark.purple.500"
              color="dark.teal.500"
              _hover={{ bg: 'dark.purple.400' }}
              fontFamily="Bungee"
              fontSize="14px"
              flexShrink={0}
            >
              UPGRADE NOW
            </Button>
          )}
        </Flex>
        <CloseButton
          onClick={handleDismiss}
          position="absolute"
          right={2}
          top={2}
          color="dark.purple.500"
        />
      </Alert>
    </Box>
  );
}
