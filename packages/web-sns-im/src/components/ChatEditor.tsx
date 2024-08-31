import { getIn18Text } from 'api';
import * as React from 'react';
import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Button } from 'antd';
import classnames from 'classnames';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import { SnsImRules, SnsImMessageType, SnsImMessageFile } from '../types';
// @ts-ignore
import { EditorState, ContentState, Modifier, SyntheticKeyboardEvent, DraftHandleValue } from 'draft-js';
import Editor from '@draft-js-plugins/editor';
// @ts-ignore
import emojiData from '@emoji-mart/data';
// @ts-ignore
import EmojiPicker from '@emoji-mart/react';
import OutsideClickHandler from 'react-outside-click-handler';
import { ReactComponent as EmojiTrigger } from '../icons/emoji-trigger.svg';
import { ReactComponent as ImageIcon } from '../icons/image.svg';
import { ReactComponent as VideoIcon } from '../icons/video.svg';
import { ReactComponent as FileIcon } from '../icons/file.svg';
import { extractFileToMessage } from '../utils';
import { formatFileSize } from '@web-common/utils/file';
import { FilePreview } from './FilePreview';
import style from './ChatEditor.module.scss';

interface ChatEditorProps {
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  rules: SnsImRules;
  placeholder?: string;
  timeExceeded?: boolean;
  onFileSend: (file: File) => void;
  onTextSend: (text: string) => void;
}

export interface ChatEditorMethods {
  focus: () => void;
}

export const ChatEditor = forwardRef((props: ChatEditorProps, ref) => {
  const { className, style: styleFromProps, rules, disabled, placeholder, timeExceeded, onFileSend, onTextSend } = props;
  const [editorState, setEditorState] = useState<EditorState>(() => EditorState.createEmpty());
  const [emojiVisible, setEmojiVisible] = useState(false);
  const editorRef = useRef<Editor>(null);
  const contentState = editorState.getCurrentContent();
  const plainText = contentState.getPlainText().trim();
  const uploadRef = useRef<HTMLInputElement>(null);
  const [uploadAccept, setUploadAccept] = useState<string | undefined>(undefined);
  const [file, setFile] = useState<File | null>(null);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<{
    messageType: SnsImMessageType;
    messageFile: SnsImMessageFile;
  } | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => editorRef.current?.focus(),
  }));

  const handleEditorChange = (nextEditorState: EditorState) => {
    setEditorState(nextEditorState);
  };

  const handleSend = () => {
    if (!plainText.length) return;

    let nextEditorState = EditorState.push(editorState, ContentState.createFromText(''), 'change-block-data');

    nextEditorState = EditorState.moveFocusToEnd(nextEditorState);
    nextEditorState = EditorState.forceSelection(nextEditorState, nextEditorState.getSelection());

    setEditorState(nextEditorState);
    onTextSend(plainText);
    // editorRef.current?.focus();
  };

  const KeyBindingFn = (event: SyntheticKeyboardEvent) => {
    if (event.keyCode === 13) {
      const isNotEnter = ['metaKey', 'shiftKey', 'ctrlKey', 'altKey'].some(keyName => event.nativeEvent[keyName]);

      if (!isNotEnter) return 'sendMsg';
    }

    return undefined;
  };

  const handleKeyCommand = (command: string): DraftHandleValue => {
    switch (command) {
      case 'sendMsg':
        handleSend();
        return 'handled';
      default:
        return 'not-handled';
    }
  };

  const handleInputClear = () => {
    if (uploadRef.current) {
      uploadRef.current.value = '';
      uploadRef.current.files = null;
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = (event.target.files || [])[0];

    if (file) {
      extractFileToMessage(file, rules).then(res => {
        if (res.messageType === SnsImMessageType.IMAGE) {
          if (file.size > rules.imageMaxSize) {
            const maxSizeText = formatFileSize(rules.imageMaxSize, 1024);
            return Message.error(`请上传小于 ${maxSizeText} 的图片`);
          } else {
            setFile(file);
            setPreviewData(res);
            setPreviewVisible(true);
          }
        }
        if (res.messageType === SnsImMessageType.VIDEO) {
          if (file.size > rules.videoMaxSize) {
            const maxSizeText = formatFileSize(rules.videoMaxSize, 1024);
            return Message.error(`请上传小于 ${maxSizeText} 的视频`);
          } else {
            setFile(file);
            setPreviewData(res);
            setPreviewVisible(true);
          }
        }
        if (res.messageType === SnsImMessageType.FILE) {
          if (file.size > rules.fileMaxSize) {
            const maxSizeText = formatFileSize(rules.fileMaxSize, 1024);
            return Message.error(`请上传小于 ${maxSizeText} 的文件`);
          } else {
            setFile(file);
            setPreviewData(res);
            setPreviewVisible(true);
          }
        }
      });
    }
  };

  const handlePreviewCancel = () => {
    setFile(null);
    setPreviewVisible(false);
    setPreviewData(null);
    handleInputClear();
  };

  const handlePreviewSend = () => {
    onFileSend(file!);
    handlePreviewCancel();
    editorRef.current?.focus();
  };

  const textExceeded = plainText.length > rules.textMaxLength;

  return (
    <div
      className={classnames(style.chatEditor, className, {
        [style.disabled]: disabled,
      })}
      style={styleFromProps}
    >
      <div className={style.editor}>
        <Editor
          ref={editorRef}
          readOnly={disabled}
          placeholder={timeExceeded ? getIn18Text('DUIHUAYIGUOQI，WU') : placeholder}
          editorState={editorState}
          onChange={handleEditorChange}
          keyBindingFn={KeyBindingFn}
          handleKeyCommand={handleKeyCommand}
        />
      </div>
      <div className={style.footer}>
        <div className={style.options}>
          <div className={classnames(style.emojiWrapper, style.option)}>
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
          {rules.imageSupport && (
            <ImageIcon
              className={style.option}
              onClick={() => {
                if (disabled) return;

                setUploadAccept((rules.imageTypes || []).map(type => `.${type}`).join());
                setTimeout(() => uploadRef.current?.click());
              }}
            />
          )}
          {rules.videoSupport && (
            <VideoIcon
              className={style.option}
              onClick={() => {
                if (disabled) return;

                setUploadAccept((rules.videoTypes || []).map(type => `.${type}`).join());
                setTimeout(() => uploadRef.current?.click());
              }}
            />
          )}
          {rules.fileSupport && (
            <FileIcon
              className={style.option}
              onClick={() => {
                if (disabled) return;

                setUploadAccept(rules.fileTypes === true ? undefined : (rules.fileTypes || []).map(type => `.${type}`).join());
                setTimeout(() => uploadRef.current?.click());
              }}
            />
          )}
        </div>
        {textExceeded && (
          <div className={style.textExceededTip}>
            {getIn18Text('CHAOCHU')}
            {rules.textMaxLength}
            {getIn18Text('ZISHUXIANZHI，WUFA')}
          </div>
        )}
        <Button className={style.send} type="primary" disabled={disabled || !plainText.length || textExceeded} onClick={handleSend}>
          {getIn18Text('FASONG')}
        </Button>
      </div>
      <input ref={uploadRef} hidden multiple={false} type="file" accept={uploadAccept} onChange={handleInputChange} />
      <FilePreview visible={previewVisible} previewData={previewData} onCancel={handlePreviewCancel} onSend={handlePreviewSend} />
    </div>
  );
});
