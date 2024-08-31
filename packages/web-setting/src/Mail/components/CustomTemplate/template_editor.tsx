import React from 'react';
import { apiHolder as api } from 'api';
import { useActions, useAppSelector, MailTemplateActions, TempContactActions } from '@web-common/state/createStore';
import LxEditor from '@web-common/components/UI/LxEditor/LxEditor';
import { getIn18Text } from 'api';
// declare type ToolbarMode = 'floating' | 'sliding' | 'scrolling' | 'wrap';
export const TemplateEditor = () => {
  const { doChangeMailContent, doConferenceSettting, doClosePreviewModal } = useActions(MailTemplateActions);
  const content = useAppSelector(state => state.mailTemplateReducer.mailTemplateContent.entry?.content?.content);
  const FileApi = api.api.getFileApi();
  const { doFocusSelector } = useActions(TempContactActions);
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
      })
      .catch(() => {
        failFun();
      });
  };
  // 编辑器配置
  const init = {
    setup: ed => {
      ed.on('blur', () => {
        doChangeMailContent(ed.getContent());
      });
    },
    min_height: 200,
    images_upload_handler: imagesUploadHandler,
  };
  return (
    <LxEditor
      value={content}
      uniqueClass="template-editor"
      init={init}
      onEditorChange={v => doChangeMailContent(v)}
      onClick={() => {
        doFocusSelector(getIn18Text('ZHENGWEN'));
        doConferenceSettting(false);
        doClosePreviewModal(true);
      }}
    />
  );
};
