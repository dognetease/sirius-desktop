/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import classnames from 'classnames';
import { Button, ButtonProps, Form, FormInstance, FormItemProps, FormProps, Input, Popover, PopoverProps, Select, Tooltip, InputNumber } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { api, ApiResponse, day, EntityCatalog, FreeBusyModel, ProductTagEnum, RecurrenceRuleParam, ReminderAction, ScheduleInsert } from 'api';
import Checkbox from 'antd/lib/checkbox/Checkbox';
import moment, { isMoment, Moment } from 'moment';
import { NamePath } from 'antd/lib/form/interface';
import isEqual from 'lodash/isEqual';
import debounce from 'lodash/debounce';
import lodashValues from 'lodash/values';
import lodashDefaults from 'lodash/defaults';
import throttle from 'lodash/throttle';
import cloneDeep from 'lodash/cloneDeep';
import styles from './createbox.module.scss';
import eventcontentStyles from '../EventContent/eventcontent.module.scss';
import {
  busyStatus,
  loopRules as baseLoopRules,
  reminderOpts,
  clazzMap,
  EnmuRecurrenceRule,
  EnmuReminders,
  valiteMoment,
  isWeekday,
  constructAvailableMeetingRoomParam,
  parseRecurrenceRuleToFormRule,
  OptionData,
  initDefaultMoment,
  backfillReminder,
  reminderTimeUnitOpts,
  reminderActionOpts,
  DEFAULT_REMINDER_ALL_DAY,
  DEFAULT_REMINDER,
  getReminderByDefaultReminderAction,
  ReminderTimeUnit,
} from './util';
import { addEvent, editEvent, getCatalogList, getMeetingRoomAvailabelList, getOneMeetingRoomInfo, queryFreeBusyList } from '../../service';
import { SelectDate } from '../../schedule';
import { CatalogPrivilege, InviteType, ScheduleSendMailEnum } from '../../data';
import { getDateByForm, getReminderText, getTimeUnitTextByEnum, isCrossDay, senderMailToOriginInvitees } from '../../util';
import { RangeContent } from './PopContent';
import TimeStepPicker from '../TimeStepPicker/TimeStepPicker';
import pasteInputHoc, { PASTE_FLAG } from '../PasteInput/PasteInput';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { verifyEmail } from '@web-mail-write/util';
import Alert from '@web-common/components/UI/Alert/Alert';
import LocationInput from '../LocationInput/LocationInput';
import { rangeInteract } from '../TimeLinePicker/util';
import ArrowRight from '@web-common/components/UI/Icons/svgs/disk/ArrowRight';
import { transContactInfo2ContactItem } from '@web-common/components/util/contact';
import ContactScheduleModal from '@web-common/components/UI/SiriusContact/scheduleModal';
import ScheduleDatePicker from '../FormComponents/ScheduleDatePicker';
import { ScheduleActions, useActions, useAppSelector } from '@web-common/state/createStore';
import MeetingRoomUntilTip, { MeetingRoomTipType } from './MeetingRoomUntilTip';
import { ScheduleState } from '@web-common/state/state';
import { withProductAuthTag } from '@web-common/components/UI/ProductAuthTag/ProductAuthTag';
import { ContactItem } from '@web-common/utils/contact_util';
import InputContextMenu from '@web-common/components/UI/InputContextMenu/InputContextMenu';
import ScheduleUploadFile from './ScheduleUploadFile';
import CustomRepeat, { getRecurIntro } from './customRepeat';
import { getIn18Text } from 'api';
import { DescEditor } from './DescEditor';
import { interval } from 'rxjs';
import ScheduleTimezoneSelect from '@web-common/components/ScheduleTimeZoneSelect/scheduleTimeZoneSelect';
const FormItem = Form.Item;
const AuthTagSelect = withProductAuthTag(Select);
const AuthTagFormItem = withProductAuthTag<FormItemProps>(FormItem);
const PasteInput = pasteInputHoc(Input);
const PasteTextArea = pasteInputHoc(Input.TextArea);
const sysApi = api.getSystemApi();
const eventApi = api.getEventApi();
const isElectron = sysApi.isElectron();
const isEdm = sysApi.inEdm();
const storeApi = api.getDataStoreApi();
const queuedQueryFreeBusyList = async (param: Parameters<typeof queryFreeBusyList>[0]) => {
  const timestmp = Date.now();
  const data = await queryFreeBusyList(param);
  return {
    data,
    timestmp,
  };
};
export interface SchduleFormProps {
  selectDate?: SelectDate;
  onCancel?(): void;
  onChange?: FormProps['onValuesChange'];
  meetingRoomExsit?: boolean;
  onGoSelectMeetingRoom?(): void;
  onExpand?(e: boolean): void;
  expanded?: boolean;
  selectingMeetingRoom?: boolean;
  onAfterSubmit?(data: ScheduleState['scheduleSync'], msg?: string): Promise<void>;
  style?: React.CSSProperties;
  initValues?: ScheduleInsertForm;
  defaultContactList?: ContactItem[];
  defaultMeetingTipType?: MeetingRoomTipType;
  defaultLoopRRules?: OptionData[];
  onTimeRelatedValuesChange?(values: ScheduleInsertForm): void;
  formChangedMaunal?: boolean;
  belongIdStr?: string;
}
export interface ScheduleInsertForm extends ScheduleInsert {
  moments: {
    startDate: Moment | null;
    endDate: Moment | null;
    startTime?: Moment | null;
    endTime?: Moment | null;
  };
  enmuReminders?: Array<EnmuReminders>;
  enmuRecurrenceRule?: EnmuRecurrenceRule | string;
  rruleUntil?: Moment; // 日程重复规则截止日期
  count?: number; // 日程重复规则次数
  interval?: number; // 日程重复规则,间隔
  byDay?: { [key: number]: day[] }; // 重复为每周的周几
  byMonthDay?: number[]; // 每月日期列表。有效值为1到31。
  byMonth?: number[]; // 一年中的月份列表。 有效值为1到12。
  bySetPos?: number[]; // 重复实例集中的第n个事件。有效值为1到366或-366到-1。
}
export type AddConditonKey = 'senderMail' | 'autoPrev';
export type EditConditionKey = 'senderMail' | 'range';
export type FormSubmitConditon = Map<AddConditonKey | EditConditionKey, any>;
export const genMaxLenValue = (props: { max: number; name: string }) => (e: any) => {
  let cutTipText = '';
  if (e.target[PASTE_FLAG]) {
    cutTipText = getIn18Text('\uFF0CYIWEININZI');
  }
  const value = e.target.value || '';
  if (value.length > props.max) {
    SiriusMessage.error({ content: `${props.name}最多为${props.max}字${cutTipText}` });
  }
  return value.slice(0, props.max);
};
export const valitedMeetingError = (code?: number | string, onOk?: () => void) => {
  let errorMsg = '';
  switch (code) {
    case 60202:
      errorMsg = getIn18Text('HUIYISHISHIJIAN11');
      break;
    case 60201:
      errorMsg = getIn18Text('GAIHUIYISHIYI11');
      break;
    case 60200:
    case 60300:
      errorMsg = getIn18Text('GAIHUIYISHIYI');
      break;
    default:
      break;
  }
  if (errorMsg !== '') {
    const al = Alert.info({
      title: errorMsg,
      okText: getIn18Text('ZHONGXINXUANZE'),
      width: 280,
      onOk: () => {
        al.destroy();
        if (onOk) {
          onOk();
        }
      },
      okCancel: !0,
    });
    return true;
  }
  return false;
};
export interface ScheduleFormRef {
  getFormInstance(): FormInstance<ScheduleInsertForm>;
  getMeetingTipType?(): MeetingRoomTipType | undefined;
  getLoopRRules?(): OptionData[];
}
const formElementId = 'schdule_form_body';
const formElement = () => document.getElementById(formElementId) || document.body;
function ExpandButton(props: ButtonProps) {
  const { onClick } = props;
  const [loading, setLoading] = useState<boolean>(false);
  const handleClick = useCallback(
    debounce(
      (e: any) => {
        setLoading(!0);
        onClick && onClick(e);
      },
      1000,
      {
        leading: true,
        trailing: false,
      }
    ),
    [onClick]
  );
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Button loading={loading} {...props} onClick={handleClick} />
  );
}

