// _pgf関数の実装
const pgf = (num: number, maxScore: number): number => {
  if (num === maxScore) {
    return maxScore * 0.8;
  } else {
    return 1.0 + (num / maxScore - 0.5) / (1.0 - num / maxScore);
  }
};

// BPI計算の関数
export const calculateBpi = (wr: number, avg: number, notes: number, ex: number, coef: number): number | null => {
  try {
    const maxScore = notes * 2;
    const powCoef = coef !== -1 ? coef : 1.175;
    
    const _s = pgf(ex, maxScore);
    const _k = pgf(avg, maxScore);
    const _z = pgf(wr, maxScore);
    
    const _s_ = _s / _k;
    const _z_ = _z / _k;
    
    const p = ex >= avg ? 1 : -1;
    
    const result = Math.round((p * 100.0) * Math.pow(p * Math.log(_s_) / Math.log(_z_), powCoef) * 100.0) / 100.0;
    
    return Math.max(-15, result);
  } catch (error) {
    return null;
  }
};