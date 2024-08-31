import React from 'react';
import classnames, { Argument as ClassnamesType } from 'classnames';
import style from './label.module.scss';
import EllipsisTooltip from '../ellipsisTooltip/ellipsisTooltip';
import { getLabelStyle } from '../../utils/utils';

interface LabelProps {
  className?: ClassnamesType;
  name: string;
  color: string;
  maxWidth?: number | string;
  backgroundColor?: string;
  deletable?: boolean;
  clickable?: boolean;
  onDelete?: () => void;
  onClick?: () => void;
  style?: any;
}

const Label: React.FC<LabelProps> = props => {
  const { className, name, color, maxWidth, deletable, onDelete, clickable, onClick } = props;
  const innerStyle = props.style || {};

  const backgroundColor = props.backgroundColor ? props.backgroundColor : (getLabelStyle('', color).backgroundColor as unknown as string);

  return (
    <span
      className={classnames(style.label, className, {
        [style.deletable]: deletable,
        [style.labelNoHidden]: maxWidth === 'initial',
      })}
      style={{
        ...innerStyle,
        color,
        maxWidth,
        backgroundColor,
        cursor: clickable ? 'pointer' : 'auto',
      }}
      onClick={onClick}
    >
      <EllipsisTooltip
        className={classnames({
          [style.noEllipsis]: maxWidth === 'initial',
        })}
      >
        {name}
      </EllipsisTooltip>
      {deletable && (
        <span
          className={style.deleteTrigger}
          onClick={event => {
            event.stopPropagation();
            onDelete && onDelete();
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="20" height="20" rx="2" fill={backgroundColor} />
            <path d="M7.5 12.5L10 10M10 10L7.5 7.5M10 10L12.5 12.5M10 10L12.5 7.5" stroke={color} stroke-linejoin="round" />
          </svg>
        </span>
      )}
    </span>
  );
};

Label.defaultProps = {
  maxWidth: 66,
  deletable: false,
};

export default Label;
