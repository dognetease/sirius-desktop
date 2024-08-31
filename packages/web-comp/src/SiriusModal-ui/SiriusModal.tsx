import React, { useState } from 'react';
import { Modal, Checkbox } from 'antd';
import { ModalProps, ModalFuncProps } from 'antd/lib/modal';
import { TongyongChenggongMian, TongyongShuomingMian, TongyongYiwenMian, TongyongCuowutishiMian, TongyongGuanbiMian, TongyongGuanbiXian } from '@sirius/icons';
import ConfigProvider from '../configProvider';
import classnames from 'classnames';
import './antd.scss';
import styles from './SiriusModal.module.scss';

type ModalType = 'info' | 'success' | 'error' | 'warning' | 'confirm';
Modal.config({ rootPrefixCls: process.env.BUILD_ENV === 'ui' ? 'lx-ant' : 'ant' });

const Icons = {
  info: <TongyongShuomingMian className={styles.siInfo} />,
  error: <TongyongGuanbiMian className={styles.siError} />,
  confirm: <TongyongYiwenMian className={styles.siConfirm} />,
  warning: <TongyongCuowutishiMian className={styles.siWarning} />,
  success: <TongyongChenggongMian className={styles.siSuccess} />,
};

interface ModalReturn {
  destroy: () => void;
  update: (configUpdate: any) => void;
}
export interface ISiriusModal {
  info: (props: SiriusModalFuncProps) => ModalReturn;
  success: (props: SiriusModalFuncProps) => ModalReturn;
  error: (props: SiriusModalFuncProps) => ModalReturn;
  warning: (props: SiriusModalFuncProps) => ModalReturn;
  confirm: (props: SiriusModalFuncProps) => ModalReturn;
}
export interface SiriusModalFuncProps extends ModalFuncProps {
  icon?: React.ReactNode;
  hideCancel?: boolean;
  needCheckContent?: boolean;
  isGlobal?: boolean;
}
interface ModalCheckContentProps {
  onCheck: (isChecked: boolean) => void;
  children?: React.ReactNode;
}
export interface SiriusModalProps extends ModalProps {
  isGlobal?: boolean;
  globalMaskStyle?: React.CSSProperties;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * @todo 需要抽出 Css Token
 */
export const modalProps: SiriusModalProps = {
  isGlobal: false,
  cancelText: '取消',
  okText: '确定',
  centered: true,
  destroyOnClose: true,
  maskClosable: true,
  // 静态方法用false 会造成无法显示 已经询问了官方
  // 详情见 https://github.com/ant-design/ant-design/issues/33359#issuecomment-997569927
  // getContainer: false, // modal不显示在最顶层，不影响切换tab后的展示
  // zIndex: 1000,
  closeIcon: <TongyongGuanbiXian />,
  // systemApi.isWebWmEntry()在非外贸和外贸测试环境为false，外贸预发及线上为true
  maskStyle: {
    background: 'rgba(0, 0, 0, 0.5)',
    left: 0,
    top: 0,
  },
  globalMaskStyle: { background: 'rgba(0, 0, 0, 0.5)', left: 0 }, // 覆盖最左侧tab栏
};
const OriginModal: React.FC<SiriusModalProps> = props => {
  const { children, isGlobal = false, maskStyle, ...restProps } = props;
  const _maskStyle = isGlobal ? modalProps.globalMaskStyle : modalProps.maskStyle;
  return (
    // @ts-ignore
    <ConfigProvider>
      <Modal getContainer={false} {...modalProps} {...restProps} maskStyle={{ ..._maskStyle, ...maskStyle }}>
        {children}
      </Modal>
    </ConfigProvider>
  );
};
export const SiriusHtmlModal: React.FC<SiriusModalProps> = props => {
  const { children, isGlobal = false, wrapClassName, maskStyle, ...restProps } = props;
  const _maskStyle = isGlobal ? modalProps.globalMaskStyle : modalProps.maskStyle;
  return (
    // @ts-ignore
    <ConfigProvider>
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
    </ConfigProvider>
  );
};
const SiriusModal = OriginModal as ISiriusModal & React.FC<SiriusModalProps>;
const handleSiriusModal = (props: SiriusModalFuncProps, type: ModalType) => {
  let isChecked = false;
  if (props.needCheckContent) {
    props.content = (
      // @ts-ignore
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
  // footer 属性当前版本不支持修改 https://ant.design/components/modal-cn
  const _maskStyle = props?.isGlobal ? modalProps.globalMaskStyle : modalProps.maskStyle;
  return Modal.confirm({
    ...modalProps,
    className: classnames(props.className, 'sirius-confirm'),
    icon: Icons[type as ModalType],
    maskStyle: { ..._maskStyle },
    ...props,
  });
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

SiriusModal.confirm = (props: SiriusModalFuncProps) => {
  return handleSiriusModal(props, 'confirm');
};

const ModalCheckContent: React.FC<ModalCheckContentProps> = ({ onCheck, children }) => {
  const [checked, setChecked] = useState<boolean>(false);
  return (
    <div
      className={styles.modalCheckContentWrap}
      onClick={() => {
        setChecked(b => !b);
        onCheck(!checked);
      }}
    >
      <div className={styles.checkboxWrap}>
        <Checkbox checked={checked} />
      </div>
      <div className={styles.contentWrap}>{children}</div>
    </div>
  );
};

export default SiriusModal;
