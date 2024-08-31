/*
 * @Author: your name
 * @Date: 2022-01-26 14:33:51
 * @LastEditTime: 2022-02-28 17:48:28
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/@web-common/components/Layout/Write/components/MailContent/HOCEditorPaste.tsx
 */
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { apiHolder, apis, NetStorageApi, locationHelper } from 'api';
import { Editor as EditorType } from '@web-common/tinymce';
import { getFileIcon } from '@web-disk/utils';
import { config } from 'env_def';
import IconCard from '@web-mail/components/Icon';
import { getIn18Text } from 'api';
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
// https://mailh.qiye.163.com/static/sirius-web/share/#type=file&id=19000001829794&from=PERSONAL&parentResourceId=19000000810723&spaceId=504781376&ref=505917780
export default (Component: typeof React.Component) => {
  const PastePre = (props: any) => {
    const host = locationHelper.getHost();
    const contextPath = config('contextPath') as string;
    const { forwardedRef, ...rest } = props;
    const diskUrlRegExp = new RegExp(
      `(href=["'])?((https:\/\/sirius-desktop-web\\d?.cowork.netease.com)|(https://${host}${contextPath})|(https:\/\/lingxi.office.163.com))\/((doc)|(sheet)|(share))\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]`,
      'g'
    );
    // const diskUrlRegExp = /(href=["'])?((https:\/\/sirius-desktop-web\d?.cowork.netease.com)|(https:\/\/lingxi.office.163.com))\/((doc)|(sheet)|(share))\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
    const replaceUrlAction = async (editor: EditorType, urls: string[], urlIdMap: { [key: string]: string }) => {
      const res: any = await diskApi.getLinkInfoBatch({
        linkUrls: urls,
      });
      // 可能有多个url 替换成标题
      urls.forEach(url => {
        const content = res[url];
        if (content && content.content) {
          const { name } = content.content;
          let fileType = getFileIcon(content.content);
          if (content.result.resourceType === 'DIRECTORY') fileType = 'folder';
          // 类型源头已经被多语言翻译
          if (fileType === getIn18Text('WEIZHI')) fileType = 'other';
          const iconHTML = ReactDOMServer.renderToString(<IconCard type={fileType} width="16px" height="16px" />);
          // svg 标签会被邮件服务端拦截 解决 转成base64 但是有一个坑点 base
          const iconBase64 = `data:image/svg+xml;base64,${window.btoa(iconHTML)}`;
          const iconImg = editor.dom.createHTML('img', {
            src: iconBase64,
            style: 'margin-right: 3px; top: 2px; position: relative; display: inline-block',
          });
          const nameHTML = editor.dom.createHTML('span', {}, name);
          const aHTML = editor.dom.createHTML('a', { href: url, contenteditable: false, style: 'cursor: pointer; text-decoration: none' }, iconImg + nameHTML);
          const divHTML = editor.dom.createHTML('div', {}, aHTML);
          const el = editor.getDoc().querySelector('#' + urlIdMap[url]);
          if (el) {
            editor.undoManager.transact(function () {
              el.innerHTML = divHTML;
            });
          }
        }
      });
    };
    const replaceUrl = (editor: EditorType, text: string, urls: string[]) => {
      console.log('replaceUrlreplaceUrl');

      // const urls = text.match(diskUrlRegExp)?.filter(url => !url.startsWith('href='));
      if (!urls || !urls.length) return;
      const urlIdMap: {
        [key: string]: string;
      } = {};
      const urlContents: {
        [key: string]: string;
      } = {};
      // 可能有多个url 替换成标题
      urls.forEach(url => {
        const id = `url${Math.random().toString(36).substr(2, 10)}`;
        urlIdMap[url] = id;
        urlContents[url] = editor.dom.createHTML('div', { id }, url);
      });
      // 除了url 可能还有其他文本
      const resText = text.replace(diskUrlRegExp, match => {
        if (match.startsWith('href=')) {
          return match;
        }
        return urlContents[match];
      });
      replaceUrlAction(editor, urls, urlIdMap);
      return resText;
    };
    const recognizeDiskUrl = (editor: EditorType, clipboardContent: any) => {
      // 复制的链接存在 xxx?id=xxx&amp;name=xxx  在解析时候会成为 xxx?id=xxx&&name=xxx
      // 所以需要删除一个
      const html = clipboardContent['text/html']?.replace(/amp;/g, '');
      const plain = clipboardContent['text/plain'];
      let text = html || plain;
      if (text) {
        // href=  开头的是a标签里面的链接，是不需要再处理的。
        // 但是正则的 ?<! 反向预查 不是很好使 可是使用姿势有问题
        // 所以采取先取进来再过滤方式
        // 此处不能直接中断paste进程 因为paste内容可能包含需要处理的图片
        const diskUrls = text.match(diskUrlRegExp);
        const urls = diskUrls?.filter(url => !url.startsWith('href='));
        const oldUrls = diskUrls?.filter(url => url.startsWith('href='));
        if (urls && urls.length) {
          // 需要将链接转成云文档
          text = replaceUrl(editor, text, urls);
        }
        if (oldUrls) {
          // 已经是a标签了。不需要再转，但是历史邮件里的icon 可能需要处理
          // 统一在paste plugin里面处理 按照 估算一下icon 大小，通过base64长度判断
          // 专门做注释 可删除
        }
      }
      clipboardContent['text/html'] = text;
      return false;
    };
    return <Component recognizeDiskUrl={recognizeDiskUrl} ref={forwardedRef} {...rest} />;
  };
  return React.forwardRef((props, ref) => <PastePre {...props} forwardedRef={ref} />);
};
