import React, { useEffect, useState } from 'react';
import {
  Button,
  useClipboard,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { LinkIcon } from '@chakra-ui/icons';

const ClientShareButton = ({ pageAccount }: { pageAccount: string | null }) => {
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (!pageAccount) {
      setCurrentUrl('');
      return;
    }

    setCurrentUrl(`${window.location.host}/grave/${pageAccount}`);
  }, [pageAccount]);
  const { hasCopied, onCopy } = useClipboard(currentUrl);
  const toast = useToast();

  if (!pageAccount || !currentUrl) {
    return null;
  }

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
      <MenuButton
        as={Button}
        variant="ghost"
        color="whiteAlpha.800"
        fontSize="sm"
        fontWeight="500"
        fontFamily="Montserrat"
        rightIcon={<LinkIcon />}
        _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
      >
        Share
      </MenuButton>
      <MenuList bg="rgba(26, 32, 44, 0.95)" backdropFilter="blur(10px)" borderColor="whiteAlpha.200">
        <MenuItem
          onClick={handleCopyLink}
          bg="transparent"
          color="whiteAlpha.900"
          _hover={{ bg: 'whiteAlpha.100' }}
        >
          {hasCopied ? 'Copied' : 'Copy Link'}
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default ClientShareButton;
