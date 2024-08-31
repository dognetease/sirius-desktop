import React, { useState, useEffect } from 'react';
import { Upload, UploadProps, Tooltip } from 'antd';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
// import PlusOutlined from '@ant-design/icons/PlusOutlined';
import style from './index.module.scss';
import { apiHolder, apis, EdmSendBoxApi, DataStoreApi, SystemApi } from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';
const systemApi: SystemApi = apiHolder.api.getSystemApi();
interface UploadWrapperProps {
  children?: React.ReactNode;
  value?: string;
  onChange?: (param: string) => void;
  Logo?: any;
}
/**
 * 封装主要获取form下发的初始数据
 */
const UploadImgWrap = (props: UploadWrapperProps) => {
  const { children, value, onChange, Logo } = props;
  const [loading, setLoading] = useState<boolean>(false);
  console.log('xxxxxxxxxnewprops', props);
  const uploadButton = (
    <Tooltip overlayClassName="clinetuUploadInfo" placement="bottomRight" arrowPointAtCenter title={getIn18Text('SHANGCHUAN10MBYINEIDETUPIAN')}>
      <div className={style.uploadBtn}>
        {value && value !== 'uploading' ? <img src={value} alt="avatar" style={{ width: 56, borderRadius: 56 }} /> : loading ? <LoadingOutlined /> : <Logo />}
        <div className={style.mask}></div>
      </div>
    </Tooltip>
  );
  const beforeUpload = file => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      SiriusMessage.error({
        content: getIn18Text('ZHICHIJPG\u3001PNGGESHI!'),
      });
    }
    const isLt2M = file.size / 1024 / 1024 < 10;
    if (!isLt2M) {
      SiriusMessage.error({
        content: getIn18Text('TUPIANDAXIAOYINGXIAOYU10MB!'),
      });
    }
    return isJpgOrPng && isLt2M;
  };
  const handleChange = info => {
    console.log('info-----upload12121212', info, info.file.status);
    if (info.file.status === 'uploading' && onChange) {
      setLoading(true);
      onChange('uploading');
      return;
    }
    if (info.file.status === 'done') {
      setLoading(false);
      const url = info.file.response.data.picUrl;
      if (onChange) {
        onChange(url);
      }
      console.log('info', info, url);
    }
  };
  return (
    <Upload
      onChange={handleChange}
      name="picFile"
      data={{ needDel: false }}
      listType="picture-card"
      className={style.logoUploader}
      showUploadList={false}
      action={systemApi.getUrl('uploadEdmImage')}
      beforeUpload={beforeUpload}
    >
      {uploadButton}
    </Upload>
  );
};
export default UploadImgWrap;
