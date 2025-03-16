import React from 'react';
import { Container } from '@chakra-ui/react';
import GraveClient from '@/components/GraveClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GRAVE - Graveyard',
  description: 'List of assets in your graveyard',
};

export default function Grave({ params }: { params: { networkName: string; account: string; } }) {
  return (
    <Container maxW={'6xl'} width={'100%'} py={5}>
      <GraveClient networkName={params.networkName} graveOwner={params.account} />
    </Container>
  );
}
