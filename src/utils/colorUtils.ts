import { Theme } from '@mui/material/styles';
import { inkOnColor } from '../theme';

const toRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// color を ratio の割合で base に重ねた色
export const mixColor = (color: string, base: string, ratio: number): string => {
  const a = toRgb(color);
  const b = toRgb(base);
  const c = a.map((v, i) => Math.round(v * ratio + b[i] * (1 - ratio)));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

const isBlank = (color?: string) => !color || /^#?f{3}(f{3})?$/i.test(color) || color === 'white';

export type Tone = { bg: string; fg: string; edge: string };

// 楽曲タイル用：ランプ色・グレード色をテーマに合わせて整える
//   ライト：元の色を生成りに寄せた面＋墨の文字
//   ダーク：色を墨に薄く重ねた面＋左端に元の色の帯＋生成りの文字
export const tileTone = (color: string | undefined, theme: Theme): Tone => {
  const { paper } = theme.palette.background;
  const line = theme.palette.divider;
  if (isBlank(color)) return { bg: paper, fg: theme.palette.text.primary, edge: line };
  if (theme.palette.mode === 'dark') {
    return { bg: mixColor(color!, paper, 0.2), fg: theme.palette.text.primary, edge: color! };
  }
  return { bg: mixColor(color!, paper, 0.7), fg: inkOnColor, edge: line };
};

// ランプ名などの小さなラベル用：元の色＋墨の文字（未プレーは枠線のみ）
export const labelTone = (color: string | undefined, theme: Theme): Tone => {
  if (isBlank(color)) return { bg: 'transparent', fg: theme.palette.text.secondary, edge: theme.palette.divider };
  return { bg: color!, fg: inkOnColor, edge: color! };
};
