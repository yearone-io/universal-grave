'use client';
import {
  Box,
  Button,
  Container,
  Flex,
  Icon,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  HStack,
  VStack,
  SimpleGrid,
} from '@chakra-ui/react';
import Link from 'next/link';
import {
  ArrowForwardIcon,
  CheckCircleIcon,
  LockIcon,
  RepeatIcon,
  StarIcon,
} from '@chakra-ui/icons';
import { ChangeEvent, useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileProvider';
import { useGrave } from '@/contexts/GraveContext';
import InstallationCounter from '@/components/InstallationCounter';

interface LandingProps {
  networkName: string;
}

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  accentColor?: string;
}

function FeatureCard({ icon, title, description, accentColor = 'dark.teal.500' }: FeatureCardProps) {
  return (
    <Box
      bg="rgba(255, 255, 255, 0.03)"
      backdropFilter="blur(20px)"
      borderRadius="2xl"
      border="1px solid rgba(255, 255, 255, 0.08)"
      p={{ base: 6, md: 8 }}
      transition="all 0.3s ease"
      _hover={{
        bg: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        transform: 'translateY(-4px)',
      }}
    >
      <Flex
        w={12}
        h={12}
        borderRadius="xl"
        bg={`rgba(138, 251, 234, 0.1)`}
        border="1px solid rgba(138, 251, 234, 0.2)"
        align="center"
        justify="center"
        mb={5}
      >
        <Icon as={icon} boxSize={6} color={accentColor} />
      </Flex>
      <Text
        fontSize={{ base: 'lg', md: 'xl' }}
        fontWeight="700"
        color="white"
        fontFamily="Montserrat"
        mb={2}
      >
        {title}
      </Text>
      <Text
        fontSize={{ base: 'sm', md: 'md' }}
        color="whiteAlpha.700"
        fontFamily="Montserrat"
        lineHeight="1.6"
      >
        {description}
      </Text>
    </Box>
  );
}

