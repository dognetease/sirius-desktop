/*
 * @Author: your name
 * @Date: 2022-03-21 10:55:20
 * @LastEditTime: 2022-03-21 11:16:09
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web-disk/src/components/BreadComp/index.ts
 */
import React from 'react';
import { Tooltip } from 'antd';
import classnames from 'classnames';

import IconCard from '@web-common/components/UI/IconCard/index';
import { Bread } from '../../disk';

import style from './index.module.scss';

interface Props {
  bread: Bread[];
  ellipsisIndex: number[];
  setCurrentDirId: (val: number, name?: string) => void;
  constant?: boolean;
  maxLength?: number;
  highlightColor?: string;
}

const formatBreadName = (val, maxLength = 10) => {
  if (val.length > maxLength) {
    return <Tooltip title={val}>{`${val.slice(0, 5)}...${val.slice(-5)}`}</Tooltip>;
  }
  return val;
};

const BreadComp: React.FC<Props> = ({ bread, ellipsisIndex, setCurrentDirId, maxLength = 10, highlightColor = '#262A33' }) => {
  const changeBread = item => {
    setCurrentDirId(item.id, item.name);
  };

  if (!bread) {
    return null;
  }

  return (
    <div className={style.breadComp}>
      {bread.map((item, index) => {
        const lastBreadcrumb = index === bread.length - 1;
        const clickBreadcrumb = () => {
          changeBread(item);
        };
        return lastBreadcrumb ? (
          // <div className={classnames(style.item, style.lastBread)} style={{ color: highlightColor }} key={item.id} onClick={clickBreadcrumb}>
          <div className={classnames(style.item, style.lastBread)} key={item.id} onClick={clickBreadcrumb}>
            {/* 当层级只有一层时就不用省略号了 */}
            {bread.length < 2 ? item.name : formatBreadName(item.name, maxLength)}
          </div>
        ) : (
          <div className={classnames(style.item, style.bread)} key={item.id} onClick={clickBreadcrumb}>
            {ellipsisIndex.includes(index) ? '...' : formatBreadName(item.name, maxLength)}
            <IconCard type="arrowRight" style={{ width: '12px', height: '12px', margin: '0 6px' }} />
          </div>
        );
      })}
    </div>
  );
};

export default BreadComp;
