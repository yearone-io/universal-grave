import React, { useContext } from 'react';
import { Box, Button, Flex, Image, useToast } from '@chakra-ui/react';
import { WalletContext } from './wallet/WalletContext';

const SignInButton: React.FC = () => {
  const walletContext = useContext(WalletContext);
  const { connect, isLoadingAccount, networkConfig, connectedChainId } =
    walletContext;
  const toast = useToast();

  const onSignInClick = async () => {
    if (connectedChainId !== networkConfig.chainId) {
      try {
        await window.lukso.request({
          method: 'wallet_switchEthereumChain',
          params: [
            { chainId: '0x' + BigInt(networkConfig.chainId).toString(16) },
          ],
        });
      } catch (error: any) {
        toast({
          title: `Error switching network. ${error.message}`,
          status: 'error',
          position: 'bottom-left',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    }
    await connect();
  };

  return (
    <Button
      onClick={onSignInClick}
      border={'1px solid var(--chakra-colors-dark-purple-500)'}
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
          {isLoadingAccount ? '...' : 'Sign In'}
        </Box>
      </Flex>
    </Button>
  );
};

export default SignInButton;
