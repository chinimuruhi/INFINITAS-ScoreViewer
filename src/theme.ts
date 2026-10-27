import { createTheme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';
import { bottomNavHeight, bottomNavMedia } from './constants/layoutConstrains';

declare module '@mui/material/styles' {
  interface Theme {
    layout: { pageMaxWidth: number };
  }
  interface ThemeOptions {
    layout?: { pageMaxWidth?: number };
  }
}

// 配色は「土台・メイン・差し色」の3つに絞る
//   土台   : 生成り / 墨（背景・文字）
//   メイン : 藍（リンク・ボタン・選択状態）
//   差し色 : 朱（現在地・主要な導線など、目立たせたい場所のみ）
export const tokens = {
  light: {
    base: '#F4F1E9',      // 生成り
    surface: '#FAF8F3',   // 入力欄・メニューなど一段手前の面
    ink: '#2B2A27',       // 墨
    inkSub: '#66625A',
    line: 'rgba(43, 42, 39, .14)',
    main: '#2F4E68',      // 藍
    mainText: '#F4F1E9',
    accent: '#B44A2C',    // 朱
    accentText: '#F4F1E9',
    danger: '#A33A2E',   // 削除など取り消せない操作（朱の系統で暗め）
  },
  dark: {
    base: '#1C1B19',      // 墨
    surface: '#252421',
    ink: '#E8E4DA',       // 生成り
    inkSub: '#A7A194',
    line: 'rgba(232, 228, 218, .14)',
    main: '#94B2C9',
    mainText: '#1C1B19',
    accent: '#E2825F',
    accentText: '#1C1B19',
    danger: '#E58A7A',
  },
} as const;

// ランプ色・グレード色の上に載せる文字色（色が明るいため、どちらのテーマでも墨を使う）
export const inkOnColor = tokens.light.ink;

export const createAppTheme = (mode: PaletteMode) => {
  const t = tokens[mode];

  return createTheme({
    shape: { borderRadius: 3 },
    palette: {
      mode,
      primary: { main: t.main, contrastText: t.mainText },
      secondary: { main: t.accent, contrastText: t.accentText },
      error: { main: t.danger },
      background: { default: t.base, paper: t.surface },
      text: { primary: t.ink, secondary: t.inkSub },
      divider: t.line,
    },
    typography: {
      fontFamily: [
        '-apple-system', 'BlinkMacSystemFont', '"Hiragino Sans"', '"Hiragino Kaku Gothic ProN"',
        '"Noto Sans JP"', '"Yu Gothic UI"', 'Meiryo', 'sans-serif',
      ].join(','),
      fontWeightBold: 700,
      h5: { fontWeight: 700, fontSize: '1.375rem', lineHeight: 1.4 },
      h6: { fontWeight: 700, fontSize: '1.0625rem', lineHeight: 1.5 },
      subtitle1: { fontWeight: 700 },
      subtitle2: { fontWeight: 700 },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { colorScheme: mode },
          body: {
            backgroundColor: t.base,
            color: t.ink,
            fontVariantNumeric: 'tabular-nums',
          },
          a: { color: t.main },
        },
      },
      // ダークモードで MUI が Paper に重ねる白いグラデーションを無効化
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { border: `1px solid ${t.line}` } },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'inherit' },
        styleOverrides: {
          root: { backgroundColor: t.base, color: t.ink, borderBottom: `1px solid ${t.line}` },
        },
      },
      MuiDrawer: {
        styleOverrides: { paper: { backgroundColor: t.base, borderRight: `1px solid ${t.line}` } },
      },
      MuiMenu: {
        styleOverrides: { paper: { border: `1px solid ${t.line}` } },
      },
      MuiPopover: {
        styleOverrides: { paper: { border: `1px solid ${t.line}` } },
      },
      MuiDialog: {
        styleOverrides: { paper: { border: `1px solid ${t.line}` } },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { paddingInline: 14 } },
      },
      MuiLink: {
        defaultProps: { underline: 'hover' },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { height: 8, borderRadius: 0, backgroundColor: t.line },
          bar: { borderRadius: 0 },
        },
      },
      MuiTabs: {
        defaultProps: { indicatorColor: 'secondary', textColor: 'inherit' },
        styleOverrides: {
          root: { borderBottom: `1px solid ${t.line}` },
          indicator: { height: 2 },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            fontSize: 13,
            minHeight: 42,
            color: t.inkSub,
            opacity: 1,
            '&.Mui-selected': { color: t.ink },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: t.line },
          head: { fontWeight: 700, color: t.inkSub },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&[class*="MuiTableRow-hover"]:hover, &.MuiTableRow-hover:hover': {
              backgroundColor: mode === 'light' ? 'rgba(43,42,39,.04)' : 'rgba(232,228,218,.05)',
            },
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            color: t.inkSub,
            borderColor: t.line,
            '&.Mui-selected': { color: t.ink },
          },
        },
      },
      MuiAlert: {
        styleOverrides: { root: { border: '1px solid currentColor', borderColor: t.line } },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { backgroundColor: t.ink, color: t.base, fontSize: 12 },
          arrow: { color: t.ink },
        },
      },
      // 下部ナビを出すときは、ナビと重ならないように通知を上にずらす
      MuiSnackbar: {
        styleOverrides: {
          anchorOriginBottomCenter: {
            [bottomNavMedia]: { bottom: `calc(${bottomNavHeight}px + env(safe-area-inset-bottom) + 12px)` },
          },
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: { '&:not(.MuiBackdrop-invisible)': { backgroundColor: 'rgba(28, 27, 25, .55)' } },
        },
      },
    },
    layout: { pageMaxWidth: 1200 },
  });
};
