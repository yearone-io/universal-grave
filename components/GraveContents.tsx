'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Text,
  Flex,
  Icon,
  Select,
  Input,
  Button,
  HStack,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { SettingsIcon } from '@chakra-ui/icons';
import GravePageAssets from '@/components/GravePageAssets';
import ShareButton from '@/components/ShareButton';
import ScreenerMigrationModal from '@/components/ScreenerMigrationModal';
import { useProfile } from '@/contexts/ProfileProvider';
import { useGrave } from '@/contexts/GraveContext';
import { formatAddress } from '@/utils/tokenUtils';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { isAddress } from 'ethers';
import { getRegisteredVaults } from '@/utils/vaultCreation';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { getForwarderAssistantConfig } from '@/utils/assistantConfig';
import { getReadProvider } from '@/utils/erc725Client';

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

/**
 *  GraveContents: Renders the main content for a user's "graveyard" page.
 *  Utilizes ProfileProvider for user account data.
 *  Props:
 *   - graveOwner: Identifier for the currently viewed account's graveyard.
 *   - networkName: The network name for navigation.
 *  Returns a layout with the graveyard title, a settings icon (for the owner's graveyard),
 *  a share button, and the GravePageAssets component showing the graveyard's LSP7s & LSP8s
 */
export default function GraveContents({
  graveOwner,
  networkName: networkNameProp
}: {
  graveOwner: string;
  networkName: string;
}) {
  const { profileDetailsData, chainId, isNetworkMismatch } = useProfile();
  const {
    graveVault,
    hasUAPSubscription,
    setupType,
    isLoadingGraveData,
    hasOutdatedScreeners,
    outdatedScreenerInfo,
  } = useGrave();
  const searchParams = useSearchParams();
  const router = useRouter();
  const networkName = networkNameProp;
  const connectedAccount = profileDetailsData?.upWallet || null;
  const isOwnGraveyard =
    !!connectedAccount &&
    connectedAccount.toLowerCase() === graveOwner.toLowerCase();

  // Protection is truly active only if we have UAP subscription AND the forwarder is configured
  const isProtectionActive = hasUAPSubscription && (setupType === 'uap' || setupType === 'both');

  // Handle migration navigation
  const handleMigrate = () => {
    router.push(`/${networkName}/grave/settings?migrate=true`);
  };

  // State for vault selection
  const [availableVaults, setAvailableVaults] = useState<string[]>([]);
  const [selectedVault, setSelectedVault] = useState<string | null>(null);
  const [customVaultInput, setCustomVaultInput] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [defaultVault, setDefaultVault] = useState<string | null>(null);

  const networkConfig = chainId ? supportedNetworks[chainId.toString()] : null;

  // Check URL parameter for vault override
  const vaultParam = searchParams.get('vault');

  // Fetch available vaults for the graveyard owner if viewing own graveyard
  useEffect(() => {
    const fetchVaults = async () => {
      if (
        !isOwnGraveyard ||
        !networkConfig ||
        isNetworkMismatch
      )
        return;

      try {
        const provider = getReadProvider(
          networkConfig.chainId,
          networkConfig.rpcUrl
        );

        // Get the default vault from forwarder assistant config
        const forwarderConfig = await getForwarderAssistantConfig(
          provider,
          graveOwner,
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

        if (forwarderConfig.vaultAddress) {
          setDefaultVault(forwarderConfig.vaultAddress);
        }

        // Get all registered vaults
        const vaults = await getRegisteredVaults(provider, graveOwner);
        let uniqueVaults = vaults.filter(
          (vault, index, self) =>
            index ===
            self.findIndex(v => v.toLowerCase() === vault.toLowerCase())
        );

        // Add legacy GRAVE vault to the list if it exists and isn't already included
        if (
          isOwnGraveyard &&
          graveVault &&
          !uniqueVaults.some(v => v.toLowerCase() === graveVault.toLowerCase())
        ) {
          uniqueVaults = [...uniqueVaults, graveVault];
        }

        setAvailableVaults(uniqueVaults);
      } catch (error) {
        console.error('Error fetching vaults:', error);
      }
    };

    fetchVaults();
  }, [
    isOwnGraveyard,
    graveOwner,
    networkConfig,
    graveVault,
    isNetworkMismatch,
  ]);

  // Handle vault selection from URL or default
  useEffect(() => {
    if (vaultParam && isAddress(vaultParam)) {
      setSelectedVault(vaultParam);
      // Check if this vault is in the available vaults list
      const isInList = availableVaults.some(
        v => v.toLowerCase() === vaultParam.toLowerCase()
      );
      if (!isInList && isOwnGraveyard) {
        // It's a custom vault not in the list
        setShowCustomInput(true);
        setCustomVaultInput(vaultParam);
      }
    } else if (!isOwnGraveyard) {
      // For others' graveyards, no selection UI, just use default
      setSelectedVault(null);
    }
  }, [vaultParam, isOwnGraveyard, availableVaults]);

  const handleVaultChange = (vaultAddress: string) => {
    if (vaultAddress === 'custom') {
      setShowCustomInput(true);
      // Keep the current selected vault if there is one
      if (!selectedVault) {
        setCustomVaultInput('');
      }
    } else if (vaultAddress === 'default') {
      setSelectedVault(null);
      setShowCustomInput(false);
      setCustomVaultInput('');
      // Remove vault param from URL
      router.push(`/${networkName}/grave/${graveOwner}`);
    } else {
      setSelectedVault(vaultAddress);
      setShowCustomInput(false);
      setCustomVaultInput('');
      // Update URL with vault param
      router.push(`/${networkName}/grave/${graveOwner}?vault=${vaultAddress}`);
    }
  };

  const handleCustomVaultSubmit = () => {
    if (customVaultInput && isAddress(customVaultInput)) {
      setSelectedVault(customVaultInput);
      // Keep the input visible with the custom vault
      router.push(
        `/${networkName}/grave/${graveOwner}?vault=${customVaultInput}`
      );
    }
  };

  let graveTitle = 'Your Graveyard';
  let graveSubtitle = 'View and manage assets in your graveyard vault.';

  if (!isOwnGraveyard) {
    graveTitle = `${formatAddress(graveOwner)}'s Graveyard`;
    graveSubtitle = `Browse assets in ${formatAddress(graveOwner)}'s graveyard vault.`;
  }

  return (
    <>
      {/* Header */}
      <Flex
        direction="column"
        align="center"
        textAlign="center"
        mb={{ base: 10, md: 14 }}
      >
        {/* Status pill - only show for own graveyard with active protection */}
        {isOwnGraveyard && isProtectionActive && !isLoadingGraveData && (
          <Box
            bg="rgba(138, 251, 234, 0.15)"
            border="1px solid rgba(138, 251, 234, 0.3)"
            borderRadius="full"
            px={4}
            py={1.5}
            mb={6}
          >
            <HStack spacing={2}>
              <Box
                w={2}
                h={2}
                borderRadius="full"
                bg="dark.teal.500"
                boxShadow="0 0 8px rgba(138, 251, 234, 0.6)"
              />
              <Text
                fontSize="xs"
                fontWeight="600"
                color="dark.teal.500"
                letterSpacing="0.5px"
                textTransform="uppercase"
              >
                Protection Active
              </Text>
            </HStack>
          </Box>
        )}

        {/* Main title */}
        <Text
          fontSize={{ base: '32px', md: '44px' }}
          fontFamily="Bungee"
          color="white"
          lineHeight="1.1"
          mb={4}
        >
          {graveTitle}
        </Text>

        {/* Subtitle */}
        <Text
          fontSize={{ base: 'md', md: 'lg' }}
          color="whiteAlpha.700"
          maxW="480px"
          lineHeight="1.6"
        >
          {graveSubtitle}
        </Text>

        {/* Action buttons */}
        <HStack spacing={3} mt={6}>
          {isOwnGraveyard && (
            <Link href={`/${networkName}/grave/settings`}>
              <Button
                variant="ghost"
                color="whiteAlpha.800"
                fontSize="sm"
                fontWeight="500"
                fontFamily="Montserrat"
                leftIcon={<Icon as={SettingsIcon} />}
                _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
              >
                Settings
              </Button>
            </Link>
          )}
          <ShareButton pageAccount={graveOwner} />
        </HStack>
      </Flex>

      {/* Main content card */}
      <Box
        bg="rgba(255, 255, 255, 0.03)"
        backdropFilter="blur(20px)"
        borderRadius="3xl"
        border="1px solid rgba(255, 255, 255, 0.08)"
        overflow="hidden"
        boxShadow="0 25px 80px rgba(0, 0, 0, 0.4)"
        position="relative"
      >
        {/* Loading state shimmer */}
        {isLoadingGraveData && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            height="3px"
            bgGradient="linear(to-r, transparent, dark.purple.300, transparent)"
            bgSize="200% 100%"
            animation={`${shimmer} 1.5s infinite`}
          />
        )}

        <Box p={{ base: 6, md: 10 }}>
          {/* Vault selector - only show if viewing own graveyard */}
          {isOwnGraveyard && availableVaults.length > 0 && (
            <Box
              mb={6}
              p={5}
              bg="rgba(255, 255, 255, 0.05)"
              borderRadius="xl"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="sm" color="whiteAlpha.800" fontWeight="600" mb={3}>
                Viewing Vault:
              </Text>
              <Flex gap={2} alignItems="center" flexWrap="wrap">
                <Select
                  value={
                    !selectedVault
                      ? 'default'
                      : availableVaults.some(
                            v => v.toLowerCase() === selectedVault.toLowerCase()
                          )
                        ? selectedVault
                        : 'custom'
                  }
                  onChange={e => handleVaultChange(e.target.value)}
                  fontFamily="mono"
                  size="sm"
                  color="white"
                  borderColor="whiteAlpha.300"
                  _focus={{ borderColor: 'dark.teal.500' }}
                  _hover={{ borderColor: 'whiteAlpha.400' }}
                  bg="whiteAlpha.100"
                  maxW="400px"
                >
                  <option key="default" value="default">
                    Active Spambox{' '}
                    {defaultVault ? `(${formatAddress(defaultVault)})` : ''}
                  </option>
                  {availableVaults.map((vault, idx) => {
                    const isLegacyVault =
                      graveVault &&
                      vault.toLowerCase() === graveVault.toLowerCase();
                    const isActive =
                      vault.toLowerCase() === defaultVault?.toLowerCase();
                    return (
                      <option key={vault} value={vault}>
                        Vault {idx + 1}: {formatAddress(vault)}
                        {isActive ? ' (Active)' : ''}
                        {isLegacyVault ? ' (Legacy Vault)' : ''}
                      </option>
                    );
                  })}
                  <option value="custom">
                    {showCustomInput && customVaultInput
                      ? `Custom: ${formatAddress(customVaultInput)}`
                      : 'View Custom Vault Address...'}
                  </option>
                </Select>

                {showCustomInput && (
                  <HStack>
                    <Input
                      placeholder="0x... (vault address)"
                      value={customVaultInput}
                      onChange={e => setCustomVaultInput(e.target.value)}
                      size="sm"
                      maxW="300px"
                      bg="whiteAlpha.100"
                      color="white"
                      fontFamily="mono"
                      borderColor="whiteAlpha.300"
                      _focus={{ borderColor: 'dark.teal.500' }}
                      _hover={{ borderColor: 'whiteAlpha.400' }}
                    />
                    <Button
                      size="sm"
                      colorScheme="purple"
                      onClick={handleCustomVaultSubmit}
                      isDisabled={!customVaultInput || !isAddress(customVaultInput)}
                    >
                      View
                    </Button>
                  </HStack>
                )}
              </Flex>
              {selectedVault &&
                selectedVault.toLowerCase() !== defaultVault?.toLowerCase() && (
                  <Box
                    mt={3}
                    p={3}
                    bg="rgba(251, 211, 141, 0.1)"
                    border="1px solid rgba(251, 211, 141, 0.3)"
                    borderRadius="md"
                  >
                    <Text fontSize="xs" color="orange.300" fontWeight="600">
                      ⚠️ You are viewing a non-active vault. This vault is not
                      receiving new spam.
                    </Text>
                  </Box>
                )}
            </Box>
          )}

          {/* Show custom vault input for any vault via URL */}
          {!isOwnGraveyard && vaultParam && isAddress(vaultParam) && (
            <Box
              mb={6}
              p={5}
              bg="rgba(255, 255, 255, 0.05)"
              borderRadius="xl"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="sm" color="whiteAlpha.800" fontWeight="600" mb={2}>
                Viewing Custom Vault:
              </Text>
              <Text fontSize="sm" color="white" fontFamily="mono" mb={3}>
                {vaultParam}
              </Text>
              <Box
                p={3}
                bg="rgba(251, 211, 141, 0.1)"
                border="1px solid rgba(251, 211, 141, 0.3)"
                borderRadius="md"
              >
                <Text fontSize="xs" color="orange.300" fontWeight="600">
                  This vault may not be {formatAddress(graveOwner)}'s active spambox.
                </Text>
              </Box>
            </Box>
          )}

          <GravePageAssets
            graveOwner={graveOwner}
            vaultAddressOverride={selectedVault}
          />
        </Box>
      </Box>

      {/* Migration modal - shown when user has outdated screeners */}
      {isOwnGraveyard && hasOutdatedScreeners && outdatedScreenerInfo && (
        <ScreenerMigrationModal
          isOpen={true}
          migrationInfo={outdatedScreenerInfo}
          onMigrate={handleMigrate}
        />
      )}
    </>
  );
}
