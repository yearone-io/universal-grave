import { useContext, useEffect, useMemo, useState } from 'react';
import { WalletContext } from '@/components/wallet/WalletContext';
import { Contract, JsonRpcProvider } from 'ethers';
import { Flex, HStack, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { getNetworkByName } from '@/constants/supportedNetworks';

interface InstallationCounterProps {
  networkName?: string;
}

export default function InstallationCounter({
  networkName,
}: InstallationCounterProps) {
  const customColor = 'white';

  const walletContext = useContext(WalletContext);
  const { networkConfig } = walletContext;

  const networkByName = useMemo(
    () => (networkName ? getNetworkByName(networkName) : undefined),
    [networkName]
  );

  const factoryAddress =
    networkByName?.graveVaultFactoryAddress ??
    networkConfig.graveVaultFactoryAddress;
  const rpcUrl = networkByName?.rpcUrl ?? networkConfig.rpcUrl;
  const chainId = networkByName?.chainId ?? networkConfig.chainId;
  const chainName = networkByName?.name ?? networkConfig.name;
  const readProvider = useMemo(
    () =>
      new JsonRpcProvider(rpcUrl, {
        name: chainName,
        chainId,
      }),
    [rpcUrl, chainId, chainName]
  );

  const [installations, setInstallations] = useState(0);
  const [displayNumber, setDisplayNumber] = useState(installations);

  useEffect(() => {
    const fetchInstallations = async () => {
      if (!factoryAddress) {
        setInstallations(0);
        return;
      }
      try {
        const factory = new Contract(
          factoryAddress,
          ['function vaultsCreated() view returns (uint256)'],
          readProvider
        );
        const total = await factory.vaultsCreated();
        setInstallations(Number(total));
      } catch (error) {
        console.error('Failed to fetch GRAVE spambox count', error);
        setInstallations(0);
      }
    };
    fetchInstallations();
  }, [factoryAddress, readProvider]);

  useEffect(() => {
    if (installations === 0) {
      setDisplayNumber(0);
      return;
    }
    // Calculate the increment step dynamically based on the distance to the target number
    const updateNumber = () => {
      setDisplayNumber(prev => {
        const difference = installations - prev;
        const stepSize = Math.ceil(difference / 10); // Adjust step size dynamically
        return difference !== 0 ? prev + stepSize : prev;
      });
    };

    // Start with a faster interval and slow down as you approach the target number
    let intervalTime = 50; // Start fast
    const interval = setInterval(updateNumber, intervalTime);

    // Optionally adjust the interval time dynamically (optional)
    const adjustInterval = setInterval(() => {
      intervalTime = Math.max(50, intervalTime + 5); // Slow down over time
      clearInterval(interval);
      setInterval(updateNumber, intervalTime);
    }, 1000); // Adjust every second

    return () => {
      clearInterval(interval);
      clearInterval(adjustInterval);
    };
  }, [installations]);

  return (
    <Flex justifyContent={'center'}>
      <HStack
        bg="rgba(255, 255, 255, 0.03)"
        backdropFilter="blur(20px)"
        border="1px solid rgba(255, 255, 255, 0.08)"
        p={{ base: 5, md: 6 }}
        px={{ base: 8, md: 10 }}
        borderRadius={'2xl'}
        justifyContent={'center'}
        spacing={3}
      >
        <Text
          color="whiteAlpha.700"
          fontSize={{ base: 'md', lg: 'lg' }}
          lineHeight={'1.4'}
          fontFamily={'Montserrat'}
          fontWeight={500}
        >
          Profiles protected:
        </Text>
        <Flex alignItems={'center'} justifyContent={'center'} gap={2}>
          <Text
            color="dark.teal.500"
            fontSize={{ base: 'xl', lg: '2xl' }}
            lineHeight={'1.2'}
            fontFamily={'Montserrat'}
            fontWeight={700}
            as={motion.span}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {displayNumber == 0 ? '--' : displayNumber.toLocaleString()}
          </Text>
          <Text
            fontSize={{ base: 'lg', lg: 'xl' }}
            lineHeight={'1.2'}
          >
            👻
          </Text>
        </Flex>
      </HStack>
    </Flex>
  );
}
