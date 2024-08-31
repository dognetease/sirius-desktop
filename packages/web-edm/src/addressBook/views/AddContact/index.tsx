import React, { useState, ReactNode } from 'react';
import { Button, Upload, Tabs, UploadProps, Input } from 'antd';
import { CheckboxSelect } from '../../components/CheckboxSelect/index';
import UploadIcon from '../../assets/cloudUpload.svg';
import { ModalHeader } from '../../components/ModalHeader/index';
import { ReactComponent as CirCleCloseIcon } from '../../assets/circleClose.svg';
import { ReactComponent as XlsLabel } from '../../assets/xlsLabel.svg';
import styles from './index.module.scss';
import { IBaseModalType } from '../baseType';
import classnames from 'classnames';
import { apis, apiHolder, AddressBookApi, urlStore, IAddressBookOpenSeaTextImportReq } from 'api';
import useDownLoad from '@/components/Layout/Customer/components/hooks/useDownLoad';
import { useSelectCheckBox } from '../../hooks/selectCheckBoxHooks';
import { parseReceiverEntity } from '../../../utils';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { edmDataTracker } from '../../../tracker/tracker';
import { getIn18Text } from 'api';
import { useAddressRepeatedAction } from '../../hooks/useAddressRepeatedAction';

export interface IAddContactProp extends IBaseModalType {
  /** 模态框标题 */
  title?: string;
  /** 隐藏分组 */
  hideGroup?: boolean;
  /** 隐藏重复动作 */
  hideRepeatedAction?: boolean;
  uploadContactsByFile?: (req: FormData, file: File) => Promise<void>;
  uploadByPaste?: (req: IAddressBookOpenSeaTextImportReq) => Promise<void>;
  downloadTemplate?: () => void;
  showToast?: boolean;
}
const { Dragger } = Upload;
const { TextArea } = Input;
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
export function AddContact(props: IAddContactProp) {
  const { action, ActionRadioGroup } = useAddressRepeatedAction();
  const { visible, onClose, onSuccess, onError, id, showToast = true } = props;
  const { downloadTemplate } = useDownLoad();
  const [addContactLoading, setAddContactLoading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [fileName, setFileName] = useState('');
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const { options, addGroupIfNeed, unCheckAllOptions, addOptions, changeCheckState } = useSelectCheckBox();
  const confirmAddContact = async () => {
    setAddContactLoading(true);
    if (!props.hideGroup) {
      try {
        await addGroupIfNeed();
      } catch {
        setAddContactLoading(false);
        return;
      }
    }
    // 上传
    const upload = activeTab === 'upload' ? uploadByFile : uploadByPaste;
    const action = activeTab === 'upload' ? 'file_to_import' : 'copy_and_paste';
    edmDataTracker.track('waimao_address_book_newcontact', { action });
    upload()
      .then(res => {
        if (showToast && res) {
          switch (res.status) {
            case 1:
            case 2:
              message.success(res.message);
              onSuccess && onSuccess(id, res);
              removeUploadedFile();
              setPastedText('');
              break;
            case 3:
              message.error(res.message);
              onError && onError(id, res);
              break;
            default:
              message.success(res.message);
              removeUploadedFile();
              setPastedText('');
              break;
          }
        }
      })
      .catch(err => onError && onError(id, err))
      .finally(() => {
        setAddContactLoading(false);
      });
  };
  const uploadByFile = () => {
    const params = new FormData();
    params.append('file', fileObj as Blob);
    params.append(
      'groupIdList',
      options
        .filter(el => el.checked)
        .map(el => el.id)
        .join(',')
    );
    if (props.uploadContactsByFile) {
      return props.uploadContactsByFile(params, fileObj);
    } else {
      params.append('addressRepeatedAction', action);
      return addressBookApi.uploadContactsByFile(params);
    }
  };
  const uploadByPaste = () => {
    const rows = pastedText.split(/[;；\n]+/).filter(s => s.length > 0);
    if (!rows.length) {
      return;
    }
    const entities = rows.map(row => parseReceiverEntity(row));
    const params = {
      pasteList: entities.map(el => ({
        email: el.contactEmail,
        name: el.contactName || '',
      })),
      groupIdList: options.filter(el => el.checked).map(el => el.id),
    };
    if (props.uploadByPaste) {
      return props.uploadByPaste(params);
    } else {
      return addressBookApi.uploadContactsByPaste({
        ...params,
        addressRepeatedAction: action,
      });
    }
  };
  const beforeFileUpload: UploadProps['beforeUpload'] = file => {
    setFileObj(file);
    const { name } = file;
    setUploadDone(true);
    setFileName(name);
  };
  const removeUploadedFile = () => {
    setFileObj(null);
    setUploadDone(false);
    setFileName('');
  };
  const downloadFile = () => {
    downloadTemplate(urlStore.get('addressBookTemplate') as string, getIn18Text('DEZHIBUDAORUMOBAN'));
  };
  const uploadJSX = uploadDone ? (
    <div className={styles.contactUploadResult}>
      <div className={styles.contactUploadResultFile}>
        <XlsLabel />
        <div className={styles.content}>{fileName}</div>
        <CirCleCloseIcon onClick={removeUploadedFile} />
      </div>
    </div>
  ) : (
    <>
      <Dragger accept=".csv,.xls,.xlsx" multiple={false} beforeUpload={beforeFileUpload} showUploadList={false} className={styles.contactUploadDragger}>
        <p className={styles.contactUploadIcon}>
          <img src={UploadIcon} alt="upload icon" />
        </p>
        <p className={styles.contactUploadTitle}>{getIn18Text('JIANGWENJIANTUOZHUAIDAOCICHU\uFF0CHUODIANJISHANGCHUAN')}</p>
        <p className={styles.contactUploadSub}>
          {getIn18Text('ZHICHIxls\u3001xlsx\u3001csvWENJIANGESHI\uFF0C')}
          <a
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              if (props.downloadTemplate) {
                props.downloadTemplate();
              } else {
                downloadFile();
              }
            }}
          >
            {getIn18Text('XIAZAIMOBAN')}
          </a>
        </p>
      </Dragger>
      <div className={styles.contactUploadTip}>
        {getIn18Text('RUOBIANLIANGBUMANZU\uFF0CGUANLIYUANKEQU\u201CQIYESHEZHI\u201D-\u201CYOUJIANYINGXIAOMOBANBIANLIANG\u201DPEIZHI')}
      </div>
    </>
  );
  const getConfirmDisabled: () => boolean = () => {
    if (activeTab === 'upload') {
      if (fileObj === null) {
        return true;
      }
      return false;
    } else {
      if (pastedText.length === 0) {
        return true;
      }
      return false;
    }
  };
  const addContactDisable = getConfirmDisabled();
  return (
    <Modal
      visible={visible}
      closable={false}
      width={480}
      onCancel={() => onClose(id)}
      className={styles.contact}
      destroyOnClose={true}
      title={<ModalHeader title={props.title || getIn18Text('XINJIANLIANXIREN')} onClick={() => onClose(id)} />}
      footer={[
        <Button onClick={() => onClose(id)} className={classnames(styles.btn, styles.cancel)}>
          {getIn18Text('QUXIAO')}
        </Button>,
        <Button onClick={confirmAddContact} loading={addContactLoading} disabled={addContactDisable} className={classnames(styles.btn, styles.confirm)} type="primary">
          {getIn18Text('QUEDING')}
        </Button>,
      ]}
    >
      <Tabs activeKey={activeTab} onChange={key => setActiveTab(key)} tabBarGutter={16}>
        <Tabs.TabPane tab={getIn18Text('CONGWENJIANDAORU2')} key="upload">
          <div className={styles.contactUpload}>{uploadJSX}</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={getIn18Text('FUZHIZHANTIE')} key="paste">
          <div className={styles.contactPaste}>
            <TextArea
              style={{
                height: '199px',
              }}
              placeholder={getIn18Text(
                'ZHANTIEXUYAOFASONGDEYOUXIANGDEZHI\uFF0CLIANXIRENXINGMINGSHIYONG\u201C\uFF0C\u201DGEKAI\uFF0CYOUXIANGDEZHISHIYONG\u201C\uFF1B\u201DHUOHUICHEGEKAI\uFF0CRU\uFF1AZHANGSAN\uFF0Czhangsan@163.com'
              )}
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
            />
          </div>
        </Tabs.TabPane>
      </Tabs>
      {!props.hideRepeatedAction && <ActionRadioGroup style={{ marginTop: 20 }} />}
      {!props.hideGroup && (
        <>
          <div className={styles.contactLabel}>{getIn18Text('TIANJIAZHIFENZU')}</div>
          <CheckboxSelect options={options} addGroup={addOptions} checkOption={changeCheckState} uncheckAll={unCheckAllOptions} />
        </>
      )}
    </Modal>
  );
}
