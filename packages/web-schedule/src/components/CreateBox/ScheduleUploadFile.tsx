// import Modal from 'antd/lib/modal';
import classnames from 'classnames';
import React, { useEffect, useState } from 'react';
import { Upload, Button, UploadProps } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder, api, DataTransApi, AccountAttachmentParam } from 'api';
import styles from './ScheduleUploadFile.module.scss';
import IconCard, { IconMapKey } from '@web-common/components/UI/IconCard';
import { ReactComponent as CloseIcon } from '@/images/icons/edm/remove-icon.svg';
import { cloneDeep } from 'lodash';
import { getIn18Text } from 'api';

const systemApi = api.getSystemApi();
const httpApi = apiHolder.api.getDataTransApi() as DataTransApi;

interface ScheduleUploadFileProps {
  disabled: boolean; // 是否可编辑
  value?: any[]; // 待编辑的附件
  onChange?: (value: any) => void; // 编辑附件回调
}
// 中英文

// 附件限制数
const limitNum = 4;
// 日程上传附件组件
const ScheduleUploadFile: React.FC<ScheduleUploadFileProps> = props => {
  const { value, onChange, disabled } = props;
  const [fileArray, setFileArray] = useState<any[]>([]);
  // 初始化一次，处理status，防止遍历的时候被去掉
  useEffect(() => {
    if (value && value.length) {
      console.log(4444, value);
      const initValue = cloneDeep(value);
      setFileArray(
        initValue.map(f => {
          if (!f.status) {
            f.status = 'done';
            f.accountAttachmentAccountId = f.accountAttachmentAccountId || f?.belonger?.accountId;
          }
          return f;
        })
      );
    } else {
      setFileArray([]);
    }
  }, [value]);

  // 处理请求地址
  const uploadUrl = systemApi.getUrl('scheduleUploadFile');
  const param = { uid: systemApi.getCurrentUser()?.id } as any;
  const isCorpMail = systemApi.getIsCorpMailMode();
  if (isCorpMail) {
    param.sid = systemApi.getCurrentUser()?.sessionId;
  }

  const actionUrl = httpApi.buildUrl(uploadUrl, param);
  // 上传前
  const beforeUpload = (file: any, fileList: any[]) => {
    if (fileArray.length >= limitNum) {
      message.error({
        // @ts-ignore
        content: getIn18Text('schedule_upload_file_num'),
        duration: 2,
      });
      return false;
    }
    // 文件大小限制
    if (file.size > 50 * 1024 * 1024) {
      message.error({
        content: getIn18Text('schedule_upload_file_limit'),
        duration: 2,
      });
      return false;
    }
    // 一次选择多个文件提示
    if (fileList.length > limitNum) {
      const index = fileList.indexOf(file);
      // 第四个文件提醒一下，防止多次提醒
      if (index === limitNum) {
        message.error({
          // @ts-ignore
          content: getIn18Text('schedule_upload_file_num'),
          duration: 2,
        });
      }
      if (index >= limitNum) {
        return false;
      }
    }
    // 相同文件不上传,此逻辑同产品同学沟通后去掉
    // const fileOld = fileArray?.find(f => f.name === file.name && f.size === file.size);
    // if (fileOld) {
    //   return false;
    // }
    return Promise.resolve(file);
  };

  // 文件change
  const handleChange: UploadProps['onChange'] = info => {
    let newFileList = [...info.fileList];
    newFileList = newFileList.filter(f => !!f.status);
    newFileList = newFileList.map(file => {
      const f = cloneDeep(file) as any;
      if (f.status === 'done') {
        f.accountAttachmentId = f.response?.data[0]?.accountAttachmentId || f.accountAttachmentId || '';
        f.belonger = f.response?.data[0]?.belonger || f.belonger || {};
        f.accountAttachmentAccountId = f.response?.data[0]?.belonger?.accountId || f.accountAttachmentAccountId || f?.belonger?.accountId || '';
        f.progress = 100;
      } else if (f.status === 'uploading') {
        f.progress = 99;
      }
      return f;
    });
    onChange && onChange(newFileList);
  };

  // 参数
  const propsUpload = {
    action: actionUrl,
    onChange: handleChange,
    multiple: true,
    maxCount: 4,
    beforeUpload,
    showUploadList: false,
    fileList: fileArray,
  };

  // 删除文件
  const removeFile = (index: number) => {
    if (fileArray && index >= fileArray.length) {
      return;
    }
    const fileArrayCp = cloneDeep(fileArray) || [];
    fileArrayCp?.splice(index, 1);
    onChange && onChange(fileArrayCp);
  };

  // 文件列表
  const renderFileList = () => {
    {
      return fileArray?.map((f, idx) => {
        let type = 'other' as IconMapKey;
        if (f.name?.includes('.')) {
          type = (f.name?.substring(f.name?.lastIndexOf('.') + 1) as IconMapKey) || 'other';
        }
        return (
          <div className={styles.fileItem} key={idx}>
            <div className={styles.attachmentLogo}>
              <IconCard style={{ width: '20px', height: '20px' }} type={type} />
            </div>
            <div className={styles.attachmentName} title={f.name || getIn18Text('WEIMINGMING')}>
              {f.name || getIn18Text('WEIMINGMING')}
            </div>
            {/* 进度条 */}
            <div className={styles.progressBox}>
              <div
                className={classnames(styles.progress, {
                  [styles.progressDone]: f.status === 'done' || +f.progress === 100,
                  [styles.progressing]: f.status === 'uploading' || +f.progress < 100,
                })}
              />
            </div>

            {/* 如果不能编辑，不展示删除按钮 */}
            {!disabled && <CloseIcon onClick={() => removeFile(idx)} className={styles.closeIcon} />}
          </div>
        );
      });
    }
  };

  return (
    <>
      <div className={styles.btnOut}>
        <Upload {...propsUpload} className={styles.btn}>
          <Button disabled={disabled}>{getIn18Text('TIANJIAFUJIAN')}</Button>
        </Upload>
        <div className={styles.tip}>{getIn18Text('DANGEFUJIANDAXBCG50M，ZDKSC4GFJ')}</div>
      </div>
      <div className={styles.fileList}>{renderFileList()}</div>
    </>
  );
};

export default ScheduleUploadFile;
