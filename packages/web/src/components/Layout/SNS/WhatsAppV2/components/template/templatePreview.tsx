import React from 'react';
import classnames from 'classnames';
import { getIn18Text, WhatsAppTemplateV2 } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import CloseIcon from '@web-common/components/UI/Icons/svgs/CloseMailSvg';
import TemplatePlaceholderImage from '@/images/icons/whatsApp/template-placeholder-image.png';
import { getComponentsItems } from '../../utils';
import style from './templatePreview.module.scss';

interface TemplatePreviewProps {
  className?: string;
  template: WhatsAppTemplateV2;
  showTemplateName?: boolean;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = props => {
  const { className, template, showTemplateName } = props;
  const { header, body, footer, buttons } = getComponentsItems(template);
  const buttonsFiltered = (buttons?.buttons || []).filter(button => button.text);

  return (
    <div className={classnames(style.templatePreview, className)}>
      {showTemplateName && <div className={style.name}>{template.name}</div>}
      {header && (
        <div className={style.header}>
          {header.format === 'IMAGE' && <img className={style.headerImage} src={header.example?.custom_header_handle_url || TemplatePlaceholderImage} />}
          {header.format === 'TEXT' && <div className={style.headerText}>{header.text}</div>}
        </div>
      )}
      {body && <div className={style.body}>{body.text}</div>}
      {footer?.text && <div className={style.footer}>{footer.text}</div>}
      {!!buttonsFiltered.length && (
        <div className={style.buttons}>
          {buttonsFiltered.map((button, index) => (
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

export const showTemplatePreviewModal = (template: WhatsAppTemplateV2) => {
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
};
