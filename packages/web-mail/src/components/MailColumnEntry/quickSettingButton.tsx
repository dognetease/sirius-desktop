// 邮件快捷设置栏
import React from 'react';
import classnames from 'classnames';
import { Tooltip } from 'antd';

import style from './quickSetting.module.scss';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { apiHolder, apis, DataTrackerApi } from 'api';
import { getIn18Text } from 'api';
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface quickSettingProps {
  // 是否仅仅展示图标，不展示文字按钮
  isMini: boolean;
  // Drawer展开事件
  onDrawerOpen?: () => void;
}

const QuickSettingButton: React.FC<any> = (props: quickSettingProps) => {
  const { isMini, onDrawerOpen } = props || {};

  // 抽屉是否展示
  const [visible, setVisible] = useState2RM('configMailShow', 'doUpdateConfigMailShow');

  // 打开抽屉
  const openDrawer = () => {
    setVisible(true);
    onDrawerOpen && onDrawerOpen();
    // 打开快捷设置，打点
    trackApi.track('pcMail_click_quickSet_mailListPage', { layout: isMini ? '左右分栏' : '通栏' });
  };

  // 返回dom
  return (
    <span onClick={openDrawer} data-test-id="mail-list-tab-config-btn" style={{ fontSize: '12px', display: 'flex', alignItems: 'center' }}>
      {isMini ? (
        <Tooltip title={getIn18Text('YOUXIANGSHEZHI')} autoAdjustOverflow>
          <i className={classnames(style.itemIcon, style.setting)} />
        </Tooltip>
      ) : (
        <i className={classnames(style.itemIcon, style.setting)} />
      )}
      {!isMini && <span style={{ marginLeft: '4px', minWidth: 50 }}>{getIn18Text('YOUXIANGSHEZHI')}</span>}
    </span>
  );
};
export default QuickSettingButton;
