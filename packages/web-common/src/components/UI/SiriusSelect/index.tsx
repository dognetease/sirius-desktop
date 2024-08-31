import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import { Select } from 'antd';
import { SelectProps, SelectValue } from 'antd/lib/select';
import styles from './index.module.scss';

interface SiriusSelectProps extends SelectProps<SelectValue> {
  label?: string;
  onChange?: (value: any) => void;
  defaultValue?: any;
  options: Array<{
    label: string;
    value: any;
  }>;
  labelClass?: any;
  overClass?: any;
  wrapClass?: any;
}

const SiriusSelect: React.FC<SiriusSelectProps> = ({ label, defaultValue, overClass, labelClass, wrapClass, options, onChange, size = 'small', ...restProps }) => {
  const [value, setValue] = useState<number>(defaultValue);
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);
  return (
    <div className={classnames(styles.siriusSelectWrap, wrapClass)}>
      {label && <div className={classnames(styles.siriusSelectLabel, labelClass)}>{label}</div>}
      <Select
        {...restProps}
        size={size}
        onChange={value => {
          onChange && onChange(value);
          setValue(value);
        }}
        className={classnames(styles.siriusSelectContent, overClass)}
        listItemHeight={30}
        suffixIcon={<i className={`dark-invert ${styles.siriusSelectSuffixIcon}`} />}
        dropdownClassName={`ant-allow-dark ${styles.siriusSelectDropDown}`}
        value={value}
      >
        {options.map(r => (
          <Select.Option className={styles.siriusSelectOption} key={r.value} value={r.value}>
            {r.label}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
};
export default SiriusSelect;
