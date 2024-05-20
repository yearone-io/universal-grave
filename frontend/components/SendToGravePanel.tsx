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
import { LSP1GraveForwarder__factory } from '@/contracts';
import { ethers } from 'ethers';
import LSP7DigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP7DigitalAsset.json';
import LSP8IdentifiableDigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP8IdentifiableDigitalAsset.json';
import { LSP4_TOKEN_TYPES } from '@lukso/lsp-smart-contracts';
import {
  GRAVE_ASSET_TYPES,
  TokenData,
  getEnoughDecimals,
  getLSPAssetBasicInfo,
} from '@/utils/tokenUtils';

export default function SendToGravePanel() {
  const walletContext = useContext(WalletContext);
  const { networkConfig, provider, disconnectIfNetworkChanged, graveVault } =
    walletContext;
  const toast = useToast();
  const signer = provider.getSigner();
  const [showGhosts, setShowGhosts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [canSubmit, setCanSubmit] = useState<boolean>(false);
  const [inputTokenAddress, setInputTokenAddress] = useState<string>('');
  const [tokenCheckMessage, setTokenCheckMessage] = useState<string>('');
  const [tokenData, setTokenData] = useState<TokenData | undefined>(undefined);
  const [debouncedTokenAddress, setDebouncedTokenAddress] =
    useState(inputTokenAddress);
  const [transferBatchSize, setTransferBatchSize] = useState<number>(1);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTokenAddress(inputTokenAddress);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [inputTokenAddress]);

  useEffect(() => {
    setTokenCheckMessage('');
    if (debouncedTokenAddress) {
      processTokenData();
    }
  }, [debouncedTokenAddress]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputTokenAddress(event.target.value.toLowerCase());
  };

  const getTokenData = async () => {
    let assetData;
    try {
      const wallet = await signer.getAddress();
      assetData = await getLSPAssetBasicInfo(
        provider,
        inputTokenAddress,
        wallet
      );
      setTokenData(assetData);
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
    setTokenData(undefined);

    const assetData = await getTokenData();
    if (!assetData || !assetData.balance) {
      setTokenCheckMessage('No balance for this Token');
      setCanSubmit(false);
      return;
    }

    if (Number(assetData.balance) === 0) {
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

    setTokenCheckMessage(
      `Token balance: ${assetData?.symbol} ${roundedTokenAmount}`
    );
    setCanSubmit(true);
  };

  const removeTokenFromAllowList = async () => {
    const LSP1GraveForwarderContract = LSP1GraveForwarder__factory.connect(
      networkConfig.universalGraveForwarder,
      signer
    );

    const upAddress = await signer.getAddress();
    if (
      await LSP1GraveForwarderContract.tokenAllowlist(
        upAddress,
        tokenData!.address
      )
    ) {
      setTokenCheckMessage('Removing from allowlist...');
      await LSP1GraveForwarderContract.removeTokenFromAllowlist(
        tokenData!.address,
        {
          gasLimit: 400_00,
        }
      );
    }
  };

  const transferLSP7ToGrave = async () => {
    const tokenContract = new ethers.Contract(
      tokenData?.address as string,
      LSP7DigitalAsset.abi,
      signer
    );
    const tx = await tokenContract.transfer(
      await signer.getAddress(),
      graveVault,
      tokenData?.balance,
      false,
      '0x'
    );
    await tx.wait();
  };

  const estimateBatchSize = async (
    walletNftIds: string[],
    maxGasLimit: BigInt
  ) => {
    let batchSize = walletNftIds.length;
    const tokenContract = new ethers.Contract(
      inputTokenAddress,
      LSP8IdentifiableDigitalAsset.abi,
      signer
    );
    const wallet = await signer.getAddress();

    while (batchSize > 1) {
      try {
        const batch = walletNftIds.slice(0, batchSize);

        const vaultAddresses: string[] = [];
        const signerAddresses: string[] = [];
        const tokenIds: string[] = [];
        const forceValues: boolean[] = [];
        const dataValues: string[] = [];

        batch.forEach((id: string) => {
          signerAddresses.push(wallet);
          vaultAddresses.push(graveVault as string);
          tokenIds.push(id);
          forceValues.push(false);
          dataValues.push('0x');
        });

        const estimatedGas = await tokenContract.estimateGas.transferBatch(
          signerAddresses,
          vaultAddresses,
          tokenIds,
          forceValues,
          dataValues
        );

        if (estimatedGas.lt(ethers.BigNumber.from(maxGasLimit))) {
          break;
        } else {
          // make the batch 25% smaller
          batchSize = Math.floor(batchSize * 0.75);
        }
      } catch (error) {
        batchSize = Math.floor(batchSize * 0.75);
      }
    }
    setTransferBatchSize(batchSize);
    return batchSize;
  };

  const transferLSP8InBatches = async (
    walletNftIds: string[],
    batchSize: number
  ) => {
    const tokenContract = new ethers.Contract(
      inputTokenAddress,
      LSP8IdentifiableDigitalAsset.abi,
      signer
    );
    const wallet = await signer.getAddress();

    for (let i = 0; i < walletNftIds.length; i += batchSize) {
      const batch = walletNftIds.slice(i, i + batchSize);

      const vaultAddresses: string[] = [];
      const signerAddresses: string[] = [];
      const tokenIds: string[] = [];
      const forceValues: boolean[] = [];
      const dataValues: string[] = [];

      batch.forEach((id: string) => {
        signerAddresses.push(wallet);
        vaultAddresses.push(graveVault as string);
        tokenIds.push(id);
        forceValues.push(false);
        dataValues.push('0x');
      });

      const tx = await tokenContract.transferBatch(
        signerAddresses,
        vaultAddresses,
        tokenIds,
        forceValues,
        dataValues
      );
      await tx.wait();
    }
  };

  const transferLSP8ToGrave = async () => {
    const tokenContract = new ethers.Contract(
      inputTokenAddress,
      LSP8IdentifiableDigitalAsset.abi,
      signer
    );
    const wallet = await signer.getAddress();
    const walletNftIds = await tokenContract.tokenIdsOf(wallet);

    const maxGasLimit = (BigInt(1_000_000) * BigInt(80)) / BigInt(100); // Adjust this value based on your needs
    const batchSize = await estimateBatchSize(walletNftIds, maxGasLimit);

    await transferLSP8InBatches(walletNftIds, batchSize);
  };

  const getBatchDetailsMessage = () => {
    if (
      isSubmitting &&
      (tokenData?.interface ===
        GRAVE_ASSET_TYPES.LSP8IdentifiableDigitalAsset ||
        tokenData?.interface ===
          GRAVE_ASSET_TYPES.UnrecognisedLSP8IdentifiableDigitalAsset) &&
      transferBatchSize > 1
    ) {
      return ` Batches of ${transferBatchSize}.`;
    } else {
      return null;
    }
  };

  const transferTokenFromUP = async () => {
    if (await disconnectIfNetworkChanged()) {
      return;
    }
    setIsSubmitting(true);
    try {
      await removeTokenFromAllowList();
      setTokenCheckMessage('Sending token to Grave...');
      if (
        tokenData?.interface === GRAVE_ASSET_TYPES.LSP7DigitalAsset ||
        tokenData?.interface === GRAVE_ASSET_TYPES.UnrecognisedLSP7DigitalAsset
      ) {
        await transferLSP7ToGrave();
      } else if (
        tokenData?.interface ===
          GRAVE_ASSET_TYPES.LSP8IdentifiableDigitalAsset ||
        tokenData?.interface ===
          GRAVE_ASSET_TYPES.UnrecognisedLSP8IdentifiableDigitalAsset
      ) {
        await transferLSP8ToGrave();
      } else {
        setTokenCheckMessage(
          'Unrecognized token interface. Cannot send to Grave.'
        );
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
      setInputTokenAddress('');
      setTokenCheckMessage('');
      setShowGhosts(true);
      setTimeout(() => setShowGhosts(false), 4000);
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

  const getFieldMessage = () => {
    if (tokenCheckMessage) {
      return tokenCheckMessage;
    }
    return null;
  };

  const renderGhosts = () => {
    return Array.from({ length: 10 }).map((_, index) => (
      <div
        key={index}
        className="emoji-rain"
        style={{
          left: `${Math.random() * window.innerWidth}px`,
          top: `${Math.random() * window.innerHeight}px`,
        }}
      >
        👻
      </div>
    ));
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
        Have some trash in your 🆙? Send it to the GRAVE! Whether it's NFTs or
        tokens, click "POOF!" and let them rest in peace!
      </Text>
      <FormControl textAlign="start">
        <FormLabel fontFamily="Bungee" fontWeight={400} fontSize={'14px'}>
          ASSET ADDRESS
        </FormLabel>
        <Box display="flex">
          <Flex flexDir="column">
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
              value={inputTokenAddress}
              onChange={handleChange}
              placeholder="PASTE ASSET ADDRESS"
              _placeholder={{
                fontWeight: 'bold',
                color: 'var(--chakra-colors-dark-purple-200)',
              }}
            />
            <Text ml={2} fontFamily="Bungee" fontWeight={400} fontSize={'14px'}>
              {getFieldMessage()}
              {getBatchDetailsMessage()}
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
      {showGhosts && renderGhosts()}
    </>
  );
}
