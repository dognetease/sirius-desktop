import { useEffect } from 'react';
import { useLocation } from '@reach/router';
import qs from 'querystring';

export default (handerUrl: (param: string) => void, type: string) => {
  const location = useLocation();
  useEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];
    if (moduleName !== 'customer') {
      return;
    }
    const params = qs.parse(location.hash.split('?')[1]);
    if (params.id) {
      handerUrl(params.id as string);
    }
  }, [location.hash]);
};
