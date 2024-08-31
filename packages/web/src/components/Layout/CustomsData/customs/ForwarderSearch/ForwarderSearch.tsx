import React, { useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import style from './forwadersearch.module.scss';
import classnames from 'classnames';
import { Form, Tooltip, message } from 'antd';
import { getIn18Text, ForwarderType, ReqForwarder, customsTimeFilterType, api, TCustomsPort, CommonlyUsePort } from 'api';
// import SiriusCheckbox from '@web-common/components/UI/Checkbox/siriusCheckbox';
import SiriusCheckbox from '@lingxi-common-component/sirius-ui/Checkbox';
import CountryCompactSelect from '../search/countryCompactSelect/CountryCompactSelect';
import { useCustomsCountryHook } from '../docSearch/component/CountryList/customsCountryHook';
// import Cascader from '@web-common/components/UI/Cascader';
import Cascader from '@lingxi-common-component/sirius-ui/Cascader';
import { SearchType } from '../ForwarderData';
import { containsExpressTipContent, timeRangeOptions } from '../search/constant';
import { TongyongCuowutishiXian, TongyongJiantou1Shang, TongyongJiantou1Xia } from '@sirius/icons';
import classNames from 'classnames';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import RemotePortSelect, { DebounceSelectProps } from './components/RemotePortSelect/RemotePortSelect';
import { useAirLineList } from './useHooks/useAirlineList';
import { useForwarderHotSearchList } from './useHooks/useHotSearchList';
import HistoryTagList from './components/HistoryTagList/HistoryTagList';
import { useDateUpdateTime } from './useHooks/useDateUpdateTime';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import ChinaCompanyAlert from './components/ChinaCompanyAlert/ChinaCompanyAlert';
import { useForwarderCommonlyUsedPort, useForwarderHotPort } from '../docSearch/hooks/usePortListHook';
// import SiriusRadio from '@web-common/components/UI/Radio/siriusRadio';
import SiriusRadio from '@lingxi-common-component/sirius-ui/Radio';
import { Model } from '../ForwarderData';
import { useMemoizedFn } from 'ahooks';
export const CN_VALUE = '_cn_';
type UP_DATE_TAG_TYPE = 'update_date';
export const UP_DATE_TAG: UP_DATE_TAG_TYPE = 'update_date';

export interface OptionLabelValue {
  value: string;
  label: string;
  key?: string;
}

export const enum ContainsExpressEnum {
  Default,
  Include,
  NotInclude,
}

export type ForwarderFormType = Pick<
  ReqForwarder,
  | 'countryList'
  | 'portOfLadings'
  | 'airlines'
  | 'portOfUnLadings'
  // 排除物流公司
  | 'containsExpress'
  | 'updateTime'
  // 来源国家
  | 'relationCountryList'
  | 'notViewed'
  | 'excludeViewed'
  | 'timeFilter'
  | 'onlyContainsChina'
  | 'exactlySearch'
  | 'queryKeys'
  | 'queryType'
  | 'freightTypeList'
>;

// 表单内字段处理比较复杂，存在复合和映射情况，和实际请求的值可能不一致，需要对下述字段做内部处理
// 表单数据通过 @getValues 处理函数进行get
// 表单数据通过 @geneNextValue 处理函数进行set
export type ForwarderInnerFormType = Omit<ForwarderFormType, 'timeFilter' | 'airlines' | 'portOfLadings' | 'portOfUnLadings' | 'containsExpress'> & {
  timeFilter?: [UP_DATE_TAG_TYPE, string] | [customsTimeFilterType];
  airlines?: OptionLabelValue;
  portOfLadings?: OptionLabelValue[];
  portOfUnLadings?: OptionLabelValue[];
  containsExpress?: ContainsExpressEnum;
};

interface Props {
  className: string;
  onSearch: (values: ForwarderFormType) => void;
  initLayout: boolean;
  searchType: SearchType;
  defaultValues?: ForwarderFormType;
  onForwarderTypeChange?(v: ForwarderType): void;
  onValuesChange?(): void;
  afterReset?(): void;
  needValitor?: boolean;
  model?: Model;
  formClassName?: string;
  btnClassName?: string;
}
const tabs: Array<{
  label: string;
  value: ForwarderType;
}> = [
  {
    label: '港口',
    value: ForwarderType.Port,
  },
  {
    label: '航线',
    value: ForwarderType.AirLine,
  },
];

export interface ForwarderSearchRef {
  getValues(): ForwarderFormType;
  setValues(values: Partial<ForwarderFormType>): void;
  resetValues(values?: ForwarderFormType): void;
  updateSearchHistoryList(): void;
}

export const getGroupPorts: (params: { hot?: TCustomsPort[]; collect?: CommonlyUsePort[] }) => DebounceSelectProps['groupPorts'] = ({ hot, collect }) => {
  const res: DebounceSelectProps['groupPorts'] = [];
  const collectFlatMap = collect?.flatMap(e => e.ports);
  // 去除重复的值
  const collectPortKeys = collectFlatMap?.map(e => e.name);
  const hotPort = hot?.filter(e => !collectPortKeys?.includes(e.name));
  if (collectFlatMap && collectFlatMap.length > 0 && collect) {
    res.push({
      label: '常用港口' + `(${collect.map(re => re.country.countryChinese).join('/')})`,
      ports: collectFlatMap,
    });
  }
  if (hotPort && hotPort.length > 0) {
    res.push({
      label: '热门港口',
      ports: hotPort,
    });
  }
  return res;
};

const ForwarderSearch = React.forwardRef<ForwarderSearchRef, Props>(
  (
    { className, afterReset, needValitor, onSearch, initLayout, searchType, defaultValues, onForwarderTypeChange, onValuesChange, model, formClassName, btnClassName },
    forwarderSearchRef
  ) => {
    const [form] = Form.useForm<ForwarderInnerFormType>();
    const [expand, setExpand] = useState<boolean>(false);
    const [isTimeFilter, handleISTimeFilter] = useState();
    const [continentList] = useCustomsCountryHook();
    const [_, airLineOptions] = useAirLineList();
    const { list: searchHistoryList, update: updateSearchHistoryList } = useForwarderHotSearchList();
    const dateUpdateTime = useDateUpdateTime();

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

    const getValues = React.useCallback(() => {
      const { timeFilter, airlines, portOfLadings, portOfUnLadings, containsExpress, ...values } = form.getFieldsValue();
      const submitValues: ForwarderFormType = {
        ...values,
      };
      if (containsExpress === ContainsExpressEnum.Default) {
        submitValues.containsExpress = null;
      } else if (containsExpress === ContainsExpressEnum.Include) {
        submitValues.containsExpress = true;
      } else if (containsExpress === ContainsExpressEnum.NotInclude) {
        submitValues.containsExpress = false;
      }
      // 格式化relationCountryList
      if (submitValues.relationCountryList) {
        const allList: string[] = [];
        submitValues.relationCountryList.forEach(val => {
          const [con, cou] = val || [];
          if (con && con !== CN_VALUE) {
            if (cou) {
              allList.push(cou);
            }
          }
        });
        submitValues.relationCountryList = Array.from(new Set(allList));
      }
      // 格式化时间范围和更新时间
      if (timeFilter && timeFilter[0] === UP_DATE_TAG) {
        submitValues.timeFilter = 'all';
        submitValues.updateTime = timeFilter[1];
      } else {
        submitValues.timeFilter = timeFilter?.[0];
        submitValues.updateTime = '';
      }
      // 格式化航线
      if (airlines) {
        submitValues.airlines = [
          {
            label: airlines.label,
            value: airlines.value,
          },
        ];
      } else {
        submitValues.airlines = [];
      }
      submitValues.portOfLadings = portOfLadings?.map(e => ({
        label: e.label,
        value: e.value,
      }));
      submitValues.portOfUnLadings = portOfUnLadings?.map(e => ({
        label: e.label,
        value: e.value,
      }));
      return submitValues;
    }, [form]);

    const geneNextValue = useCallback((values: Partial<ForwarderFormType>) => {
      const { timeFilter, updateTime, airlines, containsExpress, queryKeys = [], queryType = ForwarderType.Port, freightTypeList = [], ...rest } = values;
      const nextValues: ForwarderInnerFormType = { ...rest, queryKeys, queryType };
      if (containsExpress === undefined || containsExpress === null) {
        nextValues.containsExpress = ContainsExpressEnum.Default;
      } else if (containsExpress) {
        nextValues.containsExpress = ContainsExpressEnum.Include;
      } else {
        nextValues.containsExpress = ContainsExpressEnum.NotInclude;
      }
      if (updateTime) {
        nextValues.timeFilter = [UP_DATE_TAG, updateTime];
      } else {
        nextValues.timeFilter = [timeFilter || 'last_one_year'];
      }
      if (airlines && airlines[0]) {
        nextValues.airlines = {
          label: airlines[0].label,
          value: airlines[0].value,
        };
        nextValues.portOfLadings = [];
        nextValues.portOfUnLadings = [];
      } else {
        nextValues.airlines = undefined;
      }
      return nextValues;
    }, []);

    const handleForwarderTypeChange = (value: ForwarderType) => {
      if (value === ForwarderType.Port) {
        form.setFieldsValue({
          airlines: undefined,
        });
        handleISTimeFilter(undefined);
      } else {
        form.setFieldsValue({
          portOfLadings: [],
          portOfUnLadings: [],
        });
      }
      onForwarderTypeChange?.(value);
    };

    useImperativeHandle(
      forwarderSearchRef,
      () => ({
        getValues: getValues,
        updateSearchHistoryList: updateSearchHistoryList,
        setValues(values: ForwarderFormType) {
          form.setFieldsValue(geneNextValue(values));
        },
        resetValues(values?: ForwarderFormType) {
          if (values) {
            form.setFieldsValue(geneNextValue(values));
          } else {
            form.resetFields();
          }
        },
      }),
      [getValues, updateSearchHistoryList]
    );

    const handleChange = (changed: any, values: ForwarderInnerFormType) => {
      onValuesChange?.();
      const needForceSubmitKeys: Array<keyof ForwarderInnerFormType> = [
        'airlines',
        'containsExpress',
        'exactlySearch',
        'excludeViewed',
        'notViewed',
        'timeFilter',
        'countryList',
        'onlyContainsChina',
        'portOfLadings',
        'portOfUnLadings',
        'freightTypeList',
      ];
      const curChangedKeys = Object.keys(changed) as Array<keyof ForwarderInnerFormType>;
      for (let index = 0; index < curChangedKeys.length; index++) {
        const curKey = curChangedKeys[index];
        if (needForceSubmitKeys.includes(curKey)) {
          handleFinish(true);
          break;
        }
      }
    };

    const handleFinish = (slience: boolean = false) => {
      const value = getValues();
      const showValitorMsg = (msg: string) => {
        !slience && message.warn(msg);
      };
      if (needValitor) {
        if (value.queryType === ForwarderType.Port) {
          if (model === 'peers' && !((value.portOfLadings && value.portOfLadings.length > 0) || (value.portOfUnLadings && value.portOfUnLadings.length > 0))) {
            showValitorMsg('请选择港口');
            return;
          } else if (model !== 'peers' && !(value.portOfLadings && value.portOfLadings.length > 0 && value.portOfUnLadings && value.portOfUnLadings.length > 0)) {
            showValitorMsg('请选择港口');
            return;
          } else if ((value.portOfLadings && value.portOfLadings.length > 5) || (value.portOfUnLadings && value.portOfUnLadings.length > 5)) {
            showValitorMsg('港口不可超过5个');
            return;
          }
        } else if (value.queryType === ForwarderType.AirLine && !(value.airlines && value.airlines.length > 0)) {
          showValitorMsg('请选择航线');
          return;
        }
        if (value.queryKeys && value.queryKeys.length > 5) {
          showValitorMsg('关键词不可超过5个');
          return;
        }
      }
      onValuesChange?.();
      onSearch(value);
    };

    useEffect(() => {
      setExpand(!initLayout);
    }, [initLayout]);
    const choiseAirlines = (e: any, opt: any) => {
      handleISTimeFilter(opt?.isTimeFilter);
      if (opt?.isTimeFilter) {
        form.setFieldsValue({
          timeFilter: [opt?.isTimeFilter],
        });
        handleFinish(true);
      }
    };

    const handleOptions = useMemoizedFn(() => {
      return [
        ...timeRangeOptions,
        {
          label: (
            <>
              <span
                className={classnames({
                  [style.notViewed]: dateUpdateTime.some(item => item.viewCount === 0),
                })}
              >
                按更新周期
              </span>
            </>
          ),
          value: UP_DATE_TAG,
          children: dateUpdateTime.map(e => ({
            value: e.updateTime,
            label: (
              <div className={style.labelFlex} key={e.updateTime}>
                <span>{e.updateTime.replace(/-/g, '/')}</span>
                <span
                  className={classnames({
                    [style.notViewed]: e.viewCount === 0,
                  })}
                >
                  {searchType === 'buysers' && `${e.buyersUpdateCount}条`}
                  {searchType === 'suppliers' && `${e.suppliersUpdateCount}条`}
                  {searchType === 'peers' && `${e.transactions ?? 0}条`}
                </span>
              </div>
            ),
          })),
        },
      ];
    });
    return (
      <div
        className={classnames(style.searchBox, className, {
          [style.searchBoxInit]: initLayout,
          [style.searchBoxList]: !initLayout,
        })}
      >
        <Form<ForwarderInnerFormType>
          onFinish={() => handleFinish()}
          initialValues={defaultValues ? geneNextValue(defaultValues) : undefined}
          form={form}
          colon={false}
          className={classnames(style.form, formClassName, {
            [style.formHide]: !expand,
            [style.formList]: !initLayout,
          })}
          layout="inline"
          onValuesChange={handleChange}
        >
          <Form.Item noStyle shouldUpdate hidden={model === 'peers'}>
            {({ getFieldValue }) => {
              const value = getFieldValue('countryList');
              return (
                <ChinaCompanyAlert
                  visible={value && value[0] === 'China' && !initLayout}
                  storeKey="FORWARDER_SEARCH_CN_COMPANY_TIP"
                  message="中国海关数据为非公开数据，无直接联系人信息，需进一步挖掘后获得"
                  type="info"
                  showIcon
                  closable
                />
              );
            }}
          </Form.Item>
          <Form.Item
            label="搜索方式"
            className={classnames(style.compactItem, {
              [style.peerItem]: model === 'peers' && initLayout,
            })}
          >
            <Input.Group compact className={style.compactGroup}>
              <Form.Item noStyle name="queryType">
                <EnhanceSelect bordered={false} className={style.searchType} options={tabs} onChange={handleForwarderTypeChange}>
                  {tabs.map(node => (
                    <InSingleOption key={node.value} value={node.value}>
                      {node.label}
                    </InSingleOption>
                  ))}
                </EnhanceSelect>
              </Form.Item>
              {/* 选择港口或者航线 */}
              <Form.Item shouldUpdate noStyle>
                {({ getFieldValue }) => {
                  const values = getFieldValue('queryType');
                  if (values === ForwarderType.Port) {
                    return (
                      <>
                        <Form.Item noStyle name="portOfLadings">
                          <RemotePortSelect
                            groupPorts={firstPortSelctGrpPort}
                            allowClear
                            showArrow={false}
                            className={classnames(style.portSelect, style.firstPort)}
                            labelInValue
                            mode="multiple"
                            placeholder="出发港"
                            maxTagCount="responsive"
                          />
                        </Form.Item>
                        <Input placeholder="~" className={style.portSplit} disabled />
                        <Form.Item noStyle name="portOfUnLadings">
                          <RemotePortSelect
                            groupPorts={secondPortSelctGrpPort}
                            allowClear
                            showArrow={false}
                            className={classnames(style.portSelect, style.secondPort)}
                            labelInValue
                            mode="multiple"
                            placeholder="目的港"
                            maxTagCount="responsive"
                          />
                        </Form.Item>
                      </>
                    );
                  }
                  return (
                    <Form.Item noStyle name="airlines">
                      <EnhanceSelect
                        optionLabelProp="tag"
                        className={classnames(style.portSelect, style.airLine)}
                        labelInValue
                        placeholder="请选择航线"
                        onChange={(e, opt) => choiseAirlines(e, opt)}
                      >
                        {airLineOptions.map(node => (
                          <InSingleOption tag={node.label} key={node.value} value={node.value} isTimeFilter={node?.timeFilter}>
                            <div className={style.airLineItem}>
                              {node.label}
                              {node.tag && <div className={style.airLineTag}>{node.tag}</div>}
                            </div>
                          </InSingleOption>
                        ))}
                      </EnhanceSelect>
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item
            // hidden={expand}
            name="timeFilter"
            label={getIn18Text('SHIJIANFANWEI')}
            className={classnames(style.select, {
              [style.peerItemSInit]: model && model === 'peers' && initLayout,
              [style.peerItemS]: model && model === 'peers' && !initLayout,
            })}
          >
            <Cascader
              disabled={Boolean(isTimeFilter)}
              showCheckedStrategy="SHOW_CHILD"
              placeholder={getIn18Text('QINGXUANZESHIJIANFANWEI')}
              displayRender={label => {
                const node = label.slice().reverse()[0];
                if (React.isValidElement(node)) {
                  return node.key;
                }
                return node;
              }}
              options={handleOptions()}
            />
          </Form.Item>
          <div className={style.itemBox} hidden={model && model === 'peers'}>
            <Form.Item hidden={model && model === 'peers'} name="queryKeys" label="关键词" className={style.keywordInput}>
              <EnhanceSelect showArrow={false} mode="tags" maxTagCount="responsive" placeholder="关键词可更精准定位企业，包括产品名称、产品描述和HScode" open={false} />
            </Form.Item>
            <Form.Item hidden={model && model === 'peers'} valuePropName="checked" name="exactlySearch">
              <SiriusCheckbox className={style.precise}>
                <span>{'精确搜索'}</span>
              </SiriusCheckbox>
            </Form.Item>
          </div>

          <Form.Item label="货运类型" name="freightTypeList" hidden={model && model === 'peers'} className={style.select}>
            <EnhanceSelect
              mode="multiple"
              className={classnames(style.portSelect, style.freightTypeList)}
              placeholder="请选择货运类型"
              maxTagCount="responsive"
              allowClear
            >
              <InMultiOption value={1}>海运</InMultiOption>
              {/* <InMultiOption value={2}>空运</InMultiOption> */}
              <InMultiOption value={3}>陆运</InMultiOption>
              <InMultiOption value={4}>海河联程</InMultiOption>
            </EnhanceSelect>
          </Form.Item>
          <div className={classnames(style.divider)}></div>
          <Form.Item
            name="countryList"
            className={classnames(style.countrySelect, {
              [style.countryPeers]: model === 'peers',
            })}
            label={getIn18Text('GUOJIADEQU')}
          >
            <CountryCompactSelect />
          </Form.Item>
          <Form.Item hidden={model && model === 'peers'} dependencies={['onlyContainsChina']} noStyle>
            {({ getFieldValue }) => {
              const valueOnlyContainsChina = getFieldValue('onlyContainsChina');
              return (
                <Form.Item
                  className={style.relationCountrySelect}
                  name="relationCountryList"
                  label={searchType === 'suppliers' ? getIn18Text('GONGYINGMUDE') : getIn18Text('CAIGOULAIYUAN')}
                >
                  <Cascader
                    style={{ width: '100%', borderRadius: '2px' }}
                    placeholder={getIn18Text('QINGXUANZE') + (searchType === 'suppliers' ? getIn18Text('GONGYINGMUDE') : getIn18Text('CAIGOULAIYUAN'))}
                    multiple
                    maxTagCount="responsive"
                    className={style.origin}
                    showCheckedStrategy="SHOW_CHILD"
                    onChange={values => {
                      const flatValues = values.flatMap(e => e);
                      const onlyContainsChina = flatValues.includes(CN_VALUE);
                      form.setFieldsValue({
                        onlyContainsChina: onlyContainsChina,
                      });
                      handleChange(
                        {
                          onlyContainsChina: !onlyContainsChina,
                        },
                        {
                          ...form.getFieldsValue(),
                          onlyContainsChina: !onlyContainsChina,
                        }
                      );
                    }}
                    options={[
                      {
                        label: '仅包含中国',
                        value: CN_VALUE,
                      },
                    ].concat(
                      continentList.map(e => ({
                        label: e.continentCn,
                        value: e.continent,
                        disabled: !!valueOnlyContainsChina,
                        children: e.countries.map(d => ({
                          label: d.nameCn,
                          value: d.name,
                          disabled: !!valueOnlyContainsChina,
                        })),
                      }))
                    )}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>
          <Form.Item
            shouldUpdate
            hidden={model && model === 'peers'}
            className={classnames(style.containsExpress, style.select)}
            name="containsExpress"
            label={
              <>
                <span style={{ paddingRight: 4 }}>{getIn18Text('PAICHUWULIUGONGSI')}</span>
                <Tooltip placement="topLeft" title={containsExpressTipContent}>
                  <TongyongCuowutishiXian />
                </Tooltip>
              </>
            }
          >
            <EnhanceSelect>
              <InSingleOption value={ContainsExpressEnum.Default}>不排除</InSingleOption>
              <InSingleOption value={ContainsExpressEnum.NotInclude}>排除</InSingleOption>
              <InSingleOption value={ContainsExpressEnum.Include}>仅查询物流</InSingleOption>
            </EnhanceSelect>
          </Form.Item>
          <Form.Item
            label="公司标签"
            hidden={model && model === 'document'}
            className={classnames(style.viewStatus, {
              [style.viewStatusPeers]: model === 'peers',
            })}
          >
            <Form.Item valuePropName="checked" noStyle name="notViewed">
              <SiriusCheckbox>排除所有浏览</SiriusCheckbox>
            </Form.Item>
            <Form.Item valuePropName="checked" noStyle name="excludeViewed">
              <SiriusCheckbox>排除我的浏览</SiriusCheckbox>
            </Form.Item>
          </Form.Item>
          <Form.Item label="经常搜索" hidden={searchHistoryList.length === 0 || (model && model === 'peers')} className={style.searchHistory}>
            <HistoryTagList
              list={searchHistoryList}
              onChose={item => {
                form.setFieldsValue({
                  ...geneNextValue(item),
                });
                form.submit();
              }}
            />
          </Form.Item>
          <Form.Item name="onlyContainsChina" hidden valuePropName="checked">
            <SiriusCheckbox />
          </Form.Item>
          {/* <Form.Item hidden name="containsExpress" valuePropName="checked">
            <SiriusSwitch />
          </Form.Item> */}
          <div
            className={classNames(style.formOp, btnClassName, {
              [style.stowSpan]: expand,
            })}
          >
            <Button
              type="button"
              btnType="minorGray"
              hidden={model && model === 'peers' && initLayout}
              inline
              onClick={() => {
                form.resetFields();
                afterReset?.();
                handleISTimeFilter(undefined);
              }}
            >
              <span>{getIn18Text('ZHONGZHI')}</span>
            </Button>
            <Button
              type="submit"
              btnType="primary"
              inline
              // disabled={!query}
              className={classNames(style.btn, style.btnPrimary)}
              onClick={() => {
                // handleSearch();
              }}
            >
              <span>{getIn18Text('CHAXUN')}</span>
            </Button>
            {!initLayout && model !== 'peers' && (
              <span onClick={() => setExpand(!expand)} className={style.formHidden}>
                {!expand ? (
                  <span className={style.iconStatus}>
                    {getIn18Text('ZHANKAI')}
                    <TongyongJiantou1Xia color="#4c6aff" />
                  </span>
                ) : (
                  <span className={style.iconStatus}>
                    {getIn18Text('SHOUQI')}
                    <TongyongJiantou1Shang color="#4c6aff" />
                  </span>
                )}
              </span>
            )}
          </div>
        </Form>
      </div>
    );
  }
);
export default ForwarderSearch;
