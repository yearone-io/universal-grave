import React from 'react';
import { Box, Container, Heading, Text } from '@chakra-ui/react';
import { constants } from '@/app/constants';

export const metadata = {
  title: 'About',
  description: 'GRAVE - About',
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
  return (
    <Container maxW="container.md">
      <Box my={8}>
        {/* About */}
        <Heading id="terms" as="h1" size="lg" mb={6}>
          About the Universal GRAVE - a Global Reserve for Abandoned Virtual
          Entities
        </Heading>
        {/* Problem */}
        <Heading as="h2" size="md" mt={10}>
          Web3's Great Spam Problem
        </Heading>
        <Text mt={4}>
          Spam presents a significant challenge in the Web3 space. Due to the
          public and permissionless nature of these networks there is an
          overwhelming volume of content being transferred across blockchain
          wallets and contracts. Attention curation and information filtering
          become essential in such circumstances in order to maintain a healthy
          blockchain ecosystem.
        </Text>
        <Text mt={4}>
          A common issue is the receipt of unwanted fungible and non-fungible
          tokens, with users having no ability to reject these transactions.
          This lack of opt-out options diminishes the signal-to-noise ratio in
          the ecosystem. Many examples of this can be seen on Ethereum accounts
          believed to belong to prominent figures, frequently inundated with
          numerous spam token transfers, airdrops, meme coins, NFTs, and
          seemingly outright scams, without any ability to reject or protect
          themselves from those threats.
        </Text>
        {/* Solution */}
        <Heading as="h2" size="md" mt={10}>
          On Lukso, We Send Spam to the GRAVE
        </Heading>
        <Text mt={4}>
          Thankfully not all of web3 is built the same and a solution to the
          web3 spam problem is possible on the Lukso network. We've built the
          GRAVE through an innovative application of the LUKSO's LSP0 and LSP1
          standards, offering the first viable blockchain solution to spam. A
          proof of concept of this idea handling LSP7 (tokens) and LSP8 (NFTs)
          digital assets was the winner of the LUKSO BuildUP Hackathon hosted in
          November of 2023.
        </Text>
        <Text mt={4}>
          The Universal GRAVE allows users to automatically redirect unwanted
          digital assets to a specialized LSP9 Vault, termed the Universal
          GRAVE. Users can also further manage these assets and 'revive' desired
          assets from the GRAVE back to their Universal Profiles (LUKSO
          wallets). This solution is a significant step towards addressing the
          spam issue in the Web3 space, and a valuable addition to the LUKSO
          ecosystem.
        </Text>
      </Box>
    </Container>
  );
}
