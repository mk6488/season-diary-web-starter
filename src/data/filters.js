import React, { createContext, useContext, useMemo, useState } from 'react';

const FiltersContext = createContext(null);

export function FiltersProvider({ children }){
  const [focus, setFocus] = useState('');
  const [query, setQuery] = useState('');
  const value = useMemo(() => ({ focus, setFocus, query, setQuery, clear(){ setFocus(''); setQuery(''); } }), [focus, query]);
  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters(){
  const ctx = useContext(FiltersContext);
  if(!ctx) throw new Error('useFilters must be used within FiltersProvider');
  return ctx;
}


