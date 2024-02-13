import React from 'react';
import { Box, Image } from '@chakra-ui/react';
import ManageAllowList from './ManageAllowList';

const ManageAllowListPanel = () => {
  const logoPath = '/images/logo-full.png';

  return (
    <Box display="flex">
      <Box width="70%">
        <ManageAllowList />
      </Box>
      <Box width="30%">
        <Image
          src={logoPath}
          alt="Universal-Grave-logo"
          height={'410px'}
          width="266px"
          padding="25px"
        />
      </Box>
    </Box>
  );
};

export default ManageAllowListPanel;
