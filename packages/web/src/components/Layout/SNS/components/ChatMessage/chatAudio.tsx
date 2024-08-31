import React from 'react';
import classnames from 'classnames';
import style from './chatAudio.module.scss';

interface ChatAudioProps {
  className?: string;
  style?: React.CSSProperties;
  src: string;
}

const ChatAudio: React.FC<ChatAudioProps> = props => {
  const { className, style: styleFromProps, src } = props;

  return (
    <div className={classnames(style.chatAudio, className)} style={styleFromProps}>
      <audio src={src} controls />
    </div>
  );
};

export default ChatAudio;
