import React, { useState, useEffect, ReactNode } from 'react';
import styles from './index.module.scss';
import { Checkbox, Input, message, Tag } from 'antd';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import classnames from 'classnames';
import { ReactComponent as CrossIcon } from '../../assets/crossIcon.svg';
import { getIn18Text } from 'api';
const { Option } = Select;
export interface ICheckboxSelectProps {
  options: {
    checked: boolean;
    label: string;
    id: number;
  }[];
  addGroup: (label: string, checked: boolean) => void;
  checkOption: (label: string, checked: boolean) => void;
  uncheckAll: () => void;
  loading?: boolean;
  placeholder?: string;
  dropdownClassName?: string;
  disabled?: boolean;
  getPopupContainer?: () => HTMLElement;
}
export function CheckboxSelect(props: ICheckboxSelectProps) {
  const { options, addGroup, checkOption, uncheckAll, placeholder = '可多选分组，若不选择默认进入[未分组]', dropdownClassName = '', disabled, getPopupContainer } = props;
  const [isEditNewGroup, setIsEditNewGroup] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [checkCreateLabel, setCheckCreateLabel] = useState(true);
  useEffect(() => {
    setSelectedValues(options.filter(el => el.checked).map(el => el.label));
  }, [options]);
  const inputNewGroup = () => {
    const val = newGroupLabel;
    if (val.length === 0) {
      return;
    }
    if (options.length && options.some(({ label }) => label === val)) {
      message.error(getIn18Text('CUNZAIXIANGTONGMINGCHENGDEFENZU\uFF0CQINGXIUGAI'));
      return;
    }
    addGroup(val, checkCreateLabel);
    setIsEditNewGroup(false);
    setSelectedValues(preState => [...preState, val]);
    setNewGroupLabel('');
  };
  const tagRender = (props: any) => {
    const { closable, onClose, value } = props;
    const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
    };
    return (
      <Tag
        onMouseDown={onPreventMouseDown}
        closable={closable}
        onClose={() => {
          setSelectedValues(preState => preState.filter(val => val !== value));
          checkOption(value, false);
          onClose();
        }}
        style={{ marginRight: 3 }}
        key={value}
      >
        {value}
      </Tag>
    );
  };
  const cancelInput = () => {
    setIsEditNewGroup(false);
  };
  const dropdownRender = (options: ReactNode) => (
    <div className={classnames(styles.option, dropdownClassName)}>
      {options}
      {isEditNewGroup ? (
        <div className={styles.optionInput}>
          <Checkbox
            checked={checkCreateLabel}
            onChange={e => {
              setCheckCreateLabel(e.target.checked);
            }}
          ></Checkbox>
          <Input
            className={styles.optionInputReal}
            onPressEnter={inputNewGroup}
            value={newGroupLabel}
            maxLength={20}
            onChange={e => setNewGroupLabel(e.target.value)}
            placeholder={getIn18Text('MARKET_CONTACT_GROUP_NAME_PLACEHOLDER')}
            suffix={
              <div className={styles.optionInputSuffix}>
                <div
                  onClick={inputNewGroup}
                  className={classnames(styles.optionInputSuffixOk, {
                    [styles.disabled]: newGroupLabel.length === 0,
                  })}
                >
                  {getIn18Text('QUEDING')}
                </div>
                <div onClick={cancelInput} className={styles.optionInputSuffixCancel}>
                  {getIn18Text('QUXIAO')}
                </div>
              </div>
            }
          />
        </div>
      ) : (
        <div className={styles.optionAdd} onClick={() => setIsEditNewGroup(true)}>
          <CrossIcon />
          <span>{getIn18Text('XINJIANFENZU')}</span>
        </div>
      )}
    </div>
  );
  const toggleCheck = (label: string, checked: boolean) => {
    if (checked) {
      const s = new Set(selectedValues);
      s.add(label);
      setSelectedValues([...s]);
    } else {
      setSelectedValues(preState => {
        return preState.filter(val => val !== label);
      });
    }
    checkOption(label, checked);
  };
  return (
    <div>
      <Select
        value={selectedValues}
        style={{ width: '100%' }}
        mode="multiple"
        allowClear
        showArrow
        disabled={disabled}
        showSearch={false}
        maxTagCount="responsive"
        dropdownRender={dropdownRender}
        tagRender={tagRender}
        onClear={() => {
          setSelectedValues([]);
          uncheckAll();
        }}
        placeholder={placeholder}
        className={styles.select}
        onDropdownVisibleChange={open => {
          if (!open && newGroupLabel.length === 0) {
            setIsEditNewGroup(false);
          }
        }}
        getPopupContainer={getPopupContainer || (() => document.body)}
      >
        {options.map(({ checked, label }) => {
          return (
            <Option value={label} key={label} title={label}>
              <Checkbox
                className={styles.selectOverflow}
                checked={checked}
                onChange={e => {
                  toggleCheck(label, e.target.checked);
                }}
              >
                {label}
              </Checkbox>
            </Option>
          );
        })}
      </Select>
    </div>
  );
}
