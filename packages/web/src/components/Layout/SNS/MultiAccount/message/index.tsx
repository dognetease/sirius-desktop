import React, { useEffect } from 'react';
import { apiHolder, inWindow } from 'api';
import { navigate } from '@reach/router';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import styles from './index.module.scss';
import { makeStageUrl } from './utils';

interface MessageData {
  command: string;
}

const systemApi = apiHolder.api.getSystemApi();

const MultiAccountMessage: React.FC = () => {
  // const src = URL_MAP[stage] + `&lang=${window.systemLang}` || URL_MAP.test + `&lang=${window.systemLang}`;
  const isWin = inWindow() && systemApi.isElectron() && !window.electronLib.env.isMac;
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as MessageData;
      if (data.command === 'createNewMarketBulk') {
        navigate('#edm?page=createMarketBulk');
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <PermissionCheckPage resourceLabel="WHATSAPP_GROUP_SEND" accessLabel="VIEW" menu="WHATSAPP_GROUP_MSG">
      <div className={styles.waChatContainer} style={{ marginTop: isWin ? 32 : 0, height: isWin ? 'calc(100% - 32px)' : '100%', overflow: 'hidden' }}>
        <iframe ref={iframeRef} className={styles.waChatIframe} src={makeStageUrl()} title="preview" width="100%" height="100%" />
      </div>
    </PermissionCheckPage>
  );
};

export default MultiAccountMessage;
