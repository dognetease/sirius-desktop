import React, { useEffect, useRef, useState, useContext } from 'react';
import { DatePicker } from 'antd';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import { SelectValue } from 'antd/lib/select/index';
import Select from '../../../components/UI/Select/customerSelect';
const { RangePicker } = DatePicker;
import moment, { Moment } from 'moment';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import style from './search.module.scss';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { ReactComponent as RangeDate } from '@/images/icons/edm/range-date.svg';
import { ReactComponent as TableSetting } from '@/images/icons/edm/tableSetting.svg';
import { customerDataTracker, CustomerSearchType } from '../../../tracker/customerDataTracker';
import { clientContext } from '../../clientContext';
import { RequestCompanyMyList } from 'api';
const dateFormat = 'yyyy-MM-DD';
const dateShowFormat = 'yyyy/MM/DD';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import SearchCollapse from '../../../components/searchCollapse/SearchCollapse';
import CollapseButton from '../../../components/collapseButton/CollapseButton';
import { customerContext } from '../../../customerContext';
import { getIn18Text } from 'api';
function disabledDate(current: Moment) {
  return current && (current > moment().endOf('day') || current < moment('1900-01-01').endOf('day'));
}
function disabledDateFuture(current: Moment) {
  return current && current < moment('1900-01-01').endOf('day');
}
type SearchConditionApi = Partial<RequestCompanyMyList>;
interface SearchCondition extends SearchConditionApi {
  createTimeStart?: [Moment, Moment] | null;
  activeTimeStart?: [Moment, Moment] | null;
  searchKey?: string;
  labelNameList?: string[];
  filter_label_op: string;
  company_level?: string[];
  source?: number[];
  star_level?: string[];
}
interface comsProps {
  handerSearch?: (params: SearchConditionApi) => void;
  className?: string;
  onCollapse: () => void;
  onSetting: (param: boolean) => void;
}
interface optionProps {
  label: string;
  value: string;
}
const Search: React.FC<comsProps> = ({ onCollapse, onSetting, handerSearch, ...rest }) => {
  const { dispatch } = useContext(clientContext).value;
  const [searchKeyList] = useState<optionProps[]>([
    {
      label: getIn18Text('GONGSI'),
      value: 'company',
    },
    {
      label: getIn18Text('YOUXIANG'),
      value: 'email',
    },
    {
      label: getIn18Text('DIANHUA'),
      value: 'telephone',
    },
    {
      label: 'WA',
      value: 'whats_app',
    },
    {
      label: getIn18Text('XINGMING'),
      value: 'contactName',
    },
  ]);
  const [searchPlaceHolderKey] = useState<any>({
    company: getIn18Text('QINGSHURUGONGSIMINGCHENG'),
    email: getIn18Text('QINGSHURUYOUXIANG'),
    telephone: getIn18Text('QINGSHURUDIANHUA'),
    whats_app: getIn18Text('QINGSHURUwhatsApp'),
  });
  const [placeholder, setPlaceHolder] = useState<string>(getIn18Text('QINGSHURUGONGSI'));
  const [queryKey, setQueryKey] = useState<string | undefined>(undefined);
  const [queryValue, setQueryValue] = useState<string | undefined>(undefined);
  const [isExpand, setIsExpand] = useState<boolean>(false);
  const filterBlock = useRef<HTMLDivElement>(null);
  const [searchCondition, setSearchCondition] = useState<SearchCondition>({
    createTimeStart: null,
    activeTimeStart: null,
    searchKey: '',
    labelNameList: [],
    manager_id_list: [],
    filter_label_op: 'contain',
  } as SearchCondition);
  const { state: customerState } = useContext(customerContext).value;
  const { baseSelect } = customerState;
  const [country, setCountry] = useState<string | undefined>(undefined);
  const [countryOption, setCountryOption] = useState<optionProps[]>([]);
  const [isInit, setIsInit] = useState<boolean>(true);
  /**
   * 查询
   */
  useEffect(() => {
    if (!isInit) {
      formateDate();
    } else {
      setIsInit(false);
    }
  }, [searchCondition]);
  /**
   * 最近创建时间
   */
  const onChangeCreateTime = (values: any, formatString: [string, string]) => {
    const currentData = {
      ...searchCondition,
      createTimeStart: values,
    };
    setSearchCondition(currentData);
    // customerDataTracker.trackCustomerSearch(CustomerSearchType.CreateTime);
  };
  const formateDate = () => {
    const { createTimeStart, activeTimeStart, searchKey, labelNameList, continent, country, company_level, source, star_level, ...rest } = searchCondition;
    const params = rest as SearchConditionApi;
    if (createTimeStart && createTimeStart.length) {
      params.create_time_start = createTimeStart[0].format(dateFormat);
      params.create_time_end = createTimeStart[1].format(dateFormat);
    } else {
      params.create_time_start = '';
      params.create_time_end = '';
    }
    if (activeTimeStart && activeTimeStart.length) {
      params.active_time_start = activeTimeStart[0].format(dateFormat);
      params.active_time_end = activeTimeStart[1].format(dateFormat);
    } else {
      params.active_time_start = '';
      params.active_time_end = '';
    }
    if (queryKey === 'email' || queryKey === 'telephone' || queryKey === 'whats_app' || queryKey === 'contactName') {
      params.contact_search_key = {
        blank: true,
        [queryKey]: searchKey,
      };
      params.search_key = '';
    } else {
      params.search_key = searchKey;
      params.contact_search_key = undefined;
    }
    params.label_name_list = labelNameList;
    params.continent = continent;
    params.country = country;
    setCountry(country);
    params.source_list = source;
    params.star_level_list = star_level;
    params.company_level_list = company_level;
    // 参数变更就会请求接口数据
    dispatch({
      type: 'fetchTableData',
      payload: {
        requestTableParam: {
          ...params,
          page: 1,
        },
      },
    });
    console.log('fetchTableData', params);
  };
  /**
   * 最近来往时间
   */
  const onChangeUpdateTime = (values: any, formatString: [string, string]) => {
    const currentData = {
      ...searchCondition,
      activeTimeStart: values,
    };
    setSearchCondition(currentData);
    // customerDataTracker.trackCustomerSearch(CustomerSearchType.UpdateTime);
  };
  const handleKeyChange = key => {
    setPlaceHolder(searchPlaceHolderKey[key]);
    setQueryKey(key);
    setQueryValue(undefined);
    const currentData = {
      ...searchCondition,
      searchKey: '',
    };
    setSearchCondition(currentData);
  };
  const handleQueryChange = (e: React.FormEvent<HTMLInputElement>, type?: 'onChange') => {
    const value = (e.target as HTMLInputElement).value;
    console.log('value-change', value, type);
    if (type === 'onChange') {
      setQueryValue(value);
      return;
    }
    if (value !== searchCondition.searchKey) {
      const currentData = {
        ...searchCondition,
        searchKey: value,
      };
      setSearchCondition(currentData);
      // customerDataTracker.trackCustomerSearch(CustomerSearchType.Search);
    }
  };
  const handlerContinentChange = (value: string) => {
    let list = baseSelect['area'].find(item => item.value === value);
    if (list && list.children && list.children.length) {
      setCountryOption(list.children);
    } else {
      setCountryOption([]);
    }
    const currentData = {
      ...searchCondition,
      continent: value,
      country: undefined,
    };
    setSearchCondition(currentData);
  };
  const handlerCountryChange = (value: string[]) => {
    let popCountry = value.splice(-1)[0];
    const currentData = {
      ...searchCondition,
      country: popCountry,
    };
    setSearchCondition(currentData);
  };
  const commmonChange = (
    type: 'star_level' | 'company_level' | 'source' | 'manager_id_list' | 'product_require_level_list' | 'require_product_type_list',
    value: SelectValue
  ) => {
    const currentData = {
      ...searchCondition,
      [type]: value,
    };
    setSearchCondition(currentData);
  };
  const selectAfter = (
    <Select
      showArrow={true}
      allowClear={false}
      value={queryKey}
      suffixIcon={<DownTriangle />}
      dropdownClassName="edm-selector-dropdown"
      defaultValue="company"
      onChange={handleKeyChange}
      className="select-after"
    >
      {searchKeyList.map((item, index) => {
        return (
          <Select.Option key={index} value={item.value}>
            {item.label}
          </Select.Option>
        );
      })}
    </Select>
  );
  return (
    <div ref={filterBlock} className={`${rest?.className || ''} ${style.searchBlock} customer-search-block`}>
      <Input
        style={{ width: 220, marginRight: '8px', verticalAlign: 'top' }}
        className="customer-input-select"
        value={queryValue}
        maxLength={100}
        max={100}
        addonBefore={selectAfter}
        placeholder={placeholder}
        prefix={<SearchIcon />}
        allowClear
        onPressEnter={handleQueryChange}
        onBlur={handleQueryChange}
        onChange={e => handleQueryChange(e, 'onChange')}
      />
      <RangePicker
        separator={' - '}
        style={{ width: 204, marginRight: '8px', verticalAlign: 'top' }}
        className={searchCondition.createTimeStart ? '' : 'edm-range-picker'}
        placeholder={[getIn18Text('CHUANGJIANSHIJIAN'), '']}
        locale={cnlocale}
        value={searchCondition.createTimeStart}
        format={dateShowFormat}
        suffixIcon={<RangeDate />}
        disabledDate={disabledDateFuture}
        onChange={onChangeCreateTime}
        dropdownClassName="edm-date-picker-dropdown-wrap"
      />
      <RangePicker
        separator={' - '}
        style={{ width: 204, verticalAlign: 'top' }}
        className={searchCondition.activeTimeStart ? '' : 'edm-range-picker'}
        placeholder={[getIn18Text('ZUIJINGENJINSHIJIAN'), '']}
        locale={cnlocale}
        value={searchCondition.activeTimeStart}
        format={dateShowFormat}
        suffixIcon={<RangeDate />}
        disabledDate={disabledDate}
        onChange={onChangeUpdateTime}
        dropdownClassName="edm-date-picker-dropdown-wrap"
      />
      <CollapseButton
        foldText={getIn18Text('ZHANKAISHAIXUAN')}
        unFoldText={getIn18Text('SHOUQISHAIXUAN')}
        expand={isExpand}
        onClick={() => {
          setIsExpand(!isExpand);
          onCollapse();
        }}
        className={style.paddingLeftButton}
      />
      <SearchCollapse expand={isExpand}>
        <Select
          showArrow={true}
          allowClear={true}
          style={{ width: 100, marginRight: '8px', verticalAlign: 'top' }}
          placeholder={getIn18Text('XUANZEZHOU')}
          dropdownClassName="edm-selector-dropdown"
          suffixIcon={<DownTriangle />}
          onChange={value => handlerContinentChange(value as string)}
        >
          {baseSelect &&
            baseSelect['area'] &&
            baseSelect['area'].map((item, index) => {
              return (
                <Select.Option key={index} value={item.value}>
                  {item.label}
                </Select.Option>
              );
            })}
        </Select>
        <Select
          showArrow={true}
          allowClear={true}
          value={country}
          mode="tags"
          style={{ width: 150, marginRight: '8px', verticalAlign: 'top' }}
          placeholder={getIn18Text('XUANZEGUOJIA')}
          dropdownClassName="edm-selector-dropdown"
          suffixIcon={<DownTriangle />}
          onChange={value => handlerCountryChange(value as string[])}
        >
          {countryOption.map((item, index) => {
            return (
              <Select.Option key={index} value={item.value}>
                {item.label}
              </Select.Option>
            );
          })}
        </Select>
        <Select
          maxTagCount={'responsive'}
          mode="multiple"
          showArrow={true}
          allowClear={true}
          style={{ width: 112, marginRight: '8px', verticalAlign: 'top' }}
          placeholder={getIn18Text('XUANZEKEHUXINGJI')}
          dropdownClassName="edm-selector-dropdown"
          suffixIcon={<DownTriangle />}
          onChange={e => commmonChange('star_level', e)}
        >
          {baseSelect &&
            baseSelect['star_level'].map((item, index) => {
              return (
                <Select.Option key={index} value={item.value}>
                  {item.label || getIn18Text('KONG(WEITIANXIE)')}
                </Select.Option>
              );
            })}
        </Select>
        <Select
          maxTagCount={'responsive'}
          mode="multiple"
          showArrow={true}
          allowClear={true}
          style={{ width: 112, marginRight: '8px', verticalAlign: 'top' }}
          placeholder={getIn18Text('XUANZEKEHUFENJI')}
          dropdownClassName="edm-selector-dropdown"
          suffixIcon={<DownTriangle />}
          onChange={e => commmonChange('company_level', e)}
        >
          {baseSelect &&
            baseSelect['company_level'].map((item, index) => {
              return (
                <Select.Option key={index} value={item.value}>
                  {item.label || getIn18Text('KONG(WEITIANXIE)')}
                </Select.Option>
              );
            })}
        </Select>
        <Select
          maxTagCount={'responsive'}
          mode="multiple"
          showArrow={true}
          allowClear={true}
          style={{ width: 112, marginRight: '8px', verticalAlign: 'top' }}
          placeholder={getIn18Text('XUANZEKEHULAIYUAN')}
          dropdownClassName="edm-selector-dropdown"
          suffixIcon={<DownTriangle />}
          onChange={e => commmonChange('source', e)}
        >
          {baseSelect &&
            baseSelect['company_source'].map((item, index) => {
              return (
                <Select.Option key={index} value={item.value}>
                  {item.label || getIn18Text('KONG(WEITIANXIE)')}
                </Select.Option>
              );
            })}
        </Select>
        <div style={{ marginTop: 16 }}>
          <Select
            maxTagCount={'responsive'}
            mode="multiple"
            showArrow={true}
            allowClear={true}
            style={{ width: 132, marginRight: '8px', verticalAlign: 'top' }}
            placeholder={getIn18Text('XUANZECHANPINXUQIUDU')}
            dropdownClassName="edm-selector-dropdown"
            suffixIcon={<DownTriangle />}
            onChange={e => commmonChange('product_require_level_list', e)}
          >
            {baseSelect &&
              baseSelect['company_product_require_level'].map((item, index) => {
                return (
                  <Select.Option key={index} value={item.value}>
                    {item.label || getIn18Text('KONG(WEITIANXIE)')}
                  </Select.Option>
                );
              })}
          </Select>
          <Select
            maxTagCount={'responsive'}
            mode="multiple"
            showArrow={true}
            allowClear={true}
            style={{ width: 132, marginRight: '8px', verticalAlign: 'top' }}
            placeholder={getIn18Text('XUANZEXUQIUCHANPINLEIXING')}
            dropdownClassName="edm-selector-dropdown"
            suffixIcon={<DownTriangle />}
            onChange={e => commmonChange('require_product_type_list', e)}
          >
            {baseSelect &&
              baseSelect['company_require_product_type'].map((item, index) => {
                return (
                  <Select.Option key={index} value={item.value}>
                    {item.label || getIn18Text('KONG(WEITIANXIE)')}
                  </Select.Option>
                );
              })}
          </Select>
          <span className={style.btnSetting} onClick={() => onSetting(true)}>
            {getIn18Text('BIAOTOUZIDUAN')} <TableSetting />
          </span>
        </div>
      </SearchCollapse>
    </div>
  );
};
export default Search;