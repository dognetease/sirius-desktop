import React, { useMemo, useContext } from 'react';
import classnames from 'classnames';
import { SnsMessageDirection } from '@/components/Layout/SNS/types';
import { ChatContext } from '@/components/Layout/SNS/context';
import style from './chatText.module.scss';

interface ChatTextProps {
  className?: string;
  style?: React.CSSProperties;
  text: React.ReactChild;
  direction: SnsMessageDirection;
}

const ChatText: React.FC<ChatTextProps> = props => {
  const { className, style: styleFromProps, text, direction } = props;

  const { receiveMessageColor, sendMessageColor } = useContext(ChatContext);

  const backgroundColor = useMemo(() => {
    if (direction === SnsMessageDirection.RECEIVE) {
      return receiveMessageColor;
    }

    if (direction === SnsMessageDirection.SEND) {
      return sendMessageColor;
    }

    return undefined;
  }, [direction]);

  return (
    <div
      className={classnames(style.chatText, className, {
        [style.receive]: direction === SnsMessageDirection.RECEIVE,
        [style.send]: direction === SnsMessageDirection.SEND,
      })}
      style={{ ...styleFromProps, backgroundColor }}
    >
      {text}
    </div>
  );
};

export default ChatText;
