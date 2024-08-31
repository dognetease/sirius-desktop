import React, { useState } from 'react';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import { useActions } from '@web-common/state/createStore';
import { MailConfigActions } from '@web-common/state/reducer';
import { Popover } from 'antd';
import { TooltipPlacement } from 'antd/lib/tooltip';
import classnames from 'classnames';
import style from './cancel-popover.module.scss';
import { ModalIdList } from '@web-common/state/reducer/niceModalReducer';
import { getIn18Text } from 'api';
interface CancelToolTipProps {
  disable?: boolean;
  placement: TooltipPlacement;
  signEditId: ModalIdList;
}

const CancelPopover: React.FC<CancelToolTipProps> = ({ children, disable = false, placement = 'bottom', signEditId }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const { doChangeContent } = useActions(MailConfigActions);
  const modal = useNiceModal(signEditId);
  const modalClose = () => {
    doChangeContent('');
    modal.hide(true);
    setVisible(false);
  };
  const overlay = () => (
    <div className={style.card}>
      <div className={style.title}>{getIn18Text('QUEDINGYAOFANGQI')}</div>
      <div className={style.btnGroup}>
        <div className={classnames(style.btn, { [style.btnCancel]: true })} onClick={() => setVisible(false)}>
          {getIn18Text('QUXIAO')}
        </div>
        <div className={classnames(style.btn, { [style.btnConfirm]: true })} onClick={modalClose}>
          {getIn18Text('QUEDING')}
        </div>
      </div>
    </div>
  );
  return disable ? (
    <>{children}</>
  ) : (
    <Popover
      overlayClassName={style.cancelTooltip}
      onVisibleChange={v => setVisible(v)}
      content={overlay}
      visible={visible}
      trigger="click"
      placement={placement}
      getPopupContainer={e => (e.parentElement ? e.parentElement : e)}
    >
      {children}
    </Popover>
  );
};

export default CancelPopover;
