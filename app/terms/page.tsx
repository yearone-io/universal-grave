'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Text,
  VStack,
  HStack,
  Flex,
  Link,
} from '@chakra-ui/react';

export default function TermsOfService() {
  const companyName = 'YearOne';
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
        <VStack spacing={6} textAlign="center" mb={{ base: 10, md: 14 }}>
          <Text
            fontSize={{ base: '10px', md: '12px' }}
            fontWeight="600"
            color="dark.teal.500"
            letterSpacing="2px"
            textTransform="uppercase"
          >
            Legal
          </Text>
          <Text
            fontSize={{ base: '32px', md: '44px' }}
            fontFamily="Bungee"
            color="white"
            lineHeight="1.1"
          >
            Terms & Privacy
          </Text>
        </VStack>

        {/* Navigation */}
        <Box
          bg="rgba(255, 255, 255, 0.03)"
          backdropFilter="blur(20px)"
          borderRadius="2xl"
          border="1px solid rgba(255, 255, 255, 0.08)"
          p={{ base: 4, md: 6 }}
          mb={{ base: 8, md: 12 }}
        >
          <Flex gap={4} flexWrap="wrap" justify="center">
            {[
              { href: '#terms-of-service', label: 'Terms of Service' },
              { href: '#privacy', label: 'Privacy Policy' },
              { href: '#ip', label: 'IP Rights' },
              { href: '#limitations', label: 'Liability' },
              { href: '#dispute-resolution', label: 'Disputes' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                fontSize="sm"
                color="whiteAlpha.600"
                fontFamily="Montserrat"
                fontWeight="500"
                px={3}
                py={1}
                borderRadius="full"
                _hover={{
                  color: 'dark.teal.500',
                  bg: 'rgba(138, 251, 234, 0.1)',
                }}
                transition="all 0.2s"
              >
                {item.label}
              </Link>
            ))}
          </Flex>
        </Box>

        {/* Terms of Service */}
        <SectionCard id="terms-of-service" accentColor="purple">
          <SectionTitle>Terms of Service</SectionTitle>

          <SubSection title="1. Introduction">
            Welcome to Universal Grave - the Global Reserve for Abandoned Virtual
            Entities. These Terms of Service ("Terms") govern your use of our
            decentralized application ("dApp") and services ("Services"). By
            interacting with Universal Grave, you agree to be bound by these
            Terms. If you disagree with any part of the terms, then you may not
            access the Service.
          </SubSection>

          <SubSection title="2. Services Provided">
            Universal Grave addresses the issue of spam in the Web3 space by
            enabling Universal Profile (LSP0) accounts to redirect unwanted LSP7
            and LSP8 digital assets to a specialized Vault, termed the Universal
            Grave. Users can 'revive' desired assets from the GRAVE back to their
            Universal Profile.
          </SubSection>

          <SubSection title="3. Use of Service">
            You agree to use Universal Grave in compliance with all applicable
            laws and regulations and not for any unlawful purposes. The
            functionality of retrieving and forwarding assets is subject to the
            rules and conditions set forth in these Terms.
          </SubSection>
        </SectionCard>

        {/* Risk Disclaimer */}
        <SectionCard accentColor="teal">
          <SectionTitle>Risk Disclaimer</SectionTitle>

          <SubSection title="1. General Risks">
            You acknowledge that interacting with blockchain technology and
            digital assets involves significant risks including, but not limited
            to, the risk of financial loss, the volatility of digital assets, and
            the risk of unforeseen legal implications. You agree to assume all
            such risks associated with the use of Universal Grave.
          </SubSection>

          <SubSection title="2. No Warranty">
            Universal Grave is provided "as is" and "as available" without any
            warranties, express or implied. We do not guarantee the continuous,
            uninterrupted, or error-free operability of the services.
          </SubSection>
        </SectionCard>

        {/* Privacy Policy */}
        <SectionCard id="privacy" accentColor="purple">
          <SectionTitle>Privacy Policy</SectionTitle>

          <SubSection title="1. Data Collection and Use">
            While Universal Grave operates on blockchain technology and does not
            directly collect personal data, please be aware that all transactions
            are public and immutable due to the nature of blockchain.
          </SubSection>
        </SectionCard>

        {/* Intellectual Property Rights */}
        <SectionCard id="ip" accentColor="teal">
          <SectionTitle>Intellectual Property Rights</SectionTitle>

          <SubSection title="1. Ownership">
            Universal Grave, its original content, features, and functionality are
            and will remain the exclusive property of {companyName} and its
            licensors. Our trademarks and trade dress may not be used in
            connection with any product or service without the prior written
            consent of {companyName}.
          </SubSection>
        </SectionCard>

        {/* Limitation of Liability */}
        <SectionCard id="limitations" accentColor="purple">
          <SectionTitle>Limitation of Liability</SectionTitle>

          <SubSection title="1. Limitation Clause">
            In no event shall {companyName}, nor its directors, employees,
            partners, agents, suppliers, or affiliates, be liable for any
            indirect, incidental, special, consequential, or punitive damages,
            including without limitation, loss of profits, data, or other
            intangible losses, resulting from (i) your access to or use of or
            inability to access or use the Service; (ii) any conduct or content of
            any third party on the Service; (iii) any content obtained from the
            Service; and (iv) unauthorized access, use or alteration of your
            transmissions or content, whether based on warranty, contract, tort
            (including negligence) or any other legal theory, whether or not we
            have been informed of the possibility of such damage.
          </SubSection>
        </SectionCard>

        {/* Modification and Termination */}
        <SectionCard accentColor="teal">
          <SectionTitle>Modification and Termination</SectionTitle>

          <SubSection title="1. Right to Modify or Discontinue">
            We reserve the right to modify or discontinue, temporarily or
            permanently, the Service (or any part thereof) with or without notice
            at any time. You agree that {companyName} shall not be liable to you
            or to any third party for any modification, suspension, or
            discontinuance of the Service.
          </SubSection>
        </SectionCard>

        {/* Dispute Resolution */}
        <SectionCard id="dispute-resolution" accentColor="purple">
          <SectionTitle>Dispute Resolution</SectionTitle>

          <SubSection title="1. Governing Law">
            These Terms shall be governed and construed in accordance with the
            laws of the United Arab Emirates, without regard to its conflict of
            law provisions.
          </SubSection>

          <SubSection title="2. Disputes">
            Any disputes arising out of or related to these Terms will be resolved
            through binding arbitration in accordance with the laws of the United
            Arab Emirates.
          </SubSection>
        </SectionCard>

        {/* Final Provisions */}
        <SectionCard id="final-provisions" accentColor="teal">
          <SectionTitle>Final Provisions</SectionTitle>

          <SubSection title="1. Entire Agreement">
            These Terms constitute the entire agreement between us regarding our
            Service, and supersede and replace any prior agreements we might have
            between us regarding the Service.
          </SubSection>

          <SubSection title="2. Non-Waiver">
            The failure of us to enforce any right or provision of these Terms
            will not be considered a waiver of those rights.
          </SubSection>
        </SectionCard>
      </Container>
    </Box>
  );
}

