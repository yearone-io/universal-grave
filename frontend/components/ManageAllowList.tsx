import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import React, { useContext, useState } from 'react';
import { WalletContext } from '@/components/wallet/WalletContext';
import { ethers } from 'ethers';
import LSP1GraveForwarderAbi from '@/abis/LSP1GraveForwarder.json';
import { LSP1GraveForwarder } from '@/contracts';

export default function ManageAllowList() {
  const walletContext = useContext(WalletContext);
  const { networkConfig } = walletContext;

  const provider = new ethers.providers.Web3Provider(window.lukso);
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

  const [actionText, setActionText] = useState<string>('');

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
        setActionText(
          value
            ? `${tokenAddress} is allowed`
            : `${tokenAddress} is not allowed`
        );
      })
      .catch(reason => {
        setActionText(
          `Error checking status of ${tokenAddress}: ${reason.message}`
        );
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
        setActionText(`${tokenAddress} has been added to allow list`);
      })
      .catch(reason => {
        setActionText(
          `Error adding ${tokenAddress} to allow list: ${reason.message}`
        );
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
        setActionText(`${tokenAddress} has been removed from allow list`);
      })
      .catch(reason => {
        setActionText(
          `Error removing ${tokenAddress} from allow list: ${reason.message}`
        );
      })
      .finally(() => {
        setIsRemovingFromAllowList(false);
        setIsSubmitting(false);
      });
  };

  return (
    // <Accordion mb={'4'} allowToggle>
    //   <AccordionItem>
    //     <h2>
    //       <AccordionButton>
    //         <Box as="span" flex="1" textAlign="left">
    //           Manage allow list
    //         </Box>
    //         <AccordionIcon />
    //       </AccordionButton>
    //     </h2>
    //     <AccordionPanel pb={4}>
      <Box>
          <Text mb={4}>
            If you expect to receive certain LSP7 or LSP8 tokens you can add
            them to the whitelist beforehand so that they do not get redirected
            to your Grave vault
          </Text>
          <FormControl>
            <FormLabel>Token Address</FormLabel>
            <Input value={tokenAddress} onChange={handleChange} />
          </FormControl>
          <Text mt={4} minH={6}>
            {actionText}
          </Text>
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
        {/* </AccordionPanel>
      </AccordionItem>
    </Accordion> */}
    </Box>
  );
}
