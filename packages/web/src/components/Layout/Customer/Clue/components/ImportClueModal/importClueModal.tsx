/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable camelcase */
import React, { useState } from 'react';
import { Upload, Button, Checkbox } from 'antd';
import CloseCircleFilled from '@ant-design/icons/CloseCircleFilled';
import IconCard from '@web-common/components/UI/IconCard';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder, apis, CustomerApi, ResUploadCientFile as uploadType, urlStore } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './importClueModal.module.scss';
import useDownLoad from '../../../components/hooks/useDownLoad';
import { getIn18Text } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
export interface IHistoryActionData {
  edmSubject: string;
  contactEmail: string;
  operateName: string;
  operateTime: string | number;
  operateDevice: string;
}
export interface IHistoryActionProps {
  visible: boolean;
  onCancel: (update?: boolean) => void;
  onChangeInfo: (params: uploadType) => void;
}
const ImportClientModal = (props: IHistoryActionProps) => {
  const { visible, onCancel, onChangeInfo } = props;
  const [uploadStatus, setUploadStatus] = useState<boolean>(false);
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [fileList, setFileList] = useState<any>([]);
  const [fileName, setFileName] = useState<string>('');
  const { downloadTemplate } = useDownLoad();
  const [update, setUpdate] = useState(false);
  const newUploadProps = {
    name: 'file',
    accept: '.csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    maxCount: 1,
    progress: { strokeWidth: 2, showInfo: false },
    showUploadList: false,
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: () => false,
    onChange(info: any) {
      const { file } = info;
      if (file.size) {
        setFileList([file]);
        setFileName(file.name);
        setUploadStatus(true);
      }
      console.log('onchange', info);
    },
    fileList,
  };
  /**
   *  上传参数
   */
  /**
   * 回复上传前的状态
   */
  const deleteFileData = () => {
    setUploadStatus(false);
    setFileList([]);
    setFileName('');
  };
  const importClients = () => {
    const formData = new FormData();
    formData.append('file', fileList[0]);
    formData.append('update', String(update));
    setImportLoading(true);
    clientApi
      .uploadClueDate(formData)
      .then(res => {
        console.log('upload-file', res);
        const { status_code } = res;
        if (status_code === 'success' || status_code === 'part') {
          onCancel(true);
        } else {
          onCancel();
        }
        onChangeInfo(res);
        setImportLoading(false);
      })
      .catch(() => {
        setImportLoading(false);
        SiriusMessage.error({
          content: getIn18Text('WANGLUOYICHANG'),
        });
      });
  };
  const getTemplate = () => {
    const reqUrl = urlStore.get('clueTemplate') as string;
    downloadTemplate(reqUrl, getIn18Text('XIANSUODAORUMOBAN'));
  };
  /**
   * 新建用户数据
   */
  const renderForm = () => (
    <div className={style.tabContentWrap}>
      <div className={style.fileSelectorWrap}>
        {uploadStatus && (
          <div>
            <div className={style.templateFileCard}>
              <div className={style.cardWrap}>
                <div style={{ marginRight: 8, display: 'flex' }}>
                  <IconCard type="xlsx" />
                </div>
                <div className={style.file}>
                  <div className={style.fileName}>{fileName}</div>
                </div>
                <CloseCircleFilled onClick={deleteFileData} />
              </div>
            </div>
            <Checkbox checked={update} onChange={e => setUpdate(e.target.checked)} style={{ marginBottom: 16 }}>
              {getIn18Text('DANGDAORUDEXIANSUOHUOLIANXIRENYUYIYOUSHUJUZHONGFUSHI\uFF0CGENGXINSHUJU')}
            </Checkbox>
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" loading={importLoading} disabled={importLoading} onClick={importClients}>
                {getIn18Text('DAORUXIANSUOZILIAO')}
              </Button>
              <div className={style.download}>
                <a onClick={getTemplate}>{getIn18Text('XIAZAIMOBAN')}</a>
              </div>
            </div>
          </div>
        )}
        {!uploadStatus && (
          <div style={{ textAlign: 'center' }}>
            <Upload {...newUploadProps}>
              <Button type="primary">{getIn18Text('XUANZEWENJIAN')}</Button>
            </Upload>
            <p className={style.fileTypeDesc}>
              {getIn18Text('ZHICHIxls\u3001csvWENJIANGESHI')}
              <a className={style.download} onClick={getTemplate}>
                {getIn18Text('XIAZAIMOBAN')}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
  return (
    <>
      <Modal
        className={style.modalWrap}
        maskClosable={!uploadStatus}
        title={getIn18Text('PILIANGDAORUXIANSUOZILIAO')}
        width={476}
        bodyStyle={{
          height: '252px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        visible={visible}
        destroyOnClose
        footer={null}
        onCancel={() => onCancel()}
      >
        <div className={style.modalContent}>{renderForm()}</div>
      </Modal>
    </>
  );
};
export default ImportClientModal;
