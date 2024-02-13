import { ReactNode } from 'react';
import {
  Box,
  chakra,
  Container,
  Icon,
  Stack,
  useColorModeValue,
  VisuallyHidden,
  Flex,
  Image,
} from '@chakra-ui/react';
import { FaTwitter, FaMoon, FaGithub } from 'react-icons/fa';
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
      bg={useColorModeValue('light.gray.100', 'dark.purple.500')}
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
        bg: useColorModeValue('light.green.brand', 'dark.purple.300'),
      }}
    >
      <VisuallyHidden>{label}</VisuallyHidden>
      {children}
    </chakra.button>
  );
};

export default function SmallWithLogoLeft() {
  const colorModeIcon = FaMoon;
  const logoPath = '/images/logo-text.png';

  return (
    <Box
      bg={useColorModeValue('light.gray.100', 'dark.purple.500')}
      color={useColorModeValue('light.black', 'dark.white')}
      borderTop={useColorModeValue(
        '1px solid var(--chakra-colors-light-black)',
        '1px solid var(--chakra-colors-dark-purple-100)'
      )}
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
        <Flex gap="7px" justifyContent="center" alignItems="center">
          <Image src={logoPath} alt="Universal-Grave-logo" width={'40px'} />
        </Flex>
        <Flex gap="7px" justifyContent="center" alignItems="center">
          © 2023 Universal Grave. All rights reserved
          <Icon as={colorModeIcon} />
        </Flex>
        <Stack direction={'row'} spacing={6} alignItems={'center'}>
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
        </Stack>
      </Container>
    </Box>
  );
}
