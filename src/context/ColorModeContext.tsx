import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { CssBaseline, PaletteMode } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from '../theme';
import { colorModeKey } from '../constants/localStrageConstrains';

export type ColorModePreference = PaletteMode | 'system';

interface ColorModeContextType {
  preference: ColorModePreference;
  resolvedMode: PaletteMode;
  setPreference: (preference: ColorModePreference) => void;
  toggle: () => void;
}

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined);

const darkQuery = '(prefers-color-scheme: dark)';

const readPreference = (): ColorModePreference => {
  try {
    const v = localStorage.getItem(colorModeKey);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch { /* LocalStorage が使えない環境では端末設定に従う */ }
  return 'system';
};

export const ColorModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ColorModePreference>(readPreference);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.(darkQuery).matches ?? false);

  useEffect(() => {
    const mq = window.matchMedia?.(darkQuery);
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolvedMode: PaletteMode = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  // index.html の初期描画（プリレンダー部分）と同じ属性で揃える
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedMode;
  }, [resolvedMode]);

  const setPreference = (p: ColorModePreference) => {
    setPreferenceState(p);
    try { localStorage.setItem(colorModeKey, p); } catch { /* 保存できなくても表示は切り替える */ }
  };

  const toggle = () => setPreference(resolvedMode === 'dark' ? 'light' : 'dark');

  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode]);

  return (
    <ColorModeContext.Provider value={{ preference, resolvedMode, setPreference, toggle }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export const useColorMode = (): ColorModeContextType => {
  const ctx = useContext(ColorModeContext);
  if (!ctx) throw new Error('useColorMode must be used within ColorModeProvider');
  return ctx;
};
