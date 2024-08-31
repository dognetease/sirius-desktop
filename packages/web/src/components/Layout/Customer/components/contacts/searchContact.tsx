import React, { useEffect, useMemo, useState } from 'react';
import { Select } from 'antd';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import classnames from 'classnames';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import style from './contacts.module.scss';
import { getIn18Text } from 'api';
export interface SearchContactProps {
  // key: string; // 'email' 'whats_app' 'telephone'
  // query: string;
  onSearch: (search: Record<string, string>) => void;
  searchParams?: Record<string, string>;
}
const SearchKeyOptions = [
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
];
const placeholders: Record<string, string> = {
  company: getIn18Text('QINGSHURUGONGSIMINGCHENG'),
  email: getIn18Text('QINGSHURUYOUXIANG'),
  telephone: getIn18Text('QINGSHURUDIANHUA'),
  whats_app: getIn18Text('QINGSHURUwhatsApp'),
};
export const SearchContact = (props: SearchContactProps) => {
  const { onSearch, searchParams } = props;
  const [key, setKey] = useState('email');
  const [text, setText] = useState<string>('');
  const handleKeyChange = (value: string) => {
    setText('');
    setKey(value);
    onSearch({ [value]: '' });
  };
  const handleQueryChange = () => {
    const params = { [key]: text };
    onSearch(params);
  };
  useEffect(() => {
    if (!searchParams) {
      setText('');
    }
  }, [searchParams]);
  const placeholder = useMemo(() => placeholders[key], [key]);
  const selectAfter = useMemo(
    () => (
      <Select
        showArrow
        allowClear={false}
        value={key}
        suffixIcon={<DownTriangle />}
        dropdownClassName="edm-selector-dropdown"
        onChange={handleKeyChange}
        className={classnames('select-after', style.noBorderSelect)}
        options={SearchKeyOptions}
      />
    ),
    [key, handleKeyChange]
  );
  return (
    <div className={style.searchContactWrap}>
      <Input
        style={{ width: 220, marginRight: '8px', verticalAlign: 'top' }}
        className="customer-input-select"
        value={text}
        maxLength={100}
        max={100}
        addonBefore={selectAfter}
        placeholder={placeholder}
        prefix={<SearchIcon />}
        allowClear
        onBlur={() => handleQueryChange()}
        onPressEnter={() => handleQueryChange()}
        onChange={e => setText(e.target.value)}
      />
    </div>
  );
};
