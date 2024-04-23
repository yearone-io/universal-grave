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
import LSP7DigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP7DigitalAsset.json';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';
import { LSP4_TOKEN_TYPES } from '@lukso/lsp-smart-contracts';
import { getEnoughDecimals, getLSPAssetBasicInfo } from '@/utils/tokenUtils';

export default function ManageAllowList() {
  const walletContext = useContext(WalletContext);
  const { networkConfig, provider, disconnectIfNetworkChanged, graveVault} = walletContext;
  const toast = useToast();
  const signer = provider.getSigner();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [canSubmit, setCanSubmit] = useState<boolean>(false);
  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [tokenCheckMessage, setTokenCheckMessage] = useState<string>('');
  const [rawTokenAmount, setRawTokenAmount] = useState<number>(0);
  const [debouncedTokenAddress, setDebouncedTokenAddress] =
    useState(tokenAddress);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTokenAddress(event.target.value.toLowerCase());
  };

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
      fetchTokenData();
    }
  }, [debouncedTokenAddress]);

  const fetchTokenData = async () => {
    setCanSubmit(false);
    setTokenCheckMessage('Checking...');
    setRawTokenAmount(0);

    let assetData;
   try {
    const wallet = await signer.getAddress();
    assetData = await getLSPAssetBasicInfo(
      provider,
      tokenAddress,
      wallet
    );
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

    if (!assetData.balance || !assetData?.decimals) {
      setTokenCheckMessage('No balance for this Token');
      setCanSubmit(false);
      return;
    }
    
    const tokenType = assetData?.tokenType;
    const readableTokenAmount =  parseFloat(
            ethers.utils.formatUnits(assetData?.balance, assetData?.decimals)
          ).toFixed(
            tokenType === LSP4_TOKEN_TYPES.TOKEN
              ? Number(assetData?.decimals)
              : 0
          );

    const roundedTokenAmount = parseFloat(readableTokenAmount).toFixed(
      getEnoughDecimals(Number(readableTokenAmount))
    );

    setRawTokenAmount(Number(assetData?.balance));
    setTokenCheckMessage(`Token balance: ${assetData?.symbol} ${roundedTokenAmount}`)
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
      setTokenCheckMessage('Removing from allowlist...')
      await LSP1GraveForwarderContract.removeTokenFromAllowlist(
        tokenAddress,
        {
          gasLimit: 400_00,
        }
      );
    }
  }

  const transferToGrave = async () => {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      LSP7DigitalAsset.abi,
      signer
    );
    const lsp7 = tokenContract.connect(signer);

    const lsp7Tx = lsp7.interface.encodeFunctionData('transfer', [
      await signer.getAddress(),
      graveVault,
      rawTokenAmount,
      false,
      '0x',
    ]);

    const vaultContract = new ethers.Contract(
      graveVault as string,
      LSP9Vault.abi,
      signer
    );
    const lsp9 = vaultContract.connect(signer);
    await lsp9
      .connect(signer)
      .execute(0, tokenAddress, 0, lsp7Tx, { gasLimit: 400_00 });

  }

  const transferTokenFromUP = async (tokenAddress: string) => {
    if ((await disconnectIfNetworkChanged())) {
      return;
    }
    setIsSubmitting(true);
    try {
      
      await removeTokenFromAllowList();
      setTokenCheckMessage('Sending token to Grave...');

      await transferToGrave();
      setIsSubmitting(false);
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
    // Conditional rendering based on the state flags
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
          isDisabled={!canSubmit}
          isLoading={isSubmitting}
          onClick={()=>{transferTokenFromUP(tokenAddress)}}
          type="submit"
        >
          POOF!
        </Button>
      </Flex>
    </>
  );
}
