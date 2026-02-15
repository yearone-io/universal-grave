'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Text,
  VStack,
  HStack,
  Flex,
  Icon,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  ArrowForwardIcon,
  CopyIcon,
  LockIcon,
  QuestionOutlineIcon,
  StarIcon,
  ViewIcon,
} from '@chakra-ui/icons';
import Link from 'next/link';

interface FeatureBlockProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureBlock({ icon, title, description }: FeatureBlockProps) {
  return (
    <HStack align="flex-start" spacing={4}>
      <Flex
        w={10}
        h={10}
        borderRadius="lg"
        bg="rgba(138, 251, 234, 0.1)"
        border="1px solid rgba(138, 251, 234, 0.2)"
        align="center"
        justify="center"
        flexShrink={0}
      >
        <Icon as={icon} boxSize={5} color="dark.teal.500" />
      </Flex>
      <VStack align="flex-start" spacing={1}>
        <Text
          fontSize="lg"
          fontWeight="700"
          color="white"
          fontFamily="Montserrat"
        >
          {title}
        </Text>
        <Text
          fontSize="md"
          color="whiteAlpha.700"
          fontFamily="Montserrat"
          lineHeight="1.7"
        >
          {description}
        </Text>
      </VStack>
    </HStack>
  );
}

export default function AboutPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <Box minH="100vh" bg="#00001E" />;
  }

  return (
    <Box minH="100vh" bg="#00001E" overflow="hidden">
      {/* Ambient background glow */}
      <Box
        position="fixed"
        top="0"
        left="50%"
        transform="translateX(-50%)"
        width="100%"
        height="800px"
        bgGradient="radial(ellipse at 50% 0%, rgba(133, 47, 187, 0.15) 0%, transparent 60%)"
        pointerEvents="none"
        zIndex={0}
      />

      <Container maxW="4xl" pt={{ base: 10, md: 20 }} pb={{ base: 16, md: 24 }} position="relative" zIndex={1}>
        {/* Header */}
        <VStack spacing={6} textAlign="center" mb={{ base: 12, md: 16 }}>
          <Text
            fontSize={{ base: '10px', md: '12px' }}
            fontWeight="600"
            color="dark.teal.500"
            letterSpacing="2px"
            textTransform="uppercase"
          >
            About GRAVE
          </Text>
          <Text
            fontSize={{ base: '32px', md: '44px' }}
            fontFamily="Bungee"
            color="white"
            lineHeight="1.1"
          >
            The Evolution of Asset Protection
          </Text>
          <Text
            fontSize={{ base: 'md', md: 'lg' }}
            color="whiteAlpha.600"
            maxW="700px"
            lineHeight="1.8"
            fontFamily="Montserrat"
          >
            From hackathon winner to a powerful showcase of what's possible when you combine
            LUKSO's Universal Receiver Delegate with the Universal Assistant Protocol's modular design.
          </Text>
        </VStack>

        {/* Origin Story */}
        <Box
          bg="rgba(255, 255, 255, 0.03)"
          backdropFilter="blur(20px)"
          borderRadius="3xl"
          border="1px solid rgba(255, 255, 255, 0.08)"
          p={{ base: 6, md: 10 }}
          mb={{ base: 8, md: 12 }}
        >
          <VStack align="flex-start" spacing={6}>
            <HStack spacing={3}>
              <Box w={1} h={8} bg="dark.purple.400" borderRadius="full" />
              <Text
                fontSize={{ base: 'xl', md: '2xl' }}
                fontFamily="Bungee"
                color="white"
              >
                Where It Started
              </Text>
            </HStack>
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color="whiteAlpha.700"
              lineHeight="1.8"
              fontFamily="Montserrat"
            >
              GRAVE began as a solution to Web3's spam problem. On permissionless networks,
              anyone can send you tokens - whether you want them or not. Ethereum wallets
              belonging to prominent figures are constantly flooded with spam tokens, airdrops,
              meme coins, and outright scams, with no way to refuse them.
            </Text>
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color="whiteAlpha.700"
              lineHeight="1.8"
              fontFamily="Montserrat"
            >
              Our proof of concept won the{' '}
              <Box as="span" color="dark.teal.500" fontWeight="600">
                LUKSO BuildUP Hackathon in November 2023
              </Box>
              , demonstrating that LUKSO's smart account architecture could finally solve
              this problem. But that was just the beginning.
            </Text>
          </VStack>
        </Box>

        {/* The UAP Section */}
        <Box
          bg="rgba(255, 255, 255, 0.03)"
          backdropFilter="blur(20px)"
          borderRadius="3xl"
          border="1px solid rgba(255, 255, 255, 0.08)"
          p={{ base: 6, md: 10 }}
          mb={{ base: 8, md: 12 }}
        >
          <VStack align="flex-start" spacing={6}>
            <HStack spacing={3}>
              <Box w={1} h={8} bg="dark.teal.500" borderRadius="full" />
              <Text
                fontSize={{ base: 'xl', md: '2xl' }}
                fontFamily="Bungee"
                color="white"
              >
                Powered by the Universal Assistant Protocol
              </Text>
            </HStack>
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color="whiteAlpha.700"
              lineHeight="1.8"
              fontFamily="Montserrat"
            >
              Today, GRAVE runs on the{' '}
              <Box as="span" color="dark.teal.500" fontWeight="600">
                Universal Assistant Protocol (UAP)
              </Box>
              {' '}- a modular framework that transforms how Universal Profiles interact
              with incoming transactions. Instead of a single-purpose spam filter, UAP
              enables a composable system of "Assistants" that can work together to
              automate, filter, and enhance your on-chain experience.
            </Text>
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color="whiteAlpha.700"
              lineHeight="1.8"
              fontFamily="Montserrat"
            >
              GRAVE's spam protection is just{' '}
              <Box as="span" color="white" fontWeight="600">
                one type of UAP Assistant
              </Box>
              . The same architecture can power auto-accepting NFTs from trusted creators,
              forwarding tokens to specific vaults, triggering actions based on asset types,
              and countless other automated behaviors - all without compromising your profile's security.
            </Text>
          </VStack>
        </Box>

        {/* LUKSO Standards */}
        <Box
          bg="rgba(255, 255, 255, 0.03)"
          backdropFilter="blur(20px)"
          borderRadius="3xl"
          border="1px solid rgba(255, 255, 255, 0.08)"
          p={{ base: 6, md: 10 }}
          mb={{ base: 8, md: 12 }}
        >
          <VStack align="flex-start" spacing={8}>
            <VStack align="flex-start" spacing={4}>
              <HStack spacing={3}>
                <Box w={1} h={8} bg="dark.purple.400" borderRadius="full" />
                <Text
                  fontSize={{ base: 'xl', md: '2xl' }}
                  fontFamily="Bungee"
                  color="white"
                >
                  Built on LUKSO Standards
                </Text>
              </HStack>
              <Text
                fontSize={{ base: 'md', md: 'lg' }}
                color="whiteAlpha.700"
                lineHeight="1.8"
                fontFamily="Montserrat"
              >
                LUKSO's LSP standards unlock capabilities impossible on other chains.
                GRAVE showcases the power of this architecture:
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="100%">
              <FeatureBlock
                icon={ViewIcon}
                title="LSP0 - Universal Profile"
                description="Smart contract accounts that can hold data, execute transactions, and delegate behaviors to other contracts."
              />
              <FeatureBlock
                icon={StarIcon}
                title="LSP1 - Universal Receiver"
                description="The hook that intercepts incoming transactions, enabling real-time filtering and automated responses."
              />
              <FeatureBlock
                icon={CopyIcon}
                title="LSP7 & LSP8 Tokens"
                description="Modern token standards with built-in notifications, enabling assets to announce themselves on arrival."
              />
              <FeatureBlock
                icon={LockIcon}
                title="LSP9 - Vault"
                description="Secure sub-accounts owned by your profile, perfect for isolating filtered assets while keeping them recoverable."
              />
            </SimpleGrid>
          </VStack>
        </Box>

        {/* What Makes This Possible */}
        <Box
          bg="rgba(255, 255, 255, 0.03)"
          backdropFilter="blur(20px)"
          borderRadius="3xl"
          border="1px solid rgba(255, 255, 255, 0.08)"
          p={{ base: 6, md: 10 }}
          mb={{ base: 8, md: 12 }}
        >
          <VStack align="flex-start" spacing={6}>
            <HStack spacing={3}>
              <Box w={1} h={8} bg="dark.teal.500" borderRadius="full" />
              <Text
                fontSize={{ base: 'xl', md: '2xl' }}
                fontFamily="Bungee"
                color="white"
              >
                Why This Matters
              </Text>
            </HStack>
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color="whiteAlpha.700"
              lineHeight="1.8"
              fontFamily="Montserrat"
            >
              On Ethereum, your wallet is passive - it accepts whatever it's sent. On LUKSO,
              your Universal Profile is{' '}
              <Box as="span" color="white" fontWeight="600">active and intelligent</Box>.
              It can inspect incoming assets, make decisions, and take actions autonomously.
            </Text>
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color="whiteAlpha.700"
              lineHeight="1.8"
              fontFamily="Montserrat"
            >
              GRAVE demonstrates that spam filtering is just the beginning. The same primitives
              enable subscription payments, automated portfolio management, social features,
              and applications we haven't imagined yet. This is what dynamic, programmable
              identity looks like.
            </Text>
          </VStack>
        </Box>

        {/* The Vision */}
        <Box
          bg="linear-gradient(135deg, rgba(133, 47, 187, 0.15) 0%, rgba(138, 251, 234, 0.1) 100%)"
          backdropFilter="blur(20px)"
          borderRadius="3xl"
          border="1px solid rgba(255, 255, 255, 0.1)"
          p={{ base: 6, md: 10 }}
          mb={{ base: 12, md: 16 }}
        >
          <VStack spacing={6} textAlign="center">
            <QuestionOutlineIcon boxSize={10} color="dark.teal.500" />
            <Text
              fontSize={{ base: 'xl', md: '2xl' }}
              fontFamily="Bungee"
              color="white"
            >
              One Protocol, Infinite Possibilities
            </Text>
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color="whiteAlpha.700"
              lineHeight="1.8"
              fontFamily="Montserrat"
              maxW="600px"
            >
              GRAVE proves that LUKSO's architecture enables a new class of blockchain applications.
              As UAP grows, your Universal Profile becomes smarter - automatically handling
              the complexity of on-chain life while you stay in control.
            </Text>
            <Link href="/lukso/grave/settings">
              <HStack
                spacing={2}
                color="dark.teal.500"
                fontWeight="600"
                fontFamily="Montserrat"
                cursor="pointer"
                _hover={{ color: 'dark.teal.400' }}
                transition="color 0.2s"
                pt={2}
              >
                <Text>Get protected now</Text>
                <ArrowForwardIcon />
              </HStack>
            </Link>
          </VStack>
        </Box>

      </Container>
    </Box>
  );
}
