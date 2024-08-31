import React, { useState, useEffect } from 'react';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import { Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import type { RcFile } from 'antd/es/upload/interface';
import { TongyongTianjia, TongyongShanchu } from '@sirius/icons';
import { ReactComponent as AiIcon } from '@/images/icons/marketBulk/aiLetter.svg';
import AISessionAssistant from './aISessionAssistant';
import style from './messageContent.module.scss';
import { track } from '../../tracker';

export interface Item {
  text?: string;
  url?: string;
  type?: 'IMAGE' | 'VIDEO';
  mimetype?: string;
  file?: RcFile;
}
interface Props {
  value?: Item;
  onChange?: (data: Item) => void;
  onShow: (data: Item) => void;
}

const MessageContent: React.FC<Props> = ({ value, onChange, onShow }) => {
  const [fileList, setFileList] = useState<RcFile[]>([]);
  const [mediaUrl, setMediaUrl] = useState<string>();
  const [mediaType, setMediaType] = useState<string>();
  const [showAi, setShowAi] = useState<boolean>(false);

  const propsConfig: UploadProps = {
    showUploadList: false,
    listType: 'picture-card',
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: file => {
      let canUpload = true;
      const fileSize = file.size / 1024 / 1024;
      if (!file.type.includes('image') && !file.type.includes('video')) {
        message.error('只能上传图片和视频');
        canUpload = false;
      }
      // 图片5M 视频 10M
      if (file.type.includes('image') && fileSize > 5) {
        message.error('上传文件必须小于 5M');
        canUpload = false;
      }
      if (file.type.includes('video') && fileSize > 10) {
        message.error('上传文件必须小于 10M');
        canUpload = false;
      }
      if (canUpload) {
        setMediaType(file.type);
        // 上传资源
      }
      if (file.type.includes('image')) {
        track.waBlulkTrack('Picture');
      }
      if (file.type.includes('video')) {
        track.waBlulkTrack('video_upload');
      }
      setFileList([file]);
      return false;
    },
    fileList,
  };

  const getBase64 = (file: RcFile): Promise<string> =>
    new Promise(resolve => {
      // const reader = new FileReader();
      // reader.addEventListener('load', () => resolve(reader.result as string));
      // reader.readAsDataURL(file);
      const videoURL = window.URL.createObjectURL(file);
      resolve(videoURL);
    });

  useEffect(() => {
    if (fileList.length && mediaType) {
      getBase64(fileList[0]).then(url => {
        const newValue = {
          ...value,
          url,
          mimetype: mediaType,
          type: mediaType?.indexOf('image') > -1 ? 'IMAGE' : ('VIDEO' as Item['type']),
          file: fileList[0],
        };
        setMediaUrl(url);
        onChange && onChange(newValue);
        onShow && onShow(newValue);
      });
    }
  }, [fileList, mediaType]);

  return (
    <div className={style.message}>
      <div className={style.messageTitle}>
        <AiIcon />
        <span
          onClick={() => {
            setShowAi(true);
            track.waBlulkTrack('AI_conversational_assistant');
          }}
        >
          AI会话助手
        </span>
      </div>
      <div className={style.messageInput}>
        <Input.TextArea
          onChange={e => {
            const newValue = {
              ...value,
              text: e.target.value,
            };
            onChange && onChange(newValue);
            onShow && onShow(newValue);
          }}
          value={value?.text}
          maxLength={1000}
          placeholder="请输入发送内容，最多1000字"
          style={{ width: 600, height: 200, overflow: 'auto' }}
        />
      </div>
      <div className={style.uploadBox}>
        {mediaUrl ? (
          <div className={style.mediaContent}>
            {mediaType && mediaType?.indexOf('image') > -1 ? (
              <img alt="发送图片" src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <video src={mediaUrl} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} controlsList="nodownload" />
            )}
            <div className={style.mediaContentShow}>
              <TongyongShanchu
                style={{ color: '#fff' }}
                onClick={() => {
                  setMediaUrl('');
                  setMediaType('');
                  const newValue = {
                    ...value,
                    url: '',
                    mimetype: '',
                    type: undefined,
                    file: undefined,
                  };
                  onChange && onChange(newValue);
                  onShow && onShow(newValue);
                }}
              />
            </div>
          </div>
        ) : (
          <Upload {...propsConfig}>
            <div>
              <TongyongTianjia />
              <div className={style.uploadWarning}>
                图片（5M）
                <br />
                视频（10M）
              </div>
            </div>
          </Upload>
        )}
      </div>
      <AISessionAssistant isModalOpen={showAi} setIsModalOpen={setShowAi} />
    </div>
  );
};

export default MessageContent;
