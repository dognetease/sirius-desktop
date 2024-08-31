import React, { useCallback } from 'react';
import { apiHolder as api } from 'api';
import debounce from 'lodash/debounce';
import LxEditor from '@web-common/components/UI/LxEditor/LxEditor';

interface MailTemplateEditorProps {
  getEditorInstance: (editor: any) => void;
  changeMailContent: () => void;
  onEditorChange?: (val: any) => void;
  placeholder?: string;
}

export const MailTemplateEditor: React.FC<MailTemplateEditorProps> = ({ getEditorInstance, changeMailContent, onEditorChange, placeholder = '' }) => {
  const FileApi = api.api.getFileApi();
  const imagesUploadHandler = (blobInfo, succFun, failFun) => {
    let file = blobInfo.blob();
    if (Object.prototype.toString.call(blobInfo.blob()) !== '[object File]') {
      file = new File[blobInfo.blob()]();
    }

    FileApi.uploadFile({
      fileName: file.name,
      file,
      fileSourceType: file.type,
      fileSize: file.size,
    })
      .then(({ data }) => {
        // succFun(data.data.url);
        succFun({ url: data.data.url, originUrl: data.data.url });
        // doSetHasContent(true); // 保存按钮高亮
      })
      .catch(() => {
        failFun();
      });
  };

  // 编辑器配置
  const init = {
    placeholder,
    setup: ed => {
      ed.on('blur', () => {
        changeMailContent();
      });
    },
    init_instance_callback: ed => {
      getEditorInstance(ed);
    },
    plugins: [
      'advlist autolink lists link lximg image print preview fullpage autoresize',
      'searchreplace visualblocks fullscreen nonbreaking lxsignature',
      'media table paste code lxuploadattachment lxmailformat lxcontact lxformatpainter',
    ],
    images_upload_handler: imagesUploadHandler,
  };

  // onEditorChange 比在ed.on('blur'） 更精准
  const onEditorChangeDebounce = useCallback(
    debounce((val: any, cb?: (val: any) => void) => {
      if (cb) {
        cb(val);
      }
    }, 500),
    []
  );

  return <LxEditor uniqueClass="mail-template-editor" init={init} onEditorChange={(val: any) => onEditorChangeDebounce(val, onEditorChange)} />;
};