export default function Landing({ networkName }: LandingProps) {
  const { profileDetailsData, isConnected } = useProfile();
  const { hasUAPSubscription, setupType } = useGrave();

  const account = profileDetailsData?.upWallet || null;
  const isProtectionActive = hasUAPSubscription && (setupType === 'uap' || setupType === 'both');

  const [inputValue, setInputValue] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleLookup = () => {
    if (inputValue) {
      window.location.href = `/${networkName}/grave/${inputValue}`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue) {
      handleLookup();
    }
  };

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <Box minH="100vh" bg="#00001E" />
    );
  }

  return (
    <Box minH="100vh" bg="#00001E" overflow="hidden">
      {/* Ambient background glow - top */}
      <Box
        position="fixed"
        top="0"
        left="50%"
        transform="translateX(-50%)"
        width="100%"
        height="800px"
        bgGradient="radial(ellipse at 50% 0%, rgba(133, 47, 187, 0.2) 0%, transparent 60%)"
        pointerEvents="none"
        zIndex={0}
      />

      {/* Secondary glow - bottom right */}
      <Box
        position="fixed"
        bottom="0"
        right="0"
        width="600px"
        height="600px"
        bgGradient="radial(ellipse at 100% 100%, rgba(138, 251, 234, 0.08) 0%, transparent 60%)"
        pointerEvents="none"
        zIndex={0}
      />

      <Container maxW="6xl" pt={{ base: 8, md: 16 }} pb={{ base: 16, md: 24 }} position="relative" zIndex={1}>

        {/* Hero Section */}
        <Flex
          direction={{ base: 'column', lg: 'row' }}
          align="center"
          justify="space-between"
          gap={{ base: 10, lg: 16 }}
          mb={{ base: 16, md: 24 }}
        >
          {/* Hero Text */}
          <VStack
            align={{ base: 'center', lg: 'flex-start' }}
            textAlign={{ base: 'center', lg: 'left' }}
            spacing={6}
            flex={1}
            maxW={{ lg: '560px' }}
          >
            {/* Status badge for connected users */}
            {isConnected && isProtectionActive && (
              <Box
                bg="rgba(138, 251, 234, 0.15)"
                border="1px solid rgba(138, 251, 234, 0.3)"
                borderRadius="full"
                px={4}
                py={1.5}
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
                    You're Protected
                  </Text>
                </HStack>
              </Box>
            )}

            <Text
              fontSize={{ base: '36px', md: '48px', lg: '56px' }}
              fontFamily="Bungee"
              color="white"
              lineHeight="1.1"
            >
              Send the junk to{' '}
              <Box as="span" color="dark.teal.500">
                the GRAVE
              </Box>
            </Text>

            <Text
              fontSize={{ base: 'md', md: 'lg', lg: 'xl' }}
              color="whiteAlpha.700"
              lineHeight="1.7"
              fontFamily="Montserrat"
            >
              The spam cemetery for your digital assets. Unwanted tokens are automatically
              redirected, and you can bring back anything you like. Simple, safe, and
              totally in your control.
            </Text>

            {/* CTA Buttons */}
            <Flex
              gap={3}
              pt={2}
              w="100%"
              direction={{ base: 'column', sm: 'row' }}
              align={{ base: 'stretch', sm: 'center' }}
            >
              <Link href={`/${networkName}/grave/settings`} passHref>
                <Button
                  size="lg"
                  bg="dark.teal.500"
                  color="#00001E"
                  fontWeight="700"
                  fontFamily="Montserrat"
                  px={{ base: 6, sm: 8 }}
                  w={{ base: '100%', sm: 'auto' }}
                  _hover={{
                    bg: 'dark.teal.400',
                    transform: 'translateY(-2px)',
                  }}
                  transition="all 0.2s"
                  rightIcon={<ArrowForwardIcon />}
                >
                  {isConnected && isProtectionActive ? 'Manage Settings' : 'Get Protected'}
                </Button>
              </Link>
              {isConnected && account && (
                <Link href={`/${networkName}/grave/${account}`} passHref>
                  <Button
                    size="lg"
                    variant="outline"
                    borderColor="whiteAlpha.300"
                    color="white"
                    fontWeight="600"
                    fontFamily="Montserrat"
                    px={{ base: 6, sm: 6 }}
                    w={{ base: '100%', sm: 'auto' }}
                    _hover={{
                      bg: 'whiteAlpha.100',
                      borderColor: 'whiteAlpha.400',
                    }}
                  >
                    View Graveyard
                  </Button>
                </Link>
              )}
            </Flex>
          </VStack>

          {/* Hero Image */}
          <Flex
            flex={1}
            justify="center"
            align="center"
            position="relative"
          >
            <Box
              position="absolute"
              width="300px"
              height="300px"
              bgGradient="radial(ellipse at center, rgba(138, 251, 234, 0.15) 0%, transparent 70%)"
              filter="blur(40px)"
            />
            <Image
              src="/images/logo-full.png"
              alt="Universal GRAVE"
              maxW={{ base: '280px', md: '360px', lg: '420px' }}
              position="relative"
              zIndex={1}
            />
          </Flex>
        </Flex>

        {/* Stats Counter */}
        <Box mb={{ base: 16, md: 24 }}>
          <InstallationCounter networkName={networkName} />
        </Box>

        {/* Features Section */}
        <VStack spacing={{ base: 10, md: 14 }} mb={{ base: 16, md: 24 }}>
          <VStack spacing={4} textAlign="center">
            <Text
              fontSize={{ base: '28px', md: '36px' }}
              fontFamily="Bungee"
              color="white"
              lineHeight="1.2"
            >
              How it works
            </Text>
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color="whiteAlpha.600"
              maxW="600px"
              fontFamily="Montserrat"
            >
              GRAVE acts as an intelligent spam filter for your Universal Profile,
              automatically protecting you from unwanted tokens.
            </Text>
          </VStack>

          <SimpleGrid
            columns={{ base: 1, md: 2 }}
            spacing={{ base: 4, md: 6 }}
            w="100%"
          >
            <FeatureCard
              icon={LockIcon}
              title="Automatic Protection"
              description="Unknown tokens are instantly redirected to your spambox vault. No manual filtering needed - your profile stays clean."
            />
            <FeatureCard
              icon={CheckCircleIcon}
              title="Allowlists & Blocklists"
              description="Approve trusted creators, specific collections, or curated lists. You decide what gets through, always."
            />
            <FeatureCard
              icon={RepeatIcon}
              title="Rescue Anything"
              description="Made a mistake? Recover any asset from your GRAVE with one click. Nothing is ever truly lost."
            />
            <FeatureCard
              icon={StarIcon}
              title="LSP7 & LSP8 Support"
              description="Built for LUKSO's modern token standards. Full support for fungible and non-fungible tokens out of the box."
            />
          </SimpleGrid>
        </VStack>

        {/* Lookup Section */}
        <Box
          bg="rgba(255, 255, 255, 0.03)"
          backdropFilter="blur(20px)"
          borderRadius="3xl"
          border="1px solid rgba(255, 255, 255, 0.08)"
          p={{ base: 8, md: 12 }}
          textAlign="center"
          mb={{ base: 16, md: 24 }}
        >
          <VStack spacing={6}>
            <VStack spacing={3}>
              <Text
                fontSize={{ base: 'xl', md: '2xl' }}
                fontFamily="Bungee"
                color="white"
              >
                Explore any profile's GRAVE
              </Text>
              <Text
                fontSize={{ base: 'sm', md: 'md' }}
                color="whiteAlpha.600"
                fontFamily="Montserrat"
              >
                Peek inside anyone's graveyard to see what's been filtered
              </Text>
            </VStack>

            <InputGroup maxW="500px">
              <Input
                placeholder="Paste Universal Profile address"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                size="lg"
                bg="rgba(255, 255, 255, 0.05)"
                border="1px solid rgba(255, 255, 255, 0.1)"
                borderRadius="xl"
                color="white"
                fontFamily="Montserrat"
                _placeholder={{ color: 'whiteAlpha.400' }}
                _hover={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                _focus={{
                  borderColor: 'dark.teal.500',
                  boxShadow: '0 0 0 1px rgba(138, 251, 234, 0.3)',
                }}
              />
              <InputRightElement width="4.5rem" h="100%">
                <Button
                  h="calc(100% - 8px)"
                  size="sm"
                  bg="dark.teal.500"
                  color="#00001E"
                  fontWeight="600"
                  mr={1}
                  _hover={{ bg: 'dark.teal.400' }}
                  onClick={handleLookup}
                  isDisabled={!inputValue}
                >
                  Go
                </Button>
              </InputRightElement>
            </InputGroup>
          </VStack>
        </Box>

        {/* Footer Links */}
        <Flex
          justify="center"
          gap={8}
          flexWrap="wrap"
        >
          <Link href="/about">
            <Text
              fontSize="sm"
              color="whiteAlpha.500"
              _hover={{ color: 'whiteAlpha.800' }}
              cursor="pointer"
              transition="color 0.2s"
              fontFamily="Montserrat"
            >
              About GRAVE
            </Text>
          </Link>
          <Link href="https://docs.lukso.tech/standards/tokens/introduction" target="_blank">
            <Text
              fontSize="sm"
              color="whiteAlpha.500"
              _hover={{ color: 'whiteAlpha.800' }}
              cursor="pointer"
              transition="color 0.2s"
              fontFamily="Montserrat"
            >
              Learn about LSP Tokens
            </Text>
          </Link>
          <Link href="/feedback">
            <Text
              fontSize="sm"
              color="whiteAlpha.500"
              _hover={{ color: 'whiteAlpha.800' }}
              cursor="pointer"
              transition="color 0.2s"
              fontFamily="Montserrat"
            >
              Give Feedback
            </Text>
          </Link>
        </Flex>
      </Container>
    </Box>
  );
}
