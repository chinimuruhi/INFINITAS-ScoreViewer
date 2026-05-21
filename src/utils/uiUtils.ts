export const getTitleFontSize = (text: string, compact = false) => {
  const len = text.length;
  const offset = compact ? 2 : 0;
  if (len >= 25) return { xs: 8 - offset, sm: 13, md: 13 };
  if (len >= 15) return { xs: 10 - offset, sm: 14, md: 14 };
  return { xs: 12 - offset, sm: 14, md: 14 };
};
