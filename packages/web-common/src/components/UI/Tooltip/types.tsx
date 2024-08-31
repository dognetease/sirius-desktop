declare type RenderFunction = () => React.ReactNode;
declare type LiteralUnion<T extends U, U> = T | (U & {});
declare type ElementOf<T> = T extends (infer E)[] ? E : T extends readonly (infer F)[] ? F : never;
declare const PresetColorTypes: ['pink', 'red', 'yellow', 'orange', 'cyan', 'green', 'blue', 'purple', 'geekblue', 'magenta', 'volcano', 'gold', 'lime'];
declare type PresetColorType = ElementOf<typeof PresetColorTypes>;
declare type ActionType = string;
declare type AlignPoint = string;
declare type BuildInPlacements = Record<string, AlignType>;
interface AlignType {
  /**
   * move point of source node to align with point of target node.
   * Such as ['tr','cc'], align top right point of source node with center point of target node.
   * Point can be 't'(top), 'b'(bottom), 'c'(center), 'l'(left), 'r'(right) */
  points?: AlignPoint[];
  /**
   * offset source node by offset[0] in x and offset[1] in y.
   * If offset contains percentage string value, it is relative to sourceNode region.
   */
  offset?: number[];
  /**
   * offset target node by offset[0] in x and offset[1] in y.
   * If targetOffset contains percentage string value, it is relative to targetNode region.
   */
  targetOffset?: number[];
  /**
   * If adjustX field is true, will adjust source node in x direction if source node is invisible.
   * If adjustY field is true, will adjust source node in y direction if source node is invisible.
   */
  overflow?: {
    adjustX?: boolean | number;
    adjustY?: boolean | number;
  };
  /**
   * Whether use css right instead of left to position
   */
  useCssRight?: boolean;
  /**
   * Whether use css bottom instead of top to position
   */
  useCssBottom?: boolean;
  /**
   * Whether use css transform instead of left/top/right/bottom to position if browser supports.
   * Defaults to false.
   */
  useCssTransform?: boolean;
  ignoreShake?: boolean;
}
declare type MotionEvent = (TransitionEvent | AnimationEvent) & {
  deadline?: boolean;
};
declare type MotionName =
  | string
  | {
      appear?: string;
      enter?: string;
      leave?: string;
      appearActive?: string;
      enterActive?: string;
      leaveActive?: string;
    };
