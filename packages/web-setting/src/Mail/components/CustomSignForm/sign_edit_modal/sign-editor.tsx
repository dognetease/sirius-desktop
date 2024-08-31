import React from 'react';
import { apiHolder as api } from 'api';
import debounce from 'lodash/debounce';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import { MailConfigActions } from '@web-common/state/reducer';
import LxEditor from '@web-common/components/UI/LxEditor/LxEditor';

const SignEditor = () => {
  const { doChangeContent, doSetHasContent } = useActions(MailConfigActions);
  const content = useAppSelector(state => state.mailConfigReducer.signContent);
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
        doSetHasContent(true); // 保存按钮高亮
      })
      .catch(() => {
        failFun();
      });
  };

  const onEditorChange = (val: any) => {
    const doc = new DOMParser().parseFromString(val, 'text/html');
    const innerHTML = doc.body.innerHTML.replace(/\n/g, '').trim();
    if (innerHTML) {
      doSetHasContent(true); // 保存按钮高亮
    }
  };

  // 编辑器配置
  const init = {
    setup: ed => {
      ed.on('blur', () => {
        doChangeContent(ed.getContent());
      });
      ed.on('keyup', () => {
        // 获取内容，参考：https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.dom.selection/#examples-3
        const content = ed.getContent({ format: 'text' });
        doSetHasContent(content?.trim().length > 0); // 屏蔽掉undefined
      });
    },
    plugins: [
      'advlist autolink lists link lximg image print preview fullpage',
      'searchreplace visualblocks fullscreen nonbreaking lxsignature',
      'media table paste code lxuploadattachment lxmailformat lxcontact lxformatpainter wordcount',
    ],
    images_upload_handler: imagesUploadHandler,
    selector: 'textarea', // change this value according to your HTML
    content_css: './sign-editor.css',
    toolbar_mode: 'wrap',
    toolbar: `undo redo lxformatpainter removeformat $split fontselect fontsizeselect bold italic underline strikethrough forecolor 
    backcolor $split bullist numlist lineheight $split alignleftSplit dentSplit $split lxTable lximg link $split preview print code`,
  };
  return <LxEditor initialValue={content} uniqueClass="signature-editor" init={init} onEditorChange={debounce(onEditorChange, 1000)} />;
};

export default SignEditor;
