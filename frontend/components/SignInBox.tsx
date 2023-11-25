import React, { useContext } from 'react';
import {
  Box,
  Button,
  Flex,
  Image,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { WalletContext } from './wallet/WalletContext';

const SignInBox: React.FC = () => {
  const walletContext = useContext(WalletContext);
  const bgColor = useColorModeValue('light.green.brand', 'dark.purple.200'); // Adjusts color based on the theme
  const { connect, isLoadingAccount } = walletContext;

  return (
    <VStack
      spacing={4}
      p={5}
      backgroundColor={bgColor}
      boxShadow="md"
      borderRadius="lg"
      width="350px"
      mx="auto" // Centers the box
      my={8} // Margin top and bottom
      textAlign="center"
      padding="20px"
    >
      <Text
        fontSize="lg"
        fontWeight="bold"
        fontFamily="Montserrat"
        size="18px"
        lineHeight="24px"
        color="dark.purple.500"
      >
        Please sign in with your Universal Profile to connect a GRAVE spam box.
      </Text>
      <Button
        onClick={connect}
        border={'1px solid var(--chakra-colors-dark-purple-500)'}
      >
        <Flex alignItems="center" justifyContent="space-between">
          <Image src="images/LYX-logo.svg" alt="Sign In" />
          <Box
            ml="10px"
            fontSize="14px"
            lineHeight="14px"
            fontFamily="Bungee"
            fontWeight="400"
            color={'dark.purple.500'}
          >
            {isLoadingAccount ? '...' : 'Sign In'}
          </Box>
        </Flex>
      </Button>
    </VStack>
  );
};

export default SignInBox;
