import React, { useState, useEffect, useCallback, useRef } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { api, EntityCatalog, ProductTagEnum, ScheduleModel, ZoneItem } from 'api';
import pick from 'lodash/pick';
import lGet from 'lodash/get';
import moment from 'moment';
import SchduleForm, { SchduleFormProps, ScheduleFormRef, ScheduleInsertForm } from './ScheduleForm';
import { MeetingRoomForm } from './MeetingRoomForm';
import DayViewTimeLineGrid from '../DayViewTimeLineGrid/DayViewTimeLineGrid';
import useForceUpdate from '../../forceUpdate';
import { checkMeettingRoomExsit } from '../../service';
import Alert from '@web-common/components/UI/Alert/Alert';
import { SelectDate } from '../../schedule';
import { ScheduleActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { getContanctObjs, OptionData, reminderOpts, serializeFormMoments } from './util';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { MeetingRoomTipType } from './MeetingRoomUntilTip';
import ProductAuthTag from '@web-common/components/UI/ProductAuthTag/ProductAuthTag';
import { ScheduleSyncObInitiator } from '../../data';
import { ContactItem } from '@web-common/utils/contact_util';
import { ScheduleSyncEvent } from '@web-common/state/reducer/scheduleReducer';
import styles from './eventBody.module.scss';
import { getIn18Text } from 'api';
const sysApi = api.getSystemApi();
const eventApi = api.getEventApi();
export interface EventBodyProps {
  onCancel?(e?: ScheduleSyncEvent | null | undefined): void;
  selectDate?: SelectDate;
  subWindow?: boolean;
  defaultexpanded?: boolean;
  initValues?: any;
  defaultContactList?: ContactItem[];
  defaultMoreInvitee?: ContactItem[];
  onSyncCancel?(): void;
  defaultMeetingTipType?: MeetingRoomTipType;
  defaultLoopRRules?: OptionData[];
  onTimeRelatedValuesChange?(values: ScheduleInsertForm): void;
  source?: ScheduleSyncObInitiator;
  initFormChangedMaunal?: boolean;
  belongIdStr?: string; // 调用方id，用于在回调事件中确认归属
}
export interface SchedulePageEventData {
  catalogList: EntityCatalog[];
  lastSelectTimezone?: ZoneItem | null | undefined;
  settingZoneList: number[];
  showSecondaryZone?: boolean;
  unSelectedCatalogIds: string[];
  event?: ScheduleModel | null;
  selectDate?: SelectDate;
  creatDirectStartTimeStr?: string; // 直接创建日程，开始时间字符串：格式YYYY-MM-DD HH:mm
  creatDirectEndTimeStr?: string; // 直接创建日程，开始时间字符串：格式YYYY-MM-DD HH:mm
  formValues?: any;
  defaultContactList?: ContactItem[];
  defaultMoreInvitees?: ContactItem[];
  defaultMeetingTipType?: MeetingRoomTipType;
  defaultLoopRRules?: OptionData[];
  source?: ScheduleSyncObInitiator;
  formChangedMaunal?: boolean;
  belongIdStr?: string; // 调用方id，用于在回调事件中确认归属
  scheduleEditFrom?: string; // 事件创建来源，参考scheduleReducer中scheduleEditFrom说明
}
export interface EventBodyRef {
  triggerCancel?(): void;
  setFormValues?(v: any): void;
}
const EventBody: React.ForwardRefRenderFunction<EventBodyRef, EventBodyProps> = (
  {
    onCancel,
    selectDate,
    subWindow = false,
    initValues,
    defaultContactList,
    defaultMoreInvitee,
    defaultexpanded = false,
    onSyncCancel,
    defaultMeetingTipType,
    defaultLoopRRules,
    onTimeRelatedValuesChange,
    source = ScheduleSyncObInitiator.MAIN_MODULE,
    initFormChangedMaunal = false,
    belongIdStr = '',
  }: EventBodyProps,
  ref
) => {
  const [selectingMeetingRoom, setSelectingMeetingRoom] = useState<boolean>(false);
  const [meetingRoomExsit, setMeetingRoomExsit] = useState<boolean>(false);
  const [selectedAddr, setSelectedAddr] = useState<string>('');
  const [expanded, setExpanded] = useState<boolean>(subWindow || defaultexpanded);
  const { catalogList, scheduleEvent, unSelectedCatalogIds, scheduleEditFrom, lastSelectTimezone, showSecondaryZone, settingZoneList } = useAppSelector(
    state => state.scheduleReducer
  );
  const actions = useActions(ScheduleActions);
  const formRef = useRef<ScheduleFormRef>(null);
  const forceUpdate = useForceUpdate();
  const [formChangedMaunal, setFormChangedMaunal] = useState<boolean>(initFormChangedMaunal);
  const handleFormChange = () => {
    setFormChangedMaunal(true);
    forceUpdate();
  };
  const handleExpanded = async (b: boolean) => {
    if (sysApi.isElectron() && !subWindow) {
      const initData: SchedulePageEventData = {
        settingZoneList,
        lastSelectTimezone,
        showSecondaryZone,
        formChangedMaunal,
        unSelectedCatalogIds,
        catalogList,
        event: scheduleEvent,
        // catalogList: catalogList,
        defaultMeetingTipType: formRef.current?.getMeetingTipType?.(),
        defaultLoopRRules: formRef.current?.getLoopRRules?.(),
        formValues: serializeFormMoments(formRef.current?.getFormInstance().getFieldsValue()),
      };
      if (selectDate) {
        initData.selectDate = { ...(pick(selectDate, ['start', 'end', 'allDay', 'view.type']) as SelectDate) };
      }
      if (Array.isArray(initData.formValues.required)) {
        initData.defaultContactList = await getContanctObjs(initData.formValues.required);
      }
      if (Array.isArray(initData.formValues.moreInvitee)) {
        initData.defaultMoreInvitees = await getContanctObjs(initData.formValues.moreInvitee);
      }
      if (Array.isArray(initData.formValues.enmuReminders) && initData.formValues.enmuReminders.length === 0) {
        initData.formValues.enmuReminders = [reminderOpts(lGet(initData.formValues, ['time', 'allDay']))[0].value];
      }
      if (scheduleEditFrom) {
        initData.scheduleEditFrom = scheduleEditFrom;
      }
      sysApi.createWindowWithInitData('scheduleOpPage', { eventName: 'initPage', eventData: initData });
      onCancel && onCancel();
    } else {
      setExpanded(b);
    }
  };
  const handleCancel = useCallback(() => {
    if (!onCancel) {
      return;
    }
    if (formChangedMaunal) {
      const al = Alert.error({
        cancelText: getIn18Text('JIXUBIANJI'),
        okText: getIn18Text('QUEDINGTUICHU'),
        okCancel: !0,
        content: getIn18Text('RICHENGWEIBAOCUN'),
        okType: 'danger',
        onOk: () => {
          al.destroy();
          onCancel();
        },
        maskStyle: { left: 0 },
      });
    } else {
      onCancel();
    }
  }, [formChangedMaunal, onCancel]);
  const syncSchedule: SchduleFormProps['onAfterSubmit'] = async (action, msg?: string) => {
    if (sysApi.isElectron() && subWindow) {
      const startDate = formRef.current?.getFormInstance().getFieldValue(['moments', 'startDate']);
      await eventApi.sendSysEvent({
        eventName: 'syncSchedule',
        eventData: {
          msg,
          startDate: moment.isMoment(startDate) ? startDate.valueOf() : null,
        },
        eventStrData: source,
      });
    } else {
      msg && SiriusMessage.success({ content: msg });
      actions.syncSchedule(action);
    }
  };

  const expandedElRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (expanded) {
      if (expandedElRef && expandedElRef.current && expandedElRef.current.getBoundingClientRect) {
        const rect = expandedElRef.current.getBoundingClientRect();
        if (rect) {
          expandedElRef.current.style.height = rect.height + 'px';
        }
      }
    }
  }, [expanded]);

  // 提交成功后
  const handleAfterSubmit: SchduleFormProps['onAfterSubmit'] = async (action, msg?: string) => {
    onSyncCancel && onSyncCancel();
    await syncSchedule(action, msg);
    onCancel && onCancel(action, msg);
  };
  React.useImperativeHandle(
    ref,
    () => ({
      triggerCancel: () => {
        handleCancel();
      },
      setFormValues: (values?: any) => {
        formRef.current?.getFormInstance().setFieldsValue(values);
      },
    }),
    [handleCancel]
  );
  useEffect(() => {
    checkMeettingRoomExsit().then(setMeetingRoomExsit);
  }, []);
  return (
    <>
      <OverlayScrollbarsComponent style={{ display: selectingMeetingRoom ? 'none' : 'block', height: '100%' }}>
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            minHeight: 392,
          }}
          className="ant-allow-dark dark-white-bg"
        >
          <div style={{ width: subWindow ? 580 : 580, flexShrink: 0 }}>
            <ProductAuthTag type="bar" tagName={[ProductTagEnum.MEETING_SETTING, ProductTagEnum.SCHEDULE_SETTING]} tipText={getIn18Text('HUIYISHI/RI')} />
            <SchduleForm
              formChangedMaunal={formChangedMaunal}
              onTimeRelatedValuesChange={onTimeRelatedValuesChange}
              defaultLoopRRules={defaultLoopRRules}
              defaultMeetingTipType={defaultMeetingTipType}
              defaultContactList={defaultContactList}
              defaultMoreInvitee={defaultMoreInvitee}
              initValues={initValues}
              style={subWindow ? undefined : { maxHeight: 440 }}
              onAfterSubmit={handleAfterSubmit}
              onGoSelectMeetingRoom={() => setSelectingMeetingRoom(true)}
              ref={formRef}
              meetingRoomExsit={meetingRoomExsit}
              onChange={handleFormChange}
              onCancel={handleCancel}
              selectDate={selectDate}
              onExpand={handleExpanded}
              expanded={expanded}
              selectingMeetingRoom={selectingMeetingRoom}
              belongIdStr={belongIdStr}
            />
          </div>
          {expanded && (
            <div
              style={{
                // borderLeft: 'solid 1px #EEEEEE',
                flexShrink: 0,
                flexGrow: 1,
                minWidth: 380,
              }}
              ref={expandedElRef}
              className={styles.dayViewWrap}
            >
              <DayViewTimeLineGrid
                startDate={formRef.current?.getFormInstance().getFieldValue(['moments', 'startDate'])}
                endDate={formRef.current?.getFormInstance().getFieldValue(['moments', 'endDate'])}
                startTime={formRef.current?.getFormInstance().getFieldValue(['moments', 'startTime'])}
                endTime={formRef.current?.getFormInstance().getFieldValue(['moments', 'endTime'])}
                allDay={formRef.current?.getFormInstance().getFieldValue(['time', 'allDay'])}
                users={formRef.current?.getFormInstance().getFieldValue('required')}
              />
            </div>
          )}
        </div>
      </OverlayScrollbarsComponent>
      {selectingMeetingRoom && meetingRoomExsit && (
        <MeetingRoomForm
          style={{
            height: subWindow ? 'calc(100% - 32px)' : 542,
            width: subWindow ? '100%' : 680,
          }}
          onNavigate={() => {
            onCancel && onCancel();
          }}
          onSelectAddr={setSelectedAddr}
          defaultSelectedAddr={selectedAddr}
          onBack={ok => {
            if (ok) {
              setFormChangedMaunal(ok);
            }
            setSelectingMeetingRoom(false);
          }}
          scheduleFormRef={formRef.current}
        />
      )}
    </>
  );
};
export default React.forwardRef(EventBody);
