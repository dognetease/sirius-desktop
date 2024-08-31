import { api, apis, AccountApi, SubAccountTableModel, ContactTreeType, ProductAuthApi } from 'api';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import styles from './index.module.scss';
import { ContactTreeOrgNodeType } from '@web-common/components/util/contact';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import { useAppSelector } from '@web-common/state/createStore';
import { ContactTreeDecorateProp, ContactTreeProp } from './data';
import AccountTree, { treeRootKey } from './AccountTree';
import { getMainAccount } from '@web-mail/util';
import CustomerSvg from '@web-common/components/UI/Icons/svgs/CustomerIcon';
import { StaticRootNodeKey } from '@web-common/utils/contact_util';

const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const productApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
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
const createAccountRootKey = (key: string) => {
  return key + '_root';
};
export default (props: ContactTreeProp) => {
  const {
    onExpand,
    useEdm,
    useMultiAccount,
    accountRootKey,
    type: propsType = ['personal', 'enterprise', 'team', 'recent'],
    noRelateEnterprise,
    showSeparator,
    showOrgMemberNum,
  } = props;
  const currentAccount = getMainAccount();
  // TODO 把多账号下选中的选中能力activeAccountKey，提供给上层使用（当前是放到写信调用组件中使用）
  const writeMailCurAccount = useAppSelector(state => state.mailReducer.currentMail?.optSender);
  const [activeAccountKey, setActiveAccountKey] = useState<string>(createAccountRootKey(accountRootKey || currentAccount));
  const [accountList, setAccountList] = useState<Array<SubAccountTableModel>>([]);
  let type = propsType;
  if (useEdm && process.env.BUILD_ISEDM && productApi.getABSwitchSync('edm_mail')) {
    const temp = new Set<ContactTreeType>(['customer', ...propsType]);
    type = [...temp];
  }
  // 多账号或者单账号下非根，叶的节点，但是需要在树上展示的节点（分割线，提示信息等）
  const contactTreeDecorateMap = useMemo(() => {
    const separatorKeys: string[] = [...treeRootKey];
    const decorateMap: ContactTreeDecorateProp = new Map();
    showSeparator &&
      separatorKeys.forEach(item => {
        decorateMap.set(
          item,
          new Map([
            [
              'rootSeparator',
              {
                element: (
                  <div className={styles.nodeSeparator}>
                    {' '}
                    <div className={styles.nodeSeparatorLine}></div>{' '}
                  </div>
                ),
                height: 17,
                distance: -1,
              },
            ],
          ])
        );
      });
    return decorateMap;
  }, [showSeparator]);
  const treeContent = useCallback(
    (treeWidth, treeHeight) => {
      // 多账号环境
      if (useMultiAccount && accountList.length > 1) {
        const accountLen = accountList.length - 1;
        const height = treeHeight - (accountLen + 1) * 32;
        return (
          <>
            {
              // 只有外贸环境且多账号才有客户联系人
              !!useEdm && (
                <AccountTree
                  {...props}
                  titleRenderMap={{
                    [StaticRootNodeKey.CUSTOMER]: title => {
                      return (
                        <div className={styles.rootKeyWrap}>
                          <div className={styles.rootKeyIcon}>
                            <CustomerSvg />
                          </div>
                          <div className={styles.rootKeyName}>{title}</div>
                        </div>
                      );
                    },
                  }}
                  isSingleAccount={false}
                  type={['customer']}
                  order={['customer']}
                  showSeparator={false}
                  accountRootKey={StaticRootNodeKey.CUSTOMER}
                  contactTreeDecorateMap={contactTreeDecorateMap}
                  noRelateEnterprise={noRelateEnterprise}
                  treeWidth={treeWidth}
                  treeHeight={height}
                  onExpand={(type: ContactTreeOrgNodeType, isOpen: boolean) => {
                    setActiveAccountKey(StaticRootNodeKey.CUSTOMER);
                    onExpand && onExpand(type, isOpen);
                  }}
                  showOrgMemberNum={showOrgMemberNum}
                  activeAccountKey={activeAccountKey}
                />
              )
            }
            {accountList.map(item => {
              const { id: account, emailType, agentEmail, accountType } = item;
              const isMainAccount = accountType === 'mainAccount';
              const isQyAccount = accountType === 'qyEmail';
              const showRecent = type.includes('recent');
              const showPersonal = type.includes('personal');
              const showTeam = type.includes('team') && isMainAccount;
              // const showCustomer = type.includes('customer') && isMainAccount;
              const showEnterprise = type.includes('enterprise') && (isMainAccount || isQyAccount);
              const resType: ContactTreeType[] = [];
              if (showPersonal) {
                resType.push('personal');
              }
              if (showEnterprise) {
                resType.push('enterprise');
              }
              if (showRecent) {
                resType.push('recent');
              }
              if (showTeam) {
                resType.push('team');
              }
              // if (showCustomer) {
              //   resType.push('customer')
              // }
              return (
                <>
                  <AccountTree
                    {...props}
                    isSingleAccount={false}
                    type={resType}
                    showSeparator={false}
                    treeWidth={treeWidth}
                    treeHeight={height}
                    _account={account}
                    accountRootKey={createAccountRootKey(account)}
                    accountType={emailType}
                    rootTitle={agentEmail}
                    onExpand={(type: ContactTreeOrgNodeType, isOpen: boolean) => {
                      setActiveAccountKey(createAccountRootKey(account));
                      onExpand && onExpand(type, isOpen);
                    }}
                    activeAccountKey={activeAccountKey}
                    noRelateEnterprise={noRelateEnterprise}
                  />
                </>
              );
            })}
          </>
        );
      }
      // 单账号
      return (
        <>
          <AccountTree
            {...props}
            isSingleAccount
            type={type}
            accountRootKey={createAccountRootKey(accountRootKey || currentAccount)}
            _account={accountRootKey || currentAccount}
            contactTreeDecorateMap={contactTreeDecorateMap}
            noRelateEnterprise={noRelateEnterprise}
            treeWidth={treeWidth}
            treeHeight={treeHeight}
          />
        </>
      );
    },
    [accountList, type, activeAccountKey, props.defaultSelectList, props.disableCheckList]
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
  }, []);
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
  useEffect(() => {
    writeMailCurAccount && setActiveAccountKey(createAccountRootKey(writeMailCurAccount?.id));
  }, [writeMailCurAccount]);
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
