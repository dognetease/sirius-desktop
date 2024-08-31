import React, { useState, useEffect, useRef } from 'react';
import { Button, Form, Input, message, Upload, Tooltip } from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import type { FormInstance } from 'antd/es/form';
import CopyToClipboard from 'react-copy-to-clipboard';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { api, apis, SiteApi, SystemApi, apiHolder, DataTrackerApi, DomainOrderConfirmReq } from 'api';
import { ReactComponent as CopyIcon } from '../../../images/copy.svg';
import { ReactComponent as AddIcon } from '../../../images/add.svg';
import { ReactComponent as LoadingIcon } from '../../../images/loading-small.svg';
import { ReactComponent as DeleteIcon } from '../../../images/delete.svg';
import styles from './style.module.scss';
import { goOrderManage } from '@web-site/mySite/utils';

const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

interface TransferModalProps {
  transferInfoVisible: boolean;
  onTransferInfoClose: () => void;
  price: number;
  onSubmit: (params: Omit<DomainOrderConfirmReq, 'orderId'>) => void;
  transformInfoList: Array<{ name: string; value: string }>;
}

interface FileItem extends UploadFile {
  fileKey?: string;
}

export default function TransferModal(props: TransferModalProps) {
  // 线下转账-汇款信息 弹窗
  const { transferInfoVisible, onTransferInfoClose, onSubmit, transformInfoList } = props;
  // 线下转账-提交付款凭证 弹窗
  const [transferCertVisible, setTransferCertVisible] = useState(false);
  const formRef = React.useRef<FormInstance>(null);

  const onCopy = (name: string) => {
    message.success(name + '复制成功');
  };

  // const transformInfoList = [
  //   {
  //     name: '收款户名',
  //     value: '杭州网易竹邮科技有限公司'
  //   },
  //   {
  //     name: '收款银行',
  //     value: '中国工商银行股份有限公司杭州分行'
  //   },
  //   {
  //     name: '银行账号',
  //     value: '1202021109800368815'
  //   }
  // ];

  const onFinish = (values: any) => {
    // console.log('Success:', values, fileList);
    onSubmit({
      platForm: 3,
      attachmentUrlList: fileList.map(file => file.url!),
      payAccount: values.account,
      payAccountName: values.name,
    });
  };

  const [fileList, setFileList] = useState<FileItem[]>([]);
  // 用于保存 fileList 数据
  const fileListRef = useRef<FileItem[]>([]);

  const getBase64 = (img: RcFile): Promise<string> => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result as string));
      reader.readAsDataURL(img);
    });
  };

  const beforeUpload = async (file: RcFile, _fileList: RcFile[]) => {
    if (fileList.length >= 3) {
      return false;
    }
    const isJpgOrPng = file.type === 'image/png' || file.type === 'image/jpeg';
    if (!isJpgOrPng) {
      // message.error('请选择png/jpg格式图片');
      return false;
    }
    // const isLt5M = file.size / 1024 / 1024 < 10;
    // if (!isLt5M) {
    //   message.error('图片大小不能超过 10MB!');
    //   return false;
    // }
    const base64Url = await getBase64(file);
    fileListRef.current = [
      ...fileListRef.current,
      {
        uid: file.uid,
        name: file.name,
        status: 'uploading',
        url: base64Url,
      },
    ];
    setFileList([...fileListRef.current]);

    const formData = new FormData();
    formData.append('file', file);
    siteApi.siteUploadFile(formData).then(data => {
      let fileItem = fileListRef.current.find(item => item.uid == file.uid);
      if (fileItem && data) {
        fileItem.status = 'done';
        fileItem.url = data.fileUrl;
        fileItem.fileKey = data.fileKey;
        setFileList([...fileListRef.current]);
        formRef.current?.validateFields();
      }
    });
    return false;
  };

  const handleDeleteFile = (index: number) => {
    fileListRef.current.splice(index, 1);
    setFileList([...fileListRef.current]);
  };

  const checkFiles = () => {
    if (fileList.length == 0) {
      return Promise.reject('请上传付款凭证');
    }
    if (fileList.some(file => file.status == 'uploading')) {
      return Promise.reject('图片正在上传中');
    }
    return Promise.resolve();
  };

  return (
    <>
      <Modal
        title="汇款信息"
        okText="已转帐，提交汇款凭证"
        cancelText="取消"
        visible={transferInfoVisible}
        maskClosable={false}
        width={412}
        onCancel={goOrderManage}
        className={styles.transferModal}
        onOk={() => {
          onTransferInfoClose();
          setTransferCertVisible(true);
        }}
      >
        <p className={styles.transferModalDesc}>请您转账 ¥{props.price} 元至以下账户，转账成功后请及时提供汇款凭证，汇款信息核实后，我们将为您开通服务</p>
        {transformInfoList.map((item, index) => (
          <div className={styles.transferModalItem} key={index}>
            <div className={styles.transferModalName}>{item.name}：</div>
            <div className={styles.transferModalValue}>
              {item.value}
              <CopyToClipboard text={item.value} onCopy={() => onCopy(item.name)}>
                <Tooltip title="复制" placement="top" align={{ targetOffset: [0, -4] }}>
                  <CopyIcon />
                </Tooltip>
              </CopyToClipboard>
            </div>
          </div>
        ))}
      </Modal>

      <Modal title="提交付款凭证" visible={transferCertVisible} maskClosable={false} width={480} onCancel={goOrderManage} className={styles.transferModal} footer={null}>
        <p className={styles.transferModalDesc}>为了核实订单的支付情况，请填写您支付时使用的付款人户名等信息</p>

        <Form labelCol={{ span: 5 }} wrapperCol={{ span: 19 }} onFinish={onFinish} ref={formRef} colon={false}>
          <Form.Item name="name" label="付款人户名" required={true} rules={[{ required: true, message: '请输入付款人户名' }]}>
            <Input placeholder="请输入付款人户名" maxLength={100} />
          </Form.Item>
          <Form.Item name="account" label="付款人账号" required={true} rules={[{ required: true, message: '请输入付款人账号' }]}>
            <Input placeholder="请输入付款人账号" maxLength={100} />
          </Form.Item>
          <Form.Item name="files" label="付款凭证" required={true} rules={[{ validator: checkFiles }]}>
            {fileList.map((file, index) => (
              <div key={file.uid} className={styles.uploaderFileBox}>
                <img src={file.url} />
                {file.status == 'uploading' ? (
                  <div className={styles.loading}>
                    <LoadingIcon />
                  </div>
                ) : (
                  <div className={styles.mask}>
                    <DeleteIcon onClick={() => handleDeleteFile(index)} />
                  </div>
                )}
              </div>
            ))}
            {fileList.length < 3 ? (
              <div className={styles.uploaderDrager}>
                <Upload.Dragger accept="image/png,image/jpeg" multiple beforeUpload={beforeUpload} showUploadList={false}>
                  <AddIcon />
                </Upload.Dragger>
              </div>
            ) : null}

            <div className={styles.uploadTips}>请选择本地图片，支持png/jpg格式，最多上传3张图片</div>
          </Form.Item>
          <Form.Item
            // name="price"
            label="应付金额"
          >
            <div className={styles.transferModalPrice}>¥{props.price}</div>
          </Form.Item>

          <Form.Item>
            <Button type="text" onClick={goOrderManage}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              提交
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
