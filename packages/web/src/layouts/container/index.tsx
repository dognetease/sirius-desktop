import React from 'react';
import { inWindow } from 'api';
// import Loadable from '@loadable/component';

// const RootWrap = Loadable(() => import('@/layouts/container/wrap'));
import RootWrap from '@/layouts/container/wrap';

const Container: React.FC<any> = props =>
  inWindow() ? (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <RootWrap {...props} />
  ) : null;
export default Container;
