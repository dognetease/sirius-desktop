import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import classnames from 'classnames';
import { AutoComplete, Form, Input, Checkbox } from 'antd';
// import { EnhanceSelect as Select, InSingleOption as Option } from '@web-common/components/UI/Select';
import { EnhanceSelect as Select, InSingleOption as Option } from '@lingxi-common-component/sirius-ui/Select';
import { ReactComponent as CloseIcon } from '@/images/icons/edm/addressBook/close.svg';
import { AddressBookContactsParams, AddressBookFilterType, apiHolder, apis, CustomerApi } from 'api';
import AdvancedFilter, { AdvancedFilterMethods } from './advancedFilter';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import style from './contactsFilter.module.scss';

import { edmDataTracker } from '../../../tracker/tracker';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';
interface ContactsFilterProps {
  extraContent?: React.ReactNode;
  onChange: (type: AddressBookFilterType, params: Omit<AddressBookContactsParams, 'contactAddressType' | 'page' | 'pageSize' | 'sort'>) => void;
  enableFilterAbnormalEmailBox?: boolean;
  dataTrackerKey: {
    filter: string;
    advancedFilter: string;
  };
}
interface CascaderType {
  label: string;
  value: string;
  children: CascaderType[];
}
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

const QuestionIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 14.5C9.79493 14.5 11.4199 13.7725 12.5962 12.5962C13.7725 11.4199 14.5 9.79493 14.5 8C14.5 6.20507 13.7725 4.58007 12.5962 3.40381C11.4199 2.22754 9.79493 1.5 8 1.5C6.20507 1.5 4.58007 2.22754 3.40381 3.40381C2.22754 4.58007 1.5 6.20507 1.5 8C1.5 9.79493 2.22754 11.4199 3.40381 12.5962C4.58007 13.7725 6.20507 14.5 8 14.5Z"
        stroke="#3F465C"
        stroke-linejoin="round"
      />
      <path
        d="M8.00019 9.40628V9.08115C8.00019 8.63932 8.37776 8.29739 8.77071 8.0954C9.31533 7.81544 9.68789 7.24795 9.68789 6.59346C9.68789 5.66137 8.93228 4.90576 8.00019 4.90576C7.06811 4.90576 6.3125 5.66137 6.3125 6.59346"
        stroke="#3F465C"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M8.00005 11.9977C8.38625 11.9977 8.69932 11.6846 8.69932 11.2984C8.69932 10.9122 8.38625 10.5991 8.00005 10.5991C7.61386 10.5991 7.30078 10.9122 7.30078 11.2984C7.30078 11.6846 7.61386 11.9977 8.00005 11.9977Z"
        fill="#3F465C"
      />
    </svg>
  );
};

// 后端接口定义转化规则，详情咨询后端相关人员
const mapEmailStatusParam = (keys: string[]) => {
  return keys
    .map(el => {
      if (el === 'normal') {
        return [1];
      } else if (el === 'abnormal') {
        return [0, 3];
      } else if (el === 'unknown') {
        return [2, -1];
      }
      return [];
    })
    .filter(list => list.length)
    .flat();
};

