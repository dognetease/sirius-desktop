import React, { FC } from 'react';
import { SignDetail } from 'api';
import { Modal } from 'antd';
import { useActions, useAppDispatch } from '@web-common/state/createStore';
import { deleteSignAsync, useSignAsync as _useSignAsync } from '@web-common/state/reducer/mailConfigReducer';
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';
import { MailConfigActions } from '@web-common/state/reducer';
import styles from './index.module.scss';
import { getIn18Text } from 'api';

const { confirm } = Modal;
export const loadIframe = (e: React.SyntheticEvent) => {
  const target = e.target as HTMLIFrameElement;
  const height = target.contentDocument?.body.clientHeight || 0;
  target.height = String(height + 20);
};
export const SignItem: FC<{
  signDetail: SignDetail;
  setShowSignList: (value: React.SetStateAction<boolean>) => void;
  isSingle?: boolean; // 非列表需要展示 mask
}> = props => {
  const {
    signDetail: { signInfoDTO, signId, divContent },
    setShowSignList,
    isSingle = false,
  } = props;
  const dispatch = useAppDispatch();
  const { doToggleModal } = useActions(MailConfigActions);
  const onEdit = (signItem: SignDetail) => doToggleModal({ visble: true, signItem });
  const showConfirm = () => {
    confirm({
      title: getIn18Text('QUEDINGYAOSHANCHU12'),
      icon: <ExclamationCircleOutlined />,
      content: '',
      okText: getIn18Text('QUEDING'),
      cancelText: getIn18Text('QUXIAO'),
      mask: true,
      centered: true,
      onOk() {
        // doSetCurrentMail(signInfoDTO?.emailAddr);
        signId && dispatch(deleteSignAsync({ id: signId }));
      },
      maskStyle: {
        background: isSingle ? 'rgba(0,0,0,0.5)' : 'transparent',
      },
    });
  };
  return (
    <div className={styles.mailSignItem}>
      <div className={styles.mailSignItemLeft}>
        <iframe className={styles.docIframe} srcDoc={divContent} onLoad={loadIframe} />
      </div>
      <div className={styles.mailSignItemRight}>
        {signInfoDTO.isSetDefault && <div className={styles.mailSignItemRightTag}>{getIn18Text('MORENQIANMING')}</div>}
        <div className={styles.mailSignItemRightActionBox}>
          <div
            className={styles.mailSignItemDelete}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              showConfirm();
            }}
          >
            {getIn18Text('SHANCHU')}
          </div>
          <div
            className={styles.mailSignItemEdit}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setShowSignList(false);
              // doSetCurrentMail(signInfoDTO?.emailAddr);
              signId && onEdit(props.signDetail);
            }}
          >
            {getIn18Text('BIANJI')}
          </div>
          <div
            className={styles.mailSignItemDefault}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              // doSetCurrentMail(signInfoDTO?.emailAddr);
              signId && dispatch(_useSignAsync({ signId, setDefault: !signInfoDTO.isSetDefault }));
            }}
          >
            {signInfoDTO.isSetDefault ? getIn18Text('QUXIAOMOREN') : getIn18Text('SHEWEIMOREN')}
          </div>
        </div>
      </div>
    </div>
  );
};
