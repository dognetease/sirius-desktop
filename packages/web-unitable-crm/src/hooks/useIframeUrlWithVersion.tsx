import React, { useMemo } from 'react';

export const iframeUrlJoinWithVersion = (url: string) => {
  if (url) {
    const siriusVersion = window.siriusVersion;
    const urlObj = new URL(url);
    urlObj.searchParams.set('siriusVersion', siriusVersion);
    return urlObj.toString();
  }
  return url;
};

/**
 * iframe拼接灵犀办公版本
 * @param url
 * @returns
 */
export const useIframeUrlWithVersion = (url: string) => {
  return useMemo(() => {
    return iframeUrlJoinWithVersion(url);
  }, [url]);
};
