import React from 'react';
import { Container } from '@chakra-ui/react';
import GraveContents from '@/components/GraveContents';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GRAVE - Graveyard',
  description: 'List of assets in your graveyard',
};

export default function Grave({ params }: { params: { account: string } }) {
  return (
    <Container maxW={'6xl'} width={'100%'} py={5}>
      <GraveContents graveOwner={params.account} />
    </Container>
  );
}
