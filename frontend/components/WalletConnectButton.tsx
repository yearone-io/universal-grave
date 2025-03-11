'use client';
import React, { useEffect, useRef, useState } from 'react';
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
import { usePathname } from 'next/navigation';
import { formatAddress, getNetwork } from '@/utils/utils';
import { useProfile } from '@/contexts/ProfileProvider';
import { getImageFromIPFS } from '@/utils/ipfs'; // Assuming this utility exists
import { supportedNetworks } from '@/constants/supportedNetworks';
import { FaCog } from 'react-icons/fa';
import { TbGrave2 } from 'react-icons/tb';

export default function WalletConnectButton() {
  const {
    profileDetailsData,
    isConnected,
    chainId,
    connectAndSign,
    disconnect,
    switchNetwork,
  } = useProfile();
  const toast = useToast({ position: 'bottom-left' });
  const connectTriggeredRef = useRef(false);
  const pathname = usePathname();
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [isNoWalletModalOpen, setIsNoWalletModalOpen] = useState(false);
  const [mainImage, setMainImage] = useState<string | undefined>(undefined); // State for the main image

  const address = profileDetailsData?.upWallet;
  const profile = profileDetailsData?.profile;
  const isSigned = isConnected && !!profileDetailsData && !!profile;

  const buttonText =
    isSigned && profile
      ? profile.name || formatAddress(address ?? '')
      : 'Sign In';

  // Safely handle profile image (fetch only if needed)
  useEffect(() => {
    if (
      !isSigned ||
      !profile ||
      !profile.profileImage ||
      profile.profileImage.length === 0 ||
      !chainId
    ) {
      setMainImage(undefined); // Reset if no profile image
      return;
    }

    const firstImage = profile.profileImage[0];
    if (!firstImage || !firstImage.url) {
      console.log('WalletConnectButton: No valid profile image URL found', {
        profileImage: profile.profileImage,
      });
      setMainImage(undefined);
      return;
    }

    const profileMainImage = firstImage.url;
    getImageFromIPFS(profileMainImage, Number(chainId))
      .then(image => {
        setMainImage(image);
      })
      .catch(err => {
        console.error(
          'WalletConnectButton: Failed to fetch mainImage from IPFS:',
          err
        );
        setMainImage(undefined);
      });
  }, [isSigned, profile, chainId]); // Depend on profile and chainId to trigger re-fetch

  const profileImage = mainImage ? (
    <Avatar
      size="sm"
      border="1px solid #053241"
      name={profile?.name || ''}
      src={mainImage}
    />
  ) : null;

  const currentNetwork = chainId ? getNetwork(chainId) : undefined;
  const networkIcon = currentNetwork?.icon;
  const networkName = currentNetwork?.name;

  const appChainId = pathname.includes(supportedNetworks['4201'].urlName)
    ? 4201
    : supportedNetworks['42'].urlName || pathname === '/'
      ? 42
      : 4201;

  useEffect(() => {
    if (!isConnected || !chainId || !profileDetailsData) {
      connectTriggeredRef.current = false;
      setIsNetworkModalOpen(false);
      return;
    }
    console.log('WalletConnectButton: Checking network mismatch', {
      chainId,
      appChainId,
    });

    if (chainId !== appChainId) {
      setIsNetworkModalOpen(true);
    } else {
      setIsNetworkModalOpen(false);
    }

    if (isSigned || connectTriggeredRef.current || !address) {
      return;
    }

    connectTriggeredRef.current = true;
  }, [isConnected, chainId, address, isSigned, profileDetailsData, appChainId]);

  const handleNetworkSwitch = async () => {
    try {
      const targetChainId = chainId === 42 ? 4201 : 42; // Toggle between Mainnet and Testnet
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
      await switchNetwork(appChainId);
      setIsNetworkModalOpen(false);
      toast({
        title: 'Network Changed',
        description: `Switched to ${supportedNetworks[appChainId].displayName}`,
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
    try {
      if (!window.lukso) {
        setIsNoWalletModalOpen(true);
        return;
      }
      if (chainId !== appChainId) {
        switchNetwork(appChainId);
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

  if (isSigned) {
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
              {profileImage}
              {buttonText}
            </Flex>
          </MenuButton>
          <MenuList bg='dark.purple.500'>
            <MenuItem bg='dark.purple.500' as={Link} href={`/${networkName}/grave/${address}`} icon={<TbGrave2 />}>
              My Graveyard
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
                {networkIcon && (
                  <Image height="20px" src={networkIcon} alt={networkName} />
                )}
              </Flex>
              <MenuItem bg='dark.purple.500' as={Link} href={`/${networkName}/grave/settings`} icon={<FaCog />}>
                Settings
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
                {supportedNetworks[Number(chainId)]?.displayName} (Chain ID:{' '}
                {chainId}), but the app is on{' '}
                {supportedNetworks[Number(appChainId)]?.displayName} (Chain ID:{' '}
                {appChainId}). Please switch your wallet network to continue.
              </Text>
              <Button colorScheme="blue" onClick={handleSwitchToAppNetwork}>
                Switch to {supportedNetworks[Number(appChainId)]?.displayName}
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
        {buttonText}
        </Flex>
      </Button>
      {noLuksoWalletModal}
      </>
    
  );
}
