import React, { useRef, useCallback } from 'react';

export interface UniVersionControlProps {
  /**true表示显示uni页面 */
  visible: boolean;
}
/**
 * 处理uni版本升级逻辑：
 * 使用key 来强制销毁重新实例化组件来重载uni iframe页面组件（强制销毁只有在访问uni组件时候处理，因此需要使用visible参数来控制key值）
 * 使用 updateUniVersionHandle 处理uni版本变更
 *
 *
 * @param props
 * @returns
 */
export const useUniVersionControl = (props: UniVersionControlProps) => {
  const uniVersionRef = useRef<{
    currentKey: string;
    nextKey: string;
    versionHash: string;
  }>({
    currentKey: '',
    nextKey: '',
    versionHash: '',
  });
  const key = React.useMemo(() => {
    const uniVersionData = uniVersionRef.current;
    if (props.visible) {
      //进入到这里说明第一次访问或者从隐藏变成显示进来的
      if (uniVersionData.nextKey !== uniVersionData.currentKey) {
        uniVersionData.currentKey = uniVersionData.nextKey;
      }
    }
    return uniVersionData.currentKey;
  }, [props.visible]);

  const updateUniVersionHandle = useCallback((data: { versionHash: string; url: string }) => {
    const uniVersionData = uniVersionRef.current;
    // 第一次收到通知，不需要销毁重启组件，因此只设置versionHash
    if (uniVersionData.versionHash === '') {
      uniVersionData.versionHash = data.versionHash;
      return;
    }
    // 接受到的版本hash，与当前缓存的不一样，则认为uni应用已更新。
    if (uniVersionData.versionHash && uniVersionData.versionHash !== data.versionHash) {
      uniVersionData.versionHash = data.versionHash;
      uniVersionData.nextKey = data.versionHash;
    }
  }, []);

  return {
    key,
    updateUniVersionHandle,
  };
};
