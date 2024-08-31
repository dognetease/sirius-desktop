/* eslint-disable react/no-array-index-key */
import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

interface EventDescProps {
  desc?: string;
}
// url文本链接，转成可点击的链接
const splitByUrlReg = (str: string = '') => {
  //return str.replaceAll(/(?<!href=["'])(?<!src=["'])((?:(?:https?|ftp):\/\/|www\.)[^\s<>'"]+)(?![^<]*<\/a>)/gi, '<a href="$&" target="_blank" rel="noreferrer">$&</a>');
  let htmlStr = str;
  try {
    // 匹配所有 URL，包括有协议的
    const expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
    const regex = new RegExp(expression);
    const strUrls = htmlStr.match(regex);
    // 遍历 URLs
    if (strUrls) {
      strUrls.forEach(url => {
        var escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var wrappedInA = new RegExp('<a[^>]*' + escapedUrl + '[^<]*</a>').test(htmlStr);
        var wrappedInHref = new RegExp('href=["\']' + escapedUrl + '["\']').test(htmlStr);
        var wrappedInSrc = new RegExp('src=["\']' + escapedUrl + '["\']').test(htmlStr);

        // 如果 URL 没有被包裹，则替换为 <a> 标签链接
        if (!(wrappedInA || wrappedInHref || wrappedInSrc)) {
          htmlStr = htmlStr.replace(new RegExp(escapedUrl, 'g'), '<a href="' + (url.startsWith('http') ? '' : 'http://') + url + '" target="_blank">' + url + '</a>');
        }
      });
    }
  } catch (error) {
    console.error('splitByUrlReg error', error);
  }

  return htmlStr;
};
const EventDesc: React.FC<EventDescProps> = ({ desc = '' }) => {
  const [descHTML, setDescHTML] = useState<string>(splitByUrlReg(desc));
  useEffect(() => {
    // Add a hook to make all links open a new window
    DOMPurify.addHook('afterSanitizeAttributes', function (node: HTMLElement) {
      try {
        // set all elements owning target to target=_blank
        if ('target' in node) {
          node.setAttribute('target', '_blank');
        }
        // set non-HTML/MathML links to xlink:show=new
        if (!node.hasAttribute('target') && (node.hasAttribute('xlink:href') || node.hasAttribute('href'))) {
          node.setAttribute('xlink:show', 'new');
        }

        if (node.tagName === 'IFRAME' && !node.hasAttribute('sandbox')) {
          node.setAttribute('sandbox', '');
        }
      } catch (e) {
        console.error('[EventDesc] error', e);
      }
    });
    setDescHTML(DOMPurify.sanitize(descHTML));
    return () => {
      DOMPurify.removeHook('afterSanitizeAttributes');
    };
  }, []);

  return (
    <pre
      style={{
        margin: 0,
        whiteSpace: 'pre-line',
        overflow: 'hidden',
      }}
      dangerouslySetInnerHTML={{ __html: descHTML }}
    />
  );
};

export default EventDesc;
