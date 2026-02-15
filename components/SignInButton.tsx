import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Image,
  useBreakpointValue,
  useToast,
} from '@chakra-ui/react';
import { useProfile } from '@/contexts/ProfileProvider';
import { supportedNetworks } from '@/constants/supportedNetworks';

const SignInButton: React.FC = () => {
  const {
    connectAndSign,
    switchNetwork,
    expectedChainId,
    isNetworkMismatch,
    isSigningIn,
  } = useProfile();
  const expectedNetwork = expectedChainId
    ? supportedNetworks[expectedChainId.toString()]
    : null;
  const isSmallScreen = useBreakpointValue({ base: true, sm: false }) ?? false;
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast({ position: 'bottom' });
  const hasDesktopUPExtension =
    typeof window !== 'undefined' && !!(window as any).lukso;
  const shouldShowExternalWalletPrompt = !hasDesktopUPExtension;
  const effectiveIsLoading = isLoading || isSigningIn;
  const showMobilePrompt = shouldShowExternalWalletPrompt && isSigningIn;
  const mobileSignInToastId = 'mobile-signin-prompt';

  useEffect(() => {
    if (showMobilePrompt) {
      if (!toast.isActive(mobileSignInToastId)) {
        toast({
          id: mobileSignInToastId,
          title: 'Complete sign-in in UP app',
          description: 'Select profile, sign, then return here.',
          status: 'warning',
          duration: null,
          isClosable: true,
        });
      }
      return;
    }

    if (toast.isActive(mobileSignInToastId)) {
      toast.close(mobileSignInToastId);
    }
  }, [showMobilePrompt, toast]);

  useEffect(
    () => () => {
      if (toast.isActive(mobileSignInToastId)) {
        toast.close(mobileSignInToastId);
      }
    },
    [toast]
  );

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      if (isNetworkMismatch && expectedChainId) {
        await switchNetwork(expectedChainId);
      } else {
        await connectAndSign();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to connect';
      console.error('Failed to connect:', error);
      toast({
        title: message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      });
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
      maxW={{ base: '145px', sm: 'none' }}
      isLoading={effectiveIsLoading}
    >
      <Flex alignItems="center" justifyContent="space-between" minW={0}>
        <Image src="/images/LYX-logo.svg" alt="Sign In" boxSize="18px" />
        <Box
          ml="10px"
          fontSize="14px"
          lineHeight="14px"
          fontFamily="Bungee"
          fontWeight="400"
          color={'dark.purple.500'}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {effectiveIsLoading
            ? '...'
            : isNetworkMismatch
              ? isSmallScreen
                ? 'Switch'
                : `Switch to ${expectedNetwork?.displayName || 'Network'}`
              : 'Sign In'}
        </Box>
      </Flex>
    </Button>
  );
};

export default SignInButton;
