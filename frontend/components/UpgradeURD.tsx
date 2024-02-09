import React, {useContext, useState} from 'react';
import {
  Button,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { WalletContext } from '@/components/wallet/WalletContext';
import { ethers } from 'ethers';
import LSP1GraveForwarderAbi from '@/abis/LSP1GraveForwarder.json';
import { LSP1GraveForwarder } from '@/contracts';

export const UpgradeURD = ({ oldForwarderAddress }: { oldForwarderAddress: string }) => {
  const walletContext = useContext(WalletContext);
  const {  networkConfig, setURDLsp7, setURDLsp8} = walletContext;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const bgColor = useColorModeValue('light.green.brand', 'dark.purple.200');
  const provider = new ethers.providers.Web3Provider(window.lukso);
  const graveForwarder = new ethers.Contract(
    networkConfig.universalGraveForwarder,
    LSP1GraveForwarderAbi.abi,
    provider
  ) as LSP1GraveForwarder;

  const oldForwarder = new ethers.Contract(
    oldForwarderAddress,
    LSP1GraveForwarderAbi.abi,
    provider
  ) as LSP1GraveForwarder;

  const signer = provider.getSigner();

  const handleUpgrade = async () => {
      const existingGrave = await oldForwarder.connect(signer).getGrave();
      await graveForwarder.connect(signer).setGrave(existingGrave);
      setURDLsp7(networkConfig.universalGraveForwarder);
      setURDLsp8(networkConfig.universalGraveForwarder);
  };

  return (
    <VStack
      spacing={4}
      p={10}
      backgroundColor={bgColor}
      boxShadow="md"
      borderRadius="lg"
      textAlign="center"
      color={'dark.purple.500'}
      width={'555px'}
      minHeight={'335px'}
    >
      <Text
        fontSize="20px"
        fontWeight="bold"
        fontFamily="Bungee"
        color="dark.purple.400"
      >
        There is a new version of the Universal Grave available - please upgrade
        to continue.
      </Text>
      <Button isLoading={isSubmitting} loadingText={"Upgrading.."} onClick={handleUpgrade}>Upgrade</Button>
    </VStack>
  );
};
