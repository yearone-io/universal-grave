import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  IconButton,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { formatAddress, TokenData } from '@/utils/tokenUtils';
import { Contract } from 'ethers';
import {
  lsp8IdentifiableDigitalAssetAbi,
  lsp9VaultAbi,
} from '@lukso/lsp-smart-contracts/abi';
import LSP8SimplePanel from '@/components/LSP8SimplePanel';
import { LSP1GraveForwarder__factory } from '@/contracts';
import { AssetIcon } from './AssetIcon';
import AssetCreatorBadges from './AssetCreatorBadges';
import ReviveOptionsModal from '@/components/ReviveOptionsModal';
import { useProfile } from '@/contexts/ProfileProvider';
import {
  networkNameToIdMapping,
  supportedNetworks,
} from '@/constants/supportedNetworks';
import { useGrave } from '@/contexts/GraveContext';
import { updateScreenersOnRevive } from '@/utils/screenerUpdates';
import { useRouter, useParams } from 'next/navigation';
import { getUniversalEverythingUrl } from '@/utils/universalEverything';
import {
  assertWalletNetwork,
  getWalletProvider,
  getWalletSigner,
  hasWalletProvider,
} from '@/utils/walletClient';

interface LSP8SimplePanelProps {
  readonly tokenData: TokenData[];
  readonly vaultAddress: string;
  readonly vaultOwner: string;
  onReviveSuccess: (assetAddress: string, tokenId: string) => void;
  onReviveAllSuccess: (assetAddress: string) => void;
}

type ReviveMode = 'asset' | 'creator';

