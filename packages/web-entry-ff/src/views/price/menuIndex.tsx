import React, { useMemo, useCallback } from 'react';
import { useLocation } from '@reach/router';
import Upload from './upload/index';
import AddIndex from './upload/addIndex';
import Price from './index';

// import RouteSearch from './routeSearch';
const FFmsMenuIndex: React.FC = () => {
  const location = useLocation();

  const page = useMemo(() => {
    const urlSpl = String(window.location.hash).slice(1).split('?');
    const params = new URLSearchParams(urlSpl[1] || '');
    return params.get('page') || '';
  }, [location]);

  const renderPage = useCallback(() => {
    switch (page) {
      case 'addPrice':
        return <AddIndex />;
      case 'uploadPrice':
        return <Upload />;
      default:
        return <Price />;
    }
  }, [page]);

  return renderPage();
};
export default FFmsMenuIndex;
