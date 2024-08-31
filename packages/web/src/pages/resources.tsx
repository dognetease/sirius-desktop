import React, { useEffect, useState, useCallback } from 'react';
import { PageProps } from 'gatsby';
import { api, apiHolder, DataTrackerApi, SystemEvent, util } from 'api';
import Tabs from '@web-disk/components/Tabs/tabs';
import { getParameterByName, parseUrlObjectParams } from '@web-common/utils/utils';
import { useCommonErrorEvent, useEventObserver } from '@web-common/hooks/useEventObserver';
import ErrorBoundary from '@web-common/hooks/ErrorBoundary';
import SiriusLayout from '../layouts';

const systemApi = api.getSystemApi();
const eventApi = apiHolder.api.getEventApi();
const trackerApi = api.requireLogicalApi('dataTrackerApiImp') as DataTrackerApi;
const tag = '[resources]';
/**
 * 资源多页签，桌面端内打开，包含 share分享内容，doc sheet 协同文档和attachment 邮件/云附件资源
 * @param props
 * @returns
 */
const Resources: React.FC<PageProps> = props => {
  const { location } = props;
  const [hash, setHash] = useState<string>(location.hash);
  const [attachmentEventData, setAttachmentEventData] = useState<Map<string, any>>(new Map());
  const [mailAccount, setMailAccount] = useState(() => getParameterByName('account', location.search) || systemApi.getCurrentUser()?.id);
  const [, setWebId] = useState('');
  /**
   * 入口处处理桌面进程关闭
   * @param tab 可选参数，关闭的tab hash
   */
  const onClose = useCallback((tab?: string) => {
    setHash('');
    if (!tab) {
      systemApi.closeWindow();
    }
  }, []);
  /**
   * 处理窗口外释放拖拽
   * @param hash 特指附件资源key
   * @param url 全地址url
   */
  const dndHandler = useCallback((key: string, url) => {
    // 由于窗口间跨域，需传递对应附件类型资源的reducer信息到目标窗口
    if (attachmentEventData.has(key)) {
      const eventData = attachmentEventData.get(key);
      const parseUrl = new URL(url);
      const params = parseUrlObjectParams(parseUrl.hash);
      eventData.windowId = params.targetWindow;
      systemApi.createWindowWithInitData('resources', {
        eventName: 'initPage',
        eventData,
      });
    } else {
      systemApi.handleJumpUrl(-1, url);
    }
  }, []);

  /**
   * 监听其他拖进来的内容
   */
  const onDragOver = useCallback(e => {
    e.dataTransfer.dropEffect = 'move';
    e.preventDefault();
    e.stopPropagation();
    console.log('dragover', e);
  }, []);

  /**
   * 监听其他拖进来并释放的
   */
  const onDrop = useCallback(e => {
    e.preventDefault();
    setWebId(wb => {
      console.log(tag, 'onDrop', wb);
      eventApi.sendSysEvent({
        eventName: 'tabsDrop',
        eventStrData: '',
        eventData: {
          type: 'drop',
          dragEndFromWinId: wb,
        },
      });
      return wb;
    });
  }, []);
  useEffect(() => {
    systemApi.getCurrentWinInfo(true).then(data => {
      console.log(tag, 'setWebId', data?.webId);
      setWebId(String(data.webId));
    });
    document.addEventListener('dragover', onDragOver, false);
    document.addEventListener('drop', onDrop, false);

    return () => {
      document.removeEventListener('dragover', onDragOver, false);
      document.removeEventListener('drop', onDrop, false);
    };
  }, []);

  useCommonErrorEvent('sheetErrorOb', () => {});
  useEventObserver('initPage', {
    name: 'resourcePageInitOb',
    func: (ev: SystemEvent) => {
      const { eventData, _account } = ev;
      if (eventData) {
        _account && setMailAccount(_account);
        const { hash: hashKey, type } = ev.eventData;
        setHash(hashKey);
        if (type === 'attachment') {
          // 附件类型资源需保留reducer内容，为跨窗口拖拽准备
          setAttachmentEventData(att => {
            att.set(ev.eventData.hash, ev.eventData);
            return att;
          });
          eventApi.sendSysEvent({
            eventName: 'attachmentPreviewInitData',
            eventData: ev.eventData,
          });
        }
        trackerApi.track('pc_resource_tabs', {
          type: 'open',
          hash: hashKey,
        });
      }
    },
  });
  const content = <Tabs hash={hash} onClose={onClose} onTabDnD={dndHandler} />;

  return (
    <SiriusLayout.ContainerLayout className="extheme">
      <ErrorBoundary
        name="resource_tabs"
        onReset={() => {
          util.reload();
          return false;
        }}
      >
        {mailAccount && content}
      </ErrorBoundary>
    </SiriusLayout.ContainerLayout>
  );
};

export default Resources;
