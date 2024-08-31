import React, { useEffect, useState } from 'react';
import SiriusModal, { SiriusModalFuncProps as ModalFuncProps, SiriusModalProps as ModalProps, ISiriusModal, SiriusHtmlModal as ISiriusHtmlModal } from './SiriusModal';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import classnames from 'classnames';
import styles from './SiriusModal.module.scss';

export interface IProps extends ModalProps {
  headerBottomLine?: boolean;
  footerTopLine?: boolean;
  children: React.ReactNode;
}

export type { ModalFuncProps, ModalProps };

/**
 * 根据设计稿规范：总高度 <= 600px，其中 header: 56px / 48px，footer：68px，body 内边距 20px
 * header 二期修改：有 header 分割线是 56px ，反之 48px
 */
const Modal: ISiriusModal & React.FC<IProps> = props => {
  const { children, headerBottomLine, footerTopLine, className, bodyStyle, okButtonProps, cancelButtonProps, ...rest } = props;
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const [init, setInit] = useState(true);

  const restProps = () => {
    if (props?.footer || props?.footer === null) return rest;
    else
      return {
        ...rest,
        footer: (
          <div className={styles.deFooter}>
            <Button
              btnType="minorLine"
              onClick={e => {
                props?.onCancel && props.onCancel(e);
              }}
              {...(cancelButtonProps as Omit<typeof cancelButtonProps, 'size'>)}
            >
              取消
            </Button>
            <Button
              btnType="primary"
              onClick={e => {
                props?.onOk && props.onOk(e);
              }}
              {...(okButtonProps as Omit<typeof okButtonProps, 'size'>)}
            >
              确定
            </Button>
          </div>
        ),
      };
  };

  const maxHeight = `${props.footer === null ? 544 : 476}`;
  const maxWidth = 1000;
  const yPadding = +`${props.footer === null ? 20 : 20 * 2}`;
  const xPadding = 20 * 2;
  useEffect(() => {
    setInit(true);
    setTimeout(() => {
      const antModal: HTMLDivElement = document.querySelector('.sirius-modal-wrap') as HTMLDivElement;
      const antModalHeader: HTMLDivElement = document.querySelector('.sirius-modal-wrap>.ant-modal-content>.ant-modal-header') as HTMLDivElement;
      const antModalFooter: HTMLDivElement = document.querySelector('.sirius-modal-wrap>.ant-modal-content>.ant-modal-footer') as HTMLDivElement;
      if (antModal && antModalHeader) {
        antModal.style.maxHeight = '600px';
        antModal.style.maxWidth = '1000px';
        antModalHeader.style.cssText = `height: ${headerBottomLine ? 56 : 48}px;
                 padding: 20px 20px 4px 20px;
                 border-bottom: ${headerBottomLine ? 1 : 0}px solid #f0f3f5;
                `;
      }
      if (antModalFooter) {
        antModalFooter.style.cssText = `height: 68px;
                 padding: 18px 20px;
                 border-top: ${footerTopLine ? 1 : 0}px solid #f0f3f5;
                `;
      }
    }, 0);
  }, [props.visible]);

  useEffect(() => {
    if (!ref) return;
    init && fresh();
    // @ts-ignore
    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver; // Firefox和Chrome早期版本中带有前缀
    const observer = new MutationObserver(() => {
      setInit(false);
      fresh();
    });
    observer.observe(ref, { childList: true, attributes: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [ref]);

  const fresh = () => {
    if (!ref) return;
    const h = ref.scrollHeight;
    const w = ref.scrollWidth;
    const antModalBody: HTMLDivElement = document.querySelector('.sirius-modal-wrap>.ant-modal-content>.ant-modal-body') as HTMLDivElement;
    if (antModalBody) {
      if (h + yPadding < +maxHeight) {
        // 解决 select 设置 getPopupContainer={nd => nd.parentElement} 后，下拉被遮挡的问题
        antModalBody.style.overflow = 'visible';
      } else {
        antModalBody.style.overflowY = 'auto';
      }

      // if(w + xPadding > maxWidth) {
      // 	antModalBody.style.overflowX = 'scroll'
      // }
    }
  };

  // 传入 ant-modal-body 内容最外层不应该设置额外的 margin 边距
  return (
    <SiriusModal
      bodyStyle={{ maxHeight: `${maxHeight}px`, padding: '20px 20px', ...bodyStyle }}
      className={classnames('sirius-modal-wrap', 'global-marketing-modal', className, styles.modalTag)}
      {...restProps()}
    >
      <div ref={node => setRef(node)}>{children}</div>
    </SiriusModal>
  );
};

Modal.confirm = SiriusModal.confirm;
Modal.success = SiriusModal.success;
Modal.error = SiriusModal.error;
Modal.info = SiriusModal.info;
Modal.warning = SiriusModal.warning;

export const SiriusHtmlModal = ISiriusHtmlModal;

export default Modal;
