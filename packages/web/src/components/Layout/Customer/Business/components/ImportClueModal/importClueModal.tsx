/*
 * @Author: sunmingxin
 * @Date: 2021-10-08 17:59:17
 * @LastEditTime: 2021-10-25 21:56:08
 * @LastEditors: sunmingxin
 */
import React, { useState } from 'react';
import { Upload, Button, message } from 'antd';
import CloseCircleFilled from '@ant-design/icons/CloseCircleFilled';
import IconCard from '@web-common/components/UI/IconCard';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder, apis, CustomerApi } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './importClueModal.module.scss';

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

  const changeGlobalInfo = (uploadInfo: any) => {};
  const updateTableList = () => {};

  /**
   *  上传参数
   */
  const uploadProps = {
    name: 'file',
    accept: '.csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    action: clientApi.uploadClientFile(),
    maxCount: 1,
    progress: { strokeWidth: 2, showInfo: false },
    onChange(info) {
      console.log('upload-file', info);
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        const { fileList } = info;
        const { name, response } = fileList[0];
        const { data, success, message } = response;
        if (success) {
          const { company_list, total_cnt, success_cnt, fail_cnt, message } = data;
          const upInfo = {
            name,
            total_cnt,
            success_cnt,
            fail_cnt,
            company_list,
          };
          setUploadInfo(upInfo);
          setUploadStatus(true);
          SiriusMessage.success({
            content: message,
            duration: 3,
          });
        } else {
          SiriusMessage.error({
            content: message,
          });
        }
      } else if (info.file.status === 'error') {
        const { fileList } = info;
        delete fileList[0].error;
        message.error(`文件解析失败`);
      }
    },
  };
  /**
   * 回复上传前的状态
   */
  const deleteFileData = () => {
    setUploadInfo(null);
    changeGlobalInfo(null);
    setUploadStatus(false);
    setSelectLabelList([]);
  };

  const importClients = () => {
    const param = {
      company_list: uploadInfo?.company_list,
      label_name_list: selectLabelList,
    };
    clientApi.batchAddCompany(param).then(res => {
      console.log('返回导入状态', res);
      const { status_code } = res;
      // status_code: "success" //操作的状态， empty数据为空, success全部成功, part部分成功，fail全部失败
      // 有数据更新成功就会更新table
      if (status_code === 'success' || status_code === 'part') {
        updateTableList();
      }
      changeGlobalInfo(res);
      onCancel();
    });
  };

  // 注意模板链接的替换
  const getTemplate = () => {
    clientApi.clueTemplate().then(res => {
      window.location.href = res;
    });
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
                    <div className={style.fileName}>{uploadInfo?.name}</div>
                    <div className={style.fileSize}>
                      共解析<span style={{ color: '#f7a87c' }}>{uploadInfo?.total_cnt}</span>个客户信息
                    </div>
                  </div>
                  <CloseCircleFilled onClick={deleteFileData} />
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Button type="primary" onClick={importClients}>
                  导入通讯录
                </Button>
                <a className={style.download} onClick={getTemplate}>
                  下载模版
                </a>
              </div>
            </div>
          )}
          {!uploadStatus && (
            <div style={{ textAlign: 'center' }}>
              <Upload {...uploadProps}>
                <Button type="primary">选择文件</Button>
              </Upload>
              <p className={style.fileTypeDesc}>
                支持xls、csv文件格式
                <a className={style.download} onClick={getTemplate}>
                  下载模版
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
        title="批量导入客户资料"
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
