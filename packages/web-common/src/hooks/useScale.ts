/*
 * @Author: your name
 * @Date: 2021-09-14 15:47:22
 * @LastEditTime: 2021-12-28 17:28:58
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/hooks/useScale.ts
 */
import React, { useEffect, useState } from 'react';

const keyCodeMap = {
  // 91: true, // command
  61: true,
  107: -100, // 数字键盘 +
  109: +100, // 数字键盘 -
  173: +100, // 火狐 - 号
  187: -100, // +
  189: +100, // -
};
const useScale = () => {
  const [deltaY, setDeltaY] = useState(0);

  const wheelAction = e => {
    if (e.ctrlKey) {
      setDeltaY(e.deltaY + Math.random());
      e.preventDefault();
    }
  };

  const keydownAction = e => {
    const ctrlKey = e.ctrlKey || e.metaKey;
    if (ctrlKey && keyCodeMap[e.keyCode]) {
      setDeltaY(Math.random() + keyCodeMap[e.keyCode]);
      e.preventDefault();
    }
  };
  useEffect(() => {
    document.body.addEventListener('wheel', wheelAction, { passive: false });
    document.body.addEventListener('keydown', keydownAction, { passive: false });
    return () => {
      document.body.removeEventListener('wheel', wheelAction);
      document.body.removeEventListener('keydown', keydownAction);
    };
  }, []);

  return { deltaY };
};

export default useScale;
