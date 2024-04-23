import { useContext, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Flex,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { formatAddress, getTokenIconURL, TokenData } from '@/utils/tokenUtils';
import { WalletContext } from '@/components/wallet/WalletContext';
import { ethers } from 'ethers';
import LSP1GraveForwarder from '@/abis/LSP1GraveForwarder.json';
import LSP8IdentifiableDigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP8IdentifiableDigitalAsset.json';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';
import LSP8Panel from '@/components/LSP8Panel';

interface LSP8PanelProps {
  readonly tokenData: TokenData[];
  readonly vaultAddress: string;
  readonly vaultOwner: string;
  onReviveSuccess: (assetAddress: string, tokenId: string) => void;
}

const LSP8Group: React.FC<LSP8PanelProps> = ({
  tokenData,
  vaultAddress,
  vaultOwner,
  onReviveSuccess,
}) => {
  const walletContext = useContext(WalletContext);
  const {
    account: connectedUPAddress,
    networkConfig,
    provider,
    disconnectIfNetworkChanged,
  } = walletContext;
  const [isProcessing, setIsProcessing] = useState(false);
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
  const interestsBgColor = useColorModeValue('light.white', 'dark.white');

  const fontColor = useColorModeValue('light.black', 'dark.purple.500');

  const tokenAddressDisplay = formatAddress(tokenData[0].address);
  const toast = useToast();

  const transferTokenToUP = async (tokenAddress: string) => {
    if (isProcessing || (await disconnectIfNetworkChanged())) {
      return;
    }

    setIsProcessing(true);
    try {
      const signer = provider.getSigner();

      const LSP1GraveForwarderContract = new ethers.Contract(
        networkConfig.universalGraveForwarder,
        LSP1GraveForwarder.abi,
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

      const tokenContract = new ethers.Contract(
        tokenAddress,
        LSP8IdentifiableDigitalAsset.abi,
        signer
      );
      const lsp8 = tokenContract.connect(signer);
      const lsp8Tx = lsp8.interface.encodeFunctionData('transfer', [
        vaultAddress,
        await signer.getAddress(),
        tokenData[0].tokenId,
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

      setIsProcessing(false);
      onReviveSuccess(tokenData[0].tokenId as string);
      toast({
        title: `it's alive! ⚡`,
        status: 'success',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
    } catch (error: any) {
      setIsProcessing(false);
      console.error(error);
      toast({
        title: `Error fetching UP data. ${error.message}`,
        status: 'error',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
    }
  };

  const getTokenIcon = () => {
    const iconURL = getTokenIconURL(tokenData[0].metadata?.LSP4Metadata);
    let tokenIcon = !iconURL ? (
      <Box padding={1} fontWeight={'bold'}>
        LSP8
      </Box>
    ) : (
      <Avatar height={16} minW={16} name={tokenData[0]?.name} src={iconURL} />
    );
    return tokenIcon;
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
      <Flex
        bg={interestsBgColor}
        borderRadius="full"
        color={fontColor}
        border={`1px solid ${containerBorderColor}`}
        fontSize="md"
        height={16}
        minW={16}
        justifyContent={'center'}
        alignItems={'center'}
        boxSizing={'content-box'}
      >
        {getTokenIcon()}
      </Flex>

      <Flex w={'100%'} flexDirection={'column'} padding={2} gap={2}>
        <Flex flexDirection={'row'} justifyContent={'space-between'}>
          <Text color={fontColor} fontFamily={'Bungee'}>
            {tokenData[0]?.name}
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
              variant="ghost"
              onClick={() =>
                window.open(
                  `${networkConfig.marketplaceCollectionsURL}/${tokenData[0]?.address}`,
                  '_blank'
                )
              }
            />
          </Flex>
          {vaultOwner === connectedUPAddress && tokenData.length === 1 && (
            <Button
              px={3}
              color={createButtonColor}
              bg={createButtonBg}
              _hover={{ bg: createButtonBg }}
              border={createButtonBorder}
              size={'xs'}
              onClick={() => transferTokenToUP(tokenData[0]?.address)}
            >
              {isProcessing ? 'Reviving...' : `Mark safe & revive`}
            </Button>
          )}
          {tokenData.length > 1 && (
            <>
              <Button onClick={onOpen}>View all</Button>

              <Modal isOpen={isOpen} onClose={onClose} size={'4xl'}>
                <ModalOverlay
                  bg="none"
                  backdropFilter="auto"
                  backdropBlur="2px"
                />
                <ModalContent background={panelBgColor}>
                  <ModalHeader>
                    <Flex>
                      {getTokenIcon()}
                      <Box ml="3">
                        <Text fontWeight="bold" color={fontColor}>
                          {tokenData[0]?.name}
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
                            variant="ghost"
                            onClick={() =>
                              window.open(
                                `${networkConfig.marketplaceCollectionsURL}/${tokenData[0]?.address}`,
                                '_blank'
                              )
                            }
                          />
                        </Flex>
                      </Box>
                    </Flex>
                  </ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <SimpleGrid columns={{ sm: 2, md: 3 }}>
                      {tokenData.map(token => (
                        <LSP8Panel
                          tokenData={token}
                          vaultAddress={vaultAddress}
                          vaultOwner={vaultOwner}
                          onReviveSuccess={onReviveSuccess}
                        />
                      ))}
                    </SimpleGrid>
                  </ModalBody>
                  <ModalFooter>
                    <Button mr={3} onClick={onClose}>
                      Close
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default LSP8Group;
