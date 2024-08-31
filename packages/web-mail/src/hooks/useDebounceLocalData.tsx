/**
 *  功能：用于状态变化的防抖，屏蔽快速变化时的无效渲染以提升性能
 */

import { useCallback, useState, useEffect } from 'react';
import { debounce } from 'lodash';

type Config<T> = {
  time?: number;
  exception?: (data?: T) => boolean;
  debounceConfig?: {
    leading: boolean;
    trailing: boolean;
  };
};
type useDebounceLocalData = <T>(data: T, config?: Config<T>) => T;

/**
 * @param data 变化的数据
 * @param config.time 防抖的时间间隔
 * @callback config.exception 传入一个方法，接收当前变化的data, 用于判断是否需要绕过该次防抖
 * @param config.debounceConfig 防抖的配置项
 * @returns data 返回传入的数据
 */
const useDebounceLocalData: useDebounceLocalData = (data, config) => {
  const {
    time = 300,
    debounceConfig = {
      leading: true,
      trailing: true,
    },
    exception = () => false,
  } = config || {};

  const [localContent, setLocalContent] = useState(data);

  // 延迟设置localData
  const debouceSetLocalContent = useCallback(
    debounce(data => setLocalContent(data), time, debounceConfig),
    []
  );

  useEffect(() => {
    if (exception(data)) {
      setLocalContent(data);
      // 击穿糊取消后边沿的调用
      debouceSetLocalContent.cancel();
    } else {
      debouceSetLocalContent(data);
    }
  }, [data]);

  return localContent;
};

export default useDebounceLocalData;
