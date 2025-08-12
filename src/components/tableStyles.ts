import { SxProps } from '@mui/material';

export const tableContainerSx: SxProps = {
  border: (theme) => `1px solid ${theme.palette.divider}`,
  borderRadius: 12,
  overflow: 'hidden',
  '& table': { width: '100%', borderCollapse: 'separate', borderSpacing: 0 },
  '& table thead th': { backgroundColor: 'rgba(99,102,241,.06)' },
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
};