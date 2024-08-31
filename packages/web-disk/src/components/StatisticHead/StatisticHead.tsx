import React, { useEffect, useState, useRef } from 'react';
import { Input, DatePicker } from 'antd';
import { ResponseExternalShareStatistic, RequestGetExternalShareList } from 'api';
import moment, { Moment } from 'moment';
import locale from 'antd/es/date-picker/locale/zh_CN';
import IconCard from '@web-common/components/UI/IconCard/index';
import { DiskPage, Bread } from '../../disk';
import SiriusSelect from '@web-common/components/UI/SiriusSelect';
import style from './StatisticHead.module.scss';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { getIn18Text } from 'api';
export interface Props {
  defaultVisitRangeTime?: [number, number];
  setCurrentPage?: (val: DiskPage) => void;
  changeExternalShareList?: (params?: Partial<RequestGetExternalShareList>) => void;
}
type RangerDataType = [Moment, Moment];
interface RangerPickProps {
  visible: boolean;
  value?: RangerDataType;
  onChange: (startTime: Moment, endTime: Moment) => void;
  onRangerChange?: (list: RangerDataType) => void;
}
const { RangePicker } = DatePicker;
const transTime = (rangeTime): RangerDataType => {
  const startTime = rangeTime[0];
  const endTime = rangeTime[1];
  return [moment(startTime), moment(endTime)];
};
const RangerPick: React.FC<RangerPickProps> = props => {
  const { visible, value, onRangerChange, onChange } = props;
  const startTime = moment();
  const endTime = moment().add(1, 'M');
  const rangerMoment = useRef<any>(value || [startTime, endTime]);
  const setRangerMoment = (list: any) => {
    rangerMoment.current = list;
  };
  useEffect(() => {
    value && setRangerMoment(value);
  }, [value]);
  return (
    <div className={style.rangerWrap} hidden={!visible}>
      <RangePicker
        onOpenChange={open => {
          const start = rangerMoment.current[0];
          const end = rangerMoment.current[1];
          if (!open && start && end) {
            onChange(start, end);
          }
        }}
        onChange={list => {
          if (list && list[0] && list[1]) {
            setRangerMoment(list);
            onRangerChange && onRangerChange(list as RangerDataType);
          }
        }}
        dropdownClassName={style.rangerPickerDropdownWrap}
        inputReadOnly
        value={rangerMoment.current}
        allowClear={false}
        format="YYYY.MM.DD"
        bordered={false}
        locale={locale}
        separator="-"
        suffixIcon={null}
        className={style.rangerPicker}
      />
    </div>
  );
};
const StatisticHead: React.FC<Props> = props => {
  const { defaultVisitRangeTime, setCurrentPage, changeExternalShareList } = props;
  const [showCreateRanger, setShowCreateRanger] = useState<boolean>(false);
  const [showVisitRanger, setShowVisitRanger] = useState<boolean>(false);
  const [visitSelectValue, setVisitSelectValue] = useState<number>(-1);
  const [visitRangeTime, setVisitRangeTime] = useState<RangerDataType | undefined>();
  const [createRangeTime, setCreateRangeTime] = useState<RangerDataType | undefined>();
  useEffect(() => {
    if (defaultVisitRangeTime) {
      const startTime = defaultVisitRangeTime[0];
      const endTime = defaultVisitRangeTime[1];
      changeExternalShareList &&
        changeExternalShareList({
          visitTime: {
            intervalType: 'ABSOLUTE',
            interval: {
              startTime,
              endTime,
            },
          },
        });
      setVisitRangeTime(defaultVisitRangeTime && transTime(defaultVisitRangeTime));
      setShowVisitRanger(!!defaultVisitRangeTime);
      setVisitSelectValue(defaultVisitRangeTime ? -100 : -1);
    }
  }, [defaultVisitRangeTime]);
  const staticTimeOptions = [
    {
      label: getIn18Text('QUANBU'),
      value: -1,
    },
    {
      label: getIn18Text('ZUIJIN7TIAN'),
      value: 7,
    },
    {
      label: getIn18Text('ZUIJIN1GEYUE'),
      value: 30,
    },
    {
      label: getIn18Text('ZUIJIN3GEYUE'),
      value: 90,
    },
  ];
  const externalCreateTimeOptions = [...staticTimeOptions, { label: getIn18Text('ZIDINGYI'), value: -100 }];
  const externalVisitTimeOptions = [...staticTimeOptions, { label: getIn18Text('ZIDINGYI'), value: -100 }];
  const loadShareListData = (type: 'createTime' | 'visitTime', params?: any) => {
    let momentList = type === 'createTime' ? createRangeTime : visitRangeTime;
    momentList = momentList || [moment(), moment().add(1, 'M')];
    const start = momentList[0].startOf('day').valueOf();
    const end = momentList[1].endOf('day').valueOf();
    const defaultParams = {
      [type]: {
        intervalType: 'ABSOLUTE',
        interval: {
          startTime: start,
          endTime: end,
        },
      },
    };
    params = params ? Object.assign(defaultParams, params) : defaultParams;
    changeExternalShareList && changeExternalShareList(params);
  };
  return (
    <div className={style.staticPageWrap}>
      <div className={style.pageTitle}>
        {/* 主页 stastic 导航 */}
        <div className={style.ArrowLeftWrap}>
          <span
            className={style.mainPage}
            onClick={() => {
              setCurrentPage && setCurrentPage('index');
            }}
          >
            {getIn18Text('ZHUYE')}
          </span>
          {/* <div className={style.ArrowLeft} /> */}
          <IconCard type="arrowRight" />
          <span>{getIn18Text('HUDONGTONGJI')}</span>
        </div>

        {/* 搜索 */}
        <Input
          prefix={<SearchIcon />}
          placeholder={getIn18Text('QINGSHURUJIESHOU')}
          className={style.staticSearch}
          bordered={false}
          onChange={e => {
            changeExternalShareList &&
              changeExternalShareList({
                searchKey: e.target.value,
              });
          }}
          onPressEnter={e => {
            changeExternalShareList &&
              changeExternalShareList({
                searchKey: e.currentTarget.value,
              });
          }}
        />
      </div>
      <div className={style.selectGroup}>
        <div className={style.shareTime}>
          <SiriusSelect
            onChange={val => {
              if (val === -100) {
                setShowCreateRanger(true);
                loadShareListData('createTime');
              } else {
                setShowCreateRanger(false);
                changeExternalShareList &&
                  changeExternalShareList({
                    createTime: {
                      intervalType: 'RELATIVE',
                      period: val,
                    },
                  });
              }
            }}
            overClass={style.selectOver}
            defaultValue={-1}
            label={getIn18Text('ANCHUANGJIANSHIJIAN')}
            options={externalCreateTimeOptions}
          />
          <RangerPick
            onChange={(start, end) => {
              changeExternalShareList &&
                changeExternalShareList({
                  createTime: {
                    intervalType: 'ABSOLUTE',
                    interval: {
                      startTime: start.startOf('day').valueOf(),
                      endTime: end.endOf('day').valueOf(),
                    },
                  },
                });
            }}
            onRangerChange={_list => {
              setCreateRangeTime(_list);
            }}
            value={createRangeTime}
            visible={showCreateRanger}
          />
        </div>
        <div className={style.inviteTime}>
          <SiriusSelect
            onChange={val => {
              if (val === -100) {
                setShowVisitRanger(true);
                loadShareListData('visitTime');
              } else {
                setShowVisitRanger(false);
                changeExternalShareList &&
                  changeExternalShareList({
                    visitTime: {
                      intervalType: 'RELATIVE',
                      period: val,
                    },
                  });
              }
            }}
            defaultValue={visitSelectValue}
            overClass={style.selectOver}
            label={getIn18Text('ANFANGWENSHIJIAN')}
            options={externalVisitTimeOptions}
          />
          <RangerPick
            onChange={(start, end) => {
              changeExternalShareList &&
                changeExternalShareList({
                  visitTime: {
                    intervalType: 'ABSOLUTE',
                    interval: {
                      startTime: start.startOf('day').valueOf(),
                      endTime: end.endOf('day').valueOf(),
                    },
                  },
                });
            }}
            onRangerChange={_list => {
              setVisitRangeTime(_list);
            }}
            value={visitRangeTime}
            visible={showVisitRanger}
          />
        </div>
      </div>
    </div>
  );
};
export default StatisticHead;
