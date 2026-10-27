import React from 'react';
import { Box, Stack, SxProps, Typography } from '@mui/material';

// ページ本文の区画。カードの枠や影は付けず、余白と見出しだけで区切る
const SectionCard: React.FC<{
  title?: React.ReactNode;
  subheader?: React.ReactNode;
  action?: React.ReactNode;
  dense?: boolean;
  sx?: SxProps;
  children: React.ReactNode;
}> = ({ title, subheader, action, dense, sx, children }) => (
  <Box component="section" sx={{ pb: dense ? 2 : 3, ...sx }}>
    {(title || action || subheader) && (
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Box>
          {title && <Typography variant="h6">{title}</Typography>}
          {subheader && <Typography variant="body2" color="text.secondary">{subheader}</Typography>}
        </Box>
        {action}
      </Stack>
    )}
    {children}
  </Box>
);

export default SectionCard;
