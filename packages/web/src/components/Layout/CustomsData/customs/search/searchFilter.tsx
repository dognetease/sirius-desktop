import { Checkbox, Form, Input, Switch, Tooltip } from 'antd';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { useForm } from 'antd/es/form/Form';
import { customsDataType, reqBuyers } from 'api';
import classNames from 'classnames';
import React, { useEffect, useImperativeHandle, useState } from 'react';
import { CustomsDataSelectClick, customsDataTracker } from '../../tracker/tracker';
import { SearchType } from '../customs';
import { containsExpressTipContent, timeRangeOptions } from './constant';
import { ReactComponent as Help } from '@/images/icons/customs/help.svg';
import { ReactComponent as UplinedIcon } from '@/images/icons/customerDetail/uplined.svg';
import { ReactComponent as DownlinedIcon } from '@/images/icons/customerDetail/downlined.svg';
// import SiriusCheckbox from '@web-common/components/UI/Checkbox/siriusCheckbox';
import SiriusCheckbox from '@lingxi-common-component/sirius-ui/Checkbox';
import style from './searchfilter.module.scss';
import useLangOption from './useLangOption';
import CountryCompactSelect from './countryCompactSelect/CountryCompactSelect';
import { useCustomsCountryHook } from '../docSearch/component/CountryList/customsCountryHook';
// import Cascader from '@web-common/components/UI/Cascader';
import Cascader from '@lingxi-common-component/sirius-ui/Cascader';
// import { EnhanceSelect, InSingleOption, InMultiOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
import { getIn18Text } from 'api';
import CloseIcon from '@web-common/components/UI/Icons/svgs/CloseMailSvg';

export const ArrowDownFullfill = () => <span className={style.arrowDownFullfill}></span>;

export const CN_VALUE = '_cn_';

export type FilterFormData = Pick<
  reqBuyers,
  // 高级产品描述搜索
  | 'advanceGoodsShipped'
  // 高级hscode搜索
  | 'advanceHsCode'
  // 时间筛选
  | 'timeFilter'
  // 来源国家
  | 'relationCountryList'
  // 其他语种描述
  | 'otherGoodsShipped'
  // 排除物流公司
  | 'containsExpress'
  // 仅显示有采购来源中国的
  | 'onlyContainsChina'
  // 国家/地区
  | 'countryList'
  // 是否排除高级筛选中的HS编码
  | 'advanceHsCodeSearchType'
  // 未浏览
  | 'excludeViewed'
  // 有邮箱
  | 'hasEmail'
  //更新时间
  | 'updateTime'
> & {
  uncontainsExpress?: boolean;
};

interface CustomsSearchFilterProps extends React.HTMLAttributes<HTMLDivElement> {
  // 搜索方法
  onSearch?: (data: FilterFormData) => void;
  // 当前搜索的关键词
  query?: string;
  queryType?: customsDataType;
  // 当前搜索类型 供应/采购
  searchType?: SearchType;
  initValue?: Partial<FilterFormData>;
  originInitValue: FilterFormData;
  searchParams?: FilterFormData;
  originReCountry?: (value: Array<string[]>) => void;
  resetExcludeViewedObj: () => void;
  setDataRecord?: () => void;
  layout?: string[];
}

export interface CustomsSearchFilterRef {
  getFormValues(): FilterFormData;
  setFormValues(values?: FilterFormData): void;
  resetFields(): void;
}

