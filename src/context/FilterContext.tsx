import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FilterState } from '../types/Types';
import { filtersKey } from '../constants/localStrageConstrains';

interface FilterContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(
    () => JSON.parse(localStorage.getItem(filtersKey) || '{}')
  );

  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem(filtersKey, JSON.stringify(filters));
    }, 500);
    return () => clearTimeout(id);
  }, [filters]);

  return <FilterContext.Provider value={{ filters, setFilters }}>{children}</FilterContext.Provider>;
};

export const useFilters = (): FilterContextType => {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
};
