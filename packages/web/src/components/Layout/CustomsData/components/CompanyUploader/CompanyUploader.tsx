import { Upload, UploadProps } from 'antd';
import React, { FC, useState } from 'react';
import classnames from 'classnames';
import { getIn18Text, urlStore } from 'api';
import { TongyongShangchuan, WendangXls, TongyongChenggongMian } from '@sirius/icons';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import useDownLoad from '@/components/Layout/Customer/components/hooks/useDownLoad';
import { globalSearchApi } from '@/components/Layout/globalSearch/constants';
import styles from './index.module.scss';

const { Dragger } = Upload;

interface Props {
  visible: boolean;
  onSuccess?: (res: any) => void;
  onClose: () => void;
}

export const CompanyUploader: FC<Props> = ({ visible, onClose, onSuccess }) => {
  const { downloadTemplate } = useDownLoad();
  const [loading, setLoading] = useState(false);
  const [uploadDone, setUploadDone] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [fileObj, setFileObj] = useState<File | null>(null);
  const beforeFileUpload: UploadProps['beforeUpload'] = file => {
    setFileObj(file);
    const { name } = file;
    setUploadDone(true);
    setFileName(name);
    return false;
  };
  const removeUploadedFile = () => {
    setFileObj(null);
    setUploadDone(false);
    setFileName('');
  };
  const downloadFile = () => {
    const url = urlStore.get('downloadCompanyImportTemplate') as string;
    downloadTemplate(url, '公司导入模板');
  };
  const uploadByFile = () => {
    const params = new FormData();
    params.append('file', fileObj as Blob);
    return globalSearchApi.importCompanyByFile(params);
  };
  const onConfirm = () => {
    setLoading(true);
    // 上传
    uploadByFile()
      .then(res => {
        onSuccess && onSuccess(res);
        removeUploadedFile();
        const repeatMsg = res.repeat ? `，${res.repeat}条为重复数据已自动过滤` : '';
        Modal.success({
          className: `${styles.uploadSuccess}`,
          icon: <TongyongChenggongMian style={{ color: '#0FD683', fontSize: 20 }} />,
          title: '导入成功',
          content: (
            <div>
              <div style={{ marginBottom: '8px' }}>
                成功导入{res.success}条数据{repeatMsg}
              </div>
              <div>当日16:00前导入的公司，可在次日8:00点查看匹配结果</div>
            </div>
          ),
          cancelButtonProps: {
            style: { display: 'none' },
          },
          okButtonProps: {
            style: { background: '#4C6AFF' },
          },
          okText: '知道了',
        });
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  };
  const onCancel = () => {
    onClose();
    removeUploadedFile();
  };
  return (
    <Modal
      visible={visible}
      width={680}
      onCancel={onCancel}
      className={styles.companyUploader}
      destroyOnClose
      title="批量导入公司"
      footer={[
        <Button key="cancel" onClick={onCancel} className={classnames(styles.btn, styles.cancel)}>
          {getIn18Text('QUXIAO')}
        </Button>,
        <Button key="confirm" onClick={onConfirm} loading={loading} disabled={fileObj === null} className={classnames(styles.btn, styles.confirm)} btnType="primary">
          {getIn18Text('QUEDING')}
        </Button>,
      ]}
    >
      <Dragger accept=".csv,.xls,.xlsx" multiple={false} beforeUpload={beforeFileUpload} showUploadList={false} className={styles.uploadDragger}>
        {uploadDone ? (
          <div className={styles.uploadResultFile}>
            <WendangXls style={{ fontSize: 35 }} />
            <div className={styles.uploadFileName}>{fileName}</div>
          </div>
        ) : (
          <span className={styles.uploadIcon}>
            <TongyongShangchuan style={{ fontSize: 28 }} />
          </span>
        )}
        <p className={styles.uploadTitle}>将文件拖拽到此处，或者点击{uploadDone ? '重新' : ''}上传</p>
        <p className={styles.uploadSub}>
          {getIn18Text('ZHICHIxls\u3001xlsx\u3001csvWENJIANGESHI\uFF0C')}
          <span
            className={styles.downloadTmpl}
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              downloadFile();
            }}
          >
            {getIn18Text('XIAZAIMOBAN')}
          </span>
        </p>
      </Dragger>
      <div className={styles.uploadTip}>注：一次最多导入200家公司，导入公司将进行海关数据匹配。</div>
    </Modal>
  );
};
