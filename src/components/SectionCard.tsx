import React from 'react';
import { Card, CardContent, CardHeader, SxProps } from '@mui/material';

const SectionCard: React.FC<{
  title?: React.ReactNode;
  subheader?: React.ReactNode;
  action?: React.ReactNode;
  dense?: boolean;
  sx?: SxProps;
  children: React.ReactNode;
}> = ({ title, subheader, action, dense, sx, children }) => (
  <Card sx={{ borderRadius: 3, ...sx }}>
    {(title || action || subheader) && (
      <CardHeader titleTypographyProps={{ fontWeight: 800 }} title={title} subheader={subheader} action={action} />
    )}
    <CardContent sx={{ pt: title ? 0 : 2, pb: dense ? 1.5 : 2.5 }}>
      {children}
    </CardContent>
  </Card>
);

export default SectionCard;