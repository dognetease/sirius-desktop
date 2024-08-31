import React from 'react';
import classnames from 'classnames';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { WhatsAppTemplate } from 'api';
import { SIDE_BAR_WIDTH } from '@web-common/utils/constant';
import CloseIcon from '@web-common/components/UI/Icons/svgs/CloseMailSvg';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import TemplatePlaceholderImage from '@/images/icons/whatsApp/template-placeholder-image.png';
import { getTemplateAvailable } from '@/components/Layout/SNS/WhatsApp/utils';
import style from './templatePreview.module.scss';
import { getIn18Text } from 'api';
interface TemplatePreviewProps {
  className?: string;
  template: WhatsAppTemplate;
  showTemplateName?: boolean;
}
const TemplatePreview: React.FC<TemplatePreviewProps> = props => {
  const { className, template, showTemplateName = false } = props;
  const templateAvailable = getTemplateAvailable(template);
  if (!templateAvailable) return <div className={classnames(style.templatePreview, className)}>{getIn18Text('[BUZHICHIDEMOBANLEIXING]')}</div>;
  return (
    <div className={classnames(style.templatePreview, className)}>
      {showTemplateName && <div className={style.name}>{template.name}</div>}
      {template.structure.header && (
        <div className={style.header}>
          {template.structure.header.format === 'IMAGE' && (
            <img className={style.headerImage} src={template.structure.header.mediaUrl || template.structure.header.example || TemplatePlaceholderImage} />
          )}
          {template.structure.header.format === 'TEXT' && <div className={style.headerText}>{template.structure.header.text}</div>}
        </div>
      )}
      <div className={style.body}>{template.structure.body.text}</div>
      {template.structure.footer && <div className={style.footer}>{template.structure.footer.text}</div>}
      {Array.isArray(template.structure.buttons) && (
        <div className={style.buttons}>
          {template.structure.buttons.map((button, index) => (
            <div className={style.button} key={index}>
              {button.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default TemplatePreview;
export const showTemplatePreviewModal = (template: WhatsAppTemplate) => {
  const templateAvailable = getTemplateAvailable(template);
  if (!templateAvailable) {
    Toast.error({ content: getIn18Text('BUZHICHIDEMOBANLEIXING') });
  } else {
    const content = <TemplatePreview className={style.templatePreviewModalContent} template={template} />;
    Modal.info({
      className: style.templatePreviewModal,
      title: getIn18Text('MOBANYULAN'),
      content,
      okText: getIn18Text('GUANBI'),
      centered: true,
      closeIcon: <CloseIcon />,
      closable: true,
      maskClosable: true,
    });
  }
};
