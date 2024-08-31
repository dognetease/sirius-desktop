import React, { useEffect, useMemo, useState, useContext } from 'react';
import '../../MailMultOperPanel/MailMultOperPanel.scss';
import { MailEntryModel, inWindow, locationHelper } from 'api';
import FolderLogo from '../../MailMultOperPanel/FolderLogo';
import useMailStore from '@web-mail/hooks/useMailStoreRedux';
import MailMultiOperationBtns from '@web-mail/components/CustomerMail/ColumnCustomerMailList/MaiMultiOperation/MailMultOperationBtns';
import { getCheckedMails } from '@web-mail/utils/mail';

import { useState2CustomerSlice, ctSliceContext } from '@web-mail/hooks/useState2SliceRedux';
import { getIn18Text } from 'api';

const CustomerMailMultiOperPanel: React.FC<{}> = () => {
  const sliceId = useContext(ctSliceContext);
  const [mailCount, setMailCount] = useState(0);

  // 搜索-邮件列表
  const [searchList] = useMailStore('searchList', undefined, sliceId, 'customer');

  // 邮件-邮件列表
  const [mailDataList] = useMailStore('mailDataList', undefined, sliceId, 'customer');

  // 邮件-搜索-搜索类型
  const [mailSearching] = useState2CustomerSlice('mailSearching');

  // 邮件列表-选中的邮件id list
  const [activeIds] = useState2CustomerSlice('activeIds');

  // 邮件-搜索-是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);

  const mailList = isSearching ? searchList : mailDataList;

  useEffect(() => {
    const checkedMails = getCheckedMails(activeIds, mailList as MailEntryModel[]);
    // 计算包含聚合邮件的所有邮件总数
    setMailCount(checkedMails.length);
  }, [activeIds, mailList]);

  return (
    <div
      className="u-read-wrapper"
      style={{
        height: inWindow() && !locationHelper.isMainPage() ? 'calc(100% - 32px)' : '100%',
      }}
    >
      <div className="mail-mop-wrap">
        <div className="mop-contetn">
          <div className="detail-wrap">
            <div className="logo-wrap">
              <FolderLogo sum={mailCount} />
            </div>
            <div className="num-wrap">
              <div className="num">{mailCount}</div>
              <div className="tip">{getIn18Text('YIXUANZEYOUJIAN')}</div>
            </div>
          </div>
          <MailMultiOperationBtns size="" />
        </div>
      </div>
    </div>
  );
};

export default CustomerMailMultiOperPanel;
