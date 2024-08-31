/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { Modal, ModalFuncProps, ModalProps } from 'antd';
import { api, locationHelper } from 'api';
import { SIDE_BAR_WIDTH, TOOL_BAR_HEIGHT } from '@web-common/utils/constant';
import CloseIcon from '../Icons/svgs/CloseMailSvg';
import SiriusCheckbox from '@web-common/components/UI/SiriusContact/Checkbox';
import { ReactComponent as WarningIcon } from '@/images/icons/edm/warning.svg';
import styles from './SiriusModal.module.scss';
import colors from 'colors';
import { getIn18Text } from 'api';
import IconCard from '../IconCard';
const systemApi = api.getSystemApi();
interface ModalReturn {
  destroy: () => void;
  update: (configUpdate: any) => void;
}
interface ISiriusModal {
  info: (props: SiriusModalFuncProps) => ModalReturn;
  success: (props: SiriusModalFuncProps) => ModalReturn;
  error: (props: SiriusModalFuncProps) => ModalReturn;
  warning: (props: SiriusModalFuncProps) => ModalReturn;
  confirm: (props: SiriusModalFuncProps) => ModalReturn;
  confirmError: (props: SiriusModalFuncProps) => ModalReturn;
}
interface SiriusModalFuncProps extends ModalFuncProps {
  icon?: React.ReactNode;
  hideCancel?: boolean;
  needCheckContent?: boolean;
}
interface ModalCheckContentProps {
  onCheck: (isChecked: boolean) => void;
}
export interface SiriusModalProps extends ModalProps {
  isGlobal?: boolean;
  globalMaskStyle?: React.CSSProperties;
  icon?: React.ReactNode;
}
// console.log(colors.bgBlue(global as any), '----------------');
export const modalProps: SiriusModalProps = {
  isGlobal: false,
  cancelText: getIn18Text('QUXIAO'),
  okText: getIn18Text('QUEDING'),
  centered: true,
  destroyOnClose: true,
  maskClosable: true,
  // 静态方法用false 会造成无法显示 已经询问了官方
  // 详情见 https://github.com/ant-design/ant-design/issues/33359#issuecomment-997569927
  // getContainer: false, // modal不显示在最顶层，不影响切换tab后的展示
  // zIndex: 1000,
  closeIcon: <CloseIcon className="dark-invert" />,
  wrapClassName: `${!locationHelper.testPathMatch('/') ? styles.modalWrapGlobal : !systemApi.isWebWmEntry() ? styles.modalWrap : ''}`,
  // systemApi.isWebWmEntry()在非外贸和外贸测试环境为false，外贸预发及线上为true
  maskStyle: {
    background: 'rgba(0, 0, 0, 0.5)',
    left: `${!locationHelper.testPathMatch('/') ? 0 : !systemApi.isWebWmEntry() ? SIDE_BAR_WIDTH : 0}px`,
    top: `${!locationHelper.testPathMatch('/') ? 0 : !systemApi.inEdm() && !systemApi.isElectron() ? TOOL_BAR_HEIGHT : 0}px`,
  },
  globalMaskStyle: { background: 'rgba(0, 0, 0, 0.5)', left: 0 }, // 覆盖最左侧tab栏
};
const OriginModal: React.FC<SiriusModalProps> = props => {
  const { children, isGlobal = false, maskStyle, getContainer = false, ...restProps } = props;
  const _maskStyle = isGlobal ? modalProps.globalMaskStyle : modalProps.maskStyle;
  return (
    <Modal getContainer={getContainer} {...modalProps} {...restProps} maskStyle={{ ..._maskStyle, ...maskStyle }}>
      {children}
    </Modal>
  );
};
export const SiriusHtmlModal: React.FC<SiriusModalProps> = props => {
  const { children, isGlobal = false, wrapClassName, maskStyle, ...restProps } = props;
  const _maskStyle = isGlobal ? modalProps.globalMaskStyle : modalProps.maskStyle;
  return (
    <Modal
      keyboard={false}
      getContainer={false}
      bodyStyle={{ padding: 0, margin: 0 }}
      footer={null}
      {...modalProps}
      {...restProps}
      maskStyle={{ ..._maskStyle, ...maskStyle }}
    >
      {children}
    </Modal>
  );
};
const SiriusModal = OriginModal as ISiriusModal & React.FC<SiriusModalProps>;
const handleSiriusModal = (props: SiriusModalFuncProps, type: 'info' | 'success' | 'error' | 'warn' | 'warning' | 'confirm' | 'confirmError') => {
  let isChecked = false;
  if (props.needCheckContent) {
    props.content = (
      <ModalCheckContent
        onCheck={(checked: boolean) => {
          isChecked = checked;
        }}
      >
        {props.content}
      </ModalCheckContent>
    );
    if (props.onOk) {
      const onOk = props.onOk;
      props.onOk = async () => {
        await onOk(isChecked);
      };
    }
  }
  if (props.hideCancel) {
    return Modal[type]({ ...modalProps, icon: <i className={`icon ${type}-icon`} />, ...props });
  }
  if (props.title) {
    props.title = <span data-test-id="global_toast_title">{props.title}</span>;
  }
  if (props.content) {
    props.content = <div data-test-id="global_toast_content">{props.content}</div>;
  }
  // @ts-ignore
  props.cancelButtonProps = { ...(props.cancelButtonProps || {}), 'data-test-id': 'global_toast_left_btn' };
  // @ts-ignore
  props.okButtonProps = { ...(props.okButtonProps || {}), 'data-test-id': 'global_toast_right_btn' };

  return Modal.confirm({ ...modalProps, icon: <i className={`icon ${type}-icon`} />, ...props });
};
SiriusModal.info = (props: SiriusModalFuncProps) => {
  return handleSiriusModal(props, 'info');
};
SiriusModal.success = (props: SiriusModalFuncProps) => {
  return handleSiriusModal(props, 'success');
};
SiriusModal.error = (props: SiriusModalFuncProps) => {
  return handleSiriusModal(props, 'error');
};
SiriusModal.warning = (props: SiriusModalFuncProps) => {
  return handleSiriusModal(props, 'warning');
};
const ModalCheckContent: React.FC<ModalCheckContentProps> = ({ onCheck, children }) => {
  const [checked, setChecked] = useState<boolean>(false);
  return (
    <div
      className={styles.modalCheckContentWrap}
      data-test-id="global_toast_content_checkbox"
      data-test-check={checked}
      onClick={() => {
        setChecked(b => !b);
        onCheck(!checked);
      }}
    >
      <div className={styles.checkboxWrap}>
        <SiriusCheckbox checked={checked} />
      </div>
      <div className={styles.contentWrap}>{children}</div>
    </div>
  );
};
SiriusModal.confirm = (props: SiriusModalFuncProps) => {
  return handleSiriusModal(props, 'confirm');
};
SiriusModal.confirmError = (props: SiriusModalFuncProps) => {
  props.icon = (
    <span className={styles.confirmErrorIcon}>
      <WarningIcon />
    </span>
  );
  props.className = `${props.className} ${styles.confirmError}`;
  return handleSiriusModal(props, 'confirm');
};
export default SiriusModal;
