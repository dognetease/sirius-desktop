import React, { useEffect, useRef, useState, useContext } from 'react';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import moment, { Moment } from 'moment';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { openSeaDataTracker, OpenSearchType } from '../../../tracker/openSeaDataTracker';
import DatePicker from '../../../components/UI/DatePicker/datePicker';
import Select from '../../../components/UI/Select/customerSelect';
const { Option } = Select;
import { openSeaReq } from 'api';
const { RangePicker } = DatePicker;
const dateFormat = 'yyyy-MM-DD';
const dateShowFormat = 'yyyy/MM/DD';
import { customerContext } from '../../../customerContext';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import style from './search.module.scss';
import CollapseButton from '../../../components/collapseButton/CollapseButton';
import SearchCollapse from '../../../components/searchCollapse/SearchCollapse';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { getIn18Text } from 'api';
type SearchConditionApi = Partial<openSeaReq>;
function disabledDate(current) {
  return current && (current > moment().endOf('day') || current < moment('1900-01-01').endOf('day'));
}
function disabledDateFuture(current) {
  return current && current < moment('1900-01-01').endOf('day');
}
const TO_CUSTOMER_VALUE = 4;
export interface SearchCondition {
  createTimeStart?: [Moment, Moment] | null;
  activeTimeStart?: [Moment, Moment] | null;
  name?: string;
  status_list?: number[];
  create_type_list?: number[];
  continent?: string;
  country: string[];
}
interface comsProps {
  handerSearch?: (params: SearchConditionApi) => void;
  className?: string;
  onCollapse?: (expand: boolean) => void;
}
interface optionProps {
  label: string;
  value: string;
}
const Search: React.FC<comsProps> = ({ handerSearch, className, onCollapse }) => {
  const { state } = useContext(customerContext).value;
  const { baseSelect } = state;
  const [isFirst, setIsFirst] = useState(true);
  const [isExpand, setIsExpand] = useState<boolean>(false);
  const [country, setCountry] = useState<string[]>([]);
  const [countryOption, setCountryOption] = useState<optionProps[]>([]);
  console.log('customer-base', state);
  const filterBlock = useRef<HTMLDivElement>(null);
  const [searchCondition, setSearchCondition] = useState<SearchCondition>({
    createTimeStart: null,
    activeTimeStart: null,
    name: '',
    country: [],
  });
  const clueChange = type => {
    const currentDate = {
      ...searchCondition,
      status_list: type,
    };
    setSearchCondition(currentDate);
    openSeaDataTracker.trackOpenSeaSearch(OpenSearchType.Status);
  };
  const createTypeChange = type => {
    const currentDate = {
      ...searchCondition,
      create_type_list: type,
    };
    setSearchCondition(currentDate);
    openSeaDataTracker.trackOpenSeaSearch(OpenSearchType.CreateType);
  };
  /**
   * 最近创建时间
   */
  const onChangeCreateTime = (values: any, formatString: [string, string]) => {
    const currentDate = {
      ...searchCondition,
      createTimeStart: values,
    };
    setSearchCondition(currentDate);
    openSeaDataTracker.trackOpenSeaSearch(OpenSearchType.Creattime);
  };
  const formateDate = () => {
    const { createTimeStart, activeTimeStart, name, status_list, create_type_list, continent, country } = searchCondition;
    const params = {} as SearchConditionApi;
    if (createTimeStart && createTimeStart.length) {
      params.create_time_start = createTimeStart[0].format(dateFormat);
      params.create_time_end = createTimeStart[1].format(dateFormat);
    } else {
      params.create_time_start = '';
      params.create_time_end = '';
    }
    if (activeTimeStart && activeTimeStart.length) {
      params.return_time_start = activeTimeStart[0].format(dateFormat);
      params.return_time_end = activeTimeStart[1].format(dateFormat);
    } else {
      params.return_time_start = '';
      params.return_time_end = '';
    }
    params.clue_name = name;
    params.clue_status_list = status_list;
    params.clue_create_type_list = create_type_list;
    params.continent = continent;
    params.country = country[0];
    setCountry(country);
    console.log('clue-param', params);
    if (typeof handerSearch === 'function') {
      handerSearch(params);
    }
    // 参数变更就会请求接口数据
  };
  /**
   * 最近来往时间
   */
  const onChangeUpdateTime = (values: any, formatString: [string, string]) => {
    const currentDate = {
      ...searchCondition,
      activeTimeStart: values,
    };
    setSearchCondition(currentDate);
    openSeaDataTracker.trackOpenSeaSearch(OpenSearchType.Creattime);
  };
  const handleQueryChange = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    console.log('search1', value);
    if (value !== searchCondition.name) {
      const currentDate = {
        ...searchCondition,
        name: value,
      };
      setSearchCondition(currentDate);
      openSeaDataTracker.trackOpenSeaSearch(OpenSearchType.Search);
    }
  };
  const handlerContinentChange = (value: string) => {
    console.log('continent', value);
    let list = baseSelect['area'].find(item => item.value === value);
    if (list && list.children && list.children.length) {
      setCountryOption(list.children);
    } else {
      setCountryOption([]);
    }
    const currentData = {
      ...searchCondition,
      continent: value,
      country: [],
    };
    setSearchCondition(currentData);
  };
  const handlerCountryChange = (value: string[]) => {
    let popCountry = value.splice(-1);
    const currentData = {
      ...searchCondition,
      country: popCountry,
    };
    setSearchCondition(currentData);
  };
  /**
   * 查询
   */
  useEffect(() => {
    if (isFirst) {
      setIsFirst(false);
    } else {
      formateDate();
    }
  }, [searchCondition]);
  return (
    <div ref={filterBlock} className={`${className} customer-search-block`}>
      <Input
        style={{ width: 188, marginRight: '8px' }}
        maxLength={100}
        max={100}
        placeholder={getIn18Text('QINGSHURUXIANSUOMINGCHENG')}
        prefix={<SearchIcon />}
        allowClear
        onPressEnter={handleQueryChange}
        onBlur={handleQueryChange}
        onChange={e => e && e.target && e.type === 'click' && handleQueryChange(e)}
      />
      <Select
        placeholder={getIn18Text('XIANSUOZHUANGTAI')}
        showArrow={true}
        mode="multiple"
        allowClear={true}
        maxTagCount={'responsive'}
        style={{ width: 88, marginRight: '8px', verticalAlign: 'top' }}
        onChange={clueChange}
      >
        {baseSelect &&
          baseSelect['clue_status']
            .filter(item => item.value !== TO_CUSTOMER_VALUE)
            .map((el, elIndex) => {
              return (
                <Option key={elIndex} value={el.value}>
                  <EllipsisTooltip>{el.label}</EllipsisTooltip>
                </Option>
              );
            })}
      </Select>

      <Select
        placeholder={getIn18Text('CHUANGJIANFANGSHI')}
        onChange={createTypeChange}
        maxTagCount={'responsive'}
        mode="multiple"
        showArrow={true}
        allowClear={true}
        style={{ width: 88, marginRight: '8px', verticalAlign: 'top' }}
      >
        {baseSelect &&
          baseSelect['create_type'].map((el, elIndex) => {
            return (
              <Option key={elIndex} value={el.value}>
                <EllipsisTooltip>{el.label}</EllipsisTooltip>
              </Option>
            );
          })}
      </Select>
      <RangePicker
        separator={' - '}
        style={{ width: 204, marginRight: '8px', verticalAlign: 'top' }}
        className={searchCondition.createTimeStart ? '' : 'edm-range-picker'}
        placeholder={[getIn18Text('CHUANGJIANSHIJIAN'), '']}
        locale={cnlocale}
        value={searchCondition.createTimeStart}
        format={dateShowFormat}
        disabledDate={disabledDateFuture}
        onChange={onChangeCreateTime}
      />
      <RangePicker
        separator={' - '}
        style={{ width: 204, verticalAlign: 'top' }}
        className={searchCondition.activeTimeStart ? '' : 'edm-range-picker'}
        placeholder={[getIn18Text('TUIHUISHIJIAN'), '']}
        locale={cnlocale}
        value={searchCondition.activeTimeStart}
        format={dateShowFormat}
        disabledDate={disabledDate}
        onChange={onChangeUpdateTime}
      />
      <CollapseButton
        foldText={getIn18Text('ZHANKAISHAIXUAN')}
        unFoldText={getIn18Text('SHOUQISHAIXUAN')}
        expand={isExpand}
        onClick={() => {
          setIsExpand(!isExpand);
          onCollapse && onCollapse(!isExpand);
        }}
        className={style.paddingLeftButton}
      />
      <SearchCollapse expand={isExpand}>
        <Select
          showArrow={true}
          allowClear={true}
          style={{ width: 150, marginRight: '8px', verticalAlign: 'top' }}
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
      </SearchCollapse>
    </div>
  );
};
export default Search;
