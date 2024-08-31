import React from 'react';
import { ProductTagEnum, ProductVersionId } from 'api';
import classNames from 'classnames';
import styles from './productAuthTag.module.scss';
import { useGetProductAuth, useShouldProductAuthTagDisplay } from '@web-common/hooks/useGetProductAuth';
import { getIn18Text } from 'api';
export interface ProductAuthTagProps extends React.HTMLAttributes<HTMLSpanElement | HTMLDivElement> {
  // 权限标签名称
  tagName: ProductTagEnum | ProductTagEnum[];
  // 权限标签显示类型 flow:右上角悬浮 bar: 提示栏
  type?: 'flow' | 'bar';
  // 限制显示tag的版本 例如有些bar类型的tag只在免费版显示
  limitProductId?: ProductVersionId;
  // 提示文字
  tipText?: string;
  // 主要是绝对定位的位置 默认是右上角
  flowTipStyle?: React.CSSProperties;
}
const ProductAuthTag: React.FC<ProductAuthTagProps> = ({
  tagName,
  type = 'flow',
  tipText = getIn18Text('XIANSHITIYAN'),
  children,
  flowTipStyle,
  limitProductId,
  ...attr
}) => {
  const { className, ...rest } = attr;
  const tagShow = useShouldProductAuthTagDisplay(tagName);
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();
  if (limitProductId !== undefined && limitProductId !== productVersionId) {
    return <span {...attr}>{children}</span>;
  }
  if (tagShow) {
    if (type === 'bar') {
      return (
        <div className={classNames(styles.tagWrapperBar, className)} {...attr} style={flowTipStyle}>
          {children}
          {tipText}
        </div>
      );
    }
    if (type === 'flow') {
      return (
        <span className={classNames(styles.tagWrapperFlow, className)} {...rest}>
          {children}
          <span className={classNames(styles.tagEntity)} style={flowTipStyle}>
            {tipText}
          </span>
        </span>
      );
    }
  }
  return <span {...attr}>{children}</span>;
};
interface WithProductAuthTagProps {
  authTagProps: ProductAuthTagProps;
}
export function withProductAuthTag<T = {}>(WrappedComponent: React.ComponentType<T>) {
  const ComponentWithProductAuthTag = (props: T & WithProductAuthTagProps) => {
    const { authTagProps, ...rest } = props;
    // eslint-disable-next-line react/jsx-props-no-spreading
    return (
      <ProductAuthTag {...authTagProps}>
        <WrappedComponent {...(rest as unknown as T)} />
      </ProductAuthTag>
    );
  };
  return ComponentWithProductAuthTag;
}
export default ProductAuthTag;
