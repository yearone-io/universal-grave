'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  HStack,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { AbiCoder, BrowserProvider, Contract } from 'ethers';
import Link from 'next/link';
import { useProfile } from '@/contexts/ProfileProvider';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { getForwarderAssistantDiagnostics } from '@/utils/assistantConfig';
import { formatAddress } from '@/utils/tokenUtils';
import ERC725 from '@erc725/erc725.js';

interface GraveDiagnosticsProps {
  networkName: string;
}

export default function GraveDiagnostics({
  networkName,
}: GraveDiagnosticsProps) {
  const { profileDetailsData, isConnected, chainId } = useProfile();
  const address = profileDetailsData?.upWallet;
  const currentNetwork = chainId ? supportedNetworks[chainId.toString()] : null;

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [assetAddress, setAssetAddress] = useState<string>('');
  const [assetLoading, setAssetLoading] = useState<boolean>(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [assetDiagnostics, setAssetDiagnostics] = useState<any>(null);
  const [assetLengthBytes, setAssetLengthBytes] = useState<number | null>(null);
  const [assetLengthDecodeWarning, setAssetLengthDecodeWarning] =
    useState<string | null>(null);
  const [creatorVerification, setCreatorVerification] = useState<any>(null);

  const runDiagnostics = useCallback(async () => {
    if (!address || !currentNetwork || !window.lukso) {
      setError('Wallet not connected');
      return;
    }

    setIsRunning(true);
    setError(null);
    try {
      const provider = new BrowserProvider(window.lukso);
      const diagnostics = await getForwarderAssistantDiagnostics(
        provider,
        address,
        {
          forwarderAssistantAddress: currentNetwork.forwarderAssistantAddress,
          addressListScreenerAddress:
            currentNetwork.addressListScreenerAddress,
          curatedListScreenerAddress: currentNetwork.curatedListScreenerAddress,
          creatorListScreenerAddress:
            currentNetwork.creatorListScreenerAddress,
          creatorCurationScreenerAddress:
            currentNetwork.creatorCurationScreenerAddress,
        }
      );
      setData(diagnostics);
    } catch (err: any) {
      setError(err.message || 'Failed to run diagnostics');
    } finally {
      setIsRunning(false);
    }
  }, [address, currentNetwork]);

  useEffect(() => {
    if (isConnected && address && currentNetwork && !data && !isRunning) {
      runDiagnostics();
    }
  }, [isConnected, address, currentNetwork, data, isRunning, runDiagnostics]);

  const runAssetDiagnostics = useCallback(async () => {
    if (!assetAddress || !currentNetwork || !window.lukso) {
      setAssetError('Enter a token contract address');
      return;
    }

    setAssetLoading(true);
    setAssetError(null);
    setAssetLengthBytes(null);
    setAssetLengthDecodeWarning(null);
    setCreatorVerification(null);
    try {
      const provider = new BrowserProvider(window.lukso);
      const erc725 = new ERC725([], assetAddress, provider);
      const contract = new Contract(
        assetAddress,
        [
          'function getData(bytes32 key) view returns (bytes)',
          'function getDataBatch(bytes32[] keys) view returns (bytes[])',
        ],
        provider
      );

      const creatorsLengthKey = erc725.encodeKeyName('LSP4Creators[]');
      const creatorsLengthRaw = await contract.getData(creatorsLengthKey);
      let creatorsLengthDecoded: string | null = null;
      if (creatorsLengthRaw && creatorsLengthRaw !== '0x') {
        try {
          creatorsLengthDecoded = BigInt(creatorsLengthRaw).toString();
        } catch (err) {
          creatorsLengthDecoded = null;
        }
        const byteLen = (creatorsLengthRaw.length - 2) / 2;
        setAssetLengthBytes(byteLen);
        if (byteLen !== 16 && byteLen !== 32) {
          setAssetLengthDecodeWarning(
            `Unexpected byte length (${byteLen}).`
          );
        } else if (byteLen === 16) {
          setAssetLengthDecodeWarning(
            'Length is uint128 (16 bytes) per LSP2.'
          );
        } else {
          setAssetLengthDecodeWarning(null);
        }
      }

      let creators: string[] = [];
      let creatorsRaw: string[] = [];
      let creatorsRawBytes: number[] = [];
      let creatorsLimited = false;
      if (creatorsLengthDecoded) {
        const lengthBigInt = BigInt(creatorsLengthDecoded);
        if (lengthBigInt > 0n) {
          const maxItems = 10n;
          const count = lengthBigInt > maxItems ? maxItems : lengthBigInt;
          creatorsLimited = lengthBigInt > maxItems;

          const itemKeys: string[] = [];
          const baseArrayKey = erc725.encodeKeyName('LSP4Creators[]');
          const keyPrefix = baseArrayKey.slice(0, 34);
          for (let i = 0n; i < count; i++) {
            const indexBytes16 = i.toString(16).padStart(32, '0');
            itemKeys.push(keyPrefix + indexBytes16);
          }

          const itemValues = await contract.getDataBatch(itemKeys);
          creatorsRaw = itemValues;
          creatorsRawBytes = itemValues.map((value: string) =>
            value && value !== '0x' ? (value.length - 2) / 2 : 0
          );
          creators = itemValues
            .filter((value: any) => value && value !== '0x')
            .map((value: any) => erc725.decodeValueType('address', value));
        }
      }

      // Check if any creator map entries exist in the UP list
      let creatorListName: string | null = null;
      if (data && currentNetwork) {
        for (const entry of data.txTypes || []) {
          for (const info of entry.screenersInfo || []) {
            if (
              info.screenerAddress?.toLowerCase() ===
                currentNetwork.creatorListScreenerAddress.toLowerCase() &&
              info.listName
            ) {
              creatorListName = info.listName;
              break;
            }
          }
          if (creatorListName) break;
        }
      }

      let assetListName: string | null = null;
      if (data && currentNetwork) {
        for (const entry of data.txTypes || []) {
          for (const info of entry.screenersInfo || []) {
            if (
              info.screenerAddress?.toLowerCase() ===
                currentNetwork.addressListScreenerAddress.toLowerCase() &&
              info.listName
            ) {
              assetListName = info.listName;
              break;
            }
          }
          if (assetListName) break;
        }
      }

      let upContract: Contract | null = null;
      let upErc725: ERC725 | null = null;
      if ((creatorListName || assetListName) && address) {
        upContract = new Contract(
          address,
          [
            'function getData(bytes32 key) view returns (bytes)',
            'function getDataBatch(bytes32[] keys) view returns (bytes[])',
          ],
          provider
        );
        upErc725 = new ERC725([], address, provider);
      }

      let creatorMapChecks: Array<{
        creator: string;
        mapKey: string;
        mapValue: string | null;
      }> = [];
      if (creatorListName && creators.length > 0 && upContract && upErc725) {
        const mapKeys = creators.map(creator =>
          upErc725.encodeKeyName(`${creatorListName}Map:<address>`, [creator])
        );
        const mapValues = await upContract.getDataBatch(mapKeys);
        creatorMapChecks = creators.map((creator, i) => ({
          creator,
          mapKey: mapKeys[i],
          mapValue: mapValues[i] || null,
        }));
      }

      let assetListMapKey: string | null = null;
      let assetListMapValue: string | null = null;
      if (assetListName && upContract && upErc725) {
        assetListMapKey = upErc725.encodeKeyName(
          `${assetListName}Map:<address>`,
          [assetAddress]
        );
        try {
          assetListMapValue = await upContract.getData(assetListMapKey);
        } catch {
          assetListMapValue = null;
        }
      }

      // Creator verification (LSP12IssuedAssetsMap) diagnostics
      const LSP12_ISSUED_ASSETS_MAP_KEY_PREFIX =
        '0x74ac2555c10b9349e78f0000';
      const LSP12_ISSUED_ASSETS_ARRAY_KEY =
        '0x7c8c3416d6cda87cd42c71ea1843df28ac4850354f988d55ee2eaa47b6dc05cd';

      const decodeLSP2Length = (raw: string | null): bigint | null => {
        if (!raw || raw === '0x') return null;
        const hex = raw.slice(2);
        if (hex.length === 32) {
          return BigInt('0x' + hex);
        }
        if (hex.length === 64) {
          return BigInt('0x' + hex);
        }
        return null;
      };

      const decodeMapIndex = (
        raw: string | null
      ): { ok: boolean; index?: bigint } => {
        if (!raw || raw === '0x') return { ok: false };
        const hex = raw.slice(2);
        if (hex.length === 40) {
          // bytes4 + uint128
          const indexHex = hex.slice(8);
          return { ok: true, index: BigInt('0x' + indexHex) };
        }
        if (hex.length === 72) {
          // bytes4 + uint256
          const indexHex = hex.slice(8);
          return { ok: true, index: BigInt('0x' + indexHex) };
        }
        return { ok: false };
      };

      let creatorVerifyChecks: Array<{
        creator: string;
        mapKey: string;
        mapValue: string | null;
        mapBytes: number;
        index?: string;
        issuedLengthRaw?: string | null;
        issuedLength?: string | null;
        verified: boolean;
      }> = [];

      if (creators.length > 0) {
        for (const creator of creators) {
          const mapKey =
            LSP12_ISSUED_ASSETS_MAP_KEY_PREFIX +
            assetAddress.toLowerCase().slice(2);

          let mapValue: string | null = null;
          let issuedLengthRaw: string | null = null;
          try {
            const creatorContract = new Contract(
              creator,
              [
                'function getData(bytes32 key) view returns (bytes)',
                'function getDataBatch(bytes32[] keys) view returns (bytes[])',
              ],
              provider
            );
            const values = await creatorContract.getDataBatch([
              mapKey,
              LSP12_ISSUED_ASSETS_ARRAY_KEY,
            ]);
            mapValue = values?.[0] || null;
            issuedLengthRaw = values?.[1] || null;
          } catch {
            mapValue = null;
            issuedLengthRaw = null;
          }

          const mapBytes =
            mapValue && mapValue !== '0x' ? (mapValue.length - 2) / 2 : 0;
          const decodedIndex = decodeMapIndex(mapValue);
          const issuedLength = decodeLSP2Length(issuedLengthRaw);
          const verified =
            decodedIndex.ok &&
            typeof decodedIndex.index !== 'undefined' &&
            issuedLength !== null &&
            decodedIndex.index < issuedLength;

          creatorVerifyChecks.push({
            creator,
            mapKey,
            mapValue,
            mapBytes,
            index: decodedIndex.index?.toString(),
            issuedLengthRaw,
            issuedLength: issuedLength?.toString() || null,
            verified,
          });
        }
      }

      // Simulate creator list screener logic (using current config if present)
      let creatorListConfig: any = null;
      if (data && currentNetwork) {
        const entry = (data.txTypes || []).find((t: any) =>
          t.screenersInfo?.some(
            (s: any) =>
              s.screenerAddress?.toLowerCase() ===
              currentNetwork.creatorListScreenerAddress.toLowerCase()
          )
        );
        const screenerInfo = entry?.screenersInfo?.find(
          (s: any) =>
            s.screenerAddress?.toLowerCase() ===
            currentNetwork.creatorListScreenerAddress.toLowerCase()
        );
        if (screenerInfo?.configBytes) {
          try {
            const coder = new AbiCoder();
            const decoded = coder.decode(
              ['bool', 'bool'],
              screenerInfo.configBytes
            );
            creatorListConfig = {
              requireAllCreators: decoded[0],
              returnValueWhenInList: decoded[1],
            };
          } catch {
            creatorListConfig = null;
          }
        }
      }

      let assetListConfig: any = null;
      if (data && currentNetwork) {
        const entry = (data.txTypes || []).find((t: any) =>
          t.screenersInfo?.some(
            (s: any) =>
              s.screenerAddress?.toLowerCase() ===
              currentNetwork.addressListScreenerAddress.toLowerCase()
          )
        );
        const screenerInfo = entry?.screenersInfo?.find(
          (s: any) =>
            s.screenerAddress?.toLowerCase() ===
            currentNetwork.addressListScreenerAddress.toLowerCase()
        );
        if (screenerInfo?.configBytes) {
          try {
            const coder = new AbiCoder();
            const decoded = coder.decode(['bool'], screenerInfo.configBytes);
            assetListConfig = {
              returnValueWhenInList: decoded[0],
            };
          } catch {
            assetListConfig = null;
          }
        }
      }

      const verifiedFlags = creatorVerifyChecks.map(c => c.verified);
      let verifiedCreators = creatorVerifyChecks.filter(c => c.verified);
      if (creatorListConfig?.requireAllCreators) {
        const allVerified =
          verifiedFlags.length > 0 && verifiedFlags.every(v => v);
        verifiedCreators = allVerified ? creatorVerifyChecks : [];
      }

      const safeCreatorMap = new Map<string, boolean>();
      creatorMapChecks.forEach(item => {
        safeCreatorMap.set(
          item.creator.toLowerCase(),
          !!(item.mapValue && item.mapValue !== '0x')
        );
      });

      const verifiedInSafeList = verifiedCreators.filter(c =>
        safeCreatorMap.get(c.creator.toLowerCase())
      );

      let creatorListResult: boolean | null = null;
      if (creatorListConfig) {
        if (verifiedCreators.length === 0) {
          creatorListResult = !creatorListConfig.returnValueWhenInList;
        } else {
          creatorListResult =
            verifiedInSafeList.length > 0
              ? creatorListConfig.returnValueWhenInList
              : !creatorListConfig.returnValueWhenInList;
        }
      }

      let assetListResult: boolean | null = null;
      if (assetListConfig) {
        const assetInList = !!(assetListMapValue && assetListMapValue !== '0x');
        assetListResult = assetInList
          ? assetListConfig.returnValueWhenInList
          : !assetListConfig.returnValueWhenInList;
      }

      setCreatorVerification({
        creatorVerifyChecks,
        creatorListConfig,
        verifiedCreators: verifiedCreators.map(c => c.creator),
        verifiedInSafeList: verifiedInSafeList.map(c => c.creator),
        creatorListResult,
      });

      setAssetDiagnostics({
        assetAddress,
        creatorsLengthKey,
        creatorsLengthRaw,
        creatorsLengthDecoded,
        creatorsLimited,
        creators,
        creatorsRaw,
        creatorsRawBytes,
        creatorListName,
        creatorMapChecks,
        assetListName,
        assetListMapKey,
        assetListMapValue,
        assetListConfig,
        assetListResult,
      });
    } catch (err: any) {
      setAssetError(err.message || 'Failed to read asset data');
    } finally {
      setAssetLoading(false);
    }
  }, [assetAddress, currentNetwork, data, address]);

  const screenerMeta = useMemo(() => {
    if (!currentNetwork) return [];
    return [
      {
        address: currentNetwork.creatorListScreenerAddress,
        label: 'Creator List',
        expectedBytes: 64,
        expectedListName: 'GraveSafeCreators',
      },
      {
        address: currentNetwork.creatorCurationScreenerAddress,
        label: 'Creator Curated',
        expectedBytes: 96,
      },
      {
        address: currentNetwork.addressListScreenerAddress,
        label: 'Asset List',
        expectedBytes: 32,
        expectedListName: 'GraveSafeAssets',
      },
      {
        address: currentNetwork.curatedListScreenerAddress,
        label: 'Asset Curated',
        expectedBytes: 64,
      },
    ];
  }, [currentNetwork]);

  const getScreenerLabel = useCallback(
    (addr: string) => {
      const match = screenerMeta.find(
        item => item.address.toLowerCase() === addr.toLowerCase()
      );
      return match?.label || 'Unknown Screener';
    },
    [screenerMeta]
  );

  const getExpectedBytes = useCallback(
    (addr: string) => {
      const match = screenerMeta.find(
        item => item.address.toLowerCase() === addr.toLowerCase()
      );
      return match?.expectedBytes ?? null;
    },
    [screenerMeta]
  );

  const getExpectedListName = useCallback(
    (addr: string) => {
      const match = screenerMeta.find(
        item => item.address.toLowerCase() === addr.toLowerCase()
      );
      return match?.expectedListName ?? null;
    },
    [screenerMeta]
  );

  const getConfigBytesLength = (configBytes: string | null) => {
    if (!configBytes || configBytes === '0x') return 0;
    return (configBytes.length - 2) / 2;
  };

  const decodeConfigBytes = useCallback(
    (screenerAddress: string, configBytes: string | null) => {
      if (!configBytes || configBytes === '0x') {
        return { decoded: null, error: 'Missing config bytes' };
      }
      const addr = screenerAddress.toLowerCase();
      const coder = new AbiCoder();

      try {
        if (addr === currentNetwork?.creatorListScreenerAddress.toLowerCase()) {
          const [requireAllCreators, returnValueWhenInList] = coder.decode(
            ['bool', 'bool'],
            configBytes
          );
          return {
            decoded: {
              requireAllCreators,
              returnValueWhenInList,
            },
          };
        }
        if (addr === currentNetwork?.creatorCurationScreenerAddress.toLowerCase()) {
          const [curatedListAddress, requireAllCreators, returnValueWhenCurated] =
            coder.decode(['address', 'bool', 'bool'], configBytes);
          return {
            decoded: {
              curatedListAddress,
              requireAllCreators,
              returnValueWhenCurated,
            },
          };
        }
        if (addr === currentNetwork?.addressListScreenerAddress.toLowerCase()) {
          const [returnValueWhenInList] = coder.decode(['bool'], configBytes);
          return {
            decoded: {
              returnValueWhenInList,
            },
          };
        }
        if (addr === currentNetwork?.curatedListScreenerAddress.toLowerCase()) {
          const [curatedListAddress, returnValueWhenCurated] = coder.decode(
            ['address', 'bool'],
            configBytes
          );
          return {
            decoded: {
              curatedListAddress,
              returnValueWhenCurated,
            },
          };
        }
        return { decoded: null };
      } catch (err: any) {
        return { decoded: null, error: err.message || 'Decode failed' };
      }
    },
    [currentNetwork]
  );

  const issues = useMemo(() => {
    if (!data || !currentNetwork) return [];

    const problems: string[] = [];
    const expectedCreator =
      currentNetwork.creatorListScreenerAddress.toLowerCase();
    const expectedAddress =
      currentNetwork.addressListScreenerAddress.toLowerCase();

    for (const entry of data.txTypes || []) {
      const txType = entry.txType;
      if (entry.executionOrder === null || entry.executionOrder < 0) {
        problems.push(`Forwarder assistant missing for txType ${txType}`);
        continue;
      }

      if (!entry.screenersData || entry.screenersData === '0x') {
        problems.push(`Screeners array missing for txType ${txType}`);
        continue;
      }

      const screenerAddresses = (entry.screeners || []).map((s: string) =>
        s.toLowerCase()
      );
      const knownScreeners = [
        currentNetwork.creatorListScreenerAddress.toLowerCase(),
        currentNetwork.creatorCurationScreenerAddress.toLowerCase(),
        currentNetwork.addressListScreenerAddress.toLowerCase(),
        currentNetwork.curatedListScreenerAddress.toLowerCase(),
      ];
      const unknownScreeners = screenerAddresses.filter(
        (addr: string) => !knownScreeners.includes(addr)
      );
      if (unknownScreeners.length > 0) {
        problems.push(
          `Unknown screener(s) present for txType ${txType}: ${unknownScreeners
            .map((a: string) => formatAddress(a))
            .join(', ')}`
        );
      }

      if (!screenerAddresses.includes(expectedCreator)) {
        problems.push(`Creator list screener missing for txType ${txType}`);
      }
      if (!screenerAddresses.includes(expectedAddress)) {
        problems.push(`Asset list screener missing for txType ${txType}`);
      }

      const canonicalOrder = [
        currentNetwork.creatorListScreenerAddress.toLowerCase(),
        screenerAddresses.includes(
          currentNetwork.creatorCurationScreenerAddress.toLowerCase()
        )
          ? currentNetwork.creatorCurationScreenerAddress.toLowerCase()
          : null,
        currentNetwork.addressListScreenerAddress.toLowerCase(),
        screenerAddresses.includes(
          currentNetwork.curatedListScreenerAddress.toLowerCase()
        )
          ? currentNetwork.curatedListScreenerAddress.toLowerCase()
          : null,
      ].filter(Boolean) as string[];

      const actualOrder = screenerAddresses.filter(addr =>
        canonicalOrder.includes(addr)
      );
      const orderMismatch =
        actualOrder.length === canonicalOrder.length &&
        actualOrder.some((addr: string, i: number) => addr !== canonicalOrder[i]);

      if (orderMismatch) {
        problems.push(
          `Screener order mismatch for txType ${txType}: expected ${canonicalOrder
            .map(a => formatAddress(a))
            .join(' → ')}, got ${actualOrder
            .map(a => formatAddress(a))
            .join(' → ')}`
        );
      }

      for (const info of entry.screenersInfo || []) {
        const screenerAddress = (info.screenerAddress || '').toLowerCase();
        const isCreator = screenerAddress === expectedCreator;
        const isAddress = screenerAddress === expectedAddress;

        if (isCreator || isAddress) {
          if (!info.configValid) {
            problems.push(
              `Screener config missing for ${isCreator ? 'creator' : 'asset'} list (txType ${txType}, index ${info.index})`
            );
          }
          const expectedBytes = getExpectedBytes(info.screenerAddress);
          const actualBytes = getConfigBytesLength(info.configBytes);
          if (expectedBytes && actualBytes && actualBytes !== expectedBytes) {
            problems.push(
              `Config size mismatch for ${isCreator ? 'creator' : 'asset'} list (txType ${txType}, index ${info.index}): expected ${expectedBytes} bytes, got ${actualBytes} bytes`
            );
          }
          const decodeAttempt = decodeConfigBytes(
            info.screenerAddress,
            info.configBytes
          );
          if (decodeAttempt.error) {
            problems.push(
              `Config decode failed for ${isCreator ? 'creator' : 'asset'} list (txType ${txType}, index ${info.index}): ${decodeAttempt.error}`
            );
          }
          if (!info.listNameData || info.listNameData === '0x') {
            problems.push(
              `List name missing for ${isCreator ? 'creator' : 'asset'} list (txType ${txType}, index ${info.index})`
            );
          }
          if (info.listName && (!info.listLengthData || info.listLengthData === '0x')) {
            problems.push(
              `List length missing for ${info.listName} (txType ${txType}, index ${info.index})`
            );
          }
          const expectedName = getExpectedListName(info.screenerAddress);
          if (expectedName && info.listName && info.listName !== expectedName) {
            problems.push(
              `List name mismatch for ${isCreator ? 'creator' : 'asset'} list (txType ${txType}, index ${info.index}): expected ${expectedName}, got ${info.listName}`
            );
          }
        }
      }
    }

    return problems;
  }, [
    data,
    currentNetwork,
    decodeConfigBytes,
    getExpectedBytes,
    getExpectedListName,
  ]);

  return (
    <Container maxW="5xl" py={8}>
      <Flex direction="column" gap={4} color="gray.900">
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
          <Text fontSize="20px" fontWeight="bold" color="white" fontFamily="Bungee">
            DIAGNOSTICS
          </Text>
          <Link href={`/${networkName}/grave/settings`}>
            <Button variant="solidWhite" size="sm" fontFamily="Bungee">
              Back to Settings
            </Button>
          </Link>
        </Flex>

        <Box p={5} bg="white" borderRadius="lg" border="2px solid" borderColor="gray.300">
          <Flex justify="space-between" align="center" mb={3} flexWrap="wrap" gap={2}>
            <Text fontSize="sm" color="gray.900">
              This page reads on-chain UAP configuration keys for your profile.
              It does not submit transactions.
            </Text>
            <HStack spacing={3}>
              <Button
                size="sm"
                colorScheme="purple"
                variant="solid"
                onClick={runDiagnostics}
                isLoading={isRunning}
                isDisabled={!isConnected}
              >
                Run Diagnostics
              </Button>
              {!isConnected && (
                <Text fontSize="xs" color="orange.700">
                  Connect your wallet to run diagnostics.
                </Text>
              )}
            </HStack>
          </Flex>

          {error && (
            <Text fontSize="xs" color="red.700" mt={2}>
              {error}
            </Text>
          )}

          {data && (
            <Box mt={4}>
              <Box
                p={4}
                bg="white"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.300"
                mb={4}
              >
                <Flex align="center" justify="space-between" flexWrap="wrap" gap={2}>
                  <Text fontSize="sm" color="gray.900" fontWeight="bold">
                    Summary
                  </Text>
                  <Badge
                    colorScheme={issues.length === 0 ? 'green' : 'orange'}
                    variant="solid"
                  >
                    {issues.length === 0
                      ? 'No obvious issues detected'
                      : `${issues.length} issue${issues.length === 1 ? '' : 's'} detected`}
                  </Badge>
                </Flex>
                {issues.length > 0 && (
                  <Box mt={2}>
                    {issues.map((issue, index) => (
                      <Text key={index} fontSize="xs" color="orange.900">
                        • {issue}
                      </Text>
                    ))}
                  </Box>
                )}
                {issues.length === 0 && (
                  <Text fontSize="xs" color="green.900" mt={2}>
                    No obvious missing keys detected. If transfers still fail,
                    check screener config sizes and order below.
                  </Text>
                )}
              </Box>

              <Divider borderColor="gray.200" my={2} />

              <VStack align="stretch" spacing={4}>
                {(data.txTypes || []).map((entry: any) => (
                  <Box
                    key={entry.txType}
                    p={4}
                    bg="white"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.300"
                  >
                    <Flex align="center" justify="space-between" mb={2} flexWrap="wrap" gap={2}>
                      <Text fontSize="sm" fontWeight="bold" color="gray.900">
                        {entry.txType ===
                        '0x20804611b3e2ea21c480dc465142210acf4a2485947541770ec1fb87dee4a55c'
                          ? 'LSP7 Recipient Notification'
                          : 'LSP8 Recipient Notification'}
                      </Text>
                      <Badge
                        colorScheme={
                          entry.executionOrder !== null && entry.executionOrder >= 0
                            ? 'green'
                            : 'red'
                        }
                      >
                        Forwarder index: {entry.executionOrder ?? 'missing'}
                      </Badge>
                    </Flex>

                    <Text fontSize="xs" color="gray.900">
                      Screeners: {entry.screeners?.length || 0}
                    </Text>
                    {entry.screeners?.length > 0 && (
                      <Text fontSize="xs" color="gray.800" mt={1}>
                        Order:{' '}
                        {entry.screeners
                          .map((addr: string) => getScreenerLabel(addr))
                          .join(' → ')}
                      </Text>
                    )}

                    <VStack align="stretch" spacing={2} mt={3}>
                      {(entry.screenersInfo || []).map((info: any) => {
                        const expectedBytes = getExpectedBytes(info.screenerAddress);
                        const actualBytes = getConfigBytesLength(info.configBytes);
                        const bytesMismatch =
                          expectedBytes && actualBytes && actualBytes !== expectedBytes;
                        const expectedListName = getExpectedListName(info.screenerAddress);
                        const listNameMismatch =
                          expectedListName &&
                          info.listName &&
                          info.listName !== expectedListName;
                        const decoded = decodeConfigBytes(
                          info.screenerAddress,
                          info.configBytes
                        );
                        return (
                          <Box
                            key={`${entry.txType}-${info.index}`}
                            p={3}
                            borderRadius="md"
                            border="1px solid"
                            borderColor="gray.200"
                            bg="gray.50"
                          >
                            <Flex align="center" justify="space-between" flexWrap="wrap" gap={2}>
                              <Text fontSize="sm" fontWeight="bold" color="gray.900">
                                {getScreenerLabel(info.screenerAddress)}
                              </Text>
                              <Text fontSize="xs" color="gray.800">
                                {formatAddress(info.screenerAddress)} · index {info.index}
                              </Text>
                            </Flex>
                            <HStack spacing={2} mt={2} flexWrap="wrap">
                              <Badge colorScheme={info.configValid ? 'green' : 'red'}>
                                Config {info.configValid ? 'OK' : 'Missing'}
                              </Badge>
                              <Badge colorScheme={bytesMismatch ? 'red' : 'purple'}>
                                {actualBytes || 0} bytes
                                {expectedBytes ? ` / ${expectedBytes}` : ''}
                              </Badge>
                              <Badge colorScheme={decoded.error ? 'red' : 'green'}>
                                Decode {decoded.error ? 'Failed' : 'OK'}
                              </Badge>
                              <Badge colorScheme={info.listName ? 'green' : 'orange'}>
                                List name {info.listName ? 'OK' : 'Missing'}
                              </Badge>
                              {info.listName && (
                                <Badge
                                  colorScheme={
                                    info.listLengthData && info.listLengthData !== '0x'
                                      ? 'green'
                                      : 'orange'
                                  }
                                >
                                  Length {info.listLengthDecoded ?? 'missing'}
                                </Badge>
                              )}
                              {listNameMismatch && (
                                <Badge colorScheme="red">Name mismatch</Badge>
                              )}
                            </HStack>
                            <Text fontSize="xs" color="gray.800" mt={2}>
                              List: {info.listName || '—'}
                            </Text>
                            {decoded.decoded && (
                              <Box mt={2} p={2} bg="white" borderRadius="md">
                                <Text fontSize="xs" color="gray.900" fontFamily="mono">
                                  {JSON.stringify(decoded.decoded)}
                                </Text>
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </VStack>
                  </Box>
                ))}
              </VStack>

              <Divider borderColor="gray.200" my={5} />

              <Box
                p={4}
                bg="white"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.300"
              >
                <Text fontSize="sm" color="gray.900" fontWeight="bold" mb={2}>
                  Asset Probe (optional)
                </Text>
                <Text fontSize="xs" color="gray.800" mb={3}>
                  Enter the LSP7/LSP8 token contract address that fails to
                  transfer. This checks if the token exposes LSP4Creators[].
                </Text>
                <HStack spacing={2} mb={2} flexWrap="wrap">
                  <Input
                    value={assetAddress}
                    onChange={e => setAssetAddress(e.target.value)}
                    placeholder="0x... token contract address"
                    size="sm"
                    fontFamily="mono"
                    bg="white"
                    borderColor="gray.400"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="purple"
                    onClick={runAssetDiagnostics}
                    isLoading={assetLoading}
                  >
                    Inspect Token
                  </Button>
                </HStack>
                {assetError && (
                  <Text fontSize="xs" color="red.700" mt={1}>
                    {assetError}
                  </Text>
                )}
                {assetDiagnostics && (
                  <Box mt={2}>
                    {(!assetDiagnostics.creatorsLengthRaw ||
                      assetDiagnostics.creatorsLengthRaw === '0x') && (
                      <Text fontSize="xs" color="orange.800" mb={1}>
                        LSP4Creators[] length key is missing on this token.
                      </Text>
                    )}
                    {assetLengthDecodeWarning && (
                      <Text fontSize="xs" color="gray.800" mb={1}>
                        {assetLengthDecodeWarning}
                      </Text>
                    )}
                    {assetDiagnostics.creatorsLengthRaw &&
                      assetDiagnostics.creatorsLengthRaw !== '0x' &&
                      assetDiagnostics.creatorsLengthRaw.length <= 34 && (
                        <Text fontSize="xs" color="gray.800" mb={1}>
                          Note: length is stored as uint128 (16 bytes).
                        </Text>
                      )}
                    <Text fontSize="xs" color="gray.900">
                      Creators length key: {assetDiagnostics.creatorsLengthKey}
                    </Text>
                    <Text fontSize="xs" color="gray.900">
                      Raw: {assetDiagnostics.creatorsLengthRaw || '—'}
                    </Text>
                    {assetLengthBytes !== null && (
                      <Text fontSize="xs" color="gray.900">
                        Raw byte length: {assetLengthBytes} bytes
                      </Text>
                    )}
                    <Text fontSize="xs" color="gray.900">
                      Decoded length: {assetDiagnostics.creatorsLengthDecoded ?? '—'}
                    </Text>
                    {assetDiagnostics.creators && assetDiagnostics.creators.length > 0 && (
                      <Box mt={2}>
                        <Text fontSize="xs" color="gray.900" fontWeight="bold">
                          Creators (first {assetDiagnostics.creators.length})
                          {assetDiagnostics.creatorsLimited ? '+' : ''}
                        </Text>
                        {assetDiagnostics.creators.map((creator: string, idx: number) => (
                          <Text key={creator + idx} fontSize="xs" color="gray.900">
                            {formatAddress(creator)} · raw bytes:{' '}
                            {assetDiagnostics.creatorsRawBytes?.[idx] ?? '—'}
                          </Text>
                        ))}
                      </Box>
                    )}
                    {assetDiagnostics.creatorListName && (
                      <Box mt={2}>
                        <Text fontSize="xs" color="gray.900" fontWeight="bold">
                          Creator Map Checks ({assetDiagnostics.creatorListName})
                        </Text>
                        {assetDiagnostics.creatorMapChecks?.length > 0 ? (
                          assetDiagnostics.creatorMapChecks.map(
                            (item: any, idx: number) => (
                              <Text key={item.creator + idx} fontSize="xs" color="gray.900">
                                {formatAddress(item.creator)} →{' '}
                                {item.mapValue && item.mapValue !== '0x'
                                  ? 'map entry exists'
                                  : 'map entry missing'}
                              </Text>
                            )
                          )
                        ) : (
                          <Text fontSize="xs" color="gray.800">
                            No creators found to check map entries.
                          </Text>
                        )}
                      </Box>
                    )}
                    {assetDiagnostics.assetListName && (
                      <Box mt={3}>
                        <Text fontSize="xs" color="gray.900" fontWeight="bold">
                          Asset List Check ({assetDiagnostics.assetListName})
                        </Text>
                        <Text fontSize="xs" color="gray.900">
                          Map key: {assetDiagnostics.assetListMapKey || '—'}
                        </Text>
                        <Text fontSize="xs" color="gray.900">
                          Map entry:{' '}
                          {assetDiagnostics.assetListMapValue &&
                          assetDiagnostics.assetListMapValue !== '0x'
                            ? 'exists'
                            : 'missing'}
                        </Text>
                        {assetDiagnostics.assetListConfig && (
                          <Text fontSize="xs" color="gray.900" mt={1}>
                            Config: returnValueWhenInList=
                            {String(
                              assetDiagnostics.assetListConfig.returnValueWhenInList
                            )}
                          </Text>
                        )}
                        {assetDiagnostics.assetListResult !== null && (
                          <Badge
                            mt={2}
                            colorScheme={
                              assetDiagnostics.assetListResult ? 'green' : 'red'
                            }
                            variant="solid"
                          >
                            Asset List Result:{' '}
                            {assetDiagnostics.assetListResult ? 'PASS' : 'FAIL'}
                          </Badge>
                        )}
                      </Box>
                    )}
                    {creatorVerification && (
                      <Box mt={4} p={3} borderRadius="md" bg="gray.50" border="1px solid" borderColor="gray.200">
                        <Flex align="center" justify="space-between" flexWrap="wrap" gap={2} mb={2}>
                          <Text fontSize="xs" color="gray.900" fontWeight="bold">
                            Creator Verification (LSP12IssuedAssetsMap)
                          </Text>
                          {creatorVerification.creatorListResult != null && (
                            <Badge
                              colorScheme={
                                creatorVerification.creatorListResult ? 'green' : 'red'
                              }
                              variant="solid"
                            >
                              Creator List Result:{' '}
                              {creatorVerification.creatorListResult ? 'PASS' : 'FAIL'}
                            </Badge>
                          )}
                        </Flex>

                        {creatorVerification.creatorListConfig ? (
                          <Text fontSize="xs" color="gray.900">
                            Config: requireAllCreators=
                            {String(creatorVerification.creatorListConfig.requireAllCreators)}
                            , returnValueWhenInList=
                            {String(creatorVerification.creatorListConfig.returnValueWhenInList)}
                          </Text>
                        ) : (
                          <Text fontSize="xs" color="orange.800">
                            Creator list config not loaded. Run diagnostics first.
                          </Text>
                        )}

                        {creatorVerification.creatorVerifyChecks?.length > 0 ? (
                          <Box mt={2}>
                            {creatorVerification.creatorVerifyChecks.map(
                              (item: any, idx: number) => {
                                const inSafeList =
                                  assetDiagnostics.creatorMapChecks?.find(
                                    (check: any) =>
                                      check.creator.toLowerCase() ===
                                      item.creator.toLowerCase()
                                  )?.mapValue;
                                const safeLabel =
                                  inSafeList && inSafeList !== '0x'
                                    ? 'in Safe Creator List'
                                    : 'not in Safe Creator List';
                                return (
                                  <Box
                                    key={item.creator + idx}
                                    p={2}
                                    borderRadius="md"
                                    bg="white"
                                    border="1px solid"
                                    borderColor="gray.200"
                                    mb={2}
                                  >
                                    <Text fontSize="xs" color="gray.900" fontWeight="bold">
                                      {formatAddress(item.creator)}
                                    </Text>
                                    <Text fontSize="xs" color="gray.800">
                                      Safe list: {safeLabel}
                                    </Text>
                                    <Text fontSize="xs" color="gray.800">
                                      LSP12 map bytes: {item.mapBytes} · index:{' '}
                                      {item.index ?? '—'} · issued assets length:{' '}
                                      {item.issuedLength ?? '—'}
                                    </Text>
                                    <Text fontSize="xs" color={item.verified ? 'green.800' : 'orange.800'}>
                                      Verified as issuer: {item.verified ? 'yes' : 'no'}
                                    </Text>
                                  </Box>
                                );
                              }
                            )}
                          </Box>
                        ) : (
                          <Text fontSize="xs" color="gray.800" mt={2}>
                            No creators found to verify.
                          </Text>
                        )}

                        {creatorVerification.creatorListResult === false && (
                          <Text fontSize="xs" color="red.800" mt={2}>
                            Creator list screener would reject this asset. If it is still
                            sent to GRAVE, check that the creator is both verified via
                            LSP12IssuedAssetsMap and present in the Safe Creator List.
                          </Text>
                        )}
                        {creatorVerification.creatorListResult === true && (
                          <Text fontSize="xs" color="green.800" mt={2}>
                            Creator list screener would accept this asset based on current
                            config and list entries.
                          </Text>
                        )}
                      </Box>
                    )}
                    {(creatorVerification?.creatorListResult != null ||
                      assetDiagnostics.assetListResult != null) && (
                      <Box
                        mt={3}
                        p={2}
                        bg="white"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="gray.200"
                      >
                        <Text fontSize="xs" color="gray.900" fontWeight="bold" mb={1}>
                          List Screener Outcome (Creator + Asset)
                        </Text>
                        <Text fontSize="xs" color="gray.800">
                          Creator list:{' '}
                          {creatorVerification?.creatorListResult == null
                            ? 'unknown'
                            : creatorVerification?.creatorListResult
                              ? 'PASS'
                              : 'FAIL'}
                          {' · '}
                          Asset list:{' '}
                          {assetDiagnostics.assetListResult == null
                            ? 'unknown'
                            : assetDiagnostics.assetListResult
                              ? 'PASS'
                              : 'FAIL'}
                        </Text>
                        <Text fontSize="xs" color="gray.800" mt={1}>
                          If either list screener fails, the asset is routed to GRAVE.
                        </Text>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

              <Text fontSize="sm" color="gray.900" fontWeight="bold" mt={6} mb={2}>
                Raw Output
              </Text>
              <Box
                p={3}
                bg="white"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
                maxH="420px"
                overflowY="auto"
              >
                <Text fontFamily="mono" fontSize="xs" whiteSpace="pre-wrap">
                  {JSON.stringify(data, null, 2)}
                </Text>
              </Box>
            </Box>
          )}
        </Box>
      </Flex>
    </Container>
  );
}
