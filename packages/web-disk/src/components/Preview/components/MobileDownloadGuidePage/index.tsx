/*
 */
import * as React from 'react';
import { apis, apiHolder, DataTrackerApi } from 'api';
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
import { ReactComponent as LogoSvg } from './logo.svg';
import styles from './index.module.scss';
import { outsideGuidepageReport } from '../../dataTracker';
import { getIn18Text } from 'api';
export interface IMobileDownloadGuidePageProps {
  fileId: number;
}
/**
 * 普通文件 在移动端&不能预览 的情况下
 * 展示 下载 灵犀办公 引导页
 * @param props
 * @returns
 */
export function MobileDownloadGuidePage(props: IMobileDownloadGuidePageProps) {
  React.useEffect(() => {
    outsideGuidepageReport('show', props.fileId);
    window.postMessage('hideSpinner');
  }, []);
  return (
    <div className={styles.guidePageWrap}>
      <div className={styles.logoWrap}>
        <LogoSvg />
      </div>
      <h4>{getIn18Text('WANGYILINGXIBAN')}</h4>
      <p>{getIn18Text('QINGDAKAIWANGYI')}</p>
      <a
        href="https://office.163.com/"
        onClick={() => {
          outsideGuidepageReport('go', props.fileId);
        }}
      >
        {getIn18Text('LIJIQIANWANG')}
      </a>
    </div>
  );
}
