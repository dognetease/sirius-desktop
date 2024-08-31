import React, { useState } from 'react';
import { Popover, Button } from 'antd';
import { TooltipPlacement } from 'antd/lib/tooltip';
import style from './cancel-popover.module.scss';
import { getIn18Text } from 'api';
interface CancelToolTipProps {
  onConfirm: () => void;
  disable?: boolean;
  placement: TooltipPlacement;
}
export const CancelPopover: React.FC<CancelToolTipProps> = ({ children, onConfirm, disable = false, placement = 'bottom' }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const overlay = () => (
    <div className={style.card}>
      <div className={style.title}>{getIn18Text('GUIZEWEIBAOCUN')}</div>
      <div className={style.btnGroup}>
        <Button className={style.btnCancel} onClick={() => setVisible(false)}>
          {getIn18Text('JIXUBIANJI')}
        </Button>
        <Button
          className={style.btnConfirm}
          type="primary"
          danger
          onClick={() => {
            onConfirm();
            setVisible(false);
          }}
        >
          {getIn18Text('TUICHU')}
        </Button>
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
