import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState, useMemo } from 'react';
import {
  AddressBookContactsParams,
  AddressBookFilterType,
  apiHolder,
  apis,
  CustomerApi,
  AddressBookNewApi,
  IAddressBookCreateType,
  MarktingContactGroup,
  getIn18Text,
  SystemApi,
} from 'api';
import { EnhanceSelect as Select, InSingleOption as Option } from '@lingxi-common-component/sirius-ui/Select';
import Input from '@lingxi-common-component/sirius-ui/Input';
import Button from '@lingxi-common-component/sirius-ui/Button';
import DatePicker from '@lingxi-common-component/sirius-ui/DatePicker';
import HollowOutGuide from '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide';
import { TongyongTianjiaXian, TongyongJianshaoXian, TongyongJiantou1Shang, TongyongJiantou1Xia } from '@sirius/icons';
import { AutoComplete, Form } from 'antd';
import { useIntersection } from 'react-use';
import SearchListHistory, { ISearchHistoryListCompoentRef, ISearchItem } from './components/search-history-list';
import { edmDataTracker, contactBookActionTrackKey } from '../../../tracker/tracker';
import { generateAddressBookContactSearchParamsNew, IAddressBookContactsSearchParams, ContactFilterForm, ContactFilterValues } from './../../utils';
import classnames from 'classnames';
import moment from 'moment';
import { cloneDeep } from 'lodash';
import style from './contactsFilter.module.scss';
const { RangePicker } = DatePicker;

