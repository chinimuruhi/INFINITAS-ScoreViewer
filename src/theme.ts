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
    primary: { main: '#2563eb' },
    secondary: { main: '#64748b' },
    background: {
      default: '#f8fafc',
      paper: '#FFFFFF',
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
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            'radial-gradient(circle, rgba(37,99,235,.07) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow:
            '0 1px 4px rgba(0,0,0,.06), 0 6px 20px rgba(0,0,0,.07)',
          border: '1px solid rgba(0,0,0,.1)',
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation3: {
          boxShadow: '0 1px 3px rgba(0,0,0,.08), 0 2px 8px rgba(0,0,0,.06)',
          transition: 'box-shadow 150ms ease, transform 150ms ease',
          '&:hover': {
            boxShadow: '0 4px 14px rgba(0,0,0,.15)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, paddingInline: 14, paddingBlock: 8 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          height: 8,
          backgroundColor: 'rgba(0,0,0,.08)',
        },
        bar: { borderRadius: 999 },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: 13,
          minHeight: 42,
          letterSpacing: .2,
        },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: 'rgba(0,0,0,.07)' },
        head: {
          fontWeight: 800,
          backgroundColor: 'rgba(0,0,0,.04)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: '1px solid rgba(0,0,0,.1)' },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          '&.Mui-selected': {
            fontWeight: 800,
          },
        },
      },
    },
  },
  layout: { pageMaxWidth: 1200 },
});
