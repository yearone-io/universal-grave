import React from 'react';
import { Box, Container } from '@chakra-ui/react';
import GraveContents from '@/components/GraveContents';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GRAVE - Graveyard',
  description: 'List of assets in your graveyard',
};

export default async function Grave({
  params,
}: {
  params: Promise<{ networkName: string; account: string }>;
}) {
  const { account, networkName } = await params;
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
        <GraveContents graveOwner={account} networkName={networkName} />
      </Container>
    </Box>
  );
}
