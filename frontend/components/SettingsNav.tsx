import React from 'react';
import { Box } from '@chakra-ui/react';

const SettingsNav = () => {
  return (
    <Box display="flex" flexDir="column">
      <Box>Subscriptions</Box>
      <Box>Manage Allow List</Box>
      <Box>Advance Info</Box>
    </Box>
  );
};

export default SettingsNav;
