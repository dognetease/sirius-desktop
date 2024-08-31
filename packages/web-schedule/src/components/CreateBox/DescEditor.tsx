import React, { useState, useEffect } from 'react';
import { apiHolder as api } from 'api';
import styles from './DescEditor.module.scss';
import LxEditor from '@web-common/components/UI/LxEditor/LxEditor';
interface DescEditorProps {
  originContent: string;
  disabled?: boolean;
  isWarn?: boolean;
  editorChange: () => void;
  editorBlur: () => void;
  getEditorInstance: (editor: any) => void;
}
const tinyStyle = 'body {margin: 0; font-size: 12px;}';
export const DescEditor: React.FC<DescEditorProps> = ({ originContent, disabled = false, isWarn = false, getEditorInstance, editorChange, editorBlur }) => {
  let content = originContent as string;
  const classDesc = `desc-editor ${isWarn ? styles.descEditorLimit : ''}`;
  // const FileApi = api.api.getFileApi();

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
    paste_data_images: false,
    paste_remove_styles_if_webkit: false,
    paste_enable_default_filters: false,
    paste_preprocess: (plugin, args) => {
      args.force = true;
      args.content = args.content?.replaceAll(/<img([\w\W]+?)>/gi, '');
    },
    contextmenu: 'paste pastetext | link linkchecker',
    content_style: tinyStyle,
    toolbar: ['undo redo link bold italic underline fontsizeselect forecolor bullist numlist'],
    plugins: ['advlist autolink lists link print preview', 'searchreplace visualblocks nonbreaking lxsignature', 'media paste code wordcount'],
  };
  // onEditorChange 比在ed.on('blur'） 更精准
  return <LxEditor initialValue={content} uniqueClass={classDesc} init={init} disabled={disabled} onEditorChange={editorChange} />;
};
