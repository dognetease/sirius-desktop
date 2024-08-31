import { api, apis, AccountApi, SubAccountTableModel, ContactTreeType } from 'api';
import React, { useEffect, useState, useCallback } from 'react';
import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import styles from './index.module.scss';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import { ContactTreeProp } from '@web-common/components/UI/SiriusContact/tree/data';
import AccountTree from '@web-common/components/UI/SiriusContact/tree/AccountTree';
import { StaticRootNodeKey } from '@web-common/utils/contact_util';

const sysApi = api.getSystemApi();
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
//模拟多账号数据
const mockData: SubAccountTableModel[] = [
  {
    id: 'wuxian02@lingxi.devtest.com',
    emailType: 'NeteaseQiYeMail',
    agentEmail: 'wuxian02@lingxi.devtest.com',
    accountType: 'mainAccount',
    mainAccount: 'wuxian02@lingxi.devtest.com',
  },
  {
    id: 'wuxian03@lingxi.devtest.com',
    emailType: 'NeteaseQiYeMail',
    agentEmail: 'wuxian03@lingxi.devtest.com',
    accountType: 'qyEmail',
    mainAccount: 'wuxian03@lingxi.devtest.com',
  },
];
type ContactModuleProps =
  | 'showContact'
  | 'renderTitleSuffix'
  | 'onSelectNode'
  | 'onInited'
  | 'contactTreeDecorateMap'
  | 'selectedKeys'
  | 'selectDefaultNodeOnInited'
  | 'showPersonalMark'
  | 'onContextMenu'
  | 'onMarked';
type Props = Pick<ContactTreeProp, ContactModuleProps> & {
  refreshId?: number;
};
const defaltProps = {
  showAddOrgBtn: false,
  showAddTeamBtn: false,
  showAddPersonalBtn: false,
  showAvatar: false,
  showCheckbox: false,
  showContact: false,
  accountRootKey: undefined,
  defaultExpandedKeys: [StaticRootNodeKey.PERSON, StaticRootNodeKey.ENTERPRISE],
};

export default (props: Props) => {
  const { contactTreeDecorateMap, refreshId, selectedKeys, showPersonalMark } = props;
  const currentAccount = sysApi.getCurrentUser()?.id || '';
  const [activeAccountKey, setActiveAccountKey] = useState<string>(currentAccount);
  const [accountList, setAccountList] = useState<Array<SubAccountTableModel>>([]);
  const treeContent = useCallback(
    (treeWidth, treeHeight) => {
      if (accountList.length > 1) {
        const accountLen = accountList.length - 1;
        const height = treeHeight - (accountLen + 1) * 32;
        return (
          <>
            {accountList.map(item => {
              const { id: account, emailType, agentEmail, accountType } = item;
              const isMainAccount = accountType === 'mainAccount';
              const isQyAccount = accountType === 'qyEmail';
              const type: ContactTreeType[] = ['personal'];
              const showEnterprise = isMainAccount || isQyAccount;
              if (showEnterprise) {
                type.push('enterprise');
              }
              return (
                <>
                  <AccountTree
                    {...defaltProps}
                    {...props}
                    isIM={false}
                    defaultExpandedKeys={isMainAccount ? defaltProps.defaultExpandedKeys : []}
                    isMainAccount={isMainAccount}
                    selectDefaultNodeOnInited={false}
                    isSingleAccount={false}
                    type={type}
                    showPersonalMark={isMainAccount}
                    showSeparator={false}
                    treeWidth={treeWidth}
                    treeHeight={height}
                    _account={account}
                    accountRootKey={account + '_root'}
                    accountType={emailType}
                    rootTitle={agentEmail}
                    onExpand={() => {
                      setActiveAccountKey(account + '_root');
                    }}
                    activeAccountKey={activeAccountKey}
                  />
                </>
              );
            })}
          </>
        );
      }
      return (
        <>
          <AccountTree
            {...defaltProps}
            {...props}
            isIM={false}
            isMainAccount
            showPersonalMark={showPersonalMark}
            isSingleAccount
            _account={currentAccount}
            type={['personal', 'enterprise']}
            accountRootKey={currentAccount}
            contactTreeDecorateMap={contactTreeDecorateMap}
            treeWidth={treeWidth}
            treeHeight={treeHeight}
          />
        </>
      );
    },
    [accountList, activeAccountKey, selectedKeys]
  );

  const getAccountList = useCallback(() => {
    accountApi
      .getMainAndSubAccounts({ expired: false })
      .then(res => {
        setAccountList(res);
        // setAccountList(mockData);
      })
      .catch(err => {
        console.error('[contact tree] getMainAndSubAccounts error', err);
      });
  }, [setAccountList]);
  useEffect(() => {
    getAccountList();
  }, [refreshId]);
  // 窗口数据可以用
  useMsgRenderCallback('SubAccountWindowReady', () => {
    getAccountList();
  });
  // 账号过期
  useMsgRenderCallback('SubAccountLoginExpired', () => {
    getAccountList();
  });
  // 账号删除
  useMsgRenderCallback('SubAccountDeleted', () => {
    getAccountList();
  });
  return (
    <div className={styles.treeWrap}>
      <AutoSizer style={{ width: '100%', height: '100%' }}>
        {({ width, height }) => {
          return treeContent(width, height);
        }}
      </AutoSizer>
    </div>
  );
};
