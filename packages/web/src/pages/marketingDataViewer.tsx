import React, { Suspense, lazy } from 'react';
import { PageProps } from 'gatsby';
import { Loading } from '@web-edm/components/MarketingDataPreview/Loading';
import SiriusLayout from '../layouts';

/**
 * 营销数据预览页
 */
const MarketingDataViewer: React.FC<PageProps> = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const Component = lazy(() => import('@web-edm/components/MarketingDataPreview'));

  return (
    <SiriusLayout.ContainerLayout isLogin={false}>
      <Suspense fallback={<Loading percent={0} />}>
        <Component />
      </Suspense>
    </SiriusLayout.ContainerLayout>
  );
};

export default MarketingDataViewer;
