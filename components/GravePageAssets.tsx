'use client';
import LSPAssets from '@/components/LSPAssets';
import { useEffect, useState } from 'react';
import { getGraveVaultFor } from '@/utils/universalProfile';
import { Alert, AlertIcon, Box, Button, Flex, Text } from '@chakra-ui/react';
import { getUpAddressUrds } from '@/utils/urdUtils';
import { useProfile } from '@/contexts/ProfileProvider';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { getForwarderAssistantConfig } from '@/utils/assistantConfig';
import { hasWalletProvider } from '@/utils/walletClient';
import { getReadProvider } from '@/utils/erc725Client';

export default function GravePageAssets({
  graveOwner,
  vaultAddressOverride,
}: {
  graveOwner: string;
  vaultAddressOverride?: string | null;
}) {
  const {
    chainId,
    expectedChainId,
    isNetworkMismatch,
    isConnected,
    switchNetwork,
  } = useProfile();
  const [graveVault, setGraveVault] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const networkConfig = chainId ? supportedNetworks[chainId.toString()] : null;
  const expectedNetwork = expectedChainId
    ? supportedNetworks[expectedChainId.toString()]
    : null;
  const currentNetwork = chainId ? supportedNetworks[chainId.toString()] : null;
  const hasWalletProviderAvailable = hasWalletProvider();

  // Use override if provided
  useEffect(() => {
    if (vaultAddressOverride) {
      setGraveVault(vaultAddressOverride);
    }
  }, [vaultAddressOverride]);

  // Reset cached vault when network or owner changes (only if no override)
  useEffect(() => {
    if (vaultAddressOverride) return;
    setGraveVault(null);
    setError(undefined);
  }, [chainId, graveOwner, vaultAddressOverride]);

  useEffect(() => {
    const fetchGraveVault = async () => {
      // Skip fetching if vault override is provided
      if (vaultAddressOverride) return;

      if (
        !graveVault &&
        networkConfig &&
        hasWalletProvider() &&
        !isNetworkMismatch &&
        isConnected
      ) {
        try {
          const readProvider = getReadProvider(
            networkConfig.chainId,
            networkConfig.rpcUrl
          );

          // First, try to get vault from UAP forwarder assistant configuration
          const forwarderConfig = await getForwarderAssistantConfig(
            readProvider,
            graveOwner,
            {
              forwarderAssistantAddress:
                networkConfig.forwarderAssistantAddress,
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
            setGraveVault(forwarderConfig.vaultAddress);
            return;
          }

          // Fallback to legacy GRAVE forwarder for backwards compatibility
          const vault = await getGraveVaultFor(
            readProvider,
            graveOwner,
            networkConfig.universalGraveForwarder
          );
          if (vault) {
            setGraveVault(vault);
            return;
          }

          // Attempt to retrieve grave vault for users with an old Urd version
          const urdData = await getUpAddressUrds(readProvider, graveOwner);
          if (urdData.oldUrdVersion) {
            const oldGraveVault = await getGraveVaultFor(
              readProvider,
              graveOwner,
              urdData.oldUrdVersion
            );
            if (oldGraveVault) {
              setGraveVault(oldGraveVault);
              return;
            }
          }
          setError('No GRAVE vault found for this account');
        } catch (error) {
          console.error(error);
          setError('Error fetching GRAVE vault');
        }
      }
    };

    fetchGraveVault();
  }, [
    graveOwner,
    graveVault,
    networkConfig,
    vaultAddressOverride,
    isNetworkMismatch,
    isConnected,
  ]);

  if (error) {
    return (
      <Box
        p={6}
        bg="rgba(245, 101, 101, 0.1)"
        border="1px solid rgba(245, 101, 101, 0.3)"
        borderRadius="xl"
      >
        <Text color="red.300" fontSize="sm" fontWeight="500">
          {error}
        </Text>
      </Box>
    );
  }

  if (isNetworkMismatch) {
    return (
      <Box
        p={6}
        bg="rgba(251, 211, 141, 0.1)"
        border="1px solid rgba(251, 211, 141, 0.3)"
        borderRadius="xl"
      >
        <Flex
          flexDirection={{ base: 'column', md: 'row' }}
          alignItems={{ base: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          gap={4}
        >
          <Box>
            <Text fontSize="md" fontWeight="600" mb={2} color="orange.200">
              Wrong network
            </Text>
            <Text fontSize="sm" color="orange.100">
              You're connected to{' '}
              {currentNetwork?.displayName || 'another network'} but this
              grave is on{' '}
              {expectedNetwork?.displayName || 'a different network'}.
              Switch networks to load the assets.
            </Text>
          </Box>
          {expectedChainId && (
            <Button
              onClick={() => switchNetwork(expectedChainId)}
              size="sm"
              colorScheme="orange"
              fontFamily="Montserrat"
              fontWeight="500"
              flexShrink={0}
            >
              Switch to {expectedNetwork?.displayName || 'network'}
            </Button>
          )}
        </Flex>
      </Box>
    );
  }

  if (!hasWalletProviderAvailable || !isConnected) {
    return (
      <Box
        p={6}
        bg="rgba(138, 251, 234, 0.1)"
        border="1px solid rgba(138, 251, 234, 0.3)"
        borderRadius="xl"
      >
        <Text fontSize="sm" fontWeight="500" color="dark.teal.500">
          Connect your wallet to load this grave.
        </Text>
      </Box>
    );
  }

  return graveVault ? (
    <LSPAssets graveVault={graveVault} graveOwner={graveOwner} />
  ) : (
    <Box
      p={6}
      bg="rgba(255, 255, 255, 0.05)"
      borderRadius="xl"
      textAlign="center"
    >
      <Text fontSize="sm" color="whiteAlpha.600" fontWeight="500">
        Loading...
      </Text>
    </Box>
  );
}
