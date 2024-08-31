import React, { useState, useEffect, ReactElement } from 'react';
import style from './popup.module.scss';
import { getIn18Text } from 'api';
interface PopupProps {
  record?: any;
  popRows?: any;
  visible: boolean;
  onClick(record, value): void;
  x?: number;
  y?: number;
}
/**
 * 右键自定义菜单，菜单会展示在鼠标右键位置显示。 目前用于Table的ContextMenu，
 * @param props
 * @returns
 */
const Popup: React.FC<PopupProps> = props => {
  const {
    record = null,
    visible = false,
    x = 0,
    y = 0,
    popRows = [
      { text: getIn18Text('HUIFUGAIWENJIAN'), value: 'recover' },
      { text: getIn18Text('CHEDISHANCHU'), value: 'delete' },
    ],
    onClick: callback,
  } = props;
  const _callback = (record, value) => {
    callback(record, value);
  };
  return (
    <div>
      {visible && (
        <ul className={style.popup} style={{ left: `${x}px`, top: `${y}px` }}>
          {popRows.map(({ text, value }) => (
            <li onClick={() => _callback(record, value)}>{text}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
export default Popup;
