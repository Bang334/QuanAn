import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

const MenuPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Menu Page
      </Typography>
      <Typography variant="body1">
        This is a simplified version of the menu page to test exports.
      </Typography>
    </Box>
  );
};

export default MenuPage; 