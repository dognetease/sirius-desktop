import React, { FC, useState, useEffect, useCallback, useImperativeHandle, forwardRef, ReactNode } from 'react';
import { DatePicker, Radio, message } from 'antd';
// import type { RangeValue } from 'antd/lib/date-picker';
import type { DatePickerProps } from 'antd';
import { apiHolder, apis, EdmSendBoxApi, GetAiDailyStatsRes } from 'api';
import moment from 'moment';
import SendIcon from '@/images/icons/edm/yingxiao/send-num.svg';
import ReplayIcon from '@/images/icons/edm/yingxiao/replay-num.svg';
import ReceiverIcon from '@/images/icons/edm/yingxiao/receiver-num.svg';
import OpenIcon from '@/images/icons/edm/yingxiao/open-num.svg';
import ArriveIcon from '@/images/icons/edm/yingxiao/arrive-num.svg';
import SiriusSelect from '@web-common/components/UI/SiriusSelect';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import { customPickers } from '@/components/Layout/Worktable/modal/filters';
import { Moment } from 'moment';

import styles from './List.module.scss';
import { DailyRecords } from '../DailyRecords';
import { getIn18Text } from 'api';

const { RangePicker } = DatePicker;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

const DateConf = [
  {
    label: getIn18Text('JINTIAN'),
    value: 1,
  },
  {
    label: getIn18Text('ZUOTIAN'),
    value: -1,
  },
  {
    label: getIn18Text('JINQITIAN'),
    value: -7,
  },
  {
    label: getIn18Text('JIN30TIAN'),
    value: -30,
  },
];

const PreviewCards: {
  label: string;
  icon: string;
  key: keyof GetAiDailyStatsRes;
  children?: {
    label: string;
    key: keyof GetAiDailyStatsRes;
  };
}[] = [
  {
    label: getIn18Text('YINGXIAORENSHU'),
    icon: ReceiverIcon,
    key: 'receiverCount',
  },
  {
    label: getIn18Text('FASONGFENGSHU'),
    icon: SendIcon,
    key: 'sendNum',
  },
  {
    label: getIn18Text('SONGDAFENGSHU'),
    icon: ArriveIcon,
    key: 'arriveNum',
    children: {
      label: getIn18Text('SONGDALV：'),
      key: 'arriveRatio',
    },
  },
  {
    label: getIn18Text('DAKAIFENGSHU'),
    icon: OpenIcon,
    key: 'readNum',
    children: {
      label: getIn18Text('DAKAILV：'),
      key: 'readRatio',
    },
  },
  {
    label: getIn18Text('HUIFUZONGSHU'),
    icon: ReplayIcon,
    key: 'replyCount',
  },
];

const DateFormat = 'YYYYMMDD';

export const getRecentlyDay = (date: number) => {
  if (date === -1) {
    return `${moment().subtract(-date, 'days').format(DateFormat)}-${moment().subtract(-date, 'days').format(DateFormat)}`;
  }
  if (date < 0) {
    return `${moment()
      .subtract(-(date + 1), 'days')
      .format(DateFormat)}-${moment().format(DateFormat)}`;
  }
  return `${moment().format(DateFormat)}-${moment().format(DateFormat)}`;
};

export const getDateRange = (date: number) => {
  if (date === -1) {
    return [moment().subtract(-date, 'days'), moment().subtract(-date, 'days')];
  }
  if (date < 0) {
    return [moment().subtract(-(date + 1), 'days'), moment()];
  }
  return [moment(), moment()];
};

export const List = forwardRef<
  {
    refresh: () => void;
  },
  {
    toDetail: (date: string) => void;
    taskId: string;
    actionTrace: (action: string) => void;
    setPlanId: (planId: string) => void;
    // openReplayPage: (taskId: string) => void;
  }
