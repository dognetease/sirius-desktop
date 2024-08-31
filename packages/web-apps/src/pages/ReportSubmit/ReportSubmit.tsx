/*
 * @Author: wangzhijie02
 * @Date: 2022-06-10 17:36:45
 * @LastEditors: wangzhijie02
 * @LastEditTime: 2022-07-07 16:41:20
 * @Description: file content
 */
import React, { useRef, useState, useContext, useEffect } from 'react';
import { apiHolder, DataStoreApi } from 'api';

import { AppsContext } from '../../context';
import { systemApi, diskApi, docHost } from '../../api';
import { useBridge } from '@web-disk/components/Unitable/useBridge';
import { getUnitableCellContactList } from '@web-disk/components/Unitable/api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { genRandomId } from '../../hooks/useRandomIds';
import { dailyReportAppId, pageIdDict, ReportPageBaseProps } from './../../pageMapConf';

//样式
import styles from './index.module.scss';
import { useIframeClickMock } from '../../hooks/useIframeClickMock';
const storeApi: DataStoreApi = apiHolder.api.getDataStoreApi();

const genReceiveKey = (appId: string) => {
  return `${appId}-receiveFlag`;
};

const generateFormCollectPageURL = (params: { formShareId: string; defaultContent: string }) => {
  return `${docHost}unitable/form/?id=${params.formShareId}&default-content=${params.defaultContent}`;
};

const initFormCollectDefaultContent = (userId: string, userName: string, email: string, appId: string) => {
  const result = [
    {
      // item label
      label: '填写人',
      // collaborator field datum
      value: JSON.stringify([
        {
          id: userId,
          name: userName,
          email,
        },
      ]),
      // 该预填项填入后是否可修改
      editable: false,
    },
    {
      label: '日期',
      // date field datum
      value: new Date().toISOString(),
      editable: false,
    },
  ];
  const data = storeApi.getSync(genReceiveKey(appId));

  if (data.suc) {
    result.push({
      label: '接收人',
      value: data.data as unknown as string,
      editable: true,
    });
  }
  return result;
};

export const ReportSubmit: React.FC<ReportPageBaseProps> = props => {
  useIframeClickMock();
  const [previewLink, setPreviewLink] = useState<string>('');
  // const [formShareId, setFormShareId] = useState<string>('');
  const [] = useState(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { setPageId } = useContext(AppsContext);

  const { bridge, iframeLink } = useBridge(iframeRef, previewLink);
  useEffect(() => {
    const run = async () => {
      const userInfo = await systemApi.getCurrentUser();
      const contact = userInfo?.contact?.contact;
      const userId = contact?.id;
      const userEmial = contact?.accountName;
      const userName = contact?.contactName;

      const userAppDetail = await diskApi.getUserApp({ appId: props.appId });
      const isDailyReport = props.appId === dailyReportAppId;
      const appInfo = isDailyReport ? userAppDetail.config.unitables.daily : userAppDetail.config.unitables.weekly;
      const defaultContent = initFormCollectDefaultContent(userId ?? '', userName ?? '', userEmial ?? '', props.appId);
      // console.log('日报发布页默认内容：', defaultContent);

      if (appInfo) {
        const shareId = appInfo.views.form.shareId;

        setPreviewLink(
          generateFormCollectPageURL({
            formShareId: shareId,
            defaultContent: encodeURIComponent(JSON.stringify(defaultContent)),
          })
        );
      }
    };

    run();
  }, []);

  useEffect(() => {
    bridge.on('getContactList', async params => {
      console.log('ReportSubmit component run getContentList', params);
      const result = await getUnitableCellContactList(params);
      return result;
    });

    bridge.on('formCollectSubmitted', (payload: any) => {
      // 这里用于优化：http://jira.netease.com/browse/UNITABLE-1691
      try {
        const receiverField = payload.items.find((field: any) => {
          return field.title === '接收人' && field.field.kind === 'collaborator';
        });
        const receiveValue = receiverField ? payload.result[receiverField.id] : '';
        if (receiveValue) {
          storeApi.putSync(genReceiveKey(props.appId), receiveValue);
        }
      } catch (error) {
        console.error('保存接收人逻辑执行失败：', error);
      }

      setPageId(pageIdDict.appsHome);
      const title = props.appId === dailyReportAppId ? '日报' : '周报';
      const toastKey = genRandomId();
      const clickHandle = () => {
        Toast.destroy(toastKey);
        setPageId(props.appId === dailyReportAppId ? pageIdDict.appsDailyReportDetail : pageIdDict.appsWeeklyReportDetail);
      };
      Toast.info({
        content: (
          <>
            {title}提交成功 <a onClick={clickHandle}>查看所有汇报</a>
          </>
        ),
        duration: 3,
        key: toastKey,
      });
    });
    bridge.on('formCollectCancel', () => {
      const targetPageId = props.appId === dailyReportAppId ? pageIdDict.appsDailyReport : pageIdDict.appsWeeklyReport;
      setPageId(targetPageId);
    });

    return () => {
      bridge.destory();
    };
  }, [bridge]);

  return <div className={styles.iframeWrap}>{iframeLink ? <iframe ref={iframeRef} src={iframeLink}></iframe> : null}</div>;
};
