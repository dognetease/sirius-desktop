import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { PageProps } from 'gatsby';
import { apiHolder, KfApi } from 'api';
import styles from '../styles/pages/kf.module.scss';
import { getIn18Text } from 'api';
const systemApi = apiHolder.api.getSystemApi();
const kfApiImpl = apiHolder.api.requireLogicalApi('kfApiImpl') as KfApi;
const KfPage: React.FC<PageProps> = () => {
  const [url, setUrl] = useState<string>('');
  const a = useRef(setUrl);
  a.current = setUrl;
  useEffect(() => {
    systemApi.switchLoading(true);
    const j = document.createElement('script');
    j.async = true;
    j.src = 'https://qiyukf.com/script/abab5b9989e6f898240067f40874a096.js?hidden=1&templateId=6603268&sdkTemplateId=6603268';
    document.body.appendChild(j);
    j.onload = () => {
      // @ts-ignore
      if (kfApiImpl && !kfApiImpl.isInited) {
        // @ts-ignore
        kfApiImpl.afterInit();
        kfApiImpl.getUrl().then(u => {
          console.log('[kf.tsx] url', u);
          a.current(u);
          systemApi.switchLoading(false);
        });
      }
    };
  }, []);
  console.log('[kf.tsx] url2', url);
  const content = (
    <div className={styles.kfWrap}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{getIn18Text('WANGYILINGXIBAN11')}</title>
      </Helmet>
      <div className={styles.iframeWrap}>
        <iframe className={styles.previewIframe} src={url} title="preview" width="100%" height="100%" />
      </div>
    </div>
  );
  // return systemApi.isElectron() ? <SiriusLayout.ContainerLayout isLogin>{content}</SiriusLayout.ContainerLayout> : content;
  return content;
};
export default KfPage;
