'use client';

import {
  Badge,
  Box,
  HStack,
  Image,
  Link,
  Spinner,
  Text,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { CreatorVerification } from '@/utils/creatorVerification';
import { formatAddress } from '@/utils/tokenUtils';
import {
  type AddressMetadata,
  readAddressMetadata,
  resolveIpfsUrl,
} from '@/utils/addressMetadata';
import { constants } from '@/app/constants';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { getUniversalEverythingUrl } from '@/utils/universalEverything';

interface AssetCreatorBadgesProps {
  creators?: CreatorVerification[];
  fontColor?: string;
  chainId?: number | null;
}

type CreatorMetadataState = {
  metadata: AddressMetadata | null;
  isLoading: boolean;
};

const AssetCreatorBadges: React.FC<AssetCreatorBadgesProps> = ({
  creators,
  fontColor = 'dark.purple.500',
  chainId,
}) => {
  const [metadataByAddress, setMetadataByAddress] = useState<
    Record<string, CreatorMetadataState>
  >({});

  const creatorList = useMemo(() => creators || [], [creators]);
  const creatorListKey = useMemo(
    () => creatorList.map(creator => creator.address.toLowerCase()).join('|'),
    [creatorList]
  );
  const creatorAddresses = useMemo(
    () => (creatorListKey ? creatorListKey.split('|') : []),
    [creatorListKey]
  );

  useEffect(() => {
    let cancelled = false;

    if (!creatorAddresses.length || !chainId) {
      setMetadataByAddress({});
      return;
    }

    const loadMetadata = async () => {
      const loadingState: Record<string, CreatorMetadataState> = {};
      for (const address of creatorAddresses) {
        loadingState[address] = {
          metadata: null,
          isLoading: true,
        };
      }
      setMetadataByAddress(loadingState);

      const entries = await Promise.all(
        creatorAddresses.map(async address => {
          try {
            const metadata = await readAddressMetadata(address, chainId);
            return [
              address,
              {
                metadata,
                isLoading: false,
              } as CreatorMetadataState,
            ] as const;
          } catch {
            return [
              address,
              {
                metadata: null,
                isLoading: false,
              } as CreatorMetadataState,
            ] as const;
          }
        })
      );

      if (cancelled) return;
      setMetadataByAddress(Object.fromEntries(entries));
    };

    loadMetadata();

    return () => {
      cancelled = true;
    };
  }, [creatorAddresses, chainId]);

  const network =
    chainId !== null && chainId !== undefined
      ? supportedNetworks[String(chainId)]
      : undefined;
  const ipfsGateway = network?.ipfsGateway || constants.IPFS;

  return (
    <Box>
      <Text fontSize="xs" color={fontColor} opacity={0.8} mb={1}>
        Creators
      </Text>
      {!creatorList.length && (
        <Text fontSize="xs" color={fontColor} opacity={0.65}>
          Creator data unavailable
        </Text>
      )}
      <Wrap spacing={2}>
        {creatorList.map(creator => {
          const metadataState = metadataByAddress[creator.address.toLowerCase()];
          const metadata = metadataState?.metadata;
          const profileName = metadata?.profile?.name || creator.name;
          const profileImageUrl =
            metadata?.profile?.profileImage?.[0]?.url || creator.profileImage;
          const displayName = profileName
            ? `@${profileName}`
            : formatAddress(creator.address);
          const avatarUrl = profileImageUrl
            ? resolveIpfsUrl(profileImageUrl, ipfsGateway)
            : '';

          return (
            <WrapItem key={creator.address}>
              <Link
                href={getUniversalEverythingUrl(
                  chainId ?? undefined,
                  'profile',
                  creator.address
                )}
                isExternal
                _hover={{ textDecoration: 'none' }}
              >
                <HStack
                  spacing={2}
                  px={2}
                  py={1}
                  borderRadius="md"
                  bg="whiteAlpha.100"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{
                    bg: 'whiteAlpha.200',
                    borderColor: creator.verified ? 'dark.teal.500' : 'orange.500',
                  }}
                >
                  {metadataState?.isLoading ? (
                    <Spinner size="xs" color={fontColor} />
                  ) : avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      boxSize="20px"
                      borderRadius="full"
                      objectFit="cover"
                    />
                  ) : (
                    <Box boxSize="20px" borderRadius="full" bg="whiteAlpha.300" />
                  )}
                  <Text fontSize="xs" color={fontColor} fontFamily="mono">
                    {displayName}
                  </Text>
                  <Badge
                    fontSize="0.58rem"
                    px={1.5}
                    py={0.5}
                    borderRadius="md"
                    bg={creator.verified ? 'dark.teal.500' : 'orange.500'}
                    color={creator.verified ? 'dark.purple.500' : 'white'}
                  >
                    {creator.verified ? 'Verified' : 'Unverified'}
                  </Badge>
                  <ExternalLinkIcon color={fontColor} boxSize={3} />
                </HStack>
              </Link>
            </WrapItem>
          );
        })}
      </Wrap>
    </Box>
  );
};

export default AssetCreatorBadges;
