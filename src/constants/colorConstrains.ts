export const clearColorMap: { [key: number]: string } = {
  0: '#FFFFFF',
  1: '#CCCCCC',
  2: '#FF66CC',
  3: '#99FF99',
  4: '#99CCFF',
  5: '#FF6666',
  6: '#FFFF99',
  7: '#FF9966'
};

export const raderCategoryColors: Record<string, string> = {
  NOTES: '#ff69b4',
  CHORD: '#99ff99',
  PEAK: '#ffff66',
  CHARGE: '#cc66ff',
  SCRATCH: '#ff6666',
  SOFLAN: '#99ccff'
};

export const scoreColorMap: { [key: string]: string } = {
    'AAA': '#4caf50',
    'AA': '#ffeb3b',
    'A': '#ff9800',
    'MAX-': '#f44336',
    'B': '#2196f3',
    'C': '#2196f3',
    'D': '#2196f3',
    'E': '#2196f3',
    'F': '#2196f3'
};

export const bpiGapColor = (gap: number, isBg: boolean): string => {
  let alpha = "1";
  if (isBg) alpha = "0.5";
  if (gap < -20) return "rgba(255, 49, 49, " + alpha + ")"; 
  if (gap < -15) return "rgba(255, 78, 78, " + alpha + ")";
  if (gap < -10) return "rgba(255, 140, 140, " + alpha + ")";
  if (gap < -5) return "rgba(255, 180, 180, " + alpha + ")";
  if (gap < 0) return "rgba(255, 233, 153, " + alpha + ")";
  if (gap <= 5) return "rgba(234, 239, 249, " + alpha + ")";
  if (gap <= 10) return "rgba(108, 155, 210, " + alpha + ")";
  if (gap <= 15) return "rgba(24, 127, 196, " + alpha + ")";
  if (gap <= 20) return "rgba(0, 104, 183, " + alpha + ")";
  if (gap <= 30) return "rgba(0, 98, 172, " + alpha + ")";
  if (gap <= 40) return "rgba(0, 82, 147, " + alpha + ")";
  if (gap <= 50) return "rgba(0, 64, 119, " + alpha + ")";
  return "rgba(0, 53, 103, " + alpha + ")";
};