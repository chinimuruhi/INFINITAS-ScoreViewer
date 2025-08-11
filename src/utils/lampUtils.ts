import { achiveTargetClearMap } from '../constants/clearConstrains';

// ランプ達成数カウント
export const getLampAchiveCount = (filteredSongs: any[], clearData: any) => {
  const lampAchieved = (lamp: number, threshold: number): boolean => lamp >= threshold;
  
  const result: Record<string, number> = {};

  Object.keys(achiveTargetClearMap).forEach((key) => {
    const threshold = achiveTargetClearMap[key as keyof typeof achiveTargetClearMap];
    result[key] = filteredSongs.filter((s) =>
      lampAchieved(clearData[`${s.id}_${s.difficulty}`] || 0, threshold)
    ).length;
  });

  return result
}
