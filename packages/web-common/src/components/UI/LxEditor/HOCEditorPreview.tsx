import React, { useState } from 'react';
// import { AttachmentInfo } from 'api';
// import { useAppSelector } from '@web-common/state/createStore';
import { Editor as EditorType } from '@web-common/tinymce';
// import PreviewContent, { prepareAttachmentsForSend } from '@web-common/components/UI/emailPreview/preview';
import PreviewContent from '@web-common/components/UI/emailPreview/preview';

const HOCEditorPreview = (Component: typeof React.Component) => {
  const EditorPreview = (props: any) => {
    const { ref, ...rest } = props;
    const [previewContent, setPreviewContent] = useState(['', '']);
    // const subject = useAppSelector(state => state.mailReducer.currentMail?.entry?.title);
    // const subjectRef = useRef<string>(subject || '');
    // useEffect(() => {
    //   subjectRef.current = subject;
    // }, [subject]);
    // const attachments = useAppSelector(state => state.attachmentReducer.attachments);
    // const currentMailId = useAppSelector(state => state.mailReducer.currentMail.cid);
    // const currentAttachments = useRef<AttachmentInfo[]>([]);
    // useEffect(() => {
    //   if(!attachments) {
    //     currentAttachments.current = [];
    //   }
    //   let list = attachments.filter(i => i.mailId === currentMailId).map(v => ({
    //     fileName: v.fileName,
    //     fileSize: v.fileSize,
    //     downloadUrl: v.fileUrl || '',
    //     expireTime: v.expired || 0,
    //     type: v.flag.usingCloud || v.cloudAttachment ? 1 : 0, // 0 普通附件 1 云附件
    //   }));
    //   currentAttachments.current = list;
    // }, [attachments, currentMailId]);

    const previewAction = (editor: EditorType) => {
      if (!editor) return;
      // const title = `<h1 style="font-size: 16px; padding: 30px 0 20px; font-weight:500; margin:0">${subjectRef.current}</h1>`;
      const html = editor.getContent();
      // const attachments = prepareAttachmentsForSend(currentAttachments.current);
      // const content = `${title}${html}${attachments}`;
      const content = `${html}`;
      let previewContent: string[] = [content, content];
      setPreviewContent(previewContent);
    };

    return (
      <>
        <Component {...rest} ref={ref} previewAction={previewAction} />
        <PreviewContent content={previewContent} onCancel={() => setPreviewContent(['', ''])} />
      </>
    );
  };

  return React.forwardRef((props, ref) => <EditorPreview {...props} ref={ref} />);
};

export default HOCEditorPreview;
