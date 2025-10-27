'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Step,
  StepDescription,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  Text,
  useSteps,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  FormHelperText,
  useToast,
  Link as ChakraLink,
  Select,
} from '@chakra-ui/react';
import { FaCheckCircle } from 'react-icons/fa';
import { BrowserProvider, AbiCoder, isAddress, Contract } from 'ethers';
import { universalProfileAbi } from '@lukso/lsp-smart-contracts/abi';
import ERC725 from '@erc725/erc725.js';
import { ERC725JSONSchema } from '@erc725/erc725.js';
import uapSchema from '@/schemas/UAP.json';
import { useProfile } from '@/contexts/ProfileProvider';
import { useGrave } from '@/contexts/GraveContext';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { formatAddress } from '@/utils/tokenUtils';
import { subscribeToUAP, unsubscribeFromUAP } from '@/utils/uapSubscription';
import {
  isVaultRegistered,
  registerVaultWithUP,
  getRegisteredVaults,
  deployVaultWithMetadata,
  deployTestContract,
} from '@/utils/vaultCreation';
import { updateBECPermissions } from '@/utils/urdUtils';
import { getForwarderAssistantConfig } from '@/utils/assistantConfig';

// Transaction type IDs for LSP7 and LSP8 (LSP1 Type IDs from @lukso/lsp-smart-contracts)
const LSP7_TRANSACTION_TYPE =
  '0x429ac7a06903dbc9c13dfcb3c9d11df8194581fa047c96d7a4171fc7402958ea';
const LSP8_TRANSACTION_TYPE =
  '0x0b084a55ebf70fd3c06fd755269dac2212c4d3f0f4d09079780bfa50c1b2984d';

