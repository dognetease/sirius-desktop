import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { apiHolder, apis, WhatsAppTemplate, WhatsAppApi } from 'api';
import TemplateCard from './templateCard';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './templateStore.module.scss';
import { getIn18Text } from 'api';
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
interface TemplateStoreProps {
  className?: string;
  visible?: boolean;
  onCancel: () => void;
  onCreate: () => void;
  onPreview: (template: WhatsAppTemplate) => void;
  onUse: (template: WhatsAppTemplate) => void;
}
const TemplateStore: React.FC<TemplateStoreProps> = props => {
  const { className, visible, onCancel, onCreate, onPreview, onUse } = props;
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  useEffect(() => {
    whatsAppApi.getPublicTemplates().then(data => {
      const nextTemplates = data.map(template => {
        const structure = JSON.parse(template.structure as unknown as string);
        return { ...template, structure };
      });
      setTemplates(nextTemplates);
    });
  }, []);
  return (
    <Modal
      className={classnames(style.templateStore, className)}
      title={
        <>
          <div className={style.title}>{getIn18Text('WhatsApp BusinessXINJIANMOBAN')}</div>
          <div className={style.subTitle}>{getIn18Text('MOBANKU')}</div>
        </>
      }
      width={716}
      footer={null}
      visible={visible}
      onCancel={onCancel}
    >
      <TemplateCard type="create" onCreate={onCreate} />
      {templates.map((template, index) => (
        <TemplateCard key={index} type="preview" template={template} onPreview={onPreview} onUse={onUse} />
      ))}
    </Modal>
  );
};
export default TemplateStore;
