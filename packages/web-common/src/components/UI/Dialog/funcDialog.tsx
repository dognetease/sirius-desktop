import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Modal } from 'antd';
import InfoCircleFilled from '@ant-design/icons/InfoCircleFilled';

import './dialog.scss';

export interface DialogProps {
  isPrompt?: boolean; // 是否是提示弹窗
  isCancel?: boolean; // 是否有取消按钮
  title?: string; // 标题，提示弹窗不传
  content?: string; // 提示内容
  okText?: string;
  onOk?: Function; // 确定按钮回调
  onCancel?: Function;
  danger?: boolean;
}

class FuncDialog {
  public antModal = Modal;

  show(showProps: DialogProps) {
    const {
      isPrompt, // 是否是提示弹窗
      isCancel, // 是否有取消按钮
      title, // 标题，提示弹窗不传
      content, // 提示内容
      okText,
      onOk, // 确定按钮回调
      onCancel,
      danger,
    } = showProps;

    this.isPrompt = isPrompt;

    const cont = () => (
      <>
        {isPrompt ? (
          <div className="u-dialog-title">
            <InfoCircleFilled style={{ color: '#386EE7', marginRight: '9px' }} />
            提示
          </div>
        ) : (
          <div className="u-dialog-title">
            <InfoCircleFilled style={{ color: '#F74F4F', marginRight: '9px' }} />
            {title}
          </div>
        )}
        {content ? <div className="u-dialog-content">{content}</div> : null}
      </>
    );

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

    const footer = () => (
      <>
        {isCancel ? (
          <Button key="cancel" className="u-middle-btn" onClick={onClickCancel}>
            取消
          </Button>
        ) : (
          ''
        )}
        <Button key="confirm" type="primary" className="u-middle-btn" onClick={onConfirm} danger={danger}>
          {okText}
        </Button>
      </>
    );

    return this.antModal.info({
      wrapClassName: 'u-dialog',
      width: '480px',
      title,
      icon: '',
      bodyStyle: { padding: '24px 40px' },
      content: cont(),
      footer: footer(),
    });
  }
}

export default new FuncDialog();
