export type FilterState = {
  cleartype?: number[];
  unlocked?: boolean;
  releaseType?: 'ac' | 'inf' | 'ac_only' | 'inf_only';
  version?: number[];
  label?: number[];
};