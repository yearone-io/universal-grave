import React from 'react';
import { Avatar, Box, Flex, useColorModeValue } from '@chakra-ui/react';
import { getTokenIconURL } from '@/utils/tokenUtils';

export interface IAssetIcon {
  readonly lspType: string;
  readonly name: string | undefined;
  readonly LSP4Metadata: any | undefined;
}

export const AssetIcon = ({ lspType, name, LSP4Metadata }: IAssetIcon) => {
  const containerBorderColor = useColorModeValue(
    'var(--chakra-colors-light-black)',
    'var(--chakra-colors-dark-purple-500)'
  );
  const interestsBgColor = useColorModeValue('light.white', 'dark.white');
  const fontColor = useColorModeValue('light.black', 'dark.purple.500');
  const getTokenIcon = () => {
    const iconURL = getTokenIconURL(LSP4Metadata);
    return !iconURL ? (
      <Box padding={1} fontWeight={'bold'}>
        {lspType}
      </Box>
    ) : (
      <Avatar height={16} minW={16} name={name} src={iconURL} />
    );
  };
  return (
    <Flex
      bg={interestsBgColor}
      borderRadius="full"
      color={fontColor}
      border={`1px solid ${containerBorderColor}`}
      fontSize="md"
      height={16}
      minW={16}
      justifyContent={'center'}
      alignItems={'center'}
      boxSizing={'content-box'}
    >
      {getTokenIcon()}
    </Flex>
  );
};
