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
import { supportedNetworks } from '@/constants/supportedNetworks';

/**
 * IncompleteConfigBanner - Displays a banner prompting users who have UAP but haven't configured their spambox
 * Shows when:
 * 1. User has UAP subscription but no Forwarder Assistant configuration (setupType === 'none'), OR
 * 2. User has configuration but no filters configured (empty whitelist AND no curated list)
 */
export default function IncompleteConfigBanner() {
  const { setupType, hasUAPSubscription, isLoadingGraveData } = useGrave();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const networkName = params.networkName as string;
  const { profileDetailsData, chainId } = useProfile();

  const [isDismissed, setIsDismissed] = useState(false);
  const [isIncompleteConfig, setIsIncompleteConfig] = useState(false);
  const [configCheckTrigger, setConfigCheckTrigger] = useState(0);

  // Check if banner was dismissed this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('hideIncompleteConfigBanner');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // Trigger config recheck when grave data finishes loading
  useEffect(() => {
    if (!isLoadingGraveData) {
      // Increment trigger to force recheck
      setConfigCheckTrigger(prev => prev + 1);
    }
  }, [isLoadingGraveData]);

  // Check for incomplete configuration (empty whitelist AND no curated list)
  useEffect(() => {
    async function checkConfig() {
      // Only check if user has UAP setup (not 'none' and not legacy-only)
      if (setupType !== 'uap' && setupType !== 'both') {
        setIsIncompleteConfig(false);
        return;
      }

      if (!window.lukso || !profileDetailsData?.upWallet || !chainId) {
        return;
      }

      const networkConfig = supportedNetworks[chainId.toString()];
      if (!networkConfig) return;

      try {
        const { BrowserProvider } = await import('ethers');
        const provider = new BrowserProvider(window.lukso);

        const { getForwarderAssistantConfig } = await import(
          '@/utils/assistantConfig'
        );
        const config = await getForwarderAssistantConfig(
          provider,
          profileDetailsData.upWallet,
          {
            forwarderAssistantAddress: networkConfig.forwarderAssistantAddress,
            addressListScreenerAddress:
              networkConfig.addressListScreenerAddress,
            curatedListScreenerAddress:
              networkConfig.curatedListScreenerAddress,
            creatorListScreenerAddress:
              networkConfig.creatorListScreenerAddress,
            creatorCurationScreenerAddress:
              networkConfig.creatorCurationScreenerAddress,
          }
        );

        // Configuration is incomplete if ALL filters are empty:
        // 1. Asset whitelist is empty AND
        // 2. Asset curated list is not configured AND
        // 3. Creator whitelist is empty AND
        // 4. Creator curated list is not configured
        const incomplete =
          config.whitelistAddresses.length === 0 &&
          !config.useCuratedList &&
          config.creatorWhitelistAddresses.length === 0 &&
          !config.creatorCuratedListAddress;
        setIsIncompleteConfig(incomplete);
      } catch (error) {
        console.error('Error checking config completeness:', error);
        setIsIncompleteConfig(false);
      }
    }

    checkConfig();
  }, [setupType, profileDetailsData, chainId, configCheckTrigger]);

  // Show banner if:
  // 1. No configuration at all (setupType === 'none' AND hasUAPSubscription), OR
  // 2. Configuration exists but is incomplete (empty whitelist AND no curated list)
  const shouldShow =
    (setupType === 'none' && hasUAPSubscription) || isIncompleteConfig;

  if (!shouldShow || isDismissed) {
    return null;
  }

  // Check if we're on the settings page
  const isOnSettingsPage = pathname?.includes('/grave/settings');

  const handleConfigure = () => {
    router.push(`/${networkName}/grave/settings`);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('hideIncompleteConfigBanner', 'true');
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
            {setupType === 'none'
              ? 'Your account is not protected from spam! Complete your spambox configuration to activate protection.'
              : 'Warning: Spambox filters not configured! Although you now have an active spambox, you must configure its filters, otherwise all incoming assets will be treated as spam!'}
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
              CONFIGURE NOW
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
