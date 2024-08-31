import React, { useState, useEffect, useRef, useContext } from 'react';
import classnames from 'classnames';
import { apis, apiHolder, WhatsAppApi, WhatsAppMessage } from 'api';
import { Button } from 'antd';
import { WhatsAppContact } from 'api';
import Editor from '@draft-js-plugins/editor';
import MessageContext from '../../context/messageContext';
import Notice from '../notice/notice';
// @ts-ignore
import { EditorState, ContentState, SyntheticKeyboardEvent, DraftHandleValue } from 'draft-js';
import { whatsAppTracker } from '@/components/Layout/SNS/tracker';
import style from './chatEditor.module.scss';
import { getIn18Text } from 'api';
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
interface ChatEditorProps {
  className?: string;
  contact: WhatsAppContact;
}
const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const ONE_MINUTE = 60 * 1000;
const ONE_SECOND = 1000;
const getRemainText = (remainTime: number) => {
  const remainHour = Math.floor(remainTime / ONE_HOUR);
  const remainMinute = Math.floor((remainTime - remainHour * ONE_HOUR) / ONE_MINUTE);
  const remainSecond = Math.floor((remainTime - remainHour * ONE_HOUR - remainMinute * ONE_MINUTE) / ONE_SECOND);
  return `离24H沟通时效还剩 ${remainHour.toString().padStart(2, '0')}h:${remainMinute.toString().padStart(2, '0')}m:${remainSecond
    .toString()
    .padStart(2, '0')}s 您可发送任意信息触达客户`;
};
const ChatEditor: React.FC<ChatEditorProps> = props => {
  const { className, contact } = props;
  const { pullMessageByWhatsApp, getLastReceivedMessage } = useContext(MessageContext);
  const contactName = contact.contactName || contact.contactWhatsApp;
  const contactWhatsApp = contact.contactWhatsApp;
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
  const plainText = editorState.getCurrentContent().getPlainText().trim();
  const editorRef = useRef<Editor>(null);
  const [available, setAvailable] = useState<boolean>(true);
  const [remainText, setRemainText] = useState<string>('');
  const [unavailableReason, setUnavailableReason] = useState<string>('');
  const [lastReceivedMessage, setLastReceivedMessage] = useState<WhatsAppMessage | null>(null);
  const availableValidator = () =>
    new Promise<number>((resolve, reject) => {
      getLastReceivedMessage(contactWhatsApp).then(message => {
        if (message) {
          setLastReceivedMessage(message);
          const remainTime = message.sentAt + ONE_DAY - Date.now();
          if (remainTime > 0) {
            resolve(remainTime);
          } else {
            reject(getIn18Text('CHAOCHU24HGOUTONGSHIXIAO'));
          }
        } else {
          reject(getIn18Text('DUIFANGHUIFUHOUCAIKEYIFASONGXIAOXI'));
        }
      });
    });
  useEffect(() => {
    const handleAvailableValidator = () => {
      availableValidator()
        .then(remainTime => {
          setAvailable(true);
          setRemainText(getRemainText(remainTime));
          setUnavailableReason('');
        })
        .catch((nextUnavailableReason: string) => {
          setAvailable(false);
          setUnavailableReason(nextUnavailableReason);
        });
    };
    handleAvailableValidator();
    const timer = setInterval(() => {
      handleAvailableValidator();
    }, 1000);
    return () => timer && clearInterval(timer);
  }, []);
  const handleChange = (nextEditorState: EditorState) => {
    setEditorState(nextEditorState);
  };
  const handleSend = () => {
    if (!available) return;
    if (!plainText.length) return;
    if (!lastReceivedMessage) return;
    const sender = lastReceivedMessage.to;
    const nextEditorState = EditorState.push(editorState, ContentState.createFromText(''));
    setEditorState(nextEditorState);
    whatsAppApi
      .sendMessage({
        from: sender,
        to: contactWhatsApp,
        messageType: 'TEXT',
        content: {
          text: plainText,
        },
      })
      .then(() => {
        pullMessageByWhatsApp(contactWhatsApp);
      });
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
    <div className={classnames(style.chatEditor, className)}>
      {available ? (
        <Notice className={style.chatEditorTip} type="warning">
          {remainText}
        </Notice>
      ) : (
        <Notice className={style.chatEditorTip} type="warning" showIcon={false}>
          {unavailableReason}
        </Notice>
      )}
      <Editor
        ref={editorRef}
        autoFocus
        readOnly={!available}
        editorState={editorState}
        onChange={handleChange}
        placeholder={`发送给 ${contactName}`}
        keyBindingFn={LingxiKeyBindingFn}
        handleKeyCommand={handleKeyCommand}
      />
      <div className={style.operations}>
        {false && <span className={style.operation}>{getIn18Text('BIAOQING')}</span>}
        {false && <span className={style.operation}>{getIn18Text('WENJIAN')}</span>}
        <Button className={style.send} type="primary" disabled={!available || !plainText.length} onClick={handleSend}>
          {getIn18Text('FASONG')}
        </Button>
      </div>
    </div>
  );
};
export default ChatEditor;
