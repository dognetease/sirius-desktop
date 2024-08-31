import React, { useEffect, useRef, useState, useContext } from 'react';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import moment, { Moment } from 'moment';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { clueDataTracker, ClueSearchType } from '../../../tracker/clueDataTracker';
import DatePicker from '../../../components/UI/DatePicker/datePicker';
import Select from '../../../components/UI/Select/customerSelect';
const { Option } = Select;
import { api, newMyClueListReq, WorktableApi } from 'api';
const { RangePicker } = DatePicker;
const dateFormat = 'yyyy-MM-DD';
const dateShowFormat = 'yyyy/MM/DD';
import { customerContext } from '../../../customerContext';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import style from './search.module.scss';
import SearchCollapse from '../../../components/searchCollapse/SearchCollapse';
import CollapseButton from '../../../components/collapseButton/CollapseButton';
import { getIn18Text } from 'api';
const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;
type SearchConditionApi = Partial<newMyClueListReq>;
function disabledDate(current: Moment) {
  return current && (current > moment().endOf('day') || current < moment('1900-01-01').endOf('day'));
}
function disabledDateFuture(current: Moment) {
  return current && current < moment('1900-01-01').endOf('day');
}
interface optionProps {
  label: string;
  value: string;
}
export interface SearchCondition {
  createTimeStart?: [Moment, Moment] | null;
  activeTimeStart?: [Moment, Moment] | null;
  name?: string;
  status_list?: number[];
  create_type_list?: number[];
  searchKey: string;
  clue_batch_list?: string[];
  manager_id_list?: string[];
  continent?: string;
  country: string[];
}
interface comsProps {
  handerSearch?: (params: SearchConditionApi) => void;
  onCollapse?: (expand: boolean) => void;
  className?: string;
  isShowManager?: boolean;
}
const Search: React.FC<comsProps> = ({ handerSearch, className, onCollapse, isShowManager }) => {
  const { state } = useContext(customerContext).value;
  const { baseSelect } = state;
  const [isFirst, setIsFirst] = useState(true);
  const [isExpand, setIsExpand] = useState<boolean>(false);
  const filterBlock = useRef<HTMLDivElement>(null);
  const [searchCondition, setSearchCondition] = useState<SearchCondition>({
    createTimeStart: null,
    activeTimeStart: null,
    searchKey: '',
    country: [],
  });
  const [searchKeyList] = useState<optionProps[]>([
    {
      label: getIn18Text('XIANSUO'),
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
    company: getIn18Text('QINGSHURUXIANSUOMINGCHENG'),
    email: getIn18Text('QINGSHURUYOUXIANG'),
    telephone: getIn18Text('QINGSHURUDIANHUA'),
    whats_app: getIn18Text('QINGSHURUwhatsApp'),
  });
  const [placeholder, setPlaceHolder] = useState<string>(getIn18Text('QINGSHURUXIANSUOMINGCHENG'));
  const [queryKey, setQueryKey] = useState<string | undefined>(undefined);
  const [queryValue, setQueryValue] = useState<string | undefined>(undefined);
  const [managerOptions, setManagerOptions] = useState<
    Array<{
      account_id: string;
      account_name: string;
      nick_name: string;
    }>
  >([]);
  const [country, setCountry] = useState<string[]>([]);
  const [countryOption, setCountryOption] = useState<optionProps[]>([]);
  const clueChange = type => {
    const currentDate = {
      ...searchCondition,
      status_list: type,
    };
    setSearchCondition(currentDate);
    clueDataTracker.trackClueSearch(ClueSearchType.Status);
  };
  const createTypeChange = type => {
    const currentDate = {
      ...searchCondition,
      create_type_list: type,
    };
    setSearchCondition(currentDate);
    clueDataTracker.trackClueSearch(ClueSearchType.CreateType);
  };
  const handleManagerChange = (ids: any) => {
    const newCondition = {
      ...searchCondition,
      manager_id_list: ids,
    };
    setSearchCondition(newCondition);
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
    clueDataTracker.trackClueSearch(ClueSearchType.Creattime);
  };
  const formateDate = () => {
    const { createTimeStart, activeTimeStart, searchKey, status_list, create_type_list, clue_batch_list, manager_id_list, continent, country } = searchCondition;
    const params = {} as SearchConditionApi;
    if (createTimeStart && createTimeStart.length) {
      params.enter_time_start = createTimeStart[0].format(dateFormat);
      params.enter_time_end = createTimeStart[1].format(dateFormat);
    } else {
      params.enter_time_start = '';
      params.enter_time_end = '';
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
      params.name = '';
    } else {
      params.name = searchKey;
      params.contact_search_key = undefined;
    }
    params.status_list = status_list;
    params.create_type_list = create_type_list;
    params.clue_batch_list = clue_batch_list;
    params.manager_id_list = manager_id_list;
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
    clueDataTracker.trackClueSearch(ClueSearchType.UpdateTime);
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
    if (type === 'onChange') {
      setQueryValue(value);
      return;
    }
    if (value !== searchCondition.searchKey) {
      const currentDate = {
        ...searchCondition,
        searchKey: value,
      };
      setSearchCondition(currentDate);
      clueDataTracker.trackClueSearch(ClueSearchType.Search);
    }
  };
  const handleClueBatchChange = (values: any) => {
    const currentData = {
      ...searchCondition,
      clue_batch_list: values,
    };
    setSearchCondition(currentData);
    clueDataTracker.trackClueSearch(ClueSearchType.ClueBatchList);
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
  const getOptions = () => {
    worktableApi.getAccountRange('CHANNEL').then(res => {
      setManagerOptions(res.principalInfoVOList);
    });
  };
  useEffect(() => {
    getOptions();
  }, []);
  const addonBefore = (
    <Select
      showArrow={true}
      allowClear={false}
      value={queryKey}
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
    <div ref={filterBlock} className={`${className} ${style.searchBlock} customer-search-block`}>
      <Input
        style={{ width: 220, marginRight: '8px' }}
        maxLength={100}
        className="customer-input-select"
        max={100}
        value={queryValue}
        placeholder={placeholder}
        addonBefore={addonBefore}
        prefix={<SearchIcon />}
        allowClear
        onPressEnter={handleQueryChange}
        onBlur={handleQueryChange}
        onChange={e => handleQueryChange(e, 'onChange')}
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
          baseSelect['clue_status'].map((el, elIndex) => {
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
        placeholder={[getIn18Text('JINRUSIHAISHIJIAN'), '']}
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
        placeholder={[getIn18Text('ZUIJINGENJINSHIJIAN'), '']}
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
          placeholder={getIn18Text('XIANSUOPICI')}
          showArrow={true}
          mode="multiple"
          allowClear={true}
          maxTagCount={'responsive'}
          style={{ width: 88, marginRight: '8px', verticalAlign: 'top' }}
          onChange={handleClueBatchChange}
        >
          {baseSelect &&
            baseSelect['clue_batch'].map(el => {
              return (
                <Option key={el.value} value={el.value}>
                  <EllipsisTooltip>{el.label}</EllipsisTooltip>
                </Option>
              );
            })}
        </Select>
        {isShowManager !== false && (
          <Select
            maxTagCount={'responsive'}
            mode="multiple"
            showArrow={true}
            allowClear={true}
            style={{ width: 112, marginRight: '8px', verticalAlign: 'top' }}
            placeholder={getIn18Text('QINGXUANZEFUZEREN')}
            dropdownClassName="edm-selector-dropdown"
            suffixIcon={<DownTriangle />}
            value={searchCondition.manager_id_list}
            onChange={handleManagerChange}
          >
            {managerOptions &&
              managerOptions.map((item, index) => {
                return (
                  <Select.Option key={index} value={item.account_id}>
                    {item.nick_name}
                  </Select.Option>
                );
              })}
          </Select>
        )}
        <Select
          showArrow={true}
          allowClear={true}
          style={{ width: 150, marginRight: '8px', verticalAlign: 'top' }}
          placeholder={getIn18Text('QINGXUANZEZHOU')}
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
