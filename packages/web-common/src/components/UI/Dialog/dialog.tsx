import React from 'react';
import { getIn18Text } from 'api';
import { Button, Modal } from 'antd';
import InfoCircleFilled from '@ant-design/icons/InfoCircleFilled';
import './dialog.scss';
export interface DialogProps {
  isModalVisible?: boolean;
  setModalVisible?: Function;
  isPrompt?: boolean; // 是否是提示弹窗
  isCancel?: boolean; // 是否有取消按钮
  title?: string; // 标题，提示弹窗不传
  content?: string; // 提示内容
  okText?: string;
  onOk?: Function; // 确定按钮回调
  onCancel?: Function;
  danger?: boolean;
}
const Dialog: React.FC<DialogProps> = ({
  isModalVisible,
  isPrompt,
  isCancel,
  title = getIn18Text('TISHI'),
  content = '',
  okText = getIn18Text('ZHIDAOLE'),
  onOk,
  onCancel,
  danger,
}) => {
  const onConfirm = () => {
    if (onOk) {
      onOk();
    }
  };
  const onClickCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };
  return (
    <div>
      <Modal
        wrapClassName="u-dialog"
        visible={isModalVisible}
        centered
        closable={false}
        width="480px"
        bodyStyle={{ padding: '24px 40px' }}
        footer={[
          isCancel ? (
            <Button key="cancel" className="u-middle-btn" onClick={onClickCancel}>
              {getIn18Text('QUXIAO')}
            </Button>
          ) : (
            ''
          ),
          <Button key="confirm" type="primary" className="u-middle-btn" onClick={onConfirm} danger={danger}>
            {okText}
          </Button>,
        ]}
      >
        {isPrompt ? (
          <div className="u-dialog-title">
            <InfoCircleFilled style={{ color: '#386EE7', marginRight: '9px' }} />
            {getIn18Text('TISHI')}
          </div>
        ) : (
          <div className="u-dialog-title">
            <InfoCircleFilled style={{ color: '#F74F4F', marginRight: '9px' }} />
            {title}
          </div>
        )}
        {content ? <div className="u-dialog-content">{content}</div> : null}
      </Modal>
    </div>
  );
};
export default Dialog;
