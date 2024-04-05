import React from 'react';
import { Box, Container, Heading, Link, Text } from '@chakra-ui/react';
import { constants } from '@/app/constants';

export const metadata = {
  title: 'GRAVE - Terms of Service',
  description: 'Terms of Service',
  openGraph: {
    images: {
      url: `https://${constants.DOMAIN}/images/ghoulie.jpg`,
    },
  },
  twitter: {
    images: `https://${constants.DOMAIN}/images/ghoulie.jpg`,
    card: 'summary_large_image',
  },
};

export default function TermsOfService() {
  const companyName = 'YearOne';
  return (
    <Container maxW="container.md">
      {/* Navigation Links (Optional) */}
      <Box as="nav" my={4} flexWrap={'wrap'}>
        <Link href="#terms-of-service" mr={4}>
          Terms of Service
        </Link>
        <Link href="#privacy-policy" mr={4}>
          Privacy Policy
        </Link>
        <Link href="#intellectual-property-rights" mr={4}>
          IP Rights
        </Link>
        <Link href="#limitations-of-liability" mr={4}>
          Limitations of Liability
        </Link>
        <Link href="#modification-and-termination" mr={4}>
          Modification and Termination
        </Link>
        <Link href="#dispute-resolution" mr={4}>
          Dispute Resolution
        </Link>
        <Link href="#final-provisions" mr={4}>
          Final Provisions
        </Link>
      </Box>
      <Box my={8}>
        {/* TOS */}
        <Heading id="terms" as="h1" size="lg" mb={6}>
          Terms of Service
        </Heading>
        {/* Introduction */}
        <Heading as="h2" size="md" mt={10}>
          1. Introduction
        </Heading>
        <Text mt={4}>
          Welcome to Universal Grave - the Global Reserve for Abandoned Virtual
          Entities. These Terms of Service ("Terms") govern your use of our
          decentralized application ("dApp") and services ("Services"). By
          interacting with Universal Grave, you agree to be bound by these
          Terms. If you disagree with any part of the terms, then you may not
          access the Service.
        </Text>
        {/* Services Provided */}
        <Heading as="h2" size="md" mt={10}>
          2. Services Provided
        </Heading>
        <Text mt={4}>
          Universal Grave addresses the issue of spam in the Web3 space by
          enabling Universal Profile (LSP0) accounts to redirect unwanted LSP7
          and LSP8 digital assets to a specialized Vault, termed the Universal
          Grave. Users can 'revive' desired assets from the GRAVE back to their
          Universal Profile.
        </Text>
        {/* Use of Service */}
        <Heading as="h2" size="md" mt={10}>
          3. Use of Service
        </Heading>
        <Text mt={4}>
          You agree to use Universal Grave in compliance with all applicable
          laws and regulations and not for any unlawful purposes. The
          functionality of retrieving and forwarding assets is subject to the
          rules and conditions set forth in these Terms.
        </Text>

        {/* Risk Disclaimer */}
        <Heading id="disclaimer" as="h1" size="lg" mb={4} mt={20}>
          Risk Disclaimer
        </Heading>
        <Heading as="h2" size="md" mt={10}>
          1. General Risks
        </Heading>
        <Text mt={4}>
          You acknowledge that interacting with blockchain technology and
          digital assets involves significant risks including, but not limited
          to, the risk of financial loss, the volatility of digital assets, and
          the risk of unforeseen legal implications. You agree to assume all
          such risks associated with the use of Universal Grave.
        </Text>
        <Heading as="h2" size="md" mt={10}>
          2. No Warranty
        </Heading>
        <Text mt={4}>
          Universal Grave is provided "as is" and "as available" without any
          warranties, express or implied. We do not guarantee the continuous,
          uninterrupted, or error-free operability of the services.
        </Text>

        {/* Privacy Policy */}
        <Heading id="privacy" as="h1" size="lg" mb={4} mt={20}>
          Privacy Policy
        </Heading>
        <Heading as="h2" size="md" mt={10}>
          1. Data Collection and Use
        </Heading>
        <Text mt={4}>
          While Universal Grave operates on blockchain technology and does not
          directly collect personal data, please be aware that all transactions
          are public and immutable due to the nature of blockchain.
        </Text>

        {/* Intellectual Property Rights */}
        <Heading id="ip" as="h1" size="lg" mb={4} mt={20}>
          Intellectual Property Rights
        </Heading>
        <Heading as="h2" size="md" mt={10}>
          1. Ownership
        </Heading>
        <Text mt={4}>
          Universal Grave, its original content, features, and functionality are
          and will remain the exclusive property of {companyName} and its
          licensors. Our trademarks and trade dress may not be used in
          connection with any product or service without the prior written
          consent of {companyName}.
        </Text>

        {/* Limitation of Liability */}
        <Heading id="limitations" as="h1" size="lg" mb={4} mt={20}>
          Limitation of Liability
        </Heading>
        <Heading as="h2" size="md" mt={10}>
          1. Limitation Clause
        </Heading>
        <Text mt={4}>
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
          have been informed of the possibility of such damage, and even if a
          remedy set forth herein is found to have failed of its essential
          purpose.
        </Text>

        {/* Modification and Termination */}
        <Heading
          id="modification-and-termination"
          as="h1"
          size="lg"
          mb={4}
          mt={20}
        >
          Modification and Termination
        </Heading>
        <Heading as="h2" size="md" mt={10}>
          1. Right to Modify or Discontinue
        </Heading>
        <Text mt={4}>
          We reserve the right to modify or discontinue, temporarily or
          permanently, the Service (or any part thereof) with or without notice
          at any time. You agree that {companyName} shall not be liable to you
          or to any third party for any modification, suspension, or
          discontinuance of the Service.
        </Text>

        {/* Dispute Resolution */}
        <Heading id="dispute-resolution" as="h1" size="lg" mb={4} mt={20}>
          Dispute Resolution
        </Heading>
        <Heading as="h2" size="md" mt={10}>
          1. Governing Law
        </Heading>
        <Text mt={4}>
          These Terms shall be governed and construed in accordance with the
          laws of the United Arab Emirates, without regard to its conflict of
          law provisions.
        </Text>
        <Heading as="h2" size="md" mt={10}>
          2. Disputes
        </Heading>
        <Text mt={4}>
          Any disputes arising out of or related to these Terms will be resolved
          through binding arbitration in accordance with the laws of the United
          Arab Emirates.
        </Text>

        {/* Final Provisions */}
        <Heading id="final-provisions" as="h1" size="lg" mb={4} mt={20}>
          Final Provisions
        </Heading>
        <Heading as="h2" size="md" mt={10}>
          1. Entire Agreement
        </Heading>
        <Text mt={4}>
          These Terms constitute the entire agreement between us regarding our
          Service, and supersede and replace any prior agreements we might have
          between us regarding the Service.
        </Text>
        <Heading as="h2" size="md" mt={10}>
          2. Non-Waiver
        </Heading>
        <Text mt={4}>
          The failure of us to enforce any right or provision of these Terms
          will not be considered a waiver of those rights.
        </Text>
      </Box>
    </Container>
  );
}
