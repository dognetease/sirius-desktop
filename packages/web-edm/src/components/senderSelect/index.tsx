import React, { useCallback, useEffect, useState } from 'react';
import { AccountApi, api, apis, MailAliasAccountModel, util, MailConfApi } from 'api';
import { Dropdown, Menu } from 'antd';
import { MenuInfo } from 'rc-menu/lib/interface';
import style from '@web-mail-write/components/SendMail/index.module.scss';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import IconCard from '@web-common/components/UI/IconCard';
import { getIn18Text } from 'api';
const mailConfApi: MailConfApi = api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
export interface SenderSelectProps {
  setSender: (email: string) => void;
  email: string;
}
export const SenderSelect: React.FC<SenderSelectProps> = prop => {
  const { setSender, email } = prop;
  const [mailAliasAccount, setMailAliasAccount] = useState<MailAliasAccountModel[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string>(email);
  const getMailAliasAccountList = async () => {
    let mainAndAliaAccounts: MailAliasAccountModel[] = await mailConfApi.getMailSenderInfo();
    mainAndAliaAccounts = mainAndAliaAccounts.map(item => ({ ...item, isMainAccount: true }));
    setMailAliasAccount(mainAndAliaAccounts);
    const ishasAlia = mainAndAliaAccounts.some(each => {
      return each.mailEmail === email || each.id === email;
    });
    if ((!email && mainAndAliaAccounts.length > 0) || !ishasAlia) {
      const main = mainAndAliaAccounts.find(item => !!item.isMainEmail);
      setSender((main?.mailEmail || main?.id) as string);
    }
  };
  useEffect(() => {
    if (!!email) {
      setSelectedEmail(email);
    }
  }, [email]);
  useEffect(() => {
    if (mailAliasAccount.length > 0 && mailAliasAccount.every(i => i.id !== email)) {
      setSelectedEmail(mailAliasAccount[0].id);
      setSender(mailAliasAccount[0].id);
    }
  }, [mailAliasAccount]);
  useEffect(() => {
    getMailAliasAccountList();
  }, []);
  useMsgRenderCallback('mailAliasAccountListChange', () => {
    getMailAliasAccountList();
  });

  const handleMenuClick = (e: MenuInfo) => {
    const item = mailAliasAccount.filter(it => it.id === e.key).pop();
    if (item) {
      setSender(item.id);
    }
  };
  const menu = (
    <Menu onClick={handleMenuClick}>
      {mailAliasAccount.map(it => (
        <Menu.Item
          key={it.id}
          className={it.id === selectedEmail ? 'current' : ''}
          style={it.id === selectedEmail ? { color: 'rgba(56, 110, 231, 1)', width: '100%' } : { width: '100%' }}
        >
          {it.id}
        </Menu.Item>
      ))}
    </Menu>
  );
  return (
    <div className={`${style.sender}`} style={{ display: 'inline-block' }}>
      <span>{getIn18Text('FAJIANREN\uFF1A')}</span>
      <Dropdown overlay={menu} trigger={['click']} placement="topCenter">
        <span style={{ cursor: 'pointer' }}>
          <span className={`${style.senderName}`} title={email}>
            {util.chopStrToByteSize(selectedEmail, 30)}
            &nbsp;
          </span>
          <IconCard type="upTriangle" />
        </span>
      </Dropdown>
    </div>
  );
};
