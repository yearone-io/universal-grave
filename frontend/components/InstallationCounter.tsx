import { useContext, useEffect, useState } from 'react';
import { WalletContext } from '@/components/wallet/WalletContext';
import { LSP1GraveForwarder__factory } from '@/contracts';
import { HStack, Icon, Text, useColorModeValue } from '@chakra-ui/react';
import { TbGrave2 } from 'react-icons/tb';
import { motion } from 'framer-motion';

export default function InstallationCounter() {
  const panelBgColor = useColorModeValue('light.white', 'dark.purple.200');
  const customColor = useColorModeValue(
    'light.black',
    'var(--chakra-colors-dark-purple-500)'
  );
  const borderColor = useColorModeValue(
    'var(--chakra-colors-light-black)',
    'var(--chakra-colors-dark-purple-200)'
  );

  const walletContext = useContext(WalletContext);
  const { networkConfig, provider } = walletContext;

  const [installations, setInstallations] = useState(0);
  const [displayNumber, setDisplayNumber] = useState(installations);

  const graveContract = LSP1GraveForwarder__factory.connect(
    networkConfig.universalGraveForwarder,
    provider
  );

  useEffect(() => {
    const fetchInstallations = async () => {
      const installations = await graveContract.graveUserCounter();
      setInstallations(Number(installations));
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
    <HStack
      bgColor={panelBgColor}
      p={{ base: 6 }}
      borderRadius={'lg'}
      border={`1px solid ${borderColor}`}
      justifyContent={'center'}
    >
      <Icon
        boxSize={{ base: 8, lg: 10 }}
        color={customColor}
        as={TbGrave2}
      />
      <Text
        color={customColor}
        fontSize={{ base: 'md', lg: 'lg' }}
        lineHeight={{ base: '120%', sm: '120%', lg: '130%' }}
        fontFamily={'Montserrat'}
        fontWeight={800}
        as={motion.text}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {displayNumber == 0 ? '--' : displayNumber}
      </Text>
      <Text
        color={customColor}
        fontSize={{ base: 'md', lg: 'lg' }}
        lineHeight={{ base: '120%', sm: '120%', lg: '130%' }}
        fontFamily={'Montserrat'}
        fontWeight={800}
      >
        Universal Profile installations
      </Text>
    </HStack>
  );
}
