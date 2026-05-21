import { ReactNode } from 'react';
import { ModeProvider, useMode } from './ModeContext';
import { FilterProvider, useFilters } from './FilterContext';
import { FilterState } from '../types/Types';

interface AppContextType {
  mode: 'SP' | 'DP';
  setMode: React.Dispatch<React.SetStateAction<'SP' | 'DP'>>;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

export const AppProvider = ({ children }: { children: ReactNode }) => (
  <ModeProvider>
    <FilterProvider>
      {children}
    </FilterProvider>
  </ModeProvider>
);

export const useAppContext = (): AppContextType => {
  const { mode, setMode } = useMode();
  const { filters, setFilters } = useFilters();
  return { mode, setMode, filters, setFilters };
};
