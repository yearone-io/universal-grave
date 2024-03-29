import React from 'react';
import { Text, useColorModeValue, VStack } from '@chakra-ui/react';
import SignInButton from '@/components/SignInButton';

const SignInBox: React.FC = () => {
  const bgColor = useColorModeValue('light.green.brand', 'dark.purple.200'); // Adjusts color based on the theme

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
        Please sign in with your Universal Profile to connect a GRAVE spambox.
      </Text>
      <SignInButton />
    </VStack>
  );
};

export default SignInBox;
