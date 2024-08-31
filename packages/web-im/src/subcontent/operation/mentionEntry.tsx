import React, { useRef, useEffect } from 'react';
import styles from './basicEditor.module.scss';
import classnames from 'classnames/bind';
import { IMUser } from 'api';
import { UserAvatar } from '../../common/imUserAvatar';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(styles);
type MentionData = {
  name: string;
  link: string;
  avatar: string;
  // 是因为什么被命中的
  kind?: 'pinyin' | 'nick' | 'email';
  // 开始index 仅对kind=pinyin有效
  startIndex?: number;
} & Partial<IMUser>;
export interface DraftContent {
  plainText: string;
  rawContent: {
    blocks: any[];
    entityMap: Record<string, any>;
  };
  hasText: boolean;
}
export interface EntryComponentProps {
  className?: string;
  onMouseDown(event: MouseEvent): void;
  onMouseUp(event: MouseEvent): void;
  onMouseEnter(event: MouseEvent): void;
  role: string;
  id: string;
  'aria-selected'?: boolean | 'false' | 'true';
  mention: MentionData;
  isFocused: boolean;
  searchValue?: string;
}
export const Entry = props => {
  const { mention, isFocused, searchValue, theme, id, ...restProps } = props;
  const entryRef = useRef(null);
  const scrollToVisible = async () => {
    const curNode = entryRef.current as unknown as HTMLElement;
    if ('scrollIntoViewIfNeeded' in document.body) {
      // @ts-ignore
      curNode.scrollIntoViewIfNeeded(false);
    } else {
      curNode.scrollIntoView(false);
    }
  };
  useEffect(() => {
    if (!isFocused) {
      return;
    }
    scrollToVisible();
  }, [isFocused]);
  if (mention.account === 'all') {
    return (
      <div id={id} ref={entryRef} {...restProps} className={realStyle('mentionItem', 'all')}>
        <span className={realStyle('allIcon')}>@</span>
        <div className={realStyle('mentionInfo')}>
          <p className={realStyle('name')}>{getIn18Text('SUOYOUREN')}</p>
        </div>
      </div>
    );
  }
  return (
    <div {...restProps} ref={entryRef} className={realStyle('mentionItem')}>
      <UserAvatar user={mention}></UserAvatar>
      <div className={realStyle('mentionInfo')}>
        <p className={realStyle('name')}>{mention.nick}</p>
        <p
          dangerouslySetInnerHTML={{
            __html: mention.email,
          }}
          className={realStyle('email')}
        ></p>
      </div>
    </div>
  );
};
