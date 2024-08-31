import React, { useState } from 'react';
import styles from './index.module.scss';
import { Form, Input, Button, message } from 'antd';
import Loading from '../../../images/seo-config/loading.gif';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { api, apis, SiteApi } from 'api';

interface AICreateSeoConfigProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, keyword: string, description: string) => void;
}

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

export const AICreateSeoConfig = (props: AICreateSeoConfigProps) => {
  const [loadingMaskVisible, setLoadingMaskVisible] = useState<boolean>(false);
  const handleSubmit = async (value: { description: string }) => {
    setLoadingMaskVisible(true);
    const { description: inputDescription } = value;

    const res = await siteApi.getAiSiteSeoTkd({ description: inputDescription });
    const { description, keyword, title } = res;
    props.onSubmit(title, keyword, description);
    props.onClose();
    message.success('生成成功');
    setLoadingMaskVisible(false);
  };

  return (
    <Modal
      visible={props.visible}
      getContainer={false}
      width={480}
      title={null}
      footer={null}
      maskClosable={false}
      className={styles.createSeoConfig}
      destroyOnClose={true}
      onCancel={props.onClose}
    >
      <p className={styles.title}>
        <span>AI</span>智能生成 SEO
      </p>
      <p className={styles.subTitle}>自动生成标题、关键词、描述等 SEO 配置信息</p>
      {loadingMaskVisible && (
        <div className={styles.loadMask}>
          <img src={Loading} />
        </div>
      )}
      <Form onFinish={handleSubmit} requiredMark={false} colon={false}>
        <p>请输入您公司的描述，描述越详细生成的内容越精准</p>
        <Form.Item name="description" label={null} rules={[{ required: true, whitespace: true, type: 'string', message: '请输入您公司的描述!' }]}>
          <Input.TextArea
            maxLength={1000}
            placeholder="如：我们是一家位于江苏省南京市的外贸公司，主营商品是电视机顶盒，客户分布在欧美国家，商品多种多样，可满足客户的个性化、定制化的需求。"
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            立即生成
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};
