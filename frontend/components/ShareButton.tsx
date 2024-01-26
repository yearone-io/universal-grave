import React from 'react';
import { Button, useClipboard, useToast } from '@chakra-ui/react';
import { FaShare } from 'react-icons/fa';

const ClientShareButton = ({ pageAccount }: { pageAccount: string | null }) => {
  if (!pageAccount) {
    return null;
  }
  const currentUrl = `${window.location.host}/grave/${pageAccount}`;
  const { hasCopied, onCopy } = useClipboard(currentUrl);
  const toast = useToast();

  const handleShare = () => {
    onCopy();
    toast({
      title: 'Link copied to clipboard.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Button
      colorScheme="blue"
      onClick={handleShare}
      size={'sm'}
      rightIcon={<FaShare />}
    >
      {hasCopied ? 'Copied' : 'Share'}
    </Button>
  );
};

export default ClientShareButton;
