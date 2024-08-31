import { getIn18Text } from 'api';
import React, { useState, useRef, useEffect } from 'react';
import { Spin } from 'antd';
import { ReplyPostCommentsReq, apis, apiHolder, WhatsAppApi, FacebookMessageType } from 'api';
import classnames from 'classnames';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import style from './index.module.scss';
import { ReactComponent as SendIcon } from '@/images/icons/facebook/send.svg';
import { ReactComponent as SendDisabledIcon } from '@/images/icons/facebook/disabledSend.svg';
import { ReactComponent as UploadIcon } from '@/images/icons/facebook/uploadImg.svg';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { formatFileSize } from '@web-common/components/util/file';
import { NosUploader } from '@/components/Layout/SNS/nosUploader';
import { PostEditorSuccess } from './../type';
import { facebookTracker } from '@/components/Layout/SNS/tracker';
import { getTransText } from '@/components/util/translate';

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

const MAX_LENGTH = 200;
export interface EditorProps {
  onSave: (data: ReplyPostCommentsReq) => Promise<string>;
  commentId: string;
  placeholder?: string;
  className?: string;
  onCancelEdit?: () => void;
  onSuccess?: (data: PostEditorSuccess) => void;
  onFailure?: () => void;
  childCommentCount?: number;
}
export const PostsEditor = (props: EditorProps) => {
  const { onSave, commentId, placeholder, className, onSuccess, onFailure, childCommentCount } = props;
  const [content, setContent] = useState('');
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [canSend, setCanSend] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageVisible, setImageVisible] = useState<boolean>(false);
  const [imageSending, setImageSending] = useState<boolean>(false);
  const imageSendKey = useRef(0);
  let name = placeholder?.split('回复@')[1];

  useEffect(() => {
    if (image) {
      const reader = new FileReader();
      reader.readAsArrayBuffer(image);
      reader.onload = event => {
        if (event.target && event.target.result) {
          const blob = new Blob([event.target.result], { type: image.type });
          const blobURL = window.URL.createObjectURL(blob);
          setImageSrc(blobURL);
        }
      };
    }
  }, [image]);

  useEffect(() => {
    if (content.length >= MAX_LENGTH) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [content]);

  const handleUpload = () => {
    fileRef.current?.click();
  };
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    event.target.value = '';
    event.target.files = null;

    const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const isImage = imageTypes.includes(file.type);
    if (isImage) {
      if (file.size > 1024 * 1024 * 5) {
        return Toast.error(getIn18Text('TUPIANDAXIAOCHAOGUO '));
      }
      setImage(file);
      setImageVisible(true);
      return;
    } else {
      return Toast.error(getIn18Text('BUZHICHICIGESHI'));
    }
  };

  const handleImageSendStart = () => {
    facebookTracker.trackPostsDetail('send');
    if (image) {
      const sendKey = Date.now();
      setImageSending(true);
      imageSendKey.current = sendKey;
      const nosUploader = new NosUploader(image);

      nosUploader.on('complete', res => {
        whatsAppApi
          .getNosDownloadUrl({
            fileName: image.name,
            nosKey: res.nosKey,
          })
          .then(downloadUrl => {
            if (imageSendKey.current === sendKey) {
              let saveData = {
                commentId,
                message: name,
                mediaUrl: downloadUrl,

                mediaType: FacebookMessageType.IMAGE,
              };
              onSave(saveData)
                .then(res => {
                  console.log('xxx-res', res, { id: commentId, nums: childCommentCount });
                  Toast.success(getTransText('HUIFUFASONGCHENGGONG'));
                  onSuccess && onSuccess({ id: commentId, nums: childCommentCount });
                  setImage(null);
                  setImageSrc('');
                  setImageVisible(false);
                  setImageSending(false);
                })
                .catch(err => {
                  onFailure && onFailure();
                });
            }
          });
      });
      nosUploader.on('error', error => {
        console.log('nos-uploader-error', error);
      });
    }
  };

  // 可以通过判断高度来判断是否换行了

  return (
    <div className={classnames(className, style.followEditor)}>
      <div className={classnames([style.editorWrap])}>
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 6 }}
          placeholder={placeholder}
          showCount
          maxLength={MAX_LENGTH}
          value={content}
          autoFocus
          onChange={e => {
            let value = e.target.value;
            setCanSend(!!value);
            setContent(value);
          }}
        />
        <div className={style.editorFooter}>
          <div className={style.editorBtns}>
            {showWarning ? <span className={style.exceededTip}>{`超过${MAX_LENGTH}字,无法继续输入`}</span> : ''}
            <UploadIcon onClick={handleUpload} />
            <input className={style.fileInput} ref={fileRef} type="file" onChange={handleFileChange} />
            <span className={style.uploadLine}></span>
            {loading ? (
              <Spin
                spinning={loading}
                indicator={
                  <div className={style.siriusSpinWrap}>
                    <i className={style.siriusSpinIcon} />
                    <span className={'spin-label ' + style.siriusSpinLabel}>{getTransText('FASONGZHONG')}</span>
                  </div>
                }
              ></Spin>
            ) : canSend ? (
              <span
                className={style.sendIcon}
                onClick={() => {
                  facebookTracker.trackPostsDetail('send');
                  setLoading(true);
                  let saveData = {
                    commentId,
                    message: `${name}  ${content}`,
                  };
                  onSave(saveData)
                    .then(res => {
                      console.log('xxx-res', res);
                      Toast.success(getTransText('HUIFUFASONGCHENGGONG'));
                      setLoading(false);
                      setContent('');
                      onSuccess && onSuccess({ id: commentId, nums: childCommentCount });
                    })
                    .catch(err => {
                      setLoading(false);
                    });
                }}
              >
                <SendIcon />{' '}
              </span>
            ) : (
              <SendDisabledIcon />
            )}
          </div>
        </div>
      </div>
      <Modal
        title={getIn18Text('FASONGTUPIAN')}
        width={640}
        visible={imageVisible}
        keyboard={false}
        maskClosable={false}
        onOk={handleImageSendStart}
        onCancel={() => {
          setImage(null);
          setImageSrc('');
          setImageVisible(false);
          setImageSending(false);
          imageSendKey.current = 0;
        }}
        okText={!imageSending ? getIn18Text('QUEDING') : getIn18Text('FASONGZHONG')}
        okButtonProps={{ loading: imageSending }}
      >
        {image && (
          <>
            <img
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: 292,
                margin: '0 auto',
                marginBottom: 16,
              }}
              src={imageSrc}
            />
            <div
              className={style.ellipsis}
              style={{
                color: '#272E47',
                fontSize: 16,
                lineHeight: '24px',
                marginBottom: 4,
                textAlign: 'center',
              }}
            >
              {image.name}
            </div>
            <div
              style={{
                color: '#272E47',
                fontSize: 16,
                lineHeight: '24px',
                textAlign: 'center',
              }}
            >
              {formatFileSize(image.size)}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};
