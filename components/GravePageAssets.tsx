'use client';
import LSPAssets from '@/components/LSPAssets';
import { useEffect, useState } from 'react';
import { getGraveVaultFor } from '@/utils/universalProfile';
import { Alert, AlertIcon, Box, Button, Flex, Text } from '@chakra-ui/react';
import { getUpAddressUrds } from '@/utils/urdUtils';
import { useProfile } from '@/contexts/ProfileProvider';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { getForwarderAssistantConfig } from '@/utils/assistantConfig';
import { getWalletProvider } from '@/utils/walletClient';

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
  const hasWalletProvider =
    typeof window !== 'undefined' && !!window.lukso;

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
        window.lukso &&
        !isNetworkMismatch &&
        isConnected
      ) {
        try {
          const provider = getWalletProvider();

          // First, try to get vault from UAP forwarder assistant configuration
          const forwarderConfig = await getForwarderAssistantConfig(
            provider,
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
            provider,
            graveOwner,
            networkConfig.universalGraveForwarder
          );
          if (vault) {
            setGraveVault(vault);
            return;
          }

          // Attempt to retrieve grave vault for users with an old Urd version
          const urdData = await getUpAddressUrds(provider, graveOwner);
          if (urdData.oldUrdVersion) {
            const oldGraveVault = await getGraveVaultFor(
              provider,
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
    return <Text>{error}</Text>;
  }

  if (isNetworkMismatch) {
    return (
      <Box width="100%" mb={6}>
        <Alert
          status="warning"
          variant="solid"
          bg="orange.500"
          color="white"
          py={4}
          px={6}
          borderRadius="lg"
          border="2px solid"
          borderColor="orange.600"
        >
          <AlertIcon color="white" />
          <Flex
            flex="1"
            flexDirection={{ base: 'column', md: 'row' }}
            alignItems={{ base: 'flex-start', md: 'center' }}
            justifyContent="space-between"
            gap={3}
          >
            <Box>
              <Text fontSize="md" fontWeight="bold" mb={1}>
                Wrong network
              </Text>
              <Text fontSize="sm">
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
                bg="white"
                color="orange.600"
                _hover={{ bg: 'gray.100' }}
                fontFamily="Bungee"
                fontSize="12px"
                flexShrink={0}
              >
                Switch to {expectedNetwork?.displayName || 'network'}
              </Button>
            )}
          </Flex>
        </Alert>
      </Box>
    );
  }

  if (!hasWalletProvider || !isConnected) {
    return (
      <Box width="100%" mb={6}>
        <Alert
          status="info"
          variant="solid"
          bg="dark.teal.500"
          color="dark.purple.500"
          py={4}
          px={6}
          borderRadius="lg"
          border="2px solid"
          borderColor="dark.teal.700"
        >
          <AlertIcon color="dark.teal.700" />
          <Text fontSize="sm" fontWeight="bold">
            Connect your wallet to load this grave.
          </Text>
        </Alert>
      </Box>
    );
  }

  return graveVault ? (
    <LSPAssets graveVault={graveVault} graveOwner={graveOwner} />
  ) : (
    <>Loading...</>
  );
}
