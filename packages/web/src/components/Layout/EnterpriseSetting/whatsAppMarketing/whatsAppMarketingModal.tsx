import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Carousel, Button } from 'antd';
import { apiHolder, api, apis, Sender, WhatsAppApi, WhatsAppTemplate, InsertWhatsAppApi } from 'api';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import ArrowLeft from '@web-common/components/UI/Icons/svgs/disk/ArrowLeft';
import { Contents } from './contents';
import { BindingSetting } from './bindingSetting';
import { BindingForm } from '../insertWhatsApp/BindingForm';
import TemplateEditor from '@/components/Layout/SNS/WhatsApp/components/template/templateEditor';
import { BindStatus } from './index';
import style from './whatsAppMarketingModal.module.scss';
import { getIn18Text } from 'api';
const insertWhatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
export interface WhatsAppMarketingModalProps {
  visible: boolean;
  item?: Sender;
  bindStatus: BindStatus;
  updateBindStatus?: () => void;
  onClose?: () => void;
}
const Title = () => (
  <div className={style.modalTitle}>
    <h3>{getIn18Text('WhatsAppYINGXIAO')}</h3>
    <p>{getIn18Text('KUAISUSHIYONGwhatsapp QUNFAGONGNENG\uFF0CCHUDAQIANZAIKEHU')}</p>
  </div>
);
export const WhatsAppMarketingModal: React.FC<WhatsAppMarketingModalProps> = props => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<number>(0);
  const formRef = React.createRef();
  const carouselRef = useRef<any>(null);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [drafting, setDrafting] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { visible } = props;
  useEffect(() => {
    if (!props.visible) {
      setStep(0);
    } else {
      props.updateBindStatus && props.updateBindStatus();
    }
  }, [props.visible]);
  const modalTitle = useMemo(() => {
    return step === 0 ? (
      <Title />
    ) : (
      <Button type="text" className={style.backBtn} onClick={() => hanldePageChange(step === 2 ? 1 : 0)}>
        <ArrowLeft />
        {getIn18Text('FANHUISHANGYIBU')}
      </Button>
    );
  }, [step]);
  const handleOk = async () => {
    const sender: Sender = await formRef.current.validateFields();
    setLoading(true);
    try {
      await insertWhatsAppApi.addSender(sender);
      hanldePageChange(0);
    } catch (error: {
      message: string;
    }) {
      Toast.error({ content: error.message });
    }
    setLoading(false);
  };
  const hanldePageChange = (num: number) => {
    carouselRef.current.goTo(num);
    setStep(num);
    if (num === 0) {
      props.updateBindStatus && props.updateBindStatus();
    }
  };
  // 编辑框: 编辑内容 -> 存草稿
  const handleTemplateDraft = (template: WhatsAppTemplate) => {
    template.structure = JSON.stringify(template.structure) as any;
    // 新建场景: 新建草稿
    if (!editingTemplate || !editingTemplate.id) {
      setDrafting(true);
      whatsAppApi
        .createTemplateDraft(template)
        .then(
          () => {
            hanldePageChange(0);
            Toast.success({ content: getIn18Text('XINJIANCHENGGONG\uFF01') });
          },
          (error: { message: string }) => {
            Toast.error({ content: error.message });
          }
        )
        .finally(() => {
          setDrafting(false);
        });
    }
  };
  // 编辑框: 编辑内容 -> 提交审核
  const handleTemplateSubmit = (template: WhatsAppTemplate) => {
    template.structure = JSON.stringify(template.structure) as any;
    // 新建场景: 提交模板审核
    if (!editingTemplate || !editingTemplate.id) {
      setSubmitting(true);
      whatsAppApi
        .submitTemplate(template)
        .then(
          () => {
            hanldePageChange(0);
            Toast.success({ content: getIn18Text('TIJIAOCHENGGONG\uFF01') });
          },
          (error: { message: string }) => {
            Toast.error({ content: error.message });
          }
        )
        .finally(() => {
          setSubmitting(false);
        });
    }
  };
  const handleCancel = () => {
    if (step === 2) {
      hanldePageChange(1);
    } else {
      props.onClose && props.onClose();
    }
  };
  return (
    <SiriusModal
      className={style.marketingModal}
      visible={visible}
      title={modalTitle}
      onCancel={handleCancel}
      onOk={handleOk}
      okText={getIn18Text('BAOCUN')}
      confirmLoading={loading}
      width={820}
      footer={step !== 2 ? null : undefined}
    >
      <Carousel ref={carouselRef} effect="fade" dots={false}>
        {/** step 0 目录 */}
        <Contents goTo={hanldePageChange} {...props} />
        {/** step 1 绑定设置 */}
        <div className={style.stepItem}>
          <BindingSetting showTitle={true} goTo={hanldePageChange} {...props} />
        </div>
        {/** step 2 创建表单 */}
        <BindingForm ref={formRef} {...props} />
        {/** step 3 申请消息模板 */}
        <TemplateEditor
          template={editingTemplate}
          drafting={drafting}
          submitting={submitting}
          onCancel={() => hanldePageChange(0)}
          onDraft={handleTemplateDraft}
          onSubmit={handleTemplateSubmit}
        />
      </Carousel>
    </SiriusModal>
  );
};
