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
import { FaCog } from 'react-icons/fa';
import GravePageAssets from '@/components/GravePageAssets';
import ShareButton from '@/components/ShareButton';
import { useProfile } from '@/contexts/ProfileProvider';
import { useGrave } from '@/contexts/GraveContext';
import { formatAddress } from '@/utils/tokenUtils';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { BrowserProvider, isAddress } from 'ethers';
import { getRegisteredVaults } from '@/utils/vaultCreation';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { getForwarderAssistantConfig } from '@/utils/assistantConfig';

/**
 *  GraveContents: Renders the main content for a user's "graveyard" page.
 *  Utilizes ProfileProvider for user account data.
 *  Props:
 *   - graveOwner: Identifier for the currently viewed account's graveyard.
 *  Returns a layout with the graveyard title, a settings icon (for the owner's graveyard),
 *  a share button, and the GravePageAssets component showing the graveyard's LSP7s & LSP8s
 */
export default function GraveContents({ graveOwner }: { graveOwner: string }) {
  const { profileDetailsData, chainId } = useProfile();
  const { graveVault } = useGrave();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const networkName = params.networkName as string;
  const connectedAccount = profileDetailsData?.upWallet || null;
  const isOwnGraveyard = connectedAccount === graveOwner;

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
      if (!isOwnGraveyard || !window.lukso || !networkConfig) return;

      try {
        const provider = new BrowserProvider(window.lukso);

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
          console.log(
            '[GraveContents] Adding legacy vault to list:',
            graveVault
          );
          uniqueVaults = [...uniqueVaults, graveVault];
        }

        setAvailableVaults(uniqueVaults);
      } catch (error) {
        console.error('Error fetching vaults:', error);
      }
    };

    fetchVaults();
  }, [isOwnGraveyard, graveOwner, networkConfig, graveVault]);

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

  let graveTitle = 'YOUR GRAVEYARD';
  if (connectedAccount === graveOwner) {
    graveTitle = 'YOUR GRAVEYARD';
  } else {
    graveTitle = `${formatAddress(graveOwner)}'s GRAVEYARD`;
  }

  return (
    <Box>
      <Flex alignItems={'center'} gap={2} flexWrap="wrap">
        <Text
          fontSize="20px"
          color="white"
          fontFamily="Bungee"
          mb="30px"
          mt="30px"
        >
          {graveTitle}
        </Text>
        {graveOwner === connectedAccount && (
          <Link href={`/${networkName}/grave/settings`} passHref>
            <Icon as={FaCog} color={'light.white'} h={5} w={6} />
          </Link>
        )}
        <ShareButton pageAccount={graveOwner} />
      </Flex>

      {/* Vault selector - only show if viewing own graveyard */}
      {isOwnGraveyard && availableVaults.length > 0 && (
        <Box mb={4} p={4} bg="dark.purple.200" borderRadius="lg">
          <Text fontSize="sm" color="dark.purple.500" fontWeight="bold" mb={2}>
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
              color="dark.purple.500"
              borderColor="dark.purple.500"
              _focus={{ borderColor: 'dark.purple.400' }}
              bg="white"
              maxW="300px"
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
                  bg="white"
                  color="dark.purple.500"
                  fontFamily="mono"
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
              <Text fontSize="xs" color="orange.700" mt={2} fontWeight="bold">
                ⚠️ You are viewing a non-active vault. This vault is not
                receiving new spam.
              </Text>
            )}
        </Box>
      )}

      {/* Show custom vault input for any vault via URL */}
      {!isOwnGraveyard && vaultParam && isAddress(vaultParam) && (
        <Box mb={4} p={4} bg="dark.purple.200" borderRadius="lg">
          <Text fontSize="sm" color="dark.purple.500" fontWeight="bold" mb={1}>
            Viewing Custom Vault:
          </Text>
          <Text fontSize="sm" color="dark.purple.500" fontFamily="mono">
            {vaultParam}
          </Text>
          <Text fontSize="xs" color="orange.700" mt={2} fontWeight="bold">
            This vault may not be {formatAddress(graveOwner)}'s active spambox.
          </Text>
        </Box>
      )}

      <GravePageAssets
        graveOwner={graveOwner}
        vaultAddressOverride={selectedVault}
      />
    </Box>
  );
}
