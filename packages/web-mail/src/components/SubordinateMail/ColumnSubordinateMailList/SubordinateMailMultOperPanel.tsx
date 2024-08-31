import React, { useEffect, useState, useContext } from 'react';
import '../../MailMultOperPanel/MailMultOperPanel.scss';
import { MailEntryModel, inWindow, locationHelper } from 'api';
import FolderLogo from '../../MailMultOperPanel/FolderLogo';
import useMailStore from '@web-mail/hooks/useMailStoreRedux';
import MailMultiOperationBtns from '@web-mail/components/SubordinateMail/ColumnSubordinateMailList/MaiMultiOperation/MailMultOperationBtns';
import { getCheckedMails } from '@web-mail/utils/mail';

import { useState2SubordinateSlice, SdSliceContext } from '@web-mail/hooks/useState2SliceRedux';
import { getIn18Text } from 'api';

const SubordinateMailMultiOperPanel: React.FC = () => {
  const [mailCount, setMailCount] = useState(0);
  const sliceId = useContext(SdSliceContext);

  // 邮件-邮件列表
  const [mailDataList] = useMailStore('mailDataList', undefined, sliceId, 'subordinate');

  // 邮件列表-选中的邮件id list
  const [activeIds] = useState2SubordinateSlice('activeIds');

  useEffect(() => {
    const checkedMails = getCheckedMails(activeIds, mailDataList as MailEntryModel[]);
    // 计算包含聚合邮件的所有邮件总数
    setMailCount(checkedMails.length);
  }, [activeIds, mailDataList]);

  return (
    <div
      className="u-read-wrapper"
      style={{
        height: '100%',
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
          <MailMultiOperationBtns size="" sliceId={sliceId} />
        </div>
      </div>
    </div>
  );
};

export default SubordinateMailMultiOperPanel;
