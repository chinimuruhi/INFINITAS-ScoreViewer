import React from 'react';
import { achiveTargetClearMap } from '../constants/clearConstrains';
import { clearColorMap } from '../constants/colorConstrains';
import AchieveBars from './AchieveBars';

interface LampAchieveProgressProps {
  stats: Record<string, number>;
  totalCount: number;
}

const labelMap: Record<string, string> = {
  'FULLCOMBO': 'F-COMBO',
};

const LampAchieveProgress: React.FC<LampAchieveProgressProps> = ({ stats, totalCount }) => (
  <AchieveBars
    totalCount={totalCount}
    items={Object.keys(achiveTargetClearMap).map((key) => ({
      key,
      label: labelMap[key] ?? key,
      count: stats[key] ?? 0,
      color: clearColorMap[achiveTargetClearMap[key]],
    }))}
  />
);

export default LampAchieveProgress;
