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
import { networkNameToIdMapping, supportedNetworks } from '@/constants/supportedNetworks';

const ShareButton = ({ networkName, pageAccount }: { networkName: string; pageAccount: string | null; }) => {
  const network = supportedNetworks[networkNameToIdMapping[networkName]];

  const currentUrl = `${network.baseUrl}/${networkName}/grave/${pageAccount}`;
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

  if (!pageAccount) {
    return null;
  }

  return (
    <Menu>
      <MenuButton as={Button} size={'sm'} rightIcon={<FaShare />}>
        Share
      </MenuButton>
      <MenuList color={'dark.purple.300'} >
        <MenuItem onClick={handleCopyLink} fontWeight={'700'}>
          {hasCopied ? 'Copied' : 'Copy Link'}
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default ShareButton;
