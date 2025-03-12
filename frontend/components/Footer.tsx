'use client';
import React, { ReactNode } from 'react';
import {
  Box,
  chakra,
  Container,
  Stack,
  VisuallyHidden,
  Flex,
  Image,
  Select,
} from '@chakra-ui/react';
import { FaTwitter, FaGithub } from 'react-icons/fa';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const SocialButton = ({
  children,
  label,
  href,
}: {
  children: ReactNode;
  label: string;
  href: string;
}) => {
  return (
    <chakra.button
      bg={'dark.purple.500'}
      rounded={'full'}
      w={8}
      h={8}
      cursor={'pointer'}
      as={'a'}
      href={href}
      target={'_blank'}
      display={'inline-flex'}
      alignItems={'center'}
      justifyContent={'center'}
      transition={'background 0.3s ease'}
      _hover={{
        bg: 'dark.purple.300',
      }}
    >
      <VisuallyHidden>{label}</VisuallyHidden>
      {children}
    </chakra.button>
  );
};

export default function SmallWithLogoLeft() {
  const logoPath = '/images/logo-text.png';
  // Get the current pathname (e.g. "/lukso/catalog")
  const pathname = usePathname();
  const router = useRouter();

  // Split the pathname and filter out empty segments.
  const pathSegments = pathname.split('/').filter(seg => seg.length > 0);
  // The network name is assumed to be the first segment in the URL.
  const networkNameFromUrl = pathSegments[0] || '';

  // Determine the current network: if the URL contains "lukso-testnet" then use that, otherwise default to "lukso".
  const currentNetwork =
    networkNameFromUrl.toLowerCase() === 'lukso-testnet'
      ? 'lukso-testnet'
      : '/';

  // When the network selection changes, redirect the user to the new network's home page.
  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedNetwork = e.target.value;
    router.push(`/${selectedNetwork}`);
  };
  return (
    <Box
      bg={'dark.purple.500'}
      color={'dark.white'}
      borderTop={'1px solid var(--chakra-colors-dark-purple-100)'}
      mt={5}
    >
      <Container
        as={Stack}
        maxW={'6xl'}
        py={5}
        direction={{ base: 'column', md: 'row' }}
        spacing={4}
        justify={{ base: 'center', md: 'space-between' }}
        align={{ base: 'center', md: 'center' }}
      >
        <Flex gap={3} justifyContent="center" alignItems="center">
          <Image src={logoPath} alt="Universal-Grave-logo" width={'40px'} />
          <Box>© 2024 Universal GRAVE</Box>
        </Flex>
        <Flex
          gap={6}
          justifyContent={'center'}
          alignItems={'center'}
          flexWrap={'wrap'}
        >
          <SocialButton
            label={'Twitter'}
            href={'https://twitter.com/YearOneIO'}
          >
            <FaTwitter />
          </SocialButton>
          <SocialButton label={'Github'} href={'https://github.com/yearone-io'}>
            <FaGithub />
          </SocialButton>
          <Link href={'/about'}>About</Link>
          <Link href={'/terms'}>Terms</Link>
          <Link href={'/terms#privacy'}>Privacy</Link>
          <Link href={'/feedback'}>Feedback</Link>
          <Box minWidth={'170'}>
            <Select
              size="sm"
              value={currentNetwork}
              onChange={handleNetworkChange}
              focusBorderColor="transparent"
              _focus={{ boxShadow: 'none' }}
              cursor={'pointer'}
            >
              <option value="/">LUKSO</option>
              <option value="lukso-testnet">LUKSO Testnet</option>
            </Select>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}
