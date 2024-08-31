import message from '@web-common/components/UI/Message/SiriusMessage';
import copy from 'copy-to-clipboard';
export const selectElement = (textElement: HTMLElement, win: Window = window, doc = document) => {
  const selection = win.getSelection();
  const range = doc.createRange();
  range.selectNodeContents(textElement);
  selection?.removeAllRanges();
  selection?.addRange(range);
};

export const copyText = (str: string = '', options = {}) => {
  copy(str, { format: 'text/plain', ...options });
};

export const paste = async (needToast: boolean = true, msg = '因为您的浏览器版本过低，请使用键盘快捷键（Ctrl+V）。') => {
  try {
    if (await isSupportPaste()) {
      const clipboardData = await navigator.clipboard.readText();
      return clipboardData;
    } else {
      needToast && message.error(msg);
    }
  } catch (e) {
    console.error('patse error', e);
    message.error(msg);
  }
  return '';
};

export const isSupportPaste = async () => {
  // 存在 window.navigator.clipboard.readText 不代表就能使用，有时候会有权限报错
  // NotAllowedError: The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission
  if (window.navigator && window.navigator.clipboard && typeof window.navigator.clipboard.readText === 'function') {
    try {
      await navigator.clipboard.readText();
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
};
