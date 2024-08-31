import { useMemo, useRef } from 'react';
import useStateRef from '@web-mail/hooks/useStateRef';
import { stringMap } from '@web-mail/types';

// 判断是否可以执行useEffect中的逻辑
export const useCanUpdate = (sliceId: string) => {
  //上次变化的sliceId
  const preSliceId = useRef<string | null | undefined>();
  /**
   * 用于记录sliceId，以判断当前tab下的状态属于新开还是激活
   * 记录只增加，不删除，
   */
  const sliceIdRecordMap = useRef<stringMap>({});

  // 判断是否可以执行useEffect中的逻辑
  const canUpdate = useMemo(() => {
    if (sliceId) {
      // 判断是否在map中
      if (sliceIdRecordMap.current[sliceId]) {
        if (preSliceId.current == sliceId) {
          return false;
        } else {
          preSliceId.current = sliceId;
          return true;
        }
      } else {
        sliceIdRecordMap.current[sliceId] = 1;
        preSliceId.current = sliceId;
        return true;
      }
    }
    preSliceId.current = sliceId;
    return false;
  }, [sliceId]);

  return useStateRef(canUpdate);
};
