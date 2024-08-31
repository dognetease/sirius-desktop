import React, { useMemo } from 'react';
import { MailEntryModel, apiHolder as api, apis, DataTrackerApi } from 'api';
import { MAIL_MENU_ITEM } from '@web-mail/common/constant';
import MailMultOperPanelConfig from '@web-mail/common/components/MailMenu/mailMenuConifg/MailMultOperPanelConfig';
import useMailStore from '@web-mail/hooks/useMailStoreRedux';
import MailMenuIcon from '@web-mail/common/components/MailMenu/MailMenuIcon/MailMenuIcon';
import useState2RM from '../../hooks/useState2ReduxMock';

import { CommonMailMenuConfig } from '@web-mail/types';
import useCreateCallbackForEvent from '@web-mail/hooks/useCreateCallbackForEvent';

const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

// 邮件多选按钮
const MailMultOperationBtns: React.FC<any> = props => {
  const { size = 'normal', domProps } = props;
  // 邮件-搜索-搜索类型
  const [mailSearching] = useState2RM('mailSearching');
  // 是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);
  const [selectedKeys] = useState2RM('selectedKeys');
  // 搜索-邮件列表
  const [searchList] = useMailStore('searchList');
  // 邮件列表-选中的邮件idlist
  const [activeIds] = useState2RM('activeIds');
  // 邮件-邮件列表
  const [mailDataList] = useMailStore('mailDataList');
  // 邮件列表-上部-二级tab选中
  const [selected] = useState2RM('mailListStateTab');

  const MialList = isSearching ? searchList : mailDataList;

  // 导出邮件打点
  const handleExportTrack = useCreateCallbackForEvent(() => {
    trackApi.track('pcMail_click_export', { folderId: selectedKeys.id, isSearching, tab: selected });
  });

  const checkedMails = useMemo(() => {
    const list: MailEntryModel[] = [];
    if (activeIds && MialList) {
      activeIds.forEach(_id => {
        const mail = MialList.find(item => item.entry.id === _id);
        mail && list.push(mail);
      });
    }
    return list;
  }, [activeIds, MialList]);

  /**
   * 业务菜单配置
   * 劫持导出按钮的点击事件增加打点
   */
  const menuConfig = useMemo<CommonMailMenuConfig[]>(() => {
    return [
      {
        key: MAIL_MENU_ITEM.EXPORT,
        onClick: (mails, defaultClick) => {
          handleExportTrack();
          defaultClick && defaultClick(mails);
        },
      },
    ];
  }, []);

  return (
    <div className={`oper-wrap ${size === 'mini' ? 'mini' : ''}`}>
      {checkedMails.length ? <MailMenuIcon mail={checkedMails} menu={menuConfig} defaultMenu={MailMultOperPanelConfig} menuType="text" domProps={domProps} /> : <></>}
    </div>
  );
};
export default MailMultOperationBtns;
