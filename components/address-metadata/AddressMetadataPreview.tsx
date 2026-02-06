'use client';

import React, { useEffect, useState } from 'react';
import { Box, HStack, Text, Image, Badge, Link } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { isAddress } from 'ethers';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { constants } from '@/app/constants';
import {
  AddressMetadata,
  readAddressMetadata,
  resolveIpfsUrl,
} from '@/utils/addressMetadata';
import { formatAddress } from '@/utils/tokenUtils';
import LSP3ProfileCard from './LSP3ProfileCard';
import LSP4DigitalAssetCard from './LSP4DigitalAssetCard';

interface AddressMetadataPreviewProps {
  address: string;
  chainId?: number;
  isDisabled?: boolean;
  /** If true, shows a link to Hashlists instead of Universal Everything */
  useHashlistsLink?: boolean;
}

const isZeroAddress = (value: string) => /^0x0+$/.test(value.toLowerCase());

const AddressMetadataPreview: React.FC<AddressMetadataPreviewProps> = ({
  address,
  chainId,
  isDisabled = false,
  useHashlistsLink = false,
}) => {
  const [debouncedAddress, setDebouncedAddress] = useState('');
  const [metadata, setMetadata] = useState<AddressMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setDebouncedAddress('');
      return;
    }
    const handle = setTimeout(() => {
      setDebouncedAddress(address.trim());
    }, 350);
    return () => clearTimeout(handle);
  }, [address]);

  useEffect(() => {
    if (isDisabled) {
      setMetadata(null);
      setIsLoading(false);
      return;
    }
    if (!debouncedAddress || !isAddress(debouncedAddress)) {
      setMetadata(null);
      setIsLoading(false);
      return;
    }
    if (isZeroAddress(debouncedAddress)) {
      setMetadata(null);
      setIsLoading(false);
      return;
    }
    if (!chainId) {
      setMetadata(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    readAddressMetadata(debouncedAddress, chainId)
      .then(result => {
        if (!cancelled) {
          setMetadata(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMetadata(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedAddress, chainId, isDisabled]);

  if (
    isDisabled ||
    !debouncedAddress ||
    !isAddress(debouncedAddress) ||
    isZeroAddress(debouncedAddress)
  ) {
    return null;
  }

  if (isLoading) {
    return (
      <Text fontSize="xs" color="dark.purple.500" mt={2}>
        Loading metadata…
      </Text>
    );
  }

  if (!metadata || metadata.kind === 'unknown') {
    return null;
  }

  const ipfsGateway =
    chainId !== undefined
      ? supportedNetworks[chainId.toString()]?.ipfsGateway || constants.IPFS
      : constants.IPFS;

  // Compact view with Hashlists link for curated lists
  if (useHashlistsLink) {
    const isProfile = !!metadata.profile;
    const isAsset = !!metadata.asset;

    let iconUrl = '';
    let displayName = formatAddress(metadata.address);

    if (isProfile && metadata.profile) {
      const profileImg = metadata.profile.profileImage?.[0]?.url;
      iconUrl = profileImg ? resolveIpfsUrl(profileImg, ipfsGateway) : '';
      displayName = metadata.profile.name || formatAddress(metadata.address);
    } else if (isAsset && metadata.asset) {
      const iconImg = metadata.asset.icon?.[0]?.url;
      iconUrl = iconImg ? resolveIpfsUrl(iconImg, ipfsGateway) : '';
      displayName = metadata.asset.name || metadata.tokenName || formatAddress(metadata.address);
    }

    const hashlistsUrl = `https://hashlists.xyz/curated-lists/${chainId}/${metadata.address}`;

    return (
      <Box
        mt={2}
        p={3}
        bg="white"
        borderRadius="lg"
        border="1px solid"
        borderColor="dark.purple.200"
      >
        <HStack spacing={3}>
          {iconUrl ? (
            <Image
              src={iconUrl}
              alt={displayName}
              boxSize="32px"
              borderRadius="lg"
              objectFit="cover"
              bg="dark.purple.100"
            />
          ) : (
            <Box
              boxSize="32px"
              borderRadius="lg"
              bg="dark.purple.100"
            />
          )}
          <Box flex={1}>
            <Text fontSize="sm" fontWeight="600" color="dark.purple.500" noOfLines={1}>
              {displayName}
            </Text>
            <Link
              href={hashlistsUrl}
              isExternal
              fontSize="xs"
              color="dark.purple.400"
              _hover={{ color: 'dark.purple.500' }}
            >
              View on Hashlists <ExternalLinkIcon mx="2px" />
            </Link>
          </Box>
          <Badge
            bg="dark.purple.100"
            color="dark.purple.500"
            fontSize="0.6rem"
            px={2}
            py={1}
            borderRadius="md"
          >
            Curated List
          </Badge>
        </HStack>
      </Box>
    );
  }

  return (
    <Box mt={2}>
      <HStack spacing={3} align="flex-start" flexWrap="wrap">
        {metadata.profile && (
          <LSP3ProfileCard
            data={metadata.profile}
            address={metadata.address}
            ipfsGateway={ipfsGateway}
            chainId={chainId}
          />
        )}
        {metadata.asset && (
          <LSP4DigitalAssetCard
            data={metadata.asset}
            tokenName={metadata.tokenName}
            ipfsGateway={ipfsGateway}
            chainId={chainId}
            address={metadata.address}
          />
        )}
      </HStack>
    </Box>
  );
};

export default AddressMetadataPreview;
