/*
 * @Author: sunmingxin
 * @Date: 2021-10-08 17:59:17
 * @LastEditTime: 2021-10-25 21:56:08
 * @LastEditors: sunmingxin
 */
import React, { useState, useEffect, useContext } from 'react';
import { Upload, Button, Select, Checkbox } from 'antd';
import CloseCircleFilled from '@ant-design/icons/CloseCircleFilled';
import IconCard from '@web-common/components/UI/IconCard';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { throttle } from 'lodash';
import { apiHolder, apis, CustomerApi, urlStore } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import { clientContext } from '../../clientContext';
import { checkLabelItem } from '../../../utils/format';
import useDownLoad from '../../../components/hooks/useDownLoad';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './importClientModal.module.scss';
import { getIn18Text } from 'api';
export interface IHistoryActionData {
  edmSubject: string;
  contactEmail: string;
  operateName: string;
  operateTime: string | number;
  operateDevice: string;
}
export interface IHistoryActionProps {
  // data: Array<IHistoryActionData>
  visible: boolean;
  onCancel: () => void;
}
interface uploadInfo {
  name: string;
  total_cnt: number;
  success_cnt: number;
  fail_cnt: number;
  company_list: any;
}
const ImportClientModal = (props: IHistoryActionProps) => {
  const { visible, onCancel } = props;
  const [uploadStatus, setUploadStatus] = useState<boolean>(false);
  const [uploadInfo, setUploadInfo] = useState<uploadInfo | null>(null);
  const [labelList, setLabelList] = useState<string[]>([]);
  const [selectLabelList, setSelectLabelList] = useState<string[]>([]);
  const [labelBackUp, setLabelBackUp] = useState<string[]>([]);
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [fileList, setFileList] = useState<any>([]);
  const [fileName, setFileName] = useState<string>('');
  const { state, dispatch, fetchTableData } = useContext(clientContext).value;
  const { downloadTemplate } = useDownLoad();
  const [checkValue, setCheckValue] = useState<boolean>(false);
  const changeGlobalInfo = (uploadInfo: any) => {
    dispatch({
      type: 'setUploadState',
      payload: {
        uploadInfo: uploadInfo,
      },
    });
  };
  const updateTableList = () => {
    fetchTableData();
  };
  /**
   * 页面初始化
   */
  useEffect(() => {
    // 清空错误提示
    changeGlobalInfo(null);
    getLabelList();
  }, []);
  const newUploadProps = {
    name: 'file',
    accept: '.csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    maxCount: 1,
    progress: { strokeWidth: 2, showInfo: false },
    showUploadList: false,
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: () => {
      return false;
    },
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
    setUploadInfo(null);
    changeGlobalInfo(null);
    setUploadStatus(false);
    setFileList([]);
    setFileName('');
    setSelectLabelList([]);
  };
  const importClients = () => {
    if (checkLabelItem(selectLabelList)) {
      SiriusMessage.error({
        content: getIn18Text('CUNZAIBIAOQIANCHAOGUO20GEZIFU!'),
      });
      return;
    }
    let params = {
      file: fileList[0],
    };
    const formData = new FormData();
    formData.append('file', fileList[0]);
    formData.append('label_name_list', selectLabelList.join(','));
    formData.append('update', checkValue + '');
    setImportLoading(true);
    clientApi
      .uploadClientFile(formData)
      .then(res => {
        console.log('upload-file', res);
        const { status_code } = res;
        if (status_code === 'success' || status_code === 'part') {
          updateTableList();
        }
        changeGlobalInfo(res);
        onCancel();
        setImportLoading(false);
      })
      .catch(() => {
        setImportLoading(false);
        SiriusMessage.error({
          content: getIn18Text('WANGLUOYICHANG'),
        });
      });
    console.log('params', params);
  };
  // batchAddCompany
  /**
   * 更改和添加tag
   */
  const handleTagsChange = (tags: string[]) => {
    setSelectLabelList(tags);
    if (labelBackUp && labelBackUp.length) {
      setLabelList(labelBackUp);
    }
  };
  const getLabelList = (tags?: string) => {
    const param = {
      key: tags,
      label_type: 0,
    };
    clientApi.getLabelList(param).then(res => {
      const label = res.map(item => item.label_name).slice(0, 100); // 默认截图最大的50个
      setLabelList(label);
      if (!labelBackUp.length && label && label.length) {
        setLabelBackUp(label);
      }
    });
  };
  /**
   * 搜索tag
   */
  const handleTagsSearch = (tag: string) => {
    getLabelList(tag);
  };
  const getTemplate = () => {
    let reqUrl = urlStore.get('csutomerDownloadTemplate') as string;
    downloadTemplate(reqUrl, getIn18Text('KEHUDAORUMOBAN'));
  };
  /**
   * 新建用户数据
   */
  const renderForm = () => {
    return (
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
                    {/* <div className={style.fileSize}>共解析<span style={{ color: '#f7a87c'}}>{uploadInfo?.total_cnt}</span>个客户信息</div> */}
                  </div>
                  <CloseCircleFilled onClick={deleteFileData} />
                </div>
              </div>
              <div className={style.checkbox}>
                <Checkbox
                  onChange={e => {
                    setCheckValue(e.target.checked);
                  }}
                  value={checkValue}
                >
                  {getIn18Text('DANGDAORUDEKEHUHUOLIANXIRENYUYIYOUSHUJUZHONGFUSHI\uFF0CGENGXINSHUJU')}
                </Checkbox>
              </div>
              <div className={style.labelTitle}>{getIn18Text('BIAOQIAN(MOBANWEITIANXIEBIAOQIANDESHUJU\uFF0CHUISHIYONGCICHUBIAOQIAN)')}</div>
              <div className={style.selectWarp}>
                <Select
                  dropdownClassName="edm-selector-dropdown"
                  mode="tags"
                  style={{ width: '100%' }}
                  placeholder={getIn18Text('QINGSHURU/XUANZEBIAOQIAN')}
                  onSearch={throttle(handleTagsSearch, 1000)}
                  onChange={handleTagsChange}
                >
                  {labelList.map((item, index) => {
                    return (
                      <Select.Option key={index} value={item}>
                        {item}
                      </Select.Option>
                    );
                  })}
                </Select>
              </div>
              <div className={style.downlaodContent}>
                <a onClick={getTemplate}>{getIn18Text('XIAZAIMOBAN')}</a>
                <Button type="primary" loading={importLoading} disabled={importLoading} onClick={importClients}>
                  {getIn18Text('DAORUKEHUZILIAO')}
                </Button>
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
  };
  return (
    <>
      <Modal
        className={style.modalWrap}
        maskClosable={!uploadStatus}
        title={getIn18Text('PILIANGDAORUKEHUZILIAO')}
        width={476}
        bodyStyle={{ height: '252px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        visible={visible}
        destroyOnClose={true}
        footer={null}
        onCancel={onCancel}
      >
        <div className={style.modalContent}> {renderForm()}</div>
      </Modal>
    </>
  );
};
export default ImportClientModal;
