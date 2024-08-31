import { Button, DatePicker, Form, Input, Select } from 'antd';
import { CustomsRecordReq, CustomsContinent } from 'api';
import { Moment } from 'moment';
import React, { useEffect, useState, useImperativeHandle, useRef } from 'react';
import lodashOmit from 'lodash/omit';
import styles from './filter.module.scss';
import moment from 'moment';
import classNames from 'classnames';
import { getDefaultReq } from '../../index';
import { ReactComponent as UplinedIcon } from '@/images/icons/customerDetail/uplined.svg';
import { ReactComponent as DownlinedIcon } from '@/images/icons/customerDetail/downlined.svg';
import { CustomsSearchType } from '../SearchInput';
import PortDropList from '../PortDropList/PortDropList';
import useLangOption from '../../../search/useLangOption';
import { ArrowDownFullfill } from '../../../search/searchFilter';
// import Cascader from '@web-common/components/UI/Cascader';
import Cascader from '@lingxi-common-component/sirius-ui/Cascader';
// import { EnhanceSelect, InSingleOption, InMultiOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
import { getIn18Text } from 'api';
import SuggestDropDown from '@/components/Layout/globalSearch/search/SuggestDropDown';

type CustomsRecordForm = Partial<Omit<CustomsRecordReq, 'page' | 'size' | 'begin' | 'end'> & { time: [Moment, Moment] }>;

const getInitValue = () => {
  const defaultReq = getDefaultReq();
  const initValue: CustomsRecordForm = {
    countryList: defaultReq.countryList,
    companyType: defaultReq.companyType,
    recordType: defaultReq.recordType,
    time: [moment(defaultReq.begin), moment(defaultReq.end)],
    portType: 0,
    ...defaultReq,
  };
  return initValue;
};

interface FilterProps {
  defaultFormValue?: CustomsRecordReq;
  onFinish?(values: Partial<CustomsRecordReq>): void;
  onReset?(): void;
  searchType: CustomsSearchType;
  query?: string;
  originCountry?: (value: string[][], type?: 'con' | 'shp') => void;
  continentList?: CustomsContinent[];
}

export interface FilterFormRef {
  getFieldValues(): Partial<Omit<CustomsRecordReq, 'page' | 'size'>>;
  resetFieldValues(): void;
}

