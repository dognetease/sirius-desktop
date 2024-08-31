import React, { useState } from 'react';
import classnames from 'classnames';
import { Button, Drawer, Space, Tabs } from 'antd';
import { useVersionCheck } from '@web-common/hooks/useVersion';
import { getIn18Text } from 'api';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { AuthorizationList } from './containers/AuthorizationList';
import { AuthorizationHistory } from './containers/AuthorizationHistory';
import { ViewPermissionList } from './containers/ViewPermissionList';
import { drawerClassName } from './context';
import style from './autorecommend.module.scss';

const { TabPane } = Tabs;
export const Authorization: React.FC = () => {
  const [tab, setTab] = useState('apply');
  const [showViewPermission, setShowViewPermission] = useState(false);
  const menuVersion = useVersionCheck();
  const isV2 = menuVersion === 'v2';
  const els = (
    <div className={classnames([style.wrapper, style.flex, style.flexCol])}>
      <div className={style.top}>
        <div className={classnames([style.title, style.flex])}>
          <div className={style.flex1}>{getIn18Text('SHOUQUANGUANLI-WANGLAIYOUJIAN')}</div>

          <Space>
            <Button className={style.whitelistBtn} onClick={() => setShowViewPermission(true)}>
              {getIn18Text('SHAIXUANCHENGYUANLIEBIAO')}
            </Button>
          </Space>
        </div>
        <Tabs className={style.specialTab} defaultActiveKey={tab} onChange={v => setTab(v)}>
          <TabPane tab={getIn18Text('SHOUQUANSHENQING')} key="apply" />
          <TabPane tab={getIn18Text('SHOUQUANJILU')} key="history" />
        </Tabs>
      </div>
      <div className={classnames([style.content, style.flex1, style.flex, style.flexCol])}>{tab === 'apply' ? <AuthorizationList /> : <AuthorizationHistory />}</div>
      <Drawer
        title={getIn18Text('SHAIXUANCHENGYUANLIEBIAO')}
        width={872}
        onClose={() => setShowViewPermission(false)}
        visible={showViewPermission}
        destroyOnClose={Boolean(true)}
        className={drawerClassName}
      >
        <ViewPermissionList />
      </Drawer>
    </div>
  );
  if (isV2) {
    return els;
  }
  return (
    <PermissionCheckPage resourceLabel="PREVIOUS_CONTACT" accessLabel="CONTACT_GRANT_EMAIL_SETTING" menu="PREVIOUS_CONTACT_GRANT_ADMIN">
      {els}
    </PermissionCheckPage>
  );
};
