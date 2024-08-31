import SiriusModal from '@web-site/../../web-common/src/components/UI/Modal/SiriusModal';
import { Button, Form, Input, ModalProps, message } from 'antd';
import { api, apis, SiteApi } from 'api';
import React, { useState } from 'react';
import styles from './index.module.scss';

export interface UserInfoCollectModalProps extends ModalProps {
  onSubmitSuccess?: () => void;
}

interface UserInfoCollectModalFormSubmitValues {
  mobile: string;
  nickName: string;
  remark: string;
}

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

const UserInfoCollectModal: React.FC<UserInfoCollectModalProps> = props => {
  const { onSubmitSuccess, ...modalProps } = props;
  const [loading, setLoading] = useState(false);

  const onFinish = (values: UserInfoCollectModalFormSubmitValues) => {
    postSiteBuilderOpportunity(values);
  };

  // 验证手机号码
  const validateMobilePhoneNumber = (value: string) => {
    const reg = /^1[3456789]\d{9}$/;
    return reg.test(value);
  };

  // 验证座机号码
  const validateLandingPhoneNumber = (value: string) => {
    const reg = /^0\d{2,3}-?\d{7,8}$/;
    return reg.test(value);
  };

  const postSiteBuilderOpportunity = async (params: UserInfoCollectModalFormSubmitValues) => {
    setLoading(true);
    try {
      const result = await siteApi.reportSiteBuilderOpportunity({
        clueSource: 'WAIMAO_DESKTOP',
        clueType: 'FREE_TRIAL',
        mobile: params.mobile,
        productType: 'WEB_BUILDING',
        remark: params.remark,
        nickName: params.nickName,
      });
      if (result) {
        message.success('提交成功！');
        onSubmitSuccess && onSubmitSuccess();
      } else {
        message.error('服务端异常，请稍后重试！');
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      message.error(`${error}`);
    }
  };

  return (
    <SiriusModal className={styles.userInfoCollectModal} maskClosable={false} destroyOnClose={true} footer={null} width={448} {...modalProps}>
      <div className={styles.title}>建站咨询</div>
      <div className={styles.subTitle}>感谢咨询，我们将在24小时内与您联系</div>
      <div className={styles.formContainer}>
        <Form
          name="form"
          onFinish={onFinish}
          autoComplete="off"
          labelCol={{ span: 6 }}
          colon={false}
          style={{
            width: '100%',
            marginTop: 20,
          }}
        >
          <Form.Item label="联系人姓名" name="nickName" rules={[{ required: true, message: '联系人姓名不能为空' }]}>
            <Input placeholder="请输入联系人名称" maxLength={20} />
          </Form.Item>

          <Form.Item
            label="联系方式"
            name="mobile"
            rules={[
              { required: true, message: '联系方式不能为空' },
              ({ getFieldValue }) => ({
                validator(_, value: string) {
                  if (value === '' || value === undefined) return Promise.reject();
                  if (validateLandingPhoneNumber(value) || validateMobilePhoneNumber(value)) {
                    return Promise.resolve();
                  }

                  return Promise.reject(new Error('手机号或座机号码格式错误'));
                },
              }),
            ]}
          >
            <Input placeholder="请输入手机号码或电话" />
          </Form.Item>

          <Form.Item label="建站需求" name="remark">
            <Input.TextArea rows={3} placeholder="请填写您需要的建站需求（选填）" maxLength={500} />
          </Form.Item>

          <Form.Item
            style={{
              marginBottom: 0,
              marginTop: -2,
            }}
          >
            <Button loading={loading} className={styles.submitButton} style={{ float: 'right' }} type="primary" htmlType="submit">
              {loading ? '提交中' : '立即提交'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </SiriusModal>
  );
};

export default UserInfoCollectModal;
