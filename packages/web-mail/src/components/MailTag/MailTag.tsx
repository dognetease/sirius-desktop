import React, { useState, useRef, useEffect } from 'react';
import './MailTag.scss';

interface Props {
  more?: boolean;
  color?: string;
  closeable?: boolean;
  limit?: boolean;
  onClose?(): void;
  className?: string;
  style?: object;
}

const MailTag: React.FC<Props> = props => {
  const {
    // 是否是显示更多按钮
    more,
    color,
    closeable = false,
    limit = false,
    onClose,
    className,
    style = {},
  } = props;

  return (
    <div className={`com-mail-tag ${className} ${more ? 'com-mail-tag-more' : ''} `} style={{ ...style, backgroundColor: color }} data-test-id="mail-tag-item">
      <span className={`content ${limit ? 'com-mail-tag-limit' : ''} `}>{props.children}</span>
      {closeable ? (
        <div
          className="tag-extra"
          onClick={() => {
            onClose && onClose();
          }}
          style={{ backgroundColor: color }}
          data-test-id="mail-tag-item-close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.25 7.75L5 5M5 5L2.25 2.25M5 5L7.75 7.75M5 5L7.75 2.25" stroke="#6F7485" strokeLinejoin="round" />
          </svg>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default MailTag;