const convertOrdinaryParams = (
  values: any,
  config?: {
    enableFilterAbnormalEmailBox: boolean;
  }
) => {
  const result: Record<string, unknown> = {};
  const searchItems = [];
  if (config?.enableFilterAbnormalEmailBox) {
    result.onlyNormalAddress = values.onlyNormalAddress;
    delete values.onlyNormalAddress;
  }
  switch (values.field) {
    case 'contactAddressInfo':
    case 'contactName':
    case 'companyName':
    case 'jobTitle':
      values.searchKeys.length &&
        searchItems.push({
          ...values,
          module: 'address',
        });
      break;
    case 'emailStatus':
      if (values.searchKeys.length) {
        searchItems.push({
          ...values,
          field: 'verifyStatus',
          module: 'address',
          rule: values.rule === 'LIKE' ? 'IN' : 'NOT_IN',
          searchKeys: mapEmailStatusParam(values.searchKeys),
        });
      }
      break;
    case 'location':
      const { rule, continent, country } = values;
      if (continent) {
        searchItems.push({
          field: 'continent',
          rule,
          searchKeys: [continent],
          module: 'address',
        });
      }
      if (country) {
        searchItems.push({
          field: 'country',
          rule,
          searchKeys: [country],
          module: 'address',
        });
      }
      break;
  }
  result.searchParam = !searchItems.length
    ? undefined
    : {
        relation: 'AND',
        searchItems,
      };
  return result;
};
const convertAdvancedParams = (values: any) => {
  const relation = values.relation;
  const searchItems: any = [];
  if (Array.isArray(values.address)) {
    values.address.forEach((item: any) => {
      switch (item.field) {
        case 'contactAddressInfo':
        case 'contactName':
        case 'companyName':
        case 'jobTitle':
          searchItems.push({
            ...item,
            module: 'address',
          });
          break;
        case 'emailStatus':
          if (item.searchKeys.length) {
            searchItems.push({
              ...item,
              field: 'verifyStatus',
              module: 'address',
              rule: item.rule === 'LIKE' ? 'IN' : 'NOT_IN',
              searchKeys: mapEmailStatusParam(item.searchKeys),
            });
          }
          break;
        case 'location':
          const { rule, continent, country } = item;
          if (continent) {
            searchItems.push({
              field: 'continent',
              rule,
              searchKeys: [continent],
              module: 'address',
            });
          }
          if (country) {
            searchItems.push({
              field: 'country',
              rule,
              searchKeys: [country],
              module: 'address',
            });
          }
          break;
      }
    });
  }
  if (Array.isArray(values.edm)) {
    values.edm.forEach((item: any) => {
      searchItems.push({
        ...item,
        module: 'edm',
      });
    });
  }
  return {
    searchParam: {
      relation,
      searchItems,
    },
  };
};
const ContactsFilter = forwardRef((props: ContactsFilterProps, ref) => {
  const { onChange, dataTrackerKey, enableFilterAbnormalEmailBox = false } = props;
  const { filter, advancedFilter } = dataTrackerKey;
  const [filterType, setFilterType] = useState<AddressBookFilterType>('ordinary');
  const [form] = Form.useForm();
  const advancedFilterRef = useRef<AdvancedFilterMethods>();
  const [advancedVisible, setAdvancedVisible] = useState(false);
  const [advancedFilterCount, setAdvancedFilterCount] = useState(0);
  const [continents, setContinents] = useState<CascaderType[]>([]);
  const handleContinentsFetch = () => {
    customerApi.getGlobalArea().then(res => {
      setContinents(res.area.reduce<CascaderType[]>((accumulator, areaItem) => [...accumulator, areaItem], []));
    });
  };
  const handleSearchKeysReset = () => {
    form.setFieldsValue({
      searchKeys: [],
      continent: undefined,
      country: undefined,
    });
  };

  const sendDataTracker = (values: any) => {
    values = values || {};
    const { address = [], edm = [] } = values;
    let action = '';
    if (address.length && edm.length) {
      action = 'contact_behavior,mail_behavior';
    } else if (address.length) {
      action = 'contact_behavior';
    } else if (edm.length) {
      action = 'mail_behavior';
    }
    if (action.length) {
      edmDataTracker.track(advancedFilter, { action });
    }
  };

  useEffect(() => {
    handleContinentsFetch();
  }, []);
  useImperativeHandle(ref, () => ({
    reset: () => {
      form.resetFields();
      setTimeout(form.submit);
      setFilterType('ordinary');
      setAdvancedVisible(false);
      setAdvancedFilterCount(0);
      advancedFilterRef.current?.reset();
    },
    searchByCompanyName: (companyName: string) => {
      form.setFieldsValue({
        field: 'companyName',
        rule: 'LIKE',
        searchKeys: [companyName],
      });
      setTimeout(form.submit);
      setFilterType('ordinary');
      setAdvancedVisible(false);
      setAdvancedFilterCount(0);
      advancedFilterRef.current?.reset();
    },
    searchByJobTitle: (jobTitle: string) => {
      form.setFieldsValue({
        field: 'jobTitle',
        rule: 'LIKE',
        searchKeys: [jobTitle],
      });
      setTimeout(form.submit);
      setFilterType('ordinary');
      setAdvancedVisible(false);
      setAdvancedFilterCount(0);
      advancedFilterRef.current?.reset();
    },
  }));
  const getContactFormItems = (field: string) => {
    switch (field) {
      case 'contactAddressInfo':
      case 'contactName':
      case 'companyName':
      case 'jobTitle':
        return (
          <Form.Item name="searchKeys" initialValue={[]} getValueFromEvent={value => value.slice(0, 5)} noStyle>
            <Select
              style={{ width: 250 }}
              mode="tags"
              maxTagCount="responsive"
              open={false}
              allowClear
              placeholder={getIn18Text('KESHURUDUOGEGUANJIANCI\uFF0CANHUICHEQUEREN')}
              showArrow={false}
            />
          </Form.Item>
        );
      case 'location':
        return (
          <>
            <Form.Item name="continent" noStyle>
              <Select
                style={{ width: 125 }}
                allowClear
                placeholder={getIn18Text('QINGXUANZEZHOU')}
                onChange={() => {
                  form.setFields([
                    {
                      name: 'country',
                      value: '',
                      errors: [],
                    },
                  ]);
                }}
              >
                {continents.map(continent => (
                  <Option value={continent.value}>{continent.label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item shouldUpdate noStyle>
              {() => {
                const continent = form.getFieldValue('continent');
                const countries = continents.find(item => item.value === continent)?.children || [];
                return (
                  <Form.Item name="country" noStyle>
                    <AutoComplete
                      style={{ width: 125 }}
                      allowClear
                      placeholder={getIn18Text('QINGXUANZEGUOJIA')}
                      filterOption={(inputValue, option) => option?.value.includes(inputValue)}
                      options={countries.map(country => ({
                        value: country.value,
                        label: country.label,
                      }))}
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>
          </>
        );
      case 'emailStatus':
        return (
          <Form.Item name="searchKeys" initialValue={[]} noStyle>
            <Select mode="tags" style={{ width: 250 }} placeholder={getIn18Text('QINGXUANZE')} allowClear>
              <Option value="normal">{getIn18Text('ZHENGCHANG')}</Option>
              <Option value="abnormal">{getIn18Text('YICHANG')}</Option>
              <Option value="unknown">{getIn18Text('WEIZHI')}</Option>
            </Select>
          </Form.Item>
        );
      default:
        return null;
    }
  };
  return (
    <>
      <div className={style.contactsFilter}>
        <div className={style.leftBlock}>
          <Form
            form={form}
            onFinish={values => onChange('ordinary', convertOrdinaryParams(values, { enableFilterAbnormalEmailBox }))}
            onValuesChange={changedValue => {
              setTimeout(form.submit);
              setFilterType('ordinary');
              setAdvancedFilterCount(0);
              advancedFilterRef.current?.reset();
              let action = '';
              switch (changedValue) {
                case 'contactAddressInfo':
                  action = 'mail';
                  break;
                case 'companyName':
                  action = 'company';
                  break;
                case 'location':
                  action = 'country_region';
                  break;
                case 'contactName':
                  action = 'name';
                  break;
                case 'jobTitle':
                  action = 'jobTitle';
                  break;
                default:
                  break;
              }
              if (action.length > 0) {
                edmDataTracker.track(filter, { action });
              }
            }}
          >
            <Form.Item noStyle>
              <Input.Group compact>
                <Form.Item name="field" initialValue="contactAddressInfo" noStyle>
                  <Select style={{ width: 100 }} onChange={handleSearchKeysReset}>
                    <Option value="contactAddressInfo">{getIn18Text('YOUXIANG')}</Option>
                    <Option value="emailStatus">{getIn18Text('YOUXIANGZHUANGTAI')}</Option>
                    <Option value="contactName">{getIn18Text('XINGMING')}</Option>
                    <Option value="location">{getIn18Text('GUOJIADEQU')}</Option>
                    <Option value="companyName">{getIn18Text('GONGSIMINGCHENG')}</Option>
                    <Option value="jobTitle">{getIn18Text('ZHIWEI')}</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="rule" initialValue="LIKE" noStyle>
                  <Select style={{ width: 90 }}>
                    <Option value="LIKE">{getIn18Text('BAOHAN')}</Option>
                    <Option value="NOT_LIKE">{getIn18Text('BUBAOHAN')}</Option>
                  </Select>
                </Form.Item>
                <Form.Item shouldUpdate noStyle>
                  {() => {
                    const field = form.getFieldValue('field');
                    return getContactFormItems(field);
                  }}
                </Form.Item>
                {enableFilterAbnormalEmailBox && (
                  <Form.Item noStyle name="onlyNormalAddress" valuePropName="checked">
                    <div className={style.filterAnomalyAddrGroup}>
                      <Checkbox>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                          {getTransText('GUOLVYICHANGDIZHI')}
                          <Tooltip title={getTransText('GUOLVYICHANGDIZHITIP')}>
                            <span style={{ marginLeft: 4, display: 'flex' }}>
                              <QuestionIcon />
                            </span>
                          </Tooltip>
                        </span>
                      </Checkbox>
                    </div>
                  </Form.Item>
                )}
              </Input.Group>
            </Form.Item>
          </Form>
          {props.extraContent}
        </div>
        <span
          className={classnames(style.advancedTrigger, {
            [style.advancedTriggerActive]: filterType === 'advanced',
          })}
        >
          <span onClick={() => setAdvancedVisible(true)}>
            {getIn18Text('GAOJISHAIXUAN')}
            {!!advancedFilterCount && `${advancedFilterCount}`}
          </span>
          {filterType === 'advanced' && (
            <CloseIcon
              style={{ marginLeft: 8 }}
              onClick={() => {
                advancedFilterRef.current?.reset();
                setFilterType('ordinary');
                setAdvancedFilterCount(0);
                onChange('ordinary', convertOrdinaryParams({}));
              }}
            />
          )}
        </span>
      </div>
      <AdvancedFilter
        ref={advancedFilterRef}
        visible={advancedVisible}
        continents={continents}
        onCancel={() => {
          setAdvancedVisible(false);
          filterType !== 'advanced' && advancedFilterRef.current?.reset();
        }}
        onFinish={values => {
          form.resetFields();
          setAdvancedVisible(false);
          setFilterType('advanced');
          setAdvancedFilterCount((values.address || []).length + (values.edm || []).length);
          sendDataTracker(values);
          onChange('advanced', convertAdvancedParams(values));
        }}
      />
    </>
  );
});
export default ContactsFilter;
