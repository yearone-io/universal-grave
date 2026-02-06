'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { keyframes } from '@emotion/react';
import {
  Box,
  Button,
  Flex,
  Text,
  Input,
  useToast,
  Select,
  IconButton,
  VStack,
  HStack,
  Collapse,
  Spinner,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react';
import {
  FaCheckCircle,
  FaPlus,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaShieldAlt,
  FaCog,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { isAddress } from 'ethers';
import { useProfile } from '@/contexts/ProfileProvider';
import { useGrave } from '@/contexts/GraveContext';
import { getNetworkByName, supportedNetworks } from '@/constants/supportedNetworks';
import { ZERO_ADDRESS } from '@/constants/addresses';
import { formatAddress } from '@/utils/tokenUtils';
import {
  subscribeAndConfigureGrave,
  unsubscribeFromUAP,
} from '@/utils/uapSubscription';
import {
  assertWalletNetwork,
  getWalletProvider,
  getWalletSigner,
} from '@/utils/walletClient';
import {
  isVaultRegistered,
  registerVaultWithUP,
  getRegisteredVaults,
  deployVault,
  hasVaultURDSet,
  setVaultURD,
} from '@/utils/vaultCreation';
import { updateBECPermissions, doesControllerHaveMissingPermissions } from '@/utils/urdUtils';
import {
  getForwarderAssistantConfig,
  removeForwarderAssistant,
  saveForwarderAssistantConfig,
} from '@/utils/assistantConfig';
import AddressMetadataPreview from '@/components/address-metadata/AddressMetadataPreview';
import AddressMetadataInline from '@/components/address-metadata/AddressMetadataInline';
import { Contract } from 'ethers';
import { universalProfileAbi } from '@lukso/lsp-smart-contracts/abi';
import { getErc725Read } from '@/utils/erc725Client';
import uapSchema from '@/schemas/UAP.json';

// Animations
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const checkmark = keyframes`
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Types
interface SetupStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

interface GraveSubscriptionProps {
  networkName: string;
}

const GraveSubscription: React.FC<GraveSubscriptionProps> = ({ networkName }) => {
  const toast = useToast({ position: 'bottom-left' });
  const { profileDetailsData, isConnected, chainId, isNetworkMismatch, switchNetwork } =
    useProfile();
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
  const expectedNetwork = getNetworkByName(networkName);
  const isMainnet = chainId === 42;

  // Protection is truly active only if we have UAP subscription AND the forwarder is configured
  // After deactivation, hasUAPSubscription may still be true (URD still set) but setupType will be 'none'
  const isProtectionActive = hasUAPSubscription && (setupType === 'uap' || setupType === 'both');

  // Recommended lists (mainnet only)
  const recommendedCuratedAssets = {
    address: '0x480f8e055ec2c06db4c06a216dd091b68a03f6c7',
    url: 'https://hashlists.xyz/curated-lists/42/0x480f8e055ec2c06db4c06a216dd091b68a03f6c7',
  };
  const recommendedCuratedCreators = {
    address: '0xc019cf21a31ea8d0c7571b7e1fa3a30cc54a9be9',
    url: 'https://hashlists.xyz/curated-lists/42/0xc019cf21a31ea8d0c7571b7e1fa3a30cc54a9be9',
  };

  // Core state
  const [isProcessing, setIsProcessing] = useState(false);
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([]);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Vault state
  const [availableVaults, setAvailableVaults] = useState<string[]>([]);
  const [selectedVault, setSelectedVault] = useState<string>('');
  const [isLoadingVaults, setIsLoadingVaults] = useState(false);

  // Filter configuration state - Asset Filters
  const [whitelistAddresses, setWhitelistAddresses] = useState<string[]>([]);
  const [curatedListAddress, setCuratedListAddress] = useState<string>('');
  const [originalWhitelistAddresses, setOriginalWhitelistAddresses] = useState<string[]>([]);
  const [originalCuratedListAddress, setOriginalCuratedListAddress] = useState<string>('');

  // Filter configuration state - Creator Filters
  const [creatorWhitelistAddresses, setCreatorWhitelistAddresses] = useState<string[]>([]);
  const [creatorCuratedListAddress, setCreatorCuratedListAddress] = useState<string>('');
  const [requireAllCreatorsForList, setRequireAllCreatorsForList] = useState(false);
  const [requireAllCreatorsForCuration, setRequireAllCreatorsForCuration] = useState(false);
  const [originalCreatorWhitelistAddresses, setOriginalCreatorWhitelistAddresses] = useState<string[]>([]);
  const [originalCreatorCuratedListAddress, setOriginalCreatorCuratedListAddress] = useState<string>('');
  const [originalRequireAllCreatorsForList, setOriginalRequireAllCreatorsForList] = useState(false);
  const [originalRequireAllCreatorsForCuration, setOriginalRequireAllCreatorsForCuration] = useState(false);

  // Modal for deactivation
  const { isOpen: isDeactivateOpen, onOpen: onDeactivateOpen, onClose: onDeactivateClose } = useDisclosure();
  const [deactivateMode, setDeactivateMode] = useState<'spambox' | 'full'>('spambox');

  // Determine active vault - used for BOTH display AND actual operations
  // Priority: selectedVault (user choice) > uapVaultAddress (UAP config) > graveVault (legacy)
  const activeVault = useMemo(() => {
    return selectedVault || uapVaultAddress || graveVault || '';
  }, [selectedVault, uapVaultAddress, graveVault]);

  // Check if vault data is ready for legacy upgrades
  // For legacy users, we need graveVault to be loaded before allowing setup
  const isVaultDataReady = useMemo(() => {
    // If still loading vaults, not ready
    if (isLoadingVaults) return false;

    // If this is a legacy upgrade, ensure graveVault is loaded and selectedVault is set
    if (setupType === 'legacy') {
      // graveVault should be loaded from context
      if (!graveVault) return false;
      // selectedVault should be set by the fetchVaults effect
      if (!selectedVault) return false;
    }

    return true;
  }, [isLoadingVaults, setupType, graveVault, selectedVault]);

  // Fetch vaults on mount
  useEffect(() => {
    const fetchVaults = async () => {
      if (!address || !window.lukso || !currentNetwork || isNetworkMismatch) return;

      setIsLoadingVaults(true);
      try {
        const provider = getWalletProvider();
        const vaults = await getRegisteredVaults(provider, address);

        let uniqueVaults = vaults.filter(
          (vault, index, self) =>
            index === self.findIndex(v => v.toLowerCase() === vault.toLowerCase())
        );

        // Add legacy vault if exists
        if (graveVault && !uniqueVaults.some(v => v.toLowerCase() === graveVault.toLowerCase())) {
          uniqueVaults = [...uniqueVaults, graveVault];
        }

        setAvailableVaults(uniqueVaults);

        // Get the currently configured vault from forwarder config (this is the actual active vault)
        let configuredVault: string | null = null;
        try {
          const config = await getForwarderAssistantConfig(provider, address, {
            forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
            addressListScreenerAddress: currentNetwork.addressListScreenerAddress,
            curatedListScreenerAddress: currentNetwork.curatedListScreenerAddress,
            creatorListScreenerAddress: currentNetwork.creatorListScreenerAddress,
            creatorCurationScreenerAddress: currentNetwork.creatorCurationScreenerAddress,
          });
          if (config.vaultAddress) {
            configuredVault = config.vaultAddress;
          }
        } catch (e) {
          // Config might not exist yet, that's okay
        }

        // Auto-select vault with priority: configured vault > uapVaultAddress > graveVault > first available
        if (configuredVault) {
          const match = uniqueVaults.find(v => v.toLowerCase() === configuredVault!.toLowerCase());
          if (match) {
            setSelectedVault(match);
            return;
          }
        }
        if (uapVaultAddress) {
          const match = uniqueVaults.find(v => v.toLowerCase() === uapVaultAddress.toLowerCase());
          if (match) {
            setSelectedVault(match);
            return;
          }
        }
        if (graveVault) {
          const match = uniqueVaults.find(v => v.toLowerCase() === graveVault.toLowerCase());
          if (match) {
            setSelectedVault(match);
            return;
          }
        }
        if (uniqueVaults.length > 0) {
          setSelectedVault(uniqueVaults[0]);
        }
      } catch (error) {
        console.error('Error fetching vaults:', error);
      } finally {
        setIsLoadingVaults(false);
      }
    };

    fetchVaults();
  }, [address, currentNetwork, graveVault, uapVaultAddress, isNetworkMismatch]);

  // Load existing configuration
  useEffect(() => {
    const loadConfig = async () => {
      if (!address || !currentNetwork || !isProtectionActive || isNetworkMismatch) return;

      try {
        const provider = getWalletProvider();
        const config = await getForwarderAssistantConfig(provider, address, {
          forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
          addressListScreenerAddress: currentNetwork.addressListScreenerAddress,
          curatedListScreenerAddress: currentNetwork.curatedListScreenerAddress,
          creatorListScreenerAddress: currentNetwork.creatorListScreenerAddress,
          creatorCurationScreenerAddress: currentNetwork.creatorCurationScreenerAddress,
        });

        if (config.isConfigured) {
          // Asset filters
          if (config.whitelistAddresses.length > 0) {
            setWhitelistAddresses(config.whitelistAddresses);
            setOriginalWhitelistAddresses(config.whitelistAddresses);
          }
          if (config.curatedListAddress) {
            setCuratedListAddress(config.curatedListAddress);
            setOriginalCuratedListAddress(config.curatedListAddress);
          }

          // Creator filters
          if (config.creatorWhitelistAddresses.length > 0) {
            setCreatorWhitelistAddresses(config.creatorWhitelistAddresses);
            setOriginalCreatorWhitelistAddresses(config.creatorWhitelistAddresses);
          }
          if (config.creatorCuratedListAddress) {
            setCreatorCuratedListAddress(config.creatorCuratedListAddress);
            setOriginalCreatorCuratedListAddress(config.creatorCuratedListAddress);
          }
          setRequireAllCreatorsForList(config.requireAllCreatorsForList);
          setOriginalRequireAllCreatorsForList(config.requireAllCreatorsForList);
          setRequireAllCreatorsForCuration(config.requireAllCreatorsForCuration);
          setOriginalRequireAllCreatorsForCuration(config.requireAllCreatorsForCuration);

          if (config.vaultAddress) {
            setSelectedVault(config.vaultAddress);
          }
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };

    loadConfig();
  }, [address, currentNetwork, isProtectionActive, isNetworkMismatch]);

  // Update step status helper
  const updateStepStatus = useCallback((stepId: string, status: SetupStep['status']) => {
    setSetupSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status } : step
    ));
  }, []);

  // Main setup handler - one click does everything
  const handleSetup = useCallback(async () => {
    if (!address || !currentNetwork || !chainId || !mainUPController) {
      toast({
        title: 'Connection required',
        description: 'Please ensure your wallet is connected.',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    setIsProcessing(true);
    setSetupError(null);

    // Initialize steps
    const steps: SetupStep[] = [
      { id: 'network', label: 'Checking network', status: 'active' },
      { id: 'permissions', label: 'Setting permissions', status: 'pending' },
      { id: 'vault', label: 'Preparing spambox', status: 'pending' },
      { id: 'protection', label: 'Activating protection', status: 'pending' },
    ];
    setSetupSteps(steps);

    try {
      const provider = getWalletProvider();

      // Step 1: Check network
      await assertWalletNetwork(chainId);
      updateStepStatus('network', 'complete');
      updateStepStatus('permissions', 'active');

      // Step 2: Check and set permissions
      const missingPermissions = await doesControllerHaveMissingPermissions(
        mainUPController,
        address,
        provider
      );

      if (missingPermissions.length > 0) {
        await updateBECPermissions(provider, address, mainUPController);
      }
      updateStepStatus('permissions', 'complete');
      updateStepStatus('vault', 'active');

      // Step 3: Ensure vault exists
      // Use activeVault which has correct priority: selectedVault > uapVaultAddress > graveVault
      // This ensures legacy upgrades use the existing legacy vault
      let vaultToUse = activeVault;

      if (!vaultToUse) {
        // No existing vault found - create new one
        vaultToUse = await deployVault(provider, address, currentNetwork);
        setSelectedVault(vaultToUse);
        setAvailableVaults(prev => prev.length === 0 ? [vaultToUse] : prev);
      } else if (!selectedVault) {
        // Vault exists but wasn't explicitly selected - set it now for consistency
        setSelectedVault(vaultToUse);
      }

      // Ensure vault is registered
      const isRegistered = await isVaultRegistered(provider, address, vaultToUse);
      if (!isRegistered) {
        await registerVaultWithUP(provider, address, vaultToUse);
      }

      // Ensure vault has URD set
      const hasURD = await hasVaultURDSet(provider, vaultToUse, currentNetwork.lsp1UrdVault);
      if (!hasURD) {
        await setVaultURD(provider, address, vaultToUse, currentNetwork);
      }

      updateStepStatus('vault', 'complete');
      updateStepStatus('protection', 'active');

      // Step 4: Subscribe and configure
      // Use isProtectionActive instead of hasUAPSubscription because:
      // - User may be subscribed (URD set) but forwarder not configured (e.g., after deactivation)
      // - In that case, we still need to configure the forwarder
      if (!isProtectionActive) {
        await subscribeAndConfigureGrave(
          provider,
          address,
          currentNetwork.protocolAddress,
          vaultToUse,
          {
            forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
            addressListScreenerAddress: currentNetwork.addressListScreenerAddress,
            creatorListScreenerAddress: currentNetwork.creatorListScreenerAddress,
          }
        );
      }

      updateStepStatus('protection', 'complete');

      await refreshGraveData();

      toast({
        title: 'Protection activated!',
        description: 'Your Universal Profile is now protected from spam.',
        status: 'success',
        duration: 5000,
      });

      // Clear steps after success
      setTimeout(() => setSetupSteps([]), 2000);
    } catch (err: any) {
      console.error('Setup error:', err);

      // Mark current step as error
      setSetupSteps(prev => prev.map(step =>
        step.status === 'active' ? { ...step, status: 'error' } : step
      ));

      if (!err.message?.includes('user rejected')) {
        setSetupError(err.message || 'Setup failed. Please try again.');
        toast({
          title: 'Setup failed',
          description: err.message || 'An error occurred during setup.',
          status: 'error',
          duration: 5000,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [
    address,
    currentNetwork,
    chainId,
    mainUPController,
    selectedVault,
    availableVaults,
    isProtectionActive,
    refreshGraveData,
    toast,
    updateStepStatus,
  ]);

  // Save filter configuration
  const handleSaveFilters = useCallback(async () => {
    if (!address || !currentNetwork || !chainId || !selectedVault) return;

    setIsProcessing(true);

    try {
      const provider = getWalletProvider();
      await assertWalletNetwork(chainId);

      const whitelistArray = whitelistAddresses
        .map(addr => addr.trim())
        .filter(addr => addr !== '' && isAddress(addr));

      const shouldUseCuratedList =
        curatedListAddress.trim() !== '' &&
        isAddress(curatedListAddress) &&
        curatedListAddress !== ZERO_ADDRESS;

      const creatorWhitelistArray = creatorWhitelistAddresses
        .map(addr => addr.trim())
        .filter(addr => addr !== '' && isAddress(addr));

      await saveForwarderAssistantConfig(
        provider,
        address,
        selectedVault,
        whitelistArray,
        shouldUseCuratedList,
        curatedListAddress,
        creatorWhitelistArray,
        creatorCuratedListAddress.trim() !== '' ? creatorCuratedListAddress : null,
        requireAllCreatorsForList,
        requireAllCreatorsForCuration,
        {
          forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
          addressListScreenerAddress: currentNetwork.addressListScreenerAddress,
          curatedListScreenerAddress: currentNetwork.curatedListScreenerAddress,
          creatorListScreenerAddress: currentNetwork.creatorListScreenerAddress,
          creatorCurationScreenerAddress: currentNetwork.creatorCurationScreenerAddress,
        },
        supportedNetworks,
        chainId
      );

      // Update original values
      setOriginalWhitelistAddresses(whitelistArray);
      setOriginalCuratedListAddress(shouldUseCuratedList ? curatedListAddress : '');
      setOriginalCreatorWhitelistAddresses(creatorWhitelistArray);
      setOriginalCreatorCuratedListAddress(creatorCuratedListAddress.trim() !== '' ? creatorCuratedListAddress : '');
      setOriginalRequireAllCreatorsForList(requireAllCreatorsForList);
      setOriginalRequireAllCreatorsForCuration(requireAllCreatorsForCuration);

      toast({
        title: 'Filters saved',
        description: 'Your spam filter settings have been updated.',
        status: 'success',
        duration: 5000,
      });

      await refreshGraveData();
    } catch (err: any) {
      console.error('Error saving filters:', err);
      if (!err.message?.includes('user rejected')) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to save filters',
          status: 'error',
          duration: 5000,
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
    whitelistAddresses,
    curatedListAddress,
    creatorWhitelistAddresses,
    creatorCuratedListAddress,
    requireAllCreatorsForList,
    requireAllCreatorsForCuration,
    refreshGraveData,
    toast,
  ]);

  // Deactivate handlers
  const handleDeactivateSpambox = useCallback(async () => {
    if (!address || !currentNetwork || !chainId) return;

    setIsProcessing(true);

    try {
      const provider = getWalletProvider();
      await assertWalletNetwork(chainId);

      await removeForwarderAssistant(provider, address, {
        forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
        addressListScreenerAddress: currentNetwork.addressListScreenerAddress,
        curatedListScreenerAddress: currentNetwork.curatedListScreenerAddress,
        creatorListScreenerAddress: currentNetwork.creatorListScreenerAddress,
        creatorCurationScreenerAddress: currentNetwork.creatorCurationScreenerAddress,
      });

      toast({
        title: 'Spambox deactivated',
        description: 'Protection has been turned off.',
        status: 'success',
        duration: 5000,
      });

      onDeactivateClose();
      await refreshGraveData();
    } catch (err: any) {
      console.error('Error deactivating:', err);
      if (!err.message?.includes('user rejected')) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to deactivate',
          status: 'error',
          duration: 5000,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [address, currentNetwork, chainId, refreshGraveData, toast, onDeactivateClose]);

  const handleDeactivateUAP = useCallback(async () => {
    if (!address || !currentNetwork || !chainId) return;

    setIsProcessing(true);

    try {
      const provider = getWalletProvider();
      await assertWalletNetwork(chainId);
      const signer = await getWalletSigner();
      const upContract = new Contract(address, universalProfileAbi, signer);
      const erc725UAP = getErc725Read(uapSchema as any, address, { provider });

      const keys: string[] = [];
      const values: string[] = [];

      const LSP7_TRANSACTION_TYPE = '0xa124442e1820e52d1e5a85c5ea8cb3cd0ea171df8e3a62be0f4f5a16fa7fee79';
      const LSP8_TRANSACTION_TYPE = '0xc7a120a42b6057a0cbed111fcdea5093c2b7f5db2f9e3a9ec3a8f09c4dad5e13';
      const txTypes = [LSP7_TRANSACTION_TYPE, LSP8_TRANSACTION_TYPE];

      keys.push(erc725UAP.encodeKeyName('SupportedStandards:UAP', []));
      values.push('0x');

      for (const txType of txTypes) {
        const typeConfigKey = erc725UAP.encodeKeyName('UAPTypeConfig:<bytes32>', [txType]);

        let currentExecutives: string[] = [];
        try {
          const currentValue = await upContract.getData(typeConfigKey);
          if (currentValue && currentValue !== '0x') {
            currentExecutives = erc725UAP.decodeValueType('address[]', currentValue) as string[];
          }
        } catch { /* ignore */ }

        keys.push(typeConfigKey);
        values.push('0x');

        for (let i = 0; i < currentExecutives.length; i++) {
          keys.push(erc725UAP.encodeKeyName('UAPExecutiveConfig:<bytes32>:<uint256>', [txType, i.toString()]));
          values.push('0x');
          keys.push(erc725UAP.encodeKeyName('UAPExecutiveScreeners:<bytes32>:<uint256>', [txType, i.toString()]));
          values.push('0x');
          keys.push(erc725UAP.encodeKeyName('UAPExecutiveScreenersANDLogic:<bytes32>:<uint256>', [txType, i.toString()]));
          values.push('0x');

          for (let j = 0; j < 5; j++) {
            const screenerOrder = i * 1000 + j;
            keys.push(erc725UAP.encodeKeyName('UAPScreenerConfig:<bytes32>:<uint256>', [txType, screenerOrder.toString()]));
            values.push('0x');
            keys.push(erc725UAP.encodeKeyName('UAPAddressListName:<bytes32>:<uint256>', [txType, screenerOrder.toString()]));
            values.push('0x');
          }
        }
      }

      keys.push('0x8631ee7d1d9475e6b2c38694122192970d91cafd1c64176ecc23849e17441672');
      values.push('0x');

      await unsubscribeFromUAP(provider, address, currentNetwork.protocolAddress, currentNetwork.lsp1UrdUp);

      if (keys.length > 0) {
        const tx = await upContract.setDataBatch(keys, values);
        await tx.wait();
      }

      toast({
        title: 'UAP deactivated',
        description: 'All assistants have been removed.',
        status: 'success',
        duration: 5000,
      });

      onDeactivateClose();
      await refreshGraveData();
    } catch (err: any) {
      console.error('Error deactivating UAP:', err);
      if (!err.message?.includes('user rejected')) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to deactivate UAP',
          status: 'error',
          duration: 5000,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [address, currentNetwork, chainId, refreshGraveData, toast, onDeactivateClose]);

  // Change detection
  const hasUnsavedChanges = useMemo(() => {
    const normalize = (arr: string[]) =>
      arr.map(a => a.trim().toLowerCase()).filter(a => a !== '' && isAddress(a)).sort();

    const currentWhitelist = normalize(whitelistAddresses);
    const origWhitelist = normalize(originalWhitelistAddresses);
    const whitelistChanged = currentWhitelist.length !== origWhitelist.length ||
      currentWhitelist.some((addr, i) => addr !== origWhitelist[i]);

    const curatedChanged = curatedListAddress.trim().toLowerCase() !== originalCuratedListAddress.trim().toLowerCase();

    const currentCreatorWhitelist = normalize(creatorWhitelistAddresses);
    const origCreatorWhitelist = normalize(originalCreatorWhitelistAddresses);
    const creatorWhitelistChanged = currentCreatorWhitelist.length !== origCreatorWhitelist.length ||
      currentCreatorWhitelist.some((addr, i) => addr !== origCreatorWhitelist[i]);

    const creatorCuratedChanged = creatorCuratedListAddress.trim().toLowerCase() !== originalCreatorCuratedListAddress.trim().toLowerCase();

    const creatorOptionsChanged = requireAllCreatorsForList !== originalRequireAllCreatorsForList ||
      requireAllCreatorsForCuration !== originalRequireAllCreatorsForCuration;

    return whitelistChanged || curatedChanged || creatorWhitelistChanged || creatorCuratedChanged || creatorOptionsChanged;
  }, [
    whitelistAddresses, originalWhitelistAddresses,
    curatedListAddress, originalCuratedListAddress,
    creatorWhitelistAddresses, originalCreatorWhitelistAddresses,
    creatorCuratedListAddress, originalCreatorCuratedListAddress,
    requireAllCreatorsForList, originalRequireAllCreatorsForList,
    requireAllCreatorsForCuration, originalRequireAllCreatorsForCuration,
  ]);

  // Whitelist helpers
  const addWhitelistAddress = () => setWhitelistAddresses([...whitelistAddresses, '']);
  const updateWhitelistAddress = (index: number, value: string) => {
    const newAddresses = [...whitelistAddresses];
    newAddresses[index] = value;
    setWhitelistAddresses(newAddresses);
  };
  const removeWhitelistAddress = (index: number) => {
    setWhitelistAddresses(whitelistAddresses.filter((_, i) => i !== index));
  };

  const addCreatorWhitelistAddress = () => setCreatorWhitelistAddresses([...creatorWhitelistAddresses, '']);
  const updateCreatorWhitelistAddress = (index: number, value: string) => {
    const newAddresses = [...creatorWhitelistAddresses];
    newAddresses[index] = value;
    setCreatorWhitelistAddresses(newAddresses);
  };
  const removeCreatorWhitelistAddress = (index: number) => {
    setCreatorWhitelistAddresses(creatorWhitelistAddresses.filter((_, i) => i !== index));
  };

  // Prevent hydration mismatch by waiting for client mount
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Loading state during SSR
  if (!isMounted) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="lg" color="whiteAlpha.600" />
      </Flex>
    );
  }

  // Loading state
  if (!isConnected || !address) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Text color="whiteAlpha.600">Connect your wallet to continue.</Text>
      </Flex>
    );
  }

  // Network mismatch
  if (isNetworkMismatch && expectedNetwork) {
    return (
      <Flex direction="column" align="center" justify="center" minH="300px" gap={6}>
        <Box
          p={4}
          bg="rgba(255, 165, 0, 0.1)"
          borderRadius="full"
        >
          <FaExclamationTriangle size={32} color="#FFA500" />
        </Box>
        <VStack spacing={2} textAlign="center">
          <Text color="white" fontSize="lg" fontWeight="600">
            Wrong Network
          </Text>
          <Text color="whiteAlpha.700" fontSize="sm" maxW="300px">
            Please switch to {expectedNetwork.displayName} to continue.
          </Text>
        </VStack>
        <Button
          onClick={() => switchNetwork(expectedNetwork.chainId)}
          bg="white"
          color="dark.purple.500"
          size="lg"
          fontFamily="Montserrat"
          fontWeight="600"
          borderRadius="xl"
          px={8}
          _hover={{ bg: 'whiteAlpha.900' }}
        >
          Switch Network
        </Button>
      </Flex>
    );
  }

  // Setup in progress
  if (setupSteps.length > 0) {
    return (
      <Flex direction="column" align="center" py={8} gap={8}>
        <VStack spacing={4}>
          {setupSteps.map((step, index) => (
            <HStack
              key={step.id}
              spacing={4}
              animation={`${fadeIn} 0.3s ease-out ${index * 0.1}s both`}
            >
              <Box w={8} h={8} borderRadius="full" display="flex" alignItems="center" justifyContent="center">
                {step.status === 'complete' && (
                  <Box
                    color="dark.teal.500"
                    animation={`${checkmark} 0.3s ease-out`}
                  >
                    <FaCheckCircle size={24} />
                  </Box>
                )}
                {step.status === 'active' && (
                  <Spinner size="sm" color="white" />
                )}
                {step.status === 'pending' && (
                  <Box
                    w={3}
                    h={3}
                    borderRadius="full"
                    bg="whiteAlpha.300"
                  />
                )}
                {step.status === 'error' && (
                  <Box color="red.400">
                    <FaExclamationTriangle size={20} />
                  </Box>
                )}
              </Box>
              <Text
                color={step.status === 'complete' ? 'dark.teal.500' : step.status === 'active' ? 'white' : step.status === 'error' ? 'red.400' : 'whiteAlpha.500'}
                fontSize="md"
                fontWeight={step.status === 'active' ? '600' : '400'}
                animation={step.status === 'active' ? `${pulse} 1.5s infinite` : undefined}
              >
                {step.label}
              </Text>
            </HStack>
          ))}
        </VStack>

        {setupError && (
          <Box
            mt={4}
            p={4}
            bg="rgba(255, 0, 0, 0.1)"
            borderRadius="xl"
            border="1px solid rgba(255, 0, 0, 0.2)"
          >
            <Text color="red.300" fontSize="sm" textAlign="center">
              {setupError}
            </Text>
            <Button
              mt={4}
              size="sm"
              variant="outline"
              color="white"
              borderColor="whiteAlpha.300"
              onClick={() => {
                setSetupSteps([]);
                setSetupError(null);
              }}
            >
              Try Again
            </Button>
          </Box>
        )}
      </Flex>
    );
  }

  // Not protected - show welcome/setup
  if (!isProtectionActive) {
    return (
      <Flex direction="column" align="center" py={8} gap={8}>
        {/* Hero icon */}
        <Box
          p={6}
          bg="linear-gradient(135deg, rgba(133, 47, 187, 0.2) 0%, rgba(138, 251, 234, 0.1) 100%)"
          borderRadius="full"
          boxShadow="0 0 60px rgba(133, 47, 187, 0.3)"
        >
          <FaShieldAlt size={48} color="rgba(138, 251, 234, 0.9)" />
        </Box>

        {/* Value proposition */}
        <VStack spacing={4} textAlign="center" maxW="400px">
          <Text color="white" fontSize="xl" fontWeight="600" lineHeight="1.3">
            Protect your profile from unwanted tokens
          </Text>
          <Text color="whiteAlpha.600" fontSize="sm" lineHeight="1.6">
            GRAVE automatically filters spam tokens to a separate vault, keeping your profile clean. Works instantly with smart defaults.
          </Text>
        </VStack>

        {/* Features */}
        <HStack spacing={8} flexWrap="wrap" justify="center">
          {[
            { label: 'One-click setup', icon: '1' },
            { label: 'Smart filtering', icon: '2' },
            { label: 'Fully reversible', icon: '3' },
          ].map((feature, i) => (
            <VStack key={i} spacing={2}>
              <Box
                w={8}
                h={8}
                borderRadius="full"
                bg="whiteAlpha.100"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="dark.teal.500" fontSize="sm" fontWeight="700">
                  {feature.icon}
                </Text>
              </Box>
              <Text color="whiteAlpha.700" fontSize="xs">
                {feature.label}
              </Text>
            </VStack>
          ))}
        </HStack>

        {/* Vault selection (if multiple exist) */}
        {availableVaults.length > 1 && (
          <Box w="100%" maxW="320px">
            <Text color="whiteAlpha.600" fontSize="xs" mb={2} textAlign="center">
              Select spambox vault:
            </Text>
            <Select
              value={selectedVault}
              onChange={e => setSelectedVault(e.target.value)}
              bg="whiteAlpha.100"
              border="1px solid"
              borderColor="whiteAlpha.200"
              color="white"
              borderRadius="xl"
              size="sm"
              _hover={{ borderColor: 'whiteAlpha.300' }}
              _focus={{ borderColor: 'dark.teal.500', boxShadow: 'none' }}
            >
              {availableVaults.map((vault, idx) => (
                <option key={vault} value={vault} style={{ background: '#1a1a2e' }}>
                  {`Vault ${idx + 1}: ${formatAddress(vault)}`}
                </option>
              ))}
            </Select>
          </Box>
        )}

        {/* Main CTA */}
        <Button
          onClick={handleSetup}
          isLoading={isProcessing || isLoadingVaults}
          loadingText="Setting up..."
          size="lg"
          bg="white"
          color="dark.purple.500"
          fontFamily="Montserrat"
          fontWeight="600"
          fontSize="md"
          borderRadius="xl"
          px={12}
          py={7}
          boxShadow="0 10px 40px rgba(255, 255, 255, 0.15)"
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: '0 15px 50px rgba(255, 255, 255, 0.2)',
          }}
          _active={{
            transform: 'translateY(0)',
          }}
          transition="all 0.2s"
        >
          {setupType === 'legacy' ? 'Upgrade Protection' : 'Enable Protection'}
        </Button>

        {setupType === 'legacy' && (
          <Text color="whiteAlpha.500" fontSize="xs" textAlign="center">
            Your legacy GRAVE will be upgraded to the new system.
          </Text>
        )}
      </Flex>
    );
  }

  // Protected - show active state with optional configuration
  return (
    <Flex direction="column" gap={6}>
      {/* Success state */}
      <Flex
        direction="column"
        align="center"
        py={6}
        gap={4}
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
      >
        <Box
          p={4}
          bg="rgba(138, 251, 234, 0.1)"
          borderRadius="full"
        >
          <FaCheckCircle size={32} color="rgba(138, 251, 234, 0.9)" />
        </Box>
        <VStack spacing={1}>
          <Text color="white" fontSize="lg" fontWeight="600">
            Protection Active
          </Text>
          <HStack spacing={2}>
            <Text color="whiteAlpha.600" fontSize="sm">
              Spambox:
            </Text>
            <Text color="dark.teal.500" fontSize="sm" fontFamily="mono">
              {formatAddress(activeVault)}
            </Text>
          </HStack>
        </VStack>
      </Flex>

      {/* Filter configuration toggle */}
      <Button
        variant="ghost"
        onClick={() => setShowFilters(!showFilters)}
        justifyContent="space-between"
        px={4}
        py={6}
        bg="whiteAlpha.50"
        borderRadius="xl"
        _hover={{ bg: 'whiteAlpha.100' }}
      >
        <HStack spacing={3}>
          <FaCog color="rgba(255, 255, 255, 0.6)" />
          <Text color="white" fontSize="sm" fontWeight="500">
            Configure Filters
          </Text>
          {hasUnsavedChanges && (
            <Box
              px={2}
              py={0.5}
              bg="orange.500"
              borderRadius="full"
            >
              <Text color="white" fontSize="xs" fontWeight="600">
                Unsaved
              </Text>
            </Box>
          )}
        </HStack>
        {showFilters ? (
          <FaChevronUp color="rgba(255, 255, 255, 0.4)" />
        ) : (
          <FaChevronDown color="rgba(255, 255, 255, 0.4)" />
        )}
      </Button>

      <Collapse in={showFilters} animateOpacity>
        <VStack spacing={6} align="stretch" pb={4}>
          {/* Creator Filter */}
          <Box
            p={5}
            bg="whiteAlpha.50"
            borderRadius="xl"
            border="1px solid"
            borderColor="whiteAlpha.100"
          >
            <Text color="white" fontSize="sm" fontWeight="600" mb={1}>
              Trusted Creators
            </Text>
            <Text color="whiteAlpha.600" fontSize="xs" mb={4}>
              Assets from these creators will stay in your profile.
            </Text>

            {/* Unified Curated List Component */}
            <Box
              p={4}
              mb={4}
              bg="whiteAlpha.50"
              borderRadius="lg"
              border="1px solid"
              borderColor={creatorCuratedListAddress && isAddress(creatorCuratedListAddress) ? 'dark.teal.500' : 'whiteAlpha.100'}
            >
              {/* Header with title, status, and actions */}
              <Flex justify="space-between" align="flex-start" gap={4} mb={3} flexWrap="wrap">
                <Box flex={1} minW="200px">
                  <HStack spacing={2} mb={1} flexWrap="wrap">
                    <Text color="white" fontSize="sm" fontWeight="500">
                      Curated Creator List
                    </Text>
                    {/* Status badges */}
                    {creatorCuratedListAddress && isAddress(creatorCuratedListAddress) && (
                      <>
                        {isMainnet && creatorCuratedListAddress.toLowerCase() === recommendedCuratedCreators.address.toLowerCase() && (
                          <Box px={2} py={0.5} bg="dark.purple.300" borderRadius="md">
                            <Text color="white" fontSize="xs" fontWeight="600">
                              COMMUNITY
                            </Text>
                          </Box>
                        )}
                        {originalCreatorCuratedListAddress.toLowerCase() === creatorCuratedListAddress.toLowerCase() ? (
                          <Box px={2} py={0.5} bg="dark.teal.500" borderRadius="md">
                            <Text color="dark.purple.500" fontSize="xs" fontWeight="600">
                              ACTIVE
                            </Text>
                          </Box>
                        ) : (
                          <Box px={2} py={0.5} bg="orange.500" borderRadius="md">
                            <Text color="white" fontSize="xs" fontWeight="600">
                              UNSAVED
                            </Text>
                          </Box>
                        )}
                      </>
                    )}
                  </HStack>
                  <Text color="whiteAlpha.500" fontSize="xs">
                    {creatorCuratedListAddress && isAddress(creatorCuratedListAddress)
                      ? (isMainnet && creatorCuratedListAddress.toLowerCase() === recommendedCuratedCreators.address.toLowerCase()
                          ? 'Using the community curated list.'
                          : 'Using a custom curated list.')
                      : 'No curated list selected. Enter an address or use the community list.'}
                  </Text>
                </Box>
                {/* Action buttons */}
                <HStack spacing={2} flexWrap="wrap">
                  {/* No list selected - show "Use Community List" */}
                  {isMainnet && (!creatorCuratedListAddress || !isAddress(creatorCuratedListAddress)) && (
                    <Button
                      size="sm"
                      bg="dark.teal.500"
                      color="dark.purple.500"
                      fontFamily="Montserrat"
                      fontWeight="600"
                      borderRadius="lg"
                      onClick={() => setCreatorCuratedListAddress(recommendedCuratedCreators.address)}
                      _hover={{ opacity: 0.8 }}
                    >
                      Use Community List
                    </Button>
                  )}
                  {/* Custom list selected - show "Restore Community List" + "Remove" */}
                  {creatorCuratedListAddress && isAddress(creatorCuratedListAddress) &&
                   (!isMainnet || creatorCuratedListAddress.toLowerCase() !== recommendedCuratedCreators.address.toLowerCase()) && (
                    <>
                      {isMainnet && (
                        <Button
                          size="sm"
                          variant="outline"
                          borderColor="dark.teal.500"
                          color="dark.teal.500"
                          fontFamily="Montserrat"
                          fontWeight="600"
                          borderRadius="lg"
                          onClick={() => setCreatorCuratedListAddress(recommendedCuratedCreators.address)}
                          _hover={{ opacity: 0.8 }}
                        >
                          Restore Community List
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        borderColor="red.400"
                        color="red.400"
                        fontFamily="Montserrat"
                        fontWeight="600"
                        borderRadius="lg"
                        onClick={() => setCreatorCuratedListAddress('')}
                        _hover={{ opacity: 0.8, bg: 'rgba(255,0,0,0.1)' }}
                      >
                        Remove
                      </Button>
                    </>
                  )}
                  {/* Community list selected - show "Remove" only */}
                  {isMainnet && creatorCuratedListAddress.toLowerCase() === recommendedCuratedCreators.address.toLowerCase() && (
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="red.400"
                      color="red.400"
                      fontFamily="Montserrat"
                      fontWeight="600"
                      borderRadius="lg"
                      onClick={() => setCreatorCuratedListAddress('')}
                      _hover={{ opacity: 0.8, bg: 'rgba(255,0,0,0.1)' }}
                    >
                      Remove
                    </Button>
                  )}
                </HStack>
              </Flex>

              {/* Custom address input - always visible */}
              <Input
                placeholder="0x... or paste a custom curated list address"
                value={isMainnet && creatorCuratedListAddress.toLowerCase() === recommendedCuratedCreators.address.toLowerCase() ? '' : creatorCuratedListAddress}
                onChange={e => setCreatorCuratedListAddress(e.target.value)}
                bg="whiteAlpha.100"
                border="1px solid"
                borderColor={creatorCuratedListAddress &&
                  (!isMainnet || creatorCuratedListAddress.toLowerCase() !== recommendedCuratedCreators.address.toLowerCase()) &&
                  !isAddress(creatorCuratedListAddress) ? 'red.400' : 'whiteAlpha.200'}
                color="white"
                fontFamily="mono"
                fontSize="sm"
                borderRadius="lg"
                _placeholder={{ color: 'whiteAlpha.400' }}
                _hover={{ borderColor: 'whiteAlpha.300' }}
                _focus={{ borderColor: 'dark.teal.500', boxShadow: 'none' }}
              />

              {/* Metadata preview for current selection */}
              {creatorCuratedListAddress && isAddress(creatorCuratedListAddress) && (
                <Box mt={3}>
                  <AddressMetadataPreview
                    address={creatorCuratedListAddress}
                    chainId={chainId ?? undefined}
                    isDisabled={isNetworkMismatch}
                    useHashlistsLink
                  />
                </Box>
              )}
            </Box>

            {/* Manual addresses */}
            <Box>
              <Flex justify="space-between" align="center" mb={2}>
                <Text color="whiteAlpha.600" fontSize="xs">
                  Or add individual creator addresses:
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  color="dark.teal.500"
                  leftIcon={<FaPlus size={10} />}
                  onClick={addCreatorWhitelistAddress}
                  _hover={{ bg: 'whiteAlpha.100' }}
                >
                  Add
                </Button>
              </Flex>
              <VStack spacing={3} align="stretch">
                {creatorWhitelistAddresses.map((addr, i) => (
                  <Box key={i}>
                    <HStack>
                      <Input
                        placeholder="0x..."
                        value={addr}
                        onChange={e => updateCreatorWhitelistAddress(i, e.target.value)}
                        bg="whiteAlpha.100"
                        border="1px solid"
                        borderColor={addr && !isAddress(addr) ? 'red.400' : 'whiteAlpha.200'}
                        color="white"
                        fontFamily="mono"
                        fontSize="sm"
                        borderRadius="lg"
                        _placeholder={{ color: 'whiteAlpha.400' }}
                        _focus={{ borderColor: 'dark.teal.500', boxShadow: 'none' }}
                      />
                      <IconButton
                        aria-label="Remove"
                        icon={<FaTrash size={12} />}
                        size="sm"
                        variant="ghost"
                        color="whiteAlpha.500"
                        onClick={() => removeCreatorWhitelistAddress(i)}
                        _hover={{ color: 'red.400', bg: 'whiteAlpha.100' }}
                      />
                    </HStack>
                    {addr && isAddress(addr) && (
                      <AddressMetadataInline
                        address={addr}
                        chainId={chainId ?? undefined}
                        isDisabled={isNetworkMismatch}
                      />
                    )}
                  </Box>
                ))}
              </VStack>
            </Box>
          </Box>

          {/* Asset Filter */}
          <Box
            p={5}
            bg="whiteAlpha.50"
            borderRadius="xl"
            border="1px solid"
            borderColor="whiteAlpha.100"
          >
            <Text color="white" fontSize="sm" fontWeight="600" mb={1}>
              Trusted Assets
            </Text>
            <Text color="whiteAlpha.600" fontSize="xs" mb={4}>
              Specific token addresses that will always stay in your profile.
            </Text>

            {/* Unified Curated List Component */}
            <Box
              p={4}
              mb={4}
              bg="whiteAlpha.50"
              borderRadius="lg"
              border="1px solid"
              borderColor={curatedListAddress && isAddress(curatedListAddress) ? 'dark.teal.500' : 'whiteAlpha.100'}
            >
              {/* Header with title, status, and actions */}
              <Flex justify="space-between" align="flex-start" gap={4} mb={3} flexWrap="wrap">
                <Box flex={1} minW="200px">
                  <HStack spacing={2} mb={1} flexWrap="wrap">
                    <Text color="white" fontSize="sm" fontWeight="500">
                      Curated Asset List
                    </Text>
                    {/* Status badges */}
                    {curatedListAddress && isAddress(curatedListAddress) && (
                      <>
                        {isMainnet && curatedListAddress.toLowerCase() === recommendedCuratedAssets.address.toLowerCase() && (
                          <Box px={2} py={0.5} bg="dark.purple.300" borderRadius="md">
                            <Text color="white" fontSize="xs" fontWeight="600">
                              COMMUNITY
                            </Text>
                          </Box>
                        )}
                        {originalCuratedListAddress.toLowerCase() === curatedListAddress.toLowerCase() ? (
                          <Box px={2} py={0.5} bg="dark.teal.500" borderRadius="md">
                            <Text color="dark.purple.500" fontSize="xs" fontWeight="600">
                              ACTIVE
                            </Text>
                          </Box>
                        ) : (
                          <Box px={2} py={0.5} bg="orange.500" borderRadius="md">
                            <Text color="white" fontSize="xs" fontWeight="600">
                              UNSAVED
                            </Text>
                          </Box>
                        )}
                      </>
                    )}
                  </HStack>
                  <Text color="whiteAlpha.500" fontSize="xs">
                    {curatedListAddress && isAddress(curatedListAddress)
                      ? (isMainnet && curatedListAddress.toLowerCase() === recommendedCuratedAssets.address.toLowerCase()
                          ? 'Using the community curated list.'
                          : 'Using a custom curated list.')
                      : 'No curated list selected. Enter an address or use the community list.'}
                  </Text>
                </Box>
                {/* Action buttons */}
                <HStack spacing={2} flexWrap="wrap">
                  {/* No list selected - show "Use Community List" */}
                  {isMainnet && (!curatedListAddress || !isAddress(curatedListAddress)) && (
                    <Button
                      size="sm"
                      bg="dark.teal.500"
                      color="dark.purple.500"
                      fontFamily="Montserrat"
                      fontWeight="600"
                      borderRadius="lg"
                      onClick={() => setCuratedListAddress(recommendedCuratedAssets.address)}
                      _hover={{ opacity: 0.8 }}
                    >
                      Use Community List
                    </Button>
                  )}
                  {/* Custom list selected - show "Restore Community List" + "Remove" */}
                  {curatedListAddress && isAddress(curatedListAddress) &&
                   (!isMainnet || curatedListAddress.toLowerCase() !== recommendedCuratedAssets.address.toLowerCase()) && (
                    <>
                      {isMainnet && (
                        <Button
                          size="sm"
                          variant="outline"
                          borderColor="dark.teal.500"
                          color="dark.teal.500"
                          fontFamily="Montserrat"
                          fontWeight="600"
                          borderRadius="lg"
                          onClick={() => setCuratedListAddress(recommendedCuratedAssets.address)}
                          _hover={{ opacity: 0.8 }}
                        >
                          Restore Community List
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        borderColor="red.400"
                        color="red.400"
                        fontFamily="Montserrat"
                        fontWeight="600"
                        borderRadius="lg"
                        onClick={() => setCuratedListAddress('')}
                        _hover={{ opacity: 0.8, bg: 'rgba(255,0,0,0.1)' }}
                      >
                        Remove
                      </Button>
                    </>
                  )}
                  {/* Community list selected - show "Remove" only */}
                  {isMainnet && curatedListAddress.toLowerCase() === recommendedCuratedAssets.address.toLowerCase() && (
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="red.400"
                      color="red.400"
                      fontFamily="Montserrat"
                      fontWeight="600"
                      borderRadius="lg"
                      onClick={() => setCuratedListAddress('')}
                      _hover={{ opacity: 0.8, bg: 'rgba(255,0,0,0.1)' }}
                    >
                      Remove
                    </Button>
                  )}
                </HStack>
              </Flex>

              {/* Custom address input - always visible */}
              <Input
                placeholder="0x... or paste a custom curated list address"
                value={isMainnet && curatedListAddress.toLowerCase() === recommendedCuratedAssets.address.toLowerCase() ? '' : curatedListAddress}
                onChange={e => setCuratedListAddress(e.target.value)}
                bg="whiteAlpha.100"
                border="1px solid"
                borderColor={curatedListAddress &&
                  (!isMainnet || curatedListAddress.toLowerCase() !== recommendedCuratedAssets.address.toLowerCase()) &&
                  !isAddress(curatedListAddress) ? 'red.400' : 'whiteAlpha.200'}
                color="white"
                fontFamily="mono"
                fontSize="sm"
                borderRadius="lg"
                _placeholder={{ color: 'whiteAlpha.400' }}
                _hover={{ borderColor: 'whiteAlpha.300' }}
                _focus={{ borderColor: 'dark.teal.500', boxShadow: 'none' }}
              />

              {/* Metadata preview for current selection */}
              {curatedListAddress && isAddress(curatedListAddress) && (
                <Box mt={3}>
                  <AddressMetadataPreview
                    address={curatedListAddress}
                    chainId={chainId ?? undefined}
                    isDisabled={isNetworkMismatch}
                    useHashlistsLink
                  />
                </Box>
              )}
            </Box>

            {/* Manual addresses */}
            <Box>
              <Flex justify="space-between" align="center" mb={2}>
                <Text color="whiteAlpha.600" fontSize="xs">
                  Or add individual asset addresses:
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  color="dark.teal.500"
                  leftIcon={<FaPlus size={10} />}
                  onClick={addWhitelistAddress}
                  _hover={{ bg: 'whiteAlpha.100' }}
                >
                  Add
                </Button>
              </Flex>
              <VStack spacing={3} align="stretch">
                {whitelistAddresses.map((addr, i) => (
                  <Box key={i}>
                    <HStack>
                      <Input
                        placeholder="0x..."
                        value={addr}
                        onChange={e => updateWhitelistAddress(i, e.target.value)}
                        bg="whiteAlpha.100"
                        border="1px solid"
                        borderColor={addr && !isAddress(addr) ? 'red.400' : 'whiteAlpha.200'}
                        color="white"
                        fontFamily="mono"
                        fontSize="sm"
                        borderRadius="lg"
                        _placeholder={{ color: 'whiteAlpha.400' }}
                        _focus={{ borderColor: 'dark.teal.500', boxShadow: 'none' }}
                      />
                      <IconButton
                        aria-label="Remove"
                        icon={<FaTrash size={12} />}
                        size="sm"
                        variant="ghost"
                        color="whiteAlpha.500"
                        onClick={() => removeWhitelistAddress(i)}
                        _hover={{ color: 'red.400', bg: 'whiteAlpha.100' }}
                      />
                    </HStack>
                    {addr && isAddress(addr) && (
                      <AddressMetadataInline
                        address={addr}
                        chainId={chainId ?? undefined}
                        isDisabled={isNetworkMismatch}
                      />
                    )}
                  </Box>
                ))}
              </VStack>
            </Box>
          </Box>

          {/* Vault switcher */}
          {availableVaults.length > 1 && (
            <Box
              p={5}
              bg="whiteAlpha.50"
              borderRadius="xl"
              border="1px solid"
              borderColor="whiteAlpha.100"
            >
              <Text color="white" fontSize="sm" fontWeight="600" mb={1}>
                Spambox Vault
              </Text>
              <Text color="whiteAlpha.600" fontSize="xs" mb={3}>
                Change which vault receives spam tokens.
              </Text>
              <Select
                value={selectedVault}
                onChange={e => setSelectedVault(e.target.value)}
                bg="whiteAlpha.100"
                border="1px solid"
                borderColor="whiteAlpha.200"
                color="white"
                borderRadius="lg"
                size="sm"
                _hover={{ borderColor: 'whiteAlpha.300' }}
                _focus={{ borderColor: 'dark.teal.500', boxShadow: 'none' }}
              >
                {availableVaults.map((vault, idx) => (
                  <option key={vault} value={vault} style={{ background: '#1a1a2e' }}>
                    {`Vault ${idx + 1}: ${formatAddress(vault)}`}
                  </option>
                ))}
              </Select>
            </Box>
          )}

          {/* Save button */}
          <Button
            onClick={handleSaveFilters}
            isLoading={isProcessing}
            isDisabled={!hasUnsavedChanges}
            bg="white"
            color="dark.purple.500"
            fontFamily="Montserrat"
            fontWeight="600"
            fontSize="sm"
            borderRadius="xl"
            py={6}
            _hover={{ bg: 'whiteAlpha.900' }}
            _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
          >
            Save Changes
          </Button>
        </VStack>
      </Collapse>

      {/* Deactivate section */}
      <Box
        mt={4}
        pt={6}
        borderTop="1px solid"
        borderColor="whiteAlpha.100"
      >
        <Button
          variant="ghost"
          size="sm"
          color="whiteAlpha.400"
          fontFamily="Montserrat"
          fontWeight="500"
          _hover={{ color: 'red.400', bg: 'transparent' }}
          onClick={() => {
            setDeactivateMode('spambox');
            onDeactivateOpen();
          }}
        >
          Turn off protection
        </Button>
      </Box>

      {/* Deactivate Modal */}
      <Modal isOpen={isDeactivateOpen} onClose={onDeactivateClose} isCentered>
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(10px)" />
        <ModalContent
          bg="#1a1a2e"
          border="1px solid"
          borderColor="whiteAlpha.100"
          borderRadius="2xl"
          mx={4}
        >
          <ModalHeader color="white" fontFamily="Montserrat">
            Turn Off Protection
          </ModalHeader>
          <ModalCloseButton color="whiteAlpha.600" />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box
                p={4}
                bg={deactivateMode === 'spambox' ? 'whiteAlpha.100' : 'transparent'}
                borderRadius="xl"
                border="1px solid"
                borderColor={deactivateMode === 'spambox' ? 'whiteAlpha.300' : 'whiteAlpha.100'}
                cursor="pointer"
                onClick={() => setDeactivateMode('spambox')}
                transition="all 0.2s"
              >
                <Text color="white" fontSize="sm" fontWeight="600" mb={1}>
                  Disable Spambox Only
                </Text>
                <Text color="whiteAlpha.600" fontSize="xs">
                  Keeps UAP active for other assistants. You can re-enable anytime.
                </Text>
              </Box>
              <Box
                p={4}
                bg={deactivateMode === 'full' ? 'whiteAlpha.100' : 'transparent'}
                borderRadius="xl"
                border="1px solid"
                borderColor={deactivateMode === 'full' ? 'red.400' : 'whiteAlpha.100'}
                cursor="pointer"
                onClick={() => setDeactivateMode('full')}
                transition="all 0.2s"
              >
                <Text color="white" fontSize="sm" fontWeight="600" mb={1}>
                  Full Deactivation
                </Text>
                <Text color="whiteAlpha.600" fontSize="xs">
                  Removes all UAP configuration. Use only if you want a clean slate.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button
              variant="ghost"
              color="whiteAlpha.600"
              onClick={onDeactivateClose}
              fontFamily="Montserrat"
            >
              Cancel
            </Button>
            <Button
              bg={deactivateMode === 'full' ? 'red.500' : 'whiteAlpha.200'}
              color="white"
              onClick={deactivateMode === 'full' ? handleDeactivateUAP : handleDeactivateSpambox}
              isLoading={isProcessing}
              fontFamily="Montserrat"
              _hover={{ opacity: 0.8 }}
            >
              {deactivateMode === 'full' ? 'Remove Everything' : 'Disable Protection'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default GraveSubscription;
