import React, { useEffect, useState } from 'react';
import {
  apiHolder,
  apis,
  MailApi,
  ISubAccountMailFoldersConfigItem,
  MailBoxModel,
  // AccountApi,
  SystemApi,
  IPushConfigGetRes,
  IPushConfigSetRequest,
  getIn18Text,
  NIMApi,
  DataStoreApi,
} from 'api';
import styles from './index.module.scss';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import CommonWrap from './commonWrap';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { Checkbox } from 'antd';

const nimApi = apiHolder.api.requireLogicalApi('NIM') as NIMApi;
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const systemApi = apiHolder.api.requireLogicalApi(apis.defaultSystemApiImpl) as SystemApi;
const storeApi: DataStoreApi = apiHolder.api.getDataStoreApi();

export const Notification: React.FC = () => {
  const [isImEnable, setIsIMEnable] = useState<boolean>(false);
  const [win7BeepVis, setWin7BeepVis] = useState<boolean>(false);
  const [win7Beep, setWin7Beep] = useState<boolean>(false);

  const setAccountApiCurrentAccount = (email: string) => {
    const currentUser = systemApi.getCurrentUser();
    if (!currentUser) {
      return '';
    }
    const isSelectCurrentUser = currentUser.id === email || (currentUser.loginAccount && currentUser.loginAccount === email);
    if (isSelectCurrentUser) {
      // accountApi.setCurrentAccount({ email: '' });
      return '';
    } else {
      // accountApi.setCurrentAccount({ email });
      return email;
    }
  };

  const showToastError = (msg: string) => {
    Toast.error({ content: msg });
  };

  const handleImEnenableChanged = (e: any) => {
    const { checked } = e.target;
    setIsIMEnable(checked);
    mailApi.setPushConfig({
      isIMEnable: checked,
    });
  };

  const handleWin7BeepChanged = (e: any) => {
    const { checked } = e.target;
    setWin7Beep(checked);
    storeApi.putSync('win7Beep', String(checked));
  };

  useEffect(() => {
    mailApi.getPushConfig(1).then(res => {
      if (res.success) {
        const data = res.data;
        setIsIMEnable(data.isIMEnable);
      } else {
        showToastError(`${getIn18Text('GET_PUSH_CONFIG_ERROR')}${res.errorMsg ? `(${res.errorMsg})` : ''}`);
      }
    });
  }, []);

  useEffect(() => {
    if (navigator.userAgent.toLowerCase().indexOf('windows nt 6.1') !== -1) {
      setWin7BeepVis(true);
      const res = storeApi.getSync('win7Beep');
      const { suc, data } = res;
      // 默认是true
      if (suc && data === 'false') {
        setWin7Beep(false);
        return;
      }
      setWin7Beep(true);
    } else {
      setWin7BeepVis(false);
    }
  }, []);

  const [accountList, setAccountList] = useState<Array<string>>([]);
  const [currentAccount, setCurrentAccount] = useState<string>('');
  const [folderList, setFolderList] = useState<Array<MailBoxModel>>([]);
  const [allAccountFolderList, setAllAccountFolderList] = useState<Array<ISubAccountMailFoldersConfigItem>>([]);
  const [isMailEnable, setIsMailEnable] = useState<boolean>(false);
  const [enableFolderIds, setEnableFolderIds] = useState<Array<number>>([]);

  const handleMailEnableChanged = (e: any) => {
    const { checked } = e.target;
    setIsMailEnable(checked);
  };

  const setCurrentEmail = (email: string, allAccountFolderListParam?: Array<ISubAccountMailFoldersConfigItem>) => {
    setCurrentAccount(email);
    const currentAccountFolders = (allAccountFolderListParam || allAccountFolderList).find(item => item.email === email);
    setFolderList([]);
    if (currentAccountFolders) {
      // setAccountApiCurrentAccount(email);
      mailApi.getPushConfig(undefined, setAccountApiCurrentAccount(email)).then((res: IPushConfigGetRes) => {
        if (res.success && res.data) {
          const disableFolders = res.data.disableFolders || [];
          const enableFolderList = (currentAccountFolders.folders || []).filter(mailBoxItem => {
            return !disableFolders.includes(Number(mailBoxItem.mailBoxId!));
          });
          setIsMailEnable(!!res.data.isMailEnable);
          setEnableFolderIds(enableFolderList.map(mailBoxItem => Number(mailBoxItem.mailBoxId!)));
          setFolderList(currentAccountFolders.folders);
        } else {
          showToastError(getIn18Text('GET_PUSH_CONFIG_ERROR') + `${res.errorMsg ? `(${res.errorMsg})` : ''}`);
        }
      });
    }
  };

  const [mailFolderModalVisible, setMailFolderModalVisible] = useState<boolean>(false);
  const handleShowMailFolder = () => {
    setMailFolderModalVisible(true);
    mailApi.doGetAllAccountsFoldersForConfig().then(res => {
      if (res.success && res.data) {
        const data = res.data as Array<ISubAccountMailFoldersConfigItem>;
        setAllAccountFolderList(data);
        setAccountList(data.map(item => item.email));
        setCurrentEmail(data[0].email, data);
      } else {
        showToastError(`${getIn18Text('GET_MAIL_FOLDERS_ERROR')}${res.errorMsg ? `(${res.errorMsg})` : ''}`);
      }
    });
  };
  const [isSaveing, setIsSaveing] = useState<boolean>(false);

  const resetState = () => {
    setIsSaveing(false);
  };

  const handleModalSubmit = () => {
    if (isSaveing) return;
    setIsSaveing(true);
    const currentUser = systemApi.getCurrentUser();
    if (!currentUser) {
      showToastError('当前用户未登录');
      resetState();
      return;
    }
    // setAccountApiCurrentAccount(currentAccount);
    const setConfig: IPushConfigSetRequest = {
      isMailEnable: isMailEnable,
      disableFolders: folderList
        .filter(mailFolderItem => {
          if (!enableFolderIds || !enableFolderIds.length) {
            return false;
          }
          return !enableFolderIds.includes(Number(mailFolderItem.mailBoxId!));
        })
        .map(item => Number(item.mailBoxId)),
    };
    mailApi
      .setPushConfig(setConfig, setAccountApiCurrentAccount(currentAccount))
      .then(res => {
        if (res && res.success) {
          Toast.success(getIn18Text('SET_PUSH_CONFIG_SUCCESS'));
          setMailFolderModalVisible(false);
        } else {
          showToastError(`${getIn18Text('SET_PUSH_CONFIG_ERROR')}${res.errorMsg ? `(${res.errorMsg})` : ''}`);
        }
      })
      .finally(() => {
        resetState();
      });
  };

  const hanleFolderChanged = (e: Array<any>) => {
    setEnableFolderIds(e);
  };

  const handleCurrentAccountClick = (email: string) => {
    if (currentAccount === email) return;
    setCurrentEmail(email);
  };

  const [visibleIM, setVisibleIM] = useState<boolean>(true);
  useEffect(() => {
    setVisibleIM(nimApi.getIMAuthConfig());
  }, []);

  return (
    <CommonWrap title={getIn18Text('TONGZHI')}>
      <div className={styles.configContentCheckbox}>
        <div className={styles.configContentCheckboxTitle}>{getIn18Text('MAIL_PUSH_CONFIG_TITLE')}</div>
        <div>
          <Button className={styles.mailFolderBtn} onClick={handleShowMailFolder}>
            {getIn18Text('MAIL_PUSH_FOLDERS_CONFIG_TITLE')}
          </Button>
        </div>
      </div>
      {visibleIM && (
        <div className={styles.configContentCheckbox}>
          <div className={styles.configContentCheckboxTitle}>{getIn18Text('IM_PUSH_CONFIG_TITLE')}</div>
          <Checkbox checked={isImEnable} onChange={e => handleImEnenableChanged(e)} defaultChecked={isImEnable}>
            {getIn18Text('IM_ALL_PUSH_CONFIG_TITLE')}
          </Checkbox>
        </div>
      )}
      {/* win7提示音 */}
      {win7BeepVis && (
        <div className={styles.configContentCheckbox}>
          <div className={styles.configContentCheckboxTitle}>{getIn18Text('TONGZHITISHIYIN')}</div>
          <Checkbox checked={win7Beep} onChange={e => handleWin7BeepChanged(e)}>
            {getIn18Text('KAIQITONGZHITISY')}
          </Checkbox>
        </div>
      )}
      <Modal
        wrapClassName={styles.mailFolderSettingModal}
        width={640}
        visible={mailFolderModalVisible}
        okText={isSaveing ? getIn18Text('PUSH_CONFIG_SETTING') : ''}
        title={getIn18Text('MAIL_PUSH_FOLDERS_CONFIG_LABEL')}
        onOk={handleModalSubmit}
        onCancel={() => {
          setMailFolderModalVisible(false);
        }}
      >
        <div className={styles.mainWrapper}>
          <div className={styles.mainWrapperLeft}>
            {accountList.map(accountStr => {
              return (
                <div
                  onClick={() => {
                    handleCurrentAccountClick(accountStr);
                  }}
                  className={styles.accountItem + ` ${accountStr === currentAccount ? styles.accountItemSelected : ''}`}
                >
                  {accountStr}
                </div>
              );
            })}
          </div>
          <div className={styles.mainWrapperLine}></div>
          <div className={styles.mainWrapperRight}>
            {folderList && folderList.length ? (
              <>
                <div className={`${styles.folderSettingItem} ${styles.mailSetting}`}>
                  <Checkbox checked={isMailEnable} onChange={handleMailEnableChanged}>
                    {getIn18Text('MAIL_PUSH_ALLFOLDERS_TITLE')}
                  </Checkbox>
                </div>
                <Checkbox.Group value={enableFolderIds} className={styles.folderGroup} onChange={hanleFolderChanged}>
                  {folderList.map(folderItem => {
                    return (
                      <Checkbox disabled={!isMailEnable || Number(folderItem.mailBoxId) === 1} value={folderItem.mailBoxId}>
                        {folderItem.entry.mailBoxName}
                      </Checkbox>
                    );
                  })}
                </Checkbox.Group>
              </>
            ) : null}
          </div>
        </div>
      </Modal>
    </CommonWrap>
  );
};
export default Notification;
