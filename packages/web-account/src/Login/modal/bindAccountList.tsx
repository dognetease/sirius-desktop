import React, { useEffect } from 'react';
// import { navigate } from 'gatsby';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import { MobileAccountInfo, api, apis, LoginApi, AccountApi, DataTrackerApi, apiHolder } from 'api';
import SiriusModal, { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
import styles from './bindAccountList.module.scss';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import MailBindModal from './bindAccount';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import { actions as LoginActions } from '@web-common/state/reducer/loginReducer';
import { getIn18Text } from 'api';
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const BindAccountListModal = () => {
  const {
    mobileBindAccountListInfo: { visibleList, visibleAccount, selectedAccount, selectedAccountNode, accountList, from },
  } = useAppSelector(state => state.loginReducer);
  const { setMobileBindAccountListInfo } = useActions(LoginActions);
  const isFromLogin = from === 'login';
  const isLastAccount = accountList.length === 1;
  const switchAccount = ({ accountName, domain, token, enabledMobileLogin, status, area }: MobileAccountInfo) => {
    if (token) {
      loginApi
        .doMobileTokenLogin({
          domain,
          token,
          account_name: accountName,
        })
        .then(({ pass, errmsg }) => {
          if (pass) {
            trackApi.track('pc_select_login_account_page_result', { pageSource: from, action: 'enter' });
            window.location.assign('/');
          } else {
            trackApi.track('pc_select_login_account_page_result', { pageSource: from, action: 'error', result: errmsg });
            Message.error(errmsg);
          }
        });
      return;
    }
    setMobileBindAccountListInfo({
      visibleList: false,
    });
    if (!enabledMobileLogin) {
      SiriusModal.error({
        title: getIn18Text('ZHANGHAOWUFADENG'),
        content: getIn18Text('DANGQIANNINDEZHANG'),
        hideCancel: true,
        onOk: () => {
          setMobileBindAccountListInfo({
            visibleList: !(isFromLogin && isLastAccount),
          });
        },
        onCancel: () => {
          setMobileBindAccountListInfo({
            visibleList: !(isFromLogin && isLastAccount),
          });
        },
      });
      return;
    }
    if (String(status) !== '0') {
      SiriusModal.error({
        title: getIn18Text('ZHANGHAOWUFADENG'),
        hideCancel: true,
        content: getIn18Text('DANGQIANNINDEZHANG'),
        onOk: () => {
          setMobileBindAccountListInfo({
            visibleList: !(isFromLogin && isLastAccount),
          });
        },
        onCancel: () => {
          setMobileBindAccountListInfo({
            visibleList: !(isFromLogin && isLastAccount),
          });
        },
      });
      return;
    }
    setMobileBindAccountListInfo({
      selectedAccount: accountApi.doGetAccount({ accountName, domain }),
      selectedAccountNode: area,
      visibleList: false,
      visibleAccount: true,
    });
  };
  const title = getIn18Text('XUANZENINYAODENG');
  const renderItem = (item: MobileAccountInfo) => {
    const email = accountApi.doGetAccount({ accountName: item.accountName, domain: item.domain });
    const name = item.nickName;
    return (
      <div className={styles.item} onClick={() => switchAccount(item)}>
        <div className={styles.avatarWrap}>
          <AvatarTag user={{ email, name }} size={36} />
        </div>
        <div className={styles.account}>{email}</div>
        <div className={styles.arrowRight} />
      </div>
    );
  };
  useEffect(() => {
    if (visibleList && isFromLogin && isLastAccount) {
      switchAccount(accountList[0]);
    }
  }, [visibleList]);
  useEffect(() => {
    trackApi.track('pc_select_login_account_page', { pageSource: from });
  }, []);
  return (
    <>
      <SiriusHtmlModal
        destroyOnClose
        visible={visibleList || visibleAccount}
        width={476}
        onCancel={() => {
          trackApi.track('pc_select_login_account_page_result', { pageSource: from, action: 'back' });
          setMobileBindAccountListInfo({
            visibleList: false,
            visibleAccount: false,
            selectedAccount: undefined,
          });
        }}
      >
        <div className={styles.wrap} hidden={!visibleList}>
          <div className={styles.title}>{title}</div>
          <div className={styles.content}>{accountList.map(item => renderItem(item))}</div>
        </div>
        <MailBindModal
          from="login"
          title={getIn18Text('YANZHENGNINDEWANG')}
          defaultAccount={selectedAccount}
          currentAccountNode={selectedAccountNode}
          visible={visibleAccount}
          visibleModal={false}
          onBack={
            isFromLogin && isLastAccount
              ? undefined
              : () => {
                  setMobileBindAccountListInfo({
                    visibleList: true,
                    visibleAccount: false,
                  });
                }
          }
        />
      </SiriusHtmlModal>
    </>
  );
};
export default BindAccountListModal;
