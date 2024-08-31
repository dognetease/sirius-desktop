import React, { useEffect, useRef, useState, useContext } from 'react';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import moment, { Moment } from 'moment';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import style from './search.module.scss';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { businessDataTracker, BusinessSearchType } from '../../../tracker/businessDataTracker';
import DatePicker from '../../../components/UI/DatePicker/datePicker';
import Select from '../../../components/UI/Select/customerSelect';
const { Option } = Select;
import { api, opportunityListReq, WorktableApi } from 'api';
const { RangePicker } = DatePicker;
const dateFormat = 'yyyy-MM-DD';
const dateShowFormat = 'yyyy/MM/DD';
import { customerContext } from '../../../customerContext';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { getIn18Text } from 'api';
const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;
type SearchConditionApi = Partial<opportunityListReq>;
function disabledDate(current: Moment) {
  return current && (current > moment().endOf('day') || current < moment('1900-01-01').endOf('day'));
}
function disabledDateFuture(current: Moment) {
  return current && current < moment('1900-01-01').endOf('day');
}
export interface SearchCondition {
  createTimeStart?: [Moment, Moment] | null;
  activeTimeStart?: [Moment, Moment] | null;
  key?: string;
  stage_list?: number[];
  manager_id_list?: string[];
}
interface optionProps {
  label: string;
  value: string;
}
interface comsProps {
  handerSearch?: (params: SearchConditionApi) => void;
  className?: string;
  isShowManager?: boolean;
}
const Search: React.FC<comsProps> = ({ handerSearch, className, isShowManager }) => {
  const { state } = useContext(customerContext).value;
  const { baseSelect } = state;
  const [isFirst, setIsFirst] = useState(true);
  console.log('customer-base', state);
  const filterBlock = useRef<HTMLDivElement>(null);
  const [searchCondition, setSearchCondition] = useState<SearchCondition>({
    createTimeStart: null,
    activeTimeStart: null,
  });
  const [searchKeyList] = useState<optionProps[]>([
    {
      label: getIn18Text('SHANGJI'),
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
    company: getIn18Text('QINGSHURUSHANGJIMINGCHENG'),
    email: getIn18Text('QINGSHURUYOUXIANG'),
    telephone: getIn18Text('QINGSHURUDIANHUA'),
    whats_app: getIn18Text('QINGSHURUWhatsApp'),
  });
  const [placeholder, setPlaceHolder] = useState<string>(getIn18Text('QINGSHURUSHANGJIMINGCHENG'));
  const [queryKey, setQueryKey] = useState<string | undefined>(undefined);
  const [queryValue, setQueryValue] = useState<string | undefined>(undefined);
  const [managerOptions, setManagerOptions] = useState<
    Array<{
      account_id: string;
      account_name: string;
      nick_name: string;
    }>
  >([]);
  /**
   *  销售阶段
   * */
  const clueChange = type => {
    businessDataTracker.trackClueSearch(BusinessSearchType.Stage);
    const currentDate = {
      ...searchCondition,
      stage_list: type,
    };
    setSearchCondition(currentDate);
  };
  const handleManagerChange = (ids: any) => {
    // businessDataTracker.trackClueSearch(BusinessSearchType.Stage);
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
    businessDataTracker.trackClueSearch(BusinessSearchType.Creattime);
  };
  const formateDate = () => {
    const { createTimeStart, activeTimeStart, key, ...rest } = searchCondition;
    const params = rest as SearchConditionApi;
    if (createTimeStart && createTimeStart.length) {
      params.create_at_begin = createTimeStart[0].format(dateFormat);
      params.create_at_end = createTimeStart[1].format(dateFormat);
    } else {
      params.create_at_begin = '';
      params.create_at_end = '';
    }
    if (activeTimeStart && activeTimeStart.length) {
      params.follow_at_begin = activeTimeStart[0].format(dateFormat);
      params.follow_at_end = activeTimeStart[1].format(dateFormat);
    } else {
      params.follow_at_begin = '';
      params.follow_at_end = '';
    }
    if (queryKey === 'email' || queryKey === 'telephone' || queryKey === 'whats_app' || queryKey === 'contactName') {
      params.contact_search_key = {
        blank: true,
        [queryKey]: key,
      };
      params.key = '';
    } else {
      params.key = key;
      params.contact_search_key = undefined;
    }
    // params.key = key;
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
    businessDataTracker.trackClueSearch(BusinessSearchType.UpdateTime);
  };
  const handleKeyChange = key => {
    setPlaceHolder(searchPlaceHolderKey[key]);
    setQueryKey(key);
    setQueryValue(undefined);
    const currentData = {
      ...searchCondition,
      key: '',
    };
    setSearchCondition(currentData);
  };
  const handleQueryChange = (e: React.FormEvent<HTMLInputElement>, type?: 'onChange') => {
    const value = (e.target as HTMLInputElement).value;
    if (type === 'onChange') {
      setQueryValue(value);
      return;
    }
    if (value !== searchCondition.key) {
      const currentDate = {
        ...searchCondition,
        key: value,
      };
      setSearchCondition(currentDate);
      businessDataTracker.trackClueSearch(BusinessSearchType.Search);
    }
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
    worktableApi.getAccountRange('COMMERCIAL').then(res => {
      setManagerOptions(res.principalInfoVOList);
    });
  };
  useEffect(() => {
    getOptions();
  }, []);
  const selectAfter = (
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
        className="customer-input-select"
        maxLength={100}
        max={100}
        value={queryValue}
        placeholder={placeholder}
        addonBefore={selectAfter}
        prefix={<SearchIcon />}
        allowClear
        onPressEnter={handleQueryChange}
        onBlur={handleQueryChange}
        onChange={e => handleQueryChange(e, 'onChange')}
      />
      <Select
        placeholder={getIn18Text('XIAOSHOUJIEDUAN')}
        allowClear={true}
        mode="multiple"
        showArrow={true}
        maxTagCount={'responsive'}
        style={{ width: 88, marginRight: '8px', verticalAlign: 'top' }}
        onChange={clueChange}
      >
        {baseSelect &&
          baseSelect['businessStages']
            ?.filter(item => item.value !== 7)
            .map((el, elIndex) => {
              return (
                <Option key={elIndex} value={el.value}>
                  {' '}
                  {el.label}
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
        style={{ width: 204, marginRight: '8px', verticalAlign: 'top' }}
        className={searchCondition.activeTimeStart ? '' : 'edm-range-picker'}
        placeholder={[getIn18Text('ZUIJINGENJINSHIJIAN'), '']}
        locale={cnlocale}
        value={searchCondition.activeTimeStart}
        format={dateShowFormat}
        disabledDate={disabledDate}
        onChange={onChangeUpdateTime}
      />
      {isShowManager !== false && (
        <Select
          maxTagCount={'responsive'}
          mode="multiple"
          showArrow={true}
          allowClear={true}
          style={{ width: 112, marginRight: '8px', verticalAlign: 'top' }}
          placeholder={getIn18Text('XUANZEFUZEREN')}
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
    </div>
  );
};
export default Search;
