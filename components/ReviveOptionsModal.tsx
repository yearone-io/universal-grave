'use client';

import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';

type ReviveMode = 'asset' | 'creator';

interface ReviveOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMode: ReviveMode;
  onSelectMode: (mode: ReviveMode) => void;
  onConfirm: () => void;
  verifiedCreatorCount: number;
}

export default function ReviveOptionsModal({
  isOpen,
  onClose,
  selectedMode,
  onSelectMode,
  onConfirm,
  verifiedCreatorCount,
}: ReviveOptionsModalProps) {
  const creatorLabel = `Trust verified creator${
    verifiedCreatorCount > 1 ? 's' : ''
  }`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(3px)" />
      <ModalContent
        bg="rgba(18, 10, 44, 0.96)"
        border="1px solid rgba(255, 255, 255, 0.18)"
        borderRadius="2xl"
        boxShadow="0 30px 80px rgba(0, 0, 0, 0.65)"
      >
        <ModalHeader color="whiteAlpha.900" fontFamily="Bungee">
          Revive Options
        </ModalHeader>
        <ModalCloseButton
          color="whiteAlpha.900"
          _hover={{ bg: 'whiteAlpha.200' }}
        />
        <ModalBody>
          <Text color="whiteAlpha.800" mb={4}>
            Choose what should be trusted for future receives:
          </Text>

          <Button
            w="100%"
            mb={2}
            bg={
              selectedMode === 'asset'
                ? 'rgba(138, 251, 234, 0.92)'
                : 'rgba(255, 255, 255, 0.10)'
            }
            color={selectedMode === 'asset' ? 'dark.purple.500' : 'whiteAlpha.900'}
            border="1px solid"
            borderColor={
              selectedMode === 'asset'
                ? 'rgba(138, 251, 234, 0.95)'
                : 'rgba(255, 255, 255, 0.22)'
            }
            _hover={{
              bg:
                selectedMode === 'asset'
                  ? 'rgba(138, 251, 234, 0.82)'
                  : 'rgba(255, 255, 255, 0.16)',
            }}
            onClick={() => onSelectMode('asset')}
          >
            Trust this asset address
          </Button>

          <Button
            w="100%"
            bg={
              selectedMode === 'creator'
                ? 'rgba(138, 251, 234, 0.92)'
                : 'rgba(255, 255, 255, 0.10)'
            }
            color={
              selectedMode === 'creator' ? 'dark.purple.500' : 'whiteAlpha.900'
            }
            border="1px solid"
            borderColor={
              selectedMode === 'creator'
                ? 'rgba(138, 251, 234, 0.95)'
                : 'rgba(255, 255, 255, 0.22)'
            }
            _hover={{
              bg:
                selectedMode === 'creator'
                  ? 'rgba(138, 251, 234, 0.82)'
                  : 'rgba(255, 255, 255, 0.16)',
            }}
            onClick={() => onSelectMode('creator')}
          >
            {creatorLabel}
          </Button>

          <Box mt={3}>
            <Text fontSize="xs" color="whiteAlpha.600">
              Verified creators: {verifiedCreatorCount}
            </Text>
          </Box>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button
            bg="whiteAlpha.900"
            color="gray.900"
            _hover={{ bg: 'white' }}
            onClick={onConfirm}
          >
            Continue
          </Button>
          <Button
            variant="outline"
            borderColor="whiteAlpha.400"
            color="whiteAlpha.900"
            _hover={{ bg: 'whiteAlpha.200' }}
            onClick={onClose}
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
