import React, { MouseEventHandler } from 'react';
import classnames from 'classnames';
import { Checkbox } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox';
import CustomerIcon from '@/images/customer.svg';
import ArrowRight from '@web-common/components/UI/Icons/svgs/disk/ArrowRight';
import style from './labelItem.module.scss';

interface LabelItemProps {
  name: string;
  count: number;
  checked?: boolean;
  checkable?: boolean;
  onCheckedChange?: (event: CheckboxChangeEvent) => void;
  disabled?: boolean;
  onClick?: MouseEventHandler;
}

const LabelItem: React.FC<LabelItemProps> = props => {
  const { name, count, checked, checkable, onCheckedChange, disabled, onClick } = props;

  return (
    <div
      className={classnames(style.labelItem, {
        [style.disabled]: disabled,
      })}
      onClick={event => !disabled && onClick && onClick(event)}
    >
      {checkable && <Checkbox checked={checked} onClick={event => event.stopPropagation()} disabled={disabled} onChange={onCheckedChange} />}
      <img className={style.labelIcon} src={CustomerIcon} alt={name} />
      <span className={style.ellipsis}>
        <span className={style.name}>{name}</span>
        <span className={style.count}>{count}</span>
      </span>
      <ArrowRight />
    </div>
  );
};

LabelItem.defaultProps = {};

export default LabelItem;
export { LabelItemProps };
