import React, { useEffect, useMemo } from 'react';
import { Drawer } from 'antd';
import classnames from 'classnames';
import { apiHolder } from 'api';
import useState2ReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';
import SalesPitchPageHoc from '@/components/Layout/EnterpriseSetting/salesPitch';
import { salesPitchManageTrack } from '@/components/Layout/EnterpriseSetting/salesPitch/utils/util';

import './index.scss';

const { isMac } = apiHolder.env;
const systemApi = apiHolder.api.getSystemApi();
const isWindows = systemApi.isElectron() && !isMac;

const SalesPitchEdmMailDrawer = () => {
  const SalesPitchPage = useMemo(() => SalesPitchPageHoc('edmMailEditor'), []);

  const [drawerVisible] = useState2ReduxMock('drawerVisible');
  const [edmMailOuterDrawerVisible, setEdmMailOuterDrawerVisible] = useState2ReduxMock('edmMailOuterDrawerVisible');

  const innerVisible = edmMailOuterDrawerVisible && !drawerVisible;

  useEffect(() => {
    if (edmMailOuterDrawerVisible) {
      salesPitchManageTrack({ opera: 'SHOW' });
    }
  }, [edmMailOuterDrawerVisible]);

  const onCloseHandler = () => {
    setEdmMailOuterDrawerVisible(false);
  };

  return (
    <Drawer
      className={classnames('salesPitchWritePageDrawer', {
        salesPitchWritePageDrawerInWindows: isWindows,
      })}
      maskStyle={{ backgroundColor: 'transparent' }}
      visible={innerVisible}
      onClose={onCloseHandler}
      footer={null}
      width={888}
      maskClosable={true}
      bodyStyle={{ padding: 0 }}
      destroyOnClose={!edmMailOuterDrawerVisible}
    >
      <SalesPitchPage />
    </Drawer>
  );
};

export default SalesPitchEdmMailDrawer;
