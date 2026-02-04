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
import { LSP4Metadata, resolveIpfsUrl } from '@/utils/addressMetadata';
import { getUniversalEverythingUrl } from '@/utils/universalEverything';

interface LSP4DigitalAssetCardProps {
  data: LSP4Metadata;
  tokenName?: string;
  ipfsGateway: string;
  chainId?: number;
  address: string;
}

const LSP4DigitalAssetCard: React.FC<LSP4DigitalAssetCardProps> = ({
  data,
  tokenName,
  ipfsGateway,
  chainId,
  address,
}) => {
  const { name, description, links, images, icon } = data;
  const displayName = name || tokenName || 'Digital Asset';

  const bgImage = images?.[0]?.[0]?.url
    ? resolveIpfsUrl(images[0][0].url, ipfsGateway)
    : '';
  const iconImage = icon?.[0]?.url
    ? resolveIpfsUrl(icon[0].url, ipfsGateway)
    : '';
  const externalUrl = getUniversalEverythingUrl(chainId, 'asset', address);

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
          {iconImage ? (
            <Image
              borderRadius="full"
              boxSize="52px"
              src={iconImage}
              alt={displayName}
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
                    aria-label="Asset Description"
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
            Digital Asset
          </Badge>
        </Flex>
        <HStack spacing={3} align="center">
          {!!links?.length && (
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                size="xs"
                variant="ghost"
                aria-label="Asset Links"
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
          <a href={externalUrl} target="_blank" rel="noreferrer">
            <HStack spacing={1}>
              <Text fontSize="xs" color="dark.purple.500">
                View on Universal Everything
              </Text>
              <ExternalLinkIcon fontSize="xs" />
            </HStack>
          </a>
        </HStack>
      </Flex>
    </Box>
  );
};

export default LSP4DigitalAssetCard;
