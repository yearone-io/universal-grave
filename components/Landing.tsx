'use client';
import {
  Box,
  Button,
  Container,
  Flex,
  Icon,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Text,
} from '@chakra-ui/react';
import Link from 'next/link';
import { BsActivity, BsArrow90DegRight, BsListCheck, BsShieldCheck } from 'react-icons/bs';
import LSPExplainer from '@/components/LSPExplainer';
import { ChangeEvent, useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileProvider';
import InstallationCounter from '@/components/InstallationCounter';

interface LandingProps {
  networkName: string;
}

export default function Landing({ networkName }: LandingProps) {
  const { profileDetailsData, isConnected } = useProfile();
  const account = profileDetailsData?.upWallet || null;
  // TODO: graveVault will be retrieved from GRAVE context
  const graveVault = undefined;
  const logoPath = '/images/logo-full.png';
  const subheadingColor = 'dark.white';
  const panelBgColor = 'dark.purple.200';
  const customColor = 'var(--chakra-colors-dark-purple-500)';
  const borderColor = 'var(--chakra-colors-dark-purple-200)';
  const createButtonBg = 'dark.white';
  const createButtonColor = 'var(--chakra-colors-dark-purple-500)';
  const createButtonBorder = '1px solid var(--chakra-colors-dark-purple-500)';
  const [inputValue, setInputValue] = useState<string>();
  const defaultGraveButtonText = 'Protect your 🆙 with a GRAVE';
  const [graveButtonText, setGraveButtonText] = useState<string>(
    defaultGraveButtonText
  );

  useEffect(() => {
    if (!graveVault) {
      setGraveButtonText(defaultGraveButtonText);
    } else {
      setGraveButtonText('Manage the assets in your 🆙 Grave');
    }
  }, [graveVault, account]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleClick = () => {
    console.log('inputValue', inputValue);
    window.location.href = `/${networkName}/grave/${inputValue}`;
  };

  return (
    <Container
      as={Stack}
      maxW={'6xl'}
      py={5}
      px={5}
      direction={'column'}
      spacing={16}
      justify={{ base: 'center', md: 'center' }}
      align={{ base: 'center', md: 'center' }}
    >
      <Flex
        pt={{ base: 8, md: 5 }}
        flexDirection={{ base: 'column', md: 'row' }}
        justify={{ base: 'center', md: 'space-between' }}
        align={{ base: 'center', md: 'center' }}
        gap={{ base: 0, md: 6 }}
        w={'100%'}
      >
        <Flex
          my={{ base: 5, sm: 8, lg: 15 }}
          gap={{ base: 4, sm: 5, lg: 6 }}
          flexDirection={'column'}
          alignItems={'left'}
          justifyContent={'center'}
        >
          <Text
            color={subheadingColor}
            fontSize={{ base: '2xl', sm: 'xl', lg: '3xl' }}
            lineHeight={{ base: '120%', sm: '120%', lg: '130%' }}
            fontFamily={'Montserrat'}
            fontWeight={800}
          >
            {'Send the junk to the GRAVE. Keep the good stuff.'}
          </Text>
          <Text
            color={subheadingColor}
            fontSize={{ base: 'sm', sm: 'sm', md: 'md' }}
            fontFamily={'Montserrat'}
            fontWeight={500}
            lineHeight={'160%'}
          >
            {`GRAVE is your spam cemetery for digital assets. Anything you don't want gets redirected automatically, and you can bring back anything you like later. Simple, safe, and totally in your control.`}
          </Text>
          <Link href={`/${networkName}/grave/settings`} passHref>
            <Button
              px={6}
              color={createButtonColor}
              bg={createButtonBg}
              _hover={{ bg: createButtonBg }}
              border={createButtonBorder}
              size={['sm', 'sm', 'md', 'md']}
            >
              {graveButtonText}
            </Button>
          </Link>
          <Text>Or peek inside any profile's GRAVE</Text>
          <InputGroup size="md">
            <Input
              placeholder="Paste UP profile address"
              value={inputValue}
              onChange={handleInputChange}
              borderColor={borderColor}
            ></Input>
            <InputRightElement width="4.5rem">
              <Button h="1.75rem" size="sm" onClick={handleClick}>
                Go
              </Button>
            </InputRightElement>
          </InputGroup>
        </Flex>
        <Flex
          flexDirection={'column'}
          alignItems={'center'}
          justifyContent={'center'}
          px={'40px'}
        >
          <Image src={logoPath} alt="Universal-Grave-logo" minWidth={'300px'} />
        </Flex>
      </Flex>
      <InstallationCounter />
      <Box mb={{ base: 5, sm: 8, lg: 16 }}>
        <Text
          pb={5}
          color={subheadingColor}
          fontSize={{ base: 'lg', sm: 'lg', md: 'xl' }}
          fontFamily={'Montserrat'}
          fontWeight={800}
        >
          {'How GRAVE works'}
        </Text>
        <Flex
          flexDirection={{ base: 'column', md: 'row' }}
          justify={{ base: 'center', md: 'center' }}
          align={{ base: 'center', md: 'center' }}
          gap={{ base: 3, md: 4 }}
          flexWrap={'wrap'}
        >
          <LSPExplainer
            title={'Auto‑redirect anything you don’t want'}
            description={'Like a spam filter, but for assets.'}
            badgeText={
              <Icon as={BsArrow90DegRight} color={customColor} boxSize={7} />
            }
          />
          <LSPExplainer
            title={'Make VIP lists for what stays'}
            description={'Approve creators and assets with one click.'}
            badgeText={<Icon as={BsListCheck} color={customColor} boxSize={7} />}
          />
          <LSPExplainer
            title={'Bring back the good stuff anytime'}
            description={'Rescue assets from your GRAVE on demand.'}
            badgeText={<Icon as={BsShieldCheck} color={customColor} boxSize={7} />}
          />
          <LSPExplainer
            title={'Works with modern LUKSO tokens'}
            description={'LSP7 & LSP8 support out of the box.'}
            learnURL={'https://docs.lukso.tech/standards/tokens/introduction'}
            badgeText={<Icon as={BsActivity} color={customColor} boxSize={7} />}
          />
        </Flex>
      </Box>
    </Container>
  );
}
