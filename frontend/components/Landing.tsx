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
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { BsActivity, BsArrow90DegRight } from 'react-icons/bs';
import LSPExplainer from '@/components/LSPExplainer';
import { ChangeEvent, useState } from 'react';
import { WalletContext } from '@/components/wallet/WalletContext';
import { useContext, useEffect } from 'react';
import InstallationCounter from '@/components/InstallationCounter';

export default function Landing() {
  const walletContext = useContext(WalletContext);
  const { graveVault, account } = walletContext;
  const logoPath = '/images/logo-full.png';
  const subheadingColor = useColorModeValue('light.black', 'dark.white');
  const panelBgColor = useColorModeValue('light.white', 'dark.purple.200');
  const customColor = useColorModeValue(
    'light.black',
    'var(--chakra-colors-dark-purple-500)'
  );
  const borderColor = useColorModeValue(
    'var(--chakra-colors-light-black)',
    'var(--chakra-colors-dark-purple-200)'
  );
  const createButtonBg = useColorModeValue('light.green.brand', 'dark.white');
  const createButtonColor = useColorModeValue(
    'light.black',
    'var(--chakra-colors-dark-purple-500)'
  );
  const createButtonBorder = useColorModeValue(
    '1px solid black',
    '1px solid var(--chakra-colors-dark-purple-500)'
  );
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
    window.location.href = `/grave/${inputValue}`;
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
            {
              "Stop receiving assets you don't want. Redirect them to the GRAVE."
            }
          </Text>
          <Text
            color={subheadingColor}
            fontSize={{ base: 'sm', sm: 'sm', md: 'md' }}
            fontFamily={'Montserrat'}
            fontWeight={500}
            lineHeight={'160%'}
          >
            {`GRAVE - the Global Reserve For Abandoned Virtual Entities. A cemetery for unwanted digital assets. But given that one man's trash is another man's treasure, all assets have a chance at revival.`}
          </Text>
          <Link href={'/grave/settings'} passHref>
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
          <Text>Or view any Universal Profile's GRAVE</Text>
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
          {'How the GRAVE works'}
        </Text>
        <Flex
          flexDirection={{ base: 'column', md: 'row' }}
          justify={{ base: 'center', md: 'center' }}
          align={{ base: 'center', md: 'center' }}
          gap={{ base: 3, md: 4 }}
          flexWrap={'wrap'}
        >
          <LSPExplainer
            title={
              'Automatically redirects all unwanted digital assets to the GRAVE'
            }
            badgeText={
              <Icon as={BsArrow90DegRight} color={customColor} boxSize={7} />
            }
          />
          <LSPExplainer
            title={
              'Allows you to recover assets you approve of to your 🆙'
            }
            badgeText={<Icon as={BsActivity} color={customColor} boxSize={7} />}
          />
          <LSPExplainer
            title={'Supports the most advanced digital asset standards'}
            description={'Fungible and non-fungible (NFT) tokens'}
            learnURL={'https://docs.lukso.tech/standards/tokens/introduction'}
            badgeText={'LSPs'}
          />
        </Flex>
      </Box>
    </Container>
  );
}
