/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useState } from 'react';
import SnsChatImage from '@/components/Layout/SNS/components/ChatMessage/chatImage';
import { ReactComponent as ChatInnerImage } from '@/images/icons/SNS/chat-inner-image.svg';
import { AppToken } from '../../../utils';
import { getTransText } from '@/components/util/translate';
import style from './ChatImage.module.scss';

const fetchImageAsBlobUrl = (url: string) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.setRequestHeader('Authorization', AppToken);
    xhr.send(null);
    xhr.onload = () => {
      const dataUrl = URL.createObjectURL(new Blob([xhr.response]));
      resolve(dataUrl);
    };
    xhr.onerror = reject;
  });

export const ChatImage = (props: { content: Record<string, any>; style?: React.CSSProperties }) => {
  const { content, style: styleFromProps } = props;
  const [blobUrl, setBlobUrl] = useState<string>();
  const [loading, setLoading] = useState(false);

  const fetchImage = () => {
    if (loading) return;

    setLoading(true);
    fetchImageAsBlobUrl(content.mediaUrl)
      .then(url => {
        setBlobUrl(url as string);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (blobUrl) return <SnsChatImage style={styleFromProps} src={blobUrl} />;

  return (
    <div className={style.chatImage} style={styleFromProps}>
      <ChatInnerImage className={style.icon} />
      <div className={style.text}>{getTransText('DUIFANGGEININFASONGLEYIGETUPIAN')}</div>
      <div className={style.trigger} onClick={fetchImage}>
        {getTransText('DIANJIJIAZAI')}
      </div>
      {loading && <div className={style.loading} />}
    </div>
  );
};
