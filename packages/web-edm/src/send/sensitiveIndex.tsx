import React from 'react';
import classnames from 'classnames';
import SensitiveIndexIcon from '@/images/icons/edm/sensitive-index.png';
import style from './sensitiveIndex.module.scss';

interface SensitiveIndexProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const SensitiveIndex: React.FC<SensitiveIndexProps> = props => (
  <div
    className={classnames(style.sensitiveIndex, props.className)}
    style={{
      backgroundImage: `url(${SensitiveIndexIcon})`,
      ...props.style,
    }}
  >
    <span>{props.children}</span>
  </div>
);

SensitiveIndex.defaultProps = {
  style: {},
};

export default SensitiveIndex;