const LSP8Group: React.FC<LSP8SimplePanelProps> = ({
  tokenData,
  vaultAddress,
  vaultOwner,
  onReviveSuccess,
  onReviveAllSuccess,
}) => {
  const { profileDetailsData, chainId } = useProfile();
  const { hasUAPSubscription, setupType } = useGrave();
  const connectedUPAddress = profileDetailsData?.upWallet || null;
  const networkConfig = chainId ? supportedNetworks[chainId.toString()] : null;
  const router = useRouter();
  const params = useParams();
  const networkName = params.networkName as string;
  const routeChainId = networkNameToIdMapping[networkName];
  const resolvedChainId = chainId ?? routeChainId;

  const [inProcessingText, setInProcessingText] = useState<string>();
  const [isRevivingAll, setIsRevivingAll] = useState<boolean>(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isUpgradeModalOpen,
    onOpen: onUpgradeModalOpen,
    onClose: onUpgradeModalClose,
  } = useDisclosure();
  const {
    isOpen: isReviveOptionsOpen,
    onOpen: onReviveOptionsOpen,
    onClose: onReviveOptionsClose,
  } = useDisclosure();
  const [selectedReviveMode, setSelectedReviveMode] =
    useState<ReviveMode>('asset');
  const [pendingReviveAction, setPendingReviveAction] = useState<
    'single' | 'all'
  >('single');
  const containerBorderColor = 'var(--chakra-colors-dark-purple-500)';
  const panelBgColor = 'rgba(18, 10, 44, 0.98)';
  const createButtonBg = 'whiteAlpha.900';
  const createButtonColor = 'gray.900';
  const createButtonBorder = '1px solid';
  const fontColor = 'whiteAlpha.900';
  const closeButtonColor = 'dark.purple.500';

  const collectionTokenData = tokenData[0];
  const tokenAddressDisplay = formatAddress(collectionTokenData.address);
  const toast = useToast();
  const verifiedCreatorAddresses = useMemo(
    () =>
      (collectionTokenData?.creators || [])
        .filter(creator => creator.verified)
        .map(creator => creator.address),
    [collectionTokenData?.creators]
  );

  const transferTokenToUP = async (
    tokenAddress: string,
    tokenId: string,
    reviveMode: ReviveMode
  ) => {
    if (!hasWalletProvider() || !networkConfig) {
      return;
    }

    setInProcessingText('Unblocking collection');
    try {
      const provider = getWalletProvider();
      await assertWalletNetwork(networkConfig.chainId);
      const signer = await getWalletSigner();
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

      // Handle UAP-based GRAVE screener updates
      if (hasUAPSubscription && (setupType === 'uap' || setupType === 'both')) {
        setInProcessingText('Updating screeners');
        await updateScreenersOnRevive(provider, upAddress, tokenAddress, {
          forwarderAssistantAddress: networkConfig.forwarderAssistantAddress,
          addressListScreenerAddress: networkConfig.addressListScreenerAddress,
          creatorListScreenerAddress: networkConfig.creatorListScreenerAddress,
          curatedListScreenerAddress: networkConfig.curatedListScreenerAddress,
        }, {
          mode: reviveMode,
          creatorAddresses:
            reviveMode === 'creator' ? verifiedCreatorAddresses : [],
        });
      }

      setInProcessingText('Reviving item');

      const tokenContract = new Contract(
        tokenAddress,
        lsp8IdentifiableDigitalAssetAbi,
        signer
      );
      const lsp8 = tokenContract.connect(signer);
      const lsp8Tx = lsp8.interface.encodeFunctionData('transfer', [
        vaultAddress,
        await signer.getAddress(),
        collectionTokenData.tokenId,
        false,
        '0x',
      ]);

      const vaultContract = new Contract(vaultAddress, lsp9VaultAbi, signer);
      await vaultContract.execute(0, tokenAddress, 0, lsp8Tx, {
        gasLimit: 400_00,
      });

      onReviveSuccess(tokenAddress, tokenId);
      toast({
        title:
          reviveMode === 'creator'
            ? `It's alive! 🧟‍♂️ Creator trusted`
            : `It's alive! 🧟‍♂️ Asset trusted`,
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

  const handleReviveClick = () => {
    // Check if user needs to upgrade or configure first
    if (setupType === 'legacy' || setupType === 'none') {
      onUpgradeModalOpen(); // Show upgrade/config prompt modal
      return;
    }

    if (verifiedCreatorAddresses.length > 0) {
      setSelectedReviveMode('asset');
      setPendingReviveAction('single');
      onReviveOptionsOpen();
      return;
    }
    // Otherwise proceed with single revive
    transferTokenToUP(tokenData[0].address, tokenData[0].tokenId!, 'asset');
  };

  const handleReviveAllClick = () => {
    // Check if user needs to upgrade or configure first
    if (setupType === 'legacy' || setupType === 'none') {
      onUpgradeModalOpen(); // Show upgrade/config prompt modal
      return;
    }

    if (verifiedCreatorAddresses.length > 0) {
      setSelectedReviveMode('asset');
      setPendingReviveAction('all');
      onReviveOptionsOpen();
      return;
    }
    // Otherwise proceed with revive all
    reviveAll(tokenData, 'asset');
  };

  const handleConfirmReviveOption = () => {
    onReviveOptionsClose();
    if (pendingReviveAction === 'single') {
      transferTokenToUP(
        tokenData[0].address,
        tokenData[0].tokenId!,
        selectedReviveMode
      );
      return;
    }
    reviveAll(tokenData, selectedReviveMode);
  };

  const handleUpgradeClick = () => {
    router.push(`/${networkName}/grave/settings`);
  };

  const reviveAll = async (
    tokenData: TokenData[],
    reviveMode: ReviveMode
  ) => {
    if (!hasWalletProvider() || !networkConfig) {
      return;
    }

    const tokenAddress = collectionTokenData.address;
    setInProcessingText('Unblocking');
    setIsRevivingAll(true);
    try {
      const provider = getWalletProvider();
      await assertWalletNetwork(networkConfig.chainId);
      const signer = await getWalletSigner();
      const signerAddress = await signer.getAddress();

      // Handle legacy GRAVE allowlist system (only for pure legacy mode)
      if (setupType === 'legacy') {
        const LSP1GraveForwarderContract = LSP1GraveForwarder__factory.connect(
          networkConfig.universalGraveForwarder,
          signer
        );

        if (
          !(await LSP1GraveForwarderContract.tokenAllowlist(
            signerAddress,
            tokenAddress
          ))
        ) {
          await LSP1GraveForwarderContract.addTokenToAllowlist(tokenAddress, {
            gasLimit: 400_00,
          });
        }
      }

      // Handle UAP-based GRAVE screener updates
      if (hasUAPSubscription && (setupType === 'uap' || setupType === 'both')) {
        setInProcessingText('Updating screeners');
        await updateScreenersOnRevive(provider, signerAddress, tokenAddress, {
          forwarderAssistantAddress: networkConfig.forwarderAssistantAddress,
          addressListScreenerAddress: networkConfig.addressListScreenerAddress,
          creatorListScreenerAddress: networkConfig.creatorListScreenerAddress,
          curatedListScreenerAddress: networkConfig.curatedListScreenerAddress,
        }, {
          mode: reviveMode,
          creatorAddresses:
            reviveMode === 'creator' ? verifiedCreatorAddresses : [],
        });
      }

      setInProcessingText('Reviving');

      const tokenContract = new Contract(
        tokenAddress,
        lsp8IdentifiableDigitalAssetAbi,
        signer
      );
      const lsp8 = tokenContract.connect(signer);

      const vaultAddresses: string[] = [];
      const signerAddresses: string[] = [];
      const tokenIds: string[] = [];
      const forceValues: boolean[] = [];
      const dataValues: string[] = [];

      tokenData.forEach(token => {
        vaultAddresses.push(vaultAddress);
        signerAddresses.push(signerAddress);
        tokenIds.push(token.tokenId!);
        forceValues.push(false);
        dataValues.push('0x');
      });

      const lsp8Tx = lsp8.interface.encodeFunctionData('transferBatch', [
        vaultAddresses,
        signerAddresses,
        tokenIds,
        forceValues,
        dataValues,
      ]);

      const vaultContract = new Contract(vaultAddress, lsp9VaultAbi, signer);
      await vaultContract.execute(0, tokenAddress, 0, lsp8Tx, {
        gasLimit: 400_00,
      });

      toast({
        title:
          reviveMode === 'creator'
            ? `They're alive! 🧟‍♂️ Creators trusted`
            : `They're alive! 🧟‍♂️ Assets trusted`,
        status: 'success',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
      onReviveAllSuccess(collectionTokenData.address!);
    } catch (error: any) {
      console.error(error);
      toast({
        title: `Error reviving collection: ${error.message}`,
        status: 'error',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setInProcessingText(undefined);
      setIsRevivingAll(false);
    }
  };

  return (
    <Flex
      bg="rgba(255, 255, 255, 0.1)"
      border="1px solid"
      borderColor="whiteAlpha.400"
      borderRadius="lg"
      px={4}
      py={4}
      align="flex-start"
      justify="space-between"
      boxShadow="0 12px 30px rgba(0, 0, 0, 0.5)"
      w="100%"
      mb={2}
    >
      <AssetIcon
        name={collectionTokenData?.name}
        lspType="LSP8"
        LSP4Metadata={collectionTokenData?.metadata?.LSP4Metadata}
      />
      <Flex w={'100%'} flexDirection={'column'} padding={2} gap={2}>
        {tokenData.length === 1 && collectionTokenData?.image && (
          <Flex justifyContent={'center'}>
            <Image
              src={collectionTokenData?.image}
              alt={collectionTokenData?.name}
              border={'1px solid ' + containerBorderColor}
              maxW={{ base: '100%', md: '300px' }}
            />
          </Flex>
        )}
        <Flex flexDirection={'row'} justifyContent={'space-between'}>
          <Text color={fontColor} fontFamily={'Bungee'}>
            {collectionTokenData?.name}
          </Text>
        </Flex>
        <AssetCreatorBadges
          creators={collectionTokenData?.creators}
          fontColor={fontColor}
          chainId={resolvedChainId}
        />
        {tokenData.length > 1 && (
          <Text fontSize="sm" color={fontColor}>
            {tokenData.length} items detected
          </Text>
        )}
        <Flex
          flexDirection={'row'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Flex align="center">
            <Text fontSize="sm" pr={2} color={fontColor}>
              Address:
            </Text>
            <Text fontSize="sm" fontWeight="bold" pr={1} color={fontColor}>
              {tokenAddressDisplay}
            </Text>
            {resolvedChainId && (
              <IconButton
                aria-label="View on universal.everything"
                icon={<ExternalLinkIcon color={fontColor} />}
                color={fontColor}
                size="sm"
                height={'14px'}
                variant="ghost"
                onClick={() =>
                  window.open(
                    getUniversalEverythingUrl(
                      resolvedChainId,
                      'asset',
                      collectionTokenData?.address
                    ),
                    '_blank'
                  )
                }
              />
            )}
          </Flex>
          {tokenData.length > 1 && (
            <Button
              px={3}
              color={createButtonColor}
              bg={createButtonBg}
              _hover={{ bg: 'white' }}
              borderColor="whiteAlpha.400"
              border={createButtonBorder}
              size={'xs'}
              onClick={onOpen}
              fontWeight="600"
            >
              View all
            </Button>
          )}
          {vaultOwner === connectedUPAddress && tokenData.length === 1 && (
            <Button
              px={3}
              color={createButtonColor}
              bg={createButtonBg}
              _hover={{ bg: 'white' }}
              borderColor="whiteAlpha.400"
              border={createButtonBorder}
              size={'xs'}
              onClick={handleReviveClick}
              loadingText={inProcessingText}
              isLoading={inProcessingText !== undefined}
              fontWeight="600"
            >
              Unblock & revive
            </Button>
          )}
        </Flex>
        {tokenData.length > 1 && (
          <Flex
            w={'100%'}
            alignItems={'center'}
            justifyContent={'flex-end'}
            gap={2}
          >
            <Modal isOpen={isOpen} onClose={onClose}>
              <ModalOverlay
                background={'var(--chakra-colors-blackAlpha-600)'}
                backdropFilter="auto"
                backdropBlur="2px"
              />
              <ModalContent
                background={panelBgColor}
                maxW={'var(--chakra-sizes-5xl)'}
              >
                <ModalHeader>
                  <Flex gap={3}>
                    <AssetIcon
                      name={collectionTokenData?.name}
                      lspType="LSP8"
                      LSP4Metadata={collectionTokenData?.metadata?.LSP4Metadata}
                    />
                    <Box>
                      <Text fontWeight="bold" color={fontColor}>
                        {collectionTokenData?.name}
                      </Text>
                      <Text fontSize="sm" color={fontColor}>
                        {tokenData.length} items detected
                      </Text>
                      <Flex align="center">
                        <Text fontSize="sm" pr={2} color={fontColor}>
                          Address:
                        </Text>
                        <Text
                          fontSize="sm"
                          fontWeight="bold"
                          pr={1}
                          color={fontColor}
                        >
                          {tokenAddressDisplay}
                        </Text>
                        {resolvedChainId && (
                          <IconButton
                            aria-label="View on universal.everything"
                            icon={<ExternalLinkIcon color={fontColor} />}
                            color={fontColor}
                            size="sm"
                            maxHeight={'14px'}
                            variant="ghost"
                            onClick={() =>
                              window.open(
                                getUniversalEverythingUrl(
                                  resolvedChainId,
                                  'asset',
                                  collectionTokenData?.address
                                ),
                                '_blank'
                              )
                            }
                          />
                        )}
                        <Button
                          ml={2}
                          size={'xs'}
                          onClick={handleReviveAllClick}
                          loadingText={inProcessingText}
                          isLoading={inProcessingText !== undefined}
                        >
                          Unblock & revive all
                        </Button>
                      </Flex>
                    </Box>
                  </Flex>
                </ModalHeader>
                <ModalCloseButton color={closeButtonColor} />
                <ModalBody>
                  <Flex
                    w={'100%'}
                    alignItems={'center'}
                    justifyContent={'center'}
                    flexWrap={'wrap'}
                    gap={8}
                  >
                    {tokenData.map(token => (
                      <LSP8SimplePanel
                        key={token.tokenId}
                        tokenData={token}
                        vaultAddress={vaultAddress}
                        vaultOwner={vaultOwner}
                        onReviveSuccess={onReviveSuccess}
                        isRevivingAll={isRevivingAll}
                      />
                    ))}
                  </Flex>
                </ModalBody>
                <ModalFooter>
                  <Button
                    px={3}
                    color={createButtonColor}
                    bg={createButtonBg}
                    _hover={{ bg: 'white' }}
                    borderColor="whiteAlpha.400"
                    border={createButtonBorder}
                    size={'xs'}
                    onClick={onClose}
                    isLoading={inProcessingText !== undefined}
                    fontWeight="600"
                  >
                    Close
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </Flex>
        )}
      </Flex>

      {/* Upgrade/Config Required Modal */}
      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={onUpgradeModalClose}
        isCentered
      >
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
              onClick={onUpgradeModalClose}
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ReviveOptionsModal
        isOpen={isReviveOptionsOpen}
        onClose={onReviveOptionsClose}
        selectedMode={selectedReviveMode}
        onSelectMode={setSelectedReviveMode}
        onConfirm={handleConfirmReviveOption}
        verifiedCreatorCount={verifiedCreatorAddresses.length}
      />
    </Flex>
  );
};

export default LSP8Group;
