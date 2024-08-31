import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { api, apis, InsertWhatsAppApi, WaGPTConfigRes, WaGPTQuotaRes } from 'api';
import { Input, Button, Form, Select, Radio, Col, Row } from 'antd';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { TongyongJiazai } from '@sirius/icons';
import style from './aISessionAssistant.module.scss';

const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const AISessionAssistant: React.FC<Props> = ({ isModalOpen, setIsModalOpen }) => {
  const [quota, setQuota] = useState<WaGPTQuotaRes>({
    available: 0,
    total: 0,
  });
  const [config, setConfig] = useState<WaGPTConfigRes>({
    languages: [],
    tones: [],
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [form] = Form.useForm();
  const [submittable, setSubmittable] = useState(false);
  const [isOther, setIsOther] = useState<boolean>(false);

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setResult('');
  };

  const generateContent = () => {
    setGenerating(true);
    const payload = form.getFieldsValue();
    if (payload.hasOwnProperty('customTone')) {
      payload.tone = payload.customTone;
      delete payload.customTone;
      if (!payload.tone) {
        delete payload.tone;
      }
    }

    whatsAppApi
      .getWaGPTMsg(payload)
      .then(data => {
        setResult(data.text);
      })
      .finally(() => {
        setGenerating(false);
        whatsAppApi.getWaGPTQuota().then(setQuota);
      });
  };

  const onValuesChange = (changedValues, allValues) => {
    if (allValues.tone === '其他') {
      setIsOther(true);
    } else {
      setIsOther(false);
    }
    if (allValues.originalContent) {
      setSubmittable(true);
    } else {
      setSubmittable(false);
      form.validateFields();
    }
  };

  useEffect(() => {
    if (quota.available < 1) {
      setSubmittable(false);
    }
  }, [quota.available]);

  useEffect(() => {
    whatsAppApi.getWaGPTConfig().then(setConfig);
    whatsAppApi.getWaGPTQuota().then(setQuota);
  }, []);

  return (
    <>
      <Modal
        width={640}
        title={
          <div className={style.modalTitle}>
            AI会话助手<span className={style.hint}>今日还可使用{quota.available}次</span>
          </div>
        }
        visible={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        getContainer={false}
      >
        <Form layout="vertical" onValuesChange={onValuesChange} initialValues={{ language: 'English - 英语', wordCountLevel: 0 }} form={form}>
          <Row>
            <Col span={11}>
              <Form.Item label="输出会话使用的语言" name="language">
                <Select options={config.languages.map(({ label }) => ({ label, value: label }))} />
              </Form.Item>
            </Col>
            <Col span={2} />
            <Col span={11}>
              <Form.Item label="会话语气" name="tone">
                <Select options={config.tones.map(item => ({ label: item, value: item }))} allowClear />
              </Form.Item>
              {isOther ? (
                <Form.Item name="customTone">
                  <Input maxLength={60} />
                </Form.Item>
              ) : null}
            </Col>
          </Row>
          <Form.Item label="描述会话内容" name="originalContent" rules={[{ required: true, message: '请输入' }]}>
            <Input.TextArea rows={5} maxLength={500} showCount placeholder="可描述会话内容或用途，以便于更有目的性的生成内容，如：一个月内订单有10%的特别优惠" />
          </Form.Item>
          <Form.Item label="输出字数限制" name="wordCountLevel">
            <Radio.Group size="small">
              <Radio value={0}>不限字数</Radio>
              <Radio value={1}>100字（词）以内</Radio>
              <Radio value={2}>100-300字（词）</Radio>
              <Radio value={3}>300字（词）以上</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
        {!result && (
          <div className={style.generateContent}>
            <Button
              type="primary"
              onClick={() => {
                generateContent();
              }}
              loading={generating}
              disabled={!submittable}
            >
              生成会话内容
            </Button>
          </div>
        )}
        {result && (
          <div className={style.content}>
            <h5 className={style.contentName}>生成内容如下</h5>
            <div className={style.contentHeader}>
              <div className={style.translateBox}>
                {/* <span>文</span>
                <span>译</span> */}
              </div>
              <div className={style.operate}>
                <Button
                  loading={generating}
                  onClick={() => {
                    generateContent();
                  }}
                  disabled={!submittable}
                >
                  重新生成
                </Button>
                <CopyToClipboard text={result} onCopy={() => Toast.success('复制成功')}>
                  <Button>一键复制</Button>
                </CopyToClipboard>
              </div>
            </div>
            <div className={style.contentBody}>
              {generating && (
                <div className={style.loading}>
                  <TongyongJiazai />
                  <span>正在生成...</span>
                </div>
              )}
              <div className={classnames(generating && style.generating)}>{result}</div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AISessionAssistant;
