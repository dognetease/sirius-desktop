/*
 * @Author: wangzhijie02
 * @Date: 2022-05-27 14:52:54
 * @LastEditors: wangzhijie02
 * @LastEditTime: 2022-05-27 17:52:25
 * @Description: file content
 */
import React, { useState } from 'react';
import classnames from 'classnames';
import { SvgIconProps } from '../SvgIcon';
import styles from './index.module.scss';

interface MenuItemProps {
  Icon: React.ComponentType<SvgIconProps>;
  active: boolean;
  title: string;
  onClick: () => void;
}

export const MenuItem: React.FC<MenuItemProps> = props => {
  const [isHover, setHover] = useState(false);

  const Icon = props.Icon;
  const active = isHover || props.active;
  return (
    <div
      onMouseEnter={() => {
        setHover(true);
      }}
      onMouseLeave={() => {
        setHover(false);
      }}
      onClick={props.onClick}
      className={classnames(styles.templateLibraryMenuItem, {
        [styles.active]: active,
      })}
    >
      <Icon status={active ? 'active' : 'normal'} />
      <span className={styles.miTitle}>{props.title}</span>
    </div>
  );
};
