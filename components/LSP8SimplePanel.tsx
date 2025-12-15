import { useState } from 'react';
import {
  Button,
  Flex,
  IconButton,
  Image,
  Text,
  useToast,
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { Contract, BrowserProvider } from 'ethers';
import {
  lsp9VaultAbi,
  lsp8IdentifiableDigitalAssetAbi,
} from '@lukso/lsp-smart-contracts/abi';
import { formatAddress, TokenData } from '@/utils/tokenUtils';
import { LSP1GraveForwarder__factory } from '@/contracts';
import { useProfile } from '@/contexts/ProfileProvider';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { useGrave } from '@/contexts/GraveContext';
import { updateScreenersOnRevive } from '@/utils/screenerUpdates';
import { AssetIcon } from '@/components/AssetIcon';
import { useRouter, useParams } from 'next/navigation';

interface LSP8SimplePanelProps {
  readonly tokenData: TokenData;
  readonly vaultAddress: string;
  readonly vaultOwner: string;
  onReviveSuccess: (assetAddress: string, tokenId: string) => void;
  isRevivingAll: boolean;
}

const LSP8SimplePanel: React.FC<LSP8SimplePanelProps> = ({
  tokenData,
  vaultAddress,
  vaultOwner,
  onReviveSuccess,
  isRevivingAll,
}) => {
  const { profileDetailsData, chainId } = useProfile();
  const { hasUAPSubscription, setupType } = useGrave();
  const connectedUPAddress = profileDetailsData?.upWallet || null;
  const networkConfig = chainId ? supportedNetworks[chainId.toString()] : null;
  const router = useRouter();
  const params = useParams();
  const networkName = params.networkName as string;

  const [inProcessingText, setInProcessingText] = useState<string>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const panelBgColor = 'dark.purple.200';
  const containerBorderColor = 'var(--chakra-colors-dark-purple-500)';

  const createButtonBg = 'dark.white';
  const createButtonColor = 'var(--chakra-colors-dark-purple-500)';
  const createButtonBorder = '1px solid var(--chakra-colors-dark-purple-500)';

  const fontColor = 'dark.purple.500';

  const tokenIdDisplay = formatAddress(tokenData.tokenId || '');
  const tokenAddressDisplay = formatAddress(tokenData.address || '');
  const toast = useToast();

  const handleReviveClick = () => {
    // Check if user needs to upgrade or configure first
    if (setupType === 'legacy' || setupType === 'none') {
      onOpen(); // Show upgrade/config prompt modal
      return;
    }
    // Otherwise proceed with revive
    transferTokenToUP(tokenData.address, tokenData.tokenId!);
  };

  const handleUpgradeClick = () => {
    router.push(`/${networkName}/grave/settings`);
  };

  const transferTokenToUP = async (tokenAddress: string, tokenId: string) => {
    if (inProcessingText !== undefined || !window.lukso || !networkConfig) {
      return;
    }

    setInProcessingText('Unblocking');
    try {
      const provider = new BrowserProvider(window.lukso);
      const signer = await provider.getSigner();
      const upAddress = await signer.getAddress();

      // Handle legacy GRAVE allowlist system (only for pure legacy mode)
      if (setupType === 'legacy') {
        const LSP1GraveForwarderContract = LSP1GraveForwarder__factory.connect(
          networkConfig.universalGraveForwarder,
          signer
        );

        if (
          !(await LSP1GraveForwarderContract.tokenAllowlist(
            upAddress,
            tokenAddress
          ))
        ) {
          await LSP1GraveForwarderContract.addTokenToAllowlist(tokenAddress, {
            gasLimit: 400_00,
          });
        }
      }

      // Handle UAP-based GRAVE screener updates BEFORE reviving
      // Note: We update screeners first, then revive, so the asset won't be sent back to GRAVE
      if (hasUAPSubscription && (setupType === 'uap' || setupType === 'both')) {
        setInProcessingText('Updating screeners');
        await updateScreenersOnRevive(provider, upAddress, tokenAddress, {
          forwarderAssistantAddress: networkConfig.forwarderAssistantAddress,
          addressListScreenerAddress: networkConfig.addressListScreenerAddress,
          curatedListScreenerAddress: networkConfig.curatedListScreenerAddress,
        });
      }

      setInProcessingText('Reviving Item');

      const tokenContract = new Contract(
        tokenAddress,
        lsp8IdentifiableDigitalAssetAbi,
        signer
      );
      const lsp8 = tokenContract.connect(signer);
      const lsp8Tx = lsp8.interface.encodeFunctionData('transfer', [
        vaultAddress,
        await signer.getAddress(),
        tokenData.tokenId,
        false,
        '0x',
      ]);
      const vaultContract = new Contract(vaultAddress, lsp9VaultAbi, signer);
      await vaultContract.execute(0, tokenAddress, 0, lsp8Tx, {
        gasLimit: 400_00,
      });

      // For legacy GRAVE, remove from allowlist after reviving
      // This ensures the token will be sent to GRAVE if received again
      // For UAP/both modes: whitelist is permanent, no cleanup needed
      if (setupType === 'legacy') {
        setInProcessingText('Blocking Collection');
        const LSP1GraveForwarderContract = LSP1GraveForwarder__factory.connect(
          networkConfig.universalGraveForwarder,
          signer
        );
        await LSP1GraveForwarderContract.removeTokenFromAllowlist(
          tokenAddress,
          {
            gasLimit: 400_00,
          }
        );
      }

      onReviveSuccess(tokenAddress, tokenId);
      toast({
        title: `It's alive! 🧟‍♂️`,
        status: 'success',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: `Error: ${error.message}`,
        status: 'error',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setInProcessingText(undefined);
    }
  };

  return (
    <Flex
      bg={panelBgColor}
      borderRadius="lg"
      px={4}
      py={4}
      align="flex-start"
      justify="space-between"
      boxShadow="md"
      minWidth={'lg'}
      mb={2}
    >
      <AssetIcon
        name={tokenData?.name || 'Unknown Asset'}
        lspType="LSP8"
        LSP4Metadata={tokenData?.metadata?.LSP4Metadata}
      />
      <Flex w={'100%'} flexDirection={'column'} padding={2} gap={2}>
        {tokenData?.image && (
          <Flex justifyContent={'center'}>
            <Image
              src={tokenData.image}
              alt={tokenData?.name || 'NFT'}
              border={'1px solid ' + containerBorderColor}
              minW={'250px'}
              maxW={'300px'}
            />
          </Flex>
        )}
        <Flex flexDirection={'row'} justifyContent={'space-between'}>
          <Text color={fontColor} fontFamily={'Bungee'}>
            {tokenData?.name || 'Unnamed NFT'}
          </Text>
        </Flex>
        <Flex
          flexDirection={'row'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Flex align="center">
            <Text fontSize="sm" pr={2} color={fontColor}>
              Address:
            </Text>
            <Text fontSize="sm" fontFamily="mono" color={fontColor}>
              {tokenAddressDisplay}
            </Text>
            {networkConfig && (
              <IconButton
                aria-label="View collection on explorer"
                icon={<FaExternalLinkAlt />}
                color={fontColor}
                size="sm"
                variant="ghost"
                onClick={() =>
                  window.open(
                    `${networkConfig.explorer}/address/${tokenData.address}`,
                    '_blank'
                  )
                }
              />
            )}
          </Flex>
        </Flex>
        <Flex
          flexDirection={'row'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Flex align="center">
            <Text fontSize="sm" pr={2} color={fontColor}>
              Token ID:
            </Text>
            <Text fontSize="sm" fontFamily="mono" color={fontColor}>
              {tokenIdDisplay}
            </Text>
            {networkConfig && tokenData.tokenId && (
              <IconButton
                aria-label="View on marketplace"
                icon={<FaExternalLinkAlt />}
                color={fontColor}
                size="sm"
                variant="ghost"
                onClick={() =>
                  window.open(
                    `${networkConfig.marketplaceCollectionsURL}/${tokenData.address}/${tokenData.tokenId}`,
                    '_blank'
                  )
                }
              />
            )}
          </Flex>
        </Flex>
        {vaultOwner === connectedUPAddress && (
          <Flex justifyContent={'flex-start'} mt={2}>
            <Button
              px={3}
              color={createButtonColor}
              bg={createButtonBg}
              _hover={{ bg: createButtonBg }}
              border={createButtonBorder}
              size={'sm'}
              loadingText={inProcessingText}
              isLoading={inProcessingText !== undefined || isRevivingAll}
              onClick={handleReviveClick}
            >
              Revive
            </Button>
          </Flex>
        )}
      </Flex>

      {/* Upgrade/Config Required Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent
          bg="dark.purple.200"
          borderColor="dark.teal.500"
          border="2px solid"
        >
          <ModalHeader color="dark.purple.500" fontFamily="Bungee">
            {setupType === 'legacy'
              ? 'Upgrade Required'
              : 'Configuration Required'}
          </ModalHeader>
          <ModalCloseButton color="dark.purple.500" />
          <ModalBody>
            <Text color="dark.purple.500">
              {setupType === 'legacy'
                ? 'You need to upgrade to the new Universal Assistant Protocol before you can revive assets. Upgrade now to access all features!'
                : 'You need to complete your spambox configuration before you can revive assets. Configure now to activate spam protection!'}
            </Text>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button
              colorScheme="purple"
              onClick={handleUpgradeClick}
              fontFamily="Bungee"
            >
              {setupType === 'legacy' ? 'UPGRADE NOW' : 'CONFIGURE NOW'}
            </Button>
            <Button
              variant="outline"
              borderColor="dark.purple.500"
              color="dark.purple.500"
              onClick={onClose}
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default LSP8SimplePanel;
