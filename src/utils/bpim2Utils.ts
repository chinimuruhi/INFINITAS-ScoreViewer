// BPI V2(BPIM2, 分布ベース)の計算
// 参考：https://github.com/BPIManager/BPIM-bpicalc/blob/main/src/v2.ts
// 参考：https://github.com/BPIManager/BPIManager2/blob/main/src/constants/iidx/newBpi/modelConstants.ts
const V2_Z0 = -0.19383932671707751;
const V2_Z100_MEDIAN = 6.516395340703802;
const V2_Z_REF = 1.9481138704797247;
const V2_RESIDUAL_RMSE = 0.3012;
const V2_Z100_IQR = 1.1916;
const V2_COEF_MEDIAN = 0.949;
const V2_BPI_FLOOR = -15;
const V2_TOTAL_BPI_SHIFT = 15;
const V2_GAMMA_CLAMP: [number, number] = [0.3, 3];
const V2_CURVE_EXP_CLAMP: [number, number] = [0.62, 3];

export interface Bpim2Chart {
  notes: number;
  wr: number;
  coef?: number | null;
  mu?: number | null;
  sigma?: number | null;
}

const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));

// t = -ln(miss)
const tOf = (score: number, maxScore: number): number => {
  const miss = Math.max(0.5, maxScore - Math.min(Math.max(score, 0), maxScore));
  return -Math.log(miss);
};

// WR位置による外れ値補正
const gammaFor = (z100: number): number => {
  const gRef = V2_Z100_MEDIAN - V2_Z0;
  const gSong = z100 - V2_Z0;
  const rTyp = (V2_Z_REF - V2_Z0) / gRef;
  const rSong = (V2_Z_REF - V2_Z0) / gSong;
  if (rTyp <= 0 || rTyp >= 1 || rSong <= 0 || rSong >= 1) return 1;
  const raw = Math.log(rTyp) / Math.log(rSong);
  if (!Number.isFinite(raw)) return 1;
  const clamped = clamp(raw, V2_GAMMA_CLAMP[0], V2_GAMMA_CLAMP[1]);
  const d = Math.abs(z100 - V2_Z100_MEDIAN) / V2_Z100_IQR;
  const w = (d * d) / (d * d + 1);
  return 1 + w * (clamped - 1);
};

const computeAnchors = (chart: Bpim2Chart) => {
  const { notes, wr, mu, sigma } = chart;
  if (mu == null || sigma == null || !notes) return null;
  const maxScore = notes * 2;
  const z100 = (tOf(wr, maxScore) - mu) / sigma;
  if (Math.abs(z100 - V2_Z0) < 1e-9) return null;
  const coef = chart.coef ?? V2_COEF_MEDIAN;
  const k = clamp(gammaFor(z100) * coef, V2_CURVE_EXP_CLAMP[0], V2_CURVE_EXP_CLAMP[1]);
  return { mu, sigma, maxScore, z100, k };
};

const rawFromZ = (z: number, z100: number, k: number): number => {
  const ratio = (z - V2_Z0) / (z100 - V2_Z0);
  return 100 * Math.sign(ratio) * Math.pow(Math.abs(ratio), k);
};

// 単曲BPI
export const calculateBpim2 = (chart: Bpim2Chart, ex: number): number | null => {
  const a = computeAnchors(chart);
  if (!a) return null;
  const z = (tOf(ex, a.maxScore) - a.mu) / a.sigma;
  const bpi = rawFromZ(z, a.z100, a.k);
  return Math.max(V2_BPI_FLOOR, Math.round(bpi * 100) / 100);
};

// 総合BPI
// scopeCharts: 集計対象の譜面(未プレイはscoreを0以下に)
// playedCharts: 潜在スキル推定に使うプレイ済み譜面(対象外の譜面を含んでもよい)
export const calculateTotalBpim2 = (
  scopeCharts: Array<{ chart: Bpim2Chart; score: number }>,
  playedCharts: Array<{ chart: Bpim2Chart; score: number }>
): number | null => {
  // 潜在スキルの推定
  const ev = V2_RESIDUAL_RMSE * V2_RESIDUAL_RMSE;
  let num = 0;
  let info = 0;
  playedCharts.forEach(({ chart, score }) => {
    const { mu, sigma, notes } = chart;
    if (mu == null || sigma == null || !notes) return;
    const t = tOf(score, notes * 2);
    num += (sigma * (t - mu)) / ev;
    info += (sigma * sigma) / ev;
  });
  const skill = info > 0 ? num / (info + 1) : NaN;

  // 未プレイ譜面は潜在スキルからの予測値を下限値と信頼度でブレンド
  const predictUnplayed = (chart: Bpim2Chart): number | null => {
    if (!(info > 0)) return null;
    const a = computeAnchors(chart);
    if (!a) return null;
    const raw = rawFromZ(skill, a.z100, a.k);
    const w = info / (info + 1);
    const blended = w * raw + (1 - w) * V2_BPI_FLOOR;
    return Math.max(V2_BPI_FLOOR, Math.round(blended * 100) / 100);
  };

  const bpis: number[] = [];
  scopeCharts.forEach(({ chart, score }) => {
    const v = score > 0 ? calculateBpim2(chart, score) : predictUnplayed(chart);
    if (v !== null) bpis.push(v);
  });
  if (bpis.length === 0) return null;

  // シフト付きべき平均
  const n = scopeCharts.length;
  bpis.sort((x, y) => y - x);
  if (n === 1) return bpis[0];
  const c = V2_TOTAL_BPI_SHIFT;
  const kPrime = Math.log(n) / Math.log((100 + c) / (50 + c));
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const bpi = i < bpis.length ? bpis[i] : V2_BPI_FLOOR;
    sum += Math.pow(bpi + c, kPrime) / n;
  }
  return Math.round((Math.pow(sum, 1 / kPrime) - c) * 100) / 100;
};
