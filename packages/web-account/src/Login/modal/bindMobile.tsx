import React from 'react';
import { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import { actions as LoginActions } from '@web-common/state/reducer/loginReducer';
import styles from './bindMobile.module.scss';
import MobileValidate from '../validate/mobile';
import { getIn18Text } from 'api';

interface MobileBindModalProp {
  onSuccess: () => void;
  isBind: boolean;
  isUpdate?: boolean;
  defaultMobile?: string;
  defaultArea?: string;
}
const MobileBindModal: React.FC<MobileBindModalProp> = props => {
  const { onSuccess, isBind, isUpdate, defaultMobile, defaultArea } = props;
  const { visibleMobileBindModal } = useAppSelector(state => state.loginReducer);
  const { setVisibleMobileBindModal } = useActions(LoginActions);
  const onValidateSuccess = () => {
    setVisibleMobileBindModal(false);
    onSuccess();
  };
  const title = isBind || isUpdate ? getIn18Text('BANGDINGNINDESHOU') : getIn18Text('JIEBANGXUYANZHENG');
  return (
    <SiriusHtmlModal destroyOnClose visible={visibleMobileBindModal} width={476} onCancel={() => setVisibleMobileBindModal(false)}>
      <div className={styles.wrap}>
        <div className={styles.title}>{title}</div>
        <MobileValidate
          from="account"
          hideMobileInput={!isBind && !isUpdate}
          onSuccess={onValidateSuccess}
          isBind={isBind}
          isUpdate={isUpdate}
          defaultMobile={defaultMobile}
          defaultArea={defaultArea}
        />
      </div>
    </SiriusHtmlModal>
  );
};
export default MobileBindModal;
