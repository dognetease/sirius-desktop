import React, { MouseEventHandler } from 'react';
import classnames from 'classnames';
import ArrowRight from '@web-common/components/UI/Icons/svgs/disk/ArrowRight';
import style from './breadcrumb.module.scss';

interface BreadcrumbProps {
  className?: string;
  list: {
    key?: string;
    name: string;
    highlight?: boolean;
    onClick?: MouseEventHandler;
  }[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = props => {
  const { className, list } = props;

  return (
    <div className={classnames(style.breadcrumb, className)}>
      {(list || []).map((item, index) => (
        <React.Fragment key={item.key || index}>
          <div
            className={classnames(style.breadcrumbItem, {
              [style.highlight]: item.highlight,
            })}
            onClick={item.onClick}
          >
            {item.name}
          </div>
          {index !== (list || []).length - 1 && <ArrowRight />}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumb;
