import React, { useMemo, useContext } from 'react';
import { MailEntryModel, apiHolder as api, apis, DataTrackerApi } from 'api';
import MailMultOperPanelConfig from '@web-mail/common/components/MailMenu/mailMenuConifg/MailMultOperPanelConfig';
import useMailStore from '@web-mail/hooks/useMailStoreRedux';
import MailMenuIcon from '@web-mail/common/components/MailMenu/MailMenuIcon/MailMenuIcon';
import { useState2SubordinateSlice, ctSliceContext } from '@web-mail/hooks/useState2SliceRedux';

const MailMultOperationBtns: React.FC<any> = props => {
  const { size = 'normal', sliceId } = props;

  // const sliceId = useContext(ctSliceContext);
  // 邮件-邮件列表
  const [mailDataList] = useMailStore('mailDataList', undefined, sliceId, 'subordinate');
  // 邮件列表-选中的邮件id list
  const [activeIds] = useState2SubordinateSlice('activeIds');

  const checkedMails = useMemo(() => {
    const list: MailEntryModel[] = [];
    if (activeIds && mailDataList) {
      activeIds.forEach(_id => {
        const mail = mailDataList.find(item => item.entry.id === _id);
        mail && list.push(mail);
      });
    }
    return list;
  }, [activeIds, mailDataList]);

  return (
    <div className={`oper-wrap ${size === 'mini' ? 'mini' : ''}`}>
      {checkedMails.length ? <MailMenuIcon mail={checkedMails} defaultMenu={MailMultOperPanelConfig} menuType="text" /> : <></>}
    </div>
  );
};
export default MailMultOperationBtns;
