// LampAchieveProgressList.tsx
import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { achiveTargetClearMap } from '../constants/clearConstrains';
import { clearColorMap } from '../constants/colorConstrains';

interface LampAchieveProgressProps {
  stats: Record<string, number>;
  totalCount: number;
}

const LampAchieveProgress: React.FC<LampAchieveProgressProps> = ({ stats, totalCount }) => {
  return (
    <Box sx={{ my: 2 }}>
      {Object.keys(achiveTargetClearMap).map((key) => (
        <Box key={key} sx={{ mb: 1 }}>
          <Typography variant="body1">
            {key}達成率: {totalCount > 0 ? ((stats[key] / totalCount) * 100).toFixed(1) : '0.0'}% ({stats[key]}/{totalCount})
          </Typography>
          <LinearProgress
            variant="determinate"
            value={totalCount > 0 ? (stats[key] / totalCount) * 100 : 0}
            sx={{
              backgroundColor: '#eee',
              '& .MuiLinearProgress-bar': {
                backgroundColor: clearColorMap[achiveTargetClearMap[key]]
              }
            }}
          />
        </Box>
      ))}
    </Box>
  );
};

export default LampAchieveProgress;