>((props, ref) => {
  const [searchDate, setSearchDate] = useState(getRecentlyDay(1));
  const [curDates, setCurDates] = useState(1);
  const [stats, setStats] = useState<Partial<GetAiDailyStatsRes>>({});
  const [dateRange, setDateRange] = useState<any>(null);
  const [plan, setPlan] = useState<string>('');
  const [option, setOption] = useState<
    Array<{
      label: string;
      value: any;
    }>
  >();

  useImperativeHandle(ref, () => ({
    refresh() {
      queryDetail();
    },
  }));

  const queryDetail = useCallback(async () => {
    try {
      if (!props.taskId) {
        return;
      }
      const res = await edmApi.getAiDailyStats({
        searchDate,
        taskId: props.taskId,
        planId: plan,
      });
      // const res: Partial<GetAiDailyStatsRes> = {
      //   dailyStats: [
      //     {
      //       "date": 20230307,
      //       "receiverCount": 1,
      //       "sendNum": 1,
      //       "arriveNum": 1,
      //       "arriveRatio": "",
      //       "readNum": 1,
      //       "readRatio": "",
      //       "replyCount": 1,
      //       "replyRatio": "",
      //       "unsubscribeNum": 1,
      //       rounds: [],
      //     },
      //   ]
      // };
      setStats(res);
    } catch (err: any) {
      message.error(err?.message || err?.msg || '获取数据失败，请重试！');
    }
  }, [searchDate, props.taskId, plan]);

  const queryPlanList = useCallback(async () => {
    if (!props.taskId) {
      return;
    }
    try {
      const res = await edmApi.getAiHostingPlanList({ taskId: props.taskId });
      setOption([
        {
          label: getIn18Text('QUANBUYINGXIAORENWU'),
          value: '',
        },
        ...res.map(item => ({
          label: item.planName,
          value: item.planId,
        })),
      ]);
    } catch (err: any) {
      message.error(err?.message || err?.msg || '获取数据失败，请重试！');
    }
  }, [props.taskId]);

  useEffect(() => {
    queryDetail();
  }, [searchDate]);

  useEffect(() => {
    if (plan != null) {
      queryDetail();
      props.setPlanId(plan);
    }
  }, [plan]);

  useEffect(() => {
    queryPlanList();
  }, [props.taskId]);

  useEffect(() => {
    if (curDates !== -100) {
      // -1 表示选中dataRange
      setSearchDate(getRecentlyDay(curDates));
      setDateRange(getDateRange(curDates));
    }
  }, [curDates]);

  const handleClick = (dateRange: [Moment, Moment]) => {
    setCurDates(-100);
    setDateRange(dateRange);
    if (dateRange) {
      setSearchDate(`${dateRange[0]?.format(DateFormat)}-${dateRange[1]?.format(DateFormat)}`);
    }
  };

  const panelRender = (originPanel: ReactNode) => {
    return (
      <div className={styles.customDatepickerPanel}>
        <div className={styles.leftSide}>
          {customPickers.map(item => (
            <div className={styles.customPickerRange} key={item.text} onClick={() => handleClick(item.onClick() as [Moment, Moment])}>
              {item.text}
            </div>
          ))}
        </div>
        {originPanel}
      </div>
    );
  };

  return (
    <>
      {/* 筛选区域，需要滚动固定 */}
      {/* <div className={styles.selection}></div> */}
      {/* <div className={styles.empty}>
      <div className={styles.inner}></div>
    </div> */}
      <div className={styles.list}>
        <div className={styles.dataPreview}>
          <div className={styles.dataHeader}>
            <div className={styles.dataTitle}>{getIn18Text('SHUJUZONGLAN')}</div>
            <div className={styles.dataSelection}>
              {/* <SiriusSelect
              size="middle"
              style={{ width: 126, marginRight: 12 }}
              options={option || []}
              placeholder={getIn18Text('XUANZEYINGXIAOFANGAN')}
              value={plan}
              onChange={setPlan}
              defaultValue={plan}
            /> */}
              <EnhanceSelect
                className={styles.select}
                style={{ width: 126, marginRight: 8 }}
                placeholder={getIn18Text('XUANZEYINGXIAOFANGAN')}
                value={plan}
                onChange={setPlan}
                defaultValue={plan}
                getPopupContainer={node => node}
              >
                {option?.map(item => (
                  <InSingleOption value={item.value} key={item.value}>
                    {item.label}
                  </InSingleOption>
                ))}
              </EnhanceSelect>
              <RangePicker
                allowClear={false}
                value={dateRange}
                onChange={values => {
                  setCurDates(-100);
                  setDateRange(values);
                  if (values) {
                    setSearchDate(`${values[0]?.format(DateFormat)}-${values[1]?.format(DateFormat)}`);
                  }
                }}
                panelRender={panelRender}
                dropdownClassName="edm-date-picker-dropdown-wrap"
                className={styles.rangePicker}
              />
              {/* <Radio.Group
              style={{
                marginLeft: 12
              }}
              className={styles.group}
              value={curDates}
              onChange={e => {
                setCurDates(e.target.value);
              }}
            >
              {DateConf.map(date => (
                <Radio.Button key={date.label} value={date.value}>
                  {date.label}
                </Radio.Button>
              ))}
            </Radio.Group> */}
            </div>
          </div>
          <div className={styles.previewCards}>
            {PreviewCards.map(card => (
              <div className={styles.previewCard} key={card.label}>
                <div className={styles.cardTitle}>
                  <img src={card.icon} alt="" />
                  <div className={styles.label}>{card.label}</div>
                </div>
                <div className={styles.num}>{stats[card.key] ?? '--'}</div>
                {card.children && (
                  <div className={styles.child}>
                    <div className={styles.childLabel}>{card.children?.label}</div>
                    <div className={styles.childNum}>{stats[card.children.key] ?? '--'}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <DailyRecords actionTrace={props.actionTrace} toDetail={props.toDetail} list={stats.dailyStats || []} />
      </div>
    </>
  );
});
