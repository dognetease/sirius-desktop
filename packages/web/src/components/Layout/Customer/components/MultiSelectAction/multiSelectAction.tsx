/*
 * @Author: sunmingxin
 * @Date: 2021-10-15 14:42:55
 * @LastEditTime: 2021-10-20 21:36:51
 * @LastEditors: sunmingxin
 */
import React, { useState, useRef, useEffect, useContext, CSSProperties } from 'react';
import { Table, Checkbox, Button } from 'antd';
import style from './multiSelectAction.module.scss';

interface comsProps {
  isShow?: boolean;
  selectedRowKeys?: string[] | number[];
  tableLength?: number;
  subTitle?: string | React.ReactElement;
  subAllTitle?: string | React.ReactElement;
  onCheckAllChange?: (e: any) => void;
  styles?: CSSProperties;
}

const SelectRowAction: React.FC<comsProps> = props => {
  const { selectedRowKeys, isShow, children, subTitle, styles } = props;
  return (
    <div style={{ ...styles, display: (selectedRowKeys && selectedRowKeys.length > 0) || isShow ? 'block' : 'none' }} className={style.multiSelectAction}>
      {/* <Checkbox
                indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < tableLength}
                onChange={onCheckAllChange}
                checked={selectedRowKeys.length === tableLength }
            >
                {subTitle}
            </Checkbox> */}
      {subTitle}
      <div style={{ float: 'right' }}>{children}</div>
    </div>
  );
};
export default SelectRowAction;
