import { useContext, useEffect, useState } from 'react';
import { WalletContext } from '@/components/wallet/WalletContext';
import { Contract } from 'ethers';
import { Flex, HStack, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';

export default function InstallationCounter() {
  const customColor = 'white';

  const walletContext = useContext(WalletContext);
  const { networkConfig, provider } = walletContext;

  const [installations, setInstallations] = useState(0);
  const [displayNumber, setDisplayNumber] = useState(installations);

  useEffect(() => {
    const fetchInstallations = async () => {
      if (!networkConfig.graveVaultFactoryAddress) {
        setInstallations(0);
        return;
      }
      const factory = new Contract(
        networkConfig.graveVaultFactoryAddress,
        ['function vaultsCreated() view returns (uint256)'],
        provider
      );
      const total = await factory.vaultsCreated();
      setInstallations(Number(total));
    };
    fetchInstallations();
  }, []);

  useEffect(() => {
    if (installations === 0) return;
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
        bgColor={'dark.purple.300'}
        p={{ base: 6 }}
        borderRadius={'lg'}
        justifyContent={'center'}
        width={'100%'}
        maxWidth={{ base: '100%', md: '450px' }}
      >
        <Text
          color={customColor}
          fontSize={{ base: 'md', lg: 'lg' }}
          lineHeight={{ base: '120%', sm: '120%', lg: '130%' }}
          fontFamily={'Montserrat'}
          fontWeight={400}
        >
          GRAVE spamboxes:
        </Text>
        <Flex alignItems={'center'} justifyContent={'center'} gap={1}>
          <Text
            color={customColor}
            fontSize={{ base: 'lg', lg: 'xl' }}
            lineHeight={{ base: '120%', sm: '120%', lg: '130%' }}
            fontFamily={'Montserrat'}
            fontWeight={700}
            as={motion.text}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {displayNumber == 0 ? '--' : displayNumber}
          </Text>
          <Text
            color={customColor}
            fontSize={{ base: 'lg', lg: 'xl' }}
            lineHeight={{ base: '120%', sm: '120%', lg: '130%' }}
            fontFamily={'Montserrat'}
            fontWeight={400}
            filter={'grayscale(1)'}
          >
            👻
          </Text>
        </Flex>
      </HStack>
    </Flex>
  );
}
