import React, { useEffect, useRef } from 'react';
import SiriusModal, { SiriusModalProps } from '@web-common/components/UI/Modal/SiriusModal';
import classnames from 'classnames';

export interface IProps extends SiriusModalProps {
  headerBottomLine?: boolean;
  footerTopLine?: boolean;
}

/**
 * 根据设计稿规范：总高度 <= 600px，其中 header: 56px，footer：64px
 */
const Modal: React.FC<IProps> = props => {
  const { children, headerBottomLine, footerTopLine, className, ...restProps } = props;
  const ref = useRef<HTMLDivElement>(null);
  const maxHeight = `${props.footer === null ? 544 : 480}`;

  useEffect(() => {
    const antModal: HTMLDivElement = document.querySelector('.sirius-modal-wrap') as HTMLDivElement;
    const antModalHeader: HTMLDivElement = document.querySelector('.sirius-modal-wrap>.ant-modal-content>.ant-modal-header') as HTMLDivElement;
    const antModalFooter: HTMLDivElement = document.querySelector('.sirius-modal-wrap>.ant-modal-content>.ant-modal-footer') as HTMLDivElement;
    if (antModal && antModalHeader) {
      antModal.style.maxHeight = '600px';
      antModal.style.maxWidth = '1000px';
      antModalHeader.style.cssText = `height: 56px;
                 padding: 20px 24px 12px 24px;
                 border-bottom: ${headerBottomLine ? 1 : 0}px solid #f0f3f5;
                `;
    }
    if (antModalFooter) {
      antModalFooter.style.cssText = `height: 64px;
                 padding: 16px 24px;
                 border-top: ${footerTopLine ? 1 : 0}px solid #f0f3f5;
                `;
    }
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    const observer = new MutationObserver(() => {
      fresh();
    });
    observer.observe(ref.current, { childList: true, attributes: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [ref.current]);

  const fresh = () => {
    if (!ref.current) return;
    const h = ref.current.scrollHeight;
    const antModalBody: HTMLDivElement = document.querySelector('.sirius-modal-wrap>.ant-modal-content>.ant-modal-body') as HTMLDivElement;
    console.log('fresh-hi: ', h < +maxHeight);
    if (antModalBody) {
      if (h < +maxHeight) {
        // 解决 select 设置 getPopupContainer={nd => nd.parentElement} 后，下拉体被遮挡的问题
        antModalBody.style.overflow = 'visible';
      } else {
        antModalBody.style.overflow = 'hidden scroll';
      }
    }
  };

  return (
    <SiriusModal bodyStyle={{ maxHeight: `${maxHeight}px` }} className={classnames('sirius-modal-wrap', className)} {...restProps}>
      <div ref={ref}>{children}</div>
    </SiriusModal>
  );
};

export default Modal;
