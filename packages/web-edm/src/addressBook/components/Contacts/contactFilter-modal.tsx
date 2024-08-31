import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { AutoComplete, Form, Checkbox } from 'antd';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import { EnhanceSelect as Select, InSingleOption as Option } from '@web-common/components/UI/Select';
import { EnhanceSelect as Select, InSingleOption as Option } from '@lingxi-common-component/sirius-ui/Select';
import { AddressBookContactsParams, AddressBookFilterType, apiHolder, apis, CustomerApi, AddressBookNewApi, IAddressBookCreateType, MarktingContactGroup } from 'api';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import style from './contactsFilter.module.scss';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { edmDataTracker, contactBookActionTrackKey } from '../../../tracker/tracker';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';
import { generateAddressBookContactSearchParams, IAddressBookContactsSearchParams } from './../../utils';
import lodashGet from 'lodash/get';
import classnames from 'classnames';
import SearchListHistory, { ISearchHistoryListCompoentRef, ISearchItem } from './components/search-history-list';
import styles from '../../pages/index_new/createMarktingRule.module.scss';
interface ContactsFilterNewProps {
  extraContent?: React.ReactNode;
  classnames?: string;
  wrapperStyle?: React.CSSProperties;
  preExtraContent?: React.ReactNode;
  suffExtraContent?: React.ReactNode;
  onChange: (type: AddressBookFilterType, params: Omit<AddressBookContactsParams, 'contactAddressType' | 'page' | 'page_size' | 'sort'>) => void;
  initGroupId?: string;
}
interface CascaderType {
  label: string;
  value: string;
  children: CascaderType[];
}
let shouldSaveHistory = false;
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

const addressBookNewApi = apiHolder.api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;

const marketTimeList = [
  {
    label: '近一周',
    value: 'ONE_WEEK',
  },
  {
    label: '近一个月',
    value: 'ONE_MONTH',
  },
  {
    label: '近三个月',
    value: 'THREE_MONTH',
  },
  {
    label: '近半年',
    value: 'HALF_YEAR',
  },
];

const marketStatusList = [
  {
    label: '发送',
    value: 'latest_send_time',
  },
  {
    label: '打开',
    value: 'latest_open_time',
  },
  {
    label: '回复',
    value: 'latest_reply_time',
  },
  {
    label: '退订',
    value: 'latest_unsubscribe_time',
  },
];

const yesNoListMap = marketStatusList.reduce(
  (currMap, item) => {
    currMap[item.value] = [
      {
        label: `${item.label}过`,
        value: 1,
      },
      {
        label: `未${item.label}`,
        value: 0,
      },
    ];
    return currMap;
  },
  { '': [] } as { [key: string]: Array<{ label: string; value: number }> }
);

function trackSearchFiletr(values: any) {
  try {
    const contactFilterKey = 'pc_marketing_contactBook_contactFilter';
    const field = values.field as string;
    if (values.searchKeys && values.searchKeys.length) {
      const filedMap: { [key: string]: string } = {
        contactAddressInfo: 'email',
        contactName: 'name',
        companyName: 'company',
        jobTitle: 'job',
        businessClue: 'clue',
      };
      if (filedMap[field]) {
        edmDataTracker.track(contactFilterKey, { type: filedMap[field] });
      }
    }

    if (field === 'location') {
      const continent = values.continent;
      if (continent && continent.length) {
        edmDataTracker.track(contactFilterKey, { type: 'country' });
      }
    }

    if (field === 'groupName') {
      const groupId = values.groupId;
      const groupObj = values.groupObj;
      if (groupId && groupObj) {
        edmDataTracker.track(contactFilterKey, { type: 'group' });
      }
    }

    if (field === 'createSource') {
      const createTypeId = values.createTypeId;
      if (createTypeId) {
        edmDataTracker.track(contactFilterKey, { type: 'createType' });
      }
    }

    if (typeof values.marketStatusYesnoFilter !== 'undefined' && typeof values.marketStatusFilter !== 'undefined' && typeof values.marketTimeFilter !== 'undefined') {
      const timeMap = {
        ONE_WEEK: 'week',
        ONE_MONTH: 'month',
        THREE_MONTH: 'threeMonths',
        HALF_YEAR: 'halfYear',
      };
      //@ts-ignore
      const trackTime = timeMap[values.marketTimeFilter];
      const typeMap = {
        latest_send_time: {
          true: 'send',
          false: 'noSend',
        },
        latest_open_time: {
          true: 'read',
          false: 'noRead',
        },
        latest_reply_time: {
          true: 'reply',
          false: 'noReply',
        },
        latest_unsubscribe_time: {
          true: 'unsubscribe',
          false: 'noUnsubscribe',
        },
      };
      //@ts-ignore
      const trackType = (typeMap[values.marketStatusFilter] || {})[!!values.marketStatusYesnoFilter];
      if (trackType && trackTime) {
        edmDataTracker.track('pc_marketing_contactBook_edmFilter', { type: trackType, time: trackTime });
      }
    }
  } catch (ex) {
    console.error('trackSearchFiletr-catch', ex);
  }
}

