import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    layout: { pageMaxWidth: number };
  }
  interface ThemeOptions {
    layout?: { pageMaxWidth?: number };
  }
}

export const theme = createTheme({
  shape: { borderRadius: 14 },
  palette: {
    mode: 'light',
    primary: { main: '#6366F1' },
    secondary: { main: '#38BDF8' },
    background: {
      default: '#fff',
      paper: '#fff',
    },
  },
  typography: {
    fontWeightBold: 800,
    h5: { fontWeight: 800, letterSpacing: .2 },
    h6: { fontWeight: 800, letterSpacing: .2 },
    subtitle1: { fontWeight: 700 },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  components: {
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 16,
          borderColor: theme.palette.divider,
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, paddingInline: 14, paddingBlock: 8 },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: 'rgba(0,0,0,.06)' },
        head: { fontWeight: 800 },
      },
    },
    MuiDrawer: { styleOverrides: { paper: { borderRight: '1px solid rgba(0,0,0,.08)' } } },
  },
  layout: { pageMaxWidth: 1200 },
});