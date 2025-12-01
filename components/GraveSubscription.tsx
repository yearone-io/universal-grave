'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  Input,
  useToast,
  Link as ChakraLink,
  Select,
  IconButton,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { FaCheckCircle, FaPlus, FaTrash } from 'react-icons/fa';
import { BrowserProvider, isAddress } from 'ethers';
import { useProfile } from '@/contexts/ProfileProvider';
import { useGrave } from '@/contexts/GraveContext';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { ZERO_ADDRESS } from '@/constants/addresses';
import { formatAddress } from '@/utils/tokenUtils';
import { subscribeToUAP, unsubscribeFromUAP } from '@/utils/uapSubscription';
import {
  isVaultRegistered,
  registerVaultWithUP,
  getRegisteredVaults,
  deployVault,
} from '@/utils/vaultCreation';
import { updateBECPermissions } from '@/utils/urdUtils';
import { getForwarderAssistantConfig } from '@/utils/assistantConfig';
import VaultURDChecker from './VaultURDChecker';

const GraveSubscription: React.FC = () => {
  const toast = useToast({ position: 'bottom-left' });
  const { profileDetailsData, isConnected, chainId } = useProfile();
  const {
    hasUAPSubscription,
    setupType,
    uapVaultAddress,
    graveVault,
    refreshGraveData,
    isLoadingGraveData,
  } = useGrave();

  const address = profileDetailsData?.upWallet;
  const mainUPController = profileDetailsData?.mainUPController;
  const currentNetwork = chainId ? supportedNetworks[chainId] : null;
  const vaultToUse = uapVaultAddress || graveVault;

  // Configuration state
  const [whitelistAddresses, setWhitelistAddresses] = useState<string[]>([]);
  const [curatedListAddress, setCuratedListAddress] = useState<string>('');
  const [useCuratedList, setUseCuratedList] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Vault selection state
  const [availableVaults, setAvailableVaults] = useState<string[]>([]);
  const [selectedVault, setSelectedVault] = useState<string>('');
  const [isLoadingVaults, setIsLoadingVaults] = useState(false);
  const [isCreatingVault, setIsCreatingVault] = useState(false);

  // Vault URD status tracking
  const [vaultHasURD, setVaultHasURD] = useState<boolean>(true); // Default to true to not block initially

  // Phase tracking
  // Phase 0: Give permissions
  // Phase 1: Subscribe to UAP
  // Phase 2: Configure GRAVE
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(false);

  // Fetch available vaults when component mounts or address changes
  useEffect(() => {
    const fetchVaults = async () => {
      if (!address || !window.lukso || !currentNetwork) return;

      setIsLoadingVaults(true);
      try {
        const provider = new BrowserProvider(window.lukso);
        const vaults = await getRegisteredVaults(provider, address);

        // Deduplicate vaults (case-insensitive) to avoid React key warnings
        let uniqueVaults = vaults.filter((vault, index, self) =>
          index === self.findIndex(v => v.toLowerCase() === vault.toLowerCase())
        );

        // Add legacy GRAVE vault to the list if it exists and isn't already included
        if (graveVault && !uniqueVaults.some(v => v.toLowerCase() === graveVault.toLowerCase())) {
          console.log('[GRAVE UI] Adding legacy vault to list:', graveVault);
          uniqueVaults = [...uniqueVaults, graveVault];
        }

        setAvailableVaults(uniqueVaults);

        // Get the vault address from forwarder assistant config
        const existingConfig = await getForwarderAssistantConfig(
          provider,
          address,
          {
            forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
            addressListScreenerAddress:
              currentNetwork.addressListScreenerAddress,
            curatedListScreenerAddress:
              currentNetwork.curatedListScreenerAddress,
          }
        );

        // Priority: If vault exists in config AND is part of owned vaults, select it
        // Use case-insensitive comparison because config returns checksummed addresses
        // but vault list may have different casing
        console.log('[GRAVE UI] Vault selection logic:', {
          configVault: existingConfig.vaultAddress,
          configVaultLower: existingConfig.vaultAddress?.toLowerCase(),
          legacyGraveVault: graveVault,
          uniqueVaults,
          uniqueVaultsLower: uniqueVaults.map(v => v.toLowerCase()),
        });

        // Find the exact vault from uniqueVaults that matches the config (case-insensitive)
        const matchingConfigVault = existingConfig.vaultAddress &&
          uniqueVaults.find(v => v.toLowerCase() === existingConfig.vaultAddress!.toLowerCase());

        const matchingLegacyVault = graveVault &&
          uniqueVaults.find(v => v.toLowerCase() === graveVault.toLowerCase());

        console.log('[GRAVE UI] Matched vaults:', {
          matchingConfigVault,
          matchingLegacyVault,
        });

        if (matchingConfigVault) {
          console.log('[GRAVE UI] ✅ Selecting vault from config:', matchingConfigVault);
          setSelectedVault(matchingConfigVault);
        } else if (matchingLegacyVault) {
          // If legacy GRAVE vault exists and is in owned vaults, select it
          console.log('[GRAVE UI] ✅ Selecting legacy GRAVE vault:', matchingLegacyVault);
          setSelectedVault(matchingLegacyVault);
        } else if (uniqueVaults.length > 0) {
          // Otherwise, select first available vault if any exist
          console.log('[GRAVE UI] ⚠️ Fallback to first vault:', uniqueVaults[0]);
          setSelectedVault(uniqueVaults[0]);
        } else {
          // No vaults available - user will need to create one
          console.log('[GRAVE UI] ⚠️ No vaults available');
          setSelectedVault('');
        }
      } catch (error) {
        console.error('Error fetching vaults:', error);
      } finally {
        setIsLoadingVaults(false);
      }
    };

    fetchVaults();
  }, [address, currentNetwork, graveVault]);

  // Fetch existing configuration and determine current step
  useEffect(() => {
    const fetchExistingConfig = async () => {
      if (
        !isLoadingGraveData &&
        address &&
        currentNetwork &&
        hasUAPSubscription
      ) {
        try {
          const provider = new BrowserProvider(window.lukso);
          const existingConfig = await getForwarderAssistantConfig(
            provider,
            address,
            {
              forwarderAssistantAddress:
                currentNetwork.forwarderAssistantAddress,
              addressListScreenerAddress:
                currentNetwork.addressListScreenerAddress,
              curatedListScreenerAddress:
                currentNetwork.curatedListScreenerAddress,
            }
          );

          // Populate form fields with existing configuration
          if (existingConfig.isConfigured) {
            if (existingConfig.whitelistAddresses.length > 0) {
              setWhitelistAddresses(existingConfig.whitelistAddresses);
            }
            if (existingConfig.curatedListAddress) {
              setCuratedListAddress(existingConfig.curatedListAddress);
              // useCuratedList is now auto-determined from address validity
            }
            // Set selected vault from config if available
            // Match case-insensitively with availableVaults to ensure correct display
            if (existingConfig.vaultAddress) {
              const matchingVault = availableVaults.find(
                v => v.toLowerCase() === existingConfig.vaultAddress!.toLowerCase()
              );
              if (matchingVault) {
                setSelectedVault(matchingVault);
              } else if (availableVaults.length > 0) {
                // Vault not found in available vaults, but we have vaults
                // This shouldn't happen, but fallback to first vault
                console.warn('[GRAVE] Config vault not found in available vaults:', existingConfig.vaultAddress);
                setSelectedVault(availableVaults[0]);
              }
            }
          } else if (setupType === 'legacy' && graveVault && availableVaults.length > 0) {
            // For legacy users with no existing config, auto-select the legacy vault
            const matchingLegacyVault = availableVaults.find(
              v => v.toLowerCase() === graveVault.toLowerCase()
            );
            if (matchingLegacyVault) {
              console.log('[GRAVE] Auto-selecting legacy vault for upgrade:', matchingLegacyVault);
              setSelectedVault(matchingLegacyVault);
            }
          }
        } catch (error) {
          console.error('Error fetching existing configuration:', error);
        }
      }
    };

    fetchExistingConfig();
  }, [isLoadingGraveData, address, currentNetwork, hasUAPSubscription, availableVaults, setupType, graveVault]);

  // Check if permissions are already granted
  useEffect(() => {
    const checkPermissions = async () => {
      if (!address || !mainUPController) {
        return;
      }
      try {
        const { doesControllerHaveMissingPermissions } = await import(
          '@/utils/urdUtils'
        );
        const missingPermissions = await doesControllerHaveMissingPermissions(
          mainUPController,
          address
        );
        setPermissionsGranted(missingPermissions.length === 0);
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    };

    checkPermissions();
  }, [address, mainUPController]);

  // Determine current phase based on setup state
  useEffect(() => {
    if (!isLoadingGraveData && address) {
      // Determine which phase we're in
      if (!hasUAPSubscription) {
        // If permissions not granted, show phase 0, otherwise show phase 1
        if (!permissionsGranted) {
          setCurrentPhase(0);
        } else {
          setCurrentPhase(1);
        }
      } else {
        // Subscription is done - show configuration phase
        setPermissionsGranted(true);
        setCurrentPhase(2);
      }
    }
  }, [hasUAPSubscription, isLoadingGraveData, address, permissionsGranted]);

  // Helper functions for managing whitelist addresses
  const addWhitelistAddress = () => {
    setWhitelistAddresses([...whitelistAddresses, '']);
  };

  const updateWhitelistAddress = (index: number, value: string) => {
    const newAddresses = [...whitelistAddresses];
    newAddresses[index] = value;
    setWhitelistAddresses(newAddresses);
  };

  const removeWhitelistAddress = (index: number) => {
    const newAddresses = whitelistAddresses.filter((_, i) => i !== index);
    setWhitelistAddresses(newAddresses);
  };

  // Validate inputs
  const validateConfiguration = (): string | null => {
    // Validate whitelist addresses
    const invalidWhitelist = whitelistAddresses.filter(
      addr => addr.trim() !== '' && !isAddress(addr.trim())
    );

    if (invalidWhitelist.length > 0) {
      return `Invalid addresses in whitelist: ${invalidWhitelist.join(', ')}`;
    }

    // Validate curated list address if provided
    if (curatedListAddress.trim() !== '') {
      if (!isAddress(curatedListAddress)) {
        return 'Invalid curated list contract address';
      }
      if (curatedListAddress === ZERO_ADDRESS) {
        return 'Cannot use zero address as curated list contract';
      }
    }

    return null;
  };

  // Step 1: Set permissions
  const handleSetPermissions = useCallback(async () => {
    if (!address || !mainUPController || !window.lukso) {
      toast({
        title: 'Error',
        description: 'Wallet not connected or controller not found',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);

    try {
      const provider = new BrowserProvider(window.lukso);
      await updateBECPermissions(provider, address, mainUPController);

      toast({
        title: 'Success',
        description: 'Permissions set successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setPermissionsGranted(true);
      setCurrentPhase(1); // Move to subscription phase
    } catch (err: any) {
      console.error('Error setting permissions:', err);
      if (!err.message?.includes('user rejected')) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to set permissions',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [address, mainUPController, toast]);

  // Step 2: Subscribe to UAP
  const handleSubscribe = useCallback(async () => {
    if (!address || !currentNetwork || !window.lukso) {
      toast({
        title: 'Error',
        description: 'Wallet not connected',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);

    try {
      const provider = new BrowserProvider(window.lukso);

      // Step 1: Subscribe to UAP
      await subscribeToUAP(
        provider,
        address,
        currentNetwork.protocolAddress,
        currentNetwork.lsp1UrdVault
      );

      // Step 2: Only configure Forwarder Assistant if a vault already exists
      const vaultForConfig = selectedVault || vaultToUse || graveVault;

      if (vaultForConfig) {
        toast({
          title: 'Protocol Installed',
          description: 'Configuring spam protection...',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });

        // Ensure vault is registered
        const isRegistered = await isVaultRegistered(
          provider,
          address,
          vaultForConfig
        );
        if (!isRegistered) {
          await registerVaultWithUP(provider, address, vaultForConfig);
        }

        // Configure with default settings (empty whitelist, no curated list)
        const { saveForwarderAssistantConfig } = await import(
          '@/utils/assistantConfig'
        );
        const { supportedNetworks: allNetworks } = await import(
          '@/constants/supportedNetworks'
        );

        await saveForwarderAssistantConfig(
          provider,
          address,
          vaultForConfig,
          [], // Empty whitelist by default
          false, // No curated list by default
          '', // Empty curated list address
          {
            forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
            addressListScreenerAddress: currentNetwork.addressListScreenerAddress,
            curatedListScreenerAddress: currentNetwork.curatedListScreenerAddress,
          },
          allNetworks,
          chainId
        );

        toast({
          title: 'Success',
          description: 'Spam protection is now active!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        // No vault exists yet, just show success for protocol installation
        toast({
          title: 'Success',
          description: 'Protocol installed! Please configure your spambox to activate protection.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }

      await refreshGraveData();
      setCurrentPhase(2); // Move to configuration phase
    } catch (err: any) {
      console.error('Error subscribing:', err);
      if (!err.message?.includes('user rejected')) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to enable GRAVE',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [address, currentNetwork, chainId, selectedVault, vaultToUse, graveVault, toast, refreshGraveData]);

  // Create new vault with metadata
  const handleCreateVault = useCallback(async () => {
    if (!address || !currentNetwork || !window.lukso) {
      toast({
        title: 'Error',
        description: 'Wallet not connected',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsCreatingVault(true);

    try {
      const provider = new BrowserProvider(window.lukso);

      toast({
        title: 'Deploying GRAVE Spambox...',
        description:
          'This may take a few moments. Please confirm the transaction.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      const vaultAddress = await deployVault(provider, address, currentNetwork);

      toast({
        title: 'Success! 🎉',
        description: `GRAVE Spambox deployed at ${formatAddress(vaultAddress)}`,
        status: 'success',
        duration: 7000,
        isClosable: true,
      });

      // Refresh the vault list
      const vaults = await getRegisteredVaults(provider, address);

      // Deduplicate vaults (case-insensitive)
      const uniqueVaults = vaults.filter((vault, index, self) =>
        index === self.findIndex(v => v.toLowerCase() === vault.toLowerCase())
      );

      setAvailableVaults(uniqueVaults);
      setSelectedVault(vaultAddress);
    } catch (err: any) {
      console.error('Error creating vault:', err);

      if (!err.message?.includes('user rejected')) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to create vault',
          status: 'error',
          duration: 7000,
          isClosable: true,
        });
      }
    } finally {
      setIsCreatingVault(false);
    }
  }, [address, currentNetwork, toast]);

  // Configure and activate GRAVE using the new unified assistant pattern
  const handleActivateGrave = useCallback(async () => {
    if (!address || !currentNetwork || !window.lukso || !chainId) {
      toast({
        title: 'Error',
        description: 'Wallet not connected',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const validationError = validateConfiguration();
    if (validationError) {
      toast({
        title: 'Validation Error',
        description: validationError,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);

    try {
      const provider = new BrowserProvider(window.lukso);

      // Use selected vault, or fall back to vaultToUse
      let finalVaultAddress = selectedVault || vaultToUse;

      if (!finalVaultAddress) {
        throw new Error('No vault selected. Please select a vault first.');
      }

      // Ensure vault is registered
      const isRegistered = await isVaultRegistered(
        provider,
        address,
        finalVaultAddress
      );
      if (!isRegistered) {
        await registerVaultWithUP(provider, address, finalVaultAddress);
      }

      // Filter out empty addresses and trim whitespace
      const whitelistArray = whitelistAddresses
        .map(addr => addr.trim())
        .filter(addr => addr !== '' && isAddress(addr));

      // Determine if curated list should be used based on whether there's a valid address
      const shouldUseCuratedList =
        curatedListAddress.trim() !== '' &&
        isAddress(curatedListAddress) &&
        curatedListAddress !== ZERO_ADDRESS;

      // Import and use the new save function following UP Assistants pattern
      const { saveForwarderAssistantConfig } = await import(
        '@/utils/assistantConfig'
      );
      const { supportedNetworks: allNetworks } = await import(
        '@/constants/supportedNetworks'
      );

      await saveForwarderAssistantConfig(
        provider,
        address,
        finalVaultAddress,
        whitelistArray,
        shouldUseCuratedList,
        curatedListAddress,
        {
          forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
          addressListScreenerAddress: currentNetwork.addressListScreenerAddress,
          curatedListScreenerAddress: currentNetwork.curatedListScreenerAddress,
        },
        allNetworks,
        chainId
      );

      toast({
        title: '🪲👻 Beetlejuice, Beetlejuice, Beetlejuice 👻🪲',
        status: 'success',
        duration: 9000,
        isClosable: true,
      });

      await refreshGraveData();
    } catch (err: any) {
      console.error('Error activating GRAVE:', err);
      if (!err.message?.includes('user rejected')) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to activate GRAVE',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [
    address,
    currentNetwork,
    chainId,
    whitelistAddresses,
    curatedListAddress,
    useCuratedList,
    selectedVault,
    vaultToUse,
    toast,
    refreshGraveData,
  ]);

  // Unsubscribe handler
  const handleUnsubscribe = useCallback(async () => {
    if (!address || !currentNetwork || !window.lukso) {
      toast({
        title: 'Error',
        description: 'Wallet not connected',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);

    try {
      const provider = new BrowserProvider(window.lukso);

      await unsubscribeFromUAP(
        provider,
        address,
        currentNetwork.protocolAddress,
        currentNetwork.lsp1UrdVault
      );

      toast({
        title: 'Success',
        description: 'Your UP left the grave. 👻🪦',
        status: 'success',
        duration: 9000,
        isClosable: true,
      });

      await refreshGraveData();

      // Reset configuration
      setWhitelistAddresses([]);
      setCuratedListAddress('');
      setUseCuratedList(false);
    } catch (err: any) {
      console.error('Error unsubscribing:', err);
      if (!err.message?.includes('user rejected')) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to unsubscribe',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [address, currentNetwork, toast, refreshGraveData]);

  if (!isConnected || !address) {
    return (
      <Box>
        <Text color="dark.purple.500">
          Please connect your wallet to set up GRAVE.
        </Text>
      </Box>
    );
  }

  // Phase 0: Give Permissions View
  if (currentPhase === 0 && !permissionsGranted) {
    return (
      <Box width="100%">
        <Text
          fontSize="20px"
          fontWeight="bold"
          fontFamily="Bungee"
          color="dark.purple.400"
          mb={4}
        >
          SET UP YOUR GRAVE SPAMBOX
        </Text>

        <Text fontSize="16px" color="dark.purple.500" mb={4}>
          In order to engage the GRAVE you must first subscribe to the Universal
          Assistant Protocol through your 🆙
        </Text>

        <Box
          p={6}
          bg="dark.purple.200"
          borderRadius="lg"
          mb={4}
          border="2px solid"
          borderColor="dark.purple.400"
        >
          <Text
            fontSize="18px"
            fontWeight="bold"
            fontFamily="Bungee"
            color="dark.purple.500"
            mb={3}
          >
            1. Give the UP Browser Extension the necessary permissions to
            subscribe to the protocol
          </Text>
          <Text fontSize="sm" color="dark.purple.500" mb={2}>
            Give permissions to your Browser Extension Controller.
            {mainUPController && currentNetwork && (
              <ChakraLink
                href={`${currentNetwork.explorer}/address/${mainUPController}`}
                color="dark.purple.500"
                textDecoration="underline"
                _hover={{ color: 'dark.purple.400' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                ({formatAddress(mainUPController)})
              </ChakraLink>
            )}
          </Text>
          <Text fontSize="sm" color="dark.purple.500" mb={4}>
            This can also be done manually through the UP Extension.
          </Text>

          <Button
            onClick={handleSetPermissions}
            isLoading={isProcessing}
            isDisabled={isProcessing}
            colorScheme="orange"
            size="lg"
            fontFamily="Bungee"
            fontSize="16px"
            fontWeight="400"
            width="full"
          >
            {isProcessing ? 'PROCESSING...' : 'GIVE PERMISSIONS'}
          </Button>
        </Box>
      </Box>
    );
  }

  // Phase 1: Subscribe to UAP View
  if (currentPhase === 1 && !hasUAPSubscription) {
    return (
      <Box width="100%">
        <Text
          fontSize="20px"
          fontWeight="bold"
          fontFamily="Bungee"
          color="dark.purple.400"
          mb={4}
        >
          {setupType === 'legacy' ? 'UPGRADE YOUR GRAVE SPAMBOX' : 'SET UP YOUR GRAVE SPAMBOX'}
        </Text>

        <Text fontSize="16px" color="dark.purple.500" mb={4}>
          In order to engage the GRAVE you must first subscribe to the Universal
          Assistant Protocol through your 🆙
        </Text>

        <Box
          p={6}
          bg="dark.purple.200"
          borderRadius="lg"
          mb={4}
          border="2px solid"
          borderColor="dark.purple.400"
        >
          <Flex align="center" mb={3}>
            <Text fontSize="24px" mr={2}>
              🪦
            </Text>
            <Text
              fontSize="18px"
              fontWeight="bold"
              fontFamily="Bungee"
              color="dark.purple.500"
            >
              1. Permissions Set
            </Text>
            <Box ml="auto">
              <FaCheckCircle
                color="var(--chakra-colors-dark-purple-500)"
                size={20}
              />
            </Box>
          </Flex>
        </Box>

        <Box
          p={6}
          bg="dark.purple.200"
          borderRadius="lg"
          mb={4}
          border="2px solid"
          borderColor="dark.purple.400"
        >
          <Text
            fontSize="18px"
            fontWeight="bold"
            fontFamily="Bungee"
            color="dark.purple.500"
            mb={3}
          >
            2. Install the Universal Assistant Protocol on your 🆙
          </Text>
          <Text fontSize="sm" color="dark.purple.500" mb={4}>
            Enable spam protection on your Universal Profile.
          </Text>

          <Button
            onClick={handleSubscribe}
            isLoading={isProcessing}
            isDisabled={isProcessing}
            colorScheme="orange"
            size="lg"
            fontFamily="Bungee"
            fontSize="16px"
            fontWeight="400"
            width="full"
          >
            {isProcessing
              ? setupType === 'legacy' ? 'UPGRADING...' : 'INSTALLING...'
              : setupType === 'legacy' ? 'UPGRADE PROTOCOL' : 'INSTALL PROTOCOL'}
          </Button>
        </Box>
      </Box>
    );
  }

  // Phase 2: Configure GRAVE (settings panel)
  return (
    <Flex width="100%" flexDirection="column" gap={6} textAlign={"left"}>
      <Text
        fontSize="20px"
        fontWeight="bold"
        fontFamily="Bungee"
        color="dark.purple.400"
      >
        CONFIGURE YOUR GRAVE SPAMBOX
      </Text>

      {/* Section A: Vault Selection */}
      <Box
        p={6}
        bg="dark.purple.200"
        borderRadius="lg"
        border="2px solid"
        borderColor="dark.purple.400"
      >
        <Flex align="start" justify="space-between" mb={4}>
          <Box>
            <Text
              fontSize="lg"
              fontWeight="bold"
              color="dark.purple.500"
              fontFamily="Bungee"
            >
              Select a Spambox
            </Text>
          </Box>
        </Flex>

        <Flex flexDirection="column" gap={3} maxWidth="550px" mb={3}>
          <Flex flexDirection="row" gap={4} align="center">
            <Text
              fontWeight="bold"
              fontSize="sm"
              color="dark.purple.500"
              w="40%"
            >
              Select or create a vault to be your spambox
            </Text>
            <Box w="60%">
              {isLoadingVaults ? (
                <Text fontSize="sm" color="dark.purple.500">
                  Loading vaults...
                </Text>
              ) : availableVaults.length > 0 ? (
                <Select
                  value={selectedVault}
                  onChange={e => setSelectedVault(e.target.value)}
                  fontFamily="mono"
                  size="sm"
                  color="dark.purple.500"
                  borderColor="dark.purple.500"
                  _focus={{ borderColor: 'dark.purple.400' }}
                  bg="white"
                >
                  {availableVaults.map((vault, idx) => {
                    const isLegacyVault = graveVault && vault.toLowerCase() === graveVault.toLowerCase();
                    const label = `Vault ${idx + 1}: ${formatAddress(vault)}${isLegacyVault ? ' (Legacy Vault)' : ''}`;
                    return (
                      <option key={vault} value={vault}>
                        {label}
                      </option>
                    );
                  })}
                </Select>
              ) : (
                <Flex flexDirection={"row"}>
                  <Text fontSize="sm" color="dark.purple.500">
                   ⚠️ No vaults found
                  </Text>
                </Flex>
              )}
            </Box>
          </Flex>

          {/* Always show create vault button */}
          <Flex justifyContent="flex-end">
            <Button
              onClick={handleCreateVault}
              isLoading={isCreatingVault}
              isDisabled={isCreatingVault}
              size="sm"
              fontFamily="Montserrat"
              fontSize="14px"
              fontWeight="600"
            >
              {isCreatingVault ? 'Creating...' : 'Create New Vault'}
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* Vault URD Checker - Critical validation */}
      <VaultURDChecker
        vaultAddress={selectedVault || null}
        networkConfig={currentNetwork}
        onURDStatusChange={setVaultHasURD}
      />

      {/* Section B: Transaction Screening */}
      <Box
        p={6}
        bg="dark.purple.200"
        borderRadius="lg"
        border="2px solid"
        borderColor="dark.purple.400"
        opacity={vaultHasURD ? 1 : 0.5}
        pointerEvents={vaultHasURD ? 'auto' : 'none'}
      >
        <Flex width="100%" flexDirection="column" alignItems={"flex-start"} gap={3} pb={4}>
          <Text
            fontSize="20px"
            fontWeight="bold"
            fontFamily="Bungee"
            color="dark.purple.400"
          >
            Spambox Filters
          </Text>
          <Text fontSize="sm" color="dark.purple.500">
          By default all assets are treated as spam and sent to the GRAVE.
          Below you can create exceptions.
          </Text>
        </Flex>

        <Flex flexDirection="column" gap={4}>
          {/* Screener 2: Curated List Screener (Optional) */}
          <Box
            p={4}
            bg="purple.50"
            borderRadius="md"
            border="2px solid"
            borderColor="dark.purple.400"
          >
            <Text
              fontSize="md"
              fontWeight="bold"
              color="dark.purple.500"
              mb={2}
            >
              Add a curated list of digital assets that are safe (NOT spam). These assets will stay in your UP! and not get sent to the GRAVE Spambox.
            </Text>
            <Input
              placeholder="0x... (curated list contract address - optional)"
              value={curatedListAddress}
              onChange={e => setCuratedListAddress(e.target.value)}
              fontFamily="mono"
              size="sm"
              color="dark.purple.600"
              bg="white"
              borderColor={
                curatedListAddress.trim() !== '' &&
                (!isAddress(curatedListAddress) || curatedListAddress === ZERO_ADDRESS)
                  ? 'red.300'
                  : 'dark.purple.300'
              }
              _hover={{
                borderColor: curatedListAddress.trim() !== '' &&
                            (!isAddress(curatedListAddress) || curatedListAddress === ZERO_ADDRESS)
                  ? 'red.400'
                  : 'dark.purple.400'
              }}
              _focus={{
                borderColor: curatedListAddress.trim() !== '' &&
                            (!isAddress(curatedListAddress) || curatedListAddress === ZERO_ADDRESS)
                  ? 'red.500'
                  : 'dark.purple.500',
                boxShadow: curatedListAddress.trim() !== '' &&
                          (!isAddress(curatedListAddress) || curatedListAddress === ZERO_ADDRESS)
                  ? '0 0 0 1px var(--chakra-colors-red-500)'
                  : '0 0 0 1px var(--chakra-colors-dark-purple-500)',
              }}
            />
            {curatedListAddress.trim() !== '' &&
             curatedListAddress === ZERO_ADDRESS && (
              <Text fontSize="xs" color="red.500" mt={1}>
                Zero address is not valid for curated list contract
              </Text>
            )}
            {curatedListAddress.trim() !== '' &&
             curatedListAddress !== ZERO_ADDRESS &&
             !isAddress(curatedListAddress) && (
              <Text fontSize="xs" color="red.500" mt={1}>
                Invalid curated list contract address
              </Text>
            )}
          </Box>

          {/* AND Logic Indicator */}
          <Box textAlign="center" py={2}>
            <Box
              display="inline-block"
              px={3}
              py={1}
              bg="dark.purple.500"
              color="white"
              borderRadius="full"
              fontSize="xs"
              fontWeight="bold"
            >
              OR
            </Box>
          </Box>

          {/* Screener 1: Address List Screener */}
          <Box
            p={4}
            bg="purple.50"
            borderRadius="md"
            border="2px solid"
            borderColor="dark.purple.400"
          >
            <Text
              fontSize="md"
              fontWeight="bold"
              color="dark.purple.500"
              mb={2}
            >
              Mark safe (NOT spam) assets manually
            </Text>
            <Text fontSize="sm" color="dark.purple.400" mb={3}>
              Assets with these addresses will NOT be sent to the GRAVE Spambox
            </Text>

            <VStack spacing={2} align="stretch">
              {whitelistAddresses.map((address, index) => (
                <HStack key={index}>
                  <Input
                    placeholder="0x... (address)"
                    value={address}
                    onChange={(e) => updateWhitelistAddress(index, e.target.value)}
                    fontFamily="mono"
                    size="sm"
                    color="dark.purple.600"
                    bg="white"
                    borderColor={address.trim() !== '' && !isAddress(address.trim()) ? 'red.300' : 'dark.purple.300'}
                    _hover={{ borderColor: address.trim() !== '' && !isAddress(address.trim()) ? 'red.400' : 'dark.purple.400' }}
                    _focus={{
                      borderColor: address.trim() !== '' && !isAddress(address.trim()) ? 'red.500' : 'dark.purple.500',
                      boxShadow: address.trim() !== '' && !isAddress(address.trim())
                        ? '0 0 0 1px var(--chakra-colors-red-500)'
                        : '0 0 0 1px var(--chakra-colors-dark-purple-500)',
                    }}
                  />
                  <IconButton
                    aria-label="Remove address"
                    icon={<FaTrash />}
                    size="sm"
                    colorScheme="red"
                    onClick={() => removeWhitelistAddress(index)}
                    variant="ghost"
                  />
                </HStack>
              ))}

              <Button
                leftIcon={<FaPlus />}
                onClick={addWhitelistAddress}
                size="sm"
                variant="outline"
                colorScheme="purple"
                width="full"
              >
                {whitelistAddresses.length === 0 ? 'Add Address' : 'Add Another Address'}
              </Button>
            </VStack>
          </Box>
        </Flex>
      </Box>

      {/* Section C: Save Actions */}
      <Flex gap={2} justifyContent="flex-start">
        <Button
          onClick={handleActivateGrave}
          isLoading={isProcessing}
          isDisabled={isProcessing || !selectedVault || !vaultHasURD || validateConfiguration() !== null}
          color="white"
          size="md"
          fontFamily="Bungee"
          fontSize="16px"
          fontWeight="400"
        >
          {isProcessing
            ? 'SAVING...'
            : setupType === 'legacy'
              ? 'UPGRADE & ACTIVATE'
              : 'SAVE & ACTIVATE'}
        </Button>
        <Button
          onClick={handleUnsubscribe}
          isLoading={isProcessing}
          isDisabled={isProcessing}
          variant="outline"
          color="dark.purple.500"
          borderColor="dark.purple.500"
          size="md"
          fontFamily="Bungee"
          fontSize="16px"
          fontWeight="400"
        >
          DEACTIVATE
        </Button>
      </Flex>
    </Flex>
  );
};

export default GraveSubscription;
