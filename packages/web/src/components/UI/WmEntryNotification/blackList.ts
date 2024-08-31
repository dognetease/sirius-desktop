import { useEffect, useState } from 'react';
import { useLocation } from '@reach/router';

// 网页端新版本上线提示黑名单。命中黑名单不展示该提示。
const BlackList = ['#edm?page=write', '#edm?page=batchWrite'];

export const checkBlackList = (href: string): boolean => BlackList.some(list => href.includes(list));

export const useBlackList = () => {
  const [inBlack, setInBlack] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // window.addEventListener('hashchange', () => setInBlack(checkBlackList(location.href)));
    setInBlack(checkBlackList(location.hash));
  }, [location.hash]);

  return inBlack;
};
