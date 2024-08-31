import React from 'react';
import { PageProps } from 'gatsby';
import { getParameterByName, safeDecodeURIComponent } from '@web-common/utils/utils';
import { AttachmentView } from '@web-common/state/state';
import '@/styles/global.scss';
import PreviewContent from '@web-mail/components/AttachmentPreview/PreviewContent';
import { useActions, AttachmentActions } from '@web-common/state/createStore';
import { ATTACHMENT_KEYS } from '@web-mail/common/components/vlistCards/MailCard/DefaultAttachment';
import SiriusLayout from '@/layouts';

// 附件需要通过search传递的key

const attachmentPage: React.FC<PageProps> = props => {
  const { location } = props;
  const attachmentActions = useActions(AttachmentActions);
  // 获取url中传递的参数
  const downloadContentId = safeDecodeURIComponent(getParameterByName('outDownloadContentId', location.search) || '');
  const attachment: Partial<Record<string, string>> = {};
  ATTACHMENT_KEYS.forEach(k => {
    if (k === 'filePreviewUrl') {
      attachment[k] = getParameterByName(k, location.search) || '';
      return;
    }
    attachment[k] = safeDecodeURIComponent(getParameterByName(k, location.search) || '');
  });
  attachmentActions.doAttachmentPreview({
    visible: true,
    downloadContentId,
    attachments: [attachment as unknown as AttachmentView],
  });

  return (
    <SiriusLayout.ContainerLayout isLogin={false}>
      <PreviewContent operateClose={false} hash="" type="attachment" attachmentsInfo={{}} />
    </SiriusLayout.ContainerLayout>
  );
};

export default attachmentPage;
