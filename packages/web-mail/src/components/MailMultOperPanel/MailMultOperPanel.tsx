/* eslint-disable no-nested-ternary */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import './MailMultOperPanel.scss';
import { MailEntryModel } from 'api';
import useMailStore from '@web-mail/hooks/useMailStoreRedux';
import { getCheckedMails } from '@web-mail/utils/mail';
import FolderLogo from './FolderLogo';
import useState2RM from '../../hooks/useState2ReduxMock';
import MailMultOperationBtns from './MailMultOperationBtns';
import { getIn18Text } from 'api';
import { CommonMailMenuConfig } from '@web-mail/types';

const MailMultOperPanel: React.FC<any> = () => {
  // 邮件选择总数
  // const [mailCount, setMailCount] = useState(0);
  // 邮件-搜索-搜索类型
  const [mailSearching] = useState2RM('mailSearching', 'doUpdateMailSearching');
  // 是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);
  // 搜索-邮件列表
  const [searchList] = useMailStore('searchList');
  // 邮件列表-选中的邮件id list
  const [activeIds] = useState2RM('activeIds');
  // 邮件-邮件列表
  const [mailDataList] = useMailStore('mailDataList');

  const mailList = isSearching ? searchList : mailDataList;

  // useEffect(() => {
  //   const checkedMails = getCheckedMails(activeIds, mailList as MailEntryModel[]);
  //   // 计算包含聚合邮件的所有邮件总数
  //   setMailCount(checkedMails.length);
  // }, [activeIds, mailList]);

  // 计算包含聚合邮件-子邮件的所有邮件总数
  const allMailCount = useMemo(() => {
    const checkedMails = getCheckedMails(activeIds, mailList as MailEntryModel[]);
    return checkedMails?.length || 0;
  }, [activeIds, mailList]);

  // 生成按钮DomProps的回调
  const domPropsRender = useCallback((mails: MailEntryModel, menuConfig: CommonMailMenuConfig) => {
    return {
      'data-test-id': 'mail-menu-multPanel-' + menuConfig?.key,
    };
  }, []);

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
              <FolderLogo sum={allMailCount} />
            </div>
            <div className="num-wrap">
              <div className="num">{allMailCount}</div>
              <div className="tip">{getIn18Text('YIXUANZEYOUJIAN')}</div>
            </div>
          </div>
          <MailMultOperationBtns domProps={domPropsRender} />
        </div>
      </div>
    </div>
  );
};
export default MailMultOperPanel;
