// 实现一个类似radiobutton的组件，样式不同
import classnames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.module.scss';

interface Props {
  value?: any[]; // 值
  onChange?: (value: any) => void; // 编辑
  options: any[]; // 备选项
}
const RadioButton: React.FC<Props> = props => {
  const { value, onChange, options } = props;

  // 处理点击
  const clickHandle = (v: { id: any }) => {
    onChange && onChange(v.id);
  };

  return (
    <div className={styles.radioButton}>
      {options.map(v => (
        <div
          key={v.id}
          onClick={() => clickHandle(v)}
          className={classnames(styles.btnItem, {
            [styles.btnItemSelect]: value === v.id,
          })}
        >
          {v.name}
        </div>
      ))}
    </div>
  );
};

export default RadioButton;
