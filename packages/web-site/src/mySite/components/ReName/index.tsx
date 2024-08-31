import React, { useState, useEffect } from 'react';
import type { RcFile } from 'antd/es/upload/interface';
import styles from './index.module.scss';
import { Form, Input, Upload, message } from 'antd';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { api, apis, SiteApi, getIn18Text } from 'api';
import { ReactComponent as LoadingIcon } from '../../../images/loading-small.svg';
import { ReactComponent as AddIcon } from '../../../images/add.svg';
import { ReactComponent as ReplaceIcon } from '../../../images/replace-icon-s.svg';
import { ReactComponent as DeleteIcon } from '../../../images/delete-icon-s.svg';

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

interface ReNameProps {
  visible: boolean;
  onClose?: ((e: React.MouseEvent<HTMLElement, MouseEvent>) => void) | undefined;
  onOk: (value: any) => void;
  data: {
    siteName: string;
    icon: string;
  };
}

interface ReNameInputProps {
  value?: string;
  onChange?: (value: React.ChangeEvent<HTMLInputElement>) => void;
}

const ReNameInput: React.FC<ReNameInputProps> = props => {
  const handleChange = (value: React.ChangeEvent<HTMLInputElement>) => {
    props.onChange?.(value);
  };

  return (
    <div className="site-name">
      <Input placeholder="名称用于浏览器标签页，对外可见" defaultValue={props.value} onChange={handleChange} maxLength={500} />
    </div>
  );
};

export const ReName: React.FC<ReNameProps> = props => {
  const [icon, setIcon] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (props.data.icon) setIcon(props.data.icon);
  }, [props.data]);

  const checkSiteName = (rule: any, value: string) => {
    if (value && value.trim()) {
      //校验条件自定义
      return Promise.resolve();
    }
    return Promise.reject('网站名称不能为空');
  };

  const beforeUpload = async (file: RcFile, _fileList: RcFile[]) => {
    const isJpgOrPng = file.type === 'image/png' || file.type === 'image/jpeg';
    if (!isJpgOrPng) {
      message.error('请选择png/jpg格式图片');
      return false;
    }
    const isLt5M = file.size / 1024 < 50;
    if (!isLt5M) {
      message.error('图片大小不能超过 50KB!');
      return false;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    siteApi.siteUploadFile(formData).then(data => {
      if (data) {
        setIcon(data.fileUrl);
        setLoading(false);
      }
    });
    return false;
  };

  const onSubmit = (data: any) => {
    if (loading) {
      message.error('图片上传中，请稍候');
      return;
    }
    data.icon = icon;
    props.onOk(data);
  };

  return (
    <Modal
      visible={props.visible}
      getContainer={false}
      width={480}
      title="网站管理"
      footer={null}
      maskClosable={false}
      className={styles.rename}
      destroyOnClose={true}
      onCancel={props.onClose}
    >
      <Form className={styles.semForm} initialValues={props.data} onFinish={onSubmit} labelCol={{ span: 5 }} wrapperCol={{ span: 19 }} colon={false}>
        <Form.Item labelAlign="left" name="siteName" label="网站名称" rules={[{ required: true, validator: checkSiteName }]}>
          <ReNameInput />
        </Form.Item>
        <Form.Item labelAlign="left" name="icon" label="浏览器图标">
          <div className={styles.uploaderContainer}>
            <div className={styles.uploaderDragger}>
              <Upload.Dragger accept="image/png,image/jpeg" beforeUpload={beforeUpload} showUploadList={false}>
                <div className={styles.uploaderContent}>
                  {loading ? (
                    <div className={styles.uploaderFileBox}>
                      <div className={styles.loading}>
                        <LoadingIcon />
                      </div>
                    </div>
                  ) : (
                    <>
                      {icon ? (
                        <div className={styles.uploaderFileBox}>
                          <div className={styles.uploaded}>
                            <div className={styles.mask}>
                              <div className={styles.opContainer}>
                                <ReplaceIcon />
                                <div className={styles.replaceText}>替换</div>
                              </div>
                              <div
                                className={styles.opContainer}
                                onClick={e => {
                                  e.stopPropagation();
                                  setIcon('');
                                }}
                              >
                                <DeleteIcon />
                                <div className={styles.replaceText}>删除</div>
                              </div>
                            </div>
                            <img src={icon} />
                          </div>
                        </div>
                      ) : (
                        <AddIcon />
                      )}
                    </>
                  )}
                </div>
              </Upload.Dragger>
            </div>
            <div className={styles.uploadTips}>建议上传尺寸为80x80PX，大小不超过50KB，格式：jpg，png</div>
          </div>
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 5, span: 19 }}>
          <Button btnType="minorLine" type="button" onClick={props.onClose}>
            {getIn18Text('QUXIAO')}
          </Button>
          <Button btnType="primary" type="submit">
            {getIn18Text('QUEDING')}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};
