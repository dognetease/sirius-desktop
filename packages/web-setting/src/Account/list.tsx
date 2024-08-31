import React, { useEffect, useState, useCallback } from 'react';
import debounce from 'lodash.debounce';
import {
  AccountInfo,
  AccountApi,
  api,
  apis,
  LoginApi,
  util,
  AliasMailAccountInfoTable,
  MobileAccountInfoTable,
  DataTrackerApi,
  apiHolder,
  ISharedAccount,
  ICurrentAccountAndSharedAccount,
  isElectron,
} from 'api';
import classnames from 'classnames';
import { Skeleton, Tooltip, Radio, Popover, Button } from 'antd';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import styles from './list.module.scss';
import { useActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import {
  actions as LoginActions,
  doSwitchAccountAsync,
  doSwitchMobileAccountAsync,
  doListAccountsAsync,
  doSwitchSharedAccountAsync,
  doSharedAccountAsync,
} from '@web-common/state/reducer/loginReducer';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import IconCard from '@web-common/components/UI/IconCard';
import MobileBindModal from '@web-account/Login/modal/bindMobile';
import { useEventObserver } from '@web-common/hooks/useEventObserver';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import { getIn18Text } from 'api';

interface AccountItemProps {
  item: AccountInfo;
  block: boolean;
  isCurrent?: boolean;
}
interface AccountListProps {
  block: boolean;
}
interface CurrentAccountInfo extends AccountInfo {
  enabledMobileLogin?: boolean;
  lastLoginTime?: number;
}
interface CurrentAccountProps {
  item?: CurrentAccountInfo;
  mobileList: MobileAccountInfoTable[];
  aliasList: AliasMailAccountInfoTable[];
  block: boolean;
}
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const systemApi = api.getSystemApi();
const eventApi = api.getEventApi();
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const sendLogout = () => {
  setTimeout(() => {
    eventApi.sendSysEvent({
      eventName: 'logout',
      eventData: {
        jumpTo: 'login',
        clearCookies: true,
      },
    });
  }, 500);
};
const sendLoginBlock = (isBlock: boolean) => {
  eventApi.sendSysEvent({
    eventName: 'loginBlock',
    eventData: isBlock,
    eventSeq: 0,
  });
};
// 把手机号格式化为 - 连接
const formatMobile = (mobile: string): string => {
  return mobile.replace(/^(\d{3})(\d*)(\d{4})/, '$1-$2-$3');
};
const AccountItem: React.FC<AccountItemProps> = props => {
  const { block, item, isCurrent } = props;
  const { accountList, switchingAccount, sharedAccount } = useAppSelector(state => state.loginReducer);
  const { setSettingLoginInfo, setLoginModalData } = useActions(LoginActions);
  const dispatch = useAppDispatch();
  const delAccount = (id: string) => {
    const isLastAccount = !accountList.current && accountList.localList.length === 1;
    Modal.error({
      title: isLastAccount ? getIn18Text('QUERENYAOSHANCHU') : getIn18Text('SHANCHUZHANGHAO'),
      okType: 'danger',
      okText: getIn18Text('SHANCHU'),
      content: isLastAccount ? getIn18Text('SHANCHUWEIYIZHANG') : getIn18Text('SHANCHUZHANGHAOHOU'),
      onOk: () => {
        accountApi.doDeleteAccountList([id]).then(() => {
          if (isLastAccount) {
            sendLogout();
          } else {
            dispatch(doListAccountsAsync());
          }
        });
      },
    });
  };
  const reLogin = (id: string) => {
    if (systemApi.isElectron()) {
      loginApi.showCreateAccountPage(id);
    } else {
      dispatch(setLoginModalData({ visible: true, account: id }));
    }
  };
  // 判断公共账号登陆，且当前账号存在于对应公共账号列表内，则展示公共账号的所属主账号
  const isSharedAccountLogin =
    (isCurrent && !sharedAccount.isSharedAccountLogin && sharedAccount.isSharedAccountExpired) ||
    (sharedAccount?.isSharedAccountLogin && !sharedAccount.isSharedAccountExpired && sharedAccount?.sharedAccounts?.some(_account => _account.email === item.id));
  const isRealCurrent = isSharedAccountLogin ? false : isCurrent;
  const shiftAccount = useCreateCallbackForEvent((id: string) => {
    if (switchingAccount) {
      return;
    }
    if (isRealCurrent) {
      return;
    }
    if (item.expired) {
      SiriusMessage.warn({ content: getIn18Text('CIZHANGHAOWUFA') }).then();
      return;
    }
    const isSwitchingSharedAccount =
      sharedAccount.sharedAccounts.some(item => item.email === id) ||
      (sharedAccount.isSharedAccountLogin && !sharedAccount.isSharedAccountExpired && sharedAccount.email === id);
    if (block) {
      if (isSwitchingSharedAccount) {
        dispatch(doSwitchSharedAccountAsync(id));
      } else {
        dispatch(doSwitchAccountAsync(id));
      }
      return;
    }
    Modal.error({
      title: getIn18Text('QUERENQIEHUANZHANG'),
      content: getIn18Text('QIEHUANZHANGHAOHUI'),
      onOk: () => {
        if (isSwitchingSharedAccount) {
          dispatch(doSwitchSharedAccountAsync(id));
        } else {
          dispatch(doSwitchAccountAsync(id));
        }
      },
    });
  });
  const itemEmail = isSharedAccountLogin ? sharedAccount.email : item.id;
  const itemAvatar = isSharedAccountLogin ? '' : item.avatar;
  const itemNickName = isSharedAccountLogin ? sharedAccount.nickName : item.nickName;

  const debounceShiftAccount = useCallback(debounce(shiftAccount, 500, { leading: true, trailing: false }), []);
  return (
    <div className={classnames(styles.item, (isCurrent || isSharedAccountLogin) && styles.currentItem)} onClick={() => debounceShiftAccount(itemEmail)}>
      <Tooltip title={getIn18Text('QIEHUANZHANGHAO')} mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
        <div className={styles.accountItemInput}>
          <Radio className={styles.radio} checked={isRealCurrent} disabled={item.expired} />
        </div>
      </Tooltip>
      <div className={styles.itemAvatar}>
        {/** 公共账号为当前账号时，需要展示所属的主账号信息 */}
        <AvatarTag user={{ email: itemEmail, avatar: itemAvatar, name: itemNickName }} size={32} />
        {item.expired && <div className={styles.itemExpired}>{getIn18Text('SHIXIAO')}</div>}
        {isCurrent && (
          <div className={styles.currentIcon}>
            <i />
          </div>
        )}
      </div>

      <div className={styles.itemInfoWrap}>
        <div className={styles.itemName}>
          <span className={styles.accountItemNameDisplay}>{util.chopStrToSize(itemNickName, 20)}</span>
          <span className={styles.accountItemNameEmail}>{util.chopStrToSize(itemEmail || '[无用户名]', 40)}</span>
        </div>
        {!isCurrent && <div className={styles.itemCompany}>{item.company}</div>}
      </div>
      {item.expired && (
        <Button
          type="default"
          className={styles.accountItemRedo}
          onClick={e => {
            e.stopPropagation();
            reLogin(itemEmail);
          }}
        >
          {getIn18Text('ZHONGXINDENGLU')}
        </Button>
      )}
      {!isCurrent && switchingAccount !== itemEmail && (
        <Tooltip title={getIn18Text('SHANCHU')} mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
          <div
            className={styles.accountItemDel}
            onClick={e => {
              e.stopPropagation();
              delAccount(item.id);
            }}
          >
            <IconCard className="dark-invert" type="recycleBin" />
          </div>
        </Tooltip>
      )}
      {switchingAccount === itemEmail && (
        <div className={styles.switchAccountWrap}>
          <div className={styles.switchIcon}></div>
          <div className={styles.switchTxt}>{getIn18Text('ZHANGHAOQIEHUANZHONG')}</div>
        </div>
      )}
    </div>
  );
};
const CurrentAccount: React.FC<CurrentAccountProps> = props => {
  const { block, item, aliasList, mobileList } = props;
  const { setVisibleMobileBindModal } = useActions(LoginActions);
  const dispatch = useAppDispatch();
  const { accountList, switchingAccount, sharedAccount } = useAppSelector(state => state.loginReducer);
  const [visible, setVisible] = useState<boolean>(!!item);
  // 如果当前是公共账号，又没有提供所属主账号，临时处理Radio非选中问题，sharedAccount.email为当前账号的所属账号
  const isCurrent = sharedAccount.isSharedAccountLogin
    ? sharedAccount.email === item?.id
    : !sharedAccount.isSharedAccountLogin && sharedAccount.isSharedAccountExpired
    ? true
    : true;

  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  const logout = () => {
    Modal.error({
      title: getIn18Text('QUERENYAOTUICHU'),
      onOk: () => {
        if (accountList.localList.length === 0 || !isElectron()) {
          sendLogout();
        } else {
          loginApi.doLogout(true, true, true).then(() => {
            dispatch(doListAccountsAsync());
          });
          sendLoginBlock(true);
          setVisible(false);
        }
      },
    });
  };
  const onBindSuccess = () => {
    setVisibleMobileBindModal(false);
    dispatch(doListAccountsAsync(false));
  };
  const selectMobileAccount = async (id: string) => {
    dispatch(doSwitchMobileAccountAsync(id));
  };

  const shiftAccount = useCreateCallbackForEvent((id: string) => {
    if (switchingAccount) {
      return;
    }
    // 当前账号
    if (item?.id === id) {
      return;
    }
    if (item?.expired) {
      SiriusMessage.warn({ content: getIn18Text('CIZHANGHAOWUFA') }).then();
      return;
    }
    if (block) {
      dispatch(doSwitchSharedAccountAsync(id));
      return;
    }
    Modal.error({
      title: getIn18Text('QUERENQIEHUANZHANG'),
      content: getIn18Text('QIEHUANZHANGHAOHUI'),
      onOk: () => {
        dispatch(doSwitchSharedAccountAsync(id));
      },
    });
  });
  const debounceShiftAccount = useCallback(debounce(shiftAccount, 500, { leading: true, trailing: false }), []);
  useEffect(() => {
    setVisible(!!item);
  }, [item]);
  if (!visible || !item) {
    return null;
  }
  const defaultAlias = aliasList.find(alias => alias.isDefault) || aliasList[0];
  const otherAliasList: AliasMailAccountInfoTable[] = aliasList.filter(alias => alias.id !== defaultAlias.id);
  const otherAliasListContent = (
    <div className={styles.labelContent}>
      {otherAliasList.map(({ accountName, domain, id }) => {
        const mail = accountApi.doGetAccount({ accountName, domain });
        return (
          <Tooltip title={mail} mouseEnterDelay={0.3} mouseLeaveDelay={0.25}>
            <div className={styles.labelTxt} key={id}>
              {util.chopStrToSize(mail, 60)}
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
  const { mobile, mobileArea } = accountApi.doGetMobileAndArea(item.mobile);
  function handleBindClick() {
    trackApi.track('pc_phone_number_operation', { originalstate: !!mobile });
    setVisibleMobileBindModal(true);
  }
  return (
    <div className={styles.currentAccount}>
      <div className={styles.accountItemWrap}>
        <AccountItem block={block} item={item} isCurrent={isCurrent} />
        <div className={styles.infoWrap}>
          <div className={styles.infoLine}>
            <div className={styles.company}>
              <div className={styles.label}>{getIn18Text('TUANDUIMINGCHENG\uFF1A')}</div>
              <div className={styles.labelTxt}>{item.company}</div>
            </div>
            {isCorpMail ? (
              ''
            ) : (
              <div className={styles.mobileBindWrap}>
                <div className={styles.label}>{getIn18Text('DANGQIANSHOUJIHAO')}</div>
                <div className={styles.labelTxt}>{formatMobile(mobile) || getIn18Text('WEIBANGDINGSHOUJI')}</div>
                <div className={styles.bindBtn} onClick={handleBindClick}>
                  {mobile ? getIn18Text('JIECHUBANGDING') : getIn18Text('BANGDING')}
                </div>
              </div>
            )}
          </div>
          {defaultAlias && (
            <div className={styles.aliasWrap}>
              <div className={styles.label}>{getIn18Text('BIEMINGYOUXIANG\uFF1A')}</div>
              <div className={styles.labelTxt}>
                {accountApi.doGetAccount({
                  accountName: defaultAlias.accountName,
                  domain: defaultAlias.domain,
                })}
                {otherAliasList.length ? (
                  <Popover placement="rightTop" getPopupContainer={nd => nd.parentElement || document.body} content={otherAliasListContent}>
                    <span className={styles.more}>{getIn18Text('GENGDUO')}</span>
                  </Popover>
                ) : null}
              </div>
            </div>
          )}
        </div>
        <Tooltip title={getIn18Text('TUICHU')} placement="top">
          <div
            className={`dark-invert ${styles.exitIcon}`}
            onClick={e => {
              e.stopPropagation();
              logout();
            }}
          />
        </Tooltip>
      </div>
      {mobileList.length ? (
        <div className={styles.mobileAccountWrap}>
          {mobileList.map(mobileItem => (
            <div className={styles.mobileItem}>
              <div className={styles.avatarWrap}>
                <AvatarTag user={{ email: mobileItem.accountId, avatar: mobileItem.avatar }} size={32} />
                <i />
              </div>
              <div className={styles.accountTxt}>{mobileItem.accountId}</div>
              <div className={styles.labelIcon}>{getIn18Text('GUANLIANZHANGHAO')}</div>
              <div className={styles.addBtn}>
                <span className={styles.addTxt} onClick={() => selectMobileAccount(mobileItem.id)}>
                  {getIn18Text('TIANJIA')}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {sharedAccount.sharedAccounts.length ? (
        <div className={styles.sharedAccountWrap}>
          {sharedAccount.sharedAccounts.map(sharedItem => (
            <div className={styles.sharedItem} onClick={() => debounceShiftAccount(sharedItem.email)}>
              <Tooltip title={getIn18Text('QIEHUANZHANGHAO')} mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
                <div className={styles.accountItemInput}>
                  <Radio className={styles.radio} checked={sharedItem.email === item?.id} disabled={!sharedItem.enabled} />
                </div>
              </Tooltip>

              <div className={styles.sharedRow}>
                <div className={styles.avatarWrap}>
                  <AvatarTag
                    user={{
                      email: sharedItem.email,
                      avatar: (sharedItem.isCurrentAccount ? systemApi.getCurrentUser()?.avatar : sharedItem?.avatar || '') || '',
                    }}
                    showAccountSelected={sharedItem.isCurrentAccount}
                    size={32}
                  />
                </div>
                <div className={styles.accountTxt}>{sharedItem.email}</div>
                <div className={styles.labelIcon}>{getIn18Text('GONGGONGZHANGHAO')}</div>
                {switchingAccount === sharedItem.email && (
                  <div className={styles.switchAccountWrap}>
                    <div className={styles.switchIcon}></div>
                    <div className={styles.switchTxt}>{getIn18Text('ZHANGHAOQIEHUANZHONG')}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <MobileBindModal isBind={!mobile} defaultMobile={mobile} defaultArea={mobileArea} onSuccess={onBindSuccess} />
    </div>
  );
};

// 账号管理
const AccountList: React.FC<AccountListProps> = ({ block }) => {
  const { accountList, sharedAccount } = useAppSelector(state => state.loginReducer);
  const { setSettingLoginInfo, setLoginModalData } = useActions(LoginActions);
  const dispatch = useAppDispatch();
  const maxAccountLen = 20;
  const { mobileList, localList, aliasList, current: currentAccount } = accountList;
  const cleanAllAccount = () => {
    Modal.error({
      title: getIn18Text('QUEDINGYAOTUICHU'),
      content: getIn18Text('TUICHUHOU\uFF0CNIN'),
      okType: 'danger',
      okText: getIn18Text('TUICHU'),
      onOk: () => {
        accountApi.doCleanAllAccount().then(({ success, message }) => {
          if (success) {
            sendLogout();
          } else {
            message && SiriusMessage.error({ content: message });
          }
        });
      },
    });
  };
  const addAccount = () => {
    if (accountList && accountList.localList.length >= maxAccountLen - 1) {
      SiriusMessage.info({ content: getIn18Text('ZUIDUOKETIANJIA11') }).then();
    } else {
      if (systemApi.isElectron()) {
        loginApi.showCreateAccountPage();
      } else {
        dispatch(setLoginModalData({ visible: true }));
      }
    }
  };

  useEffect(() => {
    dispatch(doListAccountsAsync(false));
    dispatch(doSharedAccountAsync(true));
  }, []);
  useEventObserver('accountNotify', {
    name: 'accountNotifyAsync',
    func: () => {
      dispatch(doListAccountsAsync());
    },
  });
  // 初次加载
  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('updateUserInfo', {
      func: () => {
        dispatch(doListAccountsAsync());
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('updateUserInfo', eid);
    };
  }, []);
  return (
    <div className={styles.wrap}>
      <div className={styles.title}>
        <div className={styles.titleTxt}>{getIn18Text('ZHANGHAOGUANLI')}</div>
        <div className={styles.addAccountTxt} onClick={addAccount}>
          {getIn18Text('TIANJIAWANGYIQI')}
        </div>
      </div>
      {!accountList ? (
        <Skeleton paragraph={{ rows: 7 }} active loading={!accountList} />
      ) : (
        <>
          <CurrentAccount item={currentAccount} mobileList={mobileList} aliasList={aliasList} block={block} />
          {localList.map(item => (
            <AccountItem item={item} block={block} />
          ))}
        </>
      )}
      <div className={styles.delWrap}>
        <i className={styles.exitIcon} onClick={cleanAllAccount} />
        <span className={styles.exitTxt} onClick={cleanAllAccount}>
          {getIn18Text('TUICHUBINGQINGKONG')}
        </span>
      </div>
    </div>
  );
};
export default AccountList;
