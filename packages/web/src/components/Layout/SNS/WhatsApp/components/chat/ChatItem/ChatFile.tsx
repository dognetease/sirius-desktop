/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useState } from 'react';
import { downloadFile } from '@web-common/components/util/file';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as ChatInnerFile } from '@/images/icons/SNS/chat-inner-file.svg';
import style from './ChatFile.module.scss';
import { AppToken } from '../../../utils';
import { getTransText } from '@/components/util/translate';
import { getExtFromMimeType } from '@/components/Layout/SNS/mimeType';

interface DownloadOptions {
  onProgresss?: (e: ProgressEvent<EventTarget>) => void;
  onSuccess?: () => void;
  onError?: (errorMessage?: string) => void;
}
const downloadFileWithToken = (url: string, fileName?: string, options?: DownloadOptions) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'blob';
  xhr.setRequestHeader('Authorization', AppToken);
  xhr.send(null);
  xhr.onload = () => {
    const contentType = xhr.getResponseHeader('Content-Type');
    const ext = getExtFromMimeType(contentType as any);
    if (ext) {
      const name = fileName || `WhatsApp 消息文件-${new Date().toLocaleString()}.${ext}`;
      options?.onSuccess && options.onSuccess();
      downloadFile(xhr.response, name);
    } else {
      options?.onError && options.onError(getTransText('WUFAXIAZAI_GAIWENJIANLEIXING'));
    }
  };
  xhr.onprogress = e => {
    // console.log('chatImage', e);
    options?.onProgresss && options.onProgresss(e);
  };
  xhr.onerror = () => options?.onError && options.onError();
};

export const ChatFile = (props: { content: Record<string, any>; style?: React.CSSProperties }) => {
  const { content, style: styleFromProps } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);

  const handleDownload = () => {
    if (isLoading) return;
    setIsLoading(true);
    downloadFileWithToken(content.mediaUrl, undefined, {
      onSuccess() {
        setProgress(0);
        setIsLoading(false);
      },
      onProgresss(e) {
        setProgress(e.loaded / e.total);
      },
      onError(errorMessage?: string) {
        setIsLoading(false);
        Toast.warning({ content: errorMessage || getTransText('WENJIANXIAZAISHIBAI') });
      },
    });
  };

  return (
    <div className={style.chatFile} style={styleFromProps}>
      <ChatInnerFile className={style.icon} />
      <div className={style.text}>{getTransText('DUIFANGGEININFASONGLEYIGEWENJIAN')}</div>
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
