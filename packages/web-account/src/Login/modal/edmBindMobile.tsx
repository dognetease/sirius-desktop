import React, { useState } from 'react';
import message from '@web-common/components/UI/Message/SiriusMessage';
// import SiriusModal, { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
// import SiriusModal, { SiriusHtmlModal } from '@web-common/components/UI/SiriusModal/index';
import SiriusModal, { SiriusHtmlModal } from '@lingxi-common-component/sirius-ui/SiriusModal';
import styles from './bindMobile.module.scss';
import MobileValidate, { submitFunc } from '../validate/mobile';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';

import { api, StorageKey } from 'api';
import { getIn18Text } from 'api';

interface MobileBindModalProp {
  onSuccess: () => void;
  setVisible: (b: boolean) => void;
  visible?: boolean;
  currentLoginAccount?: string;
}

const storeApi = api.getDataStoreApi();
const systemApi = api.getSystemApi();
const MobileBindModal: React.FC<MobileBindModalProp> = props => {
  const { onSuccess, setVisible, visible, currentLoginAccount } = props;

  const [visibleMobileValidate, setVisibleMobileValidate] = useState<boolean>(true);

  const onValidateSuccess: submitFunc = (mobile: string) => {
    if (mobile) {
      message.success(getIn18Text('BANGDINGCHENGGONG！'));
      setTimeout(() => {
        setVisible(false);
        onSuccess();
      }, 500);
    } else {
      setVisible(false);
      onSuccess();
    }
  };

  if (!visible) {
    return null;
  }
  return (
    <div className={styles.modalWrap} hidden={!visibleMobileValidate}>
      <SiriusHtmlModal
        destroyOnClose
        visible={visible}
        width={476}
        onCancel={() => {
          setVisible(false);
          onSuccess();
        }}
        closeIcon={<CloseIcon className="dark-invert" />}
      >
        <div className={styles.wrap} hidden={!visibleMobileValidate}>
          <div className={styles.title} style={{ marginBottom: 8 }}>
            {getIn18Text('BANGDINGNINDESHOUJH')}
          </div>
          <div className={styles.subTitle}>{getIn18Text('BANGDINGSHOUJIHAOHNKYTGSJHDL')}</div>
          <MobileValidate
            from="loginAccount"
            hideMobileInput={false}
            onSuccess={onValidateSuccess}
            renderSubmitBottom={() => (
              <div
                onClick={() => {
                  setVisibleMobileValidate(false);
                  setTimeout(() => {
                    SiriusModal.error({
                      title: getIn18Text('QUEDINGXIACIDENGLJBZTXM？'),
                      onOk: () => {
                        const email = currentLoginAccount || systemApi.getCurrentUser()?.id || 'global';
                        storeApi.putSync(
                          StorageKey.LoginSkipBindMobile,
                          JSON.stringify({
                            [email]: 'true',
                          }),
                          { noneUserRelated: true }
                        );
                        onSuccess && onSuccess();
                      },
                      onCancel: () => {
                        setTimeout(() => {
                          setVisibleMobileValidate(true);
                        }, 100);
                      },
                    });
                  }, 100);
                }}
                className={styles.noTip}
              >
                {getIn18Text('XIACIBUZAITIX')}
              </div>
            )}
            isBind={true}
            isUpdate={false}
          />
        </div>
      </SiriusHtmlModal>
    </div>
  );
};
export default MobileBindModal;
