import React, { useState } from 'react';
import classnames from 'classnames';
import { WhatsAppTemplate } from 'api';
import { Button } from 'antd';
import TemplatePreview from './templatePreview';
import CreateTemplateImage from '@/images/icons/whatsApp/create-template.png';
import { getTemplateAvailable } from '@/components/Layout/SNS/WhatsApp/utils';
import style from './templateCard.module.scss';
import { getIn18Text } from 'api';
interface TemplateCardProps {
  className?: string;
  type?: 'create' | 'preview';
  template?: WhatsAppTemplate;
  onCreate?: () => void;
  onPreview?: (template: WhatsAppTemplate) => void;
  onUse?: (template: WhatsAppTemplate) => void;
}
const TemplateCard: React.FC<TemplateCardProps> = props => {
  const { className, type, template, onCreate, onPreview, onUse } = props;
  const [entered, setEntered] = useState<boolean>(false);
  const templateAvailable = !!template && getTemplateAvailable(template);
  return (
    <div
      className={classnames(style.templateCard, className, {
        [style.entered]: entered,
      })}
      onMouseEnter={() => setEntered(true)}
      onMouseLeave={() => setEntered(false)}
    >
      <div className={style.body}>
        {type === 'create' && (
          <div className={style.createTemplate} onClick={onCreate}>
            <img className={style.createTemplateImage} src={CreateTemplateImage} />
          </div>
        )}
        {type === 'preview' &&
          template &&
          (templateAvailable ? (
            <TemplatePreview className={style.templatePreview} template={template} />
          ) : (
            <div className={style.unsupported}>{getIn18Text('[BUZHICHIDEMOBANLEIXING]')}</div>
          ))}
      </div>
      <div
        className={classnames(style.footer, {
          [style.create]: type === 'create',
        })}
      >
        {type === 'create' && getIn18Text('XINJIANMOBAN')}
        {type === 'preview' && template && template.name}
        {type === 'preview' && template && templateAvailable && (
          <div className={style.operations}>
            <Button size="small" onClick={() => onPreview && onPreview(template)}>
              {getIn18Text('YULAN')}
            </Button>
            <Button type="primary" size="small" onClick={() => onUse && onUse(template)}>
              {getIn18Text('SHIYONG')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
export default TemplateCard;
