import React, { useEffect, useMemo } from 'react';
import { Button, Spin, Modal } from 'antd';
import { apiHolder as api, apis, MailSignatureApi, WriteLetterPropType } from 'api';
import { useAppDispatch, useAppSelector, MailConfigActions } from '@web-common/state/createStore';
import { getSignListAsync } from '@web-common/state/reducer/mailConfigReducer';
import { ReactComponent as DeleteIcon } from '@/images/icons/modal_close_temp.svg';
import { SignList } from './sign-list';
import { useNetStatus } from '@web-common/components/UI/NetWatcher';
import NoWifi from '@/images/no-wifi.png';
import styles from './index.module.scss';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import { ModalIdList } from '@web-common/state/reducer/niceModalReducer';
import { getIn18Text } from 'api';

interface SignListModalProps {
  signEditId: ModalIdList;
  signSelectId: ModalIdList;
  writeType?: WriteLetterPropType;
  onSave?: (content: string) => void;
}
// const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const signatureApi = api.api.requireLogicalApi(apis.mailSignatureImplApi) as MailSignatureApi;
/** 写信选择签名弹窗 */
const SelectSign = (props: SignListModalProps) => {
  const { onSave, writeType = 'common', signEditId, signSelectId } = props;
  const { signListLoading, signList } = useAppSelector(state => state.mailConfigReducer);
  const curAccount = useAppSelector(state => state.mailReducer.currentMail?.optSender?.mailEmail);
  const mailEmail = useMemo(() => curAccount || '', [curAccount]);
  const { doSetSignList, doSetSignListLoading } = MailConfigActions;
  const dispatch = useAppDispatch();
  const isOnline = useNetStatus();
  const modal = useNiceModal(signSelectId);
  const editModal = useNiceModal(signEditId);

  const getSignList = async () => {
    try {
      dispatch(doSetSignListLoading(true));
      // accountApi.setCurrentAccount({ email: mailEmail });
      const res = await signatureApi.doGetSignList({}, mailEmail);
      dispatch(doSetSignListLoading(false));
      if (res?.success && res.data) {
        res.data.map(sign => {
          sign._account = mailEmail;
        });
        dispatch(doSetSignList(res.data));
        if (!res.data.length) {
          modal.hide();
          editModal.show({ _account: mailEmail });
        }
      }
    } catch (err) {
      dispatch(doSetSignListLoading(false));
    }
  };

  useEffect(() => {
    if (!modal.hiding) {
      getSignList();
    }
  }, [modal.hiding]);

  return (
    <Modal
      bodyStyle={{ padding: 0 }}
      visible={!modal.hiding}
      footer={null}
      width="688px"
      destroyOnClose
      closeIcon={<DeleteIcon className="dark-invert" onClick={() => modal.hide()} />}
    >
      <div className={styles.signModalList}>
        <h3 style={{ padding: '0 20px' }}>{getIn18Text('XUANZEQIANMING')}</h3>
        {isOnline ? (
          <Spin spinning={signListLoading}>
            <SignList signSelectId={signSelectId} signEditId={signEditId} signList={signList} writeType={writeType} onSave={onSave} />
          </Spin>
        ) : (
          <div className={styles.noWifiBox}>
            <img src={NoWifi} alt="noWifi" />
            <div className={styles.noWifiTitle}>{getIn18Text('WANGLUOBUKEYONG')}</div>
            <Button className={styles.noWifiBtn} onClick={() => dispatch(getSignListAsync({ email: mailEmail }))}>
              {getIn18Text('SHUAXIN')}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SelectSign;