const convertOrdinaryParams = (values: any) => {
  trackSearchFiletr(values);
  return generateAddressBookContactSearchParams(values as IAddressBookContactsSearchParams);
};

const filter = 'waimao_address_book_filter';

const ContactsFilter = forwardRef((props: ContactsFilterNewProps, ref) => {
  const { onChange, initGroupId } = props;
  const [form] = Form.useForm();
  const [groupList, setGroupList] = useState<Array<MarktingContactGroup>>([]);
  const [createTypeList, setCreateTypeList] = useState<Array<IAddressBookCreateType>>([]);

  const refreshGroupList = () => {
    addressBookNewApi.getAllContactGroupList(false).then(groupList => {
      setGroupList(groupList);
    });
  };

  useEffect(() => {
    refreshGroupList();
    addressBookNewApi.getAllCreateTypeList().then(createTypeList => {
      setCreateTypeList(createTypeList);
    });
  }, []);
  useEffect(() => {
    if (typeof initGroupId !== 'undefined') {
      form.setFieldsValue({
        field: 'groupName',
        groupId: initGroupId ? Number(initGroupId) : undefined,
      });
      if (initGroupId) {
        const groupInfo = groupList.find(groupItem => Number(groupItem.id) === Number(initGroupId));
        if (!groupInfo) {
          refreshGroupList();
        }
      }
    }
  }, [initGroupId]);

  const searchHistoryListComp = useRef<ISearchHistoryListCompoentRef>(null);

  const saveSearchList = (formVal: any) => {
    let desc = '';
    const fieldMap: { [key: string]: string } = {
      contactAddressInfo: getIn18Text('YOUXIANG'),
      contactName: getIn18Text('XINGMING'),
      location: getIn18Text('GUOJIADEQU'),
      companyName: getIn18Text('GONGSIMINGCHENG'),
      jobTitle: getIn18Text('ZHIWEI'),
      groupName: getIn18Text('FENZU'),
      createSource: getIn18Text('CHUANGJIANFANGSHI'),
      businessClue: getIn18Text('FROM_CLUE'),
    };

    const likeMap: { [key: string]: string } = {
      LIKE: getIn18Text('BAOHAN'),
      NOT_LIKE: getIn18Text('BUBAOHAN'),
    };

    const searchKeyFileds = ['contactAddressInfo', 'contactName', 'companyName', 'jobTitle', 'businessClue'];
    const formField = formVal.field as string;
    const containStr = likeMap[formVal.rule as string];
    const filedStr = fieldMap[formField] as string;
    let searchStr = '';
    if (searchKeyFileds.includes(formField)) {
      const searchVal = formVal.searchKeys && formVal.searchKeys.trim ? formVal.searchKeys.trim() : '';
      if (searchVal && searchVal.length) {
        searchStr = searchVal;
      }
    } else {
      if (formField === 'location') {
        const continent = formVal.continent;
        const country = formVal.country;
        if (continent && continent.length) {
          searchStr = `${continent}${country ? '/' : ''}${country || ''}`;
        }
      }
      if (formField === 'groupName') {
        const groupObj = formVal.groupObj;
        if (groupObj) {
          searchStr = `${groupObj.group_name}`;
        }
      }

      if (formField === 'createSource') {
        const createTypeId = formVal.createTypeId;
        if (createTypeId) {
          const createTypeItem = createTypeList.find(item => item.id === createTypeId);
          if (createTypeItem) {
            searchStr = `${createTypeItem.label}`;
          }
        }
      }
    }
    if (searchStr) {
      desc += `${filedStr}${containStr}${searchStr}`;
    }

    let marketStr = '';
    if (typeof formVal.marketStatusYesnoFilter !== 'undefined' && typeof formVal.marketStatusFilter !== 'undefined' && typeof formVal.marketTimeFilter !== 'undefined') {
      const formTimeFilter = formVal.marketTimeFilter;
      const timeFilter = marketTimeList.find(item => item.value === formTimeFilter);
      if (timeFilter) {
        marketStr += `${timeFilter.label}`;
      }
      const marketStatusYesno = formVal.marketStatusYesnoFilter;
      const targetStatus = statusList.find(item => item.value === marketStatusYesno);
      if (targetStatus) {
        marketStr += `${targetStatus.label}`;
      }
    }

    if (marketStr) {
      desc += `${(desc ? ' | ' : '') + marketStr}`;
    }

    if (!desc) {
      return;
    }

    if (searchHistoryListComp && searchHistoryListComp.current) {
      searchHistoryListComp.current.saveSearchItem({
        id: new Date().getTime().toString(),
        desc: desc,
        filter: formVal,
      });
    }
  };

  const [continents, setContinents] = useState<CascaderType[]>([]);
  const handleContinentsFetch = () => {
    customerApi.getGlobalArea().then(res => {
      setContinents(res.area.reduce<CascaderType[]>((accumulator, areaItem) => [...accumulator, areaItem], []));
    });
  };
  const handleSearchKeysReset = () => {
    form.setFieldsValue({
      searchKeys: '',
      continent: undefined,
      country: undefined,
    });
  };

  useEffect(() => {
    handleContinentsFetch();
  }, []);

  useImperativeHandle(ref, () => ({
    reset: (noSubmit?: boolean) => {
      form.resetFields();
      if (!noSubmit) {
        setTimeout(form.submit);
      }
    },
    searchByCompanyName: (companyName: string) => {
      form.setFieldsValue({
        field: 'companyName',
        rule: 'LIKE',
        searchKeys: companyName,
      });
      setTimeout(form.submit);
    },
    searchByJobTitle: (jobTitle: string) => {
      form.setFieldsValue({
        field: 'jobTitle',
        rule: 'LIKE',
        searchKeys: jobTitle,
      });
      setTimeout(form.submit);
    },
    getValidateFields() {
      const values = form.getFieldsValue();
      if (values.field === 'groupName' && values.groupId) {
        values.groupObj = groupList.find(item => item.id === values.groupId);
      }
      return values;
    },
  }));

  const handleSelectChanged = (val: string | number, type: string) => {
    console.log('val is ', val, ' type is ', type);
  };

  const getContactFormItems = (field: string) => {
    switch (field) {
      case 'contactAddressInfo':
      case 'contactName':
      case 'companyName':
      case 'jobTitle':
      case 'businessClue':
        return (
          <Form.Item name="searchKeys" noStyle>
            <Input placeholder={getIn18Text('QINGSHURUGUANJIAN')} style={{ width: 170 }} allowClear />
          </Form.Item>
        );
      case 'groupName':
        return (
          <Form.Item name="groupId" noStyle>
            <Select
              showSearch
              allowClear
              style={{ width: 150 }}
              filterOption={(input, option) =>
                String(option?.label || '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={groupList.map(item => {
                return {
                  label: item.group_name,
                  value: item.id,
                };
              })}
              onChange={(val: string | number) => handleSelectChanged(val, 'groupId')}
            ></Select>
          </Form.Item>
        );
        break;
      case 'createSource':
        return (
          <Form.Item name="createTypeId" noStyle>
            <Select
              showSearch
              allowClear
              style={{ width: 150 }}
              filterOption={(input, option) =>
                String(option?.label || '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={(val: string | number) => handleSelectChanged(val, 'createTypeId')}
              options={createTypeList.map(item => {
                return {
                  label: item.label,
                  value: item.id,
                };
              })}
            ></Select>
          </Form.Item>
        );
        break;
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
      default:
        return null;
    }
  };
  const [statusList, setStatusList] = useState<Array<{ value: number; label: string }>>([]);
  return (
    <>
      <div className={classnames(style.contactFilterWrapper, props.classnames)}>
        <div className={style.contactsFilter} style={{ paddingBottom: '0' }}>
          <div className={style.leftBlock}>
            <Form
              form={form}
              layout="vertical"
              onFinish={values => {
                if (shouldSaveHistory) {
                  shouldSaveHistory = false;
                  saveSearchList(values);
                }
                if (values.field === 'groupName' && values.groupId) {
                  values.groupObj = groupList.find(item => item.id === values.groupId);
                }
                onChange('ordinary', convertOrdinaryParams(values));
              }}
              onValuesChange={changedValue => {
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
              {props.preExtraContent}
              <Form.Item className={`${styles.marktingRuleFormName} ${styles.marktingRule4Contact}`} noStyle={false} label="联系人信息">
                <Input.Group compact>
                  <Form.Item name="field" initialValue="contactAddressInfo" noStyle>
                    <Select style={{ width: 100 }} onChange={handleSearchKeysReset}>
                      <Option value="contactAddressInfo">{getIn18Text('YOUXIANG')}</Option>
                      <Option value="contactName">{getIn18Text('XINGMING')}</Option>
                      <Option value="location">{getIn18Text('GUOJIADEQU')}</Option>
                      <Option value="companyName">{getIn18Text('GONGSIMINGCHENG')}</Option>
                      <Option value="jobTitle">{getIn18Text('ZHIWEI')}</Option>
                      <Option value="groupName">{getIn18Text('FENZU')}</Option>
                      <Option value="createSource">{getIn18Text('CHUANGJIANFANGSHI')}</Option>
                      <Option value="businessClue">{getIn18Text('FROM_CLUE')}</Option>
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
                </Input.Group>
              </Form.Item>

              <Form.Item className={`${styles.marktingRuleFormName} ${styles.marktingRule4Markting}`} noStyle={false} label="邮件营销行为">
                <Input.Group compact>
                  <Form.Item name="marketTimeFilter" noStyle>
                    <Select allowClear style={{ width: 112 }} placeholder={getIn18Text('XUANZESHIJIAN')}>
                      {marketTimeList.map(item => {
                        return <Option value={item.value}>{item.label}</Option>;
                      })}
                    </Select>
                  </Form.Item>
                  <Form.Item name="marketStatusFilter" noStyle>
                    <Select
                      allowClear
                      style={{ width: 112 }}
                      onChange={(val: string) => {
                        setStatusList(yesNoListMap[val] || []);
                        form.setFieldsValue({ marketStatusYesnoFilter: undefined });
                      }}
                      placeholder={getIn18Text('YINGXIAOXINGWEI')}
                    >
                      {marketStatusList.map(item => {
                        return <Option value={item.value}>{item.label}</Option>;
                      })}
                    </Select>
                  </Form.Item>
                  <Form.Item name="marketStatusYesnoFilter" shouldUpdate noStyle>
                    <Select style={{ width: 100 }} allowClear placeholder={getIn18Text('ZHUANGTAI')}>
                      {statusList.map(item => {
                        return <Option value={item.value}>{item.label}</Option>;
                      })}
                    </Select>
                  </Form.Item>
                </Input.Group>
              </Form.Item>
              {props.suffExtraContent}
            </Form>
            {props.extraContent}
          </div>
        </div>
      </div>
    </>
  );
});
export default ContactsFilter;
