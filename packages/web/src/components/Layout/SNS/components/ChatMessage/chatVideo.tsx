import React from 'react';
import classnames from 'classnames';
import style from './chatVideo.module.scss';

interface ChatVideoProps {
  className?: string;
  style?: React.CSSProperties;
  src: string;
}

const ChatVideo: React.FC<ChatVideoProps> = props => {
  const { className, style: styleFromProps, src } = props;

  return (
    <div className={classnames(style.chatVideo, className)} style={styleFromProps}>
      <video src={src} controls />
    </div>
  );
};

export default ChatVideo;
