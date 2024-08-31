import React, { PropsWithChildren, useMemo } from 'react';
import { Breadcrumb, BreadcrumbProps } from 'antd';
import classNames from 'classnames';
import { ReactComponent as SeparatorIcon } from '@web-site/images/separator.svg';
import style from './style.module.scss';

function CustomBreadcrumb(props: PropsWithChildren<BreadcrumbProps>) {
  const { children, className, ...restProps } = props;

  const classes = useMemo(() => classNames(style.breadcrumb, className), [className]);

  return (
    <Breadcrumb separator={<SeparatorIcon />} className={classes} {...restProps}>
      {children}
    </Breadcrumb>
  );
}

type ICustomBreadcrumbComp = React.FC<BreadcrumbProps> & {
  Item: typeof Breadcrumb.Item;
  Separator: typeof Breadcrumb.Separator;
};

const CustomBreadcrumbComp = CustomBreadcrumb as ICustomBreadcrumbComp;
CustomBreadcrumbComp.Item = Breadcrumb.Item;
CustomBreadcrumbComp.Separator = Breadcrumb.Separator;

export default CustomBreadcrumbComp;
