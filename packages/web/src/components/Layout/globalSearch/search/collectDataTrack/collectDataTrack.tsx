import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { useIntersection } from 'react-use';
import { api } from 'api';
import { globalSearchDataTracker } from '../../tracker';

interface collectDataProps {
  onInterSection?(): void;
}

const sysApi = api.getSystemApi();

const collectData = (collectDataProps: collectDataProps) => {
  const { onInterSection } = collectDataProps;

  const collectRef = useRef<HTMLDivElement>(null);

  // const locationHash = location.hash;
  // useEffect(() => {
  //   let timer: any;
  //   if (data && data.length > 0) {
  //     timer = sysApi.intervalEvent({
  //       eventPeriod: 'mid',
  //       seq: 10,
  //       handler: () => {
  //         globalSearchDataTracker.trackCollectData({
  //           count: data.length,
  //           keywords: keyWords,
  //           info: data,
  //           origin
  //         })
  //       },
  //     });
  //   }
  //   return () => {
  //     if (timer) {
  //       sysApi.cancelEvent('mid', timer);
  //     }
  //   };
  // }, [locationHash]);

  const interSection = useIntersection(collectRef, {
    root: null,
    threshold: 1,
    rootMargin: '0px',
  });

  useEffect(() => {
    if (onInterSection && interSection && interSection.intersectionRatio >= 1) {
      onInterSection();
    }
  }, [interSection?.intersectionRatio, onInterSection]);

  return <div ref={collectRef}></div>;
};

export default collectData;
