import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

// ランプ・グレードの達成率を横棒で並べる（色はランプ色・グレード色のみ）
const AchieveBars: React.FC<{
  totalCount: number;
  items: { key: string; label: string; count: number; color: string }[];
}> = ({ totalCount, items }) => (
  <Box
    sx={{
      my: 2,
      display: 'grid',
      gridTemplateColumns: { xs: 'auto 1fr auto', sm: '72px 1fr 120px' },
      alignItems: 'center',
      columnGap: { xs: 1, sm: 1.5 },
      rowGap: 0.75,
    }}
  >
    {items.map(({ key, label, count, color }) => {
      const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
      return (
        <React.Fragment key={key}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: { xs: 11, sm: 12 } }}>
            {label}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{ '& .MuiLinearProgress-bar': { backgroundColor: color } }}
          />
          <Typography variant="caption" sx={{ textAlign: 'right', color: 'text.secondary', fontSize: { xs: 11, sm: 12 } }}>
            {count}/{totalCount}
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}> ({pct.toFixed(1)}%)</Box>
          </Typography>
        </React.Fragment>
      );
    })}
  </Box>
);

export default AchieveBars;
