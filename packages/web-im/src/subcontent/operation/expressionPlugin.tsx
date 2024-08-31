import React, { useState } from 'react';
import classnames from 'classnames/bind';
import { emojiList, emojiSourceMap } from '../../common/emojiList';
import style from './expressionPlugin.module.scss';

const realStyle = classnames.bind(style);

export const EmojiTag = props => {
  // eslint-disable-next-line react/prop-types
  const { offsetKey, children, decoratedText: value } = props;
  const [src] = useState<string | undefined>(() => {
    if (!emojiList.has(value) || !Reflect.has(emojiSourceMap, emojiList.get(value) as string)) {
      return undefined;
    }
    return emojiSourceMap[emojiList.get(value) as string] as string;
  });

  if (!src) {
    return <span data-offset-key={offsetKey}>{children}</span>;
  }

  return (
    <span className={realStyle('expressImg')} contentEditable={false}>
      <img src={emojiSourceMap[emojiList.get(value) as string]} alt={value} />
      <span>{value}</span>
    </span>
  );
};
