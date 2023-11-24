import React from 'react';
import { Box, Button, Text, VStack, useColorModeValue } from '@chakra-ui/react';

const JoinGravePannel: React.FC = () => {
  const bgColor = useColorModeValue('light.green.brand', 'dark.purple.200'); // Adjusts color based on the theme

  return (
    <VStack
      spacing={4}
      p={5}
      backgroundColor={bgColor}
      boxShadow='md'
      borderRadius='lg'
      width='full' // Take the full width of the parent
      textAlign='center'
      padding='20px'
    >
      <Text fontSize='2xl' fontWeight='bold' fontFamily='Roboto' >
        SET UP YOUR GRAVE SPAM BOX
      </Text>
      <Button>
        UNSUBSCRIBE
      </Button>
      <VStack alignItems='start' spacing={3}>
        <Text fontSize='md' fontWeight='semibold' fontFamily='Roboto' >
          1. Give your 🆙 necessary permissions
        </Text>
        <Text fontSize='md' fontWeight='semibold' fontFamily='Roboto' >
          2. Create your GRAVE spam box
        </Text>
        <Text fontSize='md' fontWeight='semibold' fontFamily='Roboto' >
          3. Link GRAVE to your 🆙
        </Text>
        <Text fontSize='md' fontWeight='semibold' fontFamily='Roboto'>
          4. Enable GRAVE to keep assets inventory
        </Text>
        <Text fontSize='md' fontWeight='semibold' fontFamily='Roboto' >
          5. Direct all 🆙 spam to the GRAVE
        </Text>
      </VStack>
    </VStack>
  );
};

export default JoinGravePannel;
