import React from 'react';
import {
  Badge,
  Box,
  Flex,
  HStack,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
  Button,
} from '@chakra-ui/react';
import { ChevronDownIcon, ExternalLinkIcon, InfoIcon } from '@chakra-ui/icons';
import { formatAddress } from '@/utils/utils';
import { LSP3ProfileData, resolveIpfsUrl } from '@/utils/addressMetadata';

interface LSP3ProfileCardProps {
  data: LSP3ProfileData;
  address: string;
  ipfsGateway: string;
}

const LSP3ProfileCard: React.FC<LSP3ProfileCardProps> = ({
  data,
  address,
  ipfsGateway,
}) => {
  const { name, description, links, profileImage, backgroundImage } = data;
  const displayName = name
    ? `@${name}#${address.slice(2, 6)}`
    : formatAddress(address);

  const bgImage = backgroundImage?.[0]?.url
    ? resolveIpfsUrl(backgroundImage[0].url, ipfsGateway)
    : '';
  const profileImg = profileImage?.[0]?.url
    ? resolveIpfsUrl(profileImage[0].url, ipfsGateway)
    : '';

  return (
    <Box
      borderRadius="lg"
      bg="white"
      borderWidth="1px"
      borderColor="dark.purple.200"
      boxShadow="sm"
      maxW="xs"
      overflow="hidden"
    >
      <Box
        bgImage={bgImage}
        bgSize="cover"
        bgPosition="center"
        height="64px"
      />
      <Flex direction="column" px={3} pb={3}>
        <Flex align="center" gap={3} mt={-6} mb={2}>
          {profileImg ? (
            <Image
              borderRadius="full"
              boxSize="52px"
              src={profileImg}
              alt={name || 'Profile'}
              border="3px solid white"
              objectFit="cover"
              bg="white"
            />
          ) : (
            <Box
              borderRadius="full"
              boxSize="52px"
              border="2px solid"
              borderColor="dark.purple.200"
              bg="dark.purple.100"
            />
          )}
          <Box flex="1">
            <HStack spacing={2} align="center">
              <Text fontSize="sm" fontWeight="bold" color="dark.purple.500">
                {displayName}
              </Text>
              {description && (
                <Tooltip
                  label={description}
                  fontSize="sm"
                  placement="top"
                  hasArrow
                  bg="white"
                  color="black"
                  boxShadow="md"
                >
                  <IconButton
                    aria-label="Profile Description"
                    icon={<InfoIcon />}
                    size="xs"
                    variant="ghost"
                  />
                </Tooltip>
              )}
            </HStack>
          </Box>
          <Badge
            bg="dark.purple.100"
            color="dark.purple.500"
            fontSize="0.6rem"
            px={2}
            py={1}
            borderRadius="md"
          >
            Profile
          </Badge>
        </Flex>
        {!!links?.length && (
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              size="xs"
              variant="ghost"
              aria-label="Profile Links"
              alignSelf="flex-start"
            >
              <ExternalLinkIcon />
            </MenuButton>
            <MenuList>
              {links.map((link, index) => (
                <MenuItem key={index}>
                  <a href={link.url} target="_blank" rel="noreferrer">
                    <HStack>
                      <Text>{link.title}</Text>
                      <ExternalLinkIcon />
                    </HStack>
                  </a>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        )}
      </Flex>
    </Box>
  );
};

export default LSP3ProfileCard;
