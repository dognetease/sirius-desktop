import React, { useState } from 'react';
import styles from './index.module.scss';
import { Form, Input, Button, message } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { api, apis, SiteApi, CreateSiteOuterReq, getIn18Text } from 'api';
import { ReactComponent as Step0 } from '../../../images/step-0.svg';
import { ReactComponent as Step0A } from '../../../images/step-0-active.svg';
import { ReactComponent as Step1 } from '../../../images/step-1.svg';
import { ReactComponent as Step1A } from '../../../images/step-1-active.svg';
import { useOpenHelpCenter } from '@web-common/utils/utils';

interface CreateCustomSiteProps {
  visible: boolean;
  onClose?: ((e: React.MouseEvent<HTMLElement, MouseEvent>) => void) | undefined;
  onOk: () => void;
  onBindSuccess?: () => void;
}

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const validDomain = (url: string) => {
  const reg = /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/;
  return reg.test(url);
};

export const CreateCustomSite: React.FC<CreateCustomSiteProps> = props => {
  const [step, setStep] = useState(0);
  const [submiting, setSubmiting] = useState(false);
  const [withError, setWithError] = useState(false);
  const [withError2, setWithError2] = useState(false);
  const openHelpCenter = useOpenHelpCenter();

  const checkSiteName = (rule: any, value: string) => {
    if (value && value.trim()) {
      //校验条件自定义
      return Promise.resolve();
    }

    setWithError(true);
    return Promise.reject('站点名称不能为空');
  };

  const checkSiteAddr = (rule: any, value: string) => {
    if (value && value.trim()) {
      //校验条件自定义
      if (!validDomain(value)) {
        setWithError2(true);
        return Promise.reject('请输入正确的域名');
      }
      setWithError2(false);
      return Promise.resolve();
    }

    setWithError2(true);
    return Promise.reject('站点域名不能为空');
  };

  const goNext = async ({ outerAddress, siteName }: CreateSiteOuterReq) => {
    setSubmiting(true);
    try {
      const res = await siteApi.createSiteOuter({
        siteName,
        outerAddress,
      });
      setStep(1);
    } catch (e) {
      console.log(e);
    }
    setSubmiting(false);
  };

  const goHelpCenter = () => {
    // window.open('https://waimao.163.com/knowledgeCenter#/d/1648880634472517633.html');
    openHelpCenter('/d/1648880634472517633.html');
  };

  const handleCancel = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (step === 1) {
      props.onBindSuccess && props.onBindSuccess();
    }

    props.onClose && props.onClose(e);
  };

  const handleOk = () => {
    if (step === 1) {
      props.onBindSuccess && props.onBindSuccess();
    }
    props.onOk && props.onOk();
  };

  return (
    <Modal
      zIndex={800}
      visible={props.visible}
      getContainer={false}
      width={480}
      title="站点绑定"
      footer={null}
      maskClosable={false}
      className={styles.createCustomSite}
      destroyOnClose={true}
      onCancel={handleCancel}
    >
      <div className="steps-container">
        {step === 0 ? <Step0A /> : <Step0 />}
        <div>域名绑定</div>
        <div className="line" />
        {step === 1 ? <Step1A /> : <Step1 />}
        <div>数据关联</div>
      </div>
      {step === 0 ? (
        <Form onFinish={goNext}>
          <Form.Item name="siteName" rules={[{ required: true, validator: checkSiteName }]} style={{ marginBottom: withError ? '20px' : '' }}>
            <Input placeholder={getIn18Text('QINGSHURUZHANDIANMINGCHENG')} maxLength={500} />
          </Form.Item>

          <Form.Item name="outerAddress" rules={[{ required: true, validator: checkSiteAddr }]} style={{ marginBottom: withError2 ? '10px' : '' }}>
            <Input placeholder="请输入站点域名" />
          </Form.Item>
          <Form.Item>
            <Button style={{ width: submiting ? '94px' : '78px' }} loading={submiting} type="primary" htmlType="submit">
              {submiting ? '提交中...' : getIn18Text('XIAYIBU')}
            </Button>
          </Form.Item>
        </Form>
      ) : (
        <div className="step-1-container">
          <div className="content">请点击对接文档，查看站点绑定流程</div>
          <div className="info" onClick={goHelpCenter}>
            查看对接文档
          </div>
          <div className="footer">
            <Button onClick={handleOk} type="primary" htmlType="submit">
              完成
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
