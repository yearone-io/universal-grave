import React from 'react';
import { Container } from '@chakra-ui/react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GRAVEYARD',
  description: 'Feedback',
};

export default function Feedback({ params }: { params: { account: string } }) {
  return (
    <Container maxW={'6xl'} width={'100%'} py={5}>
      <iframe
        src="https://docs.google.com/forms/d/e/1FAIpQLSf4VD8-cNIKYL-LYgaLpMkkU21Xm9SBZOeOUCKSb65z9GqRWQ/viewform?embedded=true"
        width="100%"
        height="700"
        frameBorder="0"
        marginHeight={0}
        marginWidth={0}
      >
        Loading…
      </iframe>
    </Container>
  );
}
