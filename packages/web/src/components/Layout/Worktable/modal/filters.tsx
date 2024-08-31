import { DatePicker, Radio, RadioChangeEvent, Select } from 'antd';
import 'moment/locale/zh-cn';
import locale from 'antd/es/date-picker/locale/zh_CN';
import React, { ReactNode, useState, useEffect, CSSProperties, useRef } from 'react';
import moment, { Moment } from 'moment';
import { api, apis, CustomerApi, WorktableApi } from 'api';
import modalStyle from './modal.module.scss';
import filterStyle from './filters.module.scss';
import classnames from 'classnames';
import { getTransText } from '@/components/util/translate';
import { Select as CommonSelect } from '../../Customer/components/commonForm/Components';
import { getIn18Text } from 'api';

interface SelectOptionItem {
  label: string;
  value: string;
}

const customerApi = api.requireLogicalApi('customerApiImpl') as CustomerApi;
const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;

const disableDate = (current: Moment) => {
  return current && current > moment().endOf('day') && current < moment('1990-01-01');
};

export const customPickers = [
  {
    text: getIn18Text('JINTIAN'),
    onClick: () => {
      return [moment().startOf('day'), moment().endOf('day')];
    },
  },
  {
    text: getIn18Text('ZUOTIAN'),
    onClick: () => {
      return [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')];
    },
  },
  {
    text: getIn18Text('BENZHOU'),
    onClick: () => {
      const start = moment().startOf('week');
      const end = moment().endOf('week');
      return [start, end];
    },
  },
  {
    text: getIn18Text('SHANGZHOU'),
    onClick: () => {
      const start = moment().subtract(7, 'days').startOf('week');
      const end = moment().subtract(7, 'days').endOf('week');
      return [start, end];
    },
  },
  {
    text: getIn18Text('BENYUE'),
    onClick: () => {
      return [moment().startOf('month'), moment().endOf('month')];
    },
  },
  {
    text: getIn18Text('SHANGYUE'),
    onClick() {
      return [moment().subtract(1, 'months').startOf('month'), moment().subtract(1, 'months').endOf('month')];
    },
  },
  {
    text: getIn18Text('BENJIDU'),
    onClick() {
      return [moment().startOf('quarter'), moment().endOf('quarter')];
    },
  },
  {
    text: getIn18Text('SHANGJIDU'),
    onClick() {
      return [moment().subtract(1, 'quarters').startOf('quarter'), moment().subtract(1, 'quarters').endOf('quarter')];
    },
  },
];

export interface FilterProps {
  onChange?: (value: Record<string, string | string[]>) => void;
}

const dateFormat = 'YYYY-MM-DD';

export const TimeFilter: React.FC<
  {
    start: string;
    end: string;
    showLable?: boolean;
    containerStyles?: CSSProperties;
    popupContainer?: HTMLElement | null;
    onOpenChange?: (open: boolean) => void;
  } & FilterProps
> = props => {
  const { start, end, showLable = true, containerStyles = {}, popupContainer = document.body } = props;
  const [date, setDate] = useState<[Moment | null, Moment | null]>([moment(start).startOf('day'), moment(end).endOf('day')]);
  // const [isOpen, setIsOpen] = useState(false)
  useEffect(() => {
    setDate([moment(start).startOf('day'), moment(end).endOf('day')]);
  }, [start, end]);

  const handleClick = (dateRange: [Moment, Moment]) => {
    setDate(dateRange);
    props.onChange &&
      props.onChange({
        start_date: dateRange[0].format(dateFormat),
        end_date: dateRange[1].format(dateFormat),
      });
  };

  const panelRender = (originPanel: ReactNode) => {
    return (
      <div className={modalStyle.customDatepickerPanel}>
        <div className={modalStyle.leftSide}>
          {customPickers.map(item => (
            <div className={modalStyle.customPickerRange} key={item.text} onClick={() => handleClick(item.onClick() as [Moment, Moment])}>
              {item.text}
            </div>
          ))}
        </div>
        {originPanel}
      </div>
    );
  };
  const handleChange = (d: [Moment | null, Moment | null] | null) => {
    console.log(d?.map(d => (d ? d.format('YYYY-MM-DD') : 'null')));
    let dateRange: [Moment, Moment];
    if (d == null || d[0] === null || d[1] === null) {
      dateRange = [moment().startOf('month'), moment().endOf('month')];
    } else {
      dateRange = d as [Moment, Moment];
    }
    setDate(dateRange);
    props.onChange &&
      props.onChange({
        start_date: dateRange[0].format(dateFormat),
        end_date: dateRange[1].format(dateFormat),
      });
  };

  // useEffect(() => {
  //   if (!open) return
  //   setIsOpen(false)
  // }, [date])
  return (
    <div className={classnames([modalStyle.filterRow, modalStyle.timeFilter])} style={{ ...containerStyles }}>
      {showLable && <label>{getIn18Text('SHIJIANFANWEI\uFF1A')}</label>}
      <div className={modalStyle.filterItem}>
        <DatePicker.RangePicker
          onOpenChange={props.onOpenChange}
          getPopupContainer={() => popupContainer as HTMLElement}
          style={{ height: 32 }}
          separator="~"
          panelRender={panelRender}
          value={date}
          onChange={handleChange}
          allowClear={false}
          suffixIcon={null}
          dropdownClassName="edm-date-picker-dropdown-wrap"
          locale={locale}
          // open={isOpen}
          // onBlur={() => setIsOpen(false)}
          // onFocus={() => setIsOpen(true)}
        />
      </div>
    </div>
  );
};
export const CompanyFilter: React.FC<
  {
    star?: string[];
    level?: string[];
  } & FilterProps
> = props => {
  const [companyLevels, setCompanyLevels] = useState<SelectOptionItem[]>([]);
  const [starLevels, setStarLevels] = useState<SelectOptionItem[]>([]);
  const [starValue, setStarValue] = useState<string[]>(props.star || []);
  const [levelValue, setLevelValue] = useState<string[]>(props.level || []);
  useEffect(() => {
    setStarValue(props.star || []);
  }, [props.star]);
  useEffect(() => {
    setStarValue(props.level || []);
  }, [props.level]);
  useEffect(() => {
    customerApi.getBaseInfo().then(res => {
      setCompanyLevels(res.company_level.filter(i => i.label !== ''));
      setStarLevels(res.star_level.filter(i => i.label !== ''));
    });
  }, []);
  const handleStarLevelChange = (v: string[]) => {
    setStarValue(v);
    props.onChange &&
      props.onChange({
        star_level: v,
      });
  };
  const handleCompanyLevelChange = (v: string[]) => {
    setLevelValue(v);
    props.onChange &&
      props.onChange({
        company_level: v,
      });
  };
  return (
    <div className={modalStyle.filterRow}>
      <div>
        <label>{getIn18Text('SHUJUFANWEI\uFF1A')}</label>
      </div>
      <div className={modalStyle.filterItem}>
        <Select
          showSearch={false}
          placeholder={getIn18Text('GONGSIXINGJI')}
          value={starValue}
          onChange={handleStarLevelChange}
          mode="multiple"
          maxTagCount="responsive"
          allowClear
        >
          {starLevels.map(item => (
            <Select.Option value={item.value} key={item.value}>
              {item.label || ' '}
            </Select.Option>
          ))}
        </Select>
      </div>
      <div className={modalStyle.filterItem}>
        <Select
          allowClear
          placeholder={getIn18Text('KEHUFENJI')}
          value={levelValue}
          mode="multiple"
          onChange={handleCompanyLevelChange}
          maxTagCount="responsive"
          showSearch={false}
        >
          {companyLevels.map(item => (
            <Select.Option value={item.value} key={item.value}>
              {item.label || ' '}
            </Select.Option>
          ))}
        </Select>
      </div>
    </div>
  );
};

interface MemberFilterProps {
  resourceLabel?: string;
  memberIds?: string[];
  showLabel?: boolean;
  popupContainer?: HTMLElement | null;
  onOpenChange?: (open: boolean) => void;
  onChange?: (changes: { account_id_list: string[] | undefined }) => void;
  fetchOptionsList?: (cb: (list: { label: string; value: any }[]) => void) => void;
}
export const MemberFilter: React.FC<MemberFilterProps> = props => {
  const { memberIds, resourceLabel = 'CONTACT', showLabel = true, popupContainer = document.body } = props;
  const [options, setOptions] = useState<SelectOptionItem[]>([]);
  const [value, setValue] = useState<string[]>(memberIds || []);

  useEffect(() => {
    setValue(memberIds || []);
  }, [memberIds]);

  useEffect(() => {
    if (props.fetchOptionsList) return;
    worktableApi.getAccountRange(resourceLabel).then(res => {
      setOptions(
        res.principalInfoVOList.map(item => ({
          label: item.nick_name,
          value: item.account_id,
        }))
      );
    });
  }, [resourceLabel, props]);

  useEffect(() => {
    if (!props.fetchOptionsList) return;

    props.fetchOptionsList(list => {
      setOptions([...list]);
    });
  }, []);

  const handleChange = (ids: any) => {
    setValue(ids);
    props.onChange && props.onChange({ account_id_list: ids.length === 0 ? undefined : ids });
  };

  return (
    <div className={modalStyle.filterRow}>
      {showLabel && <label>{getIn18Text('RENYUANFANWEI\uFF1A')}</label>}
      <div>
        <CommonSelect
          style={{ width: 140 }}
          onDropdownVisibleChange={props.onOpenChange}
          getPopupContainer={() => popupContainer as HTMLElement}
          allowClear
          placeholder={typeof window !== 'undefined' ? getTransText('QUANBUCHENGYUAN') : ''}
          value={value}
          mode="multiple"
          options={options}
          onChange={handleChange}
          maxTagCount="responsive"
          showSearch={false}
          showArrow={true}
        />
      </div>
    </div>
  );
};

export const DateRangeSelectFilter: React.FC<{
  onChange?: (value: string) => void;
  popupContainer?: HTMLElement | null;
  onOpenChange?: (open: boolean) => void;
}> = props => {
  const { popupContainer = document.body } = props;

  const handleChange = (value: any) => {
    props.onChange && props.onChange(value);
  };

  return (
    <div className={filterStyle.filterContainer}>
      <CommonSelect
        defaultValue="THIS_WEEK"
        style={{ width: 118, height: 32 }}
        onChange={handleChange}
        getPopupContainer={() => popupContainer as HTMLElement}
        onDropdownVisibleChange={props.onOpenChange}
        options={[
          {
            value: 'TODAY',
            label: getTransText('JINTIAN'),
          },
          {
            value: 'THIS_WEEK',
            label: getTransText('BENZHOU'),
          },
          {
            value: 'THIS_MONTH',
            label: getTransText('BENYUE'),
          },
        ]}
      />
    </div>
  );
};

export const RadioGroupDay: React.FC<{
  onChange?: (value: number) => void;
}> = props => {
  const { onChange } = props;
  const handleChange = (e: RadioChangeEvent) => {
    onChange && onChange(e.target.value);
  };
  return (
    <Radio.Group onChange={handleChange} defaultValue={1} className={filterStyle.radioGroup}>
      <Radio.Button value={1}>{getTransText('JINTIAN')}</Radio.Button>
      <Radio.Button value={3}>{getTransText('JINSANTIAN')}</Radio.Button>
      <Radio.Button value={7}>{getTransText('JINQITIAN')}</Radio.Button>
    </Radio.Group>
  );
};
