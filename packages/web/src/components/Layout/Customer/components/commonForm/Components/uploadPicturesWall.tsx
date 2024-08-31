import React, { useEffect, useState } from 'react';
import { Upload, UploadProps } from 'antd';
// import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import { apiHolder, apis, EdmSendBoxApi, DataStoreApi, SystemApi } from 'api';
const systemApi: SystemApi = apiHolder.api.getSystemApi();
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import style from './index.module.scss';
import { getIn18Text } from 'api';
interface UploadWrapperProps extends UploadProps {
  value?: any;
  onChange?: (value: any) => void;
  children?: React.ReactNode;
}
// 获取Form.item中的传值
export default function UploadPicturesWall(props: UploadWrapperProps) {
  const { value, onChange } = props;
  const [loading, setLoading] = useState<boolean>(false);
  const [fileList, setFileList] = useState([] as any);
  const getInitState = () => {
    if (value && Array.isArray(value) && value.length) {
      console.log('value--------', value, value.length);
      const fileItemList = value.map(item => {
        return {
          uid: item,
          name: getIn18Text('TUPIAN'),
          status: 'done',
          url: item,
        };
      });
      setFileList(fileItemList);
    }
  };
  // props.value to fileList
  useEffect(() => {
    getInitState();
  }, [value]);
  console.log('xxxxxxxxxx-props', value);
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
    if (isJpgOrPng && isLt2M) {
      return isJpgOrPng && isLt2M;
    } else {
      return Upload.LIST_IGNORE;
    }
  };
  const handleChange = info => {
    console.log('xxxxxxxxxx-upload1', info, info.file.status);
    /**
     * 解决受控组件一致处于uploading不更新的问题
     */
    setFileList(info.fileList.slice()); // Note: A new object must be used here!!!
    if (!info.file.status) return;
    // 如果没有状态就是本地操作
    if (info.file.status === 'removed' && onChange) {
      let picList = info.fileList.map(item => item.url);
      onChange(picList);
    }
    if (info.file.status === 'uploading' && onChange) {
      setLoading(true);
      onChange('uploading');
      return;
    }
    if (info.file.status === 'done') {
      setLoading(false);
      const { file } = info;
      let picUrl = file?.response?.data.picUrl;
      // 排除空的元素
      let preUrlList = fileList.map(item => item.url).filter(item => !!item === true);
      if (picUrl && onChange) {
        // onChange(Array.isArray(value) ? [...value, picUrl]:[picUrl]);
        onChange(Array.isArray(preUrlList) ? [...preUrlList, picUrl] : [picUrl]);
      }
      console.log('info', info);
    }
  };
  const uploadButton = !loading && (
    <div className="upload-btn">
      <PlusOutlined />
      {/* {loading ? <LoadingOutlined /> : <PlusOutlined />} */}
    </div>
  );
  const handlePreview = data => {
    console.log('预览123', data);
    const { url } = data;
    const previewData = [
      {
        previewUrl: url,
        downloadUrl: url,
        OriginUrl: url,
        name: `${url}-${Date.now()}`,
        size: 480,
      },
    ];
    ImgPreview.preview({ data: previewData, startIndex: 0 });
  };
  return (
    <>
      <Upload
        name="picFile"
        data={{ needDel: false }}
        action={systemApi.getUrl('uploadEdmImage')}
        className={style.picturesWall}
        listType="picture-card"
        beforeUpload={beforeUpload}
        onChange={handleChange}
        onPreview={handlePreview}
        fileList={fileList}
      >
        {fileList.length >= 5 ? null : uploadButton}
      </Upload>
      <div style={{ marginTop: 8, color: '#A8AAAD', lineHeight: '20px' }}>{getIn18Text('*ZHICHIJPG\u3001PNGGESHI\uFF0CZUIDUO5ZHANG\uFF0CMEIZHANGXIAOYU10MB')}</div>
    </>
  );
}
