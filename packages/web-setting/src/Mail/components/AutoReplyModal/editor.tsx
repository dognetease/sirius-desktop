import React, { useState, useEffect } from 'react';
import { apiHolder as api } from 'api';
import LxEditor from '@web-common/components/UI/LxEditor/LxEditor';
interface AutoReplyEditorProps {
  originContent: string;
  disabled?: boolean;
  isWarn?: boolean;
  editorChange: () => void;
  editorBlur: () => void;
  getEditorInstance: (editor: any) => void;
}

export const AutoReplyEditor: React.FC<AutoReplyEditorProps> = ({ originContent, disabled = false, isWarn = false, getEditorInstance, editorChange, editorBlur }) => {
  let content = originContent as string;
  const classAutoReply = `autoReply-editor ${isWarn ? 'autoReply-editor-limit' : ''}`;
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
        succFun({ url: data.data.url, originUrl: data.data.url });
        // doSetHasContent(true); // 保存按钮高亮
      })
      .catch(() => {
        failFun();
      });
  };

  // 编辑器配置
  const init = {
    setup: ed => {
      ed.on('blur', () => {
        editorBlur();
      });
    },
    init_instance_callback: ed => {
      getEditorInstance(ed);
    },
    images_upload_handler: imagesUploadHandler,
    plugins: [
      'advlist autolink lists link lximg image print preview fullpage',
      'searchreplace visualblocks fullscreen nonbreaking lxsignature',
      'media table paste code lxuploadattachment lxmailformat lxcontact lxformatpainter wordcount',
    ],
  };
  // onEditorChange 比在ed.on('blur'） 更精准
  return <LxEditor initialValue={content} uniqueClass={classAutoReply} init={init} disabled={disabled} onEditorChange={editorChange} />;
};
