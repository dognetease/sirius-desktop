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

const SalesPitchWritePageDrawer = () => {
  const SalesPitchPage = useMemo(() => SalesPitchPageHoc('writePage'), []);

  const [drawerVisible] = useState2ReduxMock('drawerVisible');
  const [writePageOuterDrawerVisible, setWritePageOuterDrawerVisible] = useState2ReduxMock('writePageOuterDrawerVisible');

  const innerVisible = writePageOuterDrawerVisible && !drawerVisible;

  useEffect(() => {
    if (writePageOuterDrawerVisible) {
      salesPitchManageTrack({ opera: 'SHOW' });
    }
  }, [writePageOuterDrawerVisible]);

  const onCloseHandler = () => {
    setWritePageOuterDrawerVisible(false);
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
      destroyOnClose={!writePageOuterDrawerVisible}
    >
      <SalesPitchPage />
    </Drawer>
  );
};

export default SalesPitchWritePageDrawer;
