import React from 'react';
import { Box, Stack } from '@mui/material';

const FiltersBar: React.FC<{
  left?: React.ReactNode;
  right?: React.ReactNode;
}> = ({ left, right }) => (
  <Box
    sx={{
      p: 1.25,
      borderRadius: 2,
      border: (theme) => `1px solid ${theme.palette.divider}`,
      backgroundColor: 'background.paper',
      mb: 1.5,
    }}
  >
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
      <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">{left}</Stack>
      <Stack direction="row" spacing={1.25}>{right}</Stack>
    </Stack>
  </Box>
);

export default FiltersBar;