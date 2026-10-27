import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

export const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ width: '100%', py: { xs: 2, md: 3 } }}>
    {children}
  </Box>
);

export const PageHeader: React.FC<{
  title: React.ReactNode;
  actions?: React.ReactNode;
  compact?: boolean;
  variant?: string;
}> = ({ title, actions, compact = true }) => (
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    alignItems={{ xs: 'flex-start', sm: 'center' }}
    justifyContent="space-between"
    spacing={1}
    sx={{ mb: compact ? 2 : 3, pb: 1.25, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
  >
    <Typography variant="h5" component="h1">{title}</Typography>
    {actions && <Stack direction="row" spacing={1}>{actions}</Stack>}
  </Stack>
);
