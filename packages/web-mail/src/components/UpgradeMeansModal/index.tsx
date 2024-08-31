import React, { useState, useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import './index.scss';
import { apiHolder as api, SystemApi, User, apis, ProductAuthApi } from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';
interface FormProps {
  nickName: string;
  mobile: string;
}
interface Props {
  visible: boolean;
  onClose: (origin?: string) => void;
}
const systemApi = api.api.getSystemApi() as SystemApi;
// const MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApiType;
const productAuthApi = api.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const UpgradeMeansModal: React.FC<Props> = ({ visible, onClose }) => {
  const [form] = Form.useForm<FormProps>();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [allowClearByName, setAllowClearByName] = useState(false);
  const [allowClearByMoblie, setAllowClearByMoblie] = useState(false);
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      console.log('Success:', values);
      if (values.nickName.trim().length === 0 || values.mobile.trim().length === 0) {
        SiriusMessage.error({
          content: getIn18Text('QINGSHURUXINGMING11'),
        });
        return;
      }
      setConfirmLoading(true);
      let params = form.getFieldsValue();
      productAuthApi
        .createPubClue({ ...params, contactRole: '1', subOrigin: getIn18Text('YOUJIANZHUIZONGXU') })
        .then(res => {
          if (res.code === 200) {
            onClose('success');
            productAuthApi.savePubClueTime().then();
          } else {
            SiriusMessage.error({
              content: getIn18Text('TIJIAOSHIBAI'),
            });
          }
        })
        .catch(() => {
          SiriusMessage.error({
            content: getIn18Text('WANGLUOSHIBAI\uFF0C'),
          });
        })
        .finally(() => {
          setConfirmLoading(false);
        });
    } catch (errorInfo) {
      console.log('Failed:', errorInfo);
    }
  };
  const renderTitle = (
    <div>
      <div className="upgrade-title">{getIn18Text('SHENGJIZILIAOTIAN')}</div>
      <div className="upgrade-describe">{getIn18Text('SHENGJIFUWUTAO11')}</div>
    </div>
  );
  useEffect(() => {
    const { nickName, mobile } = systemApi.getCurrentUser() as User;
    form.setFieldsValue({
      nickName: nickName || '',
      mobile: mobile || '',
    });
  }, []);
  return (
    <>
      <Modal
        className="upgradeModel"
        title={renderTitle}
        width={480}
        visible={visible}
        maskClosable={false}
        okText={getIn18Text('TIJIAO')}
        confirmLoading={confirmLoading}
        cancelText={getIn18Text('FANGQI')}
        destroyOnClose={true}
        onOk={handleOk}
        onCancel={() => onClose()}
      >
        <Form form={form} name="basic" labelCol={{ span: 5 }} wrapperCol={{ span: 19 }} initialValues={{ name: '', mobile: '' }} autoComplete="off" labelAlign="left">
          <Form.Item
            label={getIn18Text('XINGMING')}
            name="nickName"
            rules={[
              { required: true, message: getIn18Text('QINGSHURUXINGMING') },
              { type: 'string', max: 25, message: getIn18Text('XINGMINGBUNENGCHAO') },
            ]}
          >
            <Input
              allowClear={allowClearByName}
              placeholder={getIn18Text('QINGSHURUXINGMING')}
              onBlur={() => {
                allowClearByName && setAllowClearByName(false);
              }}
              onFocus={() => {
                !allowClearByName && setAllowClearByName(true);
              }}
            />
          </Form.Item>

          <Form.Item
            label={getIn18Text('LIANXIFANGSHI')}
            name="mobile"
            rules={[{ required: true, message: getIn18Text('QINGSHURULIANXI11') }]}
            style={{ marginBottom: '0px' }}
          >
            <Input
              allowClear={allowClearByMoblie}
              onBlur={() => {
                allowClearByMoblie && setAllowClearByMoblie(false);
              }}
              onFocus={() => {
                !allowClearByMoblie && setAllowClearByMoblie(true);
              }}
              placeholder={getIn18Text('QINGSHURULIANXI11')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
export default UpgradeMeansModal;
