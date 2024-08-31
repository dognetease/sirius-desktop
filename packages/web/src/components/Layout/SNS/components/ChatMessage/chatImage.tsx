import React from 'react';
import classnames from 'classnames';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import style from './chatImage.module.scss';

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

interface ChatImageProps {
  className?: string;
  style?: React.CSSProperties;
  src: string;
}

const ChatImage: React.FC<ChatImageProps> = props => {
  const { className, style: styleFromProps, src } = props;

  return (
    <div className={classnames(style.chatImage, className)} style={styleFromProps}>
      <img src={src} onClick={() => handleImagePreview(src)} />
    </div>
  );
};

export default ChatImage;
