import React, { useEffect, useState, useContext, useMemo } from 'react';
import classnames from 'classnames';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import { resCustomsCountry as countryItemType, CustomsContinent } from 'api';
import { Popover } from 'antd';
import moment, { Moment } from 'moment';
// import { Checkbox } from '@web-common/components/UI/Checkbox';
import Checkbox from '@lingxi-common-component/sirius-ui/Checkbox';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import style from './commonSearch.module.scss';
import DatePicker from '@/components/Layout/Customer/components/UI/DatePicker/datePicker';
import { ReactComponent as QuestionIcon } from '@/images/icons/edm/question.svg';
import SearchCollapse from '@/components/Layout/Customer/components/searchCollapse/SearchCollapse';
import CollapseButton from '@/components/Layout/Customer/components/collapseButton/CollapseButton';
import { GlobalContext } from '../../../context';
import { getIn18Text } from 'api';
// import Cascader from '@web-common/components/UI/Cascader';
import Cascader from '@lingxi-common-component/sirius-ui/Cascader';
import { handleCountryOutPut, handleArrCountryInput } from '@/components/Layout/CustomsData/utils';
import { useForwarderCommonlyUsedPort } from '../../../docSearch/hooks/usePortListHook';
import { useForwarderHotPort } from '../../../docSearch/hooks/usePortListHook';
import { getGroupPorts } from '../../../ForwarderSearch/ForwarderSearch';
import { DebounceSelectProps } from '../../../ForwarderSearch/components/RemotePortSelect/RemotePortSelect';
import RemotePortSelect from '../../../ForwarderSearch/components/RemotePortSelect/RemotePortSelect';
import { ForeignParam } from '../../customsBaseDetail';

const { RangePicker } = DatePicker;
function disabledDateFuture(current) {
  return current && current < moment('1900-01-01').endOf('day');
}

interface Props {
  className?: string;
  hsCode?: string;
  goodsShipped?: string;
  preciseSearch?: boolean;
  countryList?: string[]; // 选中的供应&采购国家
  onChangeCountry?: (list: string[]) => void;
  allCountry: CustomsContinent[];
  onChangeOriginCountry?: (list: string[]) => void;
  onChangeHscode?: (hsCode?: string) => void;
  onChangeGoods?: (goods?: string) => void;
  onChangePreciseSearch?: (preciseSearch?: boolean) => void;
  type: 'buysers' | 'suppliers' | 'peers';
  isSupplier?: boolean;
  isRecord?: boolean;
  onChangeDealTime?: (time: [string, string]) => void;
  initDateRange?: [Moment, Moment];
  defaultExpand?: boolean;
  onChangePort?: (value: ForeignParam[], endPort: ForeignParam[], type: 'first' | 'second') => void;
  goPort?: any;
  endPort?: any;
  showPort?: boolean;
  setFinaPort?: (param: ForeignParam[]) => void;
  setComePort?: (param: ForeignParam[]) => void;
}

const dates = [
  {
    label: '近半年',
    monthCount: -6,
  },
  {
    label: '近一年',
    monthCount: -12,
  },
  {
    label: '近两年',
    monthCount: -24,
  },
  {
    label: '近三年',
    monthCount: -36,
  },
  {
    label: '近五年',
    monthCount: -60,
  },
];

