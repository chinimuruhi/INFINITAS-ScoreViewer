export const getGrade = (percentage: number): string => {
  if (percentage < 2 / 9) return 'F';
  if (percentage < 1 / 3) return 'E';
  if (percentage < 4 / 9) return 'D';
  if (percentage < 5 / 9) return 'C';
  if (percentage < 2 / 3) return 'B';
  if (percentage < 7 / 9) return 'A';
  if (percentage < 8 / 9) return 'AA';
  return 'AAA';
};

export const getDetailGrade = (score: number, notes: number): string => {
  const percentage = getPercentage(score, notes);
  if (percentage < 4 / 18) return 'E-' + (Math.ceil(notes * 4 / 9) - score).toString();
  if (percentage < 5 / 18) return 'E+' + (score - Math.ceil(notes * 4 / 9)).toString();
  if (percentage < 6 / 18) return 'D-' + (Math.ceil(notes * 6 / 9) - score).toString();
  if (percentage < 7 / 18) return 'D+' + (score - Math.ceil(notes * 6 / 9)).toString();
  if (percentage < 8 / 18) return 'C-' + (Math.ceil(notes * 8 / 9) - score).toString();
  if (percentage < 9 / 18) return 'C+' + (score - Math.ceil(notes * 8 / 9)).toString();
  if (percentage < 10 / 18) return 'B-' + (Math.ceil(notes * 10 / 9) - score).toString();
  if (percentage < 11 / 18) return 'B+' + (score - Math.ceil(notes * 10 / 9)).toString();
  if (percentage < 12 / 18) return 'A-' + (Math.ceil(notes * 12 / 9) - score).toString();
  if (percentage < 13 / 18) return 'A+' + (score - Math.ceil(notes * 12 / 9)).toString();
  if (percentage < 14 / 18) return 'AA-' + (Math.ceil(notes * 14 / 9) - score).toString();
  if (percentage < 15 / 18) return 'AA+' + (score - Math.ceil(notes * 14 / 9)).toString();
  if (percentage < 16 / 18) return 'AAA-' + (Math.ceil(notes * 16 / 9) - score).toString();
  if (percentage < 17 / 18) return 'AAA+' + (score - Math.ceil(notes * 16 / 9)).toString();
  if (percentage <= 1) return 'MAX-' + (notes * 2 - score).toString();
  return 'invalidScore';
};

export const getPercentage = (score: number, notes: number): number => {
  return (score || 0) / (notes * 2);
};
