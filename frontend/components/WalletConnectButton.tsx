'use client';
import React, { use, useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Flex,
  Image,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
} from '@chakra-ui/react';
import Link from 'next/link';
import { formatAddress } from '@/utils/utils';
import { useConnectedAccount } from '@/contexts/ConnectedAccountProvider';
import { getImageFromIPFS } from '@/utils/ipfs'; // Assuming this utility exists
import { supportedNetworks } from '@/constants/supportedNetworks';
import { FaCog } from 'react-icons/fa';
import { TbGrave2 } from 'react-icons/tb';

export default function WalletConnectButton() {
  const {
    universalProfile,
    isConnected,
    connectAndSign,
    disconnect,
    switchNetwork,
    appNetworkConfig,
  } = useConnectedAccount();
  console.log('WalletConnectButton: isConnected', isConnected, universalProfile, universalProfile?.chainId);
  const toast = useToast({ position: 'bottom-left' });
  const connectTriggeredRef = useRef(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [isNoWalletModalOpen, setIsNoWalletModalOpen] = useState(false);
  const [mainImage, setMainImage] = useState<string | undefined>(undefined);

  // Safely handle profile image (fetch only if needed)
  useEffect(() => {
    console.log('WalletConnectButton: Fetching mainImage from IPFS', universalProfile);
    const firstImage = universalProfile?.profile?.profileImage?.[0];
    if (
      !isConnected || !universalProfile || !firstImage || !firstImage.url
    ) {
      setMainImage(undefined);
      return;
    }

    const profileMainImage = firstImage.url;
    console.log('WalletConnectButton: Fetching mainImage from IPFS:', profileMainImage);
    getImageFromIPFS(profileMainImage, Number(universalProfile?.chainId))
      .then(image => {
        console.log('SETTING MAIN IMAGE:', image);
        setMainImage(image);
      })
      .catch(err => {
        console.error(
          'WalletConnectButton: Failed to fetch mainImage from IPFS:',
          err
        );
        setMainImage(undefined);
      });
  }, [universalProfile, isConnected]); // Depend on profile and chainId to trigger re-fetch

  useEffect(() => {
    if (!isConnected || !universalProfile?.chainId || !universalProfile) {
      connectTriggeredRef.current = false;
      setIsNetworkModalOpen(false);
      return;
    }
    console.log('WalletConnectButton: Checking network mismatch', {
      chainId: universalProfile?.chainId,
      appChainId: appNetworkConfig.chainId,
    });

    if (universalProfile?.chainId !== appNetworkConfig.chainId) {
      setIsNetworkModalOpen(true);
    } else {
      setIsNetworkModalOpen(false);
    }

    if (isConnected || connectTriggeredRef.current || !universalProfile?.address) {
      return;
    }

    connectTriggeredRef.current = true;
  }, [isConnected, universalProfile, appNetworkConfig]);

  const handleNetworkSwitch = async () => {
    try {
      const targetChainId = universalProfile?.chainId === 42 ? 4201 : 42; // Toggle between Mainnet and Testnet
      await switchNetwork(targetChainId);
      toast({
        title: 'Network Changed',
        description: `Switched to ${supportedNetworks[targetChainId].displayName}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Network Switch Failed',
        description: error.message,
        status: 'error',
        duration: null,
        isClosable: true,
      });
    }
  };

  const handleSwitchToAppNetwork = async () => {
    try {
      await switchNetwork(appNetworkConfig.chainId);
      setIsNetworkModalOpen(false);
      toast({
        title: 'Network Changed',
        description: `Switched to ${appNetworkConfig.displayName}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Network Switch Failed',
        description: error.message,
        status: 'error',
        duration: null,
        isClosable: true,
      });
    }
  };

  const handleConnect = async () => {
    console.log('WalletConnectButton: handleConnect');
    try {
      if (!window.lukso) {
        setIsNoWalletModalOpen(true);
        return;
      }
      if (universalProfile?.chainId !== appNetworkConfig.chainId) {
        switchNetwork(appNetworkConfig.chainId);
        return;
      }
      const isComplete: boolean = await connectAndSign();
      if (isComplete) {
        toast({
          title: 'Success',
          description: 'Successfully signed in',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description:
            'Failed to sign in; Check signature requests in UP! Extension.',
          status: 'warning',
          duration: null,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to sign in: ${error.message}`,
        status: 'error',
        duration: null,
        isClosable: true,
      });
    }
  };

  const noLuksoWalletModal = (
    <Modal
      isOpen={isNoWalletModalOpen}
      onClose={() => setIsNoWalletModalOpen(false)}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>No Lukso Wallet Detected</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb={4}>
            You need to install and create a LUKSO Universal Profile on your
            browser to use this application. Please visit:{' '}
            <Link href="https://my.universalprofile.cloud/" target="_blank">
              https://my.universalprofile.cloud/
            </Link>{' '}
            for more details.
          </Text>
          <Button
            colorScheme="blue"
            onClick={() => setIsNoWalletModalOpen(false)}
          >
            Close
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );

  if (isConnected) {
    const profileAddress = universalProfile?.address;
    return (
      <>
        <Menu>
          <MenuButton
            as={Button}
            border={'1px solid var(--chakra-colors-dark-purple-500)'}
            fontWeight={600}
            borderRadius={"100px"}
            color={'dark.purple.500'}
            size="md"
          >
            <Flex gap={2} alignItems="center" justifyContent="center">
              <Avatar
                size="sm"
                border="1px solid #053241"
                name={universalProfile?.profile?.name || ''}
                src={mainImage}
              />
              {universalProfile?.profile?.name || formatAddress(profileAddress ?? '')}
            </Flex>
          </MenuButton>
          <MenuList bg='dark.purple.500'>
            <MenuItem bg='dark.purple.500' as={Link} href={`/${appNetworkConfig.chainSlug}/grave/${profileAddress}`} icon={<TbGrave2 />}>
              My Spam Grave
            </MenuItem>
            <MenuDivider />
            <MenuGroup bg='dark.purple.500'>
              <Flex
                mx={4}
                my={2}
                fontWeight={600}
                flexDirection="row"
                gap={2}
                alignItems="center"
              >
                <Box>Network:</Box>
                <Image height="20px" src={appNetworkConfig.icon} alt={appNetworkConfig.chainSlug} />
              </Flex>
              <MenuItem bg='dark.purple.500' as={Link} href={`/${appNetworkConfig.chainSlug}/grave/configuration`} icon={<FaCog />}>
                Configuration
              </MenuItem>
              <MenuItem bg='dark.purple.500' onClick={handleNetworkSwitch}>Change network</MenuItem>
              <MenuItem bg='dark.purple.500' onClick={disconnect}>Sign out</MenuItem>
            </MenuGroup>
          </MenuList>
        </Menu>
        <Modal
          isOpen={isNetworkModalOpen}
          onClose={() => setIsNetworkModalOpen(false)}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Network Mismatch</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text mb={4}>
                Your wallet is connected to{' '}
                {universalProfile?.profileNetworkConfig?.displayName} (Chain ID:{' '}
                {universalProfile?.chainId}), but the app is on{' '}
                {appNetworkConfig.displayName} (Chain ID:{' '}
                {appNetworkConfig.chainId}). Please switch your wallet network to continue.
              </Text>
              <Button colorScheme="blue" onClick={handleSwitchToAppNetwork}>
                Switch to {appNetworkConfig.displayName}
              </Button>
            </ModalBody>
          </ModalContent>
        </Modal>
        {noLuksoWalletModal}
      </>
    );
  }

  return (
    <>
      <Button
        ml="10px"
        fontSize="14px"
        lineHeight="14px"
        fontFamily="Bungee"
        fontWeight="400"
        borderRadius={"100px"}
        color={'dark.purple.500'}
        onClick={handleConnect}
      >
        <Flex alignItems="center" justifyContent="space-between" gap={2}>
        <Image src="/images/LYX-logo.svg" alt="Sign In" />
        Sign In
        </Flex>
      </Button>
        {noLuksoWalletModal}
      </>
    
  );
}