const CusotmsDetailSearch = ({
  className,
  hsCode,
  goodsShipped,
  preciseSearch,
  countryList = [],
  onChangeHscode,
  onChangeGoods,
  onChangePreciseSearch,
  allCountry,
  onChangeCountry,
  type,
  onChangeOriginCountry,
  isSupplier,
  isRecord,
  onChangeDealTime,
  initDateRange,
  defaultExpand,
  onChangePort,
  goPort,
  endPort,
  showPort,
  setComePort,
  setFinaPort,
}: Props) => {
  const [currentHsCode, setCurrentHsCode] = useState<string | undefined>(() => hsCode);
  const [currentGoodsShipped, setCurrentGoodsShipped] = useState<string | undefined>(() => goodsShipped);
  const [currentPreciseSearch, setCurrentPreciseSearch] = useState<boolean | undefined>(() => preciseSearch);
  const [isExpand, setIsExpand] = useState<boolean>(defaultExpand ?? false);
  const [isShowSearchCollapse, setIsShowSearchCollapse] = useState<boolean>(false);
  const { state } = useContext(GlobalContext);
  const [dateRange, setDateRange] = useState<[Moment, Moment]>(initDateRange || ([] as unknown as [Moment, Moment]));
  const [cnPorts, overseaPorts] = useForwarderCommonlyUsedPort();

  const pureHotPortsCn = useForwarderHotPort(0);
  const pureHotPortsOverSea = useForwarderHotPort(1);

  // 出发港
  const firstPortSelctGrpPort = useMemo<DebounceSelectProps['groupPorts']>(() => {
    return getGroupPorts({
      hot: pureHotPortsCn,
      collect: cnPorts,
    });
  }, [pureHotPortsCn, cnPorts]);

  // 到达港
  const secondPortSelctGrpPort = useMemo<DebounceSelectProps['groupPorts']>(() => {
    return getGroupPorts({
      hot: pureHotPortsOverSea,
      collect: overseaPorts,
    });
  }, [pureHotPortsOverSea, overseaPorts]);

  useEffect(() => {
    // console.log('@@@', state.updateTime, state.timeFilter);
    const { dealtTime = [] } = state || {};
    if (!dealtTime?.[0] || !dealtTime?.[1]) {
      return;
    }
    setDateRange([moment(dealtTime[0]), moment(dealtTime[1])]);
  }, [state?.dealtTime]);

  const onPressEnter = () => {
    onChangeHscode && onChangeHscode(currentHsCode);
    onChangeGoods && onChangeGoods(currentGoodsShipped);
    onChangePreciseSearch?.(currentPreciseSearch);
  };

  const onChangeCreateTime = (values: any, formatString: [string, string]) => {
    if (!formatString || !formatString[0] || !formatString[1]) {
      setDateRange([] as unknown as [Moment, Moment]);
    } else {
      setDateRange([moment(formatString[0]), moment(formatString[1])]);
    }

    onChangeDealTime && onChangeDealTime(formatString);
  };

  useEffect(() => {
    if (onChangeOriginCountry || isRecord || showPort) {
      setIsShowSearchCollapse(true);
    } else {
      setIsShowSearchCollapse(false);
    }
  }, [isRecord, onChangeOriginCountry, goPort, endPort]);

  useEffect(() => {
    setCurrentHsCode(hsCode);
    setCurrentGoodsShipped(goodsShipped);
  }, [hsCode, goodsShipped]);
  useEffect(() => {
    setCurrentPreciseSearch(preciseSearch);
  }, [preciseSearch]);
  useEffect(() => {
    setDateRange(initDateRange || ([] as unknown as [Moment, Moment]));
  }, [initDateRange]);

  useEffect(() => {
    setIsExpand(defaultExpand ?? false);
  }, [defaultExpand]);

  const content = (
    <div
      style={{
        width: 336,
        borderRadius: 6,
        padding: 16,
        border: '0.5px solid rgba(38, 42, 51, 0.2)',
      }}
    >
      {getIn18Text('YUANCHANDEKESHAIXUAN\u201CGUOJIADEQU\u201D\uFF0CZANBUZHICHI\u201CCHENGSHI\u201DSHAIXUAN')}
    </div>
  );
  // 展示国家
  const PopoverCountry = () => (
    <Popover placement="bottomLeft" content={content} trigger="hover">
      <div
        style={{
          paddingLeft: 5,
          color: '#FFAA00',
          cursor: 'pointer',
          height: 16,
          display: 'inline-block',
          verticalAlign: -3,
        }}
      >
        <QuestionIcon style={{ display: 'block' }} />
      </div>
    </Popover>
  );
  return (
    <div className={classnames(style.customsCommonSearchWrap, className)}>
      <SearchCollapse expand={isSupplier || showPort ? true : isExpand} minHeight={40} calssName={style.boxPadding}>
        <div className={style.customsCommonSearch}>
          {/* {isRecord ? (
            <div className={style.item}>
              <span className={style.title}>{getIn18Text('JIAOYISHIJIAN')}</span>
              <RangePicker
                separator="-"
                style={{ width: 235, verticalAlign: 'top' }}
                // className="edm-range-picker"
                placeholder={[getIn18Text('KAISHISHIJIAN'), getIn18Text('JIESHUSHIJIAN')]}
                locale={cnlocale}
                // format={dateShowFormat}
                disabledDate={disabledDateFuture}
                value={dateRange}
                onChange={onChangeCreateTime}
                renderExtraFooter={() => {
                  const [start, end] = dateRange;
                  let rangeMonth = 0;
                  if (start && end) {
                    rangeMonth = moment(end)?.diff(moment(start), 'month');
                  }
                  return (
                    <div className={style.dateSelectFoot}>
                      {dates.map(date => (
                        <div
                          key={date.label}
                          className={classnames(style.dateSelectItem, {
                            [style.dateSelectItemSelected]: rangeMonth !== undefined && Math.abs(date.monthCount) === Math.abs(rangeMonth),
                          })}
                          onClick={() => {
                            const startDate = moment().add(date.monthCount, 'month');
                            const endDate = moment();
                            setDateRange([startDate, endDate]);
                            onChangeCreateTime([startDate, endDate], [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]);
                          }}
                        >
                          {date.label}
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
            </div>
          ) : null} */}
          {!isSupplier ? (
            <>
              <div className={style.item}>
                <span className={style.title}>{getIn18Text('CHANPINMIAOSHU')}</span>
                <Input
                  value={currentGoodsShipped}
                  style={{ width: 235, verticalAlign: 'top', padding: '4px 12px' }}
                  placeholder={getIn18Text('QINGSHURUCHANPINMIAOSHU')}
                  allowClear
                  onPressEnter={onPressEnter}
                  onBlur={() => {
                    if (currentGoodsShipped === goodsShipped) return;
                    onChangeGoods && onChangeGoods(currentGoodsShipped);
                  }}
                  onChange={e => {
                    setCurrentGoodsShipped(e.target.value as string);
                    if (!e.target.value) {
                      onChangeGoods && onChangeGoods('');
                    }
                  }}
                  suffix={
                    <Checkbox
                      className={style.preciseSearch}
                      checked={currentPreciseSearch}
                      onChange={e => {
                        setCurrentPreciseSearch(e.target.checked);
                        onChangePreciseSearch?.(e.target.checked);
                      }}
                    >
                      {getIn18Text('JINGQUE')}
                    </Checkbox>
                  }
                />
              </div>
            </>
          ) : null}
          {!isSupplier ? (
            <div className={style.item}>
              <span className={style.title}>HSCode</span>
              <Input
                value={currentHsCode}
                placeholder={getIn18Text('QINGSHURUHSCODE')}
                style={{ width: 235, verticalAlign: 'top' }}
                onPressEnter={onPressEnter}
                onBlur={() => {
                  if (currentHsCode === hsCode) return;
                  onChangeHscode && onChangeHscode(currentHsCode);
                }}
                allowClear
                onChange={e => {
                  setCurrentHsCode(e.target.value as string);
                  if (!e.target.value) {
                    onChangeHscode && onChangeHscode('');
                  }
                }}
              />
            </div>
          ) : null}
          {onChangeCountry && (
            <div className={style.item}>
              <span className={style.title}>
                {
                  {
                    buysers: getIn18Text('GONGYINGQUYU'),
                    suppliers: getIn18Text('CAIGOUQUYU'),
                    // 占位 暂时无用 后续如果有需要可修改
                    peers: '运输区域',
                  }[type]
                }
              </span>
              <Cascader
                style={{ width: 235, verticalAlign: 'top', borderRadius: '2px' }}
                multiple
                showSearch
                maxTagCount="responsive"
                placeholder={getIn18Text('QINGXUANZE')}
                value={handleArrCountryInput(countryList, allCountry)}
                onChange={values => {
                  onChangeCountry(handleCountryOutPut(values as string[][], allCountry, true));
                }}
                options={allCountry.map(e => ({
                  label: e.continentCn,
                  value: e.continent,
                  children: e.countries.map(d => ({
                    label: d.nameCn,
                    value: d.name,
                  })),
                }))}
              />
            </div>
          )}
          <div hidden={!onChangeOriginCountry} className={style.item}>
            <span className={style.title}>
              {getIn18Text('YUANCHANDE')} <PopoverCountry />
            </span>
            <Cascader
              style={{ width: 235, verticalAlign: 'top', borderRadius: '2px' }}
              multiple
              showSearch
              maxTagCount="responsive"
              placeholder={getIn18Text('QINGXUANZE')}
              onChange={values => {
                onChangeOriginCountry && onChangeOriginCountry(handleCountryOutPut(values as string[][], allCountry, true));
              }}
              options={allCountry.map(e => ({
                label: e.continentCn,
                value: e.continent,
                children: e.countries.map(d => ({
                  label: d.nameCn,
                  value: d.name,
                })),
              }))}
            />
          </div>
          {showPort && (
            <div className={style.item}>
              <span className={style.title}>出发港</span>
              <RemotePortSelect
                groupPorts={firstPortSelctGrpPort}
                style={{ width: 235, verticalAlign: 'top', borderRadius: '2px' }}
                allowClear
                showArrow={false}
                className={classnames(style.portSelect, style.firstPort)}
                labelInValue
                mode="multiple"
                placeholder="出发港"
                maxTagCount="responsive"
                defaultValue={goPort ?? []}
                onChange={(value: any) => {
                  setComePort && setComePort(value);
                  value &&
                    onChangePort &&
                    onChangePort(
                      value.map((item: any) => {
                        return {
                          name: item.value,
                          nameCn: item.label,
                        };
                      }),
                      (endPort ?? []).map((item: any) => {
                        return {
                          name: item.value,
                          nameCn: item.label,
                        };
                      }),
                      'first'
                    );
                }}
              />
            </div>
          )}
          {showPort && (
            <div className={style.item}>
              <span className={style.title}>目的港</span>
              <RemotePortSelect
                groupPorts={secondPortSelctGrpPort}
                style={{ width: 235, verticalAlign: 'top', borderRadius: '2px' }}
                allowClear
                showArrow={false}
                className={classnames(style.portSelect, style.secondPort)}
                labelInValue
                mode="multiple"
                placeholder="目的港"
                maxTagCount="responsive"
                defaultValue={endPort ?? []}
                onChange={(value: any) => {
                  setFinaPort && setFinaPort(value);
                  value &&
                    onChangePort &&
                    onChangePort(
                      (goPort ?? []).map((item: any) => {
                        return {
                          name: item.value,
                          nameCn: item.label,
                        };
                      }),
                      value.map((item: any) => {
                        return {
                          name: item.value,
                          nameCn: item.label,
                        };
                      }),
                      'second'
                    );
                }}
              />
            </div>
          )}
        </div>
      </SearchCollapse>
      {isShowSearchCollapse && !showPort ? (
        <CollapseButton
          foldText={getIn18Text('GENGDUO')}
          unFoldText={getIn18Text('SHOUQI')}
          expand={isExpand}
          onClick={() => {
            setIsExpand(!isExpand);
          }}
          className={style.clickBtn}
          noIcon
        />
      ) : null}
    </div>
  );
};
export default CusotmsDetailSearch;
