declare type TabPosition = 'left' | 'right' | 'top' | 'bottom';
interface TabNavListProps {
  id: string;
  tabPosition: TabPosition;
  activeKey: string;
  rtl: boolean;
  panes: React.ReactNode;
  animated?: AnimatedConfig;
  extra?: TabBarExtraContent;
  editable?: EditableConfig;
  moreIcon?: React.ReactNode;
  moreTransitionName?: string;
  mobile: boolean;
  tabBarGutter?: number;
  renderTabBar?: RenderTabBar;
  className?: string;
  style?: React.CSSProperties;
  locale?: TabsLocale;
  onTabClick: (activeKey: string, e: React.MouseEvent | React.KeyboardEvent) => void;
  onTabScroll?: OnTabScroll;
  children?: (node: React.ReactElement) => React.ReactElement;
}
interface EditableConfig {
  onEdit: (
    type: 'add' | 'remove',
    info: {
      key?: string;
      event: React.MouseEvent | React.KeyboardEvent;
    }
  ) => void;
  showAdd?: boolean;
  removeIcon?: React.ReactNode;
  addIcon?: React.ReactNode;
}
interface TabsLocale {
  dropdownAriaLabel?: string;
  removeAriaLabel?: string;
  addAriaLabel?: string;
}
declare type OnTabScroll = (info: { direction: 'left' | 'right' | 'top' | 'bottom' }) => void;
declare type TabBarExtraMap = Partial<Record<TabBarExtraPosition, React.ReactNode>>;
declare type TabBarExtraPosition = 'left' | 'right';
declare type TabBarExtraContent = React.ReactNode | TabBarExtraMap;
declare type RenderTabBarProps = {
  id: string;
  activeKey: string;
  animated: AnimatedConfig;
  tabPosition: TabPosition;
  rtl: boolean;
  mobile: boolean;
  editable: EditableConfig;
  locale: TabsLocale;
  moreIcon: React.ReactNode;
  moreTransitionName: string;
  tabBarGutter: number;
  onTabClick: (key: string, e: React.MouseEvent | React.KeyboardEvent) => void;
  onTabScroll: OnTabScroll;
  extra: TabBarExtraContent;
  style: React.CSSProperties;
  panes: React.ReactNode;
};
declare type RenderTabBar = (props: RenderTabBarProps, DefaultTabBar: React.ComponentType<TabNavListProps>) => React.ReactElement;
interface RcTabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  prefixCls?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  id?: string;
  activeKey?: string;
  defaultActiveKey?: string;
  direction?: 'ltr' | 'rtl';
  animated?: boolean | AnimatedConfig;
  renderTabBar?: RenderTabBar;
  tabBarExtraContent?: TabBarExtraContent;
  tabBarGutter?: number;
  tabBarStyle?: React.CSSProperties;
  tabPosition?: TabPosition;
  destroyInactiveTabPane?: boolean;
  onChange?: (activeKey: string) => void;
  onTabClick?: (activeKey: string, e: React.KeyboardEvent | React.MouseEvent) => void;
  onTabScroll?: OnTabScroll;
  editable?: EditableConfig;
  locale?: TabsLocale;
  moreIcon?: React.ReactNode;
  /** @private Internal usage. Not promise will rename in future */
  moreTransitionName?: string;
}
interface AnimatedConfig {
  inkBar?: boolean;
  tabPane?: boolean;
}
declare type TabsType = 'line' | 'card' | 'editable-card';
declare type TabsPosition = 'top' | 'right' | 'bottom' | 'left';
declare type SizeType = 'small' | 'middle' | 'large' | undefined;
export interface TabsProps extends Omit<RcTabsProps, 'editable'> {
  type?: TabsType;
  size?: SizeType;
  hideAdd?: boolean;
  centered?: boolean;
  addIcon?: React.ReactNode;
  onEdit?: (e: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => void;
}
export interface TabPaneProps {
  tab?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  children?: React.ReactNode;
  forceRender?: boolean;
  closable?: boolean;
  closeIcon?: React.ReactNode;
  prefixCls?: string;
  tabKey?: string;
  id?: string;
  animated?: boolean;
  active?: boolean;
  destroyInactiveTabPane?: boolean;
}
