import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Text,
  useToast,
} from '@chakra-ui/react';
import React, { useContext, useState } from 'react';
import { WalletContext } from '@/components/wallet/WalletContext';
import { ethers } from 'ethers';
import LSP1GraveForwarderAbi from '@/abis/LSP1GraveForwarder.json';
import { LSP1GraveForwarder } from '@/contracts';
import { getProvider } from '@/utils/provider';
import { BiSolidCheckCircle } from 'react-icons/bi';

export default function ManageAllowList() {
  const walletContext = useContext(WalletContext);
  const { networkConfig } = walletContext;
  const toast = useToast();

  const provider = getProvider();
  const signer = provider.getSigner();
  const graveForwarder = new ethers.Contract(
    networkConfig.universalGraveForwarder,
    LSP1GraveForwarderAbi.abi,
    provider
  ) as LSP1GraveForwarder;

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [isAddingToAllowList, setIsAddingToAllowList] =
    useState<boolean>(false);
  const [isRemovingFromAllowList, setIsRemovingFromAllowList] =
    useState<boolean>(false);
  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [tokenCheckMessage, setTokenCheckMessage] = useState<string>('');

  const handleChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => setTokenAddress(event.target.value);

  const fetchTokenAllowListStatus = async () => {
    setTokenCheckMessage('');
    if (!tokenAddress) {
      return;
    }
    setIsSubmitting(true);
    setIsCheckingStatus(true);
    graveForwarder
      .connect(signer)
      .tokenAllowlist(await signer.getAddress(), tokenAddress)
      .then(value => {
        const message = value
          ? `Allow asset dettected`
          : `Disallowed asset dettected`;
        setTokenCheckMessage(message);
      })
      .catch(reason => {
        toast({
          title: `Error checking status of ${tokenAddress}: ${reason.message}`,
          status: 'error',
          position: 'bottom-left',
          duration: 9000,
          isClosable: true,
        });
      })
      .finally(() => {
        setIsCheckingStatus(false);
        setIsSubmitting(false);
      });
  };

  const addTokenToAllowList = async () => {
    setIsSubmitting(true);
    setIsAddingToAllowList(true);
    return graveForwarder
      .connect(signer)
      .addTokenToAllowlist(tokenAddress)
      .then(() => {
        setTokenCheckMessage('');
        toast({
          title: `${tokenAddress} has been added to allow list`,
          status: 'success',
          position: 'bottom-left',
          duration: 9000,
          isClosable: true,
        });
      })
      .catch(reason => {
        toast({
          title: `Error adding ${tokenAddress} to allow list: ${reason.message}`,
          status: 'error',
          position: 'bottom-left',
          duration: 9000,
          isClosable: true,
        });
      })
      .finally(() => {
        setIsAddingToAllowList(false);
        setIsSubmitting(false);
      });
  };

  const removeTokenFromAllowList = async () => {
    setIsSubmitting(true);
    setIsRemovingFromAllowList(true);
    return graveForwarder
      .connect(signer)
      .removeTokenFromAllowlist(tokenAddress)
      .then(() => {
        setTokenCheckMessage('');
        toast({
          title: `${tokenAddress} has been removed from allow list`,
          status: 'success',
          position: 'bottom-left',
          duration: 9000,
          isClosable: true,
        });
      })
      .catch(reason => {
        toast({
          title: `Error removing ${tokenAddress} from allow list: ${reason.message}`,
          status: 'error',
          position: 'bottom-left',
          duration: 9000,
          isClosable: true,
        });
      })
      .finally(() => {
        setIsRemovingFromAllowList(false);
        setIsSubmitting(false);
      });
  };

  const FieldMessage = () => {
    // Conditional rendering based on the state flags
    if (isCheckingStatus) {
      return (
        <Text fontFamily="Bungee" fontWeight={400} fontSize={'14px'}>
          Checking status...
        </Text>
      );
    }
    if (isAddingToAllowList) {
      return (
        <Text fontFamily="Bungee" fontWeight={400} fontSize={'14px'}>
          Adding to allow list...
        </Text>
      );
    }
    if (isRemovingFromAllowList) {
      return (
        <Text fontFamily="Bungee" fontWeight={400} fontSize={'14px'}>
          Removing from allow list...
        </Text>
      );
    }
    // When there is a token check message, show it with the CheckCircleIcon
    if (tokenCheckMessage) {
      return (
        <Flex alignItems="center">
          <Text fontFamily="Bungee" fontWeight={400} fontSize={'14px'}>
            {tokenCheckMessage + ' '}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                position: 'relative',
                top: '1px',
              }}
            >
              <BiSolidCheckCircle />
            </span>
          </Text>
        </Flex>
      );
    }
    return null; // Return null if there's no specific message to display
  };

  return (
    <Box>
      <Text
        fontSize="20px"
        fontWeight="bold"
        fontFamily="Bungee"
        color="dark.purple.400"
      >
        Manage Assets Allowlist
      </Text>
      <Text
        mb={4}
        mt={4}
        fontWeight={600}
        fontFamily="Montserrat"
        textAlign="start"
      >
        If you want to mint, receive, or swap certain LSP7 or LSP8 tokens you
        can add them to the allowlist beforehand so that they don’t get
        automatically redirected to your Grave.
      </Text>
      <FormControl textAlign="start">
        <FormLabel fontFamily="Bungee" fontWeight={400} fontSize={'14px'}>
          ASSET ADDRESS
        </FormLabel>
        <Box display="flex" alignItems="center" h="50px">
          <Input
            width="314px"
            height="25px"
            fontFamily={'Bungee'}
            backgroundColor="white"
            borderColor={'var(--chakra-colors-dark-purple-500)'}
            _hover={{
              borderColor: 'var(--chakra-colors-dark-purple-500)',
            }}
            _focus={{
              borderColor: 'var(--chakra-colors-dark-purple-500)',
              boxShadow: 'none',
            }}
            value={tokenAddress}
            onChange={handleChange}
            placeholder="PASTE ASSET ADDRESS"
            _placeholder={{
              fontWeight: 'bold',
              color: 'var(--chakra-colors-dark-purple-200)',
            }}
            onBlur={fetchTokenAllowListStatus}
          />
          <Text
            fontFamily="Bungee"
            fontWeight={400}
            fontSize={'14px'}
            ml="20px"
          >
            {FieldMessage()}
          </Text>
        </Box>
      </FormControl>
      <Flex>
        <Button
          mt={2}
          h={'33px'}
          mr="10px"
          isDisabled={isSubmitting}
          isLoading={isAddingToAllowList}
          onClick={addTokenToAllowList}
          type="submit"
        >
          ALLOW ASSET
        </Button>
        <Button
          mt={2}
          h={'33px'}
          isDisabled={isSubmitting}
          isLoading={isRemovingFromAllowList}
          onClick={removeTokenFromAllowList}
          type="submit"
        >
          DISALLOW ASSET
        </Button>
      </Flex>
    </Box>
  );
}
