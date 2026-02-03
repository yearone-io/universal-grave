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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import {
  FaCheckCircle,
  FaPlus,
  FaTrash,
  FaChevronDown,
  FaCopy,
  FaQuestionCircle,
} from 'react-icons/fa';
import { BrowserProvider, isAddress, Contract } from 'ethers';
import { universalProfileAbi } from '@lukso/lsp-smart-contracts/abi';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProfile } from '@/contexts/ProfileProvider';
import { useGrave } from '@/contexts/GraveContext';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { ZERO_ADDRESS } from '@/constants/addresses';
import { formatAddress } from '@/utils/tokenUtils';
import {
  subscribeToUAP,
  unsubscribeFromUAP,
  subscribeAndConfigureGrave,
} from '@/utils/uapSubscription';
import {
  isVaultRegistered,
  registerVaultWithUP,
  getRegisteredVaults,
  deployVault,
} from '@/utils/vaultCreation';
import { updateBECPermissions } from '@/utils/urdUtils';
import {
  getForwarderAssistantConfig,
  removeForwarderAssistant,
  updateForwarderVaultAddress,
} from '@/utils/assistantConfig';
import VaultURDChecker from './VaultURDChecker';

const GraveSubscription: React.FC = () => {
  const toast = useToast({ position: 'bottom-left' });
  const params = useParams();
  const networkName = params.networkName as string;
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

  // Configuration state - Asset Filters
  const [whitelistAddresses, setWhitelistAddresses] = useState<string[]>([]);
  const [curatedListAddress, setCuratedListAddress] = useState<string>('');
  const [useCuratedList, setUseCuratedList] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSwitchingVault, setIsSwitchingVault] = useState(false);
  const [listName, setListName] = useState<string | null>(null);
  const [assetListLengthMissing, setAssetListLengthMissing] =
    useState<boolean>(false);
  const [assetListNameMissing, setAssetListNameMissing] =
    useState<boolean>(false);
  const [assetScreenerConfigMissing, setAssetScreenerConfigMissing] =
    useState<boolean>(false);

  // Configuration state - Creator Filters
  const [creatorWhitelistAddresses, setCreatorWhitelistAddresses] = useState<
    string[]
  >([]);
  const [creatorCuratedListAddress, setCreatorCuratedListAddress] =
    useState<string>('');
  const [requireAllCreatorsForList, setRequireAllCreatorsForList] =
    useState<boolean>(false);
  const [requireAllCreatorsForCuration, setRequireAllCreatorsForCuration] =
    useState<boolean>(false);
  const [creatorListName, setCreatorListName] = useState<string | null>(null);
  const [creatorListLengthMissing, setCreatorListLengthMissing] =
    useState<boolean>(false);
  const [creatorListNameMissing, setCreatorListNameMissing] =
    useState<boolean>(false);
  const [creatorScreenerConfigMissing, setCreatorScreenerConfigMissing] =
    useState<boolean>(false);


  // Original values for change detection (loaded from blockchain)
  const [originalWhitelistAddresses, setOriginalWhitelistAddresses] = useState<
    string[]
  >([]);
  const [originalCuratedListAddress, setOriginalCuratedListAddress] =
    useState<string>('');
  const [
    originalCreatorWhitelistAddresses,
    setOriginalCreatorWhitelistAddresses,
  ] = useState<string[]>([]);
  const [
    originalCreatorCuratedListAddress,
    setOriginalCreatorCuratedListAddress,
  ] = useState<string>('');
  const [
    originalRequireAllCreatorsForList,
    setOriginalRequireAllCreatorsForList,
  ] = useState<boolean>(false);
  const [
    originalRequireAllCreatorsForCuration,
    setOriginalRequireAllCreatorsForCuration,
  ] = useState<boolean>(false);

  // Vault selection state
  const [availableVaults, setAvailableVaults] = useState<string[]>([]);
  const [selectedVault, setSelectedVault] = useState<string>('');
  const [isLoadingVaults, setIsLoadingVaults] = useState(false);
  const [isCreatingVault, setIsCreatingVault] = useState(false);

  // Vault URD status tracking
  const [vaultHasURD, setVaultHasURD] = useState<boolean>(true); // Default to true to not block initially

  // Step tracking (renamed from Phase for clarity)
  // Step 0: Grant BEC permissions
  // Step 1: Select/Create vault + validate URD
  // Step 2: Subscribe to UAP with defaults
  // Step 3: Configure filters
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(false);
  const [vaultSelected, setVaultSelected] = useState<boolean>(false);
  const [subscriptionComplete, setSubscriptionComplete] =
    useState<boolean>(false);

  // Modal state for UAP deactivation confirmation
  const {
    isOpen: isDeactivateUAPModalOpen,
    onOpen: onOpenDeactivateUAPModal,
    onClose: onCloseDeactivateUAPModal,
  } = useDisclosure();

  // Fetch available vaults when component mounts or address changes
  useEffect(() => {
    const fetchVaults = async () => {
      if (!address || !window.lukso || !currentNetwork) return;

      setIsLoadingVaults(true);
      try {
        const provider = new BrowserProvider(window.lukso);
        const vaults = await getRegisteredVaults(provider, address);

        // Deduplicate vaults (case-insensitive) to avoid React key warnings
        let uniqueVaults = vaults.filter(
          (vault, index, self) =>
            index ===
            self.findIndex(v => v.toLowerCase() === vault.toLowerCase())
        );

        // Add legacy GRAVE vault to the list if it exists and isn't already included
        if (
          graveVault &&
          !uniqueVaults.some(v => v.toLowerCase() === graveVault.toLowerCase())
        ) {
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
            creatorListScreenerAddress:
              currentNetwork.creatorListScreenerAddress,
            creatorCurationScreenerAddress:
              currentNetwork.creatorCurationScreenerAddress,
          }
        );
        setAssetListLengthMissing(!!existingConfig.listLengthMissing);
        setAssetListNameMissing(!!existingConfig.addressListNameMissing);
        setAssetScreenerConfigMissing(
          !!existingConfig.addressScreenerConfigMissing
        );
        setCreatorListLengthMissing(!!existingConfig.creatorListLengthMissing);
        setCreatorListNameMissing(!!existingConfig.creatorListNameMissing);
        setCreatorScreenerConfigMissing(
          !!existingConfig.creatorScreenerConfigMissing
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
        const matchingConfigVault =
          existingConfig.vaultAddress &&
          uniqueVaults.find(
            v => v.toLowerCase() === existingConfig.vaultAddress!.toLowerCase()
          );

        const matchingLegacyVault =
          graveVault &&
          uniqueVaults.find(v => v.toLowerCase() === graveVault.toLowerCase());

        console.log('[GRAVE UI] Matched vaults:', {
          matchingConfigVault,
          matchingLegacyVault,
        });

        if (matchingConfigVault) {
          console.log(
            '[GRAVE UI] ✅ Selecting vault from config:',
            matchingConfigVault
          );
          setSelectedVault(matchingConfigVault);
        } else if (matchingLegacyVault) {
          // If legacy GRAVE vault exists and is in owned vaults, select it
          console.log(
            '[GRAVE UI] ✅ Selecting legacy GRAVE vault:',
            matchingLegacyVault
          );
          setSelectedVault(matchingLegacyVault);
        } else if (uniqueVaults.length > 0) {
          // Otherwise, select first available vault if any exist
          console.log(
            '[GRAVE UI] ⚠️ Fallback to first vault:',
            uniqueVaults[0]
          );
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
              creatorListScreenerAddress:
                currentNetwork.creatorListScreenerAddress,
              creatorCurationScreenerAddress:
                currentNetwork.creatorCurationScreenerAddress,
            }
          );
          setAssetListLengthMissing(!!existingConfig.listLengthMissing);
          setAssetListNameMissing(!!existingConfig.addressListNameMissing);
          setAssetScreenerConfigMissing(
            !!existingConfig.addressScreenerConfigMissing
          );
          setCreatorListLengthMissing(!!existingConfig.creatorListLengthMissing);
          setCreatorListNameMissing(!!existingConfig.creatorListNameMissing);
          setCreatorScreenerConfigMissing(
            !!existingConfig.creatorScreenerConfigMissing
          );

          // Populate form fields with existing configuration
          if (existingConfig.isConfigured) {
            // Asset filter configuration
            if (existingConfig.whitelistAddresses.length > 0) {
              setWhitelistAddresses(existingConfig.whitelistAddresses);
              setOriginalWhitelistAddresses(existingConfig.whitelistAddresses);
            } else {
              setOriginalWhitelistAddresses([]);
            }
            if (existingConfig.curatedListAddress) {
              setCuratedListAddress(existingConfig.curatedListAddress);
              setOriginalCuratedListAddress(existingConfig.curatedListAddress);
              // useCuratedList is now auto-determined from address validity
            } else {
              setOriginalCuratedListAddress('');
            }
            // Capture list name for notification
            if (existingConfig.listName) {
              setListName(existingConfig.listName);
            }

            // Creator filter configuration
            if (existingConfig.creatorWhitelistAddresses.length > 0) {
              setCreatorWhitelistAddresses(
                existingConfig.creatorWhitelistAddresses
              );
              setOriginalCreatorWhitelistAddresses(
                existingConfig.creatorWhitelistAddresses
              );
            } else {
              setOriginalCreatorWhitelistAddresses([]);
            }
            if (existingConfig.creatorCuratedListAddress) {
              setCreatorCuratedListAddress(
                existingConfig.creatorCuratedListAddress
              );
              setOriginalCreatorCuratedListAddress(
                existingConfig.creatorCuratedListAddress
              );
            } else {
              setOriginalCreatorCuratedListAddress('');
            }
            setRequireAllCreatorsForList(
              existingConfig.requireAllCreatorsForList
            );
            setOriginalRequireAllCreatorsForList(
              existingConfig.requireAllCreatorsForList
            );
            setRequireAllCreatorsForCuration(
              existingConfig.requireAllCreatorsForCuration
            );
            setOriginalRequireAllCreatorsForCuration(
              existingConfig.requireAllCreatorsForCuration
            );
            if (existingConfig.creatorListName) {
              setCreatorListName(existingConfig.creatorListName);
            }
            // Set selected vault from config if available
            // Match case-insensitively with availableVaults to ensure correct display
            if (existingConfig.vaultAddress) {
              const matchingVault = availableVaults.find(
                v =>
                  v.toLowerCase() === existingConfig.vaultAddress!.toLowerCase()
              );
              if (matchingVault) {
                setSelectedVault(matchingVault);
              } else if (availableVaults.length > 0) {
                // Vault not found in available vaults, but we have vaults
                // This shouldn't happen, but fallback to first vault
                console.warn(
                  '[GRAVE] Config vault not found in available vaults:',
                  existingConfig.vaultAddress
                );
                setSelectedVault(availableVaults[0]);
              }
            }
          } else if (
            setupType === 'legacy' &&
            graveVault &&
            availableVaults.length > 0
          ) {
            // For legacy users with no existing config, auto-select the legacy vault
            const matchingLegacyVault = availableVaults.find(
              v => v.toLowerCase() === graveVault.toLowerCase()
            );
            if (matchingLegacyVault) {
              console.log(
                '[GRAVE] Auto-selecting legacy vault for upgrade:',
                matchingLegacyVault
              );
              setSelectedVault(matchingLegacyVault);
            }
          }
        } catch (error) {
          console.error('Error fetching existing configuration:', error);
        }
      }
    };

    fetchExistingConfig();
  }, [
    isLoadingGraveData,
    address,
    currentNetwork,
    hasUAPSubscription,
    availableVaults,
    setupType,
    graveVault,
  ]);

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

  // Determine current step based on setup state (backwards compatibility)
  useEffect(() => {
    const determineStartingStep = async () => {
      if (isLoadingGraveData || !address || !currentNetwork) return;

      // STEP 0: Check permissions
      if (!permissionsGranted) {
        setCurrentStep(0);
        return;
      }

      // STEP 1: Check UAP subscription
      if (!hasUAPSubscription) {
        setCurrentStep(1); // Vault selection
        return;
      }

      // STEP 2 or 3: Check if Forwarder config exists and is complete
      try {
        const provider = new BrowserProvider(window.lukso);
        const config = await getForwarderAssistantConfig(provider, address, {
          forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
          addressListScreenerAddress: currentNetwork.addressListScreenerAddress,
          curatedListScreenerAddress: currentNetwork.curatedListScreenerAddress,
          creatorListScreenerAddress: currentNetwork.creatorListScreenerAddress,
          creatorCurationScreenerAddress:
            currentNetwork.creatorCurationScreenerAddress,
        });

        // Check if configuration is complete (requires all UAP keys including screener config)
        const isComplete =
          config.isConfigured &&
          config.vaultAddress &&
          config.executionOrderLSP7 !== null &&
          config.executionOrderLSP8 !== null &&
          config.listName !== null; // Screener config chain present

        if (!isComplete) {
          // Has UAP but no/incomplete Forwarder config
          // If no vault configured, go back to Step 1 for vault selection
          if (!config.vaultAddress) {
            setCurrentStep(1);
            return;
          }
          // Has vault but config incomplete - go to Step 2
          setSelectedVault(config.vaultAddress);
          setVaultSelected(true);
          setVaultHasURD(true); // Assume valid if config exists
          setCurrentStep(2);
          setSubscriptionComplete(false);
        } else {
          // Has complete config - go to Step 3 (filters)
          if (config.vaultAddress) {
            setSelectedVault(config.vaultAddress);
            setVaultSelected(true);
            setVaultHasURD(true);
          }
          setCurrentStep(3);
          setSubscriptionComplete(true);
        }
      } catch (error) {
        console.error('Error determining starting step:', error);
        // Default to Step 1 (vault selection) for safety when config can't be read
        setCurrentStep(1);
      }
    };

    determineStartingStep();
  }, [
    hasUAPSubscription,
    isLoadingGraveData,
    address,
    currentNetwork,
    permissionsGranted,
  ]);

  // Helper functions for managing whitelist addresses (Asset Filters)
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

  // Helper functions for managing creator whitelist addresses (Creator Filters)
  const addCreatorWhitelistAddress = () => {
    setCreatorWhitelistAddresses([...creatorWhitelistAddresses, '']);
  };

  const updateCreatorWhitelistAddress = (index: number, value: string) => {
    const newAddresses = [...creatorWhitelistAddresses];
    newAddresses[index] = value;
    setCreatorWhitelistAddresses(newAddresses);
  };

  const removeCreatorWhitelistAddress = (index: number) => {
    const newAddresses = creatorWhitelistAddresses.filter(
      (_, i) => i !== index
    );
    setCreatorWhitelistAddresses(newAddresses);
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

    // Validate creator whitelist addresses
    const invalidCreatorWhitelist = creatorWhitelistAddresses.filter(
      addr => addr.trim() !== '' && !isAddress(addr.trim())
    );

    if (invalidCreatorWhitelist.length > 0) {
      return `Invalid addresses in creator whitelist: ${invalidCreatorWhitelist.join(', ')}`;
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

    // Validate creator curated list address if provided
    if (creatorCuratedListAddress.trim() !== '') {
      if (!isAddress(creatorCuratedListAddress)) {
        return 'Invalid creator curated list contract address';
      }
      if (creatorCuratedListAddress === ZERO_ADDRESS) {
        return 'Cannot use zero address as creator curated list contract';
      }
    }

    return null;
  };

  // Helper functions to detect unsaved changes - Asset Filters
  const hasAddressListChanges = (): boolean => {
    // Normalize both arrays: trim, filter empty, lowercase, sort
    const normalize = (arr: string[]) =>
      arr
        .map(a => a.trim().toLowerCase())
        .filter(a => a !== '' && isAddress(a))
        .sort();
    const current = normalize(whitelistAddresses);
    const original = normalize(originalWhitelistAddresses);
    if (current.length !== original.length) return true;
    return current.some((addr, i) => addr !== original[i]);
  };

  const hasCuratedListChanges = (): boolean => {
    const currentNormalized = curatedListAddress.trim().toLowerCase();
    const originalNormalized = originalCuratedListAddress.trim().toLowerCase();
    return currentNormalized !== originalNormalized;
  };

  // Helper functions to detect unsaved changes - Creator Filters
  const hasCreatorAddressListChanges = (): boolean => {
    const normalize = (arr: string[]) =>
      arr
        .map(a => a.trim().toLowerCase())
        .filter(a => a !== '' && isAddress(a))
        .sort();
    const current = normalize(creatorWhitelistAddresses);
    const original = normalize(originalCreatorWhitelistAddresses);
    if (current.length !== original.length) return true;
    return current.some((addr, i) => addr !== original[i]);
  };

  const hasCreatorCuratedListChanges = (): boolean => {
    const currentNormalized = creatorCuratedListAddress.trim().toLowerCase();
    const originalNormalized = originalCreatorCuratedListAddress
      .trim()
      .toLowerCase();
    return currentNormalized !== originalNormalized;
  };

  const hasRequireAllCreatorsChanges = (): boolean => {
    return (
      requireAllCreatorsForList !== originalRequireAllCreatorsForList ||
      requireAllCreatorsForCuration !== originalRequireAllCreatorsForCuration
    );
  };


  // Handler for URD status changes from VaultURDChecker
  const handleURDStatusChange = useCallback(
    (hasURD: boolean) => {
      setVaultHasURD(hasURD);
      // Only consider vault selected if URD is valid
      setVaultSelected(hasURD && selectedVault !== '');
    },
    [selectedVault]
  );

  // Handler for moving from Step 1 to Step 2
  const handleNextStep = useCallback(() => {
    if (vaultSelected && vaultHasURD) {
      setCurrentStep(2);
    }
  }, [vaultSelected, vaultHasURD]);

  // Step 0: Set permissions
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
      setCurrentStep(1); // Move to vault selection step
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

  // Step 2: Subscribe to UAP with Complete Defaults (NEW)
  const handleSubscribeWithDefaults = useCallback(async () => {
    if (
      !address ||
      !currentNetwork ||
      !window.lukso ||
      !chainId ||
      !selectedVault
    ) {
      toast({
        title: 'Error',
        description:
          'Missing required data. Please ensure a vault is selected.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);

    try {
      const provider = new BrowserProvider(window.lukso);

      // STEP 1: Check if UAP subscription already exists
      const alreadySubscribed = hasUAPSubscription; // from context

      // STEP 2: Ensure vault is registered first (if not already)
      const isRegistered = await isVaultRegistered(
        provider,
        address,
        selectedVault
      );
      if (!isRegistered) {
        toast({
          title: 'Registering Vault',
          description: 'Adding vault to your profile...',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        await registerVaultWithUP(provider, address, selectedVault);
      }

      // STEP 3: Ensure browser extension has necessary permissions (including ADDCONTROLLER)
      // This must be done before subscribing to UAP
      if (mainUPController) {
        toast({
          title: 'Checking Permissions',
          description: 'Ensuring your wallet has the required permissions...',
          status: 'info',
          duration: 2000,
          isClosable: true,
        });
        await updateBECPermissions(provider, address, mainUPController);
      }

      // STEP 4: If not subscribed, use unified function (single transaction)
      if (!alreadySubscribed) {
        toast({
          title: 'Setting Up Protection',
          description:
            'Installing UAP protocol and configuring GRAVE Spambox...',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });

        // Single transaction: UAP subscription + forwarder assistant + screener config
        await subscribeAndConfigureGrave(
          provider,
          address,
          currentNetwork.protocolAddress,
          selectedVault,
          {
            forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
            addressListScreenerAddress:
              currentNetwork.addressListScreenerAddress,
            creatorListScreenerAddress:
              currentNetwork.creatorListScreenerAddress,
          }
        );
      } else {
        // STEP 5: Already subscribed - check if config needs updating
        const existingConfig = await getForwarderAssistantConfig(
          provider,
          address,
          {
            forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
            addressListScreenerAddress:
              currentNetwork.addressListScreenerAddress,
            curatedListScreenerAddress:
              currentNetwork.curatedListScreenerAddress,
            creatorListScreenerAddress:
              currentNetwork.creatorListScreenerAddress,
            creatorCurationScreenerAddress:
              currentNetwork.creatorCurationScreenerAddress,
          }
        );

        const needsConfig =
          !existingConfig.isConfigured ||
          !existingConfig.vaultAddress ||
          !existingConfig.listName || // Screener config missing
          existingConfig.vaultAddress.toLowerCase() !==
            selectedVault.toLowerCase();

        if (needsConfig) {
          toast({
            title: 'Configuring Spambox',
            description: 'Setting up default configuration...',
            status: 'info',
            duration: 3000,
            isClosable: true,
          });

          const { saveForwarderAssistantConfig } = await import(
            '@/utils/assistantConfig'
          );
          const { supportedNetworks: allNetworks } = await import(
            '@/constants/supportedNetworks'
          );

          await saveForwarderAssistantConfig(
            provider,
            address,
            selectedVault,
            [], // Empty whitelist (length 0, no members)
            false, // No curated list
            '', // Empty curated list address
            [], // Empty creator whitelist
            null, // No creator curated list
            false, // requireAllCreatorsForList
            false, // requireAllCreatorsForCuration
            {
              forwarderAssistantAddress:
                currentNetwork.forwarderAssistantAddress,
              addressListScreenerAddress:
                currentNetwork.addressListScreenerAddress,
              curatedListScreenerAddress:
                currentNetwork.curatedListScreenerAddress,
              creatorListScreenerAddress:
                currentNetwork.creatorListScreenerAddress,
              creatorCurationScreenerAddress:
                currentNetwork.creatorCurationScreenerAddress,
            },
            allNetworks,
            chainId
          );
        }
      }

      toast({
        title: 'Success!',
        description:
          'Spambox is active with default settings. Configure filters next.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Update original values to reflect saved state (empty on initial setup)
      setOriginalWhitelistAddresses([]);
      setOriginalCuratedListAddress('');

      await refreshGraveData();
      setSubscriptionComplete(true);
      setCurrentStep(3); // Move to filter configuration step
    } catch (err: any) {
      console.error('Error in handleSubscribeWithDefaults:', err);
      if (!err.message?.includes('user rejected')) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to complete setup',
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
    selectedVault,
    hasUAPSubscription,
    mainUPController,
    toast,
    refreshGraveData,
  ]);

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
      const uniqueVaults = vaults.filter(
        (vault, index, self) =>
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

  // Create a new vault and set it as the active GRAVE spambox (advanced flow)
  const handleCreateAndSwitchVault = useCallback(async () => {
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

    setIsSwitchingVault(true);

    try {
      const provider = new BrowserProvider(window.lukso);

      toast({
        title: 'Deploying new GRAVE Spambox...',
        description: 'Please confirm the transaction.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      const vaultAddress = await deployVault(provider, address, currentNetwork);

      // Ensure vault is registered
      const isRegistered = await isVaultRegistered(
        provider,
        address,
        vaultAddress
      );
      if (!isRegistered) {
        await registerVaultWithUP(provider, address, vaultAddress);
      }

      // Refresh the vault list
      const vaults = await getRegisteredVaults(provider, address);
      const uniqueVaults = vaults.filter(
        (vault, index, self) =>
          index === self.findIndex(v => v.toLowerCase() === vault.toLowerCase())
      );
      setAvailableVaults(uniqueVaults);
      setSelectedVault(vaultAddress);
      setVaultSelected(true);
      setVaultHasURD(true);

      await updateForwarderVaultAddress(
        provider,
        address,
        vaultAddress,
        {
          forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
        }
      );

      await refreshGraveData();

      toast({
        title: 'New spambox activated',
        description: `GRAVE Spambox set to ${formatAddress(vaultAddress)}`,
        status: 'success',
        duration: 7000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error('Error creating/switching vault:', err);
      if (!err.message?.includes('user rejected')) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to create new spambox',
          status: 'error',
          duration: 7000,
          isClosable: true,
        });
      }
    } finally {
      setIsSwitchingVault(false);
    }
  }, [
    address,
    currentNetwork,
    toast,
    refreshGraveData,
  ]);

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

      // Filter out empty addresses and trim whitespace - Asset Filters
      const whitelistArray = whitelistAddresses
        .map(addr => addr.trim())
        .filter(addr => addr !== '' && isAddress(addr));

      // Determine if curated list should be used based on whether there's a valid address
      const shouldUseCuratedList =
        curatedListAddress.trim() !== '' &&
        isAddress(curatedListAddress) &&
        curatedListAddress !== ZERO_ADDRESS;

      // Filter out empty addresses and trim whitespace - Creator Filters
      const creatorWhitelistArray = creatorWhitelistAddresses
        .map(addr => addr.trim())
        .filter(addr => addr !== '' && isAddress(addr));

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
        creatorWhitelistArray,
        creatorCuratedListAddress.trim() !== ''
          ? creatorCuratedListAddress
          : null,
        requireAllCreatorsForList,
        requireAllCreatorsForCuration,
        {
          forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
          addressListScreenerAddress: currentNetwork.addressListScreenerAddress,
          curatedListScreenerAddress: currentNetwork.curatedListScreenerAddress,
          creatorListScreenerAddress: currentNetwork.creatorListScreenerAddress,
          creatorCurationScreenerAddress:
            currentNetwork.creatorCurationScreenerAddress,
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

      // Update original values to reflect saved state - Asset Filters
      setOriginalWhitelistAddresses(whitelistArray);
      setOriginalCuratedListAddress(
        shouldUseCuratedList ? curatedListAddress : ''
      );
      // Update original values to reflect saved state - Creator Filters
      setOriginalCreatorWhitelistAddresses(creatorWhitelistArray);
      setOriginalCreatorCuratedListAddress(
        creatorCuratedListAddress.trim() !== '' ? creatorCuratedListAddress : ''
      );
      setOriginalRequireAllCreatorsForList(requireAllCreatorsForList);
      setOriginalRequireAllCreatorsForCuration(requireAllCreatorsForCuration);

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

  // Deactivate GRAVE Forwarder Only - removes only Forwarder configuration
  const handleDeactivateGrave = useCallback(async () => {
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

      await removeForwarderAssistant(provider, address, {
        forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
        addressListScreenerAddress: currentNetwork.addressListScreenerAddress,
        curatedListScreenerAddress: currentNetwork.curatedListScreenerAddress,
        creatorListScreenerAddress: currentNetwork.creatorListScreenerAddress,
        creatorCurationScreenerAddress:
          currentNetwork.creatorCurationScreenerAddress,
      });

      toast({
        title: 'Success',
        description: 'GRAVE Spambox deactivated successfully. 👻',
        status: 'success',
        duration: 9000,
        isClosable: true,
      });

      await refreshGraveData();

      // Reset configuration
      setWhitelistAddresses([]);
      setCuratedListAddress('');
      setUseCuratedList(false);

      // Reset step/subscription state so Install triggers proper transaction
      setSubscriptionComplete(false);
      setVaultSelected(false);
    } catch (err: any) {
      console.error('Error deactivating GRAVE:', err);
      if (!err.message?.includes('user rejected')) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to deactivate GRAVE spambox',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [address, currentNetwork, toast, refreshGraveData]);

  // Deactivate UAP Completely - removes all UAP configuration including all executive assistants
  const handleDeactivateUAP = useCallback(async () => {
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

    setIsProcessing(true);

    try {
      const provider = new BrowserProvider(window.lukso);
      const signer = await provider.getSigner();
      const upContract = new Contract(address, universalProfileAbi, signer);

      const { ERC725 } = await import('@erc725/erc725.js');
      const uapSchema = (await import('@/schemas/UAP.json')).default;
      const erc725UAP = new ERC725(uapSchema as any, address, window.lukso);

      const keys: string[] = [];
      const values: string[] = [];

      // Transaction types to clear
      const LSP7_TRANSACTION_TYPE =
        '0xa124442e1820e52d1e5a85c5ea8cb3cd0ea171df8e3a62be0f4f5a16fa7fee79';
      const LSP8_TRANSACTION_TYPE =
        '0xc7a120a42b6057a0cbed111fcdea5093c2b7f5db2f9e3a9ec3a8f09c4dad5e13';
      const txTypes = [LSP7_TRANSACTION_TYPE, LSP8_TRANSACTION_TYPE];

      // 1. Clear SupportedStandards:UAP
      keys.push(erc725UAP.encodeKeyName('SupportedStandards:UAP', []));
      values.push('0x');

      // 2. For each transaction type, clear all UAP keys
      for (const txType of txTypes) {
        // Get current executives to know how many to clear
        const typeConfigKey = erc725UAP.encodeKeyName(
          'UAPTypeConfig:<bytes32>',
          [txType]
        );

        let currentExecutives: string[] = [];
        try {
          const currentValue = await upContract.getData(typeConfigKey);
          if (currentValue && currentValue !== '0x') {
            currentExecutives = erc725UAP.decodeValueType(
              'address[]',
              currentValue
            ) as string[];
          }
        } catch (error) {
          console.warn('Could not fetch current executives:', error);
        }

        // Clear UAPTypeConfig
        keys.push(typeConfigKey);
        values.push('0x');

        // Clear all executive configs and screeners
        for (let i = 0; i < currentExecutives.length; i++) {
          // Clear UAPExecutiveConfig
          keys.push(
            erc725UAP.encodeKeyName('UAPExecutiveConfig:<bytes32>:<uint256>', [
              txType,
              i.toString(),
            ])
          );
          values.push('0x');

          // Clear UAPExecutiveScreeners
          keys.push(
            erc725UAP.encodeKeyName(
              'UAPExecutiveScreeners:<bytes32>:<uint256>',
              [txType, i.toString()]
            )
          );
          values.push('0x');

          // Clear UAPExecutiveScreenersANDLogic
          keys.push(
            erc725UAP.encodeKeyName(
              'UAPExecutiveScreenersANDLogic:<bytes32>:<uint256>',
              [txType, i.toString()]
            )
          );
          values.push('0x');

          // For each screener, calculate screener order and clear configs
          // Note: We'll clear up to 5 possible screeners per executive (reasonable max)
          for (let j = 0; j < 5; j++) {
            const screenerOrder = i * 1000 + j;

            // Clear UAPScreenerConfig
            keys.push(
              erc725UAP.encodeKeyName('UAPScreenerConfig:<bytes32>:<uint256>', [
                txType,
                screenerOrder.toString(),
              ])
            );
            values.push('0x');

            // Clear UAPAddressListName
            keys.push(
              erc725UAP.encodeKeyName(
                'UAPAddressListName:<bytes32>:<uint256>',
                [txType, screenerOrder.toString()]
              )
            );
            values.push('0x');
          }
        }
      }

      // 3. Clear UAPRevertOnFailure (singleton key)
      keys.push(
        '0x8631ee7d1d9475e6b2c38694122192970d91cafd1c64176ecc23849e17441672'
      );
      values.push('0x');

      // 4. Unsubscribe from UAP protocol (remove URD and permissions)
      await unsubscribeFromUAP(
        provider,
        address,
        currentNetwork.protocolAddress,
        currentNetwork.lsp1UrdUp
      );

      // 5. Execute batch transaction to clear all UAP data keys
      if (keys.length > 0) {
        const tx = await upContract.setDataBatch(keys, values);
        await tx.wait();
      }

      toast({
        title: 'UAP Deactivated',
        description:
          'Universal Assistant Protocol has been completely deactivated. All executive assistants removed.',
        status: 'success',
        duration: 9000,
        isClosable: true,
      });

      onCloseDeactivateUAPModal();
      await refreshGraveData();

      // Reset all configuration
      setWhitelistAddresses([]);
      setCuratedListAddress('');
      setUseCuratedList(false);
      setSubscriptionComplete(false);
      setCurrentStep(0); // Reset to initial step
    } catch (err: any) {
      console.error('Error deactivating UAP:', err);
      if (!err.message?.includes('user rejected')) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to deactivate UAP',
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
    toast,
    refreshGraveData,
    onCloseDeactivateUAPModal,
  ]);

  // Migrate to default list name
  const handleMigrateToDefaultListName = useCallback(async () => {
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

    if (!selectedVault) {
      toast({
        title: 'Error',
        description: 'No vault selected',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);

    try {
      const provider = new BrowserProvider(window.lukso);

      // Read addresses directly from both LSP7 and LSP8 lists on-chain
      const { getAllWhitelistAddresses, saveForwarderAssistantConfig } =
        await import('@/utils/assistantConfig');
      const { supportedNetworks: allNetworks } = await import(
        '@/constants/supportedNetworks'
      );

      console.log('[Migration] Reading addresses from blockchain...');
      const listData = await getAllWhitelistAddresses(provider, address, {
        forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
        addressListScreenerAddress: currentNetwork.addressListScreenerAddress,
      });

      console.log('[Migration] List data:', {
        lsp7: listData.listNameLSP7,
        lsp8: listData.listNameLSP8,
        lsp7Addresses: listData.lsp7Addresses.length,
        lsp8Addresses: listData.lsp8Addresses.length,
        totalMerged: listData.addresses.length,
      });

      // Check if LSP7 and LSP8 had different addresses
      const listsDiffer =
        listData.lsp7Addresses.length !== listData.lsp8Addresses.length ||
        !listData.lsp7Addresses.every(addr =>
          listData.lsp8Addresses.some(
            a => a.toLowerCase() === addr.toLowerCase()
          )
        );

      if (listsDiffer) {
        console.warn('[Migration] LSP7 and LSP8 lists differ, merging...');
      }

      const shouldUseCuratedList =
        curatedListAddress.trim() !== '' &&
        isAddress(curatedListAddress) &&
        curatedListAddress !== ZERO_ADDRESS;

      // During migration, preserve current creator filter state
      const creatorWhitelistArray = creatorWhitelistAddresses
        .map(a => a.trim())
        .filter(a => a !== '' && isAddress(a));

      await saveForwarderAssistantConfig(
        provider,
        address,
        selectedVault,
        listData.addresses, // Use merged addresses from blockchain
        shouldUseCuratedList,
        curatedListAddress,
        creatorWhitelistArray,
        creatorCuratedListAddress.trim() !== ''
          ? creatorCuratedListAddress
          : null,
        requireAllCreatorsForList,
        requireAllCreatorsForCuration,
        {
          forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
          addressListScreenerAddress: currentNetwork.addressListScreenerAddress,
          curatedListScreenerAddress: currentNetwork.curatedListScreenerAddress,
          creatorListScreenerAddress: currentNetwork.creatorListScreenerAddress,
          creatorCurationScreenerAddress:
            currentNetwork.creatorCurationScreenerAddress,
        },
        allNetworks,
        chainId,
        { forceListNameUpdate: true }
      );

      const migrationMessage = listsDiffer
        ? `Migrated and merged ${listData.addresses.length} addresses (${listData.lsp7Addresses.length} from LSP7, ${listData.lsp8Addresses.length} from LSP8)`
        : `Migrated ${listData.addresses.length} address${listData.addresses.length === 1 ? '' : 'es'}`;

      toast({
        title: 'Migration Complete',
        description: `${migrationMessage} to GraveSafeAssets`,
        status: 'success',
        duration: 7000,
        isClosable: true,
      });

      // Refresh to show updated list name and addresses
      await refreshGraveData();
      setListName('GraveSafeAssets');

      // Update component state with merged addresses
      setWhitelistAddresses(listData.addresses);
      // Update original values to reflect saved state
      setOriginalWhitelistAddresses(listData.addresses);
    } catch (err: any) {
      console.error('Error migrating list name:', err);
      if (!err.message?.includes('user rejected')) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to migrate list name',
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
    selectedVault,
    curatedListAddress,
    toast,
    refreshGraveData,
  ]);

  if (!isConnected || !address) {
    return (
      <Box>
        <Text color="dark.purple.500">
          Please connect your wallet to set up GRAVE.
        </Text>
      </Box>
    );
  }

  // Step 0: Give Permissions View
  if (currentStep === 0 && !permissionsGranted) {
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

  // Step 1: Vault Selection View
  // Shows when user needs to select vault (regardless of UAP subscription status)
  if (currentStep === 1) {
    return (
      <Box width="100%">
        <Text
          fontSize="20px"
          fontWeight="bold"
          fontFamily="Bungee"
          color="dark.purple.400"
          mb={4}
        >
          {setupType === 'legacy'
            ? 'UPGRADE YOUR GRAVE SPAMBOX'
            : 'SET UP YOUR GRAVE SPAMBOX'}
        </Text>

        <Text fontSize="16px" color="dark.purple.500" mb={4}>
          Select or create a vault to serve as your spambox
        </Text>

        {/* Step 1: Permissions Set (Completed) */}
        <Box
          p={6}
          bg="dark.purple.200"
          borderRadius="lg"
          mb={4}
          border="2px solid"
          borderColor="dark.purple.400"
        >
          <Flex align="center">
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

        {/* Step 2: Vault Selection (Current) */}
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
            mb={4}
          >
            2. Select or Create a Spambox Vault
          </Text>

          <Flex flexDirection="column" gap={3} mb={4}>
            <Text fontSize="sm" color="dark.purple.500" fontWeight="bold">
              Select a vault to be your spambox
            </Text>
            {isLoadingVaults ? (
              <Text fontSize="sm" color="dark.purple.500">
                Loading vaults...
              </Text>
            ) : availableVaults.length > 0 ? (
              <Select
                value={selectedVault}
                onChange={e => {
                  setSelectedVault(e.target.value);
                  setVaultSelected(false); // Reset until URD is validated
                }}
                fontFamily="mono"
                size="md"
                color="dark.purple.500"
                borderColor="dark.purple.500"
                _focus={{ borderColor: 'dark.purple.400' }}
                bg="white"
              >
                {availableVaults.map((vault, idx) => {
                  const isLegacyVault =
                    graveVault &&
                    vault.toLowerCase() === graveVault.toLowerCase();
                  const label = `Vault ${idx + 1}: ${formatAddress(vault)}${isLegacyVault ? ' (Legacy Vault)' : ''}`;
                  return (
                    <option key={vault} value={vault}>
                      {label}
                    </option>
                  );
                })}
              </Select>
            ) : (
              <Text fontSize="sm" color="dark.purple.500">
                ⚠️ No vaults found. Please create one below.
              </Text>
            )}

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

          {/* Vault URD Checker */}
          {selectedVault && (
            <Box mb={4}>
              <VaultURDChecker
                vaultAddress={selectedVault}
                networkConfig={currentNetwork}
                onURDStatusChange={handleURDStatusChange}
              />
            </Box>
          )}

          <Button
            onClick={handleNextStep}
            isDisabled={!vaultSelected || !vaultHasURD}
            colorScheme="orange"
            size="lg"
            fontFamily="Bungee"
            fontSize="16px"
            fontWeight="400"
            width="full"
          >
            NEXT
          </Button>
        </Box>
      </Box>
    );
  }

  // Step 2: Subscribe with Defaults (NEW)
  if (currentStep === 2 && !subscriptionComplete) {
    return (
      <Box width="100%">
        <Text
          fontSize="20px"
          fontWeight="bold"
          fontFamily="Bungee"
          color="dark.purple.400"
          mb={4}
        >
          {setupType === 'legacy'
            ? 'UPGRADE YOUR GRAVE SPAMBOX'
            : 'SET UP YOUR GRAVE SPAMBOX'}
        </Text>

        <Text fontSize="16px" color="dark.purple.500" mb={4}>
          Install the Universal Assistant Protocol with default spam protection
        </Text>

        {/* Step 1: Permissions Set (Completed) */}
        <Box
          p={6}
          bg="dark.purple.200"
          borderRadius="lg"
          mb={4}
          border="2px solid"
          borderColor="dark.purple.400"
        >
          <Flex align="center">
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

        {/* Step 2: Vault Selected (Completed) */}
        <Box
          p={6}
          bg="dark.purple.200"
          borderRadius="lg"
          mb={4}
          border="2px solid"
          borderColor="dark.purple.400"
        >
          <Flex align="center">
            <Text fontSize="24px" mr={2}>
              🗄️
            </Text>
            <Text
              fontSize="18px"
              fontWeight="bold"
              fontFamily="Bungee"
              color="dark.purple.500"
            >
              2. Vault Selected: {formatAddress(selectedVault)}
            </Text>
            <Box ml="auto">
              <FaCheckCircle
                color="var(--chakra-colors-dark-purple-500)"
                size={20}
              />
            </Box>
          </Flex>
        </Box>

        {/* Step 3: Install Protocol (Current) */}
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
            mb={4}
          >
            3. Install Universal Assistant Protocol & ACTIVATE SPAM PROTECTION
          </Text>

          <Text fontSize="sm" color="dark.purple.500" mb={3}>
            This will:
          </Text>
          <Box as="ul" pl={6} mb={4}>
            <Box as="li" fontSize="sm" color="dark.purple.500" mb={1}>
              Enable spam protection for your Universal Profile
            </Box>
            <Box as="li" fontSize="sm" color="dark.purple.500" mb={1}>
              Treat all incoming assets as spam and send them to your GRAVE
              Spambox
            </Box>
            <Box as="li" fontSize="sm" color="dark.purple.500" mb={1}>
              Give you the ability to subscribe to community curated lists of
              non-spam assets that get sent to your Universal Profile rather
              than getting treated as spam
            </Box>
            <Box as="li" fontSize="sm" color="dark.purple.500" mb={1}>
              Provide you with the ability to manually add assets as exceptions
              that won't get treated as spam
            </Box>
          </Box>

          <Text fontSize="sm" color="dark.purple.500" mb={4} fontStyle="italic">
            You can configure further configure your spam filters once this step
            is complete
          </Text>

          <Button
            onClick={handleSubscribeWithDefaults}
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
              ? setupType === 'legacy'
                ? 'UPGRADING...'
                : 'INSTALLING...'
              : setupType === 'legacy'
                ? 'UPGRADE PROTOCOL'
                : 'INSTALL PROTOCOL'}
          </Button>
        </Box>
      </Box>
    );
  }

  // Step 3: Configure Filters (final step - modified from old Phase 2)
  return (
    <Flex width="100%" flexDirection="column" gap={6} textAlign={'left'}>
      <Text
        fontSize="20px"
        fontWeight="bold"
        fontFamily="Bungee"
        color="dark.purple.400"
      >
        CONFIGURE SPAMBOX FILTERS
      </Text>

      {/* Setup Complete Message */}
      <Box
        p={4}
        bg="green.50"
        borderRadius="lg"
        border="2px solid"
        borderColor="green.300"
      >
        <Flex align="center" mb={2}>
          <FaCheckCircle color="var(--chakra-colors-green-500)" size={20} />
          <Text fontSize="md" fontWeight="bold" color="green.700" ml={2}>
            Setup Complete! Spambox is Active
          </Text>
        </Flex>
        <Text fontSize="sm" color="green.600">
          Your spambox is protecting your UP! All incoming assets will be sent
          to your vault at{' '}
          <Text as="span" fontFamily="mono" fontWeight="bold">
            {formatAddress(selectedVault)}
          </Text>
          <IconButton
            aria-label="Copy vault address"
            icon={<FaCopy />}
            size="xs"
            ml={2}
            variant="ghost"
            color="green.600"
            _hover={{ bg: 'green.100' }}
            onClick={() => {
              navigator.clipboard.writeText(selectedVault);
              toast({
                title: 'Copied!',
                description: 'Vault address copied to clipboard',
                status: 'success',
                duration: 2000,
                isClosable: true,
              });
            }}
          />
          <Link href={`/${networkName}/grave/${address}`} passHref>
            <ChakraLink
              color="green.700"
              fontWeight="bold"
              fontSize="sm"
              textDecoration="underline"
              ml={2}
            >
              View Spambox →
            </ChakraLink>
          </Link>
        </Text>
      </Box>

      <Accordion allowToggle>
        <AccordionItem
          border="2px solid"
          borderColor="dark.purple.400"
          borderRadius="lg"
          bg="dark.purple.200"
        >
          <AccordionButton
            _hover={{ bg: 'dark.purple.300' }}
            borderRadius="lg"
            px={4}
            py={3}
          >
            <Box flex="1" textAlign="left">
              <Text
                fontSize="16px"
                fontWeight="bold"
                fontFamily="Bungee"
                color="dark.purple.500"
              >
                Advanced: Create a fresh spambox
              </Text>
              <Text fontSize="sm" color="dark.purple.500">
                Deploy a new vault and switch your GRAVE to it instantly.
              </Text>
            </Box>
            <AccordionIcon color="dark.purple.500" />
          </AccordionButton>
          <AccordionPanel pt={0} pb={4}>
            <Text fontSize="sm" color="dark.purple.500" mb={3}>
              We’ll keep your current filters and set the new vault as your
              active GRAVE spambox.
            </Text>
            <Button
              onClick={handleCreateAndSwitchVault}
              isLoading={isSwitchingVault}
              isDisabled={isSwitchingVault || isProcessing}
              size="sm"
              fontFamily="Montserrat"
              fontSize="14px"
              fontWeight="600"
            >
              {isSwitchingVault ? 'Creating...' : 'Create New Spambox Vault'}
            </Button>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      {/* Section B: Transaction Screening */}
      <Box
        p={6}
        bg="dark.purple.200"
        borderRadius="lg"
        border="2px solid"
        borderColor="dark.purple.400"
      >
        <Flex
          width="100%"
          flexDirection="column"
          alignItems={'flex-start'}
          gap={3}
          pb={4}
        >
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
          {/* Creator Filters Section */}
          <Box>
            <Text
              fontSize="md"
              fontWeight="bold"
              fontFamily="Bungee"
              color="dark.purple.400"
              mb={2}
            >
              Creator Filters
            </Text>
            <Text fontSize="xs" color="dark.purple.500" mb={3}>
              Filter assets based on who created them. If the asset&apos;s
              creator(s) are trusted, the asset stays in your UP.
            </Text>

            <Flex flexDirection="column" gap={3}>
              {/* Creator Curated List Screener */}
              <Box
                p={4}
                bg="purple.50"
                borderRadius="md"
                border="2px solid"
                borderColor="dark.purple.400"
              >
                <Flex align="center" gap={2} mb={2}>
                  <Text fontSize="md" fontWeight="bold" color="dark.purple.500">
                    Creator Curated List
                  </Text>
                  {hasCreatorCuratedListChanges() &&
                    creatorCuratedListAddress.trim() !== '' &&
                    isAddress(creatorCuratedListAddress) && (
                      <Badge
                        bg="orange.400"
                        color="white"
                        fontSize="xs"
                        fontWeight="bold"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                      >
                        UNSAVED CHANGES
                      </Badge>
                    )}
                  {!hasCreatorCuratedListChanges() &&
                    originalCreatorCuratedListAddress.trim() !== '' && (
                      <Badge
                        bg="green.500"
                        color="white"
                        fontSize="xs"
                        fontWeight="bold"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                      >
                        ACTIVE
                      </Badge>
                    )}
                </Flex>
                <Text fontSize="sm" color="dark.purple.400" mb={3}>
                  Assets whose creators are members of this curated list will
                  stay in your UP.
                </Text>

                {/* RequireAllCreators Toggle for Creator Curation */}
                <HStack mb={3} spacing={2} align="center">
                  <Text
                    fontSize="sm"
                    color={
                      !creatorCuratedListAddress.trim() ||
                      !isAddress(creatorCuratedListAddress)
                        ? 'gray.400'
                        : 'dark.purple.500'
                    }
                  >
                    Match:
                  </Text>
                  <HStack spacing={0} borderRadius="md" overflow="hidden">
                    <Button
                      size="xs"
                      variant={
                        !requireAllCreatorsForCuration ? 'solid' : 'outline'
                      }
                      colorScheme="purple"
                      borderRightRadius={0}
                      onClick={() => setRequireAllCreatorsForCuration(false)}
                      isDisabled={
                        !creatorCuratedListAddress.trim() ||
                        !isAddress(creatorCuratedListAddress)
                      }
                    >
                      Any creator
                    </Button>
                    <Button
                      size="xs"
                      variant={
                        requireAllCreatorsForCuration ? 'solid' : 'outline'
                      }
                      colorScheme="purple"
                      borderLeftRadius={0}
                      onClick={() => setRequireAllCreatorsForCuration(true)}
                      isDisabled={
                        !creatorCuratedListAddress.trim() ||
                        !isAddress(creatorCuratedListAddress)
                      }
                    >
                      All creators
                    </Button>
                  </HStack>
                  <Tooltip
                    label={
                      !creatorCuratedListAddress.trim() ||
                      !isAddress(creatorCuratedListAddress)
                        ? 'Add a curated list address to enable this option'
                        : 'Choose whether ANY or ALL creators must be in the list'
                    }
                    fontSize="xs"
                    placement="top"
                    hasArrow
                  >
                    <Box as="span" color="gray.400" cursor="help">
                      <FaQuestionCircle size={12} />
                    </Box>
                  </Tooltip>
                </HStack>

                <Input
                  placeholder="0x... (creator curated list contract address - optional)"
                  value={creatorCuratedListAddress}
                  onChange={e => setCreatorCuratedListAddress(e.target.value)}
                  fontFamily="mono"
                  size="sm"
                  color="dark.purple.600"
                  bg="white"
                  borderColor={
                    creatorCuratedListAddress.trim() !== '' &&
                    (!isAddress(creatorCuratedListAddress) ||
                      creatorCuratedListAddress === ZERO_ADDRESS)
                      ? 'red.300'
                      : 'dark.purple.300'
                  }
                  _hover={{
                    borderColor:
                      creatorCuratedListAddress.trim() !== '' &&
                      (!isAddress(creatorCuratedListAddress) ||
                        creatorCuratedListAddress === ZERO_ADDRESS)
                        ? 'red.400'
                        : 'dark.purple.400',
                  }}
                  _focus={{
                    borderColor:
                      creatorCuratedListAddress.trim() !== '' &&
                      (!isAddress(creatorCuratedListAddress) ||
                        creatorCuratedListAddress === ZERO_ADDRESS)
                        ? 'red.500'
                        : 'dark.purple.500',
                    boxShadow:
                      creatorCuratedListAddress.trim() !== '' &&
                      (!isAddress(creatorCuratedListAddress) ||
                        creatorCuratedListAddress === ZERO_ADDRESS)
                        ? '0 0 0 1px var(--chakra-colors-red-500)'
                        : '0 0 0 1px var(--chakra-colors-dark-purple-500)',
                  }}
                />
                {creatorCuratedListAddress.trim() !== '' &&
                  creatorCuratedListAddress === ZERO_ADDRESS && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      Zero address is not valid for creator curated list
                      contract
                    </Text>
                  )}
                {creatorCuratedListAddress.trim() !== '' &&
                  creatorCuratedListAddress !== ZERO_ADDRESS &&
                  !isAddress(creatorCuratedListAddress) && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      Invalid creator curated list contract address
                    </Text>
                  )}
              </Box>

              {/* OR Logic Indicator */}
              <Box textAlign="center" py={1}>
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

              {/* Safe Creators List */}
              <Box
                p={4}
                bg="purple.50"
                borderRadius="md"
                border="2px solid"
                borderColor="dark.purple.400"
              >
                <Flex align="center" gap={2} mb={2}>
                  <Text fontSize="md" fontWeight="bold" color="dark.purple.500">
                    Safe Creators List
                  </Text>
                  {(hasCreatorAddressListChanges() ||
                    hasRequireAllCreatorsChanges()) &&
                    creatorWhitelistAddresses.some(
                      a => a.trim() !== '' && isAddress(a.trim())
                    ) && (
                      <Badge
                        bg="orange.400"
                        color="white"
                        fontSize="xs"
                        fontWeight="bold"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                      >
                        UNSAVED CHANGES
                      </Badge>
                    )}
                  {!(
                    hasCreatorAddressListChanges() ||
                    hasRequireAllCreatorsChanges()
                  ) &&
                    originalCreatorWhitelistAddresses.length > 0 && (
                      <Badge
                        bg="green.500"
                        color="white"
                        fontSize="xs"
                        fontWeight="bold"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                      >
                        ACTIVE
                      </Badge>
                    )}
                </Flex>
                <Text fontSize="sm" color="dark.purple.400" mb={3}>
                  Assets from these creators will NOT be sent to the GRAVE
                  Spambox
                </Text>
                {(creatorListLengthMissing ||
                  creatorListNameMissing ||
                  creatorScreenerConfigMissing) && (
                  <Box
                    p={3}
                    mb={3}
                    bg="orange.50"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="orange.300"
                  >
                    <Text
                      fontSize="sm"
                      color="orange.800"
                      fontWeight="bold"
                      mb={1}
                    >
                      ⚠️ Creator List Configuration Issue
                    </Text>
                    <Text fontSize="xs" color="orange.700">
                      {creatorScreenerConfigMissing &&
                        'Missing creator screener config key. '}
                      {creatorListNameMissing &&
                        'Missing creator list name key. '}
                      {creatorListLengthMissing &&
                        'Missing GraveSafeCreators[] length key. '}
                      This can cause transfers to revert when the creator list
                      screener runs. Save settings to initialize missing keys.
                    </Text>
                  </Box>
                )}

                {/* RequireAllCreators Toggle for Creator List */}
                <HStack mb={3} spacing={2} align="center">
                  <Text
                    fontSize="sm"
                    color={
                      !creatorWhitelistAddresses.some(
                        a => a.trim() !== '' && isAddress(a.trim())
                      )
                        ? 'gray.400'
                        : 'dark.purple.500'
                    }
                  >
                    Match:
                  </Text>
                  <HStack spacing={0} borderRadius="md" overflow="hidden">
                    <Button
                      size="xs"
                      variant={!requireAllCreatorsForList ? 'solid' : 'outline'}
                      colorScheme="purple"
                      borderRightRadius={0}
                      onClick={() => setRequireAllCreatorsForList(false)}
                      isDisabled={
                        !creatorWhitelistAddresses.some(
                          a => a.trim() !== '' && isAddress(a.trim())
                        )
                      }
                    >
                      Any creator
                    </Button>
                    <Button
                      size="xs"
                      variant={requireAllCreatorsForList ? 'solid' : 'outline'}
                      colorScheme="purple"
                      borderLeftRadius={0}
                      onClick={() => setRequireAllCreatorsForList(true)}
                      isDisabled={
                        !creatorWhitelistAddresses.some(
                          a => a.trim() !== '' && isAddress(a.trim())
                        )
                      }
                    >
                      All creators
                    </Button>
                  </HStack>
                  <Tooltip
                    label={
                      !creatorWhitelistAddresses.some(
                        a => a.trim() !== '' && isAddress(a.trim())
                      )
                        ? 'Add at least one creator address to enable this option'
                        : 'Choose whether ANY or ALL creators must be in the list'
                    }
                    fontSize="xs"
                    placement="top"
                    hasArrow
                  >
                    <Box as="span" color="gray.400" cursor="help">
                      <FaQuestionCircle size={12} />
                    </Box>
                  </Tooltip>
                </HStack>

                <VStack spacing={2} align="stretch">
                  {creatorWhitelistAddresses.map((addr, index) => (
                    <HStack key={index}>
                      <Input
                        placeholder="0x... (creator address)"
                        value={addr}
                        onChange={e =>
                          updateCreatorWhitelistAddress(index, e.target.value)
                        }
                        fontFamily="mono"
                        size="sm"
                        color="dark.purple.600"
                        bg="white"
                        borderColor={
                          addr.trim() !== '' && !isAddress(addr.trim())
                            ? 'red.300'
                            : 'dark.purple.300'
                        }
                        _hover={{
                          borderColor:
                            addr.trim() !== '' && !isAddress(addr.trim())
                              ? 'red.400'
                              : 'dark.purple.400',
                        }}
                        _focus={{
                          borderColor:
                            addr.trim() !== '' && !isAddress(addr.trim())
                              ? 'red.500'
                              : 'dark.purple.500',
                          boxShadow:
                            addr.trim() !== '' && !isAddress(addr.trim())
                              ? '0 0 0 1px var(--chakra-colors-red-500)'
                              : '0 0 0 1px var(--chakra-colors-dark-purple-500)',
                        }}
                      />
                      <IconButton
                        aria-label="Remove creator address"
                        icon={<FaTrash />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => removeCreatorWhitelistAddress(index)}
                        variant="ghost"
                      />
                    </HStack>
                  ))}

                  <Button
                    leftIcon={<FaPlus />}
                    onClick={addCreatorWhitelistAddress}
                    size="sm"
                    variant="transparentDark"
                    colorScheme="purple"
                    width="full"
                  >
                    {creatorWhitelistAddresses.length === 0
                      ? 'Add Creator Address'
                      : 'Add Another Creator'}
                  </Button>
                </VStack>
              </Box>
            </Flex>
          </Box>

          {/* OR Logic Indicator between Creator Filters and Asset Filters */}
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

          {/* Asset Filters Section */}
          <Box>
            <Text
              fontSize="md"
              fontWeight="bold"
              fontFamily="Bungee"
              color="dark.purple.400"
              mb={2}
            >
              Asset Filters
            </Text>
            <Text fontSize="xs" color="dark.purple.500" mb={3}>
              Filter assets based on the asset address itself.
            </Text>

            <Flex flexDirection="column" gap={3}>
              {/* Asset Curated List Screener (Optional) */}
              <Box
                p={4}
                bg="purple.50"
                borderRadius="md"
                border="2px solid"
                borderColor="dark.purple.400"
              >
                <Flex align="center" gap={2} mb={2}>
                  <Text fontSize="md" fontWeight="bold" color="dark.purple.500">
                    Curated List
                  </Text>
                  {hasCuratedListChanges() && (
                    <Badge
                      bg="orange.400"
                      color="white"
                      fontSize="xs"
                      fontWeight="bold"
                      px={2}
                      py={0.5}
                      borderRadius="md"
                    >
                      UNSAVED CHANGES
                    </Badge>
                  )}
                  {!hasCuratedListChanges() &&
                    originalCuratedListAddress.trim() !== '' && (
                      <Badge
                        bg="green.500"
                        color="white"
                        fontSize="xs"
                        fontWeight="bold"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                      >
                        ACTIVE
                      </Badge>
                    )}
                </Flex>
                <Text fontSize="sm" color="dark.purple.400" mb={2}>
                  Add a curated list of digital assets that are safe (NOT spam).
                  These assets will stay in your UP! and not get sent to the
                  GRAVE Spambox.
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
                    (!isAddress(curatedListAddress) ||
                      curatedListAddress === ZERO_ADDRESS)
                      ? 'red.300'
                      : 'dark.purple.300'
                  }
                  _hover={{
                    borderColor:
                      curatedListAddress.trim() !== '' &&
                      (!isAddress(curatedListAddress) ||
                        curatedListAddress === ZERO_ADDRESS)
                        ? 'red.400'
                        : 'dark.purple.400',
                  }}
                  _focus={{
                    borderColor:
                      curatedListAddress.trim() !== '' &&
                      (!isAddress(curatedListAddress) ||
                        curatedListAddress === ZERO_ADDRESS)
                        ? 'red.500'
                        : 'dark.purple.500',
                    boxShadow:
                      curatedListAddress.trim() !== '' &&
                      (!isAddress(curatedListAddress) ||
                        curatedListAddress === ZERO_ADDRESS)
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

              {/* OR Logic Indicator */}
              <Box textAlign="center" py={1}>
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

              {/* Safe Assets List (Address List Screener) */}
              <Box
                p={4}
                bg="purple.50"
                borderRadius="md"
                border="2px solid"
                borderColor="dark.purple.400"
              >
                <Flex align="center" gap={2} mb={2}>
                  <Text fontSize="md" fontWeight="bold" color="dark.purple.500">
                    Safe Assets List
                  </Text>
                  {hasAddressListChanges() && (
                    <Badge
                      bg="orange.400"
                      color="white"
                      fontSize="xs"
                      fontWeight="bold"
                      px={2}
                      py={0.5}
                      borderRadius="md"
                    >
                      UNSAVED CHANGES
                    </Badge>
                  )}
                  {!hasAddressListChanges() &&
                    originalWhitelistAddresses.length > 0 && (
                      <Badge
                        bg="green.500"
                        color="white"
                        fontSize="xs"
                        fontWeight="bold"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                      >
                        ACTIVE
                      </Badge>
                    )}
                </Flex>
                <Text fontSize="sm" color="dark.purple.400" mb={3}>
                  Assets with these addresses will NOT be sent to the GRAVE
                  Spambox
                </Text>
                {(assetListLengthMissing ||
                  assetListNameMissing ||
                  assetScreenerConfigMissing) && (
                  <Box
                    p={3}
                    mb={3}
                    bg="orange.50"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="orange.300"
                  >
                    <Text
                      fontSize="sm"
                      color="orange.800"
                      fontWeight="bold"
                      mb={1}
                    >
                      ⚠️ Asset List Configuration Issue
                    </Text>
                    <Text fontSize="xs" color="orange.700">
                      {assetScreenerConfigMissing &&
                        'Missing asset screener config key. '}
                      {assetListNameMissing &&
                        'Missing asset list name key. '}
                      {assetListLengthMissing &&
                        'Missing GraveSafeAssets[] length key. '}
                      This can cause transfers to revert when the asset list
                      screener runs. Save settings to initialize missing keys.
                    </Text>
                  </Box>
                )}

                {/* List Name Warning - Show if using non-default list name */}
                {listName && listName !== 'GraveSafeAssets' && (
                  <Box
                    p={3}
                    mb={3}
                    bg="orange.50"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="orange.300"
                  >
                    <Flex align="start" justify="space-between" gap={3}>
                      <Box flex="1">
                        <Text
                          fontSize="sm"
                          color="orange.800"
                          fontWeight="bold"
                          mb={1}
                        >
                          ⚠️ Non-Standard List Name
                        </Text>
                        <Text fontSize="xs" color="orange.700" mb={1}>
                          Using:{' '}
                          <Text as="span" fontFamily="mono" fontWeight="bold">
                            {listName}
                          </Text>
                        </Text>
                        <Text fontSize="xs" color="orange.700" mb={2}>
                          Recommended:{' '}
                          <Text as="span" fontFamily="mono" fontWeight="bold">
                            GraveSafeAssets
                          </Text>
                        </Text>
                        <Text fontSize="xs" color="orange.600">
                          Migrating to the recommended name saves storage and
                          gas costs.
                        </Text>
                      </Box>
                      <Button
                        size="sm"
                        colorScheme="orange"
                        onClick={handleMigrateToDefaultListName}
                        isLoading={isProcessing}
                        isDisabled={isProcessing}
                        fontWeight="600"
                        fontSize="xs"
                      >
                        Migrate
                      </Button>
                    </Flex>
                  </Box>
                )}

                <VStack spacing={2} align="stretch">
                  {whitelistAddresses.map((address, index) => (
                    <HStack key={index}>
                      <Input
                        placeholder="0x... (address)"
                        value={address}
                        onChange={e =>
                          updateWhitelistAddress(index, e.target.value)
                        }
                        fontFamily="mono"
                        size="sm"
                        color="dark.purple.600"
                        bg="white"
                        borderColor={
                          address.trim() !== '' && !isAddress(address.trim())
                            ? 'red.300'
                            : 'dark.purple.300'
                        }
                        _hover={{
                          borderColor:
                            address.trim() !== '' && !isAddress(address.trim())
                              ? 'red.400'
                              : 'dark.purple.400',
                        }}
                        _focus={{
                          borderColor:
                            address.trim() !== '' && !isAddress(address.trim())
                              ? 'red.500'
                              : 'dark.purple.500',
                          boxShadow:
                            address.trim() !== '' && !isAddress(address.trim())
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
                    variant="transparentDark"
                    colorScheme="purple"
                    width="full"
                  >
                    {whitelistAddresses.length === 0
                      ? 'Add Address'
                      : 'Add Another Address'}
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
              isDisabled={isProcessing || validateConfiguration() !== null}
              color="white"
              size="md"
              fontFamily="Bungee"
              fontSize="16px"
              fontWeight="400"
            >
              {isProcessing ? 'SAVING...' : 'SAVE CHANGES'}
            </Button>

            {/* Deactivate Dropdown Menu */}
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<FaChevronDown />}
                isLoading={isProcessing}
                isDisabled={isProcessing}
                variant="outline"
                color="dark.purple.500"
                borderColor="dark.purple.500"
                size="md"
                fontFamily="Bungee"
                fontSize="16px"
                fontWeight="400"
                _hover={{ bg: 'dark.purple.50' }}
              >
                DEACTIVATE
              </MenuButton>
              <MenuList
                bg="dark.purple.100"
                borderColor="dark.purple.300"
                borderWidth="2px"
                borderRadius="lg"
                boxShadow="lg"
                py={2}
              >
                <MenuItem
                  onClick={handleDeactivateGrave}
                  fontFamily="Montserrat"
                  fontWeight="600"
                  color="dark.purple.500"
                  bg="transparent"
                  _hover={{ bg: 'dark.purple.200' }}
                  _focus={{ bg: 'dark.purple.200' }}
                >
                  Deactivate GRAVE Spambox Only
                </MenuItem>
                <MenuItem
                  onClick={onOpenDeactivateUAPModal}
                  fontFamily="Montserrat"
                  fontWeight="600"
                  color="red.600"
                  bg="transparent"
                  _hover={{ bg: 'red.50' }}
                  _focus={{ bg: 'red.50' }}
                >
                  Deactivate UAP Protocol (All Assistants)
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>

         

          {/* UAP Deactivation Confirmation Modal */}
          <Modal
            isOpen={isDeactivateUAPModalOpen}
            onClose={onCloseDeactivateUAPModal}
            isCentered
          >
            <ModalOverlay bg="blackAlpha.600" />
            <ModalContent
              bg="dark.purple.100"
              borderWidth="2px"
              borderColor="dark.purple.400"
              borderRadius="xl"
            >
              <ModalHeader
                fontFamily="Bungee"
                color="dark.purple.500"
                borderBottomWidth="1px"
                borderColor="dark.purple.200"
              >
                Deactivate UAP Protocol?
              </ModalHeader>
              <ModalCloseButton color="dark.purple.400" />
              <ModalBody py={5}>
                <VStack align="start" spacing={4}>
                  <Box
                    bg="red.50"
                    p={3}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="red.200"
                    width="100%"
                  >
                    <Text fontWeight="bold" color="red.600" fontSize="sm">
                      Warning: This will deactivate ALL executive assistants!
                    </Text>
                  </Box>
                  <Text fontSize="sm" color="dark.purple.500">
                    This action will completely remove the Universal Assistant
                    Protocol from your Universal Profile, including:
                  </Text>
                  <VStack
                    as="ul"
                    pl={6}
                    fontSize="sm"
                    color="dark.purple.400"
                    spacing={1}
                    align="flex-start"
                    listStyleType="disc"
                  >
                    <Box as="li" display="list-item">
                      GRAVE Spambox (Forwarder Assistant)
                    </Box>
                    <Box as="li" display="list-item">
                      All other executive assistants (if any)
                    </Box>
                    <Box as="li" display="list-item">
                      All screener configurations
                    </Box>
                    <Box as="li" display="list-item">
                      All address lists and filters
                    </Box>
                    <Box as="li" display="list-item">
                      UAP metadata and settings
                    </Box>
                  </VStack>
                  <Text fontSize="sm" fontWeight="600" color="dark.purple.500">
                    Your Universal Profile will no longer have any automated
                    asset handling.
                  </Text>
                  <Box
                    bg="dark.purple.200"
                    p={3}
                    borderRadius="md"
                    width="100%"
                  >
                    <Text fontSize="sm" color="dark.purple.400">
                      If you only want to deactivate GRAVE, use the "Deactivate
                      GRAVE Spambox Only" option instead.
                    </Text>
                  </Box>
                </VStack>
              </ModalBody>
              <ModalFooter borderTopWidth="1px" borderColor="dark.purple.200">
                <Button
                  variant="outline"
                  mr={3}
                  onClick={onCloseDeactivateUAPModal}
                  isDisabled={isProcessing}
                  color="dark.purple.500"
                  borderColor="dark.purple.300"
                  _hover={{ bg: 'dark.purple.200' }}
                  fontFamily="Bungee"
                >
                  CANCEL
                </Button>
                <Button
                  bg="red.500"
                  color="white"
                  onClick={handleDeactivateUAP}
                  isLoading={isProcessing}
                  isDisabled={isProcessing}
                  fontFamily="Bungee"
                  _hover={{ bg: 'red.600' }}
                >
                  {isProcessing ? 'DEACTIVATING...' : 'DEACTIVATE UAP'}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Flex>
      </Box>
    </Flex>
  );
};

export default GraveSubscription;
