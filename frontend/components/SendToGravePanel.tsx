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
import React, { useContext, useEffect, useState } from 'react';
import { WalletContext } from '@/components/wallet/WalletContext';
import { ethers } from 'ethers';
import LSP1GraveForwarderAbi from '@/abis/LSP1GraveForwarder.json';
import { LSP1GraveForwarder } from '@/contracts';
import { BiSolidCheckCircle } from 'react-icons/bi';
import LSP7DigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP7DigitalAsset.json';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';


const messageState = {
  isCheckingStatus: 'Checking status...',
  isRemovingFromAllowList: 'Removing from allowlist...',
  tokenAllowListDetected: 'Allowed asset detected',
  tokenDisallowedDetected: 'Disallowed asset detected',
  invalidAddress: 'Invalid address',
  makeSureValidAddress: 'Make sure the address is valid',
};

export default function ManageAllowList() {
  const walletContext = useContext(WalletContext);
  const { networkConfig, provider, disconnectIfNetworkChanged } = walletContext;
  const toast = useToast();
  const signer = provider.getSigner();

  const graveForwarder = new ethers.Contract(
    networkConfig.universalGraveForwarder,
    LSP1GraveForwarderAbi.abi,
    provider
  ) as LSP1GraveForwarder;

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [isRemovingFromAllowList, setIsRemovingFromAllowList] =
    useState<boolean>(false);
  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [tokenCheckMessage, setTokenCheckMessage] = useState<string>('');
  const [debouncedTokenAddress, setDebouncedTokenAddress] =
    useState(tokenAddress);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTokenAddress(event.target.value.toLowerCase());
  };

  // Effect for debouncing tokenAddress update
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTokenAddress(tokenAddress);
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [tokenAddress]);

  // Call fetchTokenAllowListStatus using debouncedTokenAddress
  useEffect(() => {
    setTokenCheckMessage('');
    // Ensure there's a value to check and avoid fetching on initial render
    if (debouncedTokenAddress) {
      fetchTokenAllowListStatus();
    }
  }, [debouncedTokenAddress]);

  // todo fetch balance of tokenAddress
  const fetchTokenAllowListStatus = async () => {
    if (!tokenAddress) {
      return;
    }
    setIsSubmitting(true);
    setIsCheckingStatus(true);
    graveForwarder
      .connect(signer)
      .tokenAllowlist(await signer.getAddress(), tokenAddress.toLowerCase())
      .then(value => {
        const message = value
          ? messageState.tokenAllowListDetected
          : messageState.tokenDisallowedDetected;
        setTokenCheckMessage(message);
      })
      .catch(reason => {
        if (reason.message && reason.message.includes('invalid address')) {
          setTokenCheckMessage(messageState.invalidAddress);
        } else {
          setTokenCheckMessage(messageState.makeSureValidAddress);
        }
      })
      .finally(() => {
        setIsCheckingStatus(false);
        setIsSubmitting(false);
      });
  };



  const transferTokenFromUP = async (tokenAddress: string) => {
    // if (isProcessing || (await disconnectIfNetworkChanged())) {
    //   return;
    // }
    // setIsProcessing(true);
    try {
      const signer = provider.getSigner();

      const LSP1GraveForwarderContract = new ethers.Contract(
        networkConfig.universalGraveForwarder,
        LSP1GraveForwarder.abi,
        signer
      );

      const upAddress = await signer.getAddress();
      if (
        (await LSP1GraveForwarderContract.tokenAllowlist(
          upAddress,
          tokenAddress
        ))
      ) {
        await LSP1GraveForwarderContract.removeTokenFromAllowlist(tokenAddress, {
          gasLimit: 400_00,
        });
      }

      const tokenContract = new ethers.Contract(
        tokenAddress,
        LSP7DigitalAsset.abi,
        signer
      );
      const lsp7 = tokenContract.connect(signer);

      const lsp7Tx = lsp7.interface.encodeFunctionData('transfer', [
        await signer.getAddress(),
        vaultAddress,
        rawTokenAmount,
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
        .execute(0, tokenAddress, 0, lsp7Tx, { gasLimit: 400_00 });

      // setIsProcessing(false);
      // onReviveSuccess(tokenAddress);
      toast({
        title: `Gone but not forgotten! See you in the afterlife.`,
        status: 'success',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
    } catch (error: any) {
      // setIsProcessing(false);
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




  // const transferTokenToUP = async (tokenAddress: string) => {
  //   if (isProcessing || (await disconnectIfNetworkChanged())) {
  //     return;
  //   }
  //   setIsProcessing(true);
  //   try {
  //     const signer = provider.getSigner();

  //     const LSP1GraveForwarderContract = new ethers.Contract(
  //       networkConfig.universalGraveForwarder,
  //       LSP1GraveForwarder.abi,
  //       signer
  //     );

  //     const upAddress = await signer.getAddress();
  //     if (
  //       !(await LSP1GraveForwarderContract.tokenAllowlist(
  //         upAddress,
  //         tokenAddress
  //       ))
  //     ) {
  //       await LSP1GraveForwarderContract.addTokenToAllowlist(tokenAddress, {
  //         gasLimit: 400_00,
  //       });
  //     }

  //     const tokenContract = new ethers.Contract(
  //       tokenAddress,
  //       LSP7DigitalAsset.abi,
  //       signer
  //     );
  //     const lsp7 = tokenContract.connect(signer);

  //     const lsp7Tx = lsp7.interface.encodeFunctionData('transfer', [
  //       vaultAddress,
  //       await signer.getAddress(),
  //       rawTokenAmount,
  //       false,
  //       '0x',
  //     ]);

  //     const vaultContract = new ethers.Contract(
  //       vaultAddress,
  //       LSP9Vault.abi,
  //       signer
  //     );
  //     const lsp9 = vaultContract.connect(signer);
  //     await lsp9
  //       .connect(signer)
  //       .execute(0, tokenAddress, 0, lsp7Tx, { gasLimit: 400_00 });

  //     setIsProcessing(false);
  //     onReviveSuccess(tokenAddress);
  //     toast({
  //       title: `it's alive! ⚡`,
  //       status: 'success',
  //       position: 'bottom-left',
  //       duration: 9000,
  //       isClosable: true,
  //     });
  //   } catch (error: any) {
  //     setIsProcessing(false);
  //     console.error(error);
  //     toast({
  //       title: `Error fetching UP data. ${error.message}`,
  //       status: 'error',
  //       position: 'bottom-left',
  //       duration: 9000,
  //       isClosable: true,
  //     });
  //   }
  // };






  const FieldMessage = () => {
    // Conditional rendering based on the state flags
    if (isCheckingStatus) {
      return messageState.isCheckingStatus;
    }

    if (isRemovingFromAllowList) {
      return messageState.isRemovingFromAllowList;
    }
    // When there is a token check message, show it with the CheckCircleIcon
    if (tokenCheckMessage) {
      let icon = <></>;
      if (
        tokenCheckMessage === messageState.tokenAllowListDetected ||
        tokenCheckMessage === messageState.tokenDisallowedDetected
      ) {
        icon = (
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
        );
      }
      return (
        <>
          {tokenCheckMessage + ' '} {icon}
        </>
      );
    }
    return null; // Return null if there's no specific message to display
  };

  return (
    <>
      <Text
        fontSize="20px"
        fontWeight="bold"
        fontFamily="Bungee"
        color="dark.purple.400"
      >
        SEND ASSETS TO YOUR GRAVE
       </Text>
      <Text
        mb={4}
        mt={4}
        fontWeight={600}
        fontFamily="Montserrat"
        textAlign="start"
      >
       BLA BLA BLA
      </Text>
      <FormControl textAlign="start">
        <FormLabel fontFamily="Bungee" fontWeight={400} fontSize={'14px'}>
          ASSET ADDRESS
        </FormLabel>
        <Box display="flex" alignItems="center" h="50px">
          <Input
            autoComplete="off"
            maxWidth="314px"
            minWidth="200px"
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
          />
          <Text
            ml={2}
            fontFamily="Bungee"
            fontWeight={400}
            fontSize={'14px'}
            maxWidth={'120px'}
          >
            {FieldMessage()}
          </Text>
        </Box>
      </FormControl>
      <Flex justifyContent={'flex-start'} gap={2} width={'100%'}>
        <Button
          h={'33px'}
          mr="10px"
          isDisabled={isSubmitting}
          isLoading={null}
          onClick={transferTokenFromUP}
          type="submit"
        >
          POOF!
        </Button>
      </Flex>
    </>
  );
}
