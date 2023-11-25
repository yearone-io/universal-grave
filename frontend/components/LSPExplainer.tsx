import {
  Box,
  Flex,
  Text,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaExternalLinkAlt } from 'react-icons/fa';

// Add a props interface for TypeScript (if you're using it)
interface LSPExplainerProps {
  title: string; // for "LSP7 Digital Assets"
  description: string; // for "The most advanced token standard"
  learnURL: string; // URL for the "Learn More" button
  badgeText: string; // for "LSP7"
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
      px={4}
      py={4}
      align="center"
      justify="space-between"
      boxShadow="md"
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

      <Flex w={'100%'} flexDirection={'column'} padding={2} gap={2}>
        <Flex flexDirection={'row'} gap={1} alignItems={'center'}>
          <Text color={fontColor} fontFamily={'Bungee'}>
            {title}
          </Text>
          <IconButton
            aria-label={'lean more url'}
            icon={<FaExternalLinkAlt color={fontColor} />}
            color={fontColor}
            size="sm"
            variant="ghost"
            onClick={() => window.open(`${learnURL}`, '_blank')}
          />
        </Flex>
        <Flex
          flexDirection={'row'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Flex align="center">
            <Text fontSize="sm" pr={2} color={fontColor}>
              {description}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default LSPExplainer;
