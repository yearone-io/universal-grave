import React, { useState } from 'react';
import { Box, Button, Flex, Image } from '@chakra-ui/react';
import { useProfile } from '@/contexts/ProfileProvider';

const SignInButton: React.FC = () => {
  const { connectAndSign } = useProfile();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await connectAndSign();
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      border={'1px solid var(--chakra-colors-dark-purple-500)'}
      isLoading={isLoading}
    >
      <Flex alignItems="center" justifyContent="space-between">
        <Image src="/images/LYX-logo.svg" alt="Sign In" />
        <Box
          ml="10px"
          fontSize="14px"
          lineHeight="14px"
          fontFamily="Bungee"
          fontWeight="400"
          color={'dark.purple.500'}
        >
          {isLoading ? '...' : 'Sign In'}
        </Box>
      </Flex>
    </Button>
  );
};

export default SignInButton;
