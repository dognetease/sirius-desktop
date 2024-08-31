import { Subject } from 'rxjs';
import React, { useEffect, useRef, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import { jumpToAddressListContactList } from '@web-edm/addressBook/utils';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { navigateToLeadPage } from '@web-unitable-crm/api/helper';
import { SystemEvent, getIn18Text } from 'api';
import { GrubProcessCodeEnum, GrubProcessTypeEnum } from '../search/GrubProcess/constants';
import { asyncTaskMessage$ } from '../search/GrubProcess/GrubProcess';
import { getWmPageCurrUrl } from '../utils';

interface Props {
  onFetch: (fetchParams: any) => Promise<any>;
  refresh?: () => void;
  onNavigate?: () => void;
}
interface AddLeadsFnProps {
  noLoading?: boolean;
  extraFetchParams?: any;
  selectedNum?: number;
  asyncTaskTitle?: string;
}
export const batchAddSuccessMessage$ = new Subject<SystemEvent>();
export const useLeadsAdd = (props: Props) => {
  const { onFetch, refresh, onNavigate } = props;
  const asyncIdList = useRef<string[]>([]);
  const [leadsAddLoading, setLeadsAddLoading] = useState<boolean>(false);
  const toLeadsList = useMemoizedFn(() => {
    onNavigate?.();
    navigateToLeadPage();
  });
  const toMarketingList = useMemoizedFn((extraFetchParams?: any) => () => {
    onNavigate?.();
    jumpToAddressListContactList({
      groupIds: extraFetchParams?.leadsGroupIdList ?? [],
      backUrl: getWmPageCurrUrl(),
      backName: '上一级页面',
      listName: '选中的分组联系人',
    });
  });

  const generateMessageComp = useMemoizedFn((extraFetchParams?: any) => (
    <span>
      {getIn18Text('LURUXIANSUOCHENGGONG')}
      <span style={{ color: '#7088FF', cursor: 'pointer' }} onClick={toLeadsList}>
        {getIn18Text('QUXIANSUOLIEBIAOCHAKAN')}
      </span>
      或
      <span style={{ color: '#7088FF', cursor: 'pointer' }} onClick={toMarketingList(extraFetchParams)}>
        去发起营销
      </span>
    </span>
  ));
  const noLeadsWarning = useMemoizedFn(() => {
    message.warning({ content: '所选数据均已录入，请选择未被录入的数据' });
  });
  const handleAddLeads = useMemoizedFn(async ({ noLoading, extraFetchParams, selectedNum = 1, asyncTaskTitle }: AddLeadsFnProps) => {
    if (selectedNum <= 0) {
      noLeadsWarning();
      return;
    }
    if (!noLoading) {
      setLeadsAddLoading(true);
    }
    try {
      const res = await onFetch(extraFetchParams);
      if (res && typeof res === 'object' && res.asyncId) {
        const sendEvent = () => {
          asyncTaskMessage$.next({
            eventName: 'globalSearchGrubTaskAdd',
            eventData: {
              type: GrubProcessTypeEnum.leads,
              data: {
                id: res.asyncId,
                name: `共${selectedNum}${asyncTaskTitle ?? '家公司'}`,
                // 海关全球搜的code前端处理是一样的，所以这里不需要区分
                code: GrubProcessCodeEnum.globalBatchAddLeads,
                grubStatus: 'GRUBBING',
              },
            },
          });
        };
        if (window?.requestIdleCallback) {
          window.requestIdleCallback(
            deadline => {
              if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
                sendEvent();
              }
            },
            { timeout: 1000 }
          );
        } else {
          setTimeout(() => {
            sendEvent();
          }, 1000);
        }
        asyncIdList.current.push(res.asyncId);
        message.warning({ content: '由于录入线索数据较多，需要较长时间完成' });
      } else {
        message.success({ content: generateMessageComp(extraFetchParams), duration: 3 });
        refresh?.();
      }
    } catch (e) {
      // do nothing
    }
    if (!noLoading) {
      setLeadsAddLoading(false);
    }
  });
  useEffect(() => {
    const r = batchAddSuccessMessage$.subscribe(event => {
      if (event?.eventData?.type === GrubProcessTypeEnum.leads && asyncIdList.current.includes(event?.eventData?.data?.id ?? '')) {
        asyncIdList.current = asyncIdList.current.filter(item => item !== event.eventData.data.id);
        refresh?.();
      }
    });
    return () => {
      r.unsubscribe();
    };
  }, [refresh]);
  return { handleAddLeads, leadsAddLoading, setLeadsAddLoading, noLeadsWarning };
};
