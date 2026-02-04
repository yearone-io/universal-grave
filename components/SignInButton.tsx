import React, { useState } from 'react';
import { Box, Button, Flex, Image } from '@chakra-ui/react';
import { useProfile } from '@/contexts/ProfileProvider';
import { supportedNetworks } from '@/constants/supportedNetworks';

const SignInButton: React.FC = () => {
  const { connectAndSign, switchNetwork, expectedChainId, isNetworkMismatch } =
    useProfile();
  const expectedNetwork = expectedChainId
    ? supportedNetworks[expectedChainId.toString()]
    : null;
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      if (isNetworkMismatch && expectedChainId) {
        await switchNetwork(expectedChainId);
      } else {
        await connectAndSign();
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      variant="solidWhite"
      border="2px solid"
      borderColor="dark.purple.500"
      bg="dark.white"
      boxShadow="0 6px 16px rgba(0, 0, 0, 0.25)"
      _hover={{
        bg: 'dark.white',
        transform: 'translateY(-1px)',
        boxShadow: '0 8px 18px rgba(0, 0, 0, 0.3)',
      }}
      _active={{
        transform: 'translateY(0)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
      }}
      isLoading={isLoading}
    >
      <Flex alignItems="center" justifyContent="space-between">
        <Image src="/images/LYX-logo.svg" alt="Sign In" boxSize="18px" />
        <Box
          ml="10px"
          fontSize="14px"
          lineHeight="14px"
          fontFamily="Bungee"
          fontWeight="400"
          color={'dark.purple.500'}
        >
          {isLoading
            ? '...'
            : isNetworkMismatch
              ? `Switch to ${expectedNetwork?.displayName || 'Network'}`
              : 'Sign In'}
        </Box>
      </Flex>
    </Button>
  );
};

export default SignInButton;
