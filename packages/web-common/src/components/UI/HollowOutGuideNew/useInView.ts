import React from 'react';
import { useIntersection } from 'react-use';

const useInView = (childrenRef?: React.MutableRefObject<any>) => {
  if (!childrenRef) {
    return true;
  }

  const intersection = useIntersection(childrenRef, {
    root: null,
    rootMargin: '0px',
    threshold: 1,
  });

  return intersection && intersection.intersectionRatio >= 1;
};

export default useInView;
