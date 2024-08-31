/*
 * @Author: wangzhijie02
 * @Date: 2022-06-24 16:45:09
 * @LastEditors: wangzhijie02
 * @LastEditTime: 2022-06-24 16:59:33
 * @Description: file content
 */
import { useEffect } from 'react';
const triggerMousedownEvent = () => {
  const ev = document.createEvent('MouseEvents');
  (ev as any)?.initMouseEvent('mousedown', true, true);
  document.body.dispatchEvent(ev);
};
/**
 * 场景：Header>iframe，如果header有popup组件显示，点击iframe后，这个popup组件不会消失。
 * 因此监听window blur事件，模拟当前document 某个元素发生点击事件，这样popup组件就会消失。
 */
export const useIframeClickMock = () => {
  // 出现弹窗后默认配置焦点, 当点击到 iframe 中的元素时，会触发 blur 事件，此时关闭弹窗
  useEffect(() => {
    const windowBlur = () => {
      triggerMousedownEvent();
    };
    window.addEventListener('blur', windowBlur);
    return () => {
      window.removeEventListener('blur', windowBlur);
    };
  }, []);
};
