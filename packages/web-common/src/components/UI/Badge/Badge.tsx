// 已弃用
import React from 'react';
import classnames from 'classnames/bind';
import style from './Badge.module.scss';
const realStyle = classnames.bind(style);

export const LingxiBadge: React.FC<{
  content: string;
  type: 'text' | 'number' | 'dots';
  size?: 'normal' | 'small' | 'large';
  wrapperTagType?: 'div' | 'span';
  // todo:使用场景-主要定义红点在父元素内的位置。业务同学自己选择(不满足需求通过customClass定义)
  applyscene?: '';
  customClass?: string;
  // 免打扰模式
  notDisturbMode?: false;
  onClick?: () => void;
}> = props => {
  const { content, size = 'normal', type, wrapperTagType = 'span', customClass = '', onClick = () => {}, notDisturbMode = false } = props;
  return React.createElement(
    wrapperTagType,
    {
      className: realStyle(
        'lingxiBadge',
        {
          typeText: type === 'text',
          typeNumber: type === 'number',
          typeDots: type === 'dots',
        },
        {
          notDisturbMode,
        },
        {
          smallSize: size === 'small',
          largeSize: size === 'large',
        },
        customClass
      ),
      onClick,
    },
    content
  );
};
