import React from 'react';
import classnames from 'classnames';
import { SnsImMessage, SnsImMessageType, SnsImMessageDirection } from '../types';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import { ChatFile } from './ChatFile';
import style from './MessageRenderer.module.scss';

const handleImagePreview = (src: string) => {
  const previewData = [
    {
      downloadUrl: src,
      previewUrl: src,
      OriginUrl: src,
      size: 480,
      name: `${src}-${Date.now()}`,
    },
  ];

  ImgPreview.preview({ data: previewData, startIndex: 0 });
};

interface MessageRendererProps {
  className?: string;
  style?: React.CSSProperties;
  message: SnsImMessage;
}

export const MessageRenderer: React.FC<MessageRendererProps> = props => {
  const { className, style: styleFromProps, message } = props;

  const { messageType, messageText, messageFile, messageDirection, messageJsx } = message;

  if (messageType === SnsImMessageType.TEXT) {
    return (
      <div
        className={classnames(style.messageRenderer, style.text, className, {
          [style.receive]: messageDirection === SnsImMessageDirection.RECEIVE,
          [style.send]: messageDirection === SnsImMessageDirection.SEND,
        })}
        style={styleFromProps}
      >
        {messageText}
      </div>
    );
  }

  if (messageType === SnsImMessageType.IMAGE) {
    return (
      <div className={classnames(style.messageRenderer, style.imageWrapper, className)} style={styleFromProps}>
        <img
          className={style.image}
          src={messageFile?.src}
          onClick={() => {
            if (messageFile?.src) {
              handleImagePreview(messageFile?.src);
            }
          }}
        />
      </div>
    );
  }

  if (messageType === SnsImMessageType.VIDEO) {
    return (
      <div className={classnames(style.messageRenderer, style.videoWrapper, className)} style={styleFromProps}>
        <video className={style.video} src={messageFile?.src} controls />
      </div>
    );
  }

  if (messageType === SnsImMessageType.AUDIO) {
    return <audio className={classnames(style.messageRenderer, style.audio, className)} style={styleFromProps} src={messageFile?.src} controls />;
  }

  if (messageType === SnsImMessageType.FILE) {
    return messageFile ? (
      <ChatFile className={classnames(style.messageRenderer, style.file, className)} style={styleFromProps} messageFile={messageFile} downloadable />
    ) : null;
  }

  if (messageType === SnsImMessageType.JSX) {
    return (
      <div className={classnames(style.messageRenderer, style.jsx, className)} style={styleFromProps}>
        {messageJsx}
      </div>
    );
  }

  return null;
};
