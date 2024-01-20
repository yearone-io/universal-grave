import { Metadata } from 'next';
import { Box, Container, Text } from '@chakra-ui/react';
import LSPAssets from '@/components/LSPAssets';

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

export default function Grave({ params }: { params: { account: string } }) {
  return (
    <Container maxW={'6xl'} width={'100%'} py={5}>
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
        <LSPAssets account={params.account} />
      </Box>
    </Container>
  );
}
