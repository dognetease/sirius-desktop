import React, { ReactNode } from 'react';
import { EmptyList } from './empty';

export const withEmpty = (Component: ReactNode, isEmpty: boolean) => {
  return function (props) {
    if (!isEmpty) return Component;
    return <EmptyList {...props} />;
  };
};
