import { useContext, useState } from 'react';
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
  useColorModeValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { formatAddress, TokenData } from '@/utils/tokenUtils';
import { WalletContext } from '@/components/wallet/WalletContext';
import { ethers } from 'ethers';
import LSP8IdentifiableDigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP8IdentifiableDigitalAsset.json';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';
import LSP8SimplePanel from '@/components/LSP8SimplePanel';
import { LSP1GraveForwarder__factory } from '@/contracts';
import { AssetIcon } from './AssetIcon';

interface LSP8SimplePanelProps {
  readonly tokenData: TokenData[];
  readonly vaultAddress: string;
  readonly vaultOwner: string;
  onReviveSuccess: (assetAddress: string, tokenId: string) => void;
  onReviveAllSuccess: (assetAddress: string) => void;
}

const LSP8Group: React.FC<LSP8SimplePanelProps> = ({
  tokenData,
  vaultAddress,
  vaultOwner,
  onReviveSuccess,
  onReviveAllSuccess,
}) => {
  const walletContext = useContext(WalletContext);
  const {
    account: connectedUPAddress,
    networkConfig,
    provider,
    disconnectIfNetworkChanged,
  } = walletContext;
  const [inProcessingText, setInProcessingText] = useState<string>();
  const [isRevivingAll, setIsRevivingAll] = useState<boolean>(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const containerBorderColor = useColorModeValue(
    'var(--chakra-colors-light-black)',
    'var(--chakra-colors-dark-purple-500)'
  );
  const panelBgColor = useColorModeValue('light.white', 'dark.purple.200');

  const createButtonBg = useColorModeValue('light.green.brand', 'dark.white');
  const createButtonColor = useColorModeValue(
    'light.black',
    'var(--chakra-colors-dark-purple-500)'
  );
  const createButtonBorder = useColorModeValue(
    '1px solid black',
    '1px solid var(--chakra-colors-dark-purple-500)'
  );

  const fontColor = useColorModeValue('light.black', 'dark.purple.500');
  const closeButtonColor = useColorModeValue('light.black', 'dark.purple.500');

  const collectionTokenData = tokenData[0];
  const tokenAddressDisplay = formatAddress(collectionTokenData.address);
  const toast = useToast();

  const transferTokenToUP = async (tokenAddress: string, tokenId: string) => {
    if (await disconnectIfNetworkChanged()) {
      return;
    }

    setInProcessingText('Unblocking collection');
    try {
      const signer = provider.getSigner();

      const LSP1GraveForwarderContract = LSP1GraveForwarder__factory.connect(
        networkConfig.universalGraveForwarder,
        signer
      );

      const upAddress = await signer.getAddress();
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
      setInProcessingText('Reviving item');

      const tokenContract = new ethers.Contract(
        tokenAddress,
        LSP8IdentifiableDigitalAsset.abi,
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

      const vaultContract = new ethers.Contract(
        vaultAddress,
        LSP9Vault.abi,
        signer
      );
      const lsp9 = vaultContract.connect(signer);
      await lsp9
        .connect(signer)
        .execute(0, tokenAddress, 0, lsp8Tx, { gasLimit: 400_00 });

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

  const reviveAll = async (tokenData: TokenData[]) => {
    if (await disconnectIfNetworkChanged()) {
      return;
    }

    const tokenAddress = collectionTokenData.address;
    setInProcessingText('Unblocking');
    setIsRevivingAll(true);
    try {
      const signer = provider.getSigner();

      const LSP1GraveForwarderContract = LSP1GraveForwarder__factory.connect(
        networkConfig.universalGraveForwarder,
        signer
      );

      const signerAddress = await signer.getAddress();
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
      setInProcessingText('Reviving');

      const tokenContract = new ethers.Contract(
        tokenAddress,
        LSP8IdentifiableDigitalAsset.abi,
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

      const vaultContract = new ethers.Contract(
        vaultAddress,
        LSP9Vault.abi,
        signer
      );
      const lsp9 = vaultContract.connect(signer);
      await lsp9
        .connect(signer)
        .execute(0, tokenAddress, 0, lsp8Tx, { gasLimit: 400_00 });

      toast({
        title: `They're alive! 🧟‍♂️`,
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
            />
          </Flex>
        )}
        <Flex flexDirection={'row'} justifyContent={'space-between'}>
          <Text color={fontColor} fontFamily={'Bungee'}>
            {collectionTokenData?.name}
          </Text>
        </Flex>
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
            <IconButton
              aria-label="View on universal page"
              icon={<FaExternalLinkAlt color={fontColor} />}
              color={fontColor}
              size="sm"
              height={'14px'}
              variant="ghost"
              onClick={() =>
                window.open(
                  `${networkConfig.marketplaceCollectionsURL}/${collectionTokenData?.address}`,
                  '_blank'
                )
              }
            />
          </Flex>
          {tokenData.length > 1 && (
            <Button
              px={3}
              color={createButtonColor}
              bg={createButtonBg}
              _hover={{ bg: createButtonBg }}
              border={createButtonBorder}
              size={'xs'}
              onClick={onOpen}
            >
              View all
            </Button>
          )}
          {vaultOwner === connectedUPAddress && tokenData.length === 1 && (
            <Button
              px={3}
              color={createButtonColor}
              bg={createButtonBg}
              _hover={{ bg: createButtonBg }}
              border={createButtonBorder}
              size={'xs'}
              onClick={() =>
                transferTokenToUP(tokenData[0].address, tokenData[0].tokenId!)
              }
              loadingText={inProcessingText}
              isLoading={inProcessingText !== undefined}
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
                        <IconButton
                          aria-label="View on universal page"
                          icon={<FaExternalLinkAlt color={fontColor} />}
                          color={fontColor}
                          size="sm"
                          maxHeight={'14px'}
                          variant="ghost"
                          onClick={() =>
                            window.open(
                              `${networkConfig.marketplaceCollectionsURL}/${collectionTokenData?.address}`,
                              '_blank'
                            )
                          }
                        />
                        <Button
                          ml={2}
                          size={'xs'}
                          onClick={() => reviveAll(tokenData)}
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
                    gap={7}
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
                    _hover={{ bg: createButtonBg }}
                    border={createButtonBorder}
                    size={'xs'}
                    onClick={onClose}
                    isLoading={inProcessingText !== undefined}
                  >
                    Close
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

export default LSP8Group;
