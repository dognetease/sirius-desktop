import React, { useCallback } from 'react';
import classnames from 'classnames';
import style from './selector.module.scss';

export interface LabelColorSelectorProps {
  colors?: string[];
  value?: string;
  onChange?: (color: string) => void;
  className?: string;
}

const DEFAUL_COLORS = ['#6BA9FF', '#70CCAB', '#F7A87C', '#AA90F4', '#F77C7C', '#A8AAAD'];

export const LabelColorSelector = ({ colors = DEFAUL_COLORS, ...props }: LabelColorSelectorProps) => {
  const handleClick = useCallback(
    (color: string) => {
      if (props.value !== color) {
        props.onChange && props.onChange(color);
      }
    },
    [props.value]
  );

  return (
    <div className={classnames([style.selectorWrap, props.className])}>
      {colors.map(color => (
        <span
          key={color}
          role="checkbox"
          className={classnames([style.selectorOption, { [style.activeOption]: props.value === color }, props.value === color ? 'active' : ''])}
          onClick={() => handleClick(color)}
          style={{ background: color }}
        />
      ))}
    </div>
  );
};
