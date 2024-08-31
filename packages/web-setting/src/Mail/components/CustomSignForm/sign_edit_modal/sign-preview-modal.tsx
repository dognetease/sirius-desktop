import React from 'react';
import { Modal, Spin } from 'antd';
import { useAppSelector, useActions } from '@web-common/state/createStore';
import { MailConfigActions } from '@web-common/state/reducer';
import style from './sign-preview-modal.module.scss';
import { getIn18Text } from 'api';

const SignPreviewModal = () => {
  const { signPreviewModalVisible, signActionLoading, signPriviewContent } = useAppSelector(state => state.mailConfigReducer);
  const { doToggleSignPreviewModal } = useActions(MailConfigActions);
  return (
    <Modal
      footer={null}
      visible={signPreviewModalVisible}
      mask={false}
      closable={false}
      maskClosable
      centered
      onCancel={() => doToggleSignPreviewModal(false)}
      width={610}
      bodyStyle={{ padding: 0, minHeight: 329 }}
      wrapClassName="extheme"
    >
      <Spin spinning={signActionLoading}>
        <div className={style.signPreviewModal}>
          <div>
            <div className={style.inputArea} style={{ borderTopLeftRadius: 6, borderTopRightRadius: 6 }}>
              {getIn18Text('SHOUJIANREN\uFF1A')}
            </div>
            <div className={style.inputArea}>{getIn18Text('ZHUTI\uFF1A')}</div>
            <div className={style.mainArea}>{getIn18Text('QINGSHURUZHENGWEN11')}</div>
          </div>
          <div style={{ overflowY: 'auto' }}>
            <div className={style.previewArea} dangerouslySetInnerHTML={{ __html: signPriviewContent }} />
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

export default SignPreviewModal;
