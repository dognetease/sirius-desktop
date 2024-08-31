/*
 * @Author: wangzhijie02
 * @Date: 2022-06-10 17:36:45
 * @LastEditors: wangzhijie02
 * @LastEditTime: 2022-07-05 18:02:47
 * @Description: file content
 */
import React, { useRef, useState, useContext, useEffect } from 'react';

import { AppsContext } from '../../context';
import { diskApi, docHost } from '../../api';
import { useIframeClickMock } from '../../hooks/useIframeClickMock';
import { ReactComponent as SuccessTipIcon } from './imgs/success.svg';

import { useBridge } from '@web-disk/components/Unitable/useBridge';
import { dailyReportAppId, pageIdDict, ReportPageBaseProps } from './../../pageMapConf';

//样式
import styles from './index.module.scss';
const generateFormTemplateEditURL = (params: { identity: string; tableId: string; viewId: string }) => {
  return `${docHost}unitable/?identity=${params.identity}&tableId=${params.tableId}&viewId=${params.viewId}&mode=formOnlyView`;
};

export const ReportTemplateEdit: React.FC<ReportPageBaseProps> = props => {
  useIframeClickMock();
  const [previewLink, setPreviewLink] = useState<string>('');
  const [tipVisible, setTipVisible] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { setPageId } = useContext(AppsContext);

  const { bridge, iframeLink } = useBridge(iframeRef, previewLink);

  useEffect(() => {
    bridge.on('unitableViewChanged', () => {
      setTipVisible(true);
    });
    bridge.on('formTemplateEditSubmitted', () => {
      const targetPageId = props.appId === dailyReportAppId ? pageIdDict.appsDailyReport : pageIdDict.appsWeeklyReport;
      setPageId(targetPageId);
    });
    bridge.on('formTemplateEditCancel', () => {
      const targetPageId = props.appId === dailyReportAppId ? pageIdDict.appsDailyReport : pageIdDict.appsWeeklyReport;
      setPageId(targetPageId);
    });

    return () => {
      bridge.destory();
    };
  }, [bridge]);

  useEffect(() => {
    const run = async () => {
      const userAppDetail = await diskApi.getUserApp({ appId: props.appId });
      const isDailyReport = props.appId === dailyReportAppId;
      const appInfo = isDailyReport ? userAppDetail.config.unitables.daily : userAppDetail.config.unitables.weekly;

      if (appInfo) {
        const formTemplateURL = generateFormTemplateEditURL({
          identity: appInfo.identity,
          tableId: appInfo.tableId,
          viewId: appInfo.views.form.viewId,
        });
        setPreviewLink(formTemplateURL);
      }
    };
    run();
  }, []);

  return (
    <div className={styles.iframeWrap}>
      {tipVisible ? (
        <div className={styles.tipWrap}>
          <div>
            <SuccessTipIcon />
            <span>您的操作会实时保存，请谨慎修改</span>
            <a
              style={{
                color: '#5B89FE',
              }}
              onClick={() => {
                setTipVisible(false);
              }}
            >
              知道了
            </a>
          </div>
        </div>
      ) : null}

      {iframeLink ? <iframe ref={iframeRef} src={iframeLink}></iframe> : null}
    </div>
  );
};
