import React, { useState, useEffect } from 'react';
import { apiHolder, api, MailApi, apis, MobileAccountInfoTable, AccountInfo, LoginApi, ISharedAccount, AccountApi } from 'api';
import classNames from 'classnames';
import { SimpleAvatar } from './avatar';
import { ReactComponent as IconExpand } from '@/images/icons/sidebar/icon-expand.svg';
import { ReactComponent as IconShrink } from '@/images/icons/sidebar/icon-shrink.svg';
import { ReactComponent as AddAcountIcon } from '@/images/icons/sidebar/add-account.svg';
import { Tooltip } from 'antd';
import Message from '@web-common/components/UI/Message/SiriusMessage';
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
import style from './avatar-list.module.scss';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import {
  doListAccountsAsync,
  doSwitchAccountAsync,
  doSwitchMobileAccountAsync,
  doSwitchSharedAccountAsync,
  doSharedAccountAsync,
} from '@web-common/state/reducer/loginReducer';
import { getIn18Text } from 'api';
import { useEventObserver } from '@web-common/hooks/useEventObserver';
export interface UserAccount {
  email: string;
  avatar?: string;
  name?: string;
  isMobileBindAccount?: boolean;
  id: string;
  isSharedAccount?: boolean;
  unread?: boolean;
}
interface Prop {
  isBlock: boolean;
  onBlock?(): void;
}
const mailApi: MailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
export const AvatarList: React.FC<Prop> = ({ isBlock, onBlock }) => {
  const dispatch = useAppDispatch();
  const [list, setList] = useState<UserAccount[]>([]);
  const [expanding, setExpanding] = useState<boolean>(false);
  const [maxHeight, setMaxHeight] = useState<string | number>(100);
  const [blurBg, setBlurBg] = useState<boolean>(false);
  const [addAccountVisible, setAddAccountVisible] = useState<boolean>(false);
  const { localList, mobileList } = useAppSelector(state => state.loginReducer.accountList);
  const { sharedAccount } = useAppSelector(state => state.loginReducer);
  const switchingAccount = useAppSelector(state => state.loginReducer.switchingAccount);
  const currentMail = useAppSelector(state => state.mailReducer.currentMail);
  const [sideBarAccountUnreadStatus, setSideBarAccountUnreadStatus] = useState<any>({});
  const [moreAccountListHasUnread, setMoreAccountListHasUnread] = useState<boolean>(false);
  const mobileTrans = (arr: MobileAccountInfoTable[]): UserAccount[] =>
    arr.map(item => ({
      id: item.id,
      email: item.accountId,
      avatar: item.avatar,
      name: item.nickName,
      isMobileBindAccount: true,
      unread: !!sideBarAccountUnreadStatus[item.id],
    }));
  const localTrans = (arr: AccountInfo[]): UserAccount[] => {
    const accounts: UserAccount[] = [];
    if (sharedAccount.isSharedAccountLogin) {
      accounts.push({
        id: sharedAccount.email,
        email: sharedAccount.email,
        avatar: '',
        name: sharedAccount.nickName,
        isSharedAccount: !sharedAccount.isSharedAccountExpired ? true : false,
        unread: !!sideBarAccountUnreadStatus[sharedAccount.email],
      });
    }
    arr.forEach(item => {
      if (!item.expired) {
        accounts.push({
          id: item.id,
          email: item.id,
          avatar: item.avatar,
          name: item.nickName,
          isSharedAccount: sharedAccount.isSharedAccountLogin ? sharedAccount.email === item.id : false,
          unread: !!sideBarAccountUnreadStatus[item.id],
        });
      }
    });
    return accounts;
  };
  const tranSharedAccount = (sharedAccounts: ISharedAccount[]): UserAccount[] => {
    if (!sharedAccounts || !sharedAccounts.length) {
      return [];
    }
    return sharedAccounts
      .filter(item => {
        return !item.isCurrentAccount;
      })
      .map(item => {
        return {
          id: item.email,
          email: item.email,
          avatar: item.avatar,
          name: item.nickName,
          isSharedAccount: true,
          unread: !!sideBarAccountUnreadStatus[item.email],
        };
      });
  };
  useEffect(() => {
    if (process.env.BUILD_ISPREVIEWPAGE) return;
    dispatch(doListAccountsAsync(false));
    dispatch(doSharedAccountAsync());
  }, []);
  useEffect(() => {
    const accounts = [...tranSharedAccount(sharedAccount.sharedAccounts), ...localTrans(localList), ...mobileTrans(mobileList)];
    if (expanding) {
      setMaxHeight('87vh');
      setList(accounts.reverse());
      setBlurBg(true);
    } else {
      setMaxHeight(156);
      const hiddenAccounts = accounts.slice(2);
      let hasUnread = false;
      hiddenAccounts.forEach(item => {
        if (!!item.unread) {
          hasUnread = true;
        }
      });
      setMoreAccountListHasUnread(hasUnread);
      setTimeout(() => {
        setBlurBg(false);
        if (process.env.BUILD_ISEDM) {
          setList(accounts.slice(0, 1).reverse());
        } else {
          setList(accounts.slice(0, 2).reverse());
        }
      }, 300);
    }
  }, [expanding, localList, mobileList, sharedAccount, sideBarAccountUnreadStatus]);
  process.env.BUILD_ISELECTRON &&
    useEventObserver('accountNotify', {
      name: 'accountNotifyAsync',
      func: () => {
        accountApi.getSidebarDockAccountList().then(res => {
          setSideBarAccountUnreadStatus(res);
        });
        dispatch(doListAccountsAsync());
      },
    });
  const handleLogin = (user: UserAccount) => {
    if (switchingAccount) {
      return;
    }
    if (isBlock) {
      onBlock && onBlock();
      return;
    }

    if (user.isMobileBindAccount) {
      dispatch(doSwitchMobileAccountAsync(user.id));
    } else if (user.isSharedAccount) {
      dispatch(doSwitchSharedAccountAsync(user.email));
    } else {
      dispatch(doSwitchAccountAsync(user.email));
    }
  };
  const handleSwitchAccount = async (user: UserAccount) => {
    currentMail &&
      mailApi
        .doSaveTemp({ content: currentMail, saveDraft: true })
        .then(res => console.log(getIn18Text('BAOCUNCHENGGONG'), res))
        .catch(error => {
          console.log(getIn18Text('BAOCUNCAOGAOSHI'), error);
        });
    handleLogin(user);
  };
  const handleAddAccount = () => {
    if (switchingAccount) {
      Message.info({ content: getIn18Text('QIEHUANZHANGHAOZHONG') });
      return;
    }
    loginApi.showCreateAccountPage();
  };
  //是否有更多展示的账号
  const hasMoreAccount =
    [...tranSharedAccount(sharedAccount.sharedAccounts), ...localTrans(localList), ...mobileTrans(mobileList)].length > (process.env.BUILD_ISEDM ? 1 : 2);
  const visibleExpandIcon = !expanding && hasMoreAccount;
  useEffect(() => {
    if (!hasMoreAccount) {
      setAddAccountVisible(true);
    }
    if (hasMoreAccount) {
      if (expanding) {
        setAddAccountVisible(true);
      } else {
        setTimeout(() => {
          setAddAccountVisible(false);
        }, 200);
      }
    }
  }, [hasMoreAccount, expanding]);
  const noOtherAccount = !list || !list.length;
  return (
    <div className={classNames(style.avatarList, { [style.blurBg]: blurBg })}>
      {visibleExpandIcon && (
        <div
          className={style.floatBtn}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setExpanding(true);
          }}
        >
          <IconExpand />
          {moreAccountListHasUnread && <div className={style.avatarRedDot} />}
        </div>
      )}

      <div className={classNames(style.scrollWrapper, { [style.hasVisibleAddAccount]: !hasMoreAccount })} style={{ maxHeight }}>
        <div className={style.listContent}>
          {expanding && (
            <div
              className={style.floatBtn}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setExpanding(false);
              }}
              style={{ position: 'static' }}
            >
              <IconShrink />
            </div>
          )}
          {addAccountVisible && (
            <div className={style.addAccountWrapper} style={{ marginBottom: noOtherAccount ? '16px' : '0' }}>
              <Tooltip title={getIn18Text('addEnterpriseAccount')} placement="right">
                <div className={style.addAccountIcon} onClick={handleAddAccount}>
                  <AddAcountIcon />
                </div>
              </Tooltip>
            </div>
          )}
          <div className={style.listWrapper}>
            {list.map(user => (
              <SimpleAvatar
                isSwitching={switchingAccount === user?.email}
                showRedDot={user?.unread}
                key={user?.email}
                user={user}
                onClick={() => handleSwitchAccount(user)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
