import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import React, { useContext, useState } from 'react';
import { WalletContext } from '@/components/wallet/WalletContext';
import { ethers } from 'ethers';
import LSP1GraveForwarderAbi from '@/abis/LSP1GraveForwarder.json';
import { LSP1GraveForwarder } from '@/contracts';
import { getProvider } from '@/utils/provider';

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

  const handleChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => setTokenAddress(event.target.value);

  const fetchTokenAllowListStatus = async () => {
    setIsSubmitting(true);
    setIsCheckingStatus(true);
    graveForwarder
      .connect(signer)
      .tokenAllowlist(await signer.getAddress(), tokenAddress)
      .then(value => {
        const message = value
          ? `${tokenAddress} is allowed`
          : `${tokenAddress} is not allowed`;
        toast({
          title: message,
          status: 'success',
          position: 'bottom-left',
          duration: 9000,
          isClosable: true,
        });
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
      <Text mb={4} mt={4} fontWeight={600} fontFamily="Montserrat" textAlign='start'>
        If you want to mint, receive, or swap certain LSP7 or LSP8 tokens you
        can add them to the allowlist beforehand so that they don’t get
        automatically redirected to your Grave.
      </Text>
      <FormControl>
        <FormLabel
        fontFamily="Bungee"
        fontWeight={400}
          fontSize={'14px'}
        >ASSET ADDRESS</FormLabel>
        <Input
          fontFamily={'Bungee'}
          backgroundColor='white'
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
          placeholder='PASTE ASSET ADDRESS'
          _placeholder={{ fontWeight: 'bold',
          color: 'var(--chakra-colors-dark-purple-200)'
         }}
        />
      </FormControl>
      <Stack direction={'column'}>
        <Button
          mt={4}
          isDisabled={isSubmitting}
          isLoading={isCheckingStatus}
          loadingText="Checking status"
          onClick={fetchTokenAllowListStatus}
          type="submit"
        >
          Check status
        </Button>
        <Button
          mt={4}
          isDisabled={isSubmitting}
          isLoading={isAddingToAllowList}
          loadingText="Adding to allow list"
          onClick={addTokenToAllowList}
          type="submit"
        >
          Add to allow list
        </Button>
        <Button
          mt={4}
          isDisabled={isSubmitting}
          loadingText="Removing from allow list"
          isLoading={isRemovingFromAllowList}
          onClick={removeTokenFromAllowList}
          type="submit"
        >
          Remove from allow list
        </Button>
      </Stack>
    </Box>
  );
}
