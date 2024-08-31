import React from 'react';
import ReactDOM from 'react-dom';
import { ReactComponent as WarningIcon } from '@/images/icons/regularcustomer/icon_warning.svg';
import { Position, PopoverOption } from './index';
import style from './style.module.scss';
import classnames from 'classnames';
import { getIn18Text } from 'api';
interface Props {
  stagePos: Position;
  popoverPos: Position;
  clickTipPos?: Position;
  closePanel?: string;
  popover?: PopoverOption;
  onStageClick?: () => any;
  onFinish?: () => any;
  onExit?: () => any;
}
export const CoverBox: React.FC<Props> = ({ stagePos = {}, popoverPos = {}, closePanel, popover, onFinish, onStageClick, onExit, clickTipPos }) => {
  const finish = () => {
    if (onFinish) {
      onFinish();
    }
  };
  const stageClick = () => {
    if (onStageClick) {
      onStageClick();
    }
  };
  const exitClick = () => {
    if (onExit) {
      onExit();
    }
  };
  return ReactDOM.createPortal(
    <>
      <div
        className={style.stage}
        onClick={stageClick}
        style={{
          left: `${stagePos.left}px`,
          top: `${stagePos.top}px`,
          width: `${stagePos.width}px`,
          height: `${stagePos.height}px`,
        }}
      ></div>
      <div
        className={style.driverStageMask1}
        style={{
          left: `${stagePos.left}px`,
          top: `${stagePos.top}px`,
        }}
      />
      <div
        className={style.driverStageMask2}
        style={{
          left: `${(stagePos.left || 0) + (stagePos.width || 0)}px`,
          top: `${(stagePos.top || 0) + (stagePos.height || 0)}px`,
        }}
      />
      {popover ? (
        <div
          className={classnames([style.popover, style[`popoverPlace${popover.placement || 'top'}`]])}
          style={{
            left: `${popoverPos.left}px`,
            top: `${popoverPos.top}px`,
          }}
        >
          <div className={style.popoverTitle}>{popover.title}</div>
          <div className={style.popoverDesc}>{popover.desc}</div>
          <div className={style.popoverTip}>
            <div className={style.text}>{popover.tip}</div>
            {popover.showFinish ? (
              <div className={style.btnwrap}>
                <button className={style.btn} onClick={finish}>
                  {getIn18Text('WANCHENG')}
                </button>
              </div>
            ) : (
              ''
            )}
          </div>
        </div>
      ) : (
        ''
      )}
      {closePanel !== 'none' ? (
        <div className={classnames([style.closePanel, style[closePanel || 'bottomRight']])}>
          <div className={style.content}>
            <div className={style.icon}>
              <WarningIcon />
            </div>
            <div className={style.text}>
              {getIn18Text('DANGQIANWEIJIAOXUEMOSHI\uFF0CJIANYIANZHAOJIAOXUEYINDAOCAOZUO\uFF0CRUOTUICHUJIAOXUE\uFF0CHOUXUJIANGBUZAIZHANSHIYINDAO')}
            </div>
          </div>
          <div className={style.btnwrap}>
            <span className={style.btn} onClick={exitClick}>
              {getIn18Text('TUICHUJIAOXUE')}
            </span>
          </div>
        </div>
      ) : (
        ''
      )}
      {clickTipPos ? (
        <div
          className={style.ripple}
          style={{
            left: `${clickTipPos.left}px`,
            top: `${clickTipPos.top}px`,
          }}
        >
          <div className={style.circle1}></div>
          {/* <div className={style.circle2}></div>
            <div className={style.circle3}></div> */}
        </div>
      ) : (
        ''
      )}
    </>,
    document.body
  );
};
