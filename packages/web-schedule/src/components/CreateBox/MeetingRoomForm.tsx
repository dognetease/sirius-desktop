/* eslint-disable camelcase */
import { Button, DatePicker, DatePickerProps, PageHeader, Popover, Select, Tabs, Tooltip } from 'antd';
import {
  ContactModel,
  MeetingRoomConditionModel,
  MeetingRoomListCondition,
  MeetingRoomModel,
  MeetingRoomOccupy,
  /* MeetingRoomListModel, */ /* MeetingRoomModel */ ProductTagEnum,
} from 'api';
import moment, { Moment } from 'moment';
import React, { useEffect, useState } from 'react';
import locale from 'antd/es/date-picker/locale/zh_CN';
import classNames from 'classnames';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import Icon from '@ant-design/icons/lib/components/Icon';
import { useResizeDetector } from 'react-resize-detector';
import { MediaIcon, MediaWhiteIcon } from '@web-common/components/UI/Icons/icons';
// import { EditingScheduleContext } from '../../context';
import { getMeetingRoomAvailabelList, getMeetingRoomList, getMeetingRoomSearchCondition } from '../../service';
import TimeLinePicker from '../TimeLinePicker/TimeLinePicker';
import { TimeLinePickerGroup } from '../TimeLinePicker/TimeLinePickerGroup';
import styles from './meeting_room_form.module.scss';
import commonStyles from './createbox.module.scss';
import { ScheduleFormRef } from './ScheduleForm';
import { constructAvailableMeetingRoomParam, EnmuRecurrenceRule, generateTimeRange, getSeqNo, handleMeetingFormTimeRange } from './util';
import ExtraSelect from '../ExtraSelect/ExtraSelect';
import ContactEmpty from '@web-contact/component/Empty/empty';
import { MeetingRoomDetailListModel } from '../../data';
import ContactDetail from '@web-contact/component/Detail/detail';
import { contactApi } from '@web-common/utils/contact_util';
import { getDurationText } from '../TimeLinePicker/util';
import { useAppSelector } from '@web-common/state/createStore';
import ProductAuthTag from '@web-common/components/UI/ProductAuthTag/ProductAuthTag';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { isCrossDay } from '../../util';
import { getIn18Text } from 'api';

