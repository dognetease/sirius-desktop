import React, { useState, useMemo, useCallback, useEffect } from 'react';
import classnames from 'classnames/bind';
import createMentionPlugin, { MentionData } from '@draft-js-plugins/mention';
import styles from './basicEditor.module.scss';
import mentions from './mentions';

const realStyle = classnames.bind(styles);

export interface EntryComponentProps {
  className?: string;
  onMouseDown(event: MouseEvent): void;
  onMouseUp(event: MouseEvent): void;
  onMouseEnter(event: MouseEvent): void;
  role: string;
  id: string;
  isFocused: boolean;
  'aria-selected'?: boolean | 'false' | 'true';
  mention: MentionData;
}

const Entry = props => {
  const { mention, isFocused, ...parentProps } = props;

  useEffect(() => {
    if (!isFocused) {
    }
  }, [isFocused]);

  return (
    <div {...parentProps} className={realStyle('mentionItem')}>
      <img src={mention.avatar} alt="" className={realStyle('avatar')} />
      <div className={realStyle('mentionInfo')}>
        <p className={realStyle('name')}>{mention.name}</p>
        <p className={realStyle('email')}>{mention.title}</p>
      </div>
    </div>
  );
};

interface MentionApi {
  scene: string;
  addPlugins(plugin: any): void;
}

export const Mention: React.FC<MentionApi> = props => {
  const { addPlugins, scene } = props;

  const [suggestions, setSuggestions] = useState(mentions);
  // 是否弹起mention窗口
  const [open, setOpen] = useState(false);

  // 文本变更了
  const onSearchChange = useCallback(({ trigger, value }: { trigger: string; value: string }) => {}, []);

  // 显示/隐藏mention
  const onOpenChange = state => {
    if (scene !== 'team') {
      return;
    }
    setOpen(state);
  };

  // 添加@
  const onAddMention = (...args) => {};

  // 返回
  const { MentionSuggestions, mentionPlugin } = useMemo(() => {
    const mentionPlugin = createMentionPlugin({
      theme: {
        mention: 'editor-mention-text',
        mentionSuggestions: 'mention-suggestions',
        mentionSuggestionsEntry: 'mention-suggestions-entry',
        mentionSuggestionsEntryFocused: 'entry-checked',
      },
      entityMutability: 'IMMUTABLE',
      mentionPrefix: '@',
      supportWhitespace: true,
    });
    // const mentionPlugin = createMentionPlugin();

    const { MentionSuggestions } = mentionPlugin;
    return { mentionPlugin, MentionSuggestions };
  }, []);

  return <MentionSuggestions suggestions={suggestions} open={open} onOpenChange={onOpenChange} onSearchChange={onSearchChange} entryComponent={Entry} />;
};
