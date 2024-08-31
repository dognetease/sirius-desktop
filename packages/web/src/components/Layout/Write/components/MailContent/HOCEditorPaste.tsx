/*
 * @Author: your name
 * @Date: 2022-01-26 14:33:51
 * @LastEditTime: 2022-03-02 09:52:00
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/components/Layout/Write/components/MailContent/HOCEditorPaste.tsx
 */
/* eslint-disable react/jsx-props-no-spreading */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { apiHolder, apis, NetStorageApi } from 'api';
import { Editor as EditorType } from '@web-common/tinymce';
import IconCard from '@/components/Layout/MailBox/components/Icon';
import { getFileIcon } from '@web-disk/utils';

const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;

export default (Component: typeof React.Component) => {
  const PastePre = (props: any) => {
    const { forwardedRef, ...rest } = props;
    // eslint-disable-next-line max-len
    const diskUrlRegExp =
      /((https:\/\/sirius-desktop-web.cowork.netease.com)|(https:\/\/lingxi.office.163.com))\/((doc)|(sheet)|(share))\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;

    const replaceUrl = async (editor: EditorType, text: string) => {
      const urls = text.match(diskUrlRegExp);
      if (!urls) return;
      const res: any = await diskApi.getLinkInfoBatch({
        linkUrls: urls,
      });
      const urlContents: { [key: string]: string } = {};
      // 可能有多个url 替换成标题
      urls.forEach(url => {
        const content = res[url];
        if (content && content.content) {
          const { name } = content.content;
          let fileType = getFileIcon(content.content);
          if (content.result.resourceType === 'DIRECTORY') fileType = 'folder';
          if (fileType === '未知') fileType = 'other';
          const iconHTML = ReactDOMServer.renderToString(<IconCard type={fileType} width="16px" height="16px" />);
          // svg 标签会被邮件服务端拦截 解决 转成base64 但是有一个坑点 base
          const iconBase64 = `data:image/svg+xml;base64,${window.btoa(iconHTML)}`;
          const iconImg = editor.dom.createHTML('img', { src: iconBase64, style: 'margin-right: 3px; position: relative; top: 2px' });
          const nameHTML = editor.dom.createHTML('span', {}, name);
          const aHTML = editor.dom.createHTML('a', { href: url, contenteditable: false, style: 'cursor: pointer; text-decoration: none' }, iconImg + nameHTML);
          const divHTML = editor.dom.createHTML('div', {}, aHTML);
          urlContents[url] = divHTML;
        }
      });
      // 除了url 可能还有其他文本
      const resText = text.replace(diskUrlRegExp, match => urlContents[match]);
      editor.insertContent(resText);
    };

    const recognizeDiskUrl = (editor: EditorType, clipboardContent: any) => {
      const text = clipboardContent['text/plain'];
      if (text && diskUrlRegExp.test(text)) {
        replaceUrl(editor, text);
        return true;
      }
      return false;
    };
    return <Component recognizeDiskUrl={recognizeDiskUrl} ref={forwardedRef} {...rest} />;
  };
  return React.forwardRef((props, ref) => <PastePre {...props} forwardedRef={ref} />);
};
