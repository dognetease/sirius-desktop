import React from 'react';
import { SearchTable } from './searchTable';
import { SearchProvider } from './searchProvider';
export const Freight = () => {
  return (
    <SearchProvider>
      <SearchTable />
    </SearchProvider>
  );
};
