import React, { useState } from 'react';
import { Modal, Checkbox, Button } from 'antd';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { api, apis, getIn18Text, LoginApi } from 'api';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';
import styles from './index.module.scss';

const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;

interface Props {
  visible: boolean;
  onJumpOutCancel: () => void;
  onJumpOutConfirm: () => void;
}

const JumpOutModal: React.FC<Props> = ({ visible, onJumpOutCancel, onJumpOutConfirm }) => {
  const [ignore, setIgnore] = useState(false);

  const onChange = (e: CheckboxChangeEvent) => {
    const isIgnore = e.target.checked;
    setIgnore(isIgnore);
  };

  const onClose = async (confirm: boolean) => {
    if (ignore) {
      try {
        await loginApi.setEntrancePopupVisible(confirm ? '点击立即体验' : '勾选下次不再提醒');
      } catch (error) {
        console.error('setEntrancePopupVisible error', error);
      }
    }
    if (confirm) {
      onJumpOutConfirm();
    } else {
      onJumpOutCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      width={640}
      closeIcon={<CloseIcon className="dark-invert" />}
      bodyStyle={{
        padding: '20px 20px 0',
      }}
      onCancel={() => onClose(false)}
      footer={null}
    >
      <div className={styles.container}>
        <div className={styles.title}>{getIn18Text('JUMP_OUT_MODAL_TITLE')}</div>
        <div className={styles.intro}>{getIn18Text('JUMP_OUT_MODAL_INTRO')}</div>
        <div className={styles.itemList}>
          <div className={styles.item}>
            <div className={styles.icon} />
            <p className={styles.text}>{getIn18Text('JUMP_OUT_MODAL_ITEM1')}</p>
          </div>
          <div className={styles.item}>
            <div className={styles.icon} />
            <p className={styles.text}>{getIn18Text('JUMP_OUT_MODAL_ITEM2')}</p>
          </div>
          <div className={styles.item}>
            <div className={styles.icon} />
            <p className={styles.text}>{getIn18Text('JUMP_OUT_MODAL_ITEM3')}</p>
          </div>
          <div className={styles.item}>
            <div className={styles.icon} />
            <p className={styles.text}>{getIn18Text('JUMP_OUT_MODAL_ITEM4')}</p>
          </div>
        </div>
        <div className={styles.footer}>
          <div className={styles.ignoreItem}>
            <Checkbox checked={ignore} onChange={onChange}>
              <span className={styles.checkboxText}>{getIn18Text('BUZAITIXING')}</span>
            </Checkbox>
          </div>
          <div className={styles.buttonItem}>
            <Button className={styles.cancelBtn} onClick={() => onClose(false)}>
              {getIn18Text('SHAOHOUZAIKAN')}
            </Button>
            <Button className={styles.confirmBtn} onClick={() => onClose(true)} type="primary">
              {getIn18Text('LIJISHIYONG')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default JumpOutModal;
