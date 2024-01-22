import { Metadata } from 'next';
import { Box, Container, Image, Stack, Text } from '@chakra-ui/react';
import React from 'react';
import GravePagePanel from '@/components/GravePagePanel';
import GravePageAssets from '@/components/GravePageAssets';

export const metadata: Metadata = {
  title: 'GRAVEYARD',
  description: 'List of assets in graveyard',
  openGraph: {
    images: {
      url: 'https://universal-grave.netlify.app/images/ghoulie.jpg',
    },
  },
  twitter: {
    images: 'https://universal-grave.netlify.app/images/ghoulie.jpg',
    card: 'summary_large_image',
  },
};

const logoPath = '/images/logo-full.png';
export default function Grave({ params }: { params: { account: string } }) {
  return (
    <Container maxW={'6xl'} width={'100%'} py={5}>
      <Stack
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align="center"
        w="100%"
        pt="50px"
      >
        <GravePagePanel account={params.account} />
        <Image
          mx={'40px'}
          src={logoPath}
          alt="Universal-Grave-logo"
          width={'300px'}
        />
      </Stack>
      <Box>
        <Text
          fontSize="20px"
          color="white"
          fontFamily="Bungee"
          mb="30px"
          mt="30px"
        >
          GRAVEYARD
        </Text>
        <GravePageAssets account={params.account} />
      </Box>
    </Container>
  );
}
