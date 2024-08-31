import React from 'react';
import classnames from 'classnames/bind';
import lodashGet from 'lodash/get';
import style from './chatItemAltFooter.module.scss';

const realStyle = classnames.bind(style);

// 纯文本展示
interface TextControlProps {
  text: string;
}
export const TextControl: React.FC<TextControlProps> = props => {
  const { text } = props;
  return (
    <span
      className={realStyle('text')}
      dangerouslySetInnerHTML={{
        __html: lodashGet(text, 'length', 0) ? text.replace(/\r|\n/g, '<br/>') : '',
      }}
    />
  );
};