const SearchFilter = React.forwardRef<CustomsSearchFilterRef, CustomsSearchFilterProps>(
  (
    { onSearch, query, queryType, searchType, initValue, searchParams, originReCountry, resetExcludeViewedObj, originInitValue, setDataRecord, layout, ...divProps },
    ref
  ) => {
    const [form] = useForm<FilterFormData>();
    const enableLang = queryType === 'goodsShipped';
    const langOptions = useLangOption(query, enableLang);
    const [expand, setExpand] = useState<boolean>(false);
    const [continentList] = useCustomsCountryHook();
    const [onlyContainsCn, setOnlyContainsCn] = useState<boolean>(false);

    useEffect(() => {
      // 重置时置为false 以免影响级联组件
      setOnlyContainsCn(false);
    }, [searchType, queryType, layout?.length]);

    const getValues = () => {
      const { uncontainsExpress, ...values } = form.getFieldsValue();
      // 格式化relationCountryList
      if (values.relationCountryList) {
        let allList: string[] = [];
        values.relationCountryList.forEach(val => {
          const [con, cou] = val || [];
          if (con && con !== CN_VALUE) {
            if (cou) {
              allList.push(cou);
            } else {
              const allCou = continentList.find(el => el.continent == con)?.countries.map(e => e.name);
              if (allCou) {
                allList = allList.concat(allCou);
              }
            }
          }
        });
        values.relationCountryList = Array.from(new Set(allList));
      }
      return {
        ...values,
      };
    };
    const handleSearch = () => {
      onSearch?.(getValues());
      resetExcludeViewedObj();
    };
    useImperativeHandle(
      ref,
      () => {
        return {
          getFormValues: getValues,
          setFormValues: vals => {
            if (vals) {
              form.setFieldsValue(vals);
            } else {
              form.setFieldsValue(originInitValue);
            }
          },
          resetFields: () => {
            form.setFieldsValue(originInitValue);
          },
        };
      },
      [getValues, form, originInitValue]
    );
    return (
      <div {...divProps} className={classNames(divProps.className, style.container)}>
        {/* <div className={style.titleWrap}>
          {"查询条件"}
        </div> */}
        <Form className={style.form} layout="inline" colon={false} form={form} initialValues={initValue}>
          <Form.Item name="countryList" className={style.countrySelect} label={getIn18Text('GUOJIADEQU')}>
            <CountryCompactSelect
              onChange={() => {
                handleSearch();
              }}
              searchType={searchType}
            />
          </Form.Item>
          <Form.Item name="relationCountryList" label={searchType === 'suppliers' ? getIn18Text('GONGYINGMUDE') : getIn18Text('CAIGOULAIYUAN')}>
            {/* 这里组件要定制一下 包含中国的时候关联 onlyContainsChina  其他情况 传具体国家 用级联选择组件*/}
            <Cascader
              style={{ width: '100%', borderRadius: '2px' }}
              placeholder={getIn18Text('QINGXUANZE') + (searchType === 'suppliers' ? getIn18Text('GONGYINGMUDE') : getIn18Text('CAIGOULAIYUAN'))}
              multiple
              maxTagCount="responsive"
              className={style.origin}
              onChange={values => {
                originReCountry && originReCountry(values as Array<string[]>);
                const flatValues = values.flatMap(e => e);
                const onlyContainsChina = flatValues.includes(CN_VALUE);
                form.setFieldsValue({
                  onlyContainsChina: onlyContainsChina,
                });
                if (onlyContainsChina) {
                  form.setFieldsValue({
                    relationCountryList: [[CN_VALUE]] as any,
                  });
                }
                setOnlyContainsCn(onlyContainsChina);
                handleSearch();
                customsDataTracker.trackSelectClick(searchType === 'suppliers' ? CustomsDataSelectClick.supplierNation : CustomsDataSelectClick.buyerNation);
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
                  disabled: onlyContainsCn,
                  children: e.countries.map(d => ({
                    label: d.nameCn,
                    value: d.name,
                    disabled: onlyContainsCn,
                  })),
                }))
              )}
            />
          </Form.Item>

          <Form.Item name="onlyContainsChina" hidden valuePropName="checked">
            <Checkbox />
          </Form.Item>
          <Form.Item hidden={expand} name="timeFilter" label={getIn18Text('SHIJIANFANWEI')}>
            <EnhanceSelect
              suffixIcon={<ArrowDownFullfill />}
              // style={{}}
              onChange={() => {
                handleSearch();
                customsDataTracker.trackSelectClick(CustomsDataSelectClick.time);
              }}
              placeholder={getIn18Text('QINGXUANZESHIJIANFANWEI')}
            >
              {timeRangeOptions.map(item => (
                <InSingleOption key={item.value} value={item.value}>
                  {item.label}
                </InSingleOption>
              ))}
            </EnhanceSelect>
          </Form.Item>
          <Form.Item hidden={expand} label="HSCode" className={style.formItem}>
            {/* <Input placeholder="请输入HSCode" /> */}
            <Input.Group compact className={style.inputGruop} style={{ display: 'flex' }}>
              <Form.Item noStyle name="advanceHsCodeSearchType">
                <EnhanceSelect
                  suffixIcon={<ArrowDownFullfill />}
                  onChange={getFieldValue => {
                    // form.getFieldValue
                    form.getFieldValue('advanceHsCode') ? handleSearch() : '';
                  }}
                  onKeyDown={event => {
                    if (!!form.getFieldValue('advanceHsCode') && event.keyCode === 13) {
                      handleSearch();
                    }
                  }}
                >
                  <InSingleOption value={0}>{getIn18Text('BAOHAN')}</InSingleOption>
                  <InSingleOption value={1}>{getIn18Text('BUBAOHAN')}</InSingleOption>
                </EnhanceSelect>
              </Form.Item>
              <Form.Item noStyle name="advanceHsCode">
                <Input
                  id="customs_doc_search_filter_port_input"
                  placeholder={`${getIn18Text('QINGSHURUHSCODE')}，${getIn18Text('ENTEROK')}`}
                  allowClear
                  onPressEnter={handleSearch}
                  onBlur={() => {
                    if (form.getFieldValue('advanceHsCode') !== searchParams?.advanceHsCode) {
                      handleSearch();
                    }
                  }}
                />
              </Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item hidden={expand} label={getIn18Text('CHANPINMIAOSHU')}>
            {/* <Input placeholder="请输入产品描述" /> */}
            <Input.Group compact className={style.inputGruop} style={{ display: 'flex' }}>
              <Form.Item noStyle name="advanceGoodsShippedSearchType">
                <EnhanceSelect
                  suffixIcon={<ArrowDownFullfill />}
                  onChange={() => {
                    form.getFieldValue('advanceGoodsShipped') ? handleSearch() : '';
                  }}
                  onKeyDown={event => {
                    if (!!form.getFieldValue('advanceGoodsShipped') && event.keyCode === 13) {
                      handleSearch();
                    }
                  }}
                >
                  <InSingleOption value={0}>{getIn18Text('BAOHAN')}</InSingleOption>
                  <InSingleOption value={1}>{getIn18Text('BUBAOHAN')}</InSingleOption>
                </EnhanceSelect>
              </Form.Item>
              <Form.Item noStyle name="advanceGoodsShipped">
                <Input
                  placeholder={`${getIn18Text('QINGSHURUCHANPINMIAOSHU')}，${getIn18Text('ENTEROK')}`}
                  allowClear
                  onPressEnter={handleSearch}
                  onBlur={() => {
                    if (form.getFieldValue('advanceGoodsShipped') !== searchParams?.advanceGoodsShipped) {
                      handleSearch();
                    }
                  }}
                />
              </Form.Item>
            </Input.Group>
          </Form.Item>
          {enableLang && (
            <Form.Item
              hidden={expand}
              name="otherGoodsShipped"
              label={
                <>
                  <span style={{ paddingRight: 4 }}>{getIn18Text('YUZHONG')}</span>
                  <Tooltip placement="topLeft" title={'系统会按输入的关键词的原文进行搜索，可选择翻译成其他语种继续搜索'}>
                    <Help />
                  </Tooltip>
                </>
              }
            >
              <EnhanceSelect
                mode="multiple"
                style={{ borderRadius: '2px' }}
                className={style.origin}
                optionLabelProp="label"
                maxTagCount="responsive"
                onChange={vl => {
                  handleSearch();
                  customsDataTracker.trackSelectClick(CustomsDataSelectClick.language, vl);
                }}
              >
                {/* InSingleOption */}
                {langOptions.map(lo => (
                  <InMultiOption key={lo.value} label={lo.label} value={lo.value}>
                    {lo.labelDisplay}
                  </InMultiOption>
                ))}
              </EnhanceSelect>
            </Form.Item>
          )}
          <div hidden={expand} className={classNames(style.filterBot)}>
            <Form.Item hidden={expand} valuePropName="checked" name="excludeViewed" initialValue={initValue?.excludeViewed}>
              <SiriusCheckbox
                onChange={checked => {
                  handleSearch();
                }}
              >
                {getIn18Text('WEILIULAN')}
              </SiriusCheckbox>
            </Form.Item>
            <Form.Item hidden={expand} valuePropName="checked" name="uncontainsExpress" initialValue={!initValue?.containsExpress}>
              <SiriusCheckbox
                onChange={checked => {
                  const value = checked.target.checked;
                  customsDataTracker.trackSelectClick(CustomsDataSelectClick.logistics, value);
                  form.setFieldsValue({
                    containsExpress: !value,
                  });
                  handleSearch();
                }}
              >
                <>
                  <span className={classNames(style.filterBotSpan)} style={{ paddingRight: 4, display: 'flex' }}>
                    {getIn18Text('PAICHUWULIUGONGSI')}
                    <span className={classNames(style.filterBotSpanIcon)} style={{ display: 'flex', alignItems: 'center', marginLeft: '6px' }}>
                      <Tooltip placement="topLeft" title={containsExpressTipContent}>
                        <Help />
                      </Tooltip>
                    </span>
                  </span>
                </>
              </SiriusCheckbox>
            </Form.Item>
            <Form.Item hidden={expand} valuePropName="checked" name="hasEmail" initialValue={initValue?.hasEmail}>
              <SiriusCheckbox
                onChange={checked => {
                  handleSearch();
                }}
              >
                {getIn18Text('YOUYOUXIANG')}
              </SiriusCheckbox>
            </Form.Item>

            <Form.Item hidden={expand} name="updateTime" initialValue={initValue?.updateTime}>
              <div hidden={!form.getFieldValue('updateTime')} className={classNames(style.formUpdate)}>
                {form.getFieldValue('updateTime')}更新
                <div
                  className={style.formCloseIcon}
                  onClick={() => {
                    form.setFieldsValue({
                      updateTime: '',
                    });
                    setDataRecord && setDataRecord();
                    handleSearch();
                  }}
                >
                  <CloseIcon />
                </div>
              </div>
            </Form.Item>

            <Form.Item valuePropName="checked" name="containsExpress" noStyle hidden>
              <Switch />
            </Form.Item>
          </div>

          <div
            className={classNames(style.formOp, {
              [style.stowSpan]: expand,
            })}
          >
            <Button
              btnType="minorLine"
              type="button"
              onClick={() => {
                resetExcludeViewedObj();
                form.setFieldsValue({
                  ...originInitValue,
                  uncontainsExpress: !originInitValue.containsExpress,
                });
                // 重置时置为false 以免影响级联组件
                setOnlyContainsCn(false);
                // 重置时 重置原始原始属性
                originReCountry && originReCountry([]);
                setDataRecord && setDataRecord();
                onSearch?.({ ...initValue });
              }}
            >
              <span>{getIn18Text('ZHONGZHI')}</span>
            </Button>
            <Button
              btnType="default"
              type="button"
              onClick={() => {
                handleSearch();
              }}
            >
              <span>{getIn18Text('CHAXUN')}</span>
            </Button>
            <span onClick={() => setExpand(!expand)} className={style.formHidden}>
              {expand ? (
                <span className={style.iconStatus}>
                  {getIn18Text('ZHANKAI')} <DownlinedIcon style={{ marginLeft: '4px' }} />
                </span>
              ) : (
                <span className={style.iconStatus}>
                  {getIn18Text('SHOUQI')} <UplinedIcon style={{ marginLeft: '4px' }} />
                </span>
              )}
            </span>
          </div>
        </Form>
      </div>
    );
  }
);

export default SearchFilter;
