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

  const { URDLsp7, URDLsp8 } = walletContext;

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
        <AlertDialogHeader>Whoops! not so fast!</AlertDialogHeader>
        <AlertDialogCloseButton />
        <AlertDialogBody>
          "Hey, just a heads up! You've got a Universal Receiver Delegate set up
          for LSP7 ({URDLsp7}) and maybe for LSP8 ({URDLsp8}) too. If you jump
          into the Grave, it's gonna switch up your current URD. This could mess
          with some stuff on your UP profile, especially the parts that rely on
          these."
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            colorScheme="red"
            ml={3}
            onClick={() => {
              onClose();
              handleJoin();
            }}
          >
            Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
