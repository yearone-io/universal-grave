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
import { useProfile } from '@/contexts/ProfileProvider';

/**
 * NewUserBanner - Displays a banner prompting brand new users to configure GRAVE Spambox
 * Shows when:
 * 1. User is connected
 * 2. User has no GRAVE setup at all (no UAP subscription and no legacy GRAVE)
 */
export default function NewUserBanner() {
  const { setupType, hasUAPSubscription, hasLegacyGrave, isLoadingGraveData } =
    useGrave();
  const { isConnected } = useProfile();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const networkName = params.networkName as string;

  const [isDismissed, setIsDismissed] = useState(false);

  // Check if banner was dismissed this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('hideNewUserBanner');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // Show banner only for brand new users who have no GRAVE setup
  const isBrandNewUser =
    isConnected &&
    !isLoadingGraveData &&
    setupType === 'none' &&
    !hasUAPSubscription &&
    !hasLegacyGrave;

  if (!isBrandNewUser || isDismissed) {
    return null;
  }

  // Check if we're on the settings page
  const isOnSettingsPage = pathname?.includes('/grave/settings');

  const handleConfigure = () => {
    router.push(`/${networkName}/grave/settings`);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('hideNewUserBanner', 'true');
    setIsDismissed(true);
  };

  return (
    <Box width="100%" mb={4}>
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
            Configure your GRAVE Spambox to protect your profile from spam and
            unwanted assets!
          </Text>
          {!isOnSettingsPage && (
            <Button
              onClick={handleConfigure}
              size="sm"
              bg="dark.purple.500"
              color="dark.teal.500"
              _hover={{ bg: 'dark.purple.400' }}
              fontFamily="Bungee"
              fontSize="14px"
              flexShrink={0}
            >
              GET PROTECTED
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
