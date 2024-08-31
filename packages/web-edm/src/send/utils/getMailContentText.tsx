// 获取邮件内容文本
import { inWindow } from 'api';
import { MailSign, PreHeader, MailSignEnt, emptyLine, SocialLink, UnSubText, MailPreMailContent, MailForwardContent } from './mailClassnameConstant';
import './tempNode.css';

export const deleteNode = (root: HTMLElement, selector: string) => {
  const removeNode = root.querySelector(selector);
  removeNode?.remove();
};

const deleteAllNode = (root: HTMLElement, selector: string) => {
  const removeNodes = root.querySelectorAll(selector);
  removeNodes.forEach(node => node.remove());
};

const deleteNodeText = (root: HTMLElement, content: string, selector: string): string => {
  const removeNode = root.querySelector(selector) as HTMLElement;
  if (removeNode) {
    const test = removeNode.innerText;
    content.replace(test, '');
  }
  return content;
};

/**
 * 根据内容dom获取内容文案,withSign:是否要签名，默认不传递，是不需要签名的
 */
export const getMailContentText = (content: string, removeUnSubText?: boolean, withSign?: boolean): string => {
  if (!inWindow()) {
    return '';
  }
  const tempNode = document.querySelector('.aiWrite-temp-node') as HTMLDivElement;
  const node = tempNode ?? document.createElement('div');
  node.className = 'aiWrite-temp-node';
  node.innerHTML = content;
  // 如果需要签名信息，则withSign传递true即可
  if (!withSign) {
    deleteNode(node, `.${MailSign}`);
  }
  deleteAllNode(node, `.${SocialLink}`);
  deleteNode(node, `#${PreHeader}`);
  deleteNode(node, `.${MailSignEnt}`);
  deleteNode(node, `.${MailPreMailContent}`);
  deleteNode(node, `#${MailForwardContent}`);
  deleteAllNode(node, `style`);
  deleteAllNode(node, `title`);
  if (removeUnSubText) {
    deleteAllNode(node, `.${UnSubText}`);
  }
  if (!tempNode) {
    document.body.appendChild(node);
  }
  setTimeout(() => {
    node.remove();
  }, 100);

  return node.innerText.trim();
};

/**
 * 获取内容，不带签名
 */
export const getContentWithoutSign = (content: string, type?: 'text' | 'html'): string => {
  const node = document.createElement('div');
  node.innerHTML = content;

  deleteNode(node, `.${MailSign}`);
  deleteNode(node, `#${PreHeader}`);
  deleteNode(node, `.${MailSignEnt}`);
  deleteAllNode(node, `style`);
  deleteAllNode(node, `title`);

  if (type === 'html') {
    return node.innerHTML;
  }

  return node.innerText.trim();
};

export const getContentWithoutSignOnly = (content?: string): string => {
  if (!content) {
    return '';
  }
  const node = document.createElement('div');
  node.innerHTML = content;

  deleteNode(node, `.${MailSign}`);
  deleteNode(node, `#${PreHeader}`);
  deleteNode(node, `.${MailSignEnt}`);
  return node.outerHTML;
};

/**
 * 检测内容是否为空
 */
export const isEmpty = (content: string) => {
  const node = document.createElement('div');
  node.innerHTML = content;

  deleteNode(node, `.${MailSign}`);
  deleteNode(node, `#${PreHeader}`);
  deleteNode(node, `.${MailSignEnt}`);

  return node.innerText.trim().length < 1;
};

/**
 * 去掉edm空行
 */
export function contentWithoutEmpty(content: string) {
  const node = document.createElement('div');
  node.innerHTML = content;

  deleteNode(node, `.${emptyLine}`);

  return node.innerHTML;
}
