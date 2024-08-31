import React, { useState, useRef, useContext } from 'react';
import classnames from 'classnames';
import { Button } from 'antd';
import Editor from '@draft-js-plugins/editor';
// @ts-ignore
import { EditorState, ContentState, SyntheticKeyboardEvent, DraftHandleValue } from 'draft-js';
import { whatsAppTracker } from '@/components/Layout/SNS/tracker';
import { ReactComponent as ChatFileIcon } from '@/images/icons/SNS/chat-file.svg';
import { ReactComponent as ChatImageIcon } from '@/images/icons/SNS/chat-image.svg';
import { ChatContext } from '@/components/Layout/SNS/context';
import { getTransText } from '@/components/util/translate';
import style from './index.module.scss';
import { getIn18Text } from 'api';

interface ChatEditorProps {
  className?: string;
  style?: React.CSSProperties;
  placeholder: string;
  disabled: boolean;
  onSend: (text: string) => void;
  onSendFile: (file: File) => void;
}

const ChatEditor: React.FC<ChatEditorProps> = props => {
  const { className, style: styleFromProps, placeholder, disabled, onSend, onSendFile } = props;

  const { onlySendImage, sendTextMaxLength } = useContext(ChatContext);

  const UploadFileIcon = onlySendImage ? ChatImageIcon : ChatFileIcon;

  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());

  const editorRef = useRef<Editor>(null);

  const plainText = editorState.getCurrentContent().getPlainText();

  const fileRef = useRef<HTMLInputElement>(null);

  const [exceededVisible, setExceededVisible] = useState(false);

  const handleChange = (nextEditorState: EditorState) => {
    const nextPlainText = nextEditorState.getCurrentContent().getPlainText();

    if (nextPlainText.length > sendTextMaxLength) {
      setExceededVisible(true);

      nextEditorState = EditorState.push(editorState, ContentState.createFromText(plainText));
      nextEditorState = EditorState.moveFocusToEnd(nextEditorState);
    } else {
      setExceededVisible(false);
    }

    setEditorState(nextEditorState);
  };

  const handleUpload = () => {
    if (disabled) return;

    fileRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];

    onSendFile(file);

    event.target.value = '';
    event.target.files = null;
  };

  const handleSend = () => {
    if (!plainText.length) return;

    let nextEditorState = EditorState.push(editorState, ContentState.createFromText(''));
    nextEditorState = EditorState.moveFocusToEnd(nextEditorState);
    nextEditorState = EditorState.forceSelection(nextEditorState, nextEditorState.getSelection());

    setEditorState(nextEditorState);
    onSend(plainText);

    whatsAppTracker.trackMessage('answer');
  };

  const LingxiKeyBindingFn = (event: SyntheticKeyboardEvent) => {
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
        break;
    }
    return 'not-handled';
  };

  return (
    <div className={classnames(style.chatEditor, className)} style={styleFromProps}>
      <Editor
        ref={editorRef}
        autoFocus
        readOnly={disabled}
        editorState={editorState}
        onChange={handleChange}
        placeholder={placeholder}
        keyBindingFn={LingxiKeyBindingFn}
        handleKeyCommand={handleKeyCommand}
      />
      <div className={style.operations}>
        <UploadFileIcon
          className={classnames(style.operation, {
            [style.disabled]: disabled,
          })}
          onClick={handleUpload}
        />
        <input className={style.fileInput} ref={fileRef} hidden type="file" onChange={handleFileChange} />
        {exceededVisible && (
          <div className={style.exceededTip}>
            {getTransText('chaoguowufajixushuru-1')}
            {sendTextMaxLength}
            {getTransText('chaoguowufajixushuru-2')}
          </div>
        )}
        <Button className={style.send} type="primary" disabled={disabled || !plainText.length} onClick={handleSend}>
          {getIn18Text('FASONG')}
        </Button>
      </div>
    </div>
  );
};

export default ChatEditor;
