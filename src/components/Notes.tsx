import React, { useState } from 'react';
import { Box, Button, Collapse, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';

// 補足説明の一文。本文より小さく薄く表示する
// warning のときだけ「注意」を差し色で添える
export const Note: React.FC<{ warning?: boolean; children: React.ReactNode }> = ({ warning, children }) => (
  <Typography
    variant="body2"
    component="p"
    sx={{ m: 0, fontSize: { xs: 12, sm: 13 }, lineHeight: 1.75, color: 'text.secondary' }}
  >
    {warning && (
      <Box component="span" sx={{ color: 'secondary.main', fontWeight: 700, mr: 0.75 }}>注意</Box>
    )}
    {children}
  </Typography>
);

// 補足説明のまとまり。PC では常に表示し、スマホでは折りたたむ
export const NoteGroup: React.FC<{ label?: string; children: React.ReactNode; sx?: object }> = ({
  label = '説明',
  children,
  sx,
}) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);

  const body = <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>{children}</Box>;

  if (!isXs) return <Box sx={{ my: 2, ...sx }}>{body}</Box>;

  return (
    <Box sx={{ my: 1.5, ...sx }}>
      <Button
        size="small"
        color="inherit"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        endIcon={<ExpandMoreRoundedIcon sx={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }} />}
        sx={{ px: 0, minWidth: 0, fontSize: 12, color: 'text.secondary' }}
      >
        {open ? `${label}を閉じる` : `${label}を表示`}
      </Button>
      <Collapse in={open}>
        <Box sx={{ pt: 0.5 }}>{body}</Box>
      </Collapse>
    </Box>
  );
};
