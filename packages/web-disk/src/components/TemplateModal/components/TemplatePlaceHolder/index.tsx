/*
 * @Author: wangzhijie02
 * @Date: 2022-05-30 10:41:02
 * @LastEditors: wangzhijie02
 * @LastEditTime: 2022-07-05 14:55:17
 * @Description: file content
 */
import React from 'react';

import { DOC_TYPE } from '../../definition';
import styles from './index.module.scss';

interface Props {
  docType: DOC_TYPE;
  onClick?: () => void;
}
const titles = new Map<DOC_TYPE, string>([
  ['doc', '新建文档'],
  ['excel', '新建表格'],
  ['unitable', '新建Unitable'],
]);
export const TemplatePlaceHolder: React.FC<Props> = props => {
  return (
    <div className={styles.tempAddContainer} onClick={props.onClick}>
      <span className={styles.icon}></span>
      <span className={styles.title}>{titles.get(props.docType) ?? titles.get('doc')}</span>
    </div>
  );
};
