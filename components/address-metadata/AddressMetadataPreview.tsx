'use client';

import React, { useEffect, useState } from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';
import { isAddress } from 'ethers';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { constants } from '@/app/constants';
import {
  AddressMetadata,
  readAddressMetadata,
} from '@/utils/addressMetadata';
import LSP3ProfileCard from './LSP3ProfileCard';
import LSP4DigitalAssetCard from './LSP4DigitalAssetCard';

interface AddressMetadataPreviewProps {
  address: string;
  chainId?: number;
  isDisabled?: boolean;
}

const isZeroAddress = (value: string) => /^0x0+$/.test(value.toLowerCase());

const AddressMetadataPreview: React.FC<AddressMetadataPreviewProps> = ({
  address,
  chainId,
  isDisabled = false,
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

  return (
    <Box mt={2}>
      <HStack spacing={3} align="flex-start" flexWrap="wrap">
        {metadata.profile && (
          <LSP3ProfileCard
            data={metadata.profile}
            address={metadata.address}
            ipfsGateway={ipfsGateway}
          />
        )}
        {metadata.asset && (
          <LSP4DigitalAssetCard
            data={metadata.asset}
            tokenName={metadata.tokenName}
            ipfsGateway={ipfsGateway}
          />
        )}
      </HStack>
    </Box>
  );
};

export default AddressMetadataPreview;
