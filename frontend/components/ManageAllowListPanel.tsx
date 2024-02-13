import React from 'react';
import { Box, Image } from '@chakra-ui/react';
import ManageAllowList from './ManageAllowList';

const ManageAllowListPanel = () => {
  const logoPath = '/images/logo-full.png';

  return (
    <Box display="flex">
      <ManageAllowList />
      <Image src={logoPath} alt="Universal-Grave-logo" width={'300px'} />
    </Box>
  );
};

export default ManageAllowListPanel;