const limitWordCount = 2000;
const SchduleForm: React.ForwardRefRenderFunction<ScheduleFormRef, SchduleFormProps> = (
  {
    selectDate,
    onChange,
    meetingRoomExsit,
    onGoSelectMeetingRoom,
    onExpand,
    expanded,
    selectingMeetingRoom,
    onAfterSubmit,
    style,
    initValues,
    defaultContactList,
    defaultMoreInvitee,
    defaultMeetingTipType,
    defaultLoopRRules,
    onTimeRelatedValuesChange,
    formChangedMaunal,
    belongIdStr,
  }: SchduleFormProps,
  ref
) => {
  const [form] = Form.useForm<ScheduleInsertForm>();
  const [loopRules, setLoopRules] = useState<OptionData[]>(defaultLoopRRules || baseLoopRules);
  const autoFocusRef = useRef<any>(null);
  const didianInputRef = useRef<any>(null);
  const editorInstance = useRef<any>(null);
  const [overLimit, setOverLimit] = useState<boolean>(false);
  const [defaultReminders, setDefaultReminders] = useState<number[]>([0]);
  const [editorContentChange, setEditorContentChange] = useState<boolean>(false);
  // const forceUpdate = useForceUpdate();
  const [meetingTipType, setMeetingTipType] = useState<MeetingRoomTipType | undefined>(defaultMeetingTipType);
  const [untilDateTimeTemp, setUntilDateTimeTemp] = useState<Moment>();
  // const [expanded, setExpanded] = useState<boolean>(false)
  const [confirmProps, setConfirmProps] = useState<Partial<PopoverProps>>({ visible: false });
  const [formSubmitCondition, setFormSubmitCondition] = useState<FormSubmitConditon>(new Map());
  const {
    unSelectedCatalogIds,
    catalogList,
    scheduleEvent: editingEvent,
    creatDirectStartTime,
    creatDirectEndTime,
    scheduleEditFrom,
  } = useAppSelector(state => ({
    ...state.scheduleReducer,
    catalogList: state.scheduleReducer.catalogList.filter(e => (e.isOwner || e.privilege === CatalogPrivilege.OPREATE) && !e.syncAccountId),
  }));
  const { updateUnSelectedCatalogIds } = useActions(ScheduleActions);
  const uid = editingEvent?.scheduleInfo.uid;
  const [submiting, setSubmiting] = useState<boolean>(false);
  const [userBusy, setUserBusy] = useState<FreeBusyModel[]>([]);
  const formCurStartDate = form.getFieldValue(['moments', 'startDate']);
  const formCurEndDate = form.getFieldValue(['moments', 'endDate']);
  const formCurStartTime = form.getFieldValue(['moments', 'startTime']);
  const formCurEndTime = form.getFieldValue(['moments', 'endTime']);
  const formCurAllDay = form.getFieldValue(['time', 'allDay']);
  const formCurUsers: string[] = form.getFieldValue('required') || [];
  useEffect(() => {
    if (autoFocusRef.current) {
      autoFocusRef.current.focus();
    }
  }, []);
  const queueFreebusy = useRef<number>(0);
  const throttledQueuedQueryFreeBusyListCallback = useCallback(
    throttle((param: Parameters<typeof queuedQueryFreeBusyList>[0]) => {
      queuedQueryFreeBusyList(param).then(({ timestmp, data }) => {
        if (timestmp > queueFreebusy.current) {
          queueFreebusy.current = timestmp;
          setUserBusy(data);
        }
      });
    }, 1000),
    []
  );
  useEffect(() => {
    if (
      moment.isMoment(formCurStartDate) &&
      moment.isMoment(formCurEndDate) &&
      moment.isMoment(formCurStartTime) &&
      moment.isMoment(formCurEndTime) &&
      formCurUsers.length > 0
    ) {
      const start = formCurAllDay
        ? formCurStartDate.clone().startOf('day')
        : formCurStartDate.clone().set({
            hour: formCurStartTime.hours(),
            minute: formCurStartTime.minutes(),
            second: 0,
            millisecond: 0,
          });
      const end = formCurAllDay
        ? formCurEndDate.clone().endOf('day')
        : formCurEndDate.clone().set({
            hour: formCurEndTime.hours(),
            minute: formCurEndTime.minutes(),
            second: 0,
            millisecond: 0,
          });
      throttledQueuedQueryFreeBusyListCallback({
        start: start.toDate(),
        end: end.toDate(),
        users: formCurUsers,
        uid,
      });
    }
  }, [formCurStartDate, formCurEndDate, formCurStartTime, formCurEndTime, formCurUsers, uid, formCurAllDay]);
  useEffect(() => {
    if (autoFocusRef.current) {
      autoFocusRef.current.focus();
    }
  }, []);
  const busyOutput = React.useMemo(() => {
    if (
      moment.isMoment(formCurStartDate) &&
      moment.isMoment(formCurEndDate) &&
      moment.isMoment(formCurStartTime) &&
      moment.isMoment(formCurEndTime) &&
      userBusy.length > 0
    ) {
      const formStart = formCurAllDay
        ? formCurStartDate.clone().startOf('day')
        : formCurStartDate.clone().set({
            hour: formCurStartTime.hours(),
            minute: formCurStartTime.minute(),
            second: 0,
            millisecond: 0,
          });
      const formEnd = formCurAllDay
        ? formCurEndDate.clone().endOf('day')
        : formCurEndDate.clone().set({
            hour: formCurEndTime.hours(),
            minute: formCurEndTime.minute(),
            second: 0,
            millisecond: 0,
          });
      const userBusyStatusArr = userBusy.map(item => {
        let busy = false;
        for (let i = 0; i < item.freeBusyItems.length; i++) {
          const element = item.freeBusyItems[i];
          busy = rangeInteract([moment(element.start), moment(element.end)], [formStart, formEnd]) !== null;
          if (busy) {
            break;
          }
        }
        return busy;
      });
      const busyCount = userBusyStatusArr.filter(e => e).length;
      let text = '';
      let status: 'allBusy' | 'allFree' | 'partBusy';
      if (busyCount === 0) {
        text = getIn18Text('DANGQIANCHENGYUANJUN');
        status = 'allFree';
      } else if (busyCount === userBusyStatusArr.length) {
        text = getIn18Text('SUOYOUCHENGYUANJUN');
        status = 'allBusy';
      } else {
        text = `${userBusyStatusArr.length}名成员中，${busyCount}人在忙`;
        status = 'partBusy';
      }
      return {
        text,
        status,
      };
    }
    return null;
  }, [userBusy, formCurStartTime, formCurEndTime, formCurStartDate, formCurEndDate, formCurAllDay]);
  useEffect(() => {
    if (!initValues) {
      const initenmuReminders = form.getFieldValue('reminders');
      const isAllDay = Boolean(form.getFieldValue(['time', 'allDay']));
      const reminders = getReminderByDefaultReminderAction(isAllDay);
      if (!editingEvent && Array.isArray(initenmuReminders) && initenmuReminders.length === 0) {
        form.setFieldsValue({
          // enmuReminders: [reminderOpts(isAllDay)[0].value as any],
          reminders: [reminders],
        });
      } else if (editingEvent?.scheduleInfo?.reminders?.length) {
        // setDefaultReminders(editingEvent?.scheduleInfo?.reminders.map(e => backfillReminder(e, form.getFieldValue(['time', 'allDay']))));
        form.setFieldsValue({
          // enmuReminders: [reminderOpts(isAllDay)[0].value as any],
          reminders: [
            ...editingEvent?.scheduleInfo?.reminders.map(item => {
              const newItem = { ...item };
              if (item.interval === 0) {
                newItem.beforeOpt = 'current';
              } else {
                newItem.beforeOpt = 'before';
              }
              return newItem;
            }),
          ],
        });
      }
    }
  }, [form, editingEvent, initValues]);
  /** 获取日历列表 并初始话选中日历 */
  useEffect(() => {
    let defaultSelectCatalog: EntityCatalog | undefined;
    if (editingEvent) {
      defaultSelectCatalog = catalogList.find(e => e.id === editingEvent.catalogInfo.id);
    } else {
      // 只从我的日历里面选择
      const myCatalogList = catalogList.filter(e => e.isOwner);
      for (let index = 0; index < myCatalogList.length; index++) {
        const catalog = myCatalogList[index];
        if (!unSelectedCatalogIds.includes(catalog.id)) {
          defaultSelectCatalog = catalog;
          break;
        }
      }
      if (!defaultSelectCatalog) {
        [defaultSelectCatalog] = catalogList;
      }
    }
    // 兜底策略，在切换账号的时候catalogList可能还没获取到 则主动去请求服务获取数据
    // 以防止 defaultSelectCatalog 是undefined造成引用报错
    if (defaultSelectCatalog) {
      form.setFieldsValue({
        catalogId: Number(defaultSelectCatalog.id),
        color: defaultSelectCatalog.color,
      });
    } else {
      getCatalogList(!0).then(res => {
        if (res.length > 0) {
          [defaultSelectCatalog] = res;
          form.setFieldsValue({
            catalogId: Number(defaultSelectCatalog.id),
            color: defaultSelectCatalog.color,
          });
        }
      });
    }
  }, []);
  const handleAfterSubmit = (data: ScheduleState['scheduleSync'], msg?: string) => {
    onAfterSubmit && onAfterSubmit(data, msg);
  };
  // 若保存失败 重置提交状态以便重新提交
  // 若保存成功 保持提交中的状态以禁止重复点击
  const resetSubmitingStatus = () => {
    setSubmiting(false);
    setFormSubmitCondition(new Map());
  };
  const handleSubmit = async (condition: FormSubmitConditon = formSubmitCondition) => {
    if (submiting) {
      return;
    }
    setSubmiting(!0);
    const values = await form.validateFields();
    setConfirmProps({ visible: false });
    const actionText = getIn18Text('BAOCUNRICHENG');
    const actionState = getIn18Text('CHENGGONG');
    try {
      let res: ApiResponse<any>;
      if (editingEvent) {
        res = await editEvent(
          {
            ...values,
            description: editorInstance?.current?.getContent(),
          },
          editingEvent,
          condition
        );
      } else {
        res = await addEvent(
          {
            ...values,
            senderMail: condition.get('senderMail'),
            description: editorInstance?.current?.getContent(),
          },
          condition
        );
      }
      if (Number(res.data?.code) === 200) {
        handleAfterSubmit(
          {
            type: editingEvent ? 'update' : 'add',
            data: editingEvent || values,
          },
          `${actionText}${actionState}`
        );
        // 新增日程的情况下，如果当前日程是在未选中的日历下新建的，则操作选中
        if (!editingEvent && unSelectedCatalogIds.some(id => +id === +values.catalogId)) {
          const newUnSelectedCatalogIds = unSelectedCatalogIds.filter(id => +id !== +values.catalogId);
          // 是客户端并且是大窗新建日程，则发送事件通知
          if (isElectron && expanded) {
            await eventApi.sendSysEvent({
              eventName: 'syncScheduleState',
              eventData: {
                reducerName: 'updateUnSelectedCatalogIds', // 方法名
                newState: newUnSelectedCatalogIds,
              },
            });
          } else {
            // 适用于web端和小窗口新增日程
            updateUnSelectedCatalogIds(newUnSelectedCatalogIds);
          }
        }
        // isElectron新增日程的情况下, 若传入belongIdStr说明需要监听创建成功，发送跨窗口事件
        if (isElectron && !editingEvent && belongIdStr) {
          await eventApi.sendSysEvent({
            eventName: 'syncScheduleState',
            eventData: {
              startDate: values?.moments?.startTime?.format('YYYY-MM-DD HH:mm:ss'),
              summary: values?.summary,
            },
            eventStrData: belongIdStr,
          });
        }
      } else {
        if (
          !valitedMeetingError(res.data?.code, () => {
            onGoSelectMeetingRoom && onGoSelectMeetingRoom();
          })
        ) {
          SiriusMessage.error({ content: `${actionText}失败:${(res.data as any)?.err_msg}` });
        }
        resetSubmitingStatus();
      }
    } catch (error) {
      SiriusMessage.error({ content: `${error}` });
      resetSubmitingStatus();
    }
  };
  const valiteUntil = (values: ScheduleInsertForm) => {
    if (!values.moments.startDate) {
      return false;
    }
    if (values.rruleUntil && values.moments.startDate.isAfter(values.rruleUntil)) {
      SiriusMessage.error({
        content: getIn18Text('KAISHISHIJIANBU11'),
      });
      return false;
    }
    // 如果有正在上传的附件则拦截
    const attachmentsArr = values.attachments || [];
    if (attachmentsArr.length && attachmentsArr.some(f => f.status === 'uploading')) {
      message.error({
        content: getIn18Text('FUJIANSHANGCHUANZHONG11'),
        duration: 2,
      });
      return false;
    }
    return true;
  };
  const handleSave = async (inputcondition: FormSubmitConditon = formSubmitCondition) => {
    const condition = new Map(inputcondition);
    const values = await form.validateFields();
    if (!valiteMoment(values.moments)) {
      return;
    }
    if (!valiteUntil(values)) {
      return;
    }
    /** 月重复日程 涉及到不可覆盖日期 询问保存规则 */
    const enmuRecurrenceRuleStr = values.enmuRecurrenceRule?.split('/')[0];
    if (!condition.has('autoPrev') && enmuRecurrenceRuleStr === EnmuRecurrenceRule.MONTHLY && values.moments.startDate!.date() > 28) {
      setConfirmProps(prev => ({
        ...prev,
        visible: !0,
        title: `不足${values.moments.startDate!.date() > 28 ? values.moments.endDate!.date() : values.moments.endDate!.date()}日将自动安排到每月最后一天？`,
        content: (
          <div className={styles.confirmButtons}>
            <Button
              style={{ marginLeft: 0, marginRight: 'auto' }}
              onClick={() => {
                setConfirmProps({ visible: false });
              }}
            >
              {getIn18Text('JIXUBIANJI')}
            </Button>
            <Button
              onClick={() => {
                condition.set('autoPrev', false);
                handleSave(condition);
              }}
            >
              {getIn18Text('ZHIJIEBAOCUN')}
            </Button>
            <Button
              type="primary"
              onClick={() => {
                condition.set('autoPrev', true);
                handleSave(condition);
              }}
            >
              {getIn18Text('ANPAI')}
            </Button>
          </div>
        ),
      }));
      return;
    }
    // 有受邀者且不仅有自己
    if (!condition.has('senderMail')) {
      if (values.required.length === 0 || (values.required.length === 1 && values.required[0] === sysApi.getCurrentUser()?.id)) {
        condition.set('senderMail', ScheduleSendMailEnum.NOT_SEND);
        handleSave(condition);
        return;
      }
      setConfirmProps(prev => ({
        ...prev,
        visible: !0,
        title: getIn18Text('XIANGSHOUYAOCHENGYUAN'),
        // overlayClassName:'',
        content: (
          <div className={styles.confirmButtons}>
            <Button
              style={{ marginLeft: 0, marginRight: 'auto' }}
              onClick={() => {
                setConfirmProps({ visible: false });
              }}
            >
              {getIn18Text('JIXUBIANJI')}
            </Button>
            <Button
              onClick={() => {
                condition.set('senderMail', ScheduleSendMailEnum.NOT_SEND);
                handleSave(condition);
              }}
            >
              {getIn18Text('BUFASONG')}
            </Button>
            <Button
              type="primary"
              onClick={() => {
                condition.set('senderMail', ScheduleSendMailEnum.SEND);
                handleSave(condition);
              }}
            >
              {getIn18Text('FASONG')}
            </Button>
          </div>
        ),
      }));
      return;
    }
    handleSubmit(condition);
  };
  const handleEdit = async (inputCondition: FormSubmitConditon = formSubmitCondition) => {
    if (!editingEvent) {
      return;
    }
    const condition = new Map(inputCondition);
    const values = await form.validateFields();
    if (!valiteMoment(values.moments)) {
      return;
    }
    if (!valiteUntil(values)) {
      return;
    }
    /** 月重复日程 涉及到不可覆盖日期 询问保存规则 */
    if (!condition.has('autoPrev') && values.enmuRecurrenceRule === EnmuRecurrenceRule.MONTHLY && values.moments.startDate!.date() > 28) {
      setConfirmProps(prev => ({
        ...prev,
        visible: !0,
        title: `不足${values.moments.startDate!.date() > 28 ? values.moments.endDate!.date() : values.moments.endDate!.date()}日将自动安排到每月最后一天？`,
        content: (
          <div className={styles.confirmButtons}>
            <Button
              style={{ marginLeft: 0, marginRight: 'auto' }}
              onClick={() => {
                setConfirmProps({ visible: false });
              }}
            >
              {getIn18Text('JIXUBIANJI')}
            </Button>
            <Button
              onClick={() => {
                condition.set('autoPrev', false);
                handleEdit(condition);
              }}
            >
              {getIn18Text('ZHIJIEBAOCUN')}
            </Button>
            <Button
              type="primary"
              onClick={() => {
                condition.set('autoPrev', true);
                handleEdit(condition);
              }}
            >
              {getIn18Text('ANPAI')}
            </Button>
          </div>
        ),
      }));
      return;
    }
    // 不管咋的，三个范围全部放出，由后端兼容一些边界case
    // 受邀者不支持THIS_AND_FUTRUE
    if (!condition.has('range') && editingEvent.scheduleInfo.recurrenceId) {
      setConfirmProps(prev => ({
        ...prev,
        visible: !0,
        title: getIn18Text('QINGXUANZEGENGXIN'),
        content: (
          <RangeContent
            item={editingEvent}
            hideThisAndFuture={editingEvent.scheduleInfo.inviteeType === InviteType.INVITEE || scheduleEditFrom === 'mail'}
            hideThis={scheduleEditFrom === 'mail'}
            onCancel={() => setConfirmProps({ visible: false })}
            onConfirm={e => {
              condition.set('range', e);
              handleEdit(condition);
            }}
          />
        ),
      }));
      return;
    }
    // 受邀人邮件提醒
    if (
      !condition.has('senderMail') &&
      (editingEvent.scheduleInfo.inviteeType === InviteType.ORGANIZER || editingEvent.scheduleInfo.inviteeType === InviteType.INVITEE)
    ) {
      const originInvitees = new Set<string>(editingEvent.contactInfo.filter(e => e.originInvtees && !e.isOrganizer).map(e => e.email));
      const _originInvitees = new Set(originInvitees);
      const currentInvitees = new Set(values.required.filter(e => e !== editingEvent.scheduleInfo.organizer.extDesc));
      const moreInviteeMembers = new Set(values.moreInvitee.filter(e => e !== sysApi.getCurrentUser()?.id));
      values.required.forEach(id => {
        if (originInvitees.delete(id)) {
          currentInvitees.delete(id);
          moreInviteeMembers.delete(id);
        }
      });
      const hasAdded = currentInvitees.size > 0;
      const hasDeleted = originInvitees.size > 0;
      // todo 添加更多成员的size>0
      const hasAddMoreMembers = moreInviteeMembers.size > 0;
      const inviteeChanged = hasAdded || hasDeleted || hasAddMoreMembers;
      // 没发生改变且为空的时候默认不发送
      if (!inviteeChanged && values.required.length === 0) {
        condition.set('senderMail', ScheduleSendMailEnum.NOT_SEND);
        handleEdit(condition);
        return;
      }
      const titleTip: string[] = [];
      const keyParamChanged = senderMailToOriginInvitees(values, editingEvent, condition);
      const hasOriginInvitee = values.required.some(i => _originInvitees.has(i));
      if (hasAdded || hasAddMoreMembers) {
        titleTip.push(getIn18Text('XIANGXINZENGCHENGYUAN'));
      }
      if (hasDeleted) {
        titleTip.push(getIn18Text('XIANGBEISHANCHUDE'));
      }
      if (keyParamChanged && hasOriginInvitee) {
        titleTip.push(getIn18Text('XIANGYUANYOUCHENGYUAN'));
      }
      // 无需提示
      if (titleTip.length === 0) {
        condition.set('senderMail', ScheduleSendMailEnum.NOT_SEND);
        handleEdit(condition);
        return;
      }
      if (titleTip.length > 1) {
        titleTip[titleTip.length - 1] = getIn18Text('BING') + titleTip[titleTip.length - 1];
      }
      setConfirmProps(prev => ({
        ...prev,
        visible: !0,
        title: titleTip.join('，') + '？',
        // overlayClassName:'',
        content: (
          <div className={styles.confirmButtons}>
            <Button
              style={{ marginLeft: 0, marginRight: 'auto' }}
              onClick={() => {
                setConfirmProps({ visible: false });
              }}
            >
              {getIn18Text('JIXUBIANJI')}
            </Button>
            <Button
              onClick={() => {
                condition.set('senderMail', ScheduleSendMailEnum.NOT_SEND);
                handleEdit(condition);
              }}
            >
              {getIn18Text('BUFASONG')}
            </Button>
            <Button
              type="primary"
              onClick={() => {
                condition.set('senderMail', ScheduleSendMailEnum.SEND);
                handleEdit(condition);
              }}
            >
              {getIn18Text('FASONG')}
            </Button>
          </div>
        ),
      }));
      return;
    }
    handleSubmit(condition);
  };
  const getMeetingCondition = (allValues: ScheduleInsertForm) => {
    const { meetingOrderParam } = allValues;
    return (
      meetingRoomExsit &&
      ((meetingOrderParam !== undefined && meetingOrderParam.update_type !== 2) || (editingEvent?.scheduleInfo.meetingInfo && meetingOrderParam?.update_type !== 2))
    );
  };
  const handleCancelMeetingRoom = () => {
    let changedValues: Partial<ScheduleInsertForm> = {};
    if (editingEvent && editingEvent.scheduleInfo.meetingInfo) {
      const { room_id, order_id, date } = editingEvent.scheduleInfo.meetingInfo;
      changedValues = {
        meetingOrderParam: {
          taken_date: date,
          room_id,
          order_id,
          update_type: 2,
        },
        location: '',
      };
    } else {
      changedValues = {
        location: '',
        meetingOrderParam: undefined,
      };
    }
    form.setFieldsValue(changedValues);
    setMeetingTipType(undefined);
    onChange && onChange(changedValues, { ...form.getFieldsValue(!0), ...changedValues });
  };
  // eslint-disable-next-line arrow-body-style
  const rruleNormalize = (v: any, prev: any) => {
    const startDate: Moment = form.getFieldValue(['moments', 'startDate']);
    form.setFieldsValue({ rruleUntil: undefined });
    if (v === EnmuRecurrenceRule.WEEKDAY && !isWeekday(startDate) && editingEvent) {
      SiriusMessage.error({ content: getIn18Text('KAISHIRIQIFEI') });
      return prev;
    }
    return v;
  };
  const resetReminders = React.useCallback(
    (allDay?: boolean) => {
      // const enmuReminders = form.getFieldValue('enmuReminders');
      // if (Array.isArray(enmuReminders)) {
      const reminder = getReminderByDefaultReminderAction(allDay);
      form.setFieldsValue({
        // enmuReminders: enmuReminders.map(() => reminderOpts(allDay)[0].value) as any,
        reminders: [reminder],
      });
      // }
    },
    [form]
  );
  /**
   * 开始日期变化，联动结束日期
   * 如果是循环规则，重置byDay字段
   */
  const handleStartDateChange = (startDate: Moment | null) => {
    if (startDate) {
      const moments = form.getFieldValue(['moments']);
      const endDate = startDate.clone();
      const newFormFeildValues: Partial<ScheduleInsertForm> = {
        moments: {
          ...moments,
          endDate,
        },
      };
      form.setFieldsValue(newFormFeildValues);
    }
  };
  // 结束时间变化，需要判断是否有会议室，如果有则改为和开始同一天
  const handleEndDateChange = (endDate: Moment | null) => {
    const allValues = form.getFieldsValue();
    const { meetingOrderParam, moments } = allValues;
    const curRoomId = meetingOrderParam?.room_id || editingEvent?.scheduleInfo.meetingInfo?.room_id;
    if (endDate) {
      // 存在会议室，且日期跨天，则结束日期和开始为一天
      if (curRoomId && isMoment(moments.startDate) && isCrossDay(moments.startDate, endDate)) {
        const newEndDate = moments.startDate.clone();
        const newFormFeildValues: Partial<ScheduleInsertForm> = {
          moments: {
            ...moments,
            endDate: newEndDate,
          },
        };
        form.setFieldsValue(newFormFeildValues);
      }
    }
  };
  const handleAllDayChange = (e: any) => {
    const { checked } = e.target;
    resetReminders(checked);
    // 编辑全天日程，取消勾选，开始和结束时刻保持和新建时初始化一致
    if (!checked && editingEvent && editingEvent.scheduleInfo.allDay) {
      const curMoment = moment();
      const curMin = curMoment.minutes();
      curMoment.minutes(curMin > 30 ? 60 : 30);
      form.setFieldsValue({
        moments: {
          ...form.getFieldValue('moments'),
          startTime: curMoment,
          endTime: curMoment.clone().hours(curMoment.hours() + 1),
        },
      });
    }
    // handelTimeChange();
  };
  /** 开始时刻变化，联动结束时刻 */
  const handleStartTimeChange = (startTime: Moment | null) => {
    if (startTime && !(getMeetingCondition(form.getFieldsValue()) && startTime.minutes() % 30 !== 0)) {
      const prevEndTime: Moment | null = form.getFieldValue(['moments', 'endTime']);
      if (prevEndTime && prevEndTime.isAfter(startTime)) {
        return;
      }
      const endTime = startTime.clone().subtract(-1, 'hours');
      if (startTime.hours() >= 23) {
        endTime.hours(23).minutes(45);
      }
      form.setFieldsValue({
        moments: {
          endTime,
        },
      });
    }
    // handelTimeChange();
  };
  const timeNormalize = (name: NamePath) => (v: any, prev: any) => {
    if (isEqual(name, ['moments', 'startDate']) && editingEvent) {
      const enmuRecur = form.getFieldValue('enmuRecurrenceRule');
      if (enmuRecur === EnmuRecurrenceRule.WEEKDAY && isMoment(v) && !isWeekday(v)) {
        SiriusMessage.info({ content: getIn18Text('KAISHIRIQIFEI') });
        return prev;
      }
    }
    if (
      (isEqual(name, ['moments', 'startTime']) || isEqual(name, ['moments', 'endTime'])) &&
      getMeetingCondition(form.getFieldsValue()) &&
      isMoment(v) &&
      v.minutes() % 15 !== 0
    ) {
      SiriusMessage.info({ content: getIn18Text('HUIYISHISHIJIAN') });
      return prev;
    }
    return v;
  };
  /** 颜色默认要传 */
  const handleChangeCatalog = (catalogId: any) => {
    const color = catalogList.find(e => e.id === catalogId)?.color;
    if (color) {
      form.setFieldsValue({ color });
    }
  };
  const handelRRuleChange = async (value: any) => {
    setLoopRules(baseLoopRules);
    // 把整个form都传递进去
    if (value === EnmuRecurrenceRule.CUSTOM) {
      const allValues = form.getFieldsValue();
      const { meetingOrderParam, moments } = allValues;
      constructAvailableMeetingRoomParam(allValues, editingEvent).then(condtion => {
        const curRoomId = meetingOrderParam?.room_id || editingEvent?.scheduleInfo.meetingInfo?.room_id;
        // 有选中会议室
        if (getMeetingCondition(allValues) && condtion && curRoomId) {
          // 自定义规则的请求入参，使用一下每天重复的入参
          const recurrenceRule = { freq: 'DAILY', userFreq: 'DAILY', interval: 1 } as RecurrenceRuleParam;
          const params = { ...condtion, roomId: curRoomId as unknown as number, time: { ...condtion.time, recurrenceRule } };
          getOneMeetingRoomInfo(params).then(res => {
            const { statusCode, untilDate } = res;
            // statusCode,1: 会议室可用; 2: 该会议室不可用, 但是有其他会议室可用; 3: 没有可用会议室， 12可以合并处理
            if (statusCode === 1) {
              const endDate = untilDate ? moment(untilDate) : moments.startDate!.clone().add(3, 'month');
              // 有会议室,则传递自定义规则的截止日期
              customRepeatRef.current?.showCustomRepeat(moments.startDate!.clone(), endDate);
            }
          });
        } else {
          // 没有会议室,则不传递自定义规则的截止日期
          customRepeatRef.current?.showCustomRepeat(moments.startDate!.clone());
        }
      });
    }

    if (value && value !== EnmuRecurrenceRule.NONE && value !== EnmuRecurrenceRule.CUSTOM) {
      // const recurrenceRule: Partial<ScheduleInsertForm> = {
      //   interval: undefined,
      //   byDay: {},
      //   byMonthDay: [],
      //   byMonth: [],
      //   bySetPos: [],
      // };
      // switch (value) {
      //   case EnmuRecurrenceRule.WEEKDAY:
      //     recurrenceRule.byDay = {
      //       0: [1, 2, 3, 4, 5]
      //     };
      //     break;
      //   case EnmuRecurrenceRule.WEEKLY:
      //     recurrenceRule.byDay = {
      //       0: [formCurStartDate.isoWeekday()]
      //     };
      //     break;
      //   default:
      //     return null;
      // }
      // form.setFieldsValue(recurrenceRule)
      form.setFieldsValue({ interval: undefined });
    }
  };
  // 自定义规则组件ref
  const customRepeatRef = useRef(null);
  // 初始化表单
  useEffect(() => {
    if (initValues) {
      if (defaultMeetingTipType === 'until_error') {
        setUntilDateTimeTemp((initValues.moments.startDate || moment()).clone().add(3, 'month'));
      }
      return form.setFieldsValue(initValues);
    }
    if (editingEvent) {
      // 编辑状态下的初始值
      const {
        scheduleInfo: {
          transp,
          clazz,
          description,
          summary,
          attachments = [],
          // recurrenceId,
          reminders,
          allDay,
          start,
          end,
          recur,
          location,
        },
        contactInfo,
      } = editingEvent;
      const initialValues: any = {
        summary,
        transp,
        clazz,
        location,
        description,
        reminders,
        // enmuReminders: [],
        required: contactInfo.filter(e => e.originInvtees).map(e => e.email),
        time: {
          allDay,
        },
        attachments,
      };
      if (recur) {
        // 初始换这块需要改造，回填数据判断
        // (initialValues as any).enmuRecurrenceRule = parseRecurrenceRuleToFormRule(recur);
        // if (recur.until) {
        //   (initialValues as ScheduleInsertForm).rruleUntil = moment({
        //     year: recur.until.y,
        //     month: recur.until.m - 1,
        //     date: recur.until.d,
        //     hour: recur.until.hr,
        //     minute: recur.until.min,
        //     second: recur.until.sec
        //   });
        //   const actLoopRules = baseLoopRules.slice();
        //   const actRuleValue = `${parseRecurrenceRuleToFormRule(recur)}/${EnmuRecurrenceRule.TEMP_INSERT}`;
        //   actLoopRules.push({
        //     value: actRuleValue,
        //     label: baseLoopRules.find(e => e.value === (initialValues as any).enmuRecurrenceRule)?.label
        //       + `${(initialValues as ScheduleInsertForm).rruleUntil?.format(getIn18Text("DAOYYYY"))}`
        //   });
        //   setLoopRules(actLoopRules);
        //   (initialValues as any).enmuRecurrenceRule = actRuleValue;
        // }
        // 如果有截止日期，则同步本地
        if (recur.until) {
          (initialValues as ScheduleInsertForm).rruleUntil = moment({
            year: recur.until.y,
            month: recur.until.m - 1,
            date: recur.until.d,
            hour: recur.until.hr,
            minute: recur.until.min,
            second: recur.until.sec,
          });
        }
        // 如果是重复次数,则同步重复次数
        if (recur.count) {
          (initialValues as ScheduleInsertForm).count = recur.count;
        }
        (initialValues as ScheduleInsertForm).interval = recur.interval;
        (initialValues as ScheduleInsertForm).byDay = recur.byDay;
        (initialValues as ScheduleInsertForm).byMonth = recur.byMonth;
        (initialValues as ScheduleInsertForm).byMonthDay = recur.byMonthDay;
        (initialValues as ScheduleInsertForm).bySetPos = recur.bySetPos;
        // 现整理一下是否是自定义
        const getRecur = parseRecurrenceRuleToFormRule(recur);
        if (getRecur === EnmuRecurrenceRule.TEMP_INSERT) {
          const actRuleValue = `${recur?.freq}/${EnmuRecurrenceRule.TEMP_INSERT}`;
          // 如果是自定义
          const actLoopRules = baseLoopRules.slice();
          actLoopRules.push({
            value: actRuleValue,
            label: recur.recurIntro || '自定义重复', // 此处直接使用服务端返回即可
          });
          (initialValues as any).enmuRecurrenceRule = actRuleValue;
          setLoopRules(actLoopRules);
        } else {
          (initialValues as any).enmuRecurrenceRule = getRecur;
        }
      }
      // 如果有提醒规则 添加下拉选项
      // if (reminders?.length > 0) {
      //   (initialValues as any).enmuReminders = reminders.map(e => backfillReminder(e, !!allDay));
      // }
      const startMoment = moment(start);
      const endMoment = moment(end);
      if (allDay && endMoment.diff(startMoment) > 0) {
        endMoment.add(-1, 'day');
      }
      form.setFieldsValue({
        ...initialValues,
        moments: {
          startDate: startMoment.clone(),
          endDate: endMoment.clone(),
          startTime: startMoment.clone(),
          endTime: endMoment.clone(),
        },
      });
    } else if (selectDate) {
      if (selectDate.view.type === 'timeGridWeek') {
        const timeGridWeekInitEnd = moment(selectDate.end);
        if (selectDate.allDay) {
          timeGridWeekInitEnd.subtract(1, 'day');
        }
        form.setFieldsValue({
          moments: {
            startDate: moment(selectDate.start),
            endDate: timeGridWeekInitEnd,
            startTime: moment(selectDate.start),
            endTime: timeGridWeekInitEnd,
          },
          time: {
            allDay: selectDate.allDay ? 1 : 0,
          },
          reminders: [getReminderByDefaultReminderAction(Boolean(selectDate.allDay))],
        });
      } else if (selectDate.view.type === 'dayGridMonth') {
        // 新建状态下的初始时间
        // 选中日期
        const curMoment = moment();
        const startMoment = moment(selectDate.start);
        const endMoment = moment(selectDate.end);
        const curMin = curMoment.minutes();
        curMoment.minutes(curMin > 30 ? 60 : 30);
        // 组件选中的初始时间都是 00:00:00
        // 比如用户选中了 5日-6日 则是 5日零点到7日0点
        // 因此重设时刻时 结束时间的日期需要往前修正1天
        endMoment.date(endMoment.date() - 1);
        startMoment.hours(curMoment.hours()).minutes(curMoment.minutes());
        endMoment.hours(curMoment.hours() + 1);
        form.setFieldsValue({
          moments: {
            startDate: startMoment,
            endDate: endMoment,
            startTime: startMoment,
            endTime: endMoment,
          },
        });
      }
    } else {
      // 直接新建
      const defaultMoments = initDefaultMoment();
      form.setFieldsValue({
        moments: lodashDefaults(
          {
            startDate: creatDirectStartTime,
            endDate: creatDirectEndTime,
            startTime: creatDirectStartTime,
            endTime: creatDirectEndTime,
          },
          defaultMoments
        ),
      });
    }
    return () => {};
  }, [selectDate, form, editingEvent, initValues]);
  useImperativeHandle(ref, () => ({
    getFormInstance: () => form,
    getMeetingTipType: () => meetingTipType,
    getLoopRRules: () => loopRules,
    resetReminders,
  }));
  // 已经通过backfillReminder数据反查回填到enmuReminders中，不需要这个方法了
  // useEffect(() => {
  // resetReminders(!!form.getFieldValue(['time', 'allDay']));
  // }, [form, resetReminders, selectingMeetingRoom]);
  // 初始值
  const initialValues = initValues || {
    summary: '',
    enmuRecurrenceRule: loopRules[0].value,
    // enmuReminders: [],
    transp: busyStatus[0].value,
    clazz: clazzMap[0].value,
    // required: [sysApi.getCurrentUser()!.id],
    required: defaultContactList && defaultContactList?.length > 0 ? defaultContactList.map(e => e.email) : [],
    reminders: [],
    moreInvitee: [],
  };
  const renderSaveBtn = () => (
    <Popover
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...confirmProps}
      trigger="click"
      overlayClassName={styles.confirmOverlay}
      onVisibleChange={v => {
        setConfirmProps({
          visible: v,
        });
      }}
    >
      <Button
        disabled={meetingTipType !== undefined || (!editorContentChange && !formChangedMaunal && !!editingEvent)}
        loading={submiting}
        type="primary"
        onClick={() => {
          if (!window.navigator.onLine) {
            return SiriusMessage.netWorkError();
          }
          return editingEvent ? handleEdit() : handleSave();
        }}
      >
        {getIn18Text('BAOCUN')}
      </Button>
    </Popover>
  );
  // 会议室选择
  useEffect(() => {
    if (!selectingMeetingRoom) {
      // 此处需要添加settimeout，保证拿到的表单数据是最新的
      const allValues = form.getFieldsValue();
      const { enmuRecurrenceRule, meetingOrderParam, moments, rruleUntil } = allValues;
      const curRoomId = meetingOrderParam?.room_id || editingEvent?.scheduleInfo.meetingInfo?.room_id;
      const willBeRecEvent = enmuRecurrenceRule !== EnmuRecurrenceRule.NONE;
      // 原逻辑废除
      // if (getMeetingCondition(allValues)
      //   && curRoomId
      //   && (rruleUntil === undefined || (moments && rruleUntil.diff(moments.startDate, 'month') > 1))
      //   && willBeRecEvent) {
      //   // 如果选择了会议室，则单独请求此会议室的截止时间
      //   setUntilDateTimeTemp(allValues.moments.startDate!.clone().add(1, 'month'));
      //   setMeetingTipType('until_error');
      // }
      constructAvailableMeetingRoomParam(allValues, editingEvent).then(condtion => {
        if (getMeetingCondition(allValues) && curRoomId && willBeRecEvent && condtion) {
          const params = { ...condtion, roomId: curRoomId as unknown as number };
          getOneMeetingRoomInfo(params)
            .then(res => {
              const { statusCode, untilDate } = res;
              // statusCode,1: 会议室可用; 2: 该会议室不可用, 但是有其他会议室可用; 3: 没有可用会议室，
              if (statusCode === 1 || statusCode === 2) {
                // 当前会议室可用，则判断是否超过截止时间
                const untilDateMoment = untilDate ? moment(untilDate) : moments.startDate!.clone().add(3, 'month'); // 服务端没返回则，默认三个月
                if (untilDateMoment.isBefore(rruleUntil) || rruleUntil === undefined) {
                  setUntilDateTimeTemp(untilDateMoment);
                  setMeetingTipType('until_error');
                }
              }
              // else if (statusCode === 2) {
              //   setMeetingTipType('cur_room_invalid');
              // }
              else if (statusCode === 3) {
                setMeetingTipType('all_room_invalid');
              }
            })
            .catch(() => {
              setMeetingTipType('all_room_invalid');
            });
        }
      });
    }
  }, [selectingMeetingRoom]);
  const handleValuesChange = (changedValues: Partial<ScheduleInsertForm>, _allValues: ScheduleInsertForm) => {
    if (onChange) {
      onChange(changedValues, _allValues);
    }
    if (changedValues.enmuRecurrenceRule === EnmuRecurrenceRule.NONE) {
      setMeetingTipType(undefined);
    }
    if (['moments', 'time'].filter(key => changedValues[key as keyof ScheduleInsertForm]).length) {
      setTimeout(() => {
        onTimeRelatedValuesChange?.(form.getFieldsValue());
      }, 1);
    }
    if (['enmuRecurrenceRule', 'meetingOrderParam', 'moments', 'rruleUntil'].filter(key => changedValues[key as keyof ScheduleInsertForm]).length === 0) {
      return;
    }
    // 如果是选择了自定义重复规则，也直接return
    if (changedValues.enmuRecurrenceRule === EnmuRecurrenceRule.CUSTOM) {
      return;
    }
    if (changedValues.moments && !lodashValues(changedValues.moments).every(isMoment)) {
      return;
    }
    // 用户修改了某个时间相关表单之后，可能会带来其他表单联动变化
    // 但是此时此函数的 _allValues 除了当前修改项，其他联动项还未改变
    // 暂时用宏任务，当其他同步事件都完成之后，执行宏任务
    // 并从form.getFieldsValue()获取最新的表单值去做处理
    // 这里可能有更好的解决方案，后续可以再深入研究下
    setTimeout(async () => {
      const allValues = form.getFieldsValue();
      const { enmuRecurrenceRule, meetingOrderParam, moments, rruleUntil } = allValues;
      const condtion = await constructAvailableMeetingRoomParam(allValues, editingEvent);
      const curRoomId = meetingOrderParam?.room_id || editingEvent?.scheduleInfo.meetingInfo?.room_id;
      const willBeRecEvent = enmuRecurrenceRule !== EnmuRecurrenceRule.NONE;
      // 有选中会议室
      if (getMeetingCondition(allValues) && condtion && curRoomId) {
        if (willBeRecEvent) {
          // setUntilDateTimeTemp(allValues.moments.startDate!.clone().add(1, 'month'));
          // setMeetingTipType('until_error');
          // return;
          const params = { ...condtion, roomId: curRoomId as unknown as number };
          const res = await getOneMeetingRoomInfo(params);
          const { statusCode, untilDate } = res;
          // statusCode,1: 会议室可用; 2: 该会议室不可用, 但是有其他会议室可用; 3: 没有可用会议室， 12可以合并处理
          if (statusCode === 1 || statusCode === 2) {
            // 当前会议室可用，则判断是否超过截止时间
            const untilDateMoment = untilDate ? moment(untilDate) : moments.startDate!.clone().add(3, 'month'); // 服务端没返回则，默认三个月
            if (untilDateMoment.isBefore(rruleUntil) || rruleUntil === undefined) {
              setUntilDateTimeTemp(untilDateMoment);
              setMeetingTipType('until_error');
            }
          }
          // else if (statusCode === 2) {
          //   setMeetingTipType('cur_room_invalid');
          // }
          else if (statusCode === 3) {
            setMeetingTipType('all_room_invalid');
          }
        }
        // 时间相关的表单项发生变化
        if (changedValues.moments || changedValues.time?.allDay || changedValues.enmuRecurrenceRule) {
          getMeetingRoomAvailabelList(condtion)
            .then(list => {
              // 无可用会议室
              if (list.length === 0) {
                setMeetingTipType('all_room_invalid');
                return;
              }
              // 当前会议室不在可用列表中
              if (!list.some(e => e.roomInfo.room_id + '' === curRoomId + '')) {
                setMeetingTipType('cur_room_invalid');
              }
            })
            .catch(() => {
              setMeetingTipType('all_room_invalid');
            });
        }
      }
    }, 1);
  };
  // 自定义规则修改完毕
  const handleCustomRepeatOk = (obj: Partial<ScheduleInsertForm>) => {
    const { rruleUntil, interval, enmuRecurrenceRule, count, byDay, byMonth, byMonthDay, bySetPos, recurIntro } = obj;
    const changedValues: Partial<ScheduleInsertForm> = {
      interval,
      enmuRecurrenceRule: `${enmuRecurrenceRule}/${EnmuRecurrenceRule.TEMP_INSERT}`,
    };
    if (count) {
      changedValues.count = count;
    }
    if (rruleUntil) {
      changedValues.rruleUntil = rruleUntil;
    }
    if (byDay) {
      changedValues.byDay = byDay;
    }
    if (byMonth) {
      changedValues.byMonth = byMonth;
    }
    if (byMonthDay) {
      changedValues.byMonthDay = byMonthDay;
    }
    if (bySetPos) {
      changedValues.bySetPos = bySetPos;
    }
    form.setFieldsValue(changedValues);
    const allValues = {
      ...form.getFieldsValue(),
      ...changedValues,
    };
    const actRules = baseLoopRules.slice();
    actRules.push({
      value: `${enmuRecurrenceRule}/${EnmuRecurrenceRule.TEMP_INSERT}`,
      label: recurIntro,
    });
    setLoopRules(actRules);
    handleValuesChange(changedValues, allValues);
  };
  // 自定义规则点击去掉，或者关闭，重置为不重复
  const handleCustomRepeatCancel = () => {
    form.setFieldsValue({ enmuRecurrenceRule: EnmuRecurrenceRule.NONE });
  };
  const editorChange = () => {
    // contentChanged = true;
    const wordCount = getWordCount();
    setEditorContentChange(wordCount !== 0);
    setOverLimit(wordCount > limitWordCount);
  };
  const editorBlur = () => {
    // const wordCount = getWordCount();
  };
  const getWordCount = () => {
    if (editorInstance?.current) {
      return editorInstance?.current.plugins.wordcount.body.getCharacterCount() || 0;
    }
    return 0;
  };
  const handleBeforeOptChange = useCallback(
    (item, idx) => {
      const reminders = form.getFieldValue('reminders');
      if (reminders[idx]) {
        if (item === 'current') {
          reminders[idx].interval = 0;
        } else if (reminders[idx]?.interval === 0) {
          reminders[idx].interval = 1;
        }
        form.setFieldsValue({ reminders });
      }
    },
    [form]
  );
  const handleIntervalChange = useCallback(
    (item, idx) => {
      const reminders = form.getFieldValue('reminders');
      let val = item;
      let isValid = true;
      if (!reminders[idx]) {
        return;
      }
      const timeUnit = reminders[idx].timeUnit;
      const reminderAction = reminders[idx].reminderAction;
      let maxLength = ReminderTimeUnit.DAY === timeUnit ? 7 : ReminderTimeUnit.HOUR === timeUnit ? 24 : 60;
      if (!Number.isInteger(val)) {
        val = Math.floor(val);
        isValid = false;
      }
      if (val === 0) {
        val = 1;
        isValid = false;
      } else if (val > maxLength) {
        val = maxLength;
        isValid = false;
      }
      if (!isValid) {
        reminders[idx].interval = val;
        form.setFieldsValue({ reminders });
      }

      if (reminderAction !== ReminderAction.EMAIL && ReminderTimeUnit.WEEK === timeUnit && val > 4) {
        reminders[idx].reminderAction = ReminderAction.EMAIL;
        form.setFieldsValue({ reminders });
      }
    },
    [form]
  );
  const getEditorInstance = (editor: any) => {
    editorInstance.current = editor;
  };
  const handleExpand = () => {
    onExpand && onExpand(!0);
  };
  // const formScheduleTimezoneSelect = useMemo(()=>{

  // },[])
  return (
    <>
      <div
        className={classnames(styles.body, {
          [styles.bodyExpanded]: expanded,
        })}
        id={formElementId}
        style={style}
      >
        <Form<ScheduleInsertForm> form={form} colon={false} initialValues={initialValues} onValuesChange={handleValuesChange}>
          {/* 日程主题 */}
          <InputContextMenu
            inputOutRef={autoFocusRef}
            changeVal={val => {
              form.setFieldsValue({ summary: val });
            }}
          >
            <FormItem
              getValueFromEvent={genMaxLenValue({ max: 60, name: getIn18Text('RICHENGZHUTI') })}
              name="summary"
              label={<i className={classnames(eventcontentStyles.icon, eventcontentStyles.summry)} />}
            >
              <PasteInput allowClear ref={autoFocusRef} placeholder={getIn18Text('RICHENGZHUTI')} className={styles.titleInput} />
            </FormItem>
          </InputContextMenu>
          {/* 开始结束时间 */}
          <FormItem label={<i className={classnames(eventcontentStyles.icon, eventcontentStyles.clock)} />} dependencies={[['time', 'allDay']]}>
            {({ getFieldValue }) => {
              const allDay = getFieldValue(['time', 'allDay']);
              const _startDate = getFieldValue(['moments', 'startDate']) || moment();
              const _startTime = getFieldValue(['moments', 'startTime']) || moment();
              const _endDate = getFieldValue(['moments', 'endDate']) || moment();
              const _endTime = getFieldValue(['moments', 'endTime']) || moment();
              const start = getDateByForm(_startDate, _startTime, allDay);
              const end = getDateByForm(_endDate, _endTime, allDay);
              return (
                <>
                  <div
                    className={styles.timeWrapper}
                    style={{
                      justifyContent: allDay ? 'flex-start' : 'space-between',
                    }}
                  >
                    <FormItem normalize={timeNormalize(['moments', 'startDate'])} name={['moments', 'startDate']} noStyle>
                      <ScheduleDatePicker
                        disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE}
                        onChange={handleStartDateChange}
                        className={styles.datePicker}
                      />
                    </FormItem>
                    <FormItem noStyle normalize={timeNormalize(['moments', 'startTime'])} hidden={allDay} name={['moments', 'startTime']}>
                      <TimeStepPicker
                        disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE}
                        className={styles.timePicker}
                        onChange={handleStartTimeChange}
                      />
                    </FormItem>
                    <span
                      className={styles.timeSplit}
                      style={{
                        padding: allDay ? '0 8px' : 0,
                      }}
                    >
                      ——
                    </span>
                    {/* 结束时间 */}
                    <FormItem normalize={timeNormalize(['moments', 'endDate'])} noStyle name={['moments', 'endDate']}>
                      <ScheduleDatePicker
                        disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE}
                        // onChange={handelTimeChange}
                        onChange={handleEndDateChange}
                        className={styles.datePicker}
                      />
                    </FormItem>
                    <FormItem normalize={timeNormalize(['moments', 'endTime'])} noStyle hidden={allDay} name={['moments', 'endTime']}>
                      <TimeStepPicker disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE} className={styles.timePicker} />
                    </FormItem>
                  </div>
                  <div className={styles.formTimezoneSelect}>
                    <ScheduleTimezoneSelect
                      bordered={false}
                      showTimeDiffLabel={true}
                      localZoneStartTime={start}
                      localZoneEndTime={end}
                      allDay={allDay}
                      durationTextLabelStyle={{ paddingLeft: 12 }}
                    />
                  </div>
                </>
              );
            }}
          </FormItem>
          {/* 重复规则 & 全天日程 */}

          <FormItem label={<i className={classnames(eventcontentStyles.icon)} />}>
            <FormItem dependencies={[['moment', 'startDate'], ['rruleUntil']]} normalize={rruleNormalize} noStyle name="enmuRecurrenceRule">
              <AuthTagSelect
                authTagProps={{
                  tagName: ProductTagEnum.SCHEDULE_SETTING,
                  tipText: getIn18Text('XIANSHI'),
                  flowTipStyle: {
                    left: 'calc(100% - 42px)',
                  },
                }}
                id="schedule_form_select_rrule"
                getPopupContainer={expanded ? formElement : undefined}
                disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE}
                onChange={handelRRuleChange}
                dropdownClassName={styles.selectDropDown}
                listItemHeight={30}
                style={{ width: 200, marginRight: 12 }}
                suffixIcon={<i className={`dark-invert ${styles.expandIcon}`} />}
              >
                {loopRules.map(r => (
                  <Select.Option className={styles.selectOption} key={r.value} value={r.value}>
                    {r.label}
                  </Select.Option>
                ))}
              </AuthTagSelect>
            </FormItem>
            <CustomRepeat onOk={handleCustomRepeatOk} onCancel={handleCustomRepeatCancel} ref={customRepeatRef} />
            {/* 全天日程 */}
            <FormItem noStyle normalize={timeNormalize(['time', 'allDay'])} valuePropName="checked" name={['time', 'allDay']}>
              <Checkbox disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE} onChange={handleAllDayChange}>
                <span className={styles.checkboxContent}>{getIn18Text('QUANTIAN')}</span>
              </Checkbox>
            </FormItem>
          </FormItem>
          {/* 邀请成员 */}
          <FormItem
            rules={[
              {
                validator: (_, value) => {
                  const valited = Array.isArray(value) && value.reduce((prev, curv) => prev && verifyEmail(curv?.trim()), true);
                  const limited = Array.isArray(value) && value.length <= 200;
                  if (!limited) {
                    SiriusMessage.error({ content: getIn18Text('SHOUYAOCHENGYUANZONG') });
                  }
                  if (valited && limited) {
                    return Promise.resolve();
                  }
                  return Promise.reject();
                },
              },
            ]}
            label={<i className={classnames(eventcontentStyles.icon, eventcontentStyles.member)} />}
            name="required"
            normalize={itemList => {
              if (Array.isArray(itemList)) {
                return Array.from(
                  new Set(
                    itemList
                      .map(e => {
                        if (e.email && typeof e.email === 'string') {
                          return e.email;
                        }
                        return e;
                      })
                      .filter(e => !!e)
                  )
                );
              }
              return [];
            }}
          >
            <ContactScheduleModal
              includeSelf
              // 暂时隐藏这个功能
              // firstPositionNotDelEmail={
              //   // 新建日程取自身ID，编辑组织者的日程，取组织者的ID
              //   // eslint-disable-next-line no-nested-ternary
              //   !editingEvent
              //     ? sysApi.getCurrentUser()!.id : (
              //       editingEvent.scheduleInfo.inviteeType === InviteType.ORGANIZER ? editingEvent.scheduleInfo.organizer.extDesc : undefined
              //     )
              // }
              disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE}
              defaultSelectList={
                defaultContactList || transContactInfo2ContactItem(editingEvent?.contactInfo.filter(e => e.originInvtees))
                // : [{
                //   name: sysApi.getCurrentUser()!.nickName,
                //   email: sysApi.getCurrentUser()!.id,
                //   avatar: sysApi.getCurrentUser()!.avatar,
                // }])
              }
              useEdm={isEdm}
              type={isEdm ? ['customer', 'personal', 'enterprise', 'team', 'recent'] : ['personal', 'enterprise', 'team', 'recent']}
              dropdownClassName={styles.selectDropDown}
              listItemHeight={30}
              placeholder={getIn18Text('YAOQINGCHENGYUAN')}
              showSuffix
              modalProps={{
                zIndex: 1050,
                maskStyle: expanded ? { left: 0 } : {},
              }}
            />
          </FormItem>
          {busyOutput !== null && formCurUsers.length > 0 && (
            <p
              className={classnames(styles.busyfree, {
                [styles.busyfreeAllbusy]: busyOutput.status === 'allBusy',
                [styles.busyfreeAllfree]: busyOutput.status === 'allFree',
                [styles.busyfreePartbusy]: busyOutput.status === 'partBusy',
              })}
            >
              <span
                className={classnames(styles.busyfreeInner, {
                  [styles.busyfreeInnerExpanded]: expanded,
                })}
                onClick={() => !expanded && onExpand && onExpand(!0)}
              >
                <span> {busyOutput.text}</span>
                {!expanded && <ArrowRight opcacity={1} stroke={busyOutput.status === 'allFree' ? '#386ee7' : '#f74f4f'} />}
              </span>
            </p>
          )}
          <FormItem
            rules={[
              {
                validator: (_, value) => {
                  // 加上已存在的联系人
                  const originInvitees = new Set<string>(editingEvent?.contactInfo.filter(item => item.originInvtees && !item.isOrganizer).map(item => item.email));
                  const valited = Array.isArray(value) && value.reduce((prev, curv) => prev && verifyEmail(curv?.trim()), true);
                  if (valited) {
                    // 去重后计算总数不超过200
                    value.forEach(item => {
                      originInvitees.delete(item);
                    });
                  }
                  const limited = Array.isArray(value) && originInvitees.size + value.length <= 200;
                  if (!limited) {
                    SiriusMessage.error({ content: getIn18Text('SHOUYAOCHENGYUANZONG') });
                  }
                  if (valited && limited) {
                    return Promise.resolve();
                  }
                  return Promise.reject();
                },
              },
            ]}
            label={<i className={classnames(eventcontentStyles.icon, eventcontentStyles.member)} />}
            name="moreInvitee"
            hidden={
              !editingEvent ||
              editingEvent?.scheduleInfo?.organizer?.extDesc === sysApi.getCurrentUser()?.id ||
              (editingEvent && editingEvent?.scheduleInfo?.inviteeType !== InviteType.INVITEE)
            }
            normalize={itemList => {
              if (Array.isArray(itemList)) {
                return Array.from(
                  new Set(
                    itemList
                      .map(e => {
                        if (e.email && typeof e.email === 'string') {
                          return e.email;
                        }
                        return e;
                      })
                      .filter(e => !!e)
                  )
                );
              }
              return [];
            }}
          >
            <ContactScheduleModal
              includeSelf
              // 暂时隐藏这个功能
              // firstPositionNotDelEmail={
              //   // 新建日程取自身ID，编辑组织者的日程，取组织者的ID
              //   // eslint-disable-next-line no-nested-ternary
              //   !editingEvent
              //     ? sysApi.getCurrentUser()!.id : (
              //       editingEvent.scheduleInfo.inviteeType === InviteType.ORGANIZER ? editingEvent.scheduleInfo.organizer.extDesc : undefined
              //     )
              // }
              // disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE}
              // defaulelectList={
              //   defaultStContactList || transContactInfo2ContactItem(editingEvent?.contactInfo.filter(e => e.originInvtees))
              //   // : [{
              //   //   name: sysApi.getCurrentUser()!.nickName,
              //   //   email: sysApi.getCurrentUser()!.id,
              //   //   avatar: sysApi.getCurrentUser()!.avatar,
              //   // }])
              // }
              useEdm={isEdm}
              defaultSelectList={defaultMoreInvitee}
              type={isEdm ? ['customer', 'personal', 'enterprise', 'team', 'recent'] : ['personal', 'enterprise', 'team', 'recent']}
              dropdownClassName={styles.selectDropDown}
              listItemHeight={30}
              placeholder={getIn18Text('TIANJIAGENGDUOSHOUYR')}
              showSuffix
              modalProps={{
                zIndex: 1050,
                maskStyle: expanded ? { left: 0 } : {},
              }}
            />
          </FormItem>
          {/* 地点 */}
          <AuthTagFormItem
            authTagProps={{
              tagName: ProductTagEnum.MEETING_SETTING,
              tipText: getIn18Text('XIANSHI'),
              style: {
                display: 'block',
              },
              flowTipStyle: {
                zIndex: 2,
              },
            }}
            shouldUpdate={(prev, curv) => prev.meetingOrderParam !== curv.meetingOrderParam}
            label={<i className={classnames(eventcontentStyles.icon, eventcontentStyles.location)} />}
          >
            {({ getFieldsValue, getFieldValue }) => {
              // 存在会议室
              if (getMeetingCondition(getFieldsValue())) {
                return (
                  <FormItem name="location" noStyle>
                    <LocationInput
                      disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE}
                      id="schedule_form_input_location"
                      onCancel={handleCancelMeetingRoom}
                      onUpdate={() => {
                        // form.setFieldsValue({ rruleUntil: undefined });
                        onGoSelectMeetingRoom && onGoSelectMeetingRoom();
                      }}
                    />
                  </FormItem>
                );
              }
              return (
                <InputContextMenu
                  inputOutRef={didianInputRef}
                  changeVal={val => {
                    form.setFieldsValue({ location: val });
                  }}
                >
                  <FormItem name="location" getValueFromEvent={genMaxLenValue({ max: 60, name: getIn18Text('RICHENGDEDIAN') })} noStyle>
                    <PasteInput
                      id="schedule_form_input_location"
                      disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE}
                      allowClear
                      placeholder={getIn18Text('RICHENGDEDIAN')}
                      ref={didianInputRef}
                      suffix={
                        meetingRoomExsit && getFieldValue(['moments', 'startDate']) && getFieldValue(['moments', 'endDate']) ? (
                          // eslint-disable-next-line jsx-a11y/anchor-is-valid
                          <a
                            style={{ fontSize: 12 }}
                            onClick={e => {
                              e.preventDefault();
                              onGoSelectMeetingRoom && editingEvent?.scheduleInfo.inviteeType !== InviteType.INVITEE && onGoSelectMeetingRoom();
                            }}
                          >
                            {getIn18Text('XUANZEHUIYISHI')}
                          </a>
                        ) : undefined
                      }
                    />
                  </FormItem>
                </InputContextMenu>
              );
            }}
          </AuthTagFormItem>
          {/* 日历列表 */}
          {/* 同下面日历选择，完全一样，需要放在外面展示 */}
          <FormItem hidden={expanded} label={<i className={classnames(eventcontentStyles.icon, eventcontentStyles.calendar)} />} dependencies={[['catalogId']]}>
            {({ getFieldValue }) => {
              return (
                <FormItem noStyle name="catalogId">
                  <Select
                    getPopupContainer={formElement}
                    disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE}
                    onChange={handleChangeCatalog}
                    dropdownClassName={styles.selectDropDown}
                    listItemHeight={30}
                    suffixIcon={
                      <span style={{ display: 'inline-block', width: '32px', marginLeft: '-18px' }}>
                        {!catalogList.find(c => c.id == getFieldValue('catalogId'))?.publish ? (
                          <Tooltip
                            placement="top"
                            overlayClassName="show-arrow"
                            overlayInnerStyle={{ fontSize: '12px', maxWidth: '240px' }}
                            title="此日历仅自己可见，其他用户均无权查看。该日历的日程占据时间段对外会展示为有空"
                          >
                            <QuestionCircleOutlined style={{ fontSize: 12, marginRight: '8px' }} />
                          </Tooltip>
                        ) : null}
                        <i className={`dark-invert ${styles.expandIcon}`} />
                      </span>
                    }
                    style={{ width: 200 }}
                  >
                    {catalogList.map(s => (
                      <Select.Option className={styles.selectOption} key={s.id} value={s.id}>
                        {s.name}
                      </Select.Option>
                    ))}
                  </Select>
                </FormItem>
              );
            }}
          </FormItem>
          {/* 下面是日程详情，点击’更多选项‘后展示 */}
          {expanded && <p style={{ marginBottom: 16 }}>{getIn18Text('RICHENGXIANGQING')}</p>}
          {/* 提醒 */}
          <Form.List name="reminders" initialValue={[]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...field }, i) => (
                  <FormItem
                    hidden={!expanded}
                    style={{ marginBottom: 8 }}
                    key={key}
                    label={
                      <i
                        className={classnames(eventcontentStyles.icon, {
                          [eventcontentStyles.bell]: i === 0,
                        })}
                      />
                    }
                    // initialValue={backfillReminder(editingEvent?.scheduleInfo?.reminders[i], false)}
                    dependencies={[['time', 'allDay']]}
                  >
                    {({ getFieldValue }) => (
                      <>
                        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
                        {getFieldValue(['time', 'allDay']) ? (
                          <FormItem
                            {...field}
                            name={[name, 'beforeOpt']}
                            initialValue={getFieldValue(['reminders', name, 'interval']) === 0 ? 'current' : 'before'}
                            noStyle
                          >
                            <Select
                              onChange={v => handleBeforeOptChange(v, name)}
                              // disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE}
                              dropdownClassName={styles.selectDropDown}
                              className={styles.selectLabel}
                              style={{ width: 55, padding: 0, fontSize: 14 }}
                              suffixIcon={<i className={`dark-invert ${styles.expandIcon}`} />}
                              bordered={false}
                            >
                              <Select.Option className={styles.selectOption} key={'before'} value={'before'}>
                                {getIn18Text('TIQIAN')}
                              </Select.Option>
                              <Select.Option className={styles.selectOption} key={'current'} value={'current'}>
                                {getIn18Text('DANG1')}
                              </Select.Option>
                            </Select>
                          </FormItem>
                        ) : (
                          <span style={{ width: 55, marginRight: 12 }}>{getIn18Text('TIQIAN')}</span>
                        )}
                        <FormItem dependencies={[[name, 'beforeOpt']]} noStyle>
                          {() => {
                            const isCurrent = getFieldValue(['reminders', name, 'beforeOpt']) === 'current';
                            const timeUnit = getFieldValue(['reminders', name, 'timeUnit']);
                            const interval = getFieldValue(['reminders', name, 'interval']);
                            let maxLength = ReminderTimeUnit.DAY === timeUnit ? 7 : ReminderTimeUnit.HOUR === timeUnit ? 24 : 60;
                            if (!isCurrent) {
                              return (
                                <>
                                  <FormItem
                                    {...field}
                                    name={[name, 'interval']}
                                    // rules={[
                                    //   {
                                    //     validator: (_, value) => {
                                    //       const valited = Number.isInteger(value) && value <= maxLength;
                                    //       // if (!valited) {
                                    //       //   SiriusMessage.error({ content: getIn18Text("TIXINGSHIJIANBUNCG", { maxLenth: maxLength,timeUnit: getTimeUnitTextByEnum(timeUnit) }) });
                                    //       // }
                                    //       if (valited) {
                                    //         return Promise.resolve();
                                    //       }
                                    //       return Promise.reject();
                                    //     },
                                    //   },
                                    // ]}
                                    initialValue={1}
                                    noStyle
                                  >
                                    <InputNumber
                                      max={maxLength}
                                      min={1}
                                      onChange={v => handleIntervalChange(v, name)}
                                      // disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE}
                                      // controls={{
                                      //   upIcon: <i className={`dark-invert ${styles.expandIcon}`} />,
                                      //   downIcon: <i className={`dark-invert ${styles.expandIcon}`} />,
                                      // }}
                                      style={{ borderRadius: 4, width: 80, marginRight: 12 }}
                                    />
                                  </FormItem>
                                  <FormItem {...field} name={[name, 'timeUnit']} noStyle>
                                    <Select
                                      getPopupContainer={formElement}
                                      dropdownClassName={styles.selectDropDown}
                                      listItemHeight={30}
                                      // disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE}
                                      onChange={v => handleIntervalChange(interval, name)}
                                      // defaultValue={backfillReminder(editingEvent?.scheduleInfo?.reminders[i], getFieldValue(['time', 'allDay']))}
                                      suffixIcon={<i className={`dark-invert ${styles.expandIcon}`} />}
                                      style={{ width: 80, marginRight: 12 }}
                                    >
                                      {reminderTimeUnitOpts(getFieldValue(['time', 'allDay'])).map(op => (
                                        <Select.Option
                                          // default={backfillReminder(editingEvent?.scheduleInfo?.reminders[i], getFieldValue(['time', 'allDay'])) == op.value}
                                          className={styles.selectOption}
                                          key={op.value}
                                          value={op.value}
                                        >
                                          {op.label}
                                        </Select.Option>
                                      ))}
                                    </Select>
                                  </FormItem>
                                </>
                              );
                            } else {
                              return null;
                            }
                          }}
                        </FormItem>

                        {getFieldValue(['time', 'allDay']) ? (
                          <FormItem {...field} name={[name, 'time', 'hr']} initialValue={8} noStyle>
                            {/* <TimeStepPicker
                              // value={moment().hour(getFieldValue(['reminders',name,'time','hr'])|| 8).minutes(0)}
                              style={{ marginRight: 12 }}
                              timeIntervals={60}
                              disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE}
                              className={styles.timePicker}
                              onChange={handleStartTimeChange}
                            /> */}
                            <Select
                              dropdownClassName={styles.selectDropDown}
                              style={{ width: 80, marginRight: 12, padding: 0 }}
                              suffixIcon={<i className={`dark-invert ${styles.expandIcon}`} />}
                              // disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE}
                            >
                              {Array.from({ length: 24 }, (_, index) => index.toString().padStart(2, '0')).map((e, i) => (
                                <Select.Option className={styles.selectOption} key={i} value={i}>
                                  {`${e}:00`}
                                </Select.Option>
                              ))}
                            </Select>
                          </FormItem>
                        ) : null}
                        <FormItem dependencies={[[name, 'timeUnit']]} noStyle>
                          {() => {
                            const interval = getFieldValue(['reminders', name, 'interval']);
                            const timeUnit = getFieldValue(['reminders', name, 'timeUnit']);
                            const disableAppReminder = ReminderTimeUnit.WEEK === timeUnit && interval > 4;
                            return (
                              <FormItem {...field} name={[name, 'reminderAction']} initialValue={ReminderAction.EMAIL_APP} noStyle>
                                <Select
                                  getPopupContainer={formElement}
                                  dropdownClassName={styles.selectDropDown}
                                  listItemHeight={30}
                                  // disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE}
                                  // defaultValue={backfillReminder(editingEvent?.scheduleInfo?.reminders[i], getFieldValue(['time', 'allDay']))}
                                  suffixIcon={<i className={`dark-invert ${styles.expandIcon}`} />}
                                  style={{ width: 140, marginRight: 12 }}
                                >
                                  {reminderActionOpts().map(op => (
                                    <Select.Option
                                      // default={backfillReminder(editingEvent?.scheduleInfo?.reminders[i], getFieldValue(['time', 'allDay'])) == op.value}
                                      className={styles.selectOption}
                                      key={op.value}
                                      value={op.value}
                                      disabled={op.value !== ReminderAction.EMAIL && disableAppReminder}
                                    >
                                      {op.label}
                                    </Select.Option>
                                  ))}
                                </Select>
                              </FormItem>
                            );
                          }}
                        </FormItem>

                        <i onClick={() => remove(name)} className={classnames('dark-invert', eventcontentStyles.icon, eventcontentStyles.close)} />
                      </>
                    )}
                  </FormItem>
                ))}
                {expanded && fields.length < 20 && (
                  <FormItem noStyle dependencies={[['time', 'allDay']]}>
                    {({ getFieldValue }) => {
                      const allDay = getFieldValue(['time', 'allDay']);
                      const handleAdd = () => {
                        const reminder = getReminderByDefaultReminderAction(allDay);
                        add(reminder);
                      };
                      return (
                        <>
                          <i
                            className={classnames(eventcontentStyles.icon, {
                              [eventcontentStyles.bell]: fields.length === 0,
                            })}
                          />
                          <button type="button" className={styles.abutton} onClick={handleAdd}>
                            {getIn18Text('TIANJIATIXING')}
                          </button>
                        </>
                      );
                    }}
                  </FormItem>
                )}
              </>
            )}
          </Form.List>
          {/* 日历列表 */}
          {/* 受邀者不可编辑归属日历 */}
          <FormItem hidden={!expanded} label={<i className={classnames(eventcontentStyles.icon, eventcontentStyles.calendar)} />} dependencies={[['catalogId']]}>
            {({ getFieldValue }) => {
              return (
                <FormItem noStyle name="catalogId">
                  <Select
                    getPopupContainer={formElement}
                    disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE}
                    onChange={handleChangeCatalog}
                    dropdownClassName={styles.selectDropDown}
                    listItemHeight={30}
                    suffixIcon={
                      <span style={{ display: 'inline-block', width: '32px', marginLeft: '-18px' }}>
                        {!catalogList.find(c => c.id == getFieldValue('catalogId'))?.publish ? (
                          <Tooltip
                            placement="top"
                            overlayClassName="show-arrow"
                            overlayInnerStyle={{ fontSize: '12px', maxWidth: '240px' }}
                            title="此日历仅自己可见，其他用户均无权查看。该日历的日程占据时间段对外会展示为有空"
                          >
                            <QuestionCircleOutlined style={{ fontSize: 12, marginRight: '8px' }} />
                          </Tooltip>
                        ) : null}
                        <i className={`dark-invert ${styles.expandIcon}`} />
                      </span>
                    }
                    style={{ width: 200 }}
                  >
                    {catalogList.map(s => (
                      <Select.Option className={styles.selectOption} key={s.id} value={s.id}>
                        {s.name}
                      </Select.Option>
                    ))}
                  </Select>
                </FormItem>
              );
            }}
          </FormItem>

          {/* 权限和忙闲 */}
          <FormItem
            hidden={!expanded}
            label={<i className={classnames(eventcontentStyles.icon, eventcontentStyles.eyes)} />}
            dependencies={[['clazz', 'transp', 'catalogId']]}
          >
            {({ getFieldValue }) => {
              return (
                <>
                  <FormItem noStyle name="clazz">
                    <Select
                      getPopupContainer={formElement}
                      dropdownClassName={styles.selectDropDown}
                      listItemHeight={30}
                      disabled={catalogList.find(c => c.id == getFieldValue('catalogId'))?.privilege == 1}
                      suffixIcon={
                        <span style={{ display: 'inline-block', width: '32px', marginLeft: '-18px' }}>
                          <Tooltip
                            placement="top"
                            overlayClassName="show-arrow"
                            overlayInnerStyle={{ fontSize: '12px', maxWidth: '240px' }}
                            title={clazzMap.find(m => m.value == getFieldValue('clazz'))?.tipTitle}
                          >
                            <QuestionCircleOutlined style={{ fontSize: 12, marginRight: '8px' }} />
                          </Tooltip>
                          <i className={`dark-invert ${styles.expandIcon}`} />
                        </span>
                      }
                      style={{ width: 200, marginRight: 12 }}
                    >
                      {clazzMap.map(v => (
                        <Select.Option className={styles.selectOption} key={v.value} value={v.value}>
                          {v.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </FormItem>
                  <FormItem noStyle name="transp">
                    <Select
                      getPopupContainer={formElement}
                      dropdownClassName={styles.selectDropDown}
                      listItemHeight={30}
                      disabled={catalogList.find(c => c.id == getFieldValue('catalogId'))?.privilege == 1}
                      suffixIcon={
                        <span style={{ display: 'inline-block', width: '32px', marginLeft: '-18px' }}>
                          <Tooltip
                            placement="top"
                            overlayClassName="show-arrow"
                            overlayInnerStyle={{ fontSize: '12px', maxWidth: '240px' }}
                            title={busyStatus.find(m => m.value == getFieldValue('transp'))?.tipTitle}
                          >
                            <QuestionCircleOutlined style={{ fontSize: 12, marginRight: '8px' }} />
                          </Tooltip>
                          <i className={`dark-invert ${styles.expandIcon}`} />
                        </span>
                      }
                      style={{ width: 100 }}
                    >
                      {busyStatus.map(b => (
                        <Select.Option className={styles.selectOption} key={b.value} value={b.value}>
                          {b.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </FormItem>
                </>
              );
            }}
          </FormItem>

          {/* 描述 */}
          <FormItem
            hidden={!expanded}
            getValueFromEvent={genMaxLenValue({ max: 2000, name: getIn18Text('RICHENGMIAOSHU') })}
            label={<i className={classnames(eventcontentStyles.icon, eventcontentStyles.message)} />}
            className={styles.descEditorWrap}
            name="description"
          >
            {/* <PasteTextArea disabled={} style={{ height: 88 }} placeholder={getIn18Text('TIANJIAMIAOSHU')} /> */}
            <Form.Item noStyle dependencies={['description']}>
              {({ getFieldValue }) => {
                return (
                  <>
                    <div className="content-editor-mask" style={{ display: editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE ? 'block' : 'none' }}></div>
                    <DescEditor
                      originContent={getFieldValue('description')}
                      editorChange={editorChange}
                      editorBlur={editorBlur}
                      getEditorInstance={getEditorInstance}
                      isWarn={overLimit}
                      disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE}
                    />
                    <div className="content-editor-limit">{overLimit && `最多输入${limitWordCount}个字符`}</div>
                  </>
                );
              }}
            </Form.Item>
          </FormItem>

          {/* 上传附件 */}
          <FormItem hidden={!expanded} label={<i className={classnames(eventcontentStyles.icon, eventcontentStyles.attachment)} />} name="attachments">
            <ScheduleUploadFile disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE} />
          </FormItem>

          {/* 默认隐藏 颜色属性  */}
          <FormItem noStyle hidden name="color">
            <Input />
          </FormItem>
          {/* 默认隐藏 颜色属性  */}
          <FormItem noStyle hidden name="meetingOrderParam">
            <Input />
          </FormItem>
          <FormItem noStyle hidden name="rruleUntil">
            <Input />
          </FormItem>
          <FormItem noStyle hidden name="count">
            <Input />
          </FormItem>
          <FormItem noStyle hidden name="interval">
            <Input />
          </FormItem>
          <FormItem noStyle hidden name="byDay">
            <Input />
          </FormItem>
          <FormItem noStyle hidden name="byMonthDay">
            <Input />
          </FormItem>
          <FormItem noStyle hidden name="byMonth">
            <Input />
          </FormItem>
          <FormItem noStyle hidden name="bySetPos">
            <Input />
          </FormItem>
        </Form>
      </div>
      <MeetingRoomUntilTip
        onReselectDateTime={handleCancelMeetingRoom}
        type={meetingTipType}
        onReselectMeetingRoom={() => {
          form.setFieldsValue({ rruleUntil: undefined });
          setMeetingTipType(undefined);
          onGoSelectMeetingRoom && onGoSelectMeetingRoom();
        }}
        untilDateTime={untilDateTimeTemp}
        getReferenceElement={() => {
          if (meetingTipType === 'until_error') {
            return document.getElementById('schedule_form_select_rrule');
          }
          return document.getElementById('schedule_form_input_location');
        }}
        onOk={until => {
          if (until) {
            const [prevRule] = (form.getFieldValue('enmuRecurrenceRule') as string).split('/');
            const changedValues: Partial<ScheduleInsertForm> = {
              rruleUntil: until,
              count: undefined, // 此时重复次数置空，因为截止日期限制更严格
              enmuRecurrenceRule: `${prevRule}/${EnmuRecurrenceRule.TEMP_INSERT}`,
            };
            const allValues = {
              ...form.getFieldsValue(),
              ...changedValues,
            };
            form.setFieldsValue(changedValues);
            const actRules = baseLoopRules.slice();
            const { count, ...rest } = cloneDeep(allValues);
            const label = getRecurIntro(rest);
            actRules.push({
              value: `${prevRule}/${EnmuRecurrenceRule.TEMP_INSERT}`,
              label,
            });
            setLoopRules(actRules);
            setMeetingTipType(undefined);
            handleValuesChange(changedValues, allValues);
          }
        }}
      />
      <div
        className={classnames(styles.bottom, {
          [styles.bottomBordered]: expanded,
          [styles.bottomUnexpanded]: !expanded,
        })}
      >
        {!expanded && <ExpandButton onClick={handleExpand}>{getIn18Text('GENGDUOXUANXIANG')}</ExpandButton>}
        {renderSaveBtn()}
      </div>
    </>
  );
};
export default React.forwardRef(SchduleForm);
