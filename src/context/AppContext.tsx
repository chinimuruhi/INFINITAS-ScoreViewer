import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FilterState } from '../types/Types';

interface AppContextType {
  mode: 'SP' | 'DP';
  setMode: React.Dispatch<React.SetStateAction<'SP' | 'DP'>>;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

interface AppProviderProps {
  children: ReactNode;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<'SP' | 'DP'>('SP');
  const [filters, setFilters] = useState<FilterState>({});

  return (
    <AppContext.Provider value={{ mode, setMode, filters, setFilters }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
