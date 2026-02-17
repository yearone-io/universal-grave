'use client';

import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Icon,
  VStack,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';
import { OutdatedScreenerInfo } from '@/utils/screenerMigration';

interface ScreenerMigrationModalProps {
  isOpen: boolean;
  migrationInfo: OutdatedScreenerInfo;
  onMigrate: () => void;
}

export default function ScreenerMigrationModal({
  isOpen,
  migrationInfo,
  onMigrate,
}: ScreenerMigrationModalProps) {
  const assetCount = migrationInfo.existingWhitelistAddresses.length;
  const creatorCount = migrationInfo.existingCreatorAddresses.length;
  const hasCuratedList = !!migrationInfo.existingConfig.curatedListAddress;
  const hasCreatorCuratedList =
    !!migrationInfo.existingConfig.creatorCuratedListAddress;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      isCentered
      closeOnOverlayClick={false}
      closeOnEsc={false}
    >
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
      <ModalContent
        bg="rgba(18, 10, 44, 0.98)"
        border="1px solid rgba(255, 255, 255, 0.18)"
        borderRadius="2xl"
        boxShadow="0 30px 80px rgba(0, 0, 0, 0.65)"
        maxW="500px"
      >
        <ModalHeader color="whiteAlpha.900" fontFamily="Bungee" pb={2}>
          <Flex align="center" gap={3}>
            <Icon as={WarningIcon} color="orange.400" boxSize={6} />
            <Text>Screener Upgrade Required</Text>
          </Flex>
        </ModalHeader>

        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Text color="whiteAlpha.800">
              Your Spambox is using outdated screener contracts that have been
              upgraded. You need to migrate to the new contracts to continue
              using your Graveyard.
            </Text>

            <Box
              bg="rgba(255, 255, 255, 0.06)"
              borderRadius="lg"
              p={4}
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text
                color="whiteAlpha.600"
                fontSize="sm"
                fontWeight="bold"
                mb={3}
              >
                YOUR DATA WILL BE PRESERVED:
              </Text>
              <VStack align="stretch" spacing={2}>
                <HStack justify="space-between">
                  <Text color="whiteAlpha.700" fontSize="sm">
                    Trusted Assets
                  </Text>
                  <Badge
                    bg="rgba(138, 251, 234, 0.2)"
                    color="rgba(138, 251, 234, 0.95)"
                    borderRadius="full"
                    px={2}
                  >
                    {assetCount} {assetCount === 1 ? 'address' : 'addresses'}
                  </Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text color="whiteAlpha.700" fontSize="sm">
                    Trusted Creators
                  </Text>
                  <Badge
                    bg="rgba(138, 251, 234, 0.2)"
                    color="rgba(138, 251, 234, 0.95)"
                    borderRadius="full"
                    px={2}
                  >
                    {creatorCount} {creatorCount === 1 ? 'address' : 'addresses'}
                  </Badge>
                </HStack>
                {hasCuratedList && (
                  <HStack justify="space-between">
                    <Text color="whiteAlpha.700" fontSize="sm">
                      Curated Asset List
                    </Text>
                    <Badge
                      bg="rgba(138, 251, 234, 0.2)"
                      color="rgba(138, 251, 234, 0.95)"
                      borderRadius="full"
                      px={2}
                    >
                      Enabled
                    </Badge>
                  </HStack>
                )}
                {hasCreatorCuratedList && (
                  <HStack justify="space-between">
                    <Text color="whiteAlpha.700" fontSize="sm">
                      Curated Creator List
                    </Text>
                    <Badge
                      bg="rgba(138, 251, 234, 0.2)"
                      color="rgba(138, 251, 234, 0.95)"
                      borderRadius="full"
                      px={2}
                    >
                      Enabled
                    </Badge>
                  </HStack>
                )}
                <HStack justify="space-between">
                  <Text color="whiteAlpha.700" fontSize="sm">
                    Filter Settings
                  </Text>
                  <Badge
                    bg="rgba(138, 251, 234, 0.2)"
                    color="rgba(138, 251, 234, 0.95)"
                    borderRadius="full"
                    px={2}
                  >
                    Preserved
                  </Badge>
                </HStack>
              </VStack>
            </Box>

            <Text color="whiteAlpha.600" fontSize="sm">
              Click the button below to go to the settings page where you can
              complete the migration.
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            w="100%"
            bg="rgba(138, 251, 234, 0.92)"
            color="dark.purple.500"
            fontFamily="Bungee"
            _hover={{ bg: 'rgba(138, 251, 234, 0.82)' }}
            onClick={onMigrate}
          >
            Migrate Now
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
