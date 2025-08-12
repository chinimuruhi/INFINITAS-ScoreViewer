import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

export const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ width: '100%', px: { xs: 1, sm: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
    {children}
  </Box>
);

type HeaderVariant = 'plain' | 'underline' | 'leftAccent' | 'subtleBar';

export const PageHeader: React.FC<{
  title: React.ReactNode;
  actions?: React.ReactNode;
  compact?: boolean;
  variant?: HeaderVariant;
}> = ({ title, actions, compact = true, variant = 'subtleBar' }) => {
  const base = {
    mb: compact ? 1.25 : 2,
    py: compact ? 0.75 : 1,
  } as const;

  const variants: Record<HeaderVariant, any> = {
    plain: { ...base },
    underline: {
      ...base,
      borderBottom: (theme: any) => `1px solid ${theme.palette.divider}`,
    },
    leftAccent: {
      ...base,
      pl: 1.25,
      borderLeft: (theme: any) => `3px solid ${theme.palette.primary.main}`,
    },
    subtleBar: {
      ...base,
      py: 1,
      borderBottom: (theme: any) => `1px solid ${theme.palette.divider}`,
    },
  };

  const wrapSx = variants[variant];

  return (
    // bleed: 下線は左右いっぱい、タイトルはカード本文のインデントと揃える
    <Box sx={{ ...wrapSx, mx: { xs: -1, sm: -2, md: -3 }, px: 0 }}>
      <Box sx={{ px: { xs: 1.5, sm: 2 }, width: '100%' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'start', sm: 'center' }}
          justifyContent="space-between"
          spacing={compact ? 1 : 1.5}
        >
          <Typography variant="h5" sx={{ pl: { xs: 1, sm: 3 }, fontWeight: 800, letterSpacing: .2 }}>
            {title}
          </Typography>
          {actions && <Stack direction="row" spacing={1}>{actions}</Stack>}
        </Stack>
      </Box>
    </Box>
  );
};
