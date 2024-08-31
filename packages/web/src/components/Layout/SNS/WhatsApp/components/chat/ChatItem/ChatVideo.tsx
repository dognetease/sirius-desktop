/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useState } from 'react';
import { api, FileApi } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import SnsChatVideo from '@/components/Layout/SNS/components/ChatMessage/chatVideo';
import { ReactComponent as ChatInnerVideo } from '@/images/icons/SNS/chat-inner-video.svg';
import style from './ChatVideo.module.scss';
import { AppToken } from '../../../utils';
import { getTransText } from '@/components/util/translate';

const fileApi = api.getFileApi() as FileApi;

interface DownloadOptions {
  onProgresss?: (e: ProgressEvent<EventTarget>) => void;
  onSuccess?: (blobUrl: string) => void;
  onError?: (errorMessage?: string) => void;
}
const downloadFileWithToken = (url: string, fileName?: string, options?: DownloadOptions) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'blob';
  xhr.setRequestHeader('Authorization', AppToken);
  xhr.send(null);
  xhr.onload = () => {
    const blobUrl = URL.createObjectURL(new Blob([xhr.response]));
    options?.onSuccess && options.onSuccess(blobUrl);
  };
  xhr.onprogress = e => {
    // console.log('chatImage', e);
    options?.onProgresss && options.onProgresss(e);
  };
  xhr.onerror = () => options?.onError && options.onError();
};

export const ChatVideo = (props: { content: Record<string, any>; style?: React.CSSProperties }) => {
  const { content, style: styleFromProps } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const handleDownload = () => {
    if (isLoading) return;
    setIsLoading(true);
    downloadFileWithToken(content.mediaUrl, undefined, {
      onSuccess(nextUrl) {
        setProgress(0);
        setIsLoading(false);
        setBlobUrl(nextUrl);
      },
      onProgresss(e) {
        setProgress(e.loaded / e.total);
      },
      onError(errorMessage?: string) {
        setIsLoading(false);
        Toast.warning({ content: errorMessage || getTransText('SHIPINXIAZAISHIBAI') });
      },
    });
  };

  if (blobUrl) {
    return <SnsChatVideo style={styleFromProps} src={blobUrl} />;
  }

  return (
    <div className={style.chatVideo} style={styleFromProps}>
      <ChatInnerVideo className={style.icon} />
      <div className={style.text}>{getTransText('DUIFANGGEININFASONGLEYIGESHIPIN')}</div>
      <div className={style.trigger} onClick={handleDownload}>
        {getTransText('DIANJIJIAZAI')}
      </div>
      {isLoading && <div className={style.loading} />}
      {isLoading && (
        <div className={style.progress}>
          <div className={style.progressInner} style={{ width: progress * 100 + '%' }} />
        </div>
      )}
    </div>
  );
};
