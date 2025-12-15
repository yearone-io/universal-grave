'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Button,
  Flex,
  Text,
  Box,
  Spinner,
} from '@chakra-ui/react';
import { BrowserProvider } from 'ethers';
import { hasVaultURDSet, setVaultURD } from '@/utils/vaultCreation';
import { useProfile } from '@/contexts/ProfileProvider';

interface VaultURDCheckerProps {
  vaultAddress: string | null;
  networkConfig: {
    lsp1UrdVault?: string;
  } | null;
  onURDStatusChange?: (hasURD: boolean) => void;
}

/**
 * Component that checks if a vault has LSP1UniversalReceiverDelegate set
 * and provides UI to set it if missing. This is critical for vaults to receive assets.
 */
export default function VaultURDChecker({
  vaultAddress,
  networkConfig,
  onURDStatusChange,
}: VaultURDCheckerProps) {
  const { profileDetailsData } = useProfile();
  const [isChecking, setIsChecking] = useState(false);
  const [hasURD, setHasURD] = useState<boolean | null>(null);
  const [isSettingURD, setIsSettingURD] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check URD status whenever vault or network changes
  useEffect(() => {
    const checkURD = async () => {
      if (!vaultAddress || !networkConfig?.lsp1UrdVault || !window.lukso) {
        setHasURD(null);
        return;
      }

      setIsChecking(true);
      setError(null);

      try {
        const provider = new BrowserProvider(window.lukso);
        const urdSet = await hasVaultURDSet(
          provider,
          vaultAddress,
          networkConfig.lsp1UrdVault
        );
        setHasURD(urdSet);
        onURDStatusChange?.(urdSet);
      } catch (err: any) {
        console.error('Error checking vault URD:', err);
        setError(err.message || 'Failed to check vault configuration');
        setHasURD(false);
        onURDStatusChange?.(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkURD();
  }, [vaultAddress, networkConfig, onURDStatusChange]);

  const handleSetURD = async () => {
    if (
      !vaultAddress ||
      !networkConfig ||
      !profileDetailsData?.upWallet ||
      !window.lukso
    ) {
      return;
    }

    setIsSettingURD(true);
    setError(null);

    try {
      const provider = new BrowserProvider(window.lukso);
      await setVaultURD(
        provider,
        profileDetailsData.upWallet,
        vaultAddress,
        networkConfig
      );

      // Recheck URD status
      const urdSet = await hasVaultURDSet(
        provider,
        vaultAddress,
        networkConfig.lsp1UrdVault!
      );
      setHasURD(urdSet);
      onURDStatusChange?.(urdSet);
    } catch (err: any) {
      console.error('Error setting vault URD:', err);
      setError(err.message || 'Failed to set vault configuration');
    } finally {
      setIsSettingURD(false);
    }
  };

  // Don't show anything if we're still checking or if vault is not selected
  if (!vaultAddress || !networkConfig) {
    return null;
  }

  if (isChecking) {
    return (
      <Box width="100%" mb={4}>
        <Flex alignItems="center" gap={2}>
          <Spinner size="sm" color="dark.purple.500" />
          <Text color="dark.purple.500" fontSize="sm">
            Checking vault configuration...
          </Text>
        </Flex>
      </Box>
    );
  }

  // Show warning if URD is not set
  if (hasURD === false) {
    return (
      <Box width="100%" mb={4}>
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
                Vault Configuration Required
              </Text>
              <Text fontSize="sm">
                This spambox vault cannot receive and track assets properly
                until its asset tracking is activated. Click the activate button
                to fix this.
              </Text>
            </Box>
            <Button
              onClick={handleSetURD}
              size="sm"
              bg="white"
              color="orange.600"
              _hover={{ bg: 'gray.100' }}
              fontFamily="Bungee"
              fontSize="12px"
              flexShrink={0}
              isLoading={isSettingURD}
              loadingText="CONFIGURING..."
            >
              ACTIVATE VAULT
            </Button>
          </Flex>
        </Alert>
        {error && (
          <Text color="red.500" fontSize="sm" mt={2}>
            Error: {error}
          </Text>
        )}
      </Box>
    );
  }

  // URD is set correctly - don't show anything
  return null;
}
