/*
 * @Author: wangzhijie02
 * @Date: 2022-05-26 18:25:23
 * @LastEditors: wangzhijie02
 * @LastEditTime: 2022-06-28 15:06:15
 * @Description: file content
 */
import React from 'react';
import IconCard from '@web-common/components/UI/IconCard/index';
import { ReactComponent as UnitableBetaSvg } from './svg/beta.svg';

/**
 * Unitable 文件类型标识符
 */
export const unitableType = 'unitable';
/**unitable 官方名称 */
export const MulTableName = 'Unitable';
/**用于埋点上报 */
export const docTrakerInfo: {
  [key: string]: string;
} = {
  doc: 'docs',
  [unitableType]: 'mulTables',
  sheet: 'sheets',
};

/**用于云文档 新建入口的下拉选项 */
export const mulTableDropItem = {
  key: unitableType,
  value: (
    <>
      {MulTableName}
      <span
        style={{
          position: 'relative',
          top: '3px',
          left: '8px',
        }}
      >
        <UnitableBetaSvg />
      </span>
    </>
  ),
  icon: <IconCard type="lxunitable" width={16} height={16} />,
};
