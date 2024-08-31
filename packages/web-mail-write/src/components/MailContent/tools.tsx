/*
 * @Author: your name
 * @Date: 2021-11-22 16:28:34
 * @LastEditTime: 2022-02-16 15:47:48
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/components/Layout/Write/components/MailContent/tools.ts
 */
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import IconCard from '@web-common/components/UI/IconCard';
import { getIn18Text } from 'api';
// const setTemplateButtonDisplay = (doc: Element, value: string) => {
//   const el = document.querySelector('.tox .tox-split-button.mail-format');
//   if(!el) return;
//   if (['common', 'reply', 'forward'].includes(value)) {
//     el.removeAttribute('hidden');
//     return;
//   }
//   el.setAttribute('hidden', true);
// };
const actionMap = {
  // setTemplateButtonDisplay,
};
export const beforeNewWindow = (iframe: Element, type: string, value: string) => {
  if (!iframe) return;
  const doc = iframe.contentDocument;
  const action = actionMap[type];
  if (action && typeof action === 'function') {
    action(doc, value);
  }
};
export const scaleEditor = (callback: (inMax: boolean) => void) => {
  const toolbar = document.querySelector('.editor-container .tox-toolbar-overlord');
  const scaleBtn = document.querySelector('.editor-container .tox-toolbar__scale__btn');
  if (!scaleBtn) {
    const minSvg = ReactDOMServer.renderToString(<IconCard type="minEditor" />);
    const maxSvg = ReactDOMServer.renderToString(<IconCard type="maxEditor" />);
    const group = document.createElement('div');
    let inMax = false;
    let buttonDom: Element | null = null;
    const toMax = `<span class="tox-icon tox-tbtn__icon-wrap">${maxSvg}</span>`;
    const toMin = `<span class="tox-icon tox-tbtn__icon-wrap">${minSvg}</span>`;
    group.addEventListener('click', () => {
      inMax = !inMax;
      if (!buttonDom) buttonDom = group.querySelector('button') as Element;
      buttonDom.innerHTML = inMax ? toMin : toMax;
      buttonDom.setAttribute('aria-label', inMax ? getIn18Text('ZUIXIAOHUA') : getIn18Text('ZUIDAHUA'));
      callback(inMax);
    });
    group.className = 'tox-toolbar__group tox-toolbar__scale__btn';
    group.innerHTML = `<button aria-label="最大化" title="" aria-haspopup="true" type="button" data-alloy-tabstop="true" tabindex="-1" class="tox-tbtn" aria-expanded="false"><span class="tox-icon tox-tbtn__icon-wrap">${maxSvg}</span></button>`;
    toolbar?.appendChild(group);
  }
};

export const filterSVGScript = (file: File) => {
  return new Promise((resolve, reject) => {
    const fileName = file.name;
    if (fileName && fileName.endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = res => {
        if (typeof reader.result !== 'string') {
          resolve(file);
          return;
        }
        const str = reader.result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        const blob = new Blob([str], { type: file.type });
        const filterFile = new File([blob], file.name, { type: file.type });
        resolve(filterFile);
      };
      reader.readAsText(file);
      return;
    }
    resolve(file);
  });
};
