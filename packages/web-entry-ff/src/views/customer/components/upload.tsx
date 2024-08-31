import React, { useEffect, useState } from 'react';
import { message, Upload } from 'antd';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import { apiHolder, apis, FFMSApi } from 'api';

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
interface props {
  onSuccess: () => void;
  children?: React.ReactNode;
}

const UploadCustomer: React.FC<props> = ({ onSuccess, children }) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = () => {
    const formData = new FormData();
    fileList.forEach(file => {
      formData.append('file', file as RcFile);
    });
    setUploading(true);
    ffmsApi
      .ffCustomerUpload(formData)
      .then(res => {
        message.success(`成功上传${res.successCount}条，重复${res.repeatCount}条，失败${res.errorCount}条`, 5);
        onSuccess();
      })
      .finally(() => {
        setUploading(false);
      });
  };

  useEffect(() => {
    if (fileList.length) {
      handleUpload();
    }
  }, [fileList]);

  const props: UploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: file => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (!isExcel) {
        message.warning('上传文件格式错误，请下载模板编辑后重新上传');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 10;
      if (!isLt2M) {
        message.error('文件大小需小于10M');
        return false;
      }
      setFileList([file]);
      return false;
    },
    showUploadList: false,
    fileList,
  };

  return (
    <Upload {...props}>
      {children ? (
        <>{children}</>
      ) : (
        <Button btnType="primary" loading={uploading}>
          导入名单
        </Button>
      )}
    </Upload>
  );
};

export default UploadCustomer;
