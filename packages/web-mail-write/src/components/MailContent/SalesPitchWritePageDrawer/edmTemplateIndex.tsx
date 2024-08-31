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

const SalesPitchEdmTemplateDrawer = () => {
  const SalesPitchPage = useMemo(() => SalesPitchPageHoc('edmTemplate'), []);

  const [drawerVisible] = useState2ReduxMock('drawerVisible');
  const [edmTemplateOuterDrawerVisible, setEdmTemplateOuterDrawerVisible] = useState2ReduxMock('edmTemplateOuterDrawerVisible');

  const innerVisible = edmTemplateOuterDrawerVisible && !drawerVisible;

  useEffect(() => {
    if (edmTemplateOuterDrawerVisible) {
      salesPitchManageTrack({ opera: 'SHOW' });
    }
  }, [edmTemplateOuterDrawerVisible]);

  const onCloseHandler = () => {
    setEdmTemplateOuterDrawerVisible(false);
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
      destroyOnClose={!edmTemplateOuterDrawerVisible}
    >
      <SalesPitchPage />
    </Drawer>
  );
};

export default SalesPitchEdmTemplateDrawer;
