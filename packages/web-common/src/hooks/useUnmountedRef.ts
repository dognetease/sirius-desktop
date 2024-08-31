/**
 * 获取当前组件是否已经卸载的 hook，用于避免因组件卸载后更新状态而导致的内存泄漏
 * 在组件首次渲染时执行方法，返回一个含有current属性的ref对象，current表示当前组件是否已被卸载
 * @lujiajian
 */
import { useEffect, useRef } from 'react';

const useUnmountedRef = () => {
  const unmountedRef = useRef(false);
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
    };
  }, []);
  return unmountedRef;
};

export default useUnmountedRef;
