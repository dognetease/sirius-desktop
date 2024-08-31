// 邮件快捷设置栏
import React, { useState } from 'react';
import { Drawer, Button } from 'antd';
import { navigate } from 'gatsby';
import { apiHolder, SystemApi } from 'api';

import MailModeMergeOrAI from '@web-setting/Mail/components/MailModeMergeOrAI/MailModeMergeOrAI';
import MailLayout from '@web-setting/Mail/components/MailLayout/MailLayout';
import MailDescAndAttachment from '@web-setting/Mail/components/MailDescAndAttachment/MailDescAndAttachment';
import MailAutoMarkRead from '@web-setting/Mail/components/MailAutoMarkRead/mailAutoMarkRead';
import SeparateLine from '@web-setting/Mail/components/SeparateLine/separateLine';
import ReplyForwardClose from '@web-setting/Mail/components/ReplyForwardClose/replyForwardClose';
import MailTightness from '@web-setting/Mail/components/MailTightness/MailTightness';
import style from './quickSetting.module.scss';
import CloseIcon from '@web-common/components/UI/Icons/svgs/CloseMailSvg';

import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { isMainAccount } from '@web-mail/util';
import { getIn18Text } from 'api';
const systemApi = apiHolder.api.getSystemApi() as SystemApi;

const isEdm = !!process.env.BUILD_ISEDM;
const isWebWmEntry = !!process.env.IS_WM_ENTRY;

const getTopByEnv = () => {
  if (systemApi.isElectron()) {
    return '36px';
  }
  if (isWebWmEntry) {
    return '90px';
  }
  if (isEdm) {
    return '36px';
  }
  return '82px';
};

const QuickSetting: React.FC<any> = () => {
  // 抽屉是否展示
  const [visible, setVisible] = useState2RM('configMailShow', 'doUpdateConfigMailShow');
  // 邮件列表-文件夹-选中的key
  const [selectedKeys, setSelectedKeys] = useState2RM('selectedKeys', 'doUpdateSelectedKey');
  // 关闭抽屉
  const closeDrawer = () => {
    setVisible(false);
  };

  // 去邮箱设置
  const gotoMailConfig = () => {
    // 关闭抽屉
    closeDrawer();
    // 跳转到邮箱设置
    navigate('/#setting', { state: { currentTab: 'mail' } });
  };

  // web端不存在多账号所以展示此设置，客户端根据当前操作的账号是否是主账号来判断
  const MailModeMergeOrAIShow = !systemApi.isElectron() ? true : isMainAccount(selectedKeys.accountId);
  const top = getTopByEnv();
  // 返回dom
  return (
    <Drawer
      // title={<span style={{ color: '#232d47' }}>{getIn18Text('YOUXIANKUAIJIESHEZHI')}</span>}
      title={<span>{getIn18Text('YOUXIANKUAIJIESHEZHI')}</span>}
      placement="right"
      closeIcon={<CloseIcon className="dark-invert" />}
      width="456"
      maskStyle={{ backgroundColor: 'rgba(0,0,0,0)' }}
      contentWrapperStyle={{ top, height: `calc(100% - ${top})` }}
      bodyStyle={{ padding: '20px 16px', paddingTop: '0px', overflowX: 'hidden' }}
      headerStyle={{ border: 'none', padding: '20px 16px' }}
      onClose={closeDrawer}
      visible={visible}
      destroyOnClose
      className={`ant-allow-dark ${style.drawerWrap}`}
    >
      <div>
        {/* 展示模式 */}
        {MailModeMergeOrAIShow && (
          <>
            <div className={style.quickSettingTitle} style={{ marginTop: '0px' }}>
              {getIn18Text('ZHANSHIMOSHI')}
            </div>
            <MailModeMergeOrAI isVisible={visible} isQuick={true} />
          </>
        )}
        {/* 邮件视图 */}
        <div className={style.quickSettingTitle}>{getIn18Text('YOUJIANSHITU')}</div>
        <MailLayout isQuick={true} />
        {/* 列表密度 */}
        <div className={style.quickSettingTitle}>{getIn18Text('mailTightness')}</div>
        <MailTightness isQuick={true} />
        {/* 邮件列表展示 */}
        <div className={style.quickSettingTitle}>{getIn18Text('mailListElementControl')}</div>
        <MailDescAndAttachment isQuick={true} />
        <MailAutoMarkRead />
        <SeparateLine />
        <ReplyForwardClose />
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <Button style={{ width: '128px' }} ghost type="primary" onClick={gotoMailConfig}>
            {getIn18Text('moreMailConfig')}
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
export default QuickSetting;
