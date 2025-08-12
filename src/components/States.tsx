import React from 'react';
import { Box, CircularProgress, Typography, Button, Stack } from '@mui/material';

export const LoadingState = ({ label = '読み込み中…' }: { label?: string }) => (
  <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}>
    <CircularProgress />
    <Typography variant="body2" color="text.secondary">{label}</Typography>
  </Stack>
);

export const EmptyState = ({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) => (
  <Box sx={{ textAlign: 'center', py: 6 }}>
    <Typography variant="subtitle1" fontWeight={800} gutterBottom>{title}</Typography>
    {description && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{description}</Typography>}
    {action}
  </Box>
);

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <Box sx={{ textAlign: 'center', py: 6 }}>
    <Typography variant="subtitle1" fontWeight={800} color="error" gutterBottom>エラーが発生しました</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{message}</Typography>
    {onRetry && <Button variant="contained" onClick={onRetry}>再試行</Button>}
  </Box>
);