'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  VStack,
  HStack,
  Input,
  Badge,
  useToast,
  Spinner,
  Divider,
  FormControl,
  FormLabel,
  FormHelperText,
  Textarea,
} from '@chakra-ui/react';
import { BrowserProvider, Contract, AbiCoder, isAddress } from 'ethers';
import { universalProfileAbi } from '@lukso/lsp-smart-contracts/abi';
import { useProfile } from '@/contexts/ProfileProvider';
import { useGrave } from '@/contexts/GraveContext';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { subscribeToUAP } from '@/utils/uapSubscription';
import { isVaultRegistered, registerVaultWithUP } from '@/utils/vaultCreation';

// Transaction type IDs for LSP7 and LSP8
const LSP7_TRANSACTION_TYPE =
  '0x0000000000000000000000000000000000000000000000000000000000000001';
const LSP8_TRANSACTION_TYPE =
  '0x0000000000000000000000000000000000000000000000000000000000000002';

interface GraveConfigurationProps {
  networkName: string;
  onConfigurationComplete?: () => void;
}

const GraveConfiguration: React.FC<GraveConfigurationProps> = ({
  networkName,
  onConfigurationComplete,
}) => {
  const toast = useToast({ position: 'bottom-left' });
  const { profileDetailsData, isConnected, chainId } = useProfile();
  const {
    hasUAPSubscription,
    hasLegacyGrave,
    setupType,
    uapVaultAddress,
    graveVault,
    refreshGraveData,
    isLoadingGraveData,
  } = useGrave();

  const address = profileDetailsData?.upWallet;
  const currentNetwork = chainId ? supportedNetworks[chainId] : null;

  // Configuration state
  const [curatedListAddress, setCuratedListAddress] = useState<string>('');
  const [exclusionList, setExclusionList] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  // Determine which vault to use
  const vaultToUse = uapVaultAddress || graveVault;

  // Parse exclusion list (comma or newline separated addresses)
  const parseExclusionList = (text: string): string[] => {
    if (!text.trim()) return [];
    return text
      .split(/[,\n]/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0 && isAddress(addr));
  };

  // Validate inputs
  const validateInputs = (): string | null => {
    if (!curatedListAddress.trim()) {
      return 'Please provide a curated list contract address';
    }
    if (!isAddress(curatedListAddress)) {
      return 'Invalid curated list contract address';
    }
    const exclusionAddresses = parseExclusionList(exclusionList);
    const invalidAddresses = exclusionList
      .split(/[,\n]/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0 && !isAddress(addr));

    if (invalidAddresses.length > 0) {
      return `Invalid addresses in exclusion list: ${invalidAddresses.join(', ')}`;
    }
    return null;
  };

  // Step 1: Subscribe to UAP Protocol
  const handleSubscribeToUAP = useCallback(async () => {
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
    setError('');

    try {
      const provider = new BrowserProvider(window.lukso);

      // Subscribe to UAP Protocol
      await subscribeToUAP(
        provider,
        address,
        currentNetwork.protocolAddress,
        currentNetwork.lsp1UrdVault // Default URD to restore if unsubscribed
      );

      toast({
        title: 'Success',
        description: 'Successfully subscribed to UAP Protocol!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Refresh GRAVE data to detect new setup
      await refreshGraveData();
    } catch (err: any) {
      console.error('Error subscribing to UAP:', err);
      setError(`Failed to subscribe: ${err.message}`);
      toast({
        title: 'Error',
        description: `Failed to subscribe: ${err.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [address, currentNetwork, toast, refreshGraveData]);

  // Step 2: Configure GRAVE with Forwarder Assistant
  const handleConfigureGrave = useCallback(async () => {
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

    // Validate inputs
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
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
    setError('');

    try {
      const provider = new BrowserProvider(window.lukso);
      const signer = await provider.getSigner();
      const upContract = new Contract(address, universalProfileAbi, signer);

      // Determine vault address
      let finalVaultAddress = vaultToUse;

      // If no vault exists, we need to create one
      if (!finalVaultAddress) {
        toast({
          title: 'Creating Vault',
          description: 'No vault found. Creating a new vault for your GRAVE...',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });

        // TODO: Implement vault creation via LSP23 factory
        // For now, throw error asking user to create vault first
        throw new Error(
          'No vault found. Vault creation is not yet implemented. Please create a vault first.'
        );
      }

      // Ensure vault is registered with UP
      const isRegistered = await isVaultRegistered(
        provider,
        address,
        finalVaultAddress
      );
      if (!isRegistered) {
        toast({
          title: 'Registering Vault',
          description: 'Registering vault with your Universal Profile...',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        await registerVaultWithUP(provider, address, finalVaultAddress);
      }

      // Prepare exclusion list
      const exclusionAddresses = parseExclusionList(exclusionList);

      // Build configuration for both LSP7 and LSP8
      const keys: string[] = [];
      const values: string[] = [];

      // For each transaction type (LSP7 and LSP8)
      for (const txType of [LSP7_TRANSACTION_TYPE, LSP8_TRANSACTION_TYPE]) {
        // 1. Set Forwarder Assistant configuration
        // Key: UAP:Assistants:Executive:<assistantAddress>:<txType>:Config
        const assistantConfigKey =
          `0x41534d5441535349535441` + // "UAP:Assistants:Executive:"
          currentNetwork.forwarderAssistantAddress.substring(2).toLowerCase() +
          `:${txType}:Config`;

        // Encode forwarder config: destination vault address
        const abiCoder = new AbiCoder();
        const forwarderConfigData = abiCoder.encode(
          ['address'],
          [finalVaultAddress]
        );

        keys.push(assistantConfigKey);
        values.push(forwarderConfigData);

        // 2. Set Curated List Screener configuration
        // Key: UAP:Screeners:<screenerAddress>:<txType>:Config
        const curatedScreenerKey =
          `0x41534d5343524545` + // "UAP:Screeners:"
          currentNetwork.curatedListScreenerAddress.substring(2).toLowerCase() +
          `:${txType}:Config`;

        // Encode screener config: (curatedListAddress, bool membershipTriggersFailure=true)
        const curatedScreenerConfig = abiCoder.encode(
          ['address', 'bool'],
          [curatedListAddress, true] // true = membership triggers failure
        );

        keys.push(curatedScreenerKey);
        values.push(curatedScreenerConfig);

        // 3. If we have exclusion addresses, configure Address List Screener
        if (exclusionAddresses.length > 0) {
          // Key: UAP:Screeners:<screenerAddress>:<txType>:Config
          const addressScreenerKey =
            `0x41534d5343524545` + // "UAP:Screeners:"
            currentNetwork.addressListScreenerAddress
              .substring(2)
              .toLowerCase() +
            `:${txType}:Config`;

          // Encode screener config: address list
          // For Address List Screener: if source in list, pass screening
          const addressScreenerConfig = abiCoder.encode(
            ['address[]'],
            [exclusionAddresses]
          );

          keys.push(addressScreenerKey);
          values.push(addressScreenerConfig);

          // 4. Set screener list for this tx type (both screeners, OR relationship)
          const screenerListKey =
            `0x41534d5441535349535441` + // "UAP:Assistants:Executive:"
            currentNetwork.forwarderAssistantAddress
              .substring(2)
              .toLowerCase() +
            `:${txType}:Screeners`;

          const screenerList = abiCoder.encode(
            ['address[]', 'bool'],
            [
              [
                currentNetwork.curatedListScreenerAddress,
                currentNetwork.addressListScreenerAddress,
              ],
              false, // false = OR relationship between screeners
            ]
          );

          keys.push(screenerListKey);
          values.push(screenerList);
        } else {
          // Only Curated List Screener
          const screenerListKey =
            `0x41534d5441535349535441` + // "UAP:Assistants:Executive:"
            currentNetwork.forwarderAssistantAddress
              .substring(2)
              .toLowerCase() +
            `:${txType}:Screeners`;

          const screenerList = abiCoder.encode(
            ['address[]', 'bool'],
            [
              [currentNetwork.curatedListScreenerAddress],
              false, // OR relationship (though only one screener)
            ]
          );

          keys.push(screenerListKey);
          values.push(screenerList);
        }

        // 5. Set execution order for this tx type
        // Key: UAP:TransactionTypes:<txType>:ExecutionOrder
        const executionOrderKey = `0x545950455345` + txType + `:ExecutionOrder`;

        // Get current execution order, append forwarder assistant if not present
        // For now, we'll set it to position 1 (simple implementation)
        const executionOrderValue = abiCoder.encode(['uint256'], [1]);

        keys.push(executionOrderKey);
        values.push(executionOrderValue);
      }

      // Execute setDataBatch
      toast({
        title: 'Configuring GRAVE',
        description: 'Please confirm the transaction in your wallet...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      const tx = await (upContract as any).setDataBatch(keys, values);

      toast({
        title: 'Transaction Submitted',
        description: 'Waiting for confirmation...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      await tx.wait();

      toast({
        title: 'Success',
        description:
          'GRAVE configured successfully! Your spam protection is now active.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Refresh GRAVE data
      await refreshGraveData();

      // Call completion callback
      if (onConfigurationComplete) {
        onConfigurationComplete();
      }
    } catch (err: any) {
      console.error('Error configuring GRAVE:', err);
      const errorMessage = err.message || 'Unknown error occurred';
      setError(`Failed to configure: ${errorMessage}`);
      toast({
        title: 'Configuration Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [
    address,
    currentNetwork,
    curatedListAddress,
    exclusionList,
    vaultToUse,
    toast,
    refreshGraveData,
    onConfigurationComplete,
  ]);

  // Render different states
  if (!isConnected || !address) {
    return (
      <Box p={6} border="1px" borderColor="gray.200" borderRadius="lg">
        <Text>Please connect your wallet to configure GRAVE.</Text>
      </Box>
    );
  }

  if (isLoadingGraveData) {
    return (
      <Flex p={6} justify="center" align="center">
        <Spinner size="lg" />
        <Text ml={4}>Loading GRAVE configuration...</Text>
      </Flex>
    );
  }

  return (
    <VStack spacing={6} align="stretch" p={6}>
      {/* Status Banner */}
      <Box
        p={4}
        bg={hasUAPSubscription ? 'green.50' : 'orange.50'}
        border="1px solid"
        borderColor={hasUAPSubscription ? 'green.200' : 'orange.200'}
        borderRadius="lg"
      >
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <HStack>
              <Text fontWeight="bold" fontSize="lg">
                GRAVE Status
              </Text>
              <Badge colorScheme={hasUAPSubscription ? 'green' : 'orange'}>
                {setupType === 'uap' && 'UAP Active'}
                {setupType === 'legacy' && 'Legacy Mode'}
                {setupType === 'both' && 'Dual Mode'}
                {setupType === 'none' && 'Not Configured'}
              </Badge>
            </HStack>
            <Text fontSize="sm" color="gray.600">
              {hasUAPSubscription
                ? 'Your profile is subscribed to UAP Protocol'
                : 'Subscribe to UAP Protocol to enable GRAVE'}
            </Text>
            {vaultToUse && (
              <Text fontSize="xs" color="gray.500" fontFamily="mono">
                Vault: {vaultToUse}
              </Text>
            )}
          </VStack>
          {!hasUAPSubscription && (
            <Button
              colorScheme="orange"
              onClick={handleSubscribeToUAP}
              isLoading={isProcessing}
              isDisabled={isProcessing}
            >
              Subscribe to UAP
            </Button>
          )}
        </HStack>
      </Box>

      <Divider />

      {/* Configuration Form */}
      {hasUAPSubscription ? (
        <VStack spacing={4} align="stretch">
          <Box>
            <Text fontSize="lg" fontWeight="bold" mb={2}>
              🛡️ Configure GRAVE Spam Protection
            </Text>
            <Text fontSize="sm" color="gray.600">
              Automatically protects both LSP7 (tokens) and LSP8 (NFTs) by
              forwarding spam to your vault.
            </Text>
          </Box>

          {/* Curated List Address */}
          <FormControl isRequired>
            <FormLabel fontSize="sm" fontWeight="bold">
              Curated List Contract Address
            </FormLabel>
            <Input
              placeholder="0x..."
              value={curatedListAddress}
              onChange={e => setCuratedListAddress(e.target.value)}
              fontFamily="mono"
              size="sm"
            />
            <FormHelperText fontSize="xs">
              Assets in this curated list will be treated as spam and forwarded
              to your vault.
            </FormHelperText>
          </FormControl>

          {/* Exclusion List */}
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="bold">
              Exclusion List (Optional)
            </FormLabel>
            <Textarea
              placeholder="Enter addresses separated by commas or newlines&#10;0x123...&#10;0x456..."
              value={exclusionList}
              onChange={e => setExclusionList(e.target.value)}
              fontFamily="mono"
              size="sm"
              rows={4}
            />
            <FormHelperText fontSize="xs">
              Assets from these addresses will always pass through (even if in
              curated list). Useful for whitelisting trusted senders.
            </FormHelperText>
          </FormControl>

          {/* Screener Logic Info */}
          <Box
            p={3}
            bg="blue.50"
            border="1px solid"
            borderColor="blue.200"
            borderRadius="lg"
          >
            <Text fontSize="xs" color="blue.800">
              💡 <strong>How it works:</strong> If an asset is in the curated
              list OR the sender is not in your exclusion list, it will be
              treated as spam and forwarded to your vault. Assets from addresses
              in your exclusion list will always be accepted.
            </Text>
          </Box>

          {/* Error Display */}
          {error && (
            <Box
              p={3}
              bg="red.50"
              border="1px solid"
              borderColor="red.200"
              borderRadius="lg"
            >
              <Text fontSize="sm" color="red.600" fontWeight="medium">
                {error}
              </Text>
            </Box>
          )}

          {/* Action Buttons */}
          <HStack spacing={3}>
            <Button
              colorScheme="orange"
              onClick={handleConfigureGrave}
              isLoading={isProcessing}
              isDisabled={isProcessing || !curatedListAddress.trim()}
              size="md"
              width="full"
            >
              {isProcessing ? 'Configuring...' : 'Save & Activate GRAVE'}
            </Button>
          </HStack>
        </VStack>
      ) : (
        <Box
          p={4}
          bg="gray.50"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
        >
          <Text fontSize="sm" color="gray.600">
            Please subscribe to UAP Protocol first to configure GRAVE.
          </Text>
        </Box>
      )}

      {/* Legacy GRAVE Info */}
      {hasLegacyGrave && (
        <Box
          p={4}
          bg="yellow.50"
          border="1px solid"
          borderColor="yellow.200"
          borderRadius="lg"
        >
          <Text fontSize="sm" color="yellow.800" fontWeight="bold" mb={1}>
            ⚠️ Legacy GRAVE Detected
          </Text>
          <Text fontSize="xs" color="yellow.700">
            You have an old GRAVE configuration. The new UAP-based GRAVE will
            work alongside it. Legacy vault: {graveVault}
          </Text>
        </Box>
      )}
    </VStack>
  );
};

export default GraveConfiguration;
