import { useEffect, useMemo, useState } from 'react';
import { getParameterByName } from '@web-common/utils/utils';
import { Bridge } from './bridge';

let seqId = 1;
export const useBridge = (iframeRef: React.RefObject<HTMLIFrameElement>, previewLink: string) => {
  const iframeEl = iframeRef.current;
  const [iframeId] = useState(() => {
    return seqId++;
  });
  const bridge = useMemo(() => new Bridge('bridge-sirius'), []);
  const iframeLink = useMemo(() => {
    if (previewLink) {
      const url = new URL(previewLink);
      url.searchParams.set('iframeBridgeId', `${iframeId}`);
      return url.href;
    }
    return '';
  }, [previewLink]);

  useEffect(() => {
    bridge.iframeEl = iframeEl;
  }, [iframeEl]);

  useEffect(() => {
    return () => {
      bridge.destory();
    };
  }, []);

  useEffect(() => {
    bridge.checkReceiveMessage = message => {
      const fromSite = (message.payload as any)?.fromSite;
      // 处理Electron多页签问题，在多页签中协同文档会通过window.addEventListener注册多次 message导致多个协同文档同步错乱。
      if (fromSite) {
        const previewIframeId = getParameterByName('iframeBridgeId', iframeLink);
        const previewIdentity = getParameterByName('identity', iframeLink);
        const fromIdentity = getParameterByName('identity', fromSite);
        const fromIframeId = getParameterByName('iframeBridgeId', fromSite);
        if (previewIdentity !== fromIdentity || previewIframeId !== fromIframeId) {
          return false;
        }
      }
      return true;
    };
  }, [previewLink]);

  return {
    bridge,
    iframeLink,
  };
};
