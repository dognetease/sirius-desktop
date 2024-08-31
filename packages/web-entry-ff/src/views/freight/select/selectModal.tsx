import React, { useState, useCallback, useMemo } from 'react';
import { Dropdown, DropDownProps, Input, Menu } from 'antd';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import { useDebounce } from 'ahooks';
import style from './style.module.scss';

interface SelectItem {
  label: string | React.ReactNode;
  value: string;
}

export interface Props extends DropDownProps {
  name: string | React.ReactNode;
  options?: SelectItem[];
  placeholder?: string;
  value?: string;
  fillter?: boolean;
  onChange?: (value: string, item: SelectItem) => void;
}

export const SelectModal: React.FC<Props> = props => {
  const { name, options = [], value, placeholder = '请选择', fillter = true, onChange, overlay, ...restProps } = props;

  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, { wait: 500 });

  const current = useMemo(() => {
    return options.find(item => item.value === value);
  }, [options, value]);

  const items = useMemo(() => {
    const searchVal = debouncedSearch.toLowerCase();
    return options
      .filter(item => {
        return !debouncedSearch || String(item.label).toLowerCase().includes(searchVal) || String(item.value).toLowerCase().includes(searchVal);
      })
      .slice(0, 200)
      .map(item => ({
        key: item.value,
        label: <div className={style.selectItem}>{item.label}</div>,
      }));
  }, [options, debouncedSearch]);

  const dropdownRender = useCallback(() => {
    return (
      <div className={style.selectDropdown}>
        {fillter && (
          <div
            className={style.selectSearch}
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <Input prefix={<SearchOutlined />} allowClear placeholder="模糊搜索" onChange={({ target: { value } }) => setSearchValue(value)} />
          </div>
        )}
        <div className={style.selectDropdownContent}>
          <Menu>
            {items.map(item => (
              <Menu.Item onClick={() => onMenuSelect(item.key)}>{item.label}</Menu.Item>
            ))}
          </Menu>
        </div>
      </div>
    );
  }, [items, fillter]);

  const onMenuSelect = useCallback(
    (key: string) => {
      const item = options.find(item => item.value === key);
      if (onChange) {
        onChange(key, item as SelectItem);
      }
    },
    [options]
  );

  // const onClear = (e: React.MouseEvent<HTMLElement>) => {
  //   e.stopPropagation();
  //   e.preventDefault();
  //   if (onChange) {
  //     onChange('', {} as SelectItem);
  //   }
  // }

  return (
    <div>
      <Dropdown {...restProps} overlay={dropdownRender()} trigger={['click']}>
        <div className={`${style.valueCard} ${current?.value ? style.hasValue : ''}`}>
          {/* <div className={style.clearIcon} onClick={onClear}>
            <CloseOutlined />
          </div> */}
          <div className={style.label}>{name}</div>
          <div className={style.value}>{current?.value ? current.label : <div className={style.placeholder}>{placeholder}</div>}</div>
        </div>
      </Dropdown>
    </div>
  );
};
