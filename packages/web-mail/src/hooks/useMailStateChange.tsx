/*
 * 功能：对比传入的mailEntryModel中的状态字段，如果状态字段有变化，则返回有变化的数字
 */
import { useRef, useMemo, useState, useEffect } from 'react';
import { MailEntryModel } from 'api';

const useMailStateChange = (mailDataList: MailEntryModel[]): number => {
  const [forceRender, setForceRender] = useState(0);

  const stateKey = useMemo(() => {
    let res = '';
    if (mailDataList && mailDataList.length) {
      for (let i = 0; i < mailDataList.length; i++) {
        const mail = mailDataList[i];
        res += '' + mail?.entry?.mark + mail?.tags?.length;
      }
    }
    return res;
  }, [mailDataList]);

  useEffect(() => {
    setForceRender(count => count + 1);
  }, [stateKey]);

  return forceRender;
};

export default useMailStateChange;
