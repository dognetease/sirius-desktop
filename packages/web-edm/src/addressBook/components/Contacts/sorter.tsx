import React from 'react';
import classnames from 'classnames';
// import { EnhanceSelect as Select, InSingleOption as Option } from '@web-common/components/UI/Select';
import { EnhanceSelect as Select, InSingleOption as Option } from '@lingxi-common-component/sirius-ui/Select';
import { getTransText } from '@/components/util/translate';
import style from './sorter.module.scss';

export type SorterValue = {
  field: string;
  direction: string;
};

export interface SorterProps {
  className?: string;
  value: SorterValue | undefined;
  onChange: (value: SorterValue | undefined) => void;
  [propName: string]: any;
}

export interface SorterOption extends SorterValue {
  name: string;
}

const options: SorterOption[] = [
  {
    name: getTransText('ANCHUANGJIANSHIJIANPAIXU'),
    field: 'createTime',
    direction: 'DESC',
  },
  {
    name: getTransText('ANYOUXIANGHOUZHUIPAIXU'),
    field: 'contactEmailSuffix',
    direction: 'ASC',
  },
  {
    name: getTransText('ANXIANGTONGGONGSIPAIXU'),
    field: 'contactCompanyName',
    direction: 'DESC',
  },
];

const Sorter: React.FC<SorterProps> = props => {
  const { className, value, onChange, ...restProps } = props;

  return (
    <Select
      className={classnames(style.sorter, className)}
      placeholder={getTransText('BIAOGEPAIXU')}
      value={value?.field}
      allowClear
      dropdownMatchSelectWidth={false}
      onChange={nextField => {
        if (!nextField) return onChange(undefined);

        const nextOption = options.find(option => option.field === nextField);

        if (nextOption) {
          onChange({
            field: nextOption.field,
            direction: nextOption.direction,
          });
        }
      }}
      {...restProps}
    >
      {options.map(option => (
        <Option value={option.field}>{option.name}</Option>
      ))}
    </Select>
  );
};

export default Sorter;
