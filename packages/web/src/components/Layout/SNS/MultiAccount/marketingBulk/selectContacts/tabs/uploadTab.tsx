import React, { useState } from 'react';
import { Button, Upload } from 'antd';
import type { UploadProps, UploadFile } from 'antd';
import classnames from 'classnames';
import { api, apis, InsertWhatsAppApi } from 'api';
import { JichuShangchuan, WendangXls, TongyongGuanbiMian } from '@sirius/icons';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import style from './tab.module.scss';

const { Dragger } = Upload;

const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

interface Props {
  addWhatsApp: (whatsApp: string[], clear: () => void) => void;
  fileList: UploadFile[];
  setFileList: (file: UploadFile[]) => void;
}
export const UploadTab: React.FC<Props> = ({ addWhatsApp, fileList, setFileList }) => {
  const [loading, setLoading] = useState<boolean>(false);

  const download = () => {
    whatsAppApi.marketTaskImportTemplate().then(res => {
      window.location.href = res.nosUrl + '';
    });
  };

  const addExcelFile = async () => {
    if (!fileList?.length || loading) return;
    const formData = new FormData();
    formData.append('file', fileList[0]);
    setLoading(true);
    const whatsAppNumber = await whatsAppApi.marketTaskTemplateAnalyze(formData);
    if (whatsAppNumber?.length) {
      addWhatsApp(whatsAppNumber, () => setFileList([]));
    } else {
      Toast.warning('上传文件账号为空');
    }
    setLoading(false);
  };

  const props: UploadProps = {
    accept: '.xlsx',
    showUploadList: false,
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: file => {
      setFileList([...fileList, file]);
      return false;
    },
    fileList,
  };

  return (
    <div className={style.tabContentWrap}>
      <div className={classnames(style.contactPaste, { [style.uploadBox]: fileList.length })}>
        {fileList.length ? (
          <div className={style.excel}>
            <WendangXls style={{ fontSize: 32, height: 32 }} />
            <div className={style.content}>
              <span className={style.name}>{fileList[0].name}</span>
            </div>
            <TongyongGuanbiMian
              onClick={() => {
                setFileList([]);
              }}
            />
          </div>
        ) : (
          <Dragger {...props} style={{ height: '100%' }}>
            <p className={style.icon}>
              <JichuShangchuan />
            </p>
            <p className="ant-upload-text">将文件拖拽到此处，或点击上传</p>
            <p className="ant-upload-hint">
              支持xlsx文件格式
              <Button
                onClick={e => {
                  e.stopPropagation();
                  download();
                }}
                type="link"
              >
                下载模板
              </Button>
            </p>
          </Dragger>
        )}
      </div>
      <div className={style.btnBox}>
        <Button disabled={!fileList?.length} onClick={() => addExcelFile()}>
          添加
        </Button>
      </div>
    </div>
  );
};
