import React, { useEffect, useState } from 'react';
import { AccountInfo, AccountApi, getIn18Text, api, apis, LoginApi, util, AliasMailAccountInfoTable, MobileAccountInfoTable, DataTrackerApi, apiHolder } from 'api';
import classnames from 'classnames';
import { Skeleton, Tooltip, Radio, Popover, Button } from 'antd';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import styles from './list.module.scss';
import { useActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { actions as LoginActions, doSwitchAccountAsync, doSwitchMobileAccountAsync, doListAccountsAsync } from '@web-common/state/reducer/loginReducer';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import IconCard from '@web-common/components/UI/IconCard';
import MobileBindModal from '@/components/Layout/Login/modal/bindMobile';
import { useEventObserver } from '@web-common/hooks/useEventObserver';

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

const AccountItem: React.FC<AccountItemProps> = props => {
  const { block, item, isCurrent } = props;
  const { accountList } = useAppSelector(state => state.loginReducer);
  const { setSettingLoginInfo } = useActions(LoginActions);
  const dispatch = useAppDispatch();
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const shiftAccount = (id: string) => {
    if (isSwitching) {
      return;
    }
    if (isCurrent) {
      return;
    }
    if (item.expired) {
      SiriusMessage.warn({ content: getIn18Text('CIZHANGHAOWUFA') }).then();
      return;
    }
    if (block) {
      dispatch(doSwitchAccountAsync(id));
      return;
    }
    setIsSwitching(true);
    Modal.error({
      title: getIn18Text('QUERENQIEHUANZHANG'),
      content: getIn18Text('QIEHUANZHANGHAOHUI'),
      onOk: () => {
        dispatch(doSwitchAccountAsync(id)).then(() => {
          setIsSwitching(false);
        });
      },
      onCancel: () => {
        setIsSwitching(false);
      },
    });
  };
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
    setSettingLoginInfo({ loginAccount: id, loginVisible: true, currentTabName: getIn18Text('DENGLUZHANGHAO') });
  };

  return (
    <div className={classnames(styles.item, isCurrent && styles.currentItem)} onClick={() => shiftAccount(item.id)}>
      <Tooltip title={getIn18Text('QIEHUANZHANGHAO')} mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
        <div className={styles.accountItemInput}>
          <Radio className={styles.radio} checked={isCurrent} disabled={item.expired} />
        </div>
      </Tooltip>
      <div className={styles.itemAvatar}>
        <AvatarTag user={{ email: item.id, avatar: item.avatar, name: item.nickName }} size={32} />
        {item.expired && <div className={styles.itemExpired}>{getIn18Text('SHIXIAO')}</div>}
        {isCurrent && (
          <div className={styles.currentIcon}>
            <i />
          </div>
        )}
      </div>
      <div className={styles.itemInfoWrap}>
        <div className={styles.itemName}>
          <span className={styles.accountItemNameDisplay}>{util.chopStrToSize(item.nickName, 20)}</span>
          <span className={styles.accountItemNameEmail}>{util.chopStrToSize(item.id || '[无用户名]', 40)}</span>
        </div>
        {!isCurrent && <div className={styles.itemCompany}>{item.company}</div>}
      </div>
      {item.expired && (
        <Button
          type="default"
          className={styles.accountItemRedo}
          onClick={e => {
            e.stopPropagation();
            reLogin(item.id);
          }}
        >
          {getIn18Text('ZHONGXINDENGLU')}
        </Button>
      )}
      {!isCurrent && (
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
    </div>
  );
};

const CurrentAccount: React.FC<CurrentAccountProps> = props => {
  const { block, item, aliasList, mobileList } = props;
  const { setVisibleMobileBindModal } = useActions(LoginActions);
  const dispatch = useAppDispatch();
  const { accountList } = useAppSelector(state => state.loginReducer);
  const [visible, setVisible] = useState<boolean>(!!item);
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);

  const logout = () => {
    Modal.error({
      title: getIn18Text('QUERENYAOTUICHU'),
      onOk: () => {
        if (accountList.localList.length === 0) {
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
        <AccountItem block={block} item={item} isCurrent />
        <div className={styles.infoWrap}>
          <div className={styles.infoLine}>
            <div className={styles.company}>
              <div className={styles.label}>{getIn18Text('TUANDUIMINGCHENG：')}</div>
              <div className={styles.labelTxt}>{item.company}</div>
            </div>
            {isCorpMail ? (
              ''
            ) : (
              <div className={styles.mobileBindWrap}>
                <div className={styles.label}>{getIn18Text('DANGQIANSHOUJIHAO')}</div>
                <div className={styles.labelTxt}>{mobile || '未绑定手机号'}</div>
                <div className={styles.bindBtn} onClick={handleBindClick}>
                  {mobile ? getIn18Text('JIEBANG') : getIn18Text('BANGDING')}
                </div>
              </div>
            )}
          </div>
          {defaultAlias && (
            <div className={styles.aliasWrap}>
              <div className={styles.label}>{getIn18Text('BIEMINGYOUXIANG：')}</div>
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
      <MobileBindModal isBind={!mobile} defaultMobile={mobile} defaultArea={mobileArea} onSuccess={onBindSuccess} />
    </div>
  );
};

const AccountList: React.FC<AccountListProps> = ({ block }) => {
  const { accountList } = useAppSelector(state => state.loginReducer);
  const { setSettingLoginInfo } = useActions(LoginActions);
  const dispatch = useAppDispatch();
  const maxAccountLen = 20;
  const { mobileList, localList, aliasList, current: currentAccount } = accountList;
  const cleanAllAccount = () => {
    Modal.error({
      title: getIn18Text('QUEDINGYAOTUICHU'),
      content: getIn18Text('TUICHUHOU，NINJIANGWU'),
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
      setSettingLoginInfo({ loginVisible: true, currentTabName: getIn18Text('TIANJIAZHANGHAO'), loginAccount: '' });
    }
  };
  useEffect(() => {
    dispatch(doListAccountsAsync(false));
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