const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const addressBookNewApi = apiHolder.api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const inEdmWeb = systemApi.isWebFfEntry() || systemApi.isWebWmEntry();
const inElectron = systemApi.isElectron();
const isMacOrDev = !inElectron || window.electronLib?.env?.isMac; // 开发环境或者mac端
let shouldSaveHistory = false;
let timer: NodeJS.Timeout | null = null;
const marketTimeList = [
  {
    label: '近7天',
    value: 'ONE_WEEK',
  },
  {
    label: '近14天',
    value: 'TWO_WEEK',
  },
  {
    label: '近30天',
    value: 'ONE_MONTH',
  },
  {
    label: '近90天',
    value: 'THREE_MONTH',
  },
  {
    label: '近半年',
    value: 'HALF_YEAR',
  },
  {
    label: '全部时间',
    value: 'ALL',
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
const convertOrdinaryParams = (values: ContactFilterValues) => {
  trackSearchFiletr(values);
  return generateAddressBookContactSearchParamsNew(values);
};
function trackSearchFiletr(values: ContactFilterValues) {
  try {
    const contactFilterKey = 'pc_marketing_contactBook_filterSuccess';
    const fieldMap: { [key: string]: string } = {
      email: 'email',
      contact_name: 'name',
      leads_company_name: 'company',
      contact_job: 'job',
      leads_name: 'leads',
      groupName: 'group',
      createSource: 'createType',
      location: 'country',
      create_time_range: 'createTime',
      latest_send_time: 'send',
      latest_open_time: 'read',
      latest_reply_time: 'reply',
      latest_unsubscribe_time: 'unsubscribe',
    };
    let value: string[] = [];
    values.subs.forEach((_: IAddressBookContactsSearchParams) => {
      const field = _.field;
      const fieldName = fieldMap[field];
      value.push(fieldName);
    });
    const type = values.relation === 'OR' ? 0 : 1;
    edmDataTracker.track(contactFilterKey, { number: values.subs.length, type: type, value: value.join() });
  } catch (ex) {
    console.error('trackFilterSuccess-catch', ex);
  }
}

interface ContactsFilterNewProps {
  classnames?: string;
  wrapperStyle?: React.CSSProperties;
  onChange: (type: AddressBookFilterType, params: Omit<AddressBookContactsParams, 'contactAddressType' | 'page' | 'page_size' | 'sort'>) => void;
  initGroupId?: string; //初始分组id
  tabScrollY?: number;
  startFilterFixedHeight?: number;
}
interface CascaderType {
  label: string;
  value: string;
  children: CascaderType[];
}

// let refresh = 1;

const ContactsFilter = forwardRef((props: ContactsFilterNewProps, ref) => {
  const { onChange, initGroupId, tabScrollY, startFilterFixedHeight } = props;
  const [groupList, setGroupList] = useState<Array<MarktingContactGroup>>([]);
  const [createTypeList, setCreateTypeList] = useState<Array<IAddressBookCreateType>>([]);
  const [relation, setRelation] = useState<'OR' | 'AND'>('OR');
  const [isfold, setIsfold] = useState(false); //默认筛选项不折叠，展开
  const [tableFilterRules, setTableFilterRules] = useState<ContactFilterForm | null>(null); //记录当前生效的筛选条件
  const [formFieldsLength, setFormFieldsLength] = useState(1);
  const [isFixed, setIsFixed] = useState<boolean>(false);
  const contactFilterWrapperRef = useRef<HTMLInputElement>(null);
  const searchHistoryListComp = useRef<ISearchHistoryListCompoentRef>(null);
  const [contactFilterWrapperHeight, setContactFilterWrapperHeight] = useState<number>(16);
  const [searchHistoryList, setSearchHistoryList] = useState<Array<ISearchItem>>([]);
  const [form] = Form.useForm();

  const spliceRulesStr = (values: ContactFilterForm, count?: number) => {
    let res = '';
    values.subs.forEach((_: IAddressBookContactsSearchParams, index: number) => {
      if (count && index + 1 >= count) {
        return;
      }
      const field = _.field;
      const fieldMap: { [key: string]: string } = {
        email: getIn18Text('YOUXIANG'),
        contact_name: getIn18Text('XINGMING'),
        leads_company_name: getIn18Text('GONGSIMINGCHENG'),
        contact_job: getIn18Text('ZHIWEI'),
        leads_name: getIn18Text('FROM_CLUE'),
        groupName: getIn18Text('FENZU'),
        createSource: getIn18Text('CHUANGJIANFANGSHI'),
        location: getIn18Text('GUOJIADEQU'),
        create_time_range: getIn18Text('SITE_CHUANGJIANSHIJIAN'),
        latest_send_time: getIn18Text('YINGXIAOFAXINZHUANGTAI'),
        latest_open_time: getIn18Text('YINGXIAOXINDAKAIZHUANGTAI'),
        latest_reply_time: getIn18Text('YINGXIAOXINHUIFUZHUANGTAI'),
        latest_unsubscribe_time: getIn18Text('TUIDINGZHUANGTAI'),
      };
      const likeMap: { [key: string]: string } = {
        LIKE: getIn18Text('BAOHAN'),
        NOT_LIKE: getIn18Text('BUBAOHAN'),
      };
      const fieldName = fieldMap[field];
      const searchKeyFileds = ['email', 'contact_name', 'leads_company_name', 'contact_job', 'leads_name'];
      const marketStatusFileds = ['latest_send_time', 'latest_open_time', 'latest_reply_time', 'latest_unsubscribe_time'];
      if (searchKeyFileds.includes(field)) {
        const searchVal = _.searchKeys && typeof _.searchKeys === 'string' ? _.searchKeys.trim() : '';
        res = res + `${fieldName}${likeMap[_.rule as string]}${searchVal}、`;
      } else if (marketStatusFileds.includes(field)) {
        const statusOptions = yesNoListMap[field] || [];
        const onStatusOption = statusOptions.find(status => status.value === _.marketStatusYesnoFilter);
        const onTimeOption = marketTimeList.find(status => status.value === _.marketTimeFilter);
        res = res + `${fieldName}${onTimeOption?.label || ''}${onStatusOption?.label || ''}、`;
      } else if (field === 'groupName') {
        const groupObj = _.groupObj;
        res = res + `${fieldName}${likeMap[_.rule as string]}${groupObj?.group_name || ''}、`;
      } else if (field === 'createSource') {
        const createTypeId = _.createTypeId;
        if (createTypeId) {
          const createTypeItem = createTypeList.find(item => item.id === createTypeId);
          res = res + `${fieldName}${likeMap[_.rule as string]}${createTypeItem?.label || ''}、`;
        }
      } else if (field === 'location') {
        const continent = _.continent;
        const country = _.country;
        if (continent && continent.length) {
          const searchStr = `${continent}${country ? '/' : ''}${country || ''}`;
          res = res + `${fieldName}${likeMap[_.rule as string]}${searchStr}、`;
        }
      } else if (field === 'create_time_range' && _.createTimeValue) {
        res = res + `${fieldName}${moment(_.createTimeValue[0]).format('YYYY-MM-DD')}到${moment(_.createTimeValue[1]).format('YYYY-MM-DD')}、`;
      }
    });
    if (count && values.subs.length >= count) {
      return res.slice(0, -1) + `等${values.subs.length}个条件`;
    } else {
      return res.slice(0, -1);
    }
  };

  const foldIntro = useMemo(() => {
    // 生成筛选项折叠文案
    let res = '未选择筛选条件';
    if (tableFilterRules) {
      res = spliceRulesStr(tableFilterRules);
    }
    return res;
  }, [tableFilterRules]);

  // const intersection = useIntersection(contactFilterWrapperRef, {
  //   root: null,
  //   rootMargin: '0px',
  //   threshold: 1,
  // });
  // console.log(intersection);
  // refresh = refresh + 1;

  useEffect(() => {
    timer = setTimeout(() => {
      setContactFilterWrapperHeight((contactFilterWrapperRef.current?.clientHeight || 0) + 16);
    }, 0);
    return function () {
      timer && clearTimeout(timer);
      timer = null;
    };
  }, [contactFilterWrapperRef.current?.clientHeight, isfold]);

  useEffect(() => {
    const onFixed = !!(tabScrollY !== undefined && startFilterFixedHeight !== undefined && startFilterFixedHeight !== -1 && tabScrollY >= startFilterFixedHeight);
    if (onFixed === isFixed) {
      return;
    } else {
      const formValues = form.getFieldsValue(true);
      if (onFixed && formValues.subs.length > 2) {
        // 滚动过程中筛选条件大于2，自动收起
        setIsfold(true);
      }
      setIsFixed(onFixed);
    }
  }, [tabScrollY, startFilterFixedHeight]);

  // 获取所有分组
  const refreshGroupList = () => {
    addressBookNewApi.getAllContactGroupList(false).then(groupList => {
      setGroupList(groupList);
    });
  };

  useEffect(() => {
    refreshGroupList(); // 获取所有分组的信息
    addressBookNewApi.getAllCreateTypeList().then(createTypeList => {
      setCreateTypeList(createTypeList); // 获取所有创建方式的列表
    });
  }, []);

  useEffect(() => {
    // 分组tab，点击分组名称跳转到联系人总览，默认选择当前分组筛选条件
    if (typeof initGroupId !== 'undefined' && form && form.setFieldsValue) {
      form.setFieldsValue({
        subs: [{ field: 'groupName', rule: 'LIKE', groupId: initGroupId ? Number(initGroupId) : undefined }],
      });
      if (initGroupId) {
        const groupInfo = groupList.find(groupItem => Number(groupItem.id) === Number(initGroupId));
        if (!groupInfo) {
          refreshGroupList(); //刷新分组选项
        }
      }
    }
  }, [initGroupId]);

  // 点击筛选按钮后保存搜索历史记录
  const saveSearchList = (formVal: ContactFilterForm) => {
    const desc = spliceRulesStr(formVal, 2);
    if (!desc) {
      return;
    }
    const filterVal = cloneDeep(formVal);
    filterVal.subs.forEach(_ => {
      if (_.field === 'create_time_range' && _.createTimeValue && _.createTimeValue.length === 2) {
        _.createTimeValue = [moment(_.createTimeValue[0]).valueOf(), moment(_.createTimeValue[1]).valueOf()];
      }
    });
    if (searchHistoryListComp && searchHistoryListComp.current) {
      searchHistoryListComp.current.saveSearchItem({
        id: new Date().getTime().toString(),
        desc: desc,
        filter: {
          relation: relation,
          filterVal: filterVal,
        },
      });
    }
  };

  // 获取国家地区select数据
  const [continents, setContinents] = useState<CascaderType[]>([]);
  const handleContinentsFetch = () => {
    customerApi.getGlobalArea().then(res => {
      setContinents(res.area.reduce<CascaderType[]>((accumulator, areaItem) => [...accumulator, areaItem], []));
    });
  };
  useEffect(() => {
    handleContinentsFetch();
  }, []);

  useImperativeHandle(ref, () => ({
    reset: () => {
      form.resetFields();
      const newValues = { subs: [{ field: 'email', rule: 'LIKE' }] };
      form.setFieldsValue(newValues);
      setRelation('OR');
      setTableFilterRules(null);
    },
  }));

  // 选择筛选条件
  const handleSearchKeysReset = (index: number) => {
    const formValues = form.getFieldsValue(true);
    formValues.subs[index].searchKeys = '';
    formValues.subs[index].continent = undefined;
    formValues.subs[index].country = undefined;
  };

  // 筛选表单 onFinish
  const formFinishHandle = (values: ContactFilterForm) => {
    values.subs.forEach((item: IAddressBookContactsSearchParams) => {
      if (item.field === 'groupName' && item.groupId) {
        item.groupObj = groupList.find(_ => _.id === item.groupId);
      }
    });
    if (shouldSaveHistory) {
      shouldSaveHistory = false;
      saveSearchList(values);
    }
    setTableFilterRules(values);
    onChange('ordinary', convertOrdinaryParams({ ...values, relation: relation }));
  };

  // 营销联系人筛选按钮操作埋点
  const filterActionTrack = (type: string) => {
    edmDataTracker.track('pc_marketing_contactBook_filterAction', { type: type });
  };

  // 点击筛选按钮回调
  const screenClick = (ev: any) => {
    ev.preventDefault();
    ev.stopPropagation();
    shouldSaveHistory = true;
    setTimeout(() => {
      form.submit();
    }, 0);
    filterActionTrack('filter');
  };

  // 筛选项的收起，展开
  const foldClick = (ev: any) => {
    ev.preventDefault();
    ev.stopPropagation();
    filterActionTrack(isfold ? 'open' : 'close');
    setIsfold(!isfold);
  };

  // 清除筛选
  const clearFilter = (ev: any) => {
    ev.preventDefault();
    ev.stopPropagation();
    const newValues = { subs: [{ field: 'email', rule: 'LIKE' }] };
    form.setFieldsValue(newValues);
    setRelation('OR');
    formFinishHandle(newValues as ContactFilterForm);
    filterActionTrack('deletAll');
  };

  const getContactFormItems = (field: string, name: number) => {
    switch (field) {
      case 'email':
      case 'contact_name':
      case 'leads_company_name':
      case 'contact_job':
      case 'leads_name':
        return (
          <Form.Item name={[name, 'searchKeys']} rules={[{ required: true, message: '请填写筛选条件' }]}>
            <Input placeholder={getIn18Text('QINGSHURUGUANJIAN')} style={{ width: 300, marginRight: '8px' }} allowClear />
          </Form.Item>
        );
      case 'groupName':
        return (
          <Form.Item name={[name, 'groupId']} rules={[{ required: true, message: '请选择筛选条件' }]}>
            <Select
              showSearch
              allowClear
              style={{ width: 300, marginRight: '8px' }}
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
            ></Select>
          </Form.Item>
        );
        break;
      case 'createSource':
        return (
          <Form.Item name={[name, 'createTypeId']} rules={[{ required: true, message: '请选择筛选条件' }]}>
            <Select
              showSearch
              allowClear
              style={{ width: 300, marginRight: '8px' }}
              filterOption={(input, option) =>
                String(option?.label || '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
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
            <Form.Item name={[name, 'continent']} rules={[{ required: true, message: '请选择筛选条件' }]}>
              <Select
                style={{ width: 146, marginRight: '8px' }}
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
                const continent = form.getFieldValue(['subs', name, 'continent']);
                const countries = continents.find(item => item.value === continent)?.children || [];
                return (
                  <Form.Item name={[name, 'country']} rules={[{ required: true, message: '请选择筛选条件' }]}>
                    <AutoComplete
                      style={{ width: 146, marginRight: '8px' }}
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
      case 'latest_send_time':
      case 'latest_open_time':
      case 'latest_reply_time':
      case 'latest_unsubscribe_time':
        return (
          <Form.Item name={[name, 'marketStatusYesnoFilter']} rules={[{ required: true, message: '请选择筛选条件' }]}>
            <Select style={{ width: 300, marginRight: '8px' }} allowClear placeholder={getIn18Text('ZHUANGTAI')}>
              {yesNoListMap[field].map(item => {
                return <Option value={item.value}>{item.label}</Option>;
              })}
            </Select>
          </Form.Item>
        );
        break;
      case 'create_time_range':
        return (
          <Form.Item className={style.dateRange} name={[name, 'createTimeValue']} rules={[{ required: true, message: '请选择筛选条件' }]}>
            <RangePicker style={{ width: 300, marginRight: '8px' }} />
          </Form.Item>
        );
        break;
      default:
        return null;
    }
  };
  return (
    <>
      <div
        style={{ height: contactFilterWrapperHeight }}
        hidden={!(tabScrollY !== undefined && startFilterFixedHeight !== undefined && startFilterFixedHeight !== -1 && tabScrollY >= startFilterFixedHeight)}
      ></div>
      <div
        className={classnames(
          style.contactFilterWrapper,
          tabScrollY !== undefined && startFilterFixedHeight !== undefined && startFilterFixedHeight !== -1 && tabScrollY >= startFilterFixedHeight
            ? inEdmWeb
              ? style.contactFilterWrapperFixedWeb
              : isMacOrDev
              ? style.contactFilterWrapperFixed
              : style.contactFilterWrapperFixedWeb
            : '',
          props.classnames
        )}
        ref={contactFilterWrapperRef}
      >
        <div className={style.contactsFilterTitle}>筛选联系人</div>
        <div className={style.contactsFilter} hidden={isfold}>
          <Form form={form} layout="vertical" onFinish={formFinishHandle} className={style.form}>
            <Form.List name="subs" initialValue={[{ field: 'email', rule: 'LIKE' }]}>
              {(fields, { add, remove }) => {
                setFormFieldsLength(fields.length);
                return (
                  <>
                    <div className={style.relation} hidden={fields.length < 2}>
                      <div className={style.ruleBorder}></div>
                      <Select value={relation} onChange={val => setRelation(val)} style={{ width: 146, marginRight: '16px' }}>
                        <Option value="OR">满足任意条件</Option>
                        <Option value="AND">满足全部条件</Option>
                      </Select>
                    </div>
                    <div>
                      {fields.map(({ key, name }) => (
                        <Form.Item key={key} noStyle={true} label={null}>
                          <Input.Group compact className={style.group}>
                            <Form.Item name={[name, 'field']} initialValue="email" noStyle>
                              <Select style={{ width: 146, marginRight: '8px' }} onChange={() => handleSearchKeysReset(name)}>
                                <Option value="email">{getIn18Text('YOUXIANG')}</Option>
                                <Option value="contact_name">{getIn18Text('XINGMING')}</Option>
                                <Option value="location">{getIn18Text('GUOJIADEQU')}</Option>
                                <Option value="leads_company_name">{getIn18Text('GONGSIMINGCHENG')}</Option>
                                <Option value="contact_job">{getIn18Text('ZHIWEI')}</Option>
                                <Option value="groupName">{getIn18Text('FENZU')}</Option>
                                <Option value="createSource">{getIn18Text('CHUANGJIANFANGSHI')}</Option>
                                <Option value="leads_name">{getIn18Text('FROM_CLUE')}</Option>
                                <Option value="create_time_range">{getIn18Text('SITE_CHUANGJIANSHIJIAN')}</Option>
                                <Option value="latest_send_time">{getIn18Text('YINGXIAOFAXINZHUANGTAI')}</Option>
                                <Option value="latest_open_time">{getIn18Text('YINGXIAOXINDAKAIZHUANGTAI')}</Option>
                                <Option value="latest_reply_time">{getIn18Text('YINGXIAOXINHUIFUZHUANGTAI')}</Option>
                                <Option value="latest_unsubscribe_time">{getIn18Text('TUIDINGZHUANGTAI')}</Option>
                              </Select>
                            </Form.Item>
                            <Form.Item shouldUpdate noStyle>
                              {() => {
                                const field = form.getFieldValue(['subs', name, 'field']);
                                if (['latest_send_time', 'latest_open_time', 'latest_reply_time', 'latest_unsubscribe_time'].includes(field)) {
                                  return (
                                    <Form.Item name={[name, 'marketTimeFilter']} rules={[{ required: true, message: '请选择筛选条件' }]}>
                                      <Select allowClear style={{ width: 146, marginRight: '8px' }} placeholder={getIn18Text('XUANZESHIJIAN')}>
                                        {marketTimeList.map(item => {
                                          return <Option value={item.value}>{item.label}</Option>;
                                        })}
                                      </Select>
                                    </Form.Item>
                                  );
                                } else if (field === 'create_time_range') {
                                  return <></>;
                                }
                                return (
                                  <Form.Item name={[name, 'rule']} initialValue="LIKE" noStyle>
                                    <Select style={{ width: 146, marginRight: '8px' }}>
                                      <Option value="LIKE">{getIn18Text('BAOHAN')}</Option>
                                      <Option value="NOT_LIKE">{getIn18Text('BUBAOHAN')}</Option>
                                    </Select>
                                  </Form.Item>
                                );
                              }}
                            </Form.Item>
                            <Form.Item shouldUpdate noStyle>
                              {() => {
                                const field = form.getFieldValue(['subs', name, 'field']);
                                return getContactFormItems(field, name);
                              }}
                            </Form.Item>
                            {name !== 0 ? (
                              <TongyongJianshaoXian
                                wrapClassName={style.filterSvg}
                                color="#8D92A1"
                                onClick={() => {
                                  filterActionTrack('delet');
                                  remove(name);
                                }}
                              />
                            ) : (
                              // <HollowOutGuide
                              //   guideId="CONTACTFILTERNEW"
                              //   intro="可以添加多个条件组合筛选，条件包含联系人状态和营销状态等"
                              //   title=""
                              //   placement="top"
                              //   type="1"
                              //   enable={true}
                              //   padding={[0, 0, 0, 8]}
                              //   refresh={refresh}
                              // >
                              <TongyongTianjiaXian
                                wrapClassName={style.filterSvg}
                                color="#8D92A1"
                                onClick={() => {
                                  filterActionTrack('add');
                                  add();
                                }}
                              />
                              // </HollowOutGuide>
                            )}
                          </Input.Group>
                        </Form.Item>
                      ))}
                    </div>
                  </>
                );
              }}
            </Form.List>
          </Form>
          <div className={style.operate} style={{ left: formFieldsLength >= 2 ? '817px' : '655px', bottom: searchHistoryList.length ? '58px' : '20px' }}>
            <p className={style.firstLine}>
              <Button btnType="minorLine" hidden={formFieldsLength > 1} onClick={clearFilter}>
                清除筛选
              </Button>
              <Button onClick={screenClick} className={style.screen} btnType="primary">
                {getIn18Text('SHAIXUAN')}
              </Button>
            </p>
            <Button btnType="minorLine" hidden={formFieldsLength < 2} onClick={clearFilter}>
              清除筛选
            </Button>
            <Button className={style.packUp} hidden={formFieldsLength < 3} onClick={foldClick} btnType="link">
              收起 <TongyongJiantou1Shang color="#4C6AFF" width={16} height={16} />
            </Button>
          </div>
        </div>
        <div className={style.foldIntro} hidden={!isfold}>
          <div className={style.intro}>{foldIntro}</div>
          <Button className={style.packDown} onClick={foldClick} btnType="link">
            展开
            <TongyongJiantou1Xia color="#4C6AFF" width={16} height={16} />
          </Button>
        </div>
        <div>
          <SearchListHistory
            setSearchHistoryList={setSearchHistoryList}
            handleSearchChange={(searchItem: ISearchItem) => {
              if (searchItem.filter) {
                const filter = cloneDeep(searchItem.filter);
                filter.filterVal.subs.forEach((_: IAddressBookContactsSearchParams) => {
                  if (_.field === 'create_time_range' && _.createTimeValue && _.createTimeValue.length === 2) {
                    _.createTimeValue = [moment(_.createTimeValue[0]), moment(_.createTimeValue[1])];
                  }
                });
                form.setFieldsValue(filter.filterVal);
                setRelation(filter.relation);
                setTimeout(() => {
                  form.submit();
                }, 0);
              }
            }}
            ref={searchHistoryListComp}
          />
        </div>
        <div className={style.line}></div>
      </div>
    </>
  );
});
export default ContactsFilter;
