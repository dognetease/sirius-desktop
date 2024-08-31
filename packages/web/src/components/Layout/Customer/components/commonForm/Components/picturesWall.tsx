import React, { useEffect, useState } from 'react';
import { Upload, Form } from 'antd';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import style from './index.module.scss';
import UploadWrapper from './uploadWrapper';
import UploadPicturesWall from './uploadPicturesWall';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import { apiHolder, apis, EdmSendBoxApi, DataStoreApi, SystemApi } from 'api';
import { getIn18Text } from 'api';
const systemApi: SystemApi = apiHolder.api.getSystemApi();
interface comsProps {
  name: string;
  level1Fieldname?: number;
  fieldKey?: number;
  isFormList: boolean;
  label: string;
}
const PicturesWall = (props: comsProps) => {
  console.log('props', props.name);
  const [loading, setLoading] = useState<boolean>(false);
  const [fileList, setFileList] = useState([] as any);
  // 兼容formlist
  const formItemLayout = () => {
    const layout = {};
    if (props.isFormList) {
      let layoutName = [props.level1Fieldname, props.name];
      let layoutFieldKey = [props.fieldKey, props.name];
      layout['name'] = layoutName;
      layout['fieldKey'] = layoutFieldKey;
    } else {
      layout['name'] = props.name;
    }
    layout['label'] = props.label;
    return layout;
  };
  const normFile = e => {
    if (!e.file.status) return;
    if (e.file.status === 'done') {
      console.log('图片上传123', e, fileList);
      const picUrl = e?.file?.response?.data.picUrl;
      const list = fileList.map(item => item.url);
      return [...list, picUrl];
    } else {
      return [];
    }
  };
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
    console.log('info-----upload', info, info.file.status);
    if (!info.file.status) return;
    // 如果没有状态就是本地操作
    if (info.file.status === 'removed') {
      setFileList(info.fileList);
    }
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      setLoading(false);
      const { file } = info;
      const fileItem = {
        uid: file.uid,
        name: file.name,
        status: 'done',
        url: file?.response?.data.picUrl,
      };
      const newFileList = [...fileList, fileItem];
      setFileList(newFileList);
      console.log('info', info);
    }
  };
  const syncFileList = list => {
    setFileList(list);
  };
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
  const uploadButton = <div className="upload-btn">{loading ? <LoadingOutlined /> : <PlusOutlined />}</div>;
  return (
    <Form.Item {...formItemLayout()}>
      <UploadPicturesWall />
    </Form.Item>
  );
};
export default PicturesWall;
