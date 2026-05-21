import React, { createContext, useContext, useState, ReactNode } from 'react';

type Mode = 'SP' | 'DP';

interface ModeContextType {
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<Mode>('SP');
  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>;
};

export const useMode = (): ModeContextType => {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used within ModeProvider');
  return ctx;
};