declare type MotionPrepareEventHandler = (element: HTMLElement) => Promise<any> | void;
declare type MotionEventHandler = (element: HTMLElement, event: MotionEvent) => React.CSSProperties | void;
declare type MotionEndEventHandler = (element: HTMLElement, event: MotionEvent) => boolean | void;
interface CSSMotionProps {
  motionName?: MotionName;
  visible?: boolean;
  motionAppear?: boolean;
  motionEnter?: boolean;
  motionLeave?: boolean;
  motionLeaveImmediately?: boolean;
  motionDeadline?: number;
  /**
   * Create element in view even the element is invisible.
   * Will patch `display: none` style on it.
   */
  forceRender?: boolean;
  /**
   * Remove element when motion end. This will not work when `forceRender` is set.
   */
  removeOnLeave?: boolean;
  leavedClassName?: string;
  /** @private Used by CSSMotionList. Do not use in your production. */
  eventProps?: object;
  onAppearPrepare?: MotionPrepareEventHandler;
  onEnterPrepare?: MotionPrepareEventHandler;
  onLeavePrepare?: MotionPrepareEventHandler;
  onAppearStart?: MotionEventHandler;
  onEnterStart?: MotionEventHandler;
  onLeaveStart?: MotionEventHandler;
  onAppearActive?: MotionEventHandler;
  onEnterActive?: MotionEventHandler;
  onLeaveActive?: MotionEventHandler;
  onAppearEnd?: MotionEndEventHandler;
  onEnterEnd?: MotionEndEventHandler;
  onLeaveEnd?: MotionEndEventHandler;
  /** This will always trigger after final visible changed. Even if no motion configured. */
  onVisibleChanged?: (visible: boolean) => void;
  internalRef?: React.Ref<any>;
  children?: (
    props: {
      visible?: boolean;
      className?: string;
      style?: React.CSSProperties;
      [key: string]: any;
    },
    ref: (node: any) => void
  ) => React.ReactElement;
}
declare type TransitionNameType = string;
declare type AnimationType = string;
interface MobileConfig {
  /** Set popup motion. You can ref `rc-motion` for more info. */
  popupMotion?: CSSMotionProps;
  popupClassName?: string;
  popupStyle?: React.CSSProperties;
  popupRender?: (originNode: React.ReactNode) => React.ReactNode;
}
interface TriggerProps {
  children: React.ReactElement;
  action?: ActionType | ActionType[];
  showAction?: ActionType[];
  hideAction?: ActionType[];
  getPopupClassNameFromAlign?: (align: AlignType) => string;
  onPopupVisibleChange?: (visible: boolean) => void;
  afterPopupVisibleChange?: (visible: boolean) => void;
  popup: React.ReactNode | (() => React.ReactNode);
  popupStyle?: React.CSSProperties;
  prefixCls?: string;
  popupClassName?: string;
  className?: string;
  popupPlacement?: string;
  builtinPlacements?: BuildInPlacements;
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  zIndex?: number;
  focusDelay?: number;
  blurDelay?: number;
  getPopupContainer?: (node: HTMLElement) => HTMLElement;
  getDocument?: (element?: HTMLElement) => HTMLDocument;
  forceRender?: boolean;
  destroyPopupOnHide?: boolean;
  mask?: boolean;
  maskClosable?: boolean;
  onPopupAlign?: (element: HTMLElement, align: AlignType) => void;
  popupAlign?: AlignType;
  popupVisible?: boolean;
  defaultPopupVisible?: boolean;
  autoDestroy?: boolean;
  stretch?: string;
  alignPoint?: boolean;
  /** Set popup motion. You can ref `rc-motion` for more info. */
  popupMotion?: CSSMotionProps;
  /** Set mask motion. You can ref `rc-motion` for more info. */
  maskMotion?: CSSMotionProps;
  /** @deprecated Please us `popupMotion` instead. */
  popupTransitionName?: TransitionNameType;
  /** @deprecated Please us `popupMotion` instead. */
  popupAnimation?: AnimationType;
  /** @deprecated Please us `maskMotion` instead. */
  maskTransitionName?: TransitionNameType;
  /** @deprecated Please us `maskMotion` instead. */
  maskAnimation?: string;
  /**
   * @private Get trigger DOM node.
   * Used for some component is function component which can not access by `findDOMNode`
   */
  getTriggerDOMNode?: (node: React.ReactInstance) => HTMLElement;
  /** @private Bump fixed position at bottom in mobile.
   * This is internal usage currently, do not use in your prod */
  mobile?: MobileConfig;
}
interface RcTooltipProps extends Pick<TriggerProps, 'onPopupAlign' | 'builtinPlacements'> {
  trigger?: ActionType | ActionType[];
  defaultVisible?: boolean;
  visible?: boolean;
  placement?: string;
  /** @deprecated Use `motion` instead */
  transitionName?: string;
  /** @deprecated Use `motion` instead */
  animation?: AnimationType;
  /** Config popup motion */
  motion?: TriggerProps['popupMotion'];
  onVisibleChange?: (visible: boolean) => void;
  afterVisibleChange?: (visible: boolean) => void;
  overlay: (() => React.ReactNode) | React.ReactNode;
  overlayStyle?: React.CSSProperties;
  overlayClassName?: string;
  prefixCls?: string;
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  getTooltipContainer?: (node: HTMLElement) => HTMLElement;
  destroyTooltipOnHide?:
    | boolean
    | {
        keepParent?: boolean;
      };
  align?: AlignType;
  arrowContent?: React.ReactNode;
  id?: string;
  children?: React.ReactElement;
  popupVisible?: boolean;
  overlayInnerStyle?: React.CSSProperties;
  zIndex?: number;
}
declare type TooltipPlacement =
  | 'top'
  | 'left'
  | 'right'
  | 'bottom'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | 'leftTop'
  | 'leftBottom'
  | 'rightTop'
  | 'rightBottom';
declare const Placements: BuildInPlacements;
interface AdjustOverflow {
  adjustX?: 0 | 1;
  adjustY?: 0 | 1;
}
interface AbstractTooltipProps extends Partial<Omit<RcTooltipProps, 'children'>> {
  style?: React.CSSProperties;
  className?: string;
  color?: LiteralUnion<PresetColorType, string>;
  placement?: TooltipPlacement;
  builtinPlacements?: typeof Placements;
  openClassName?: string;
  arrowPointAtCenter?: boolean;
  autoAdjustOverflow?: boolean | AdjustOverflow;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  children?: React.ReactNode;
}
interface TooltipPropsWithOverlay extends AbstractTooltipProps {
  title?: React.ReactNode | RenderFunction;
  overlay: React.ReactNode | RenderFunction;
}
interface TooltipPropsWithTitle extends AbstractTooltipProps {
  title: React.ReactNode | RenderFunction;
  overlay?: React.ReactNode | RenderFunction;
}
export declare type TooltipProps = TooltipPropsWithTitle | TooltipPropsWithOverlay;
