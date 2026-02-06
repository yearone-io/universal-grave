'use client';

import { Box, Container, Flex, Text, Button, HStack, Spinner } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import SignInBox from '@/components/SignInBox';
import React, { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileProvider';
import { useGrave } from '@/contexts/GraveContext';
import Link from 'next/link';
import GraveSubscription from '@/components/GraveSubscription';

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

interface GraveSettingsProps {
  networkName: string;
}

export default function GraveSettings({ networkName }: GraveSettingsProps) {
  const { profileDetailsData, isConnected } = useProfile();
  const { hasUAPSubscription, setupType, uapVaultAddress, isLoadingGraveData } = useGrave();

  // Protection is truly active only if we have UAP subscription AND the forwarder is configured
  // After deactivation, hasUAPSubscription may still be true (URD still set) but setupType will be 'none'
  const isProtectionActive = hasUAPSubscription && (setupType === 'uap' || setupType === 'both');
  const account = profileDetailsData?.upWallet || null;

  // Prevent hydration mismatch by waiting for client mount
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show loading state during SSR and initial hydration
  if (!isMounted) {
    return (
      <Box minH="100vh" bg="#00001E">
        <Container maxW="3xl" pt={{ base: 8, md: 16 }} pb={{ base: 16, md: 24 }}>
          <Flex direction="column" align="center" justify="center" minH="400px">
            <Spinner size="lg" color="whiteAlpha.600" />
          </Flex>
        </Container>
      </Box>
    );
  }

  if (!isConnected || !account) {
    return (
      <Box minH="100vh" bg="#00001E">
        <Container maxW="2xl" py={{ base: 12, md: 20 }}>
          <SignInBox />
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="#00001E">
      {/* Ambient background glow */}
      <Box
        position="fixed"
        top="0"
        left="50%"
        transform="translateX(-50%)"
        width="100%"
        height="600px"
        bgGradient="radial(ellipse at 50% 0%, rgba(133, 47, 187, 0.15) 0%, transparent 70%)"
        pointerEvents="none"
        zIndex={0}
      />

      <Container maxW="3xl" pt={{ base: 8, md: 16 }} pb={{ base: 16, md: 24 }} position="relative" zIndex={1}>
        {/* Header */}
        <Flex
          direction="column"
          align="center"
          textAlign="center"
          mb={{ base: 10, md: 14 }}
        >
          {/* Status pill */}
          {isProtectionActive && !isLoadingGraveData && (
            <Box
              bg="rgba(138, 251, 234, 0.15)"
              border="1px solid rgba(138, 251, 234, 0.3)"
              borderRadius="full"
              px={4}
              py={1.5}
              mb={6}
            >
              <HStack spacing={2}>
                <Box
                  w={2}
                  h={2}
                  borderRadius="full"
                  bg="dark.teal.500"
                  boxShadow="0 0 8px rgba(138, 251, 234, 0.6)"
                />
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  color="dark.teal.500"
                  letterSpacing="0.5px"
                  textTransform="uppercase"
                >
                  Protection Active
                </Text>
              </HStack>
            </Box>
          )}

          {/* Main title */}
          <Text
            fontSize={{ base: '32px', md: '44px' }}
            fontFamily="Bungee"
            color="white"
            lineHeight="1.1"
            mb={4}
          >
            {isProtectionActive ? 'Spambox Settings' : 'Spam Protection'}
          </Text>

          {/* Subtitle */}
          <Text
            fontSize={{ base: 'md', md: 'lg' }}
            color="whiteAlpha.700"
            maxW="480px"
            lineHeight="1.6"
          >
            {isProtectionActive
              ? 'Fine-tune your filters and manage your spambox vault.'
              : 'Shield your Universal Profile from unwanted tokens. One click, always protected.'}
          </Text>

          {/* View Graveyard link - only show when protected */}
          {isProtectionActive && !isLoadingGraveData && (
            <Link href={`/${networkName}/grave/${account}`}>
              <Button
                mt={6}
                variant="ghost"
                color="whiteAlpha.800"
                fontSize="sm"
                fontWeight="500"
                fontFamily="Montserrat"
                _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                rightIcon={
                  <Box as="span" ml={1}>
                    &rarr;
                  </Box>
                }
              >
                View your Graveyard
              </Button>
            </Link>
          )}
        </Flex>

        {/* Main content card */}
        <Box
          bg="rgba(255, 255, 255, 0.03)"
          backdropFilter="blur(20px)"
          borderRadius="3xl"
          border="1px solid rgba(255, 255, 255, 0.08)"
          overflow="hidden"
          boxShadow="0 25px 80px rgba(0, 0, 0, 0.4)"
        >
          {/* Loading state shimmer */}
          {isLoadingGraveData && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              height="3px"
              bgGradient="linear(to-r, transparent, dark.purple.300, transparent)"
              bgSize="200% 100%"
              animation={`${shimmer} 1.5s infinite`}
            />
          )}

          <Box p={{ base: 6, md: 10 }}>
            <GraveSubscription networkName={networkName} />
          </Box>
        </Box>

        {/* Footer links */}
        <Flex
          justify="center"
          mt={10}
          gap={6}
          flexWrap="wrap"
        >
          <Link href={`/${networkName}/grave/settings/diagnostics`}>
            <Text
              fontSize="sm"
              color="whiteAlpha.500"
              _hover={{ color: 'whiteAlpha.800' }}
              cursor="pointer"
              transition="color 0.2s"
            >
              Diagnostics
            </Text>
          </Link>
          <Link href="/about">
            <Text
              fontSize="sm"
              color="whiteAlpha.500"
              _hover={{ color: 'whiteAlpha.800' }}
              cursor="pointer"
              transition="color 0.2s"
            >
              About GRAVE
            </Text>
          </Link>
          <Link href="/feedback">
            <Text
              fontSize="sm"
              color="whiteAlpha.500"
              _hover={{ color: 'whiteAlpha.800' }}
              cursor="pointer"
              transition="color 0.2s"
            >
              Give Feedback
            </Text>
          </Link>
        </Flex>
      </Container>
    </Box>
  );
}
