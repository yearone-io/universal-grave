'use client';

import React, { useEffect, useState } from 'react';
import { Box, HStack, Text, Image, Badge } from '@chakra-ui/react';
import { isAddress } from 'ethers';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { constants } from '@/app/constants';
import {
  AddressMetadata,
  readAddressMetadata,
  resolveIpfsUrl,
} from '@/utils/addressMetadata';
import { formatAddress } from '@/utils/tokenUtils';

interface AddressMetadataInlineProps {
  address: string;
  chainId?: number;
  isDisabled?: boolean;
}

const isZeroAddress = (value: string) => /^0x0+$/.test(value.toLowerCase());

/**
 * Compact inline metadata preview for addresses.
 * Shows icon, name, and type badge in a single row.
 */
const AddressMetadataInline: React.FC<AddressMetadataInlineProps> = ({
  address,
  chainId,
  isDisabled = false,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [debouncedAddress, setDebouncedAddress] = useState('');
  const [metadata, setMetadata] = useState<AddressMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!address) {
      setDebouncedAddress('');
      return;
    }
    const handle = setTimeout(() => {
      setDebouncedAddress(address.trim());
    }, 400);
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

  // Don't render anything on server or before mount
  if (!isMounted) {
    return null;
  }

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
      <HStack spacing={2} mt={2} p={2} bg="whiteAlpha.50" borderRadius="lg">
        <Box boxSize="24px" borderRadius="full" bg="whiteAlpha.200" />
        <Box height="14px" width="120px" bg="whiteAlpha.100" borderRadius="sm" />
      </HStack>
    );
  }

  if (!metadata || metadata.kind === 'unknown') {
    return null;
  }

  const ipfsGateway =
    chainId !== undefined
      ? supportedNetworks[chainId.toString()]?.ipfsGateway || constants.IPFS
      : constants.IPFS;

  // Get display info based on metadata type
  const isProfile = !!metadata.profile;
  const isAsset = !!metadata.asset;

  let iconUrl = '';
  let displayName = formatAddress(metadata.address);
  let typeLabel = 'Unknown';
  let typeBgColor = 'whiteAlpha.200';

  if (isProfile && metadata.profile) {
    const profileImg = metadata.profile.profileImage?.[0]?.url;
    iconUrl = profileImg ? resolveIpfsUrl(profileImg, ipfsGateway) : '';
    displayName = metadata.profile.name
      ? `@${metadata.profile.name}`
      : formatAddress(metadata.address);
    typeLabel = 'Profile';
    typeBgColor = 'dark.purple.300';
  } else if (isAsset && metadata.asset) {
    const iconImg = metadata.asset.icon?.[0]?.url;
    iconUrl = iconImg ? resolveIpfsUrl(iconImg, ipfsGateway) : '';
    displayName = metadata.asset.name || metadata.tokenName || 'Asset';
    typeLabel = 'Asset';
    typeBgColor = 'dark.teal.500';
  }

  return (
    <HStack
      spacing={3}
      mt={2}
      p={2}
      bg="whiteAlpha.50"
      borderRadius="lg"
      border="1px solid"
      borderColor="whiteAlpha.100"
    >
      {iconUrl ? (
        <Image
          src={iconUrl}
          alt={displayName}
          boxSize="24px"
          borderRadius="full"
          objectFit="cover"
          bg="whiteAlpha.200"
        />
      ) : (
        <Box
          boxSize="24px"
          borderRadius="full"
          bg="whiteAlpha.200"
        />
      )}
      <Text
        fontSize="xs"
        color="white"
        fontWeight="500"
        flex={1}
        noOfLines={1}
      >
        {displayName}
      </Text>
      <Badge
        bg={typeBgColor}
        color={isAsset ? 'dark.purple.500' : 'white'}
        fontSize="0.6rem"
        px={2}
        py={0.5}
        borderRadius="md"
        textTransform="uppercase"
      >
        {typeLabel}
      </Badge>
    </HStack>
  );
};

export default AddressMetadataInline;
