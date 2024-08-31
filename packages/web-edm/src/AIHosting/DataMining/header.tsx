import { getIn18Text } from 'api';
import React, { useState, useEffect, ReactNode } from 'react';
import style from './header.module.scss';
import { EdmEmailInfo, EdmSendBoxApi, GetAiDailyStatsRes, HostingContentReq, api, apis } from 'api';
import { DetailTabOption, DetailTabConfig, getTabConfig } from '../../detail/detailEnums';
import { BasicInput } from '../AiHostingEdit';
import { DatePicker, Radio, message } from 'antd';
import { getDateRange, getRecentlyDay } from '..//DataView/list';
import { customPickers } from '@/components/Layout/Worktable/modal/filters';
import { Moment } from 'moment';
import { ReactComponent as RightArrowLinkIcon } from '@/images/icons/edm/yingxiao/right-arrow-link.svg';

const { RangePicker } = DatePicker;

export interface Props {
  taskId?: string;
  planId?: string;
  info?: BasicInput;
  openReplayPage: (planId: string) => void;
}

const edmApi = api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

// 新的最上方的卡片
export const TaskDetaiLHeader = (props: Props) => {
  const { taskId, planId, info, openReplayPage } = props;
  const [tabConfig, setTabConfig] = useState<DetailTabConfig[]>([]);

  const [stats, setStats] = useState<Partial<GetAiDailyStatsRes>>({});
  const [curDates, setCurDates] = useState(-1);
  const [searchDate, setSearchDate] = useState(getRecentlyDay(-1));
  const [dateRange, setDateRange] = useState<any>(null);

  let isDataMining = info?.planMode === 1;

  useEffect(() => {
    constructTabList();
  }, []);

  useEffect(() => {
    if (curDates !== -100) {
      // -1 表示选中dataRange
      setSearchDate(getRecentlyDay(curDates));
      setDateRange(getDateRange(curDates));
    }
  }, [curDates]);

  const queryDetail = async () => {
    try {
      if (!taskId) {
        return;
      }
      const res = await edmApi.getAiDailyStats({
        searchDate,
        taskId: taskId,
        planId: planId,
      });
      setStats(res);
    } catch (err: any) {
      message.error(err?.message || err?.msg || '获取数据失败，请重试！');
    }
  };

  useEffect(() => {
    queryDetail();
  }, [taskId, planId, searchDate]);

  const constructTabList = () => {
    let tabConfigs = new Array<DetailTabConfig>();
    let totalMiningConf: DetailTabConfig = {
      tabIndex: 0,
      title: getIn18Text('YIYINGXIAOLIANXIRENSHU'),
      valueKey: 'receiverCount',
    };
    tabConfigs.push(totalMiningConf);

    let sendCountConf: DetailTabConfig = {
      tabIndex: 1,
      title: getIn18Text('FASONGFENGSHU'),
      valueKey: 'sendNum',
    };
    tabConfigs.push(sendCountConf);

    let sendedCountConf: DetailTabConfig = {
      tabIndex: 2,
      title: getIn18Text('SONGDAFENGSHU'),
      valueKey: 'arriveNum',
      subTitle: getIn18Text('SONGDALV'),
      subValueKey: 'arriveRatio',
    };
    tabConfigs.push(sendedCountConf);

    let openCountConf: DetailTabConfig = {
      tabIndex: 3,
      title: getIn18Text('DAKAIFENGSHU'),
      valueKey: 'readNum',
      subTitle: getIn18Text('DAKAILV'),
      subValueKey: 'readRatio',
    };
    tabConfigs.push(openCountConf);

    let replyCountConf: DetailTabConfig = {
      tabIndex: 4,
      title: getIn18Text('HUIFUZONGSHU'),
      valueKey: 'replyCount',
      subTitle: getIn18Text('HUIFULV'),
      subValueKey: 'replyRatio',
    };
    tabConfigs.push(replyCountConf);

    setTabConfig(tabConfigs);
  };

  const DateFormat = 'YYYYMMDD';
  const DatePickerComp = () => {
    return (
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
        className={style.rangePicker}
      />
    );
  };

  const panelRender = (originPanel: ReactNode) => {
    return (
      <div className={style.customDatepickerPanel}>
        <div className={style.leftSide}>
          {customPickers.map(item => (
            <div className={style.customPickerRange} key={item.text} onClick={() => handleClick(item.onClick() as [Moment, Moment])}>
              {item.text}
            </div>
          ))}
        </div>
        {originPanel}
      </div>
    );
  };
  const handleClick = (dateRange: [Moment, Moment]) => {
    setCurDates(-100);
    setDateRange(dateRange);
    if (dateRange) {
      setSearchDate(`${dateRange[0]?.format(DateFormat)}-${dateRange[1]?.format(DateFormat)}`);
    }
  };

  let title = isDataMining ? getIn18Text('ZIDONGWAJUELIANXIREN') : getIn18Text('TIANJIALIANXIRENSHU：');

  return (
    <div className={style.headerBg}>
      <div className={style.header}>
        <div>
          <span className={style.title}>{getIn18Text('GAILANSHUJU')}</span>
          <span className={style.subTitle}>
            （{title}
            <span className={style.count}>{stats.contactCount}</span>）
          </span>
        </div>
        {DatePickerComp()}
      </div>
      <ul className={style.tabList}>
        {tabConfig.map(config => {
          if (config.hide) {
            return null;
          }
          let num = stats[config.valueKey];
          if (num === undefined) {
            num = '0';
          }
          const showReplyCountBtn = config.tabIndex === 4 && stats[config.valueKey] > 0;
          return (
            <li className={style.tabItem} key={config.tabIndex}>
              <div className={style.left}>
                <i className={`${style.tabItemIcon} ${style['statisticsIcon' + config.tabIndex]}`} />
              </div>
              <div className={style.right}>
                {config.subTitle && (
                  <div className={`${style.edmDetailSubTitle} ${style['subTitle' + config.tabIndex]}`}>
                    {config.subTitle}:{stats[config.subValueKey] || '--'}
                  </div>
                )}
                <div className={style.tabItemNum}>{num}</div>
                <div className={style.tabItemTitle}>
                  {showReplyCountBtn ? (
                    <span
                      style={{ display: 'flex' }}
                      onClick={() => {
                        openReplayPage(planId || '');
                      }}
                    >
                      <span className={style.link}>{config.title}</span>
                      <RightArrowLinkIcon className={style.icon} />
                    </span>
                  ) : (
                    <span>{config.title}</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