const TOP_TOOL_BAR_HEIGHT = 46;
const TITLE_HEIGHT = 14 + 8;
const TAB_BAR_HEIGHT = 40 + 16;
const FOOTER_HEIGHT = 56;
const FORM_TOOL_BAR_HEIGHT = 32 + 12;
export interface MeetingRoomFormProps {
  scheduleFormRef: ScheduleFormRef | null;
  onBack?(ok?: boolean): void;
  onSelectAddr?(v: string): void;
  defaultSelectedAddr?: string;
  onNavigate?(): void;
  disableBackIcon?: boolean;
  locationChange?: () => void;
  style?: React.CSSProperties;
}
export interface RoomTimeLineCardProps<T = Omit<MeetingRoomDetailListModel, 'roomBookInfoVO'>> {
  roomInfo: T;
  onSelect?(roomInfo: T): void;
  selected?: boolean;
  noHover?: boolean;
  date?: string;
}
export interface MatchedRoomInfoType {
  roomInfo: MeetingRoomModel;
}
export interface MatchedRoomGourpProps<T = MatchedRoomInfoType> {
  roomList: T[];
  onOk?(info: T): void;
  viewAll?(): void;
  duration: Moment[];
  onBack?(): void;
  listHeight: number;
  enableAll: boolean;
}
export interface OccupiedDetailProps {
  detail: MeetingRoomOccupy;
  onNavigate?(): void;
}
const OccupiedDetail: React.FC<OccupiedDetailProps> = ({ detail, onNavigate }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [contact, setContact] = useState<ContactModel>();
  const handleVisibleChange = async (v: boolean) => {
    if (!contact && v) {
      const [aim] = await contactApi.doGetContactById(detail.user_id);
      setContact(aim);
    }
    setVisible(v);
  };
  return (
    <Tooltip title={`已被${detail.user_name}预定`}>
      <Popover
        // getPopupContainer={() => document.getElementById(styles.body) || document.body}
        overlayStyle={{
          zIndex: 1090,
          // like offset
          paddingBottom: 2,
        }}
        // overlayInnerStyle={{
        //   padding: 24
        // }}
        visible={visible}
        trigger={['click']}
        onVisibleChange={handleVisibleChange}
        content={<ContactDetail contactId={contact?.contact.id as string} onNavigate={onNavigate} dividerLine={false} branch smallerAvatarSize visibleSchedule={false} />}
      >
        <span
          style={{
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'transparent',
          }}
        />
      </Popover>
    </Tooltip>
  );
};
const RoomTimeLineCard: React.FC<RoomTimeLineCardProps> = ({ roomInfo, children, onSelect, selected, noHover }) => {
  const { name, instruments, capacity } = roomInfo;
  const Media = selected ? MediaWhiteIcon : MediaIcon;
  return (
    <div
      onClick={() => {
        onSelect && onSelect(roomInfo);
      }}
      className={classNames(styles.roomCard, {
        [styles.roomCardSelected]: selected,
        [styles.roomCardNohover]: noHover,
      })}
    >
      <p className={styles.roomName}>{`${name} ${capacity.title ? `（${capacity.title}）` : ''}`}</p>
      <p className={styles.media}>
        <Media className={styles.mediaIcon} />
        <span className={styles.mediaDesc}>
          {instruments
            ?.filter(e => e.code !== '0')
            .map(media => media.name)
            .join(' | ') || getIn18Text('SHEBEIWEIZHI')}
        </span>
      </p>
      {children}
    </div>
  );
};
const MatchedRoomGroups: React.FC<MatchedRoomGourpProps> = ({ roomList, onOk, viewAll, duration, onBack, listHeight, enableAll }) => {
  const [selectdId, setSelectdId] = useState<any>();
  const [formStartDate, formStartTime, formEndTime] = duration;
  const durationString = getDurationText([
    formStartDate.clone().set({
      hour: formStartTime.hours(),
      minute: formStartTime.minutes(),
    }),
    formEndTime,
  ]);
  if (roomList.length === 0) {
    return (
      <ContactEmpty
        style={{
          padding: 100,
        }}
        text={`${durationString}暂无空闲会议室`}
        renderContent={() =>
          enableAll ? (
            <button
              type="button"
              className={classNames(styles.primary, styles.button)}
              style={{ marginTop: 24 }}
              onClick={() => {
                viewAll && viewAll();
              }}
            >
              {getIn18Text('CHAKANQUANBUHUI')}
            </button>
          ) : null
        }
      />
    );
  }
  return (
    <div>
      <p className={styles.autoMatchTip}>
        <span>{getIn18Text('YIWEININZIDONG')}</span>
        <b>{durationString}</b>
        <span>{getIn18Text('KONGXIANDEHUIYI')}</span>
      </p>
      <OverlayScrollbarsComponent className={styles.listContainer} style={{ height: listHeight }}>
        <div className={styles.listInner}>
          {roomList.map(room => (
            <RoomTimeLineCard
              key={room.roomInfo.room_id}
              roomInfo={room.roomInfo}
              selected={selectdId === room.roomInfo.room_id}
              onSelect={() => {
                setSelectdId(room.roomInfo.room_id);
              }}
            />
          ))}
          <p className={styles.listBottom}>
            {getIn18Text('DAODILA\n ')}
            &nbsp; &nbsp;
            {enableAll && (
              // eslint-disable-next-line jsx-a11y/anchor-is-valid
              <a
                onClick={e => {
                  e.preventDefault();
                  viewAll && viewAll();
                }}
              >
                {getIn18Text('CHAKANQUANBUHUI')}
              </a>
            )}
          </p>
        </div>
      </OverlayScrollbarsComponent>
      <div className={styles.footer}>
        <Button onClick={() => onBack && onBack()}>{getIn18Text('QUXIAO')}</Button>
        <Button
          style={{
            marginLeft: 8,
          }}
          type="primary"
          disabled={!selectdId}
          onClick={() => {
            const selectRoom = roomList.find(r => r.roomInfo.room_id === selectdId);
            if (selectRoom && onOk) {
              onOk(selectRoom);
            }
          }}
        >
          {getIn18Text('QUEDING')}
        </Button>
      </div>
    </div>
  );
};
const ExpandIcon = () => <Icon component={() => <i className={`dark-invert ${styles.expandIcon}`} />} style={{ pointerEvents: 'none' }} />;
const CustomDatePicker: React.FC<DatePickerProps> = ({ ...props }) => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <DatePicker
      onClick={() => {
        setOpen(!open);
      }}
      open={open}
      onOpenChange={v => {
        if (!v) {
          setOpen(v);
        }
      }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
};
export const MeetingRoomForm: React.FC<MeetingRoomFormProps> = ({
  scheduleFormRef,
  onBack,
  onSelectAddr,
  onNavigate,
  defaultSelectedAddr = '',
  disableBackIcon = false,
  locationChange,
  style,
}) => {
  const [roomList, setRoomList] = useState<MeetingRoomDetailListModel[]>();
  const [tabKey, setTabKey] = useState<'1' | '2' | string>('1');
  const [roomMatchList, setRoomMatchList] = useState<MatchedRoomInfoType[]>();
  const [searchCondition, setSearchCondition] = useState<MeetingRoomConditionModel>();
  const { scheduleEvent } = useAppSelector(state => state.scheduleReducer);
  const { ref, height = 380 } = useResizeDetector();
  // console.log(scheduleFormRef?.getFormInstance());
  const formIntance = scheduleFormRef?.getFormInstance();
  const values = scheduleFormRef?.getFormInstance().getFieldsValue();
  const { formStartDate, formStartTime, formEndTime } = handleMeetingFormTimeRange(
    values
      ? {
          ...values.moments,
          allDay: !!values.time.allDay,
        }
      : {}
  );
  const defaultDate = formStartDate;
  const [searchParams, setSearchParams] = useState<MeetingRoomListCondition>({
    date: defaultDate.format('YYYY-MM-DD'),
    addr: defaultSelectedAddr,
  });
  // const matchedRooms = React.useMemo(() => getMatchedRoom({
  //   roomMatchList,
  //   formStartTime: formStartTime.clone().startOf('minutes'),
  //   formEndTime: formEndTime.clone().startOf('minutes')
  // }), [roomMatchList, formStartTime, formEndTime]);
  const handleAutoMatchOk = (info: MatchedRoomInfoType) => {
    const {
      roomInfo: { name, addr_name, room_id },
    } = info;
    formIntance?.setFieldsValue({
      location: [name, addr_name].filter(e => !!e).join('，'),
      moments: {
        startDate: formStartDate.clone(),
        endDate: formStartDate.clone(),
        startTime: formStartTime.clone(),
        endTime: formEndTime.clone(),
      },
      meetingOrderParam: {
        update_type: 1,
        // start_seq_no: startSeqNo,
        // end_seq_no: endSeqNo,
        room_id,
        taken_date: formStartDate.format('YYYY-MM-DD'),
      },
    });
    locationChange && locationChange();
    onBack && onBack(true);
    // 判断是否跨天，跨天toast
    const { startDate, endDate } = values?.moments || {};
    if (startDate && endDate && isCrossDay(startDate, endDate)) {
      SiriusMessage.info({
        content: getIn18Text('crossScheduleMeetingRoomTip'),
      });
    }
  };
  useEffect(() => {
    getMeetingRoomSearchCondition().then(setSearchCondition);
  }, []);
  // 获取匹配
  useEffect(() => {
    constructAvailableMeetingRoomParam(formIntance?.getFieldsValue(), scheduleEvent).then(condition => {
      if (condition) {
        getMeetingRoomAvailabelList(condition)
          .then(setRoomMatchList)
          .catch(() => setRoomMatchList([]));
      }
    });
  }, []);
  useEffect(() => {
    getMeetingRoomList(searchParams, scheduleEvent?.scheduleInfo.meetingInfo?.order_id).then(setRoomList);
  }, [searchParams]);
  const { enmuRecurrenceRule } = scheduleFormRef?.getFormInstance().getFieldsValue() || {};
  const enableAll = enmuRecurrenceRule === EnmuRecurrenceRule.NONE || enmuRecurrenceRule === undefined;
  return (
    <div className={styles.body} style={style} ref={ref}>
      <div style={{ position: 'relative', height: '100%' }}>
        <PageHeader
          title={<ProductAuthTag tagName={ProductTagEnum.MEETING_SETTING}>{getIn18Text('XUANZEHUIYISHI')}</ProductAuthTag>}
          backIcon={<i className={styles.arrowLeft} />}
          onBack={disableBackIcon ? undefined : () => onBack && onBack()}
        />
        <Tabs defaultActiveKey="1" activeKey={tabKey} onChange={setTabKey}>
          <Tabs.TabPane tab={getIn18Text('KEYONGHUIYISHI')} key="1">
            {roomMatchList !== undefined && (
              <MatchedRoomGroups
                enableAll={enableAll}
                listHeight={height - TITLE_HEIGHT - TAB_BAR_HEIGHT - TOP_TOOL_BAR_HEIGHT - FOOTER_HEIGHT}
                onBack={onBack}
                duration={[formStartDate, formStartTime, formEndTime]}
                viewAll={() => setTabKey('2')}
                roomList={roomMatchList}
                onOk={handleAutoMatchOk}
              />
            )}
          </Tabs.TabPane>
          {enableAll && (
            <Tabs.TabPane tab={getIn18Text('QUANBUHUIYISHI')} key="2">
              <div className={styles.toolbar}>
                <CustomDatePicker
                  inputReadOnly
                  format={getIn18Text('MMYUEDD12')}
                  locale={locale}
                  dropdownClassName={commonStyles.datePickerDropDown}
                  style={{ width: 128 }}
                  allowClear={false}
                  showNow={false}
                  suffixIcon={<ExpandIcon />}
                  showToday={false}
                  defaultValue={defaultDate}
                  className={styles.datePicker}
                  // getPopupContainer={() => document.getElementById(styles.body) || document.body}
                  onChange={date => {
                    if (date) {
                      setSearchParams(prev => ({
                        ...prev,
                        date: date.format('YYYY-MM-DD'),
                      }));
                    }
                  }}
                />
                {searchCondition !== undefined && searchCondition.addr_list.filter(e => e !== '').length > 0 && (
                  <Select
                    style={{ width: 188 }}
                    dropdownClassName={commonStyles.selectDropDown}
                    // getPopupContainer={() => document.getElementById(styles.body) || document.body}
                    placeholder={getIn18Text('XUANZEHUIYISHI')}
                    suffixIcon={ExpandIcon}
                    defaultValue={defaultSelectedAddr}
                    options={[
                      {
                        label: getIn18Text('QUANBUDEDIAN'),
                        value: '',
                      },
                      ...searchCondition.addr_list
                        .filter(e => e !== '')
                        .slice()
                        .reverse()
                        .map(addr => ({
                          label: addr,
                          value: addr,
                        })),
                    ]}
                    onChange={value => {
                      if (onSelectAddr) {
                        onSelectAddr(value);
                      }
                      setSearchParams(prev => ({
                        ...prev,
                        addr: value,
                      }));
                    }}
                  />
                )}
                {searchCondition !== undefined && (searchCondition.capacity_list.length > 0 || searchCondition.instruments.length > 0) && (
                  <ExtraSelect
                    suffixIcon={ExpandIcon}
                    // getPopoverContainer={() => document.getElementById(styles.body) || document.body}
                    capacity_list={searchCondition.capacity_list}
                    instruments={searchCondition.instruments}
                    onChange={value => {
                      setSearchParams(prev => ({
                        ...prev,
                        ...value,
                      }));
                    }}
                  />
                )}
              </div>
              <OverlayScrollbarsComponent
                className={styles.listContainer}
                // id={styles.body}
                style={{
                  marginBottom: 20,
                  height: height - TOP_TOOL_BAR_HEIGHT - FORM_TOOL_BAR_HEIGHT - TAB_BAR_HEIGHT,
                }}
              >
                <div className={styles.listInner}>
                  {roomList?.length === 0 && <ContactEmpty text={getIn18Text('ZANWUHUIYISHI')} style={{ marginTop: 114 }} />}
                  <TimeLinePickerGroup>
                    {roomList?.map(room => {
                      const {
                        room_id,
                        addr_name,
                        name,
                        occupy_list,
                        roomBookInfoVO: { time_axis, start, end, interval },
                      } = room;
                      const _interval = interval;
                      const date = moment(searchParams.date);
                      const timeRanges = generateTimeRange(time_axis, start, _interval, date);
                      const occupied = timeRanges.filter(e => e.occupied).map(e => e.range);
                      const forbidden = timeRanges.filter(e => e.expired).map(e => e.range);
                      return (
                        <RoomTimeLineCard noHover roomInfo={room} key={room_id}>
                          <TimeLinePicker
                            date={date}
                            forbidden={forbidden}
                            startHour={start}
                            endHour={end}
                            pieceOfHour={1 / _interval}
                            occupied={occupied}
                            renderForbiddenInner={() => (
                              <Tooltip
                                // getPopupContainer={() => document.getElementById(styles.body) || document.body}
                                title={getIn18Text('YIGUOQI')}
                              >
                                <span
                                  style={{
                                    display: 'block',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'transparent',
                                  }}
                                />
                              </Tooltip>
                            )}
                            renderEnableInner={() => (
                              <Tooltip
                                // getPopupContainer={() => document.getElementById(styles.body) || document.body}
                                title={getIn18Text('KEXUANZE')}
                              >
                                <span
                                  style={{
                                    display: 'block',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'transparent',
                                  }}
                                />
                              </Tooltip>
                            )}
                            renderOccupiedInner={range => {
                              const [_start] = range;
                              const startSeq = getSeqNo(_start, _interval);
                              const detail = occupy_list?.find(e => e.seq_no === startSeq);
                              if (detail === undefined) {
                                return null;
                              }
                              return <OccupiedDetail onNavigate={onNavigate} detail={detail} />;
                            }}
                            onOk={value => {
                              const [startMoment, endMoment] = value;
                              /**
                               * 1,设定会议室参数
                               * 2,设定时间参数
                               * 3,设定地点参数
                               */
                              const allDay = (startMoment.hours() === start && endMoment.hours() === end) as any;
                              formIntance?.setFieldsValue({
                                moments: {
                                  startDate: startMoment,
                                  endDate: endMoment,
                                  startTime: startMoment.clone(),
                                  endTime: endMoment.clone(),
                                },
                                time: {
                                  allDay,
                                },
                                location: [name, addr_name].filter(e => !!e).join('，'),
                                meetingOrderParam: {
                                  room_id,
                                  // start_seq_no: getSeqNo(startMoment, interval),
                                  // !# 结束时间需要往前offset一个interval周期，因为start end表示的是时刻， 对应的seq是当前时刻往后一个interval的周期
                                  // end_seq_no: getSeqNo(endMoment, interval) - 1,
                                  taken_date: searchParams.date,
                                  // always be 1 for update or add, cancel is not oprate here
                                  update_type: 1,
                                },
                              });
                              locationChange && locationChange();
                              onBack && onBack(true);
                            }}
                          />
                        </RoomTimeLineCard>
                      );
                    })}
                  </TimeLinePickerGroup>
                </div>
              </OverlayScrollbarsComponent>
            </Tabs.TabPane>
          )}
        </Tabs>
      </div>
    </div>
  );
};
