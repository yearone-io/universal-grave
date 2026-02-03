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
import { FaTwitter, FaMoon, FaGithub } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  supportedNetworks,
  getNetworkByName,
} from '@/constants/supportedNetworks';

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

interface FooterProps {
  networkName: string;
}

export default function SmallWithLogoLeft({ networkName }: FooterProps) {
  const logoPath = '/images/logo-text.png';
  const router = useRouter();

  const handleNetworkChange = (newNetworkName: string) => {
    // Navigate to the same path on the new network
    const currentPath = window.location.pathname;
    const pathWithoutNetwork = currentPath.replace(`/${networkName}`, '');
    router.push(`/${newNetworkName}${pathWithoutNetwork || ''}`);
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
          <Stack spacing={1}>
            <Box fontSize="xs" color="dark.white">
              Powered by{' '}
              <chakra.a
                href="https://github.com/yearone-io/universal-assistant-protocol"
                target="_blank"
                rel="noreferrer"
                textDecoration="underline"
                _hover={{ color: 'dark.purple.100' }}
              >
                🆙 Assistants
              </chakra.a>
            </Box>
          </Stack>
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
          <Link href={`/${networkName}/about`}>About</Link>
          <Link href={`/${networkName}/terms`}>Terms</Link>
          <Link href={`/${networkName}/terms#privacy`}>Privacy</Link>
          <Link href={`/${networkName}/feedback`}>Feedback</Link>
          <Box minWidth={'170'}>
            <Select
              value={networkName}
              onChange={event => handleNetworkChange(event.target.value)}
            >
              <option value={'lukso'}>LUKSO Mainnet</option>
              <option value={'lukso-testnet'}>LUKSO Testnet</option>
            </Select>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}
