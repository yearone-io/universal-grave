import {
  Box,
  Flex,
  Text,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaExternalLinkAlt } from 'react-icons/fa';

interface LSPExplainerProps {
  title: string;
  badgeText: any;
  description?: string;
  learnURL?: string;
}

const LSPExplainer: React.FC<LSPExplainerProps> = ({
  title,
  description,
  learnURL,
  badgeText,
}) => {
  const containerBorderColor = useColorModeValue(
    'var(--chakra-colors-light-black)',
    'var(--chakra-colors-dark-purple-500)'
  );
  const panelBgColor = useColorModeValue('light.white', 'dark.purple.200');
  const interestsBgColor = useColorModeValue('light.white', 'dark.white');
  const fontColor = useColorModeValue('light.black', 'dark.purple.500');

  return (
    <Flex
      bg={panelBgColor}
      borderRadius="lg"
      p={6}
      align="center"
      gap={4}
      boxShadow="md"
      width={'100%'}
      maxWidth={{ base: '100%', md: '550px' }}
      minHeight={{ base: '100px', md: '145px' }}
    >
      <Flex
        bg={interestsBgColor}
        borderRadius="full"
        color={fontColor}
        border={`1px solid ${containerBorderColor}`}
        fontSize="md"
        padding={1}
        height={16}
        minW={16}
        justifyContent={'center'}
        alignItems={'center'}
      >
        <Box fontWeight={'bold'}>{badgeText}</Box>
      </Flex>

      <Flex w={'100%'} flexDirection={'column'} padding={2} gap={1}>
        <Flex flexDirection={'row'} gap={1} alignItems={'center'}>
          <Text
            color={fontColor}
            fontSize={{ base: 'md', lg: 'lg' }}
            lineHeight={{ base: '120%', sm: '120%', lg: '130%' }}
            fontFamily={'Montserrat'}
            fontWeight={700}
          >
            {title}
          </Text>
          {!!learnURL && (
            <IconButton
              aria-label={'lean more url'}
              icon={<FaExternalLinkAlt color={fontColor} />}
              color={fontColor}
              size="sm"
              variant="ghost"
              onClick={() => window.open(`${learnURL}`, '_blank')}
            />
          )}
        </Flex>
        {!!description && (
          <Text
            fontSize={{ base: 'sm', lg: 'md' }}
            lineHeight={{ base: 'sm', lg: 'md' }}
            fontWeight={400}
            pr={2}
            color={fontColor}
          >
            {description}
          </Text>
        )}
      </Flex>
    </Flex>
  );
};

export default LSPExplainer;