const FilterForm = React.forwardRef<FilterFormRef, FilterProps>(({ defaultFormValue, onFinish, onReset, searchType, query, originCountry, continentList }, ref) => {
  const [form] = Form.useForm<CustomsRecordForm>();
  const [, forceUpdate] = useState<object>({});
  const [portOpen, setPortOpen] = useState<boolean>(false);
  const [expand, setExpand] = useState<boolean>(false);
  const portInputRef = useRef<Input>(null);
  const handleFinish = () => {
    onFinish?.(valueFormat(form.getFieldsValue()));
  };
  const [start, end]: [Moment | undefined, Moment | undefined] = form.getFieldValue('time') || [];
  const [suggestOpen, setSuggestOpen] = useState<boolean>(false);
  const renderOpenInput = () => {
    return (
      <>
        {expand ? (
          <span className={styles.iconStatus}>
            {getIn18Text('ZHANKAI')} <DownlinedIcon style={{ marginLeft: '4px' }} />
          </span>
        ) : (
          <span className={styles.iconStatus}>
            {getIn18Text('SHOUQI')} <UplinedIcon style={{ marginLeft: '4px' }} />
          </span>
        )}
      </>
    );
  };

  function valueFormat(values: CustomsRecordForm) {
    let formatValues: Partial<CustomsRecordReq> = lodashOmit(values, 'time');
    const [start, end] = values.time || [];
    if (start && end) {
      if (start.isAfter(end)) {
        formatValues.begin = end.format('YYYY-MM-DD');
        formatValues.end = start.format('YYYY-MM-DD');
      } else {
        formatValues.begin = start.format('YYYY-MM-DD');
        formatValues.end = end.format('YYYY-MM-DD');
      }
    } else {
      formatValues.begin = '';
      formatValues.end = '';
    }
    if (formatValues.conCountryList && formatValues.conCountryList.length > 0) {
      formatValues.conCountryList = transfromCountry(formatValues.conCountryList);
    }
    if (formatValues.shpCountryList && formatValues.shpCountryList.length > 0) {
      formatValues.shpCountryList = transfromCountry(formatValues.shpCountryList);
    }
    return formatValues;
  }

  const transfromCountry = (data: any) => {
    let allList: string[] = [];
    data.forEach((val: any) => {
      const [con, cou] = val || [];
      if (cou) {
        allList.push(cou);
      } else {
        const allCou = continentList && continentList.find(el => el.continent == con)?.countries.map(e => e.name);
        if (allCou) {
          allList = allList.concat(allCou);
        }
      }
    });
    data = Array.from(new Set(allList));
    return data;
  };

  useEffect(() => {
    if (defaultFormValue) {
      const setFromValues: CustomsRecordForm = {};
      if (defaultFormValue.begin && defaultFormValue.end) {
        setFromValues.time = [moment(defaultFormValue.begin), moment(defaultFormValue.end)];
      }
      form.setFieldsValue({
        ...lodashOmit(defaultFormValue, 'begin', 'end'),
        ...setFromValues,
      });
      forceUpdate({});
    }
  }, [defaultFormValue]);

  useImperativeHandle(
    ref,
    () => ({
      getFieldValues() {
        return valueFormat(form.getFieldsValue());
      },
      resetFieldValues() {
        form.resetFields();
        form.setFieldsValue(getInitValue());
      },
    }),
    [form]
  );

  const enableLang = searchType === 'goodsShipped';
  const langOptions = useLangOption(query, enableLang);

  return (
    <div className={styles.filterWarpper}>
      {/* <p className={styles.title} >查询条件</p> */}
      <div className={styles.formWrapper}>
        <Form
          className={classNames(styles.form, {
            [styles.stowForm]: expand,
          })}
          form={form}
          layout="inline"
          initialValues={getInitValue()}
          colon={false}
        >
          <Form.Item hidden={searchType === 'goodsShipped'} name="goodsShipped" label={getIn18Text('CHANPIN')} className={styles.formItem}>
            <Input
              placeholder={`${getIn18Text('QINGSHURUCHANPINMINGCHENGHUOCHANPINMIAOSHU')}，${getIn18Text('ENTEROK')}`}
              onKeyDown={e => {
                if (e.keyCode === 13) {
                  handleFinish();
                }
              }}
              allowClear
            />
          </Form.Item>
          <Form.Item hidden={searchType === 'hsCode'} name="hsCode" label="HSCode" className={styles.formItem}>
            <Input
              placeholder={`${getIn18Text('QINGSHURUHSCODE')}，${getIn18Text('ENTEROK')}`}
              allowClear
              onKeyDown={e => {
                if (e.keyCode === 13) {
                  handleFinish();
                }
              }}
            />
          </Form.Item>
          <Form.Item
            hidden={searchType !== 'goodsShipped' && searchType !== 'hsCode' && expand}
            name="conCompany"
            label={getIn18Text('CAIGOUSHANG')}
            className={styles.formItem}
          >
            <Input
              placeholder={`${getIn18Text('QINGSHURUCAIGOUSHANGMINGCHENG')}，${getIn18Text('ENTEROK')}`}
              allowClear
              onKeyDown={e => {
                if (e.keyCode === 13) {
                  handleFinish();
                }
              }}
            />
          </Form.Item>
          <Form.Item hidden={expand} name="shpCompany" label={getIn18Text('GONGYINGSHANG')} className={styles.formItem}>
            <Input
              placeholder={`${getIn18Text('QINGSHURUGONGYINGSHANGMINGCHENG')}，${getIn18Text('ENTEROK')}`}
              allowClear
              onKeyDown={e => {
                if (e.keyCode === 13) {
                  handleFinish();
                }
              }}
            />
          </Form.Item>
          <Form.Item hidden={expand} name="conCountryList" label={getIn18Text('JINKOUDIQU')} className={styles.formItem}>
            <Cascader
              style={{ width: '100%' }}
              placeholder={getIn18Text('QINGXUANZEGUOJIADEQU')}
              multiple
              maxTagCount="responsive"
              className={styles.origin}
              onChange={values => {
                originCountry && originCountry(values as string[][], 'con');
                // const flatValues = values.flatMap(e => e);
                // const onlyContainsChina = flatValues.includes(CN_VALUE);
                // form.setFieldsValue({
                //   onlyContainsChina: onlyContainsChina,
                // });
                // if (onlyContainsChina) {
                //   form.setFieldsValue({
                //     relationCountryList: [[CN_VALUE]] as any
                //   });
                // }
                // setOnlyContainsCn(onlyContainsChina)
                // customsDataTracker.trackSelectClick(searchType === 'suppliers' ? CustomsDataSelectClick.supplierNation : CustomsDataSelectClick.buyerNation);
              }}
              onBlur={() => {
                // handleSearch()
              }}
              options={
                continentList &&
                continentList.map(e => ({
                  label: e.continentCn,
                  value: e.continent,
                  // disabled: onlyContainsCn,
                  children: e.countries.map(d => ({
                    label: d.nameCn,
                    value: d.name,
                    // disabled: onlyContainsCn
                  })),
                }))
              }
            />
            {/* <Select
              placeholder={getIn18Text('QINGXUANZEGUOJIADEQU')}
              options={countryList.map(con => ({
                label: con.nameCn,
                value: con.name
              }))}
              filterOption={(v, opt) => {
                const inputValue = v.toLocaleLowerCase();
                const { label, value } = opt || {};
                const valueStr = String(value).toLocaleLowerCase();
                let rs = false;
                if (typeof label === 'string' || typeof label === 'number') {
                  const labelStr = String(label).toLocaleLowerCase();
                  rs = rs || labelStr.indexOf(inputValue) > -1
                }
                rs = rs || valueStr.indexOf(inputValue) > -1
                return rs
              }}
              mode="multiple"
              allowClear
              maxTagCount="responsive"
            /> */}
          </Form.Item>
          <Form.Item hidden={expand} name="shpCountryList" label={getIn18Text('CHUKOUDIQU')} className={styles.formItem}>
            <Cascader
              style={{ width: '100%' }}
              placeholder={getIn18Text('QINGXUANZEGUOJIADEQU')}
              className={styles.origin}
              multiple
              maxTagCount="responsive"
              onChange={values => {
                originCountry && originCountry(values as string[][], 'shp');
                // const flatValues = values.flatMap(e => e);
                // const onlyContainsChina = flatValues.includes(CN_VALUE);
                // form.setFieldsValue({
                //   onlyContainsChina: onlyContainsChina,
                // });
                // if (onlyContainsChina) {
                //   form.setFieldsValue({
                //     relationCountryList: [[CN_VALUE]] as any
                //   });
                // }
                // setOnlyContainsCn(onlyContainsChina)
                // customsDataTracker.trackSelectClick(searchType === 'suppliers' ? CustomsDataSelectClick.supplierNation : CustomsDataSelectClick.buyerNation);
              }}
              onBlur={() => {
                // handleSearch()
              }}
              options={
                continentList &&
                continentList.map(e => ({
                  label: e.continentCn,
                  value: e.continent,
                  // disabled: onlyContainsCn,
                  children: e.countries.map(d => ({
                    label: d.nameCn,
                    value: d.name,
                    // disabled: onlyContainsCn
                  })),
                }))
              }
            />
            {/* <Select
              placeholder={getIn18Text('QINGXUANZEGUOJIADEQU')}
              options={countryList.map(con => ({
                label: con.nameCn,
                value: con.name
              }))}
              filterOption={(v, opt) => {
                const inputValue = v.toLocaleLowerCase();
                const { label, value } = opt || {};
                const valueStr = String(value).toLocaleLowerCase();
                let rs = false;
                if (typeof label === 'string' || typeof label === 'number') {
                  const labelStr = String(label).toLocaleLowerCase();
                  rs = rs || labelStr.indexOf(inputValue) > -1
                }
                rs = rs || valueStr.indexOf(inputValue) > -1
                return rs
              }}
              mode="multiple"
              allowClear
              maxTagCount="responsive"
            /> */}
          </Form.Item>
          <Form.Item hidden={expand} name="recordType" label={getIn18Text('SHUJULEIXING')} className={styles.formItem}>
            <Select suffixIcon={<ArrowDownFullfill />}>
              <Select.Option value="Import">{getIn18Text('JINKOU')}</Select.Option>
              <Select.Option value="Export">{getIn18Text('CHUKOU')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item hidden={expand} name="time" className={styles.formItem} label={getIn18Text('SHIJIANFANWEI')}>
            <DatePicker.RangePicker
              suffixIcon={null}
              disabledDate={date => {
                return date?.isAfter(moment().endOf('day'));
              }}
              onChange={() => forceUpdate({})}
              style={{ width: '100%' }}
              renderExtraFooter={() => {
                let rangeMonth = end?.diff(start, 'month');
                const dates = [
                  {
                    label: getIn18Text('JINBANNIAN'),
                    monthCount: -6,
                  },
                  {
                    label: getIn18Text('JINYINIAN'),
                    monthCount: -12,
                  },
                  {
                    label: getIn18Text('JINLIANGNIAN'),
                    monthCount: -24,
                  },
                  {
                    label: getIn18Text('JINSANNIAN'),
                    monthCount: -36,
                  },
                  {
                    label: getIn18Text('JINWUNIAN'),
                    monthCount: -60,
                  },
                ];
                return (
                  <div className={styles.dateSelectFoot}>
                    {dates.map(date => (
                      <div
                        key={date.label}
                        className={classNames(styles.dateSelectItem, {
                          [styles.dateSelectItemSelected]: rangeMonth !== undefined && Math.abs(date.monthCount) === Math.abs(rangeMonth),
                        })}
                        onClick={() => {
                          form.setFieldsValue({
                            time: [moment(), moment().add(date.monthCount, 'month')],
                          });
                          forceUpdate({});
                        }}
                      >
                        {date.label}
                      </div>
                    ))}
                  </div>
                );
              }}
            />
          </Form.Item>
          {searchType === 'port' ? (
            <Form.Item className={styles.formItem} label={getIn18Text('GANGKOU')} name="portType" hidden={expand}>
              <Select suffixIcon={<ArrowDownFullfill />}>
                <Select.Option value={0}>{getIn18Text('CHUFAGANG')}</Select.Option>
                <Select.Option value={1}>{getIn18Text('MUDIGANG')}</Select.Option>
              </Select>
            </Form.Item>
          ) : (
            <Form.Item label={getIn18Text('GANGKOU')} className={styles.formItem} hidden={expand}>
              <Input.Group compact className={styles.inputGruop} style={{ display: 'flex' }}>
                <Form.Item noStyle name="portType">
                  <Select suffixIcon={<ArrowDownFullfill />}>
                    <Select.Option value={0}>{getIn18Text('TIHUOGANG')}</Select.Option>
                    <Select.Option value={1}>{getIn18Text('MUDIGANG')}</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item noStyle name="port">
                  <Input
                    ref={portInputRef}
                    onFocus={e => {
                      if (!e.target.value) {
                        setPortOpen(true);
                      }
                    }}
                    onChange={e => {
                      setPortOpen(!e.target.value);
                      setSuggestOpen(!!e.target.value);
                    }}
                    id="customs_doc_search_filter_port_input"
                    placeholder={getIn18Text('QINGSHURUGANGKOUMINGCHENG')}
                    allowClear
                  />
                </Form.Item>
              </Input.Group>
            </Form.Item>
          )}
          <Form.Item noStyle dependencies={['port']}>
            {({ getFieldValue }) => {
              const portValue = getFieldValue('port');
              return (
                <SuggestDropDown
                  hideCount
                  title={null}
                  blurTarget={portInputRef.current?.input.parentElement}
                  target={portInputRef.current?.input.parentElement}
                  type="customs"
                  sugguestType={4}
                  keyword={portValue}
                  open={suggestOpen}
                  changeOpen={setSuggestOpen}
                  layout="form-bottom-end"
                  onSelect={async kwd => {
                    form.setFieldsValue({
                      port: kwd,
                    });
                    setSuggestOpen(false);
                    handleFinish();
                  }}
                />
              );
            }}
          </Form.Item>
          {enableLang && (
            <Form.Item hidden={expand} name="otherGoodsShipped" label={getIn18Text('YUZHONG')} className={styles.formItem}>
              {/* <Select
                optionLabelProp="label"
                mode="multiple"
                maxTagCount="responsive"
              >
                {langOptions.map(lo => (
                  <Select.Option key={lo.value} label={lo.label} value={lo.value} >{lo.labelDisplay}</Select.Option>
                ))}
              </Select> */}
              <EnhanceSelect mode="multiple" style={{ borderRadius: '2px' }} optionLabelProp="label" className={styles.origin} maxTagCount="responsive">
                {langOptions.map(lo => (
                  <InMultiOption key={lo.value} label={lo.label} value={lo.value}>
                    {lo.labelDisplay}
                  </InMultiOption>
                ))}
              </EnhanceSelect>
            </Form.Item>
          )}
        </Form>
        <div
          className={classNames(styles.formOp, {
            [styles.stowSpan]: expand,
          })}
        >
          <button
            className={classNames(styles.btn, styles.btnDefault)}
            onClick={() => {
              originCountry && originCountry([]);
              onReset?.();
            }}
          >
            <span>{getIn18Text('ZHONGZHI')}</span>
          </button>
          <button
            className={classNames(styles.btn, styles.btnPrimary)}
            onClick={() => {
              handleFinish();
            }}
          >
            <span>{getIn18Text('CHAXUN')}</span>
          </button>
          <span onClick={() => setExpand(!expand)} className={styles.formHidden}>
            {renderOpenInput()}
          </span>
        </div>
        <PortDropList
          open={portOpen}
          changeOpen={setPortOpen}
          onSelectPort={(portName, portType) => {
            form.setFieldsValue({
              port: portName,
            });
            setPortOpen(false);
            handleFinish();
          }}
          value={form.getFieldValue('port')}
          target={portInputRef.current?.input.parentElement}
        />
      </div>
    </div>
  );
});

export default FilterForm;
