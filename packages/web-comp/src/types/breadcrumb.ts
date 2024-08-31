interface Route {
  path: string;
  breadcrumbName: string;
  children?: Omit<Route, 'children'>[];
}
export interface BreadcrumbProps {
  prefixCls?: string;
  routes?: Route[];
  params?: any;
  separator?: React.ReactNode;
  itemRender?: (route: Route, params: any, routes: Array<Route>, paths: Array<string>) => React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}
declare const Placements: ['topLeft', 'topCenter', 'topRight', 'bottomLeft', 'bottomCenter', 'bottomRight'];
declare type Placement = (typeof Placements)[number];
declare type Align = {
  points?: [string, string];
  offset?: [number, number];
  targetOffset?: [number, number];
  overflow?: {
    adjustX?: boolean;
    adjustY?: boolean;
  };
  useCssRight?: boolean;
  useCssBottom?: boolean;
  useCssTransform?: boolean;
};
declare type OverlayFunc = () => React.ReactElement;
interface DropDownProps {
  arrow?: boolean;
  trigger?: ('click' | 'hover' | 'contextMenu')[];
  overlay: React.ReactElement | OverlayFunc;
  onVisibleChange?: (visible: boolean) => void;
  visible?: boolean;
  disabled?: boolean;
  destroyPopupOnHide?: boolean;
  align?: Align;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  prefixCls?: string;
  className?: string;
  transitionName?: string;
  placement?: Placement;
  overlayClassName?: string;
  overlayStyle?: React.CSSProperties;
  forceRender?: boolean;
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  openClassName?: string;
}

export interface BreadcrumbItemProps {
  prefixCls?: string;
  separator?: React.ReactNode;
  href?: string;
  overlay?: DropDownProps['overlay'];
  dropdownProps?: DropDownProps;
  onClick?: React.MouseEventHandler<HTMLAnchorElement | HTMLSpanElement>;
  className?: string;
}
