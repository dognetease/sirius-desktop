import React, { useState, useRef, useContext, useEffect } from 'react';
import classnames from 'classnames/bind';
import { Modal, Tooltip } from 'antd';
import { apiHolder, NIMApi } from 'api';
import { HotKeys } from 'react-hotkeys-ce';
import { useObservable } from 'rxjs-hooks';
import throttle from 'lodash/throttle';
import styles from './operation.module.scss';
import Icon from '@web-common/components/UI/IconCard';
import { PasteFileContext } from '../store/pasteFile';
import ErrorIcon from '@web-common/components/UI/Icons/svgs/ErrorSvg';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';
import { formatFileSize, getFileExt } from '@web-common/utils/file';
import { modalProps } from '../../components/TeamSetting/teamSetting';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(styles);
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
type FileType = 'image' | 'video' | 'audio' | 'file';
const computeFileType = (file: File): FileType => {
  const { type, name, size } = file;
  const imageReg = /(jpg|jpeg|gif|png|webp)$/i;
  const videoReg = /(wmv|rm|rmvb|mp4|mov|avi|mkv)$/i;
  const audioReg = /(wav|mp3)$/i;
  if (type.indexOf('image') !== -1 || imageReg.test(name)) {
    return 'image';
  }
  if (type.indexOf('video') !== -1 || videoReg.test(name)) {
    return 'video';
  }
  if (type.indexOf('audio') !== -1 || audioReg.test(name)) {
    return 'audio';
  }
  return 'file';
};
const computeFileSize = (file: File | null | undefined) => {
  if (!file) {
    return '0B';
  }
  const { size } = file;
  return formatFileSize(size, 1024);
};
// 发送文件(图片/...)信息
export const FileIcon = props => {
  const fileRef = useRef(null);
  const { onFileChange } = useContext(PasteFileContext);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  return (
    <Tooltip title={getIn18Text('WENJIAN/TUPIAN')} visible={showTooltip} overlayClassName="team-setting-tooltip">
      <span
        data-test-id="im_session_send_file_btn"
        className={realStyle('operationIcon', 'iconFile')}
        onClick={() => {
          (fileRef.current as unknown as HTMLElement)!.click();
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      />
      <input
        ref={fileRef}
        type="file"
        className={realStyle('iconFileInput')}
        onChange={e => {
          onFileChange(e.target.files);
          // @ts-ignore
          (fileRef.current as unknown as HTMLInputElement).value = null;
        }}
        multiple
      />
    </Tooltip>
  );
};
export const SendFiles = props => {
  const { sendFileMsg, toAccount, scene, sessionId } = props;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { files } = useContext(PasteFileContext);
  // 文件本地Blob地址
  const [localUrl, setLocalUrl] = useState<Record<string | number, string>>({});
  // 文件最大限制
  const maxSize = Math.pow(1024, 3);
  const showModal = (files: File[]): any => {
    if (!files || !files.length) {
      return;
    }
    const fileInfo = files[0];
    if (!fileInfo) {
      return;
    }
    const isLimited = files.some(fileInfo => fileInfo.size > maxSize);
    if (isLimited) {
      return Modal.error({
        title: getIn18Text('FASONGSHIBAI\uFF0C'),
        okText: getIn18Text('ZHIDAOLE'),
        centered: true,
        className: realStyle('errorModal'),
        maskStyle: modalProps.maskStyle,
      });
    }
    // 设置本地地址
    files.forEach(fileInfo => {
      const localUrl = ['image', 'video'].includes(computeFileType(fileInfo)) ? URL.createObjectURL(fileInfo) : null;
      setLocalUrl(state => {
        state[fileInfo.lastModified] = localUrl;
        return state;
      });
    });
    setIsModalVisible(true);
  };
  useEffect(() => {
    if (!files) {
      return;
    }
    showModal(files);
  }, [files]);
  const myAccount = useObservable(() => nimApi.imself.getMyField(), '');
  const [confirmloading, setConfirmloading] = useState(false);
  const handleOk = async () => {
    if (!isModalVisible) {
      return;
    }
    setIsModalVisible(false);
    console.log('[sendFile]count', new Date().getTime());
    // 删除引用
    await Promise.all(
      files.map(async fileInfo => {
        const type = computeFileType(fileInfo);
        const tempUrl = localUrl[fileInfo.lastModified];
        let tempSize: number[] = [];
        if (type === 'image') {
          const tempImg = new Image();
          tempImg.src = tempUrl as string;
          await new Promise(resolve => {
            tempImg.onload = () => {
              tempSize = [tempImg.width, tempImg.height];
              resolve('');
            };
          });
        }
        await sendFileMsg({
          scene,
          to: toAccount,
          type: computeFileType(fileInfo),
          from: myAccount,
          // 仿照IM中的file格式
          customFile: {
            w: tempSize[0],
            h: tempSize[1],
            url: localUrl[fileInfo.lastModified],
            name: fileInfo?.name || getIn18Text('ZIDINGYIMINGCHENG'),
            size: fileInfo?.size,
            ext: getFileExt(fileInfo?.name || ''),
          },
          sessionId,
          localUrl: localUrl[fileInfo.lastModified],
          blob: fileInfo,
        });
      })
    );
    // 这里暂时不释放资源
    // localUrl.forEach(url => {
    //     URL.revokeObjectURL(url as string);
    // });
    setConfirmloading(false);
    setLocalUrl({});
  };
  const handleCancel = () => {
    for (const key in localUrl) {
      URL.revokeObjectURL(localUrl[key] as string);
    }
    setLocalUrl({});
    setIsModalVisible(false);
  };
  const keyMap = {
    SUBMIT: ['enter'],
    CANCEL: ['esc'],
  };
  const handlers = {
    SUBMIT: throttle(handleOk, 1000, { trailing: false }),
    CANCEL: handleCancel,
  };
  const outputFileType: (files: File[]) => string = (files: File[]) => {
    const fileTypes = [...new Set(files.map(item => computeFileType(item)))];
    if (fileTypes.length > 1) {
      return getIn18Text('WENJIAN');
    }
    const [fileType] = fileTypes;
    if (fileType === 'image') {
      return getIn18Text('TUPIAN');
    }
    if (fileType === 'audio') {
      return getIn18Text('YINPIN');
    }
    if (fileType === 'video') {
      return getIn18Text('SHIPIN');
    }
    return getIn18Text('WENJIAN');
  };
  return (
    <HotKeys keyMap={keyMap} handlers={handlers}>
      <Modal
        title={`发送${outputFileType(files as File[])}`}
        visible={isModalVisible}
        onOk={handleOk}
        maskClosable={false}
        className={realStyle('previewFileWrapper')}
        onCancel={handleCancel}
        okText={getIn18Text('QUEDING')}
        cancelText={getIn18Text('QUXIAO')}
        confirmLoading={confirmloading}
        closeIcon={<CloseIcon className="dark-invert" />}
      >
        <div className={realStyle('previewMain', files.length > 1 && 'mutilpleRows')}>
          {files &&
            files.map((fileInfo, index) => {
              const fileExt = getFileExt(fileInfo?.name || '');
              const fileType = computeFileType(fileInfo);
              const fileSize = computeFileSize(fileInfo);
              const fileName = fileInfo.name || getIn18Text('ZIDINGYIWENJIAN');
              return (
                <div className={realStyle('previewItem')} key={index}>
                  {fileType === 'image' && <img src={localUrl[fileInfo.lastModified] || ''} className={realStyle('previewImg')} />}
                  {fileType !== 'image' && (
                    <span className={realStyle('previewFileIcon', `icon-type-${fileExt}`)}>
                      <Icon type={fileExt} />
                    </span>
                  )}
                  <div className={realStyle('previewInfo')}>
                    <p className={realStyle('name')}>{fileName}</p>
                    <p className={realStyle('size')}>{fileSize}</p>
                  </div>
                </div>
              );
            })}
        </div>
      </Modal>
    </HotKeys>
  );
};
