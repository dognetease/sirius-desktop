import { useEffect } from 'react';
import { useLocation } from '@reach/router';
import qs from 'querystring';
import { navigate } from '@reach/router';

export default (handerUrl: (param: string) => void, type: string) => {
  const location = useLocation();
  useEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];
    const params = qs.parse(location.hash.split('?')[1]);

    if (moduleName !== 'customer' && moduleName !== 'wm') {
      return;
    }
    if (!params.id) {
      return;
    }
    if (params.page !== type) {
      return;
    }

    navigate(`#customer?page=${type}`);
    handerUrl(params.id as string);
  }, [location.hash]);
};
