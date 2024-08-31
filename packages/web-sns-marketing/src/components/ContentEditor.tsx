import { getIn18Text } from 'api';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import { POST_RULE } from '../utils/rules';
import { EditorState, ContentState, Modifier } from 'draft-js';
import Editor from '@draft-js-plugins/editor';
import createLinkifyPlugin from '@draft-js-plugins/linkify';
import createHashtagPlugin from '@draft-js-plugins/hashtag';
// @ts-ignore
import emojiData from '@emoji-mart/data';
// @ts-ignore
import EmojiPicker from '@emoji-mart/react';
import OutsideClickHandler from 'react-outside-click-handler';
import { ReactComponent as EmojiTrigger } from '@web-sns-marketing/images/emoji-trigger.svg';
import { ReactComponent as AiTipIcon } from '@web-sns-marketing/images/ai-tip.svg';
import { ReactComponent as AiRefineIcon } from '@web-sns-marketing/images/ai-refine.svg';
import style from './ContentEditor.module.scss';

const linkifyPlugin = createLinkifyPlugin({ target: '_blank' });
const hashtagPlugin = createHashtagPlugin({ theme: { hashtag: style.hashtag } });

interface ContentEditorProps {
  className?: string;
  content?: string;
  disabled?: boolean;
  placeholder?: string;
  aiReplaceable?: boolean;
  aiRefinable?: boolean;
  onChange?: (content: string) => void;
  onAiReplaceClick?: (content: string) => void;
  onAiRefineClick?: (content: string) => void;
}

const ContentEditor: React.FC<ContentEditorProps> = props => {
  const { className, content, disabled, placeholder = '请输入帖子内容', aiReplaceable, aiRefinable, onChange, onAiReplaceClick, onAiRefineClick } = props;
  const [editorState, setEditorState] = useState<EditorState>(() => EditorState.createWithContent(ContentState.createFromText(content || '')));
  const [emojiVisible, setEmojiVisible] = useState(false);
  const editorRef = useRef<Editor>(null);
  const contentState = editorState.getCurrentContent();
  const plainText = contentState.getPlainText();
  const remainLength = POST_RULE.textMaxLength - plainText.length;

  const handleEditorChange = (nextEditorState: EditorState) => {
    const nextContentState = nextEditorState.getCurrentContent();
    const nextPlainText = nextContentState.getPlainText();

    setEditorState(nextEditorState);

    if (nextPlainText !== content && onChange) {
      onChange(nextPlainText);
    }
  };

  useEffect(() => {
    const editorState = editorRef.current?.getEditorState();

    if (editorState) {
      const contentState = editorState.getCurrentContent();
      const plainText = contentState.getPlainText();

      if (content !== plainText) {
        setEditorState(EditorState.createWithContent(ContentState.createFromText(content || '')));
      }
    }
  }, [content]);

  return (
    <div
      className={classnames(style.contentEditor, className, {
        [style.disabled]: disabled,
      })}
    >
      <div className={style.editor}>
        <Editor
          ref={editorRef}
          readOnly={disabled}
          plugins={[linkifyPlugin, hashtagPlugin]}
          placeholder={placeholder}
          editorState={editorState}
          onChange={handleEditorChange}
        />
      </div>
      <div className={style.footer}>
        <div
          className={classnames(style.remainLength, {
            [style.remainLengthError]: remainLength < 0,
          })}
        >
          {remainLength}
        </div>
        {aiReplaceable && (
          <>
            <div
              className={classnames(style.aiReplace, {
                [style.disabled]: disabled || remainLength < 0,
              })}
              onClick={() => {
                if (!disabled && remainLength >= 0 && onAiReplaceClick) {
                  onAiReplaceClick(plainText);
                }
              }}
            >
              <AiTipIcon className={style.replaceIcon} />
              <span className={style.replaceText}>{getIn18Text('HUANYIHUAN')}</span>
            </div>
            <div className={style.separator} />
          </>
        )}
        {aiRefinable && (
          <>
            <div
              className={classnames(style.aiRefine, {
                [style.disabled]: disabled || !plainText.length || remainLength < 0,
              })}
              onClick={() => {
                if (!disabled && plainText.length && remainLength >= 0 && onAiRefineClick) {
                  onAiRefineClick(plainText);
                }
              }}
            >
              <AiRefineIcon className={style.refineIcon} />
              <span className={style.refineText}>{getIn18Text('AIRETOUCH')}</span>
            </div>
            <div className={style.separator} />
          </>
        )}
        <div className={style.emojiWrapper}>
          <OutsideClickHandler onOutsideClick={() => setEmojiVisible(false)}>
            <EmojiTrigger className={style.emojiTrigger} onClick={() => !disabled && setEmojiVisible(!emojiVisible)} />
            {emojiVisible && (
              <div className={style.emojiPopper}>
                <EmojiPicker
                  data={emojiData}
                  theme="light"
                  locale="zh"
                  searchPosition="none"
                  previewPosition="none"
                  onEmojiSelect={(emoji: { native: string }) => {
                    const selectionState = editorState.getSelection();
                    const anchorOffset = selectionState.getAnchorOffset();
                    const focusOffset = selectionState.getFocusOffset();

                    const newContentState =
                      anchorOffset === focusOffset
                        ? Modifier.insertText(contentState, selectionState, emoji.native)
                        : Modifier.replaceText(contentState, selectionState, emoji.native);
                    const nextEditorState = EditorState.push(editorState, newContentState, 'insert-characters');

                    handleEditorChange(nextEditorState);
                    setEmojiVisible(false);
                    editorRef.current?.focus();
                  }}
                />
              </div>
            )}
          </OutsideClickHandler>
        </div>
      </div>
    </div>
  );
};

export default ContentEditor;
