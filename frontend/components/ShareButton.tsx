'use client';
import React from 'react';
import {
  Button,
  useClipboard,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { FaShare } from 'react-icons/fa';

const ClientShareButton = ({ pageAccount }: { pageAccount: string | null }) => {
  if (!pageAccount) {
    return null;
  }

  const currentUrl = `${window.location.host}/grave/${pageAccount}`;
  const { hasCopied, onCopy } = useClipboard(currentUrl);
  const toast = useToast();

  const handleCopyLink = () => {
    onCopy();
    toast({
      title: 'Link copied to clipboard.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Menu>
      <MenuButton as={Button} size={'sm'} rightIcon={<FaShare />}>
        Share
      </MenuButton>
      <MenuList>
        <MenuItem onClick={handleCopyLink}>
          {hasCopied ? 'Copied' : 'Copy Link'}
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default ClientShareButton;