interface StepData {
  title: string;
  instructions?: string;
  instructions2?: { text: string; address: string | null };
  completeText: { text: string; address: string | null };
  complete: boolean;
}

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
  const [whitelistAddresses, setWhitelistAddresses] = useState<string>('');
  const [curatedListAddress, setCuratedListAddress] = useState<string>('');
  const [useCuratedList, setUseCuratedList] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Vault selection state
  const [availableVaults, setAvailableVaults] = useState<string[]>([]);
  const [selectedVault, setSelectedVault] = useState<string>('');
  const [isLoadingVaults, setIsLoadingVaults] = useState(false);
  const [isCreatingVault, setIsCreatingVault] = useState(false);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);

  // Phase tracking - similar to UP Assistants flow
  // Phase 0: Give permissions
  // Phase 1: Subscribe to UAP
  // Phase 2: Configure GRAVE
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(false);

  // Initial steps
  const initialSteps: StepData[] = [
    {
      title: 'Give your 🆙 extension the necessary permissions',
      instructions: 'Give permissions to your Browser Extension Controller.',
      instructions2: { text: 'This can also be done manually.', address: null },
      completeText: { text: 'PERMISSIONS SET', address: null },
      complete: false,
    },
    {
      title: 'Engage spam protection protocol',
      instructions: 'Enable spam protection on your Universal Profile.',
      completeText: { text: 'PROTOCOL ENGAGED', address: null },
      complete: false,
    },
    {
      title: 'Set your spam GRAVE address',
      completeText: { text: 'VAULT: ', address: null },
      complete: false,
    },
    {
      title: 'Configure whitelist addresses',
      instructions:
        'Add trusted sender addresses (assets from these addresses will not be sent to GRAVE).',
      completeText: { text: 'WHITELIST SET', address: null },
      complete: false,
    },
    {
      title: 'Configure curated safe list (optional)',
      instructions:
        'Add a curated list of safe assets (assets NOT on this list will be sent to GRAVE).',
      completeText: { text: 'SAFE LIST SET', address: null },
      complete: false,
    },
    {
      title: 'Activate spam protection',
      instructions: 'All unwanted assets will go to your vault.',
      completeText: { text: 'SPAM IS DEAD', address: null },
      complete: false,
    },
  ];

  const [steps, setSteps] = useState<StepData[]>(initialSteps);
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  // Fetch available vaults when component mounts or address changes
  useEffect(() => {
    const fetchVaults = async () => {
      if (!address || !window.lukso) return;

      setIsLoadingVaults(true);
      try {
        const provider = new BrowserProvider(window.lukso);
        const vaults = await getRegisteredVaults(provider, address);
        setAvailableVaults(vaults);

        // If there's an existing vault being used, select it by default
        if (vaultToUse && vaults.includes(vaultToUse)) {
          setSelectedVault(vaultToUse);
        } else if (vaults.length > 0) {
          // Select first vault by default
          setSelectedVault(vaults[0]);
        }
      } catch (error) {
        console.error('Error fetching vaults:', error);
      } finally {
        setIsLoadingVaults(false);
      }
    };

    fetchVaults();
  }, [address, vaultToUse]);

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
              setWhitelistAddresses(
                existingConfig.whitelistAddresses.join('\n')
              );
            }
            if (existingConfig.curatedListAddress) {
              setCuratedListAddress(existingConfig.curatedListAddress);
              setUseCuratedList(true);
            }
            // Set selected vault from config if available
            if (existingConfig.vaultAddress) {
              setSelectedVault(existingConfig.vaultAddress);
            }
          }
        } catch (error) {
          console.error('Error fetching existing configuration:', error);
        }
      }
    };

    fetchExistingConfig();
  }, [isLoadingGraveData, address, currentNetwork, hasUAPSubscription]);

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
    const determinePhaseState = async () => {
      if (!isLoadingGraveData && address) {
        const newSteps = [...initialSteps];

        if (mainUPController) {
          newSteps[0].instructions2!.address = mainUPController;
        }

        // Determine which phase we're in
        if (!hasUAPSubscription) {
          // If permissions not granted, show phase 0, otherwise show phase 1
          if (!permissionsGranted) {
            setCurrentPhase(0);
          } else {
            setCurrentPhase(1);
          }
          setActiveStep(0);
        } else {
          // Permissions and subscription are done
          setPermissionsGranted(true);
          newSteps[0].complete = true;
          newSteps[1].complete = true;

          if (vaultToUse) {
            newSteps[2].complete = true;
            newSteps[2].completeText.address = vaultToUse;
          }

          // Check if fully configured by reading on-chain data
          if (setupType === 'uap' && vaultToUse && currentNetwork) {
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

              if (existingConfig.isConfigured && existingConfig.vaultAddress) {
                // Fully configured - show phase 2 in completed state
                newSteps[3].complete = true;
                newSteps[4].complete = true;
                newSteps[5].complete = true;
                setCurrentPhase(2);
                setActiveStep(6);
              } else if (vaultToUse) {
                // Move to configuration phase
                setCurrentPhase(2);
                setActiveStep(3); // Move to whitelist configuration
              } else {
                // Move to configuration phase (need vault)
                setCurrentPhase(2);
                setActiveStep(2);
              }
            } catch (error) {
              console.error('Error checking configuration:', error);
              setCurrentPhase(2);
              if (vaultToUse) {
                setActiveStep(3);
              } else {
                setActiveStep(2);
              }
            }
          } else if (vaultToUse) {
            setCurrentPhase(2);
            setActiveStep(3); // Move to whitelist configuration
          } else {
            setCurrentPhase(2);
            setActiveStep(2); // Need vault
          }
        }

        setSteps(newSteps);
      }
    };

    determinePhaseState();
  }, [
    hasUAPSubscription,
    setupType,
    vaultToUse,
    isLoadingGraveData,
    address,
    mainUPController,
    currentNetwork,
    permissionsGranted,
  ]);

  // Parse whitelist addresses
  const parseAddressList = (text: string): string[] => {
    if (!text.trim()) return [];
    return text
      .split(/[,\n]/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0 && isAddress(addr));
  };

  // Validate inputs
  const validateConfiguration = (): string | null => {
    const invalidWhitelist = whitelistAddresses
      .split(/[,\n]/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0 && !isAddress(addr));

    if (invalidWhitelist.length > 0) {
      return `Invalid addresses in whitelist: ${invalidWhitelist.join(', ')}`;
    }

    if (useCuratedList) {
      if (!curatedListAddress.trim()) {
        return 'Please provide a curated list contract address or uncheck the option';
      }
      if (!isAddress(curatedListAddress)) {
        return 'Invalid curated list contract address';
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

      const newSteps = [...steps];
      newSteps[0].complete = true;
      setSteps(newSteps);
      setPermissionsGranted(true);
      setCurrentPhase(1); // Move to subscription phase
      setActiveStep(1);
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
  }, [address, mainUPController, toast, steps]);

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

      await subscribeToUAP(
        provider,
        address,
        currentNetwork.protocolAddress,
        currentNetwork.lsp1UrdVault
      );

      toast({
        title: 'Success',
        description: 'Spam protection protocol engaged!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      await refreshGraveData();

      const newSteps = [...steps];
      newSteps[1].complete = true;
      setSteps(newSteps);
      setCurrentPhase(2); // Move to configuration phase
      setActiveStep(2);
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
  }, [address, currentNetwork, toast, refreshGraveData, steps]);

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

      const vaultAddress = await deployVaultWithMetadata(
        provider,
        address,
        mainUPController
      );

      toast({
        title: 'Success! 🎉',
        description: `GRAVE Spambox deployed at ${formatAddress(vaultAddress)}`,
        status: 'success',
        duration: 7000,
        isClosable: true,
      });

      // Refresh the vault list
      const vaults = await getRegisteredVaults(provider, address);
      setAvailableVaults(vaults);
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

  // Step 3: Set vault (if needed, otherwise skip)
  const handleSetVault = useCallback(async () => {
    // Use selected vault from dropdown, or fall back to vaultToUse
    const vaultAddress = selectedVault || vaultToUse;

    if (!vaultAddress) {
      toast({
        title: 'Error',
        description:
          'No vault selected. Please select a vault from the dropdown or create a new vault.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Mark vault step as complete
    const newSteps = [...steps];
    newSteps[2].complete = true;
    newSteps[2].completeText.address = vaultAddress;
    setSteps(newSteps);
    setActiveStep(3);
  }, [selectedVault, vaultToUse, toast, steps]);

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

      // Parse whitelist addresses
      const whitelistArray = parseAddressList(whitelistAddresses);

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
        useCuratedList,
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
        title: isEditMode
          ? '✅ Configuration updated successfully!'
          : '🪲👻 Beetlejuice, Beetlejuice, Beetlejuice 👻🪲',
        status: 'success',
        duration: 9000,
        isClosable: true,
      });

      // Complete all remaining steps
      const newSteps = steps.map(s => ({ ...s, complete: true }));
      setSteps(newSteps);
      setActiveStep(6);

      // Exit edit mode if we were in it
      if (isEditMode) {
        setIsEditMode(false);
      }

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
    steps,
    isEditMode,
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

      // Reset steps
      setSteps(initialSteps);
      setActiveStep(0);
      setWhitelistAddresses('');
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

  const standardStepper = (step: StepData, index: number) => {
    const isActive = index === activeStep;
    // Show input if active and not complete, OR if in edit mode and this is step 2, 3, or 4 (vault, whitelist, curated list)
    const showInput =
      (isActive && !step.complete) || (isEditMode && index >= 2 && index <= 4);

    return (
      <Step key={index}>
        <StepIndicator
          color="var(--chakra-colors-dark-purple-500)"
          borderColor="var(--chakra-colors-dark-purple-500)"
          fontWeight={'bold'}
        >
          <StepStatus
            complete={'🪦'}
            incomplete={<StepNumber />}
            active={<StepNumber />}
          />
        </StepIndicator>
        <Box flexShrink="0" textAlign={'left'} width="100%">
          <StepTitle
            style={{
              color: 'var(--chakra-colors-dark-purple-500)',
              fontWeight: 'bold',
              width: '100%',
            }}
          >
            {step.title}
          </StepTitle>
          {!step.complete ? (
            <Box>
              {step.instructions && <Box mb={2}>{step.instructions}</Box>}
              {step.instructions2 &&
                step.instructions2.address &&
                currentNetwork && (
                  <Text fontSize="sm" color="dark.purple.500" mb={2}>
                    {step.instructions2.text}{' '}
                    <ChakraLink
                      href={`${currentNetwork.explorer}/address/${step.instructions2.address}`}
                      color="dark.purple.500"
                      textDecoration="underline"
                      _hover={{ color: 'dark.purple.400' }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ({formatAddress(step.instructions2.address)})
                    </ChakraLink>
                  </Text>
                )}

              {/* Step 3: Vault selection */}
              {index === 2 && showInput && (
                <Box mt={3} mb={3}>
                  <FormControl>
                    <FormLabel
                      fontSize="sm"
                      fontWeight="bold"
                      color="dark.purple.500"
                      fontFamily="Montserrat"
                    >
                      Select Vault (Spambox)
                    </FormLabel>
                    {isLoadingVaults ? (
                      <Text fontSize="sm" color="dark.purple.500">
                        Loading vaults...
                      </Text>
                    ) : availableVaults.length > 0 ? (
                      <>
                        <Select
                          value={selectedVault}
                          onChange={e => setSelectedVault(e.target.value)}
                          fontFamily="mono"
                          size="sm"
                          color="dark.purple.500"
                          borderColor="dark.purple.500"
                          _focus={{ borderColor: 'dark.purple.400' }}
                        >
                          {availableVaults.map((vault, idx) => (
                            <option key={vault} value={vault}>
                              Vault {idx + 1}: {formatAddress(vault)}
                            </option>
                          ))}
                        </Select>
                        <FormHelperText fontSize="xs" color="dark.purple.500">
                          Select which vault will receive spam assets. You can
                          view your vaults in the LSP10Vaults array on your
                          Universal Profile.
                        </FormHelperText>
                      </>
                    ) : (
                      <>
                        <Text fontSize="sm" color="red.500" mb={2}>
                          No vaults found on your Universal Profile
                        </Text>
                        <FormHelperText fontSize="xs" color="dark.purple.500">
                          You need to create a vault first. Visit{' '}
                          <ChakraLink
                            href="https://docs.lukso.tech/standards/universal-profile/lsp9-vault/"
                            target="_blank"
                            style={{ textDecoration: 'underline' }}
                          >
                            LUKSO docs
                          </ChakraLink>{' '}
                          to learn how to create a vault.
                        </FormHelperText>
                      </>
                    )}
                  </FormControl>
                </Box>
              )}

              {/* Step 4: Whitelist input */}
              {index === 3 && showInput && (
                <Box mt={3} mb={3}>
                  <FormControl>
                    <FormLabel
                      fontSize="sm"
                      fontWeight="bold"
                      color="dark.purple.500"
                      fontFamily="Montserrat"
                    >
                      Whitelist Addresses (Required)
                    </FormLabel>
                    <Textarea
                      placeholder="0x123...&#10;0x456...&#10;(one per line)"
                      value={whitelistAddresses}
                      onChange={e => setWhitelistAddresses(e.target.value)}
                      fontFamily="mono"
                      size="sm"
                      rows={4}
                      color="dark.purple.500"
                      borderColor="dark.purple.500"
                      _focus={{ borderColor: 'dark.purple.400' }}
                    />
                    <FormHelperText fontSize="xs" color="dark.purple.500">
                      Assets from these addresses will NOT be sent to GRAVE
                    </FormHelperText>
                  </FormControl>
                </Box>
              )}

              {/* Step 5: Curated list input */}
              {index === 4 && showInput && (
                <Box mt={3} mb={3}>
                  <FormControl mb={3}>
                    <Flex align="center" mb={2}>
                      <input
                        type="checkbox"
                        checked={useCuratedList}
                        onChange={e => setUseCuratedList(e.target.checked)}
                        style={{ marginRight: '8px' }}
                      />
                      <FormLabel
                        fontSize="sm"
                        fontWeight="bold"
                        color="dark.purple.500"
                        fontFamily="Montserrat"
                        mb={0}
                      >
                        Use Curated Safe List (Optional)
                      </FormLabel>
                    </Flex>
                    {useCuratedList && (
                      <>
                        <Input
                          placeholder="0x..."
                          value={curatedListAddress}
                          onChange={e => setCuratedListAddress(e.target.value)}
                          fontFamily="mono"
                          size="sm"
                          color="dark.purple.500"
                          borderColor="dark.purple.500"
                          _focus={{ borderColor: 'dark.purple.400' }}
                        />
                        <FormHelperText fontSize="xs" color="dark.purple.500">
                          Assets NOT on this list will be sent to GRAVE
                        </FormHelperText>
                      </>
                    )}
                  </FormControl>
                </Box>
              )}
            </Box>
          ) : (
            <StepDescription as={'div'}>
              <Flex alignItems="center" gap={1}>
                {step.completeText.text}
                {step.completeText.address && currentNetwork && (
                  <ChakraLink
                    href={`${currentNetwork.explorer}/address/${step.completeText.address}`}
                    style={{ textDecoration: 'underline' }}
                    target="_blank"
                  >
                    {formatAddress(step.completeText.address)}
                  </ChakraLink>
                )}
                {step.complete ? <FaCheckCircle /> : <></>}
              </Flex>
            </StepDescription>
          )}
        </Box>
        <StepSeparator
          style={{
            color: 'var(--chakra-colors-dark-purple-500)',
            backgroundColor: 'var(--chakra-colors-dark-purple-500)',
          }}
        />
      </Step>
    );
  };

  const displayMainTitle = () => {
    if (steps[5].complete) {
      return 'YOU HAVE A GRAVE SPAMBOX!';
    } else {
      return 'SET UP YOUR GRAVE SPAMBOX';
    }
  };

  const renderActionButton = () => {
    // Show edit/unsubscribe options if fully configured
    if (hasUAPSubscription && steps[5].complete) {
      if (isEditMode) {
        return (
          <Flex gap={2} mb={4}>
            <Button
              onClick={handleActivateGrave}
              isLoading={isProcessing}
              isDisabled={isProcessing}
              color={'dark.purple.500'}
              border={'1px solid var(--chakra-colors-dark-purple-500)'}
              size={'md'}
              fontFamily="Bungee"
              fontSize="16px"
              fontWeight="400"
            >
              {isProcessing ? 'SAVING...' : 'SAVE CHANGES'}
            </Button>
            <Button
              onClick={() => setIsEditMode(false)}
              isDisabled={isProcessing}
              variant="outline"
              color={'dark.purple.500'}
              borderColor="dark.purple.500"
              size={'md'}
              fontFamily="Bungee"
              fontSize="16px"
              fontWeight="400"
            >
              CANCEL
            </Button>
          </Flex>
        );
      } else {
        return (
          <Flex gap={2} mb={4}>
            <Button
              onClick={() => setIsEditMode(true)}
              isDisabled={isProcessing}
              color={'dark.purple.500'}
              border={'1px solid var(--chakra-colors-dark-purple-500)'}
              size={'md'}
              fontFamily="Bungee"
              fontSize="16px"
              fontWeight="400"
            >
              EDIT CONFIGURATION
            </Button>
            <Button
              onClick={handleUnsubscribe}
              isLoading={isProcessing}
              isDisabled={isProcessing}
              variant="outline"
              color={'dark.purple.500'}
              borderColor="dark.purple.500"
              size={'md'}
              fontFamily="Bungee"
              fontSize="16px"
              fontWeight="400"
            >
              UNSUBSCRIBE
            </Button>
          </Flex>
        );
      }
    }

    // Show appropriate button based on current step
    if (activeStep === 0 && !steps[0].complete) {
      return (
        <Button
          onClick={handleSetPermissions}
          isLoading={isProcessing}
          isDisabled={isProcessing}
          color={'dark.purple.500'}
          border={'1px solid var(--chakra-colors-dark-purple-500)'}
          size={'md'}
          fontFamily="Bungee"
          fontSize="16px"
          fontWeight="400"
          mb={4}
        >
          {isProcessing ? 'PROCESSING...' : 'START'}
        </Button>
      );
    }

    if (activeStep === 1 && !steps[1].complete) {
      return (
        <Button
          onClick={handleSubscribe}
          isLoading={isProcessing}
          isDisabled={isProcessing}
          color={'dark.purple.500'}
          border={'1px solid var(--chakra-colors-dark-purple-500)'}
          size={'md'}
          fontFamily="Bungee"
          fontSize="16px"
          fontWeight="400"
          mb={4}
        >
          {isProcessing ? 'ENABLING...' : 'ENABLE GRAVE'}
        </Button>
      );
    }

    if (activeStep === 2 && !steps[2].complete) {
      return (
        <Button
          onClick={handleSetVault}
          isLoading={isProcessing}
          isDisabled={isProcessing}
          size={'md'}
          fontFamily="Bungee"
          fontSize="16px"
          fontWeight="400"
          mb={4}
          variant="solidWhite"
        >
          CONTINUE
        </Button>
      );
    }

    if (activeStep === 3 && !steps[3].complete) {
      return (
        <Button
          onClick={() => {
            const newSteps = [...steps];
            newSteps[3].complete = true;
            setSteps(newSteps);
            setActiveStep(4);
          }}
          isLoading={isProcessing}
          isDisabled={isProcessing}
          size={'md'}
          fontFamily="Bungee"
          fontSize="16px"
          mb={4}
          variant="solidWhite"
        >
          CONTINUE
        </Button>
      );
    }

    if (activeStep === 4 && !steps[4].complete) {
      // Validate curated list input before allowing to continue
      const canContinue =
        !useCuratedList ||
        (useCuratedList && curatedListAddress && isAddress(curatedListAddress));

      return (
        <Button
          onClick={() => {
            // Validate before proceeding
            if (
              useCuratedList &&
              (!curatedListAddress || !isAddress(curatedListAddress))
            ) {
              toast({
                title: 'Validation Error',
                description:
                  'Please provide a valid curated list address or uncheck the option',
                status: 'error',
                duration: 5000,
                isClosable: true,
              });
              return;
            }

            const newSteps = [...steps];
            newSteps[4].complete = true;
            setSteps(newSteps);
            setActiveStep(5);
          }}
          isLoading={isProcessing}
          isDisabled={isProcessing || (useCuratedList && !canContinue)}
          color={'dark.purple.500'}
          border={'1px solid var(--chakra-colors-dark-purple-500)'}
          size={'md'}
          fontFamily="Bungee"
          fontSize="16px"
          fontWeight="400"
          mb={4}
        >
          CONTINUE
        </Button>
      );
    }

    if (activeStep === 5 && !steps[5].complete) {
      return (
        <Button
          onClick={handleActivateGrave}
          isLoading={isProcessing}
          isDisabled={isProcessing}
          color={'dark.purple.500'}
          border={'1px solid var(--chakra-colors-dark-purple-500)'}
          size={'md'}
          fontFamily="Bungee"
          fontSize="16px"
          fontWeight="400"
          mb={4}
        >
          {isProcessing ? 'ACTIVATING...' : 'ACTIVATE GRAVE'}
        </Button>
      );
    }

    return null;
  };

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
            {isProcessing ? 'INSTALLING...' : 'INSTALL PROTOCOL'}
          </Button>
        </Box>
      </Box>
    );
  }

  // Phase 2: Configure GRAVE (settings panel following UP Assistants pattern)
  return (
    <Flex width="100%" flexDirection="column" gap={6}>
      <Text
        fontSize="20px"
        fontWeight="bold"
        fontFamily="Bungee"
        color="dark.purple.400"
      >
        {displayMainTitle()}
      </Text>

      {/* Section A: Forwarder Assistant Configuration */}
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
              GRAVE Spambox Address
            </Text>
          </Box>
        </Flex>

        <Flex
          flexDirection="row"
          gap={4}
          maxWidth="550px"
          align="center"
          mb={3}
        >
          <Text fontWeight="bold" fontSize="sm" color="dark.purple.500" w="40%">
            Select or create a spambox
          </Text>
          <Box w="60%">
            {isLoadingVaults ? (
              <Text fontSize="sm" color="dark.purple.500">
                Loading vaults...
              </Text>
            ) : /*availableVaults.length > 0*/ false ? (
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
                {availableVaults.map((vault, idx) => (
                  <option key={vault} value={vault}>
                    Vault {idx + 1}: {formatAddress(vault)}
                  </option>
                ))}
              </Select>
            ) : (
              <Button
                onClick={handleCreateVault}
                isLoading={isCreatingVault}
                isDisabled={isCreatingVault}
                size="sm"
                colorScheme="green"
                fontFamily="Montserrat"
                fontSize="14px"
                fontWeight="600"
                width="full"
              >
                {isCreatingVault ? 'Creating...' : 'Create GRAVE Spambox'}
              </Button>
            )}
          </Box>
        </Flex>
      </Box>

      {/* Section B: Transaction Screening */}
      <Box
        p={6}
        bg="dark.purple.200"
        borderRadius="lg"
        border="2px solid"
        borderColor="dark.purple.400"
      >
        <Flex align="center" justify="space-between" mb={4}>
          <Box>
            <Text
              fontSize="md"
              fontWeight="bold"
              color="blue.800"
              fontFamily="Montserrat"
            >
              Additional Screening
            </Text>
          </Box>
          <Text fontSize="sm" color="dark.purple.500" fontWeight="semibold">
            Always enabled for GRAVE
          </Text>
        </Flex>

        <Flex flexDirection="column" gap={4}>
          {/* Screener 1: Address List Screener */}
          <Box
            p={4}
            bg="white"
            borderRadius="md"
            border="2px solid"
            borderColor="blue.200"
          >
            <Text fontSize="md" fontWeight="bold" color="blue.800" mb={2}>
              Whitelist Screener
            </Text>
            <Text fontSize="sm" color="gray.600" mb={3}>
              Assets from these addresses will NOT be sent to GRAVE
            </Text>
            <Textarea
              placeholder="0x123...&#10;0x456...&#10;(one per line)"
              value={whitelistAddresses}
              onChange={e => setWhitelistAddresses(e.target.value)}
              fontFamily="mono"
              size="sm"
              rows={4}
              color="dark.purple.500"
              borderColor="blue.300"
              _focus={{ borderColor: 'blue.400' }}
              bg="gray.50"
            />
          </Box>

          {/* AND Logic Indicator */}
          <Box textAlign="center" py={2}>
            <Box
              display="inline-block"
              px={3}
              py={1}
              bg="blue.500"
              color="white"
              borderRadius="full"
              fontSize="xs"
              fontWeight="bold"
            >
              AND
            </Box>
          </Box>

          {/* Screener 2: Curated List Screener (Optional) */}
          <Box
            p={4}
            bg="white"
            borderRadius="md"
            border="2px solid"
            borderColor={useCuratedList ? 'blue.200' : 'gray.200'}
          >
            <Flex align="center" mb={2}>
              <input
                type="checkbox"
                checked={useCuratedList}
                onChange={e => setUseCuratedList(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <Text fontSize="md" fontWeight="bold" color="blue.800">
                Curated Safe List (Optional)
              </Text>
            </Flex>
            <Text fontSize="sm" color="gray.600" mb={3}>
              Assets NOT on this list will be sent to GRAVE
            </Text>
            {useCuratedList && (
              <Input
                placeholder="0x..."
                value={curatedListAddress}
                onChange={e => setCuratedListAddress(e.target.value)}
                fontFamily="mono"
                size="sm"
                color="dark.purple.500"
                borderColor="blue.300"
                _focus={{ borderColor: 'blue.400' }}
                bg="gray.50"
              />
            )}
          </Box>
        </Flex>
      </Box>

      {/* Section C: Save Actions */}
      <Flex gap={2} justifyContent="flex-start">
        <Button
          onClick={handleActivateGrave}
          isLoading={isProcessing}
          isDisabled={isProcessing || !selectedVault}
          color="white"
          bg="orange.500"
          _hover={{ bg: 'orange.600' }}
          _active={{ bg: 'orange.700' }}
          size="md"
          fontFamily="Bungee"
          fontSize="16px"
          fontWeight="400"
        >
          {isProcessing
            ? 'SAVING...'
            : steps[5]?.complete
              ? 'SAVE CHANGES'
              : 'SAVE & ACTIVATE'}
        </Button>
        {steps[5]?.complete && (
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
        )}
      </Flex>
    </Flex>
  );
};

export default GraveSubscription;
