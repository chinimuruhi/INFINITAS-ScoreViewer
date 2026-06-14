import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { achiveTargetClearMap } from '../constants/clearConstrains';
import { clearColorMap } from '../constants/colorConstrains';

interface LampAchieveProgressProps {
  stats: Record<string, number>;
  totalCount: number;
}

const labelMap: Record<string, string> = {
  'FULLCOMBO': 'F-COMBO',
};

const LampAchieveProgress: React.FC<LampAchieveProgressProps> = ({ stats, totalCount }) => {
  return (
    <Box sx={{ my: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      {Object.keys(achiveTargetClearMap).map((key) => {
        const count = stats[key] ?? 0;
        const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
        const color = clearColorMap[achiveTargetClearMap[key]];
        return (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.5 } }}>
            <Box sx={{ width: { xs: 10, sm: 12 }, height: { xs: 10, sm: 12 }, borderRadius: '50%', backgroundColor: color, flexShrink: 0, border: '1px solid rgba(0,0,0,.15)' }} />
            <Typography
              variant="caption"
              sx={{ width: { xs: 50, sm: 56 }, flexShrink: 0, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.60rem', sm: undefined } }}
            >
              {labelMap[key] ?? key}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                flex: 1,
                '& .MuiLinearProgress-bar': { backgroundColor: color },
              }}
            />
            <Typography
              variant="caption"
              sx={{ width: { xs: 50, sm: 100 }, flexShrink: 0, textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'text.secondary', fontSize: { xs: '0.68rem', sm: undefined } }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                {count}/{totalCount}{' '}
              </Box>
              ({pct.toFixed(1)}%)
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default LampAchieveProgress;
