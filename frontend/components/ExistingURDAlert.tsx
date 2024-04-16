import { useContext, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';
import { FocusableElement } from '@chakra-ui/utils';
import { WalletContext } from '@/components/wallet/WalletContext';

export const ExistingURDAlert = ({
  setLoading,
  onClose,
  handleJoin,
  isOpen,
}: {
  setLoading: (isLoading: boolean) => void;
  onClose: () => void;
  handleJoin: () => void;
  isOpen: boolean;
}) => {
  const walletContext = useContext(WalletContext);

  const { URDLsp7, URDLsp8, disconnectIfNetworkChanged } = walletContext;

  const cancelRef = useRef<FocusableElement>(null);

  return (
    <AlertDialog
      motionPreset="slideInBottom"
      leastDestructiveRef={cancelRef}
      onClose={() => {
        setLoading(false);
        onClose();
      }}
      isOpen={isOpen}
      isCentered
    >
      <AlertDialogOverlay />
      <AlertDialogContent>
        <AlertDialogHeader>Whoops! Not so fast!</AlertDialogHeader>
        <AlertDialogCloseButton />
        <AlertDialogBody>
          Hey, just a heads up! We've detected that you have a Universal
          Receiver Delegate set up for LSP7 ({URDLsp7}) and/or for LSP8 (
          {URDLsp8}) assets. If you join the Grave your current URD
          functionality will be replaced and it could affect your UP profile's
          existing functionality, such as any dApps or flows that rely on these
          values.
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            colorScheme="red"
            ml={3}
            onClick={() => {
              disconnectIfNetworkChanged();
              onClose();
              handleJoin();
            }}
          >
            Proceed Anyway
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