function SectionCard({
  children,
  id,
  accentColor = 'purple'
}: {
  children: React.ReactNode;
  id?: string;
  accentColor?: 'purple' | 'teal';
}) {
  return (
    <Box
      id={id}
      bg="rgba(255, 255, 255, 0.03)"
      backdropFilter="blur(20px)"
      borderRadius="3xl"
      border="1px solid rgba(255, 255, 255, 0.08)"
      p={{ base: 6, md: 10 }}
      mb={{ base: 6, md: 8 }}
      scrollMarginTop="100px"
    >
      <VStack align="flex-start" spacing={6}>
        {children}
      </VStack>
    </Box>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <HStack spacing={3}>
      <Box w={1} h={8} bg="dark.purple.400" borderRadius="full" />
      <Text
        fontSize={{ base: 'xl', md: '2xl' }}
        fontFamily="Bungee"
        color="white"
      >
        {children}
      </Text>
    </HStack>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <VStack align="flex-start" spacing={2} w="100%">
      <Text
        fontSize={{ base: 'md', md: 'lg' }}
        fontWeight="600"
        color="dark.teal.500"
        fontFamily="Montserrat"
      >
        {title}
      </Text>
      <Text
        fontSize={{ base: 'sm', md: 'md' }}
        color="whiteAlpha.700"
        lineHeight="1.8"
        fontFamily="Montserrat"
      >
        {children}
      </Text>
    </VStack>
  );
}
