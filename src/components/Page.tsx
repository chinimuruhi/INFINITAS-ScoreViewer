import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

export const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ width: '100%', py: { xs: 2, md: 3 } }}>
    {children}
  </Box>
);

// タイトルと操作ボタンはスマホでも同じ行に置き、ボタンは右端に寄せる
// subtitle はタイトルの下に小さく添える補足（DJ名や日付など）
export const PageHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  compact?: boolean;
  variant?: string;
}> = ({ title, subtitle, actions, compact = true }) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    spacing={1.5}
    sx={{ mb: compact ? 2 : 3, pb: 1.25, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h5" component="h1">{title}</Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: { xs: 12, sm: 13 } }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {actions && <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>{actions}</Stack>}
  </Stack>
);
