import React, { useMemo, useContext } from 'react';
import { MailEntryModel, apiHolder as api, apis, DataTrackerApi } from 'api';
import { MAIL_MENU_ITEM } from '@web-mail/common/constant';
import MailMultOperPanelConfig from '@web-mail/common/components/MailMenu/mailMenuConifg/MailMultOperPanelConfig';
import useMailStore from '@web-mail/hooks/useMailStoreRedux';
import MailMenuIcon from '@web-mail/common/components/MailMenu/MailMenuIcon/MailMenuIcon';
import { useState2CustomerSlice, ctSliceContext } from '@web-mail/hooks/useState2SliceRedux';
import { SliceIdParams } from '@web-mail/types';
import { CommonMailMenuConfig } from '@web-mail/types';
import useCreateCallbackForEvent from '@web-mail/hooks/useCreateCallbackForEvent';

const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const MailMultOperationBtns: React.FC<SliceIdParams<{ size: string }>> = props => {
  const { size = 'normal' } = props;
  // const dispatch = useAppDispatch();
  // const reducer = useActions(MailActions);
  const sliceId = useContext(ctSliceContext);

  // const [checkedMails, setCheckedMails] = useState<MailEntryModel[]>([]);
  // const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  // 搜索-邮件列表
  const [searchList] = useMailStore('searchList', undefined, sliceId, 'customer');
  // 邮件-邮件列表
  const [mailDataList] = useMailStore('mailDataList', undefined, sliceId, 'customer');

  // 邮件-搜索-搜索类型
  const [mailSearching] = useState2CustomerSlice('mailSearching');
  const [selectedKeys] = useState2CustomerSlice('selectedKeys');
  // 邮件列表-选中的邮件id list
  const [activeIds] = useState2CustomerSlice('activeIds');
  // 邮件列表-上部-二级tab选中
  const [selected] = useState2CustomerSlice('mailListStateTab');

  // 是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);
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
      {checkedMails.length ? <MailMenuIcon mail={checkedMails} menu={menuConfig} defaultMenu={MailMultOperPanelConfig} menuType="text" /> : <></>}
    </div>
  );
};
export default MailMultOperationBtns;
