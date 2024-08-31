import React, { useState, useEffect, ReactNode } from 'react';
import styles from './index.module.scss';
import { Checkbox, Input, message, Tag } from 'antd';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import classnames from 'classnames';
import { ReactComponent as CrossIcon } from '../../assets/crossIcon.svg';
import { getIn18Text } from 'api';
import { useUpdateEffect } from 'ahooks';
const { Option } = Select;

interface CheckboxSelectOptions {
  label: string;
  id: number;
}
export interface ICheckboxSelectProps {
  options: CheckboxSelectOptions[];
  addGroup: (label: string) => Promise<CheckboxSelectOptions>;
  defaultCheckedValues?: number[];
  checkOption: (item: CheckboxSelectOptions, checked: boolean) => void;
  uncheckAll: () => void;
  loading?: boolean;
  placeholder?: string;
  dropdownClassName?: string;
  onChange?: (args: number[]) => void;
  onAsyncChange?: (args: number[]) => void;
  getPopupContainer?: () => HTMLElement;
}
export function CheckboxSelect(props: ICheckboxSelectProps) {
  const {
    options,
    addGroup,
    checkOption,
    defaultCheckedValues = [],
    onChange: onSelectChanged,
    onAsyncChange: onSelectAsyncChanged,
    uncheckAll,
    placeholder = '可多选分组，若不选择默认进入[未分组]',
    dropdownClassName = '',
    getPopupContainer,
  } = props;
  const [isEditNewGroup, setIsEditNewGroup] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [selectedValues, setSelectedValues] = useState<number[]>([]);
  const [checkCreateLabel, setCheckCreateLabel] = useState(true);
  useEffect(() => {
    setSelectedValues(args => {
      return [...args, ...defaultCheckedValues];
    });
  }, [defaultCheckedValues.length]);

  const inputNewGroup = async () => {
    const val = newGroupLabel;
    if (val.length === 0) {
      return;
    }
    if (options.length && options.some(({ label }) => label === val)) {
      message.error(getIn18Text('CUNZAIXIANGTONGMINGCHENGDEFENZU\uFF0CQINGXIUGAI'));
      return;
    }
    const createdGroup = await addGroup(val);
    setIsEditNewGroup(false);
    if (checkCreateLabel) {
      setSelectedValues(preState => [...preState, createdGroup.id]);
    }
    setNewGroupLabel('');
  };
  const tagRender = (props: any) => {
    const { closable, onClose, value, label } = props;
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
          checkOption({ id: value, label }, false);
          onClose();
        }}
        style={{ marginRight: 3 }}
        key={value}
      >
        {label}
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
            onChange={e => setNewGroupLabel(e.target.value.slice(0, 20))}
            placeholder={getIn18Text('QINGSHURUFENZUMINGCHENG')}
            maxLength={20}
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
  const toggleCheck = (item: CheckboxSelectOptions, checked: boolean) => {
    const s = new Set(selectedValues);
    if (checked) {
      s.add(item.id);
      setSelectedValues([...s]);
    } else {
      s.delete(item.id);
      setSelectedValues([...s]);
    }
    checkOption(item, checked);
  };

  useEffect(() => {
    onSelectChanged && onSelectChanged(selectedValues);
  }, [selectedValues.length]);

  useUpdateEffect(() => {
    onSelectAsyncChanged && onSelectAsyncChanged(selectedValues);
  }, [selectedValues.length]);
  return (
    <div>
      <Select
        value={selectedValues}
        style={{ width: '100%' }}
        mode="multiple"
        allowClear
        showArrow
        // disabled={disabled}
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
        {options.map(item => {
          return (
            <Option value={item.id} key={item.id} title={item.label}>
              {/* <Option value={item.id} key={item.label} title={item.label}> */}
              <Checkbox
                checked={selectedValues.includes(item.id)}
                onChange={e => {
                  toggleCheck(item, e.target.checked);
                }}
              >
                {item.label}
              </Checkbox>
            </Option>
          );
        })}
      </Select>
    </div>
  );
}
