import { getIn18Text } from 'api';
import React from 'react';
import { anonymousFunction } from 'api';
import { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
import MailValidate, { MailValidateFrom } from '@/components/Layout/Login/validate/mail';
import styles from './bindAccount.module.scss';
import { useActions } from '@web-common/state/createStore';
import { actions as LoginActions } from '@web-common/state/reducer/loginReducer';

interface MailBindModalProp {
  title?: string;
  from: MailValidateFrom;
  defaultAccount?: string;
  // 当前手机号登录的节点
  currentAccountNode?: string;
  visible: boolean;
  visibleModal?: boolean;
  onBack?: anonymousFunction;
}

const MailBindModal: React.FC<MailBindModalProp> = props => {
  const { from, visible, title = '绑定您的网易外贸通账号', onBack, defaultAccount, currentAccountNode, visibleModal = true } = props;
  const { setMailBindModalInfo } = useActions(LoginActions);
  const onSuccess = () => {
    window.location.href = '/';
  };
  const renderWrap = () =>
    visible ? (
      <div className={styles.wrap}>
        {!visibleModal && onBack && (
          <div className={styles.back} onClick={onBack}>
            {getIn18Text('FANHUI')}
          </div>
        )}
        <div className={styles.title}>{title}</div>
        <MailValidate defaultAccount={defaultAccount} from={from} currentAccountNode={currentAccountNode} onSuccess={onSuccess} />
      </div>
    ) : null;
  return !visibleModal ? (
    renderWrap()
  ) : (
    <SiriusHtmlModal visible={visible} width={476} onCancel={() => setMailBindModalInfo({ visible: false, account: '' })}>
      {renderWrap()}
    </SiriusHtmlModal>
  );
};
export default MailBindModal;
