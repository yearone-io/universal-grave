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
import { BigNumber, ethers } from 'ethers';
import LSP1GraveForwarderAbi from '@/abis/LSP1GraveForwarder.json';
import LSP7DigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP7DigitalAsset.json';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';
import { LSP4_TOKEN_TYPES } from '@lukso/lsp-smart-contracts';
import { getEnoughDecimals, getLSPAssetBasicInfo } from '@/utils/tokenUtils';

export default function ManageAllowList() {
  const walletContext = useContext(WalletContext);
  const { networkConfig, provider, disconnectIfNetworkChanged, graveVault } =
    walletContext;
  const toast = useToast();
  const signer = provider.getSigner();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [canSubmit, setCanSubmit] = useState<boolean>(false);
  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [tokenCheckMessage, setTokenCheckMessage] = useState<string>('');
  const [rawTokenAmount, setRawTokenAmount] = useState<BigNumber>(BigNumber.from(0));
  const [debouncedTokenAddress, setDebouncedTokenAddress] =
    useState(tokenAddress);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTokenAddress(tokenAddress);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [tokenAddress]);

  useEffect(() => {
    setTokenCheckMessage('');
    if (debouncedTokenAddress) {
      processTokenData();
    }
  }, [debouncedTokenAddress]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTokenAddress(event.target.value.toLowerCase());
  };

  const getTokenData = async () => {
    let assetData;
    try {
      const wallet = await signer.getAddress();
      assetData = await getLSPAssetBasicInfo(provider, tokenAddress, wallet);
      return assetData;
    } catch (error: any) {
      setTokenCheckMessage('Error fetching token data');
      console.error(error);
      toast({
        title: `Error fetching token data. ${error.message}`,
        status: 'error',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
      setTokenCheckMessage('');
      setCanSubmit(false);
      return;
    }
  };

  const processTokenData = async () => {
    setCanSubmit(false);
    setTokenCheckMessage('Checking...');
    setRawTokenAmount(BigNumber.from(0));

    const assetData = await getTokenData();
    if (!assetData || !assetData.balance || !assetData?.decimals) {
      setTokenCheckMessage('No balance for this Token');
      setCanSubmit(false);
      return;
    }

    if ( Number(assetData.balance) === 0) {
      setTokenCheckMessage(`Insufficient balance for ${assetData.symbol}`);
      setCanSubmit(false);
      return;
    }

    const tokenType = assetData?.tokenType;
    const readableTokenAmount = parseFloat(
      ethers.utils.formatUnits(assetData?.balance, assetData?.decimals)
    ).toFixed(
      tokenType === LSP4_TOKEN_TYPES.TOKEN ? Number(assetData?.decimals) : 0
    );

    const roundedTokenAmount = parseFloat(readableTokenAmount).toFixed(
      getEnoughDecimals(Number(readableTokenAmount))
    );

    setRawTokenAmount(assetData?.balance as BigNumber);
    setTokenCheckMessage(
      `Token balance: ${assetData?.symbol} ${roundedTokenAmount}`
    );
    setCanSubmit(true);
  };

  const removeTokenFromAllowList = async () => {
    const LSP1GraveForwarderContract = new ethers.Contract(
      networkConfig.universalGraveForwarder,
      LSP1GraveForwarderAbi.abi,
      signer
    );

    const upAddress = await signer.getAddress();
    if (
      await LSP1GraveForwarderContract.tokenAllowlist(upAddress, tokenAddress)
    ) {
      console.log('Removing token from allowlist');
      setTokenCheckMessage('Removing from allowlist...');
      await LSP1GraveForwarderContract.removeTokenFromAllowlist(tokenAddress, {
        gasLimit: 400_00,
      });
    }
  };

  const transferToGrave = async () => {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      LSP7DigitalAsset.abi,
      signer
    );
    const tx = await tokenContract.transfer(
      await signer.getAddress(),
      graveVault,
      rawTokenAmount,
      false,
      '0x'
    );
    await tx.wait()
  };

  const transferTokenFromUP = async () => {
    if (await disconnectIfNetworkChanged()) {
      return;
    }
    setIsSubmitting(true);
    try {
      await removeTokenFromAllowList();
      setTokenCheckMessage('Sending token to Grave...');

      await transferToGrave();
      setIsSubmitting(false);
      setTokenAddress('');
      setTokenCheckMessage('');
      toast({
        title: `Gone but not forgotten! See you in the afterlife.`,
        status: 'success',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
    } catch (error: any) {
      setIsSubmitting(false);
      setTokenCheckMessage('');
      console.error(error);
      toast({
        title: `Error sending token to Grave. ${error.message}`,
        status: 'error',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
    }
  };

  const FieldMessage = () => {
    if (tokenCheckMessage) {
      return tokenCheckMessage;
    }
    return null;
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
      <FormControl textAlign="start" > 
        <FormLabel fontFamily="Bungee" fontWeight={400} fontSize={'14px'}>
          ASSET ADDRESS
        </FormLabel>
        <Box display="flex">
          <Flex flexDir='column'>
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
          >
            {FieldMessage()}
          </Text>
          </Flex>
        </Box>
      </FormControl>
      <Flex justifyContent={'flex-start'} gap={2} width={'100%'}>
        <Button
          h={'33px'}
          mr="10px"
          isDisabled={!canSubmit}
          isLoading={isSubmitting}
          _disabled={{ color: 'black', opacity: 0.5 }}
          onClick={transferTokenFromUP}
          type="submit"
        >
          POOF!
        </Button>
      </Flex>
    </>
  );
}
