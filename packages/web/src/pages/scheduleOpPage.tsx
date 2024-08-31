import { api, locationHelper, SystemEvent, getIn18Text } from 'api';
import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import moment from 'moment';
import EventBody, { EventBodyRef, SchedulePageEventData } from '@web-schedule/components/CreateBox/EventBody';
import { useEventObserver } from '@web-common/hooks/useEventObserver';
import { ScheduleActions, useActions } from '@web-common/state/createStore';
import { serializeFormMoments } from '@web-schedule/components/CreateBox/util';
import SiriusLayout from '@/layouts';
import PageContentLayout from '@/layouts/Main/pageContentLayout';

const sysApi = api.getSystemApi();
const eventApi = api.getEventApi();
if (sysApi.isElectron() && locationHelper.testPathMatch('/scheduleOpPage')) {
  sysApi.addWindowHookConf({
    hooksName: 'onBeforeClose',
    hookObjName: 'scheduleInterceptorOb',
    intercept: true,
    observerWinId: -1,
  });
}
export default () => {
  const actions = useActions(ScheduleActions);
  const [dataInitialed, setDataInitialed] = useState<SchedulePageEventData | null>(null);
  const [selectDate, setSelectDate] = useState<SchedulePageEventData['selectDate']>();
  const ref = useRef<EventBodyRef>(null);
  useEffect(() => {
    const id = eventApi.registerSysEventObserver('initPage', {
      name: 'scheduleOpPageInitOb',
      func: (ev: SystemEvent) => {
        const initData: SchedulePageEventData = ev.eventData;
        if (ev && ev.eventData) {
          actions.changeScheduleEvent(initData.event);
          actions.updateCatlogList(initData.catalogList);
          actions.updateUnSelectedCatalogIds(initData.unSelectedCatalogIds);
          actions.setCreatDirectStartTime(moment(initData.creatDirectStartTimeStr));
          actions.setCreatDirectEndTime(moment(initData.creatDirectEndTimeStr));
          actions.setScheduleEditFrom(initData.scheduleEditFrom || '');
          actions.setSettingZoneList(initData.settingZoneList);
          actions.setLastSelectTimezone(initData.lastSelectTimezone!);
          actions.setShowSecondaryZone(initData.showSecondaryZone || false);
          setSelectDate(initData.selectDate);
          setDataInitialed(initData);
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('initPage', id);
    };
  }, []);
  const handleClose = () => {
    // 展示主窗口
    try {
      window.electronLib.windowManage.show(-1);
    } catch (e) {
      console.warn('return main window failed', e);
    }
    setDataInitialed(null);
    setSelectDate(undefined);
    setTimeout(() => {
      sysApi.closeWindow();
    }, 50);
  };
  useEventObserver('electronClose', {
    name: 'scheduleOpPageCloseOb',
    func: () => {
      ref.current?.triggerCancel?.();
    },
  });
  if (!dataInitialed || !sysApi.isElectron()) {
    return null;
  }
  return (
    <>
      <Helmet>
        <title>{`${dataInitialed.event ? getIn18Text('BIANJI') : getIn18Text('XINJIAN')}日程`}</title>
      </Helmet>
      <SiriusLayout.ContainerLayout pages="scheduleOpPage">
        <PageContentLayout>
          <EventBody
            initFormChangedMaunal={dataInitialed.formChangedMaunal}
            source={dataInitialed.source}
            key={JSON.stringify(dataInitialed)}
            defaultContactList={dataInitialed.defaultContactList}
            defaultMoreInvitee={dataInitialed.defaultMoreInvitees}
            initValues={serializeFormMoments(dataInitialed.formValues, !0)}
            ref={ref}
            subWindow
            selectDate={selectDate as any}
            onSyncCancel={handleClose}
            onCancel={handleClose}
            defaultLoopRRules={dataInitialed.defaultLoopRRules}
            defaultMeetingTipType={dataInitialed.defaultMeetingTipType}
            belongIdStr={dataInitialed.belongIdStr}
          />
        </PageContentLayout>
      </SiriusLayout.ContainerLayout>
    </>
  );
};
