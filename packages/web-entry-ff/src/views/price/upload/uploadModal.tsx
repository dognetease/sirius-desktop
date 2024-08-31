import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Select, Upload, message, Button, Alert, Spin, Tooltip } from 'antd';
import IconCard from '@web-common/components/UI/IconCard';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import icon from '@web-common/components/UI/Icons/svgs';
import { apiHolder, apis, FFMSApi, FFMSCustomer, FFMSLevelAdmin, FFMS } from 'api';
const { TongyongShanchuMian, TongyongYiwenMian } = icon;
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import InboxOutlined from '@ant-design/icons/InboxOutlined';
import style from './uploadModal.module.scss';
import { FFMSRate } from '../../../../../api/src/api/logical/ffms';
// import VirtualTable from './table';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ImageRecognition from './imageRecognition';
import { useMount, useEventListener } from 'ahooks';
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

const { Dragger } = Upload;
const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
const systemApi = apiHolder.api.getSystemApi();
interface Props {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const TIPS = '不完整数据可能是因为无法有效识别造成，导入后需进一步补充完整方可生效';
const ACCEPT_TYPE = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

const UploadModal: React.FC<Props> = ({ visible, onCancel, onSuccess }) => {
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [status, setStatus] = useState<'pedding' | 'uploading' | 'success' | 'fail'>('success');
  const [uploading, setUploading] = useState<boolean>(false);
  const [analyzeData, setAnalyzeData] = useState<FFMSRate.AnalyzeRes>();
  const [analyzeImageData, setAnalyzeImageData] = useState<FFMSRate.PricePicRes>();

  const uploadUrl = systemApi.getUrl('ffRateUpload');
  const uploadPicUrl = systemApi.getUrl('ffmsAnalyzePicture');
  const [isImage, setImage] = useState<boolean>(false);
  const [standardField, setStandardField] = useState<FFMSRate.StandardField[]>([]);
  const imageRef = useRef<any>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [fileList, setFileList] = useState<any>([]);

  const props: UploadProps = {
    name: 'file',
    multiple: true,
    accept: '.csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .jpg, .jpeg, .png', // .jpg, .jpeg, .png
    showUploadList: false,
    action: isImage ? uploadPicUrl : uploadUrl,
    beforeUpload(file) {
      setFileList([file]);
      return false;

      console.log('before-xxx-paste-items-file', file);
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      // if (!isExcel) {
      //   message.warning('上传文件格式错误，请下载模板编辑后重新上传');
      //   return false;
      // }
      if (file.type.includes('image')) {
        setImage(true);
      } else {
        setImage(false);
      }
      const isLt2M = file.size / 1024 / 1024 < 10;
      if (!isLt2M) {
        message.error('文件大小需小于10M');
        return false;
      }
      return isLt2M;
    },
    onChange(info) {
      const { status, type } = info.file;
      if (status === 'uploading') {
        !uploading && setUploading(!uploading);
        console.log(info.file, info.fileList);
      }
      if (status === 'done') {
        console.log('xxxxtype', type);
        type?.includes('image') ? setAnalyzeImageData(info?.file?.response?.data) : setAnalyzeData(info?.file?.response?.data);
        setUploading(false);
        setStatus('success');
        message.success(`${info.file.name} 解析成功`);
      } else if (status === 'error') {
        setUploading(false);
        // message.error(`${info.file.name} 解析失败`);
        message.error('因格式出错解析失败，请尽量使用原模板上传。');
      }
    },
  };

  const handleOk = () => {
    if (isImage) {
      imageRef?.current?.getFormatData();
    } else {
      if (analyzeData) {
        let params = {
          analyzeId: analyzeData.analyzeId,
        };
        setConfirmLoading(true);
        ffmsApi.saveFfUploadData(params).then(res => {
          message.success('导入成功');
          setConfirmLoading(false);
          onSuccess();
        });
      }
    }
  };
  const callbackImageData = (req: FFMSRate.SaveAnalyzePrice) => {
    ffmsApi.saveFfmsAnalyzePicture(req).then(res => {
      message.success('导入成功');
      setConfirmLoading(false);
      onSuccess();
    });
  };
  const handleCancel = () => {
    onCancel();
  };
  const downLoad = e => {
    e.stopPropagation();
    ffmsApi.ffRateTemplate().then(res => {
      res?.url ? (window.location.href = res.url) : message.error('下载链接异常');
    });
  };
  const uploadInit = () => {
    setStatus('pedding');
  };

  const uploadFile = (isImage: boolean, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    if (isImage) {
      setUploading(true);
      console.log('xxxxformData', formData);
      ffmsApi
        .ffmsAnalyzePicture(formData)
        .then(res => {
          setAnalyzeImageData(res);
          setStatus('success');
          message.success('解析成功');
        })
        .finally(() => setUploading(false));
    } else {
      ffmsApi
        .uploadFfmsPrice(formData)
        .then(res => {
          setAnalyzeData(res);
          setStatus('success');
          message.success('解析成功');
          console.log('xxx', res);
        })
        .finally(() => setUploading(false));
    }
  };

  const getStandardField = () => {
    ffmsApi.getFfmsPriceTitle().then(res => {
      setStandardField(res);
    });
  };

  const submitDisabled = useMemo(() => {
    if (isImage && status === 'success' && analyzeImageData?.data.length) {
      return false;
    }
    if (!isImage && status === 'success' && analyzeData?.analyzeId) {
      return false;
    }
    return true;
  }, [analyzeImageData, analyzeData, status, isImage]);

  useEffect(() => {
    uploadInit();
  }, [visible]);

  useEventListener('paste', event => {
    var items = event.clipboardData && event.clipboardData.items;
    var file = null;
    if (items && items.length) {
      // 检索剪切板items
      for (var i = 0; i < items.length; i++) {
        file = items[i].getAsFile();
        if (items[i].type.indexOf('image') > -1) {
          // setImage(true);
          console.log('xxx-paste-items-file', file);
          // uploadFile(true, file as File);
        } else if (ACCEPT_TYPE[0] === items[i].type && file) {
          console.log('xxx-paste-items-file', file, event.clipboardData.files);
          uploadFile(false, event.clipboardData.files[0] as File);
          setImage(false);
        }
      }
    }
  });

  // useEffect(() => {
  //   window.addEventListener('paste', function (event) {
  //     console.log('xxxx-copy', event);
  //     var items = event.clipboardData && event.clipboardData.items;
  //     var file = null;
  //     if (items && items.length) {
  //       // 检索剪切板items
  //       for (var i = 0; i < items.length; i++) {
  //         file = items[i].getAsFile();
  //         if (items[i].type.indexOf('image') > -1) {
  //           setImage(true);
  //           uploadFile(true, file as File);
  //         } else if (ACCEPT_TYPE[0] === items[i].type){
  //           uploadFile(false, file as File);
  //           setImage(false);
  //         }
  //         console.log('xxx-paste-items-file', file);
  //       }
  //     }
  //   });
  // }, [])

  useMount(() => {
    getStandardField();
  });

  return (
    <Modal
      title="上传报价"
      visible={visible}
      onCancel={handleCancel}
      bodyStyle={{
        minHeight: 200,
        maxHeight: 500,
        overflow: 'auto',
      }}
      width={1000}
      footer={[
        <Button key="back" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" disabled={submitDisabled} loading={confirmLoading} onClick={handleOk}>
          导入并覆盖
        </Button>,
      ]}
    >
      <div className={style.upload}>
        {status === 'success' ? (
          <>
            <div className={style.uploadSuccess}>
              <div className={style.uploadFile}>
                <IconCard type="xlsx" />
                <div>
                  <div>{`文件名：${analyzeData?.filename}, 文件大小：${analyzeData?.filesize}`}</div>
                  <span className={style.uploadInfo}>
                    {`共识别${analyzeData?.totalCount}条数据，其中${analyzeData?.validCount}条有效报价，${analyzeData?.invalidCount}条不完整数据`}
                    <Tooltip placement="bottom" trigger="hover" title={TIPS}>
                      <TongyongYiwenMian />
                    </Tooltip>
                  </span>
                </div>
              </div>
              <TongyongShanchuMian onClick={uploadInit} />
            </div>
            {isImage ? (
              <div className={style.uploadContent}>
                <DndProvider backend={HTML5Backend}>
                  <ImageRecognition standardField={standardField} tableData={analyzeImageData} ref={imageRef} getImageData={callbackImageData} />
                </DndProvider>
              </div>
            ) : null}
          </>
        ) : (
          <Spin spinning={uploading}>
            <Dragger {...props}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击选择或直接拖拽报价excl文件，快速生成报价。</p>
              <a onClick={downLoad}>下载报价文档模板</a>
            </Dragger>
          </Spin>
        )}
      </div>
    </Modal>
  );
};

export default UploadModal;
