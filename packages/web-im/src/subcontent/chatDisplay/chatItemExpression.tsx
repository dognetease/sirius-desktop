import React, { useState, useContext } from 'react';
import classnames from 'classnames/bind';
import style from './chatItemTypes.module.scss';
import { expressionSourceMap } from '../../common/emojiList';

const realStyle = classnames.bind(style);

export type ExpressionParams = Record<'catalog' | 'chartlet', string> & Partial<{ imageUrl: string }>;

export const ChatItemExpression = (props: { options: ExpressionParams }) => {
  // 转成成图片URL
  const generateExpresssionUrl = (options: ExpressionParams) => {
    const { catalog, chartlet } = options;
    const key = `${catalog}/${chartlet}`;

    if (typeof options.imageUrl === 'string' && options.imageUrl.length > 0) {
      return options.imageUrl;
    }

    if (Reflect.has(expressionSourceMap, key)) {
      return (expressionSourceMap as Record<string, string>)[key];
    }
    return false;
  };

  return (
    <span className={realStyle('customExpressionWrapper')}>
      {typeof generateExpresssionUrl(props.options) === 'string' ? (
        <img src={generateExpresssionUrl(props.options) as string} alt="" className={realStyle('customExpressionImg')} />
      ) : (
        `[${props.options.chartlet}]`
      )}
    </span>
  );
};
