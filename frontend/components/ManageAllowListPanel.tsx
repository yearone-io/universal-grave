import React from 'react';
import { Box, Image, VStack } from '@chakra-ui/react';
import ManageAllowList from './ManageAllowList';

const ManageAllowListPanel = () => {
  const logoPath = '/images/logo-full.png';

  return (
    <Box display="flex" padding='0 20px'>
      <VStack spacing={4} p={10} textAlign="center" width="65%">
        <ManageAllowList />
      </VStack>
      <Box width="35%">
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
