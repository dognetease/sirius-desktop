import React from 'react';
declare type LiteralUnion<T extends U, U> = T | (U & {});
declare type SizeType = 'small' | 'middle' | 'large' | undefined;
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix' | 'type'> {
  prefixCls?: string;
  size?: SizeType;
  type?: LiteralUnion<
    | 'button'
    | 'checkbox'
    | 'color'
    | 'date'
    | 'datetime-local'
    | 'email'
    | 'file'
    | 'hidden'
    | 'image'
    | 'month'
    | 'number'
    | 'password'
    | 'radio'
    | 'range'
    | 'reset'
    | 'search'
    | 'submit'
    | 'tel'
    | 'text'
    | 'time'
    | 'url'
    | 'week',
    string
  >;
  onPressEnter?: React.KeyboardEventHandler<HTMLInputElement>;
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  allowClear?: boolean;
  bordered?: boolean;
}
interface AutoSizeType {
  minRows?: number;
  maxRows?: number;
}
interface ShowCountProps {
  formatter: (args: { count: number; maxLength?: number }) => string;
}
declare type HTMLTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
interface RcTextAreaProps extends HTMLTextareaProps {
  prefixCls?: string;
  className?: string;
  style?: React.CSSProperties;
  autoSize?: boolean | AutoSizeType;
  onPressEnter?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  onResize?: (size: { width: number; height: number }) => void;
}
export interface TextAreaProps extends RcTextAreaProps {
  allowClear?: boolean;
  bordered?: boolean;
  showCount?: boolean | ShowCountProps;
  size?: SizeType;
}
interface InputFocusOptions extends FocusOptions {
  cursor?: 'start' | 'end' | 'all';
}
interface ITextAreaProps extends HTMLTextareaProps {
  prefixCls?: string;
  className?: string;
  style?: React.CSSProperties;
  autoSize?: boolean | AutoSizeType;
  onPressEnter?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  onResize?: (size: { width: number; height: number }) => void;
}
interface TextAreaState {
  value: any;
}
declare class ResizableTextArea extends React.Component<ITextAreaProps, TextAreaState> {
  nextFrameActionId: number;
  resizeFrameId: number;
  constructor(props: ITextAreaProps);
  textArea: HTMLTextAreaElement;
  saveTextArea: (textArea: HTMLTextAreaElement) => void;
  componentDidUpdate(prevProps: ITextAreaProps): void;
  handleResize: (size: { width: number; height: number }) => void;
  resizeOnNextFrame: () => void;
  resizeTextarea: () => void;
  componentWillUnmount(): void;
  fixFirefoxAutoScroll(): void;
  renderTextArea: () => JSX.Element;
  render(): JSX.Element;
}
export interface TextAreaRef {
  focus: (options?: InputFocusOptions) => void;
  blur: () => void;
  resizableTextArea?: ResizableTextArea;
}
interface InputState {
  value: any;
  focused: boolean;
  /** `value` from prev props */
  prevValue: any;
}
export interface GroupProps {
  className?: string;
  size?: 'large' | 'small' | 'default';
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onMouseEnter?: React.MouseEventHandler<HTMLSpanElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLSpanElement>;
  onFocus?: React.FocusEventHandler<HTMLSpanElement>;
  onBlur?: React.FocusEventHandler<HTMLSpanElement>;
  prefixCls?: string;
  compact?: boolean;
}
export interface SearchProps extends InputProps {
  inputPrefixCls?: string;
  onSearch?: (value: string, event?: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLInputElement>) => void;
  enterButton?: React.ReactNode;
  loading?: boolean;
}
export interface PasswordProps extends InputProps {
  readonly inputPrefixCls?: string;
  readonly action?: string;
  visibilityToggle?: boolean;
  iconRender?: (visible: boolean) => React.ReactNode;
}
declare const ClearableInputType: ['text', 'input'];
interface BasicProps {
  prefixCls: string;
  inputType: (typeof ClearableInputType)[number];
  value?: any;
  allowClear?: boolean;
  element: React.ReactElement;
  handleReset: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  direction?: DirectionType;
  focused?: boolean;
  readOnly?: boolean;
  bordered: boolean;
}
/** This props only for input. */
interface ClearableInputProps extends BasicProps {
  size?: SizeType;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
  triggerFocus?: () => void;
}
declare const Password: React.ForwardRefExoticComponent<PasswordProps & React.RefAttributes<any>>;
declare const Search: React.ForwardRefExoticComponent<SearchProps & React.RefAttributes<SiriusInput>>;
declare const Group: React.FC<GroupProps>;
declare const TextArea: React.ForwardRefExoticComponent<TextAreaProps & React.RefAttributes<TextAreaRef>>;
declare type DirectionType = 'ltr' | 'rtl' | undefined;
declare class ClearableLabeledInput extends React.Component<ClearableInputProps> {
  /** @private Do Not use out of this class. We do not promise this is always keep. */
  private containerRef;
  onInputMouseUp: React.MouseEventHandler;
  renderClearIcon(prefixCls: string): JSX.Element | null;
  renderSuffix(prefixCls: string): JSX.Element | null;
  renderLabeledIcon(prefixCls: string, element: React.ReactElement): JSX.Element;
  renderInputWithLabel(prefixCls: string, labeledElement: React.ReactElement): JSX.Element;
  renderTextAreaWithClearIcon(prefixCls: string, element: React.ReactElement): JSX.Element;
  render(): JSX.Element;
}
interface CSPConfig {
  nonce?: string;
}
declare const renderEmpty: (componentName?: string | undefined) => React.ReactNode;
declare type RenderEmptyHandler = typeof renderEmpty;
declare type RequiredMark = boolean | 'optional';
interface ConfigConsumerProps {
  getTargetContainer?: () => HTMLElement;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  rootPrefixCls?: string;
  iconPrefixCls?: string;
  getPrefixCls: (suffixCls?: string, customizePrefixCls?: string) => string;
  renderEmpty: RenderEmptyHandler;
  csp?: CSPConfig;
  autoInsertSpaceInButton?: boolean;
  input?: {
    autoComplete?: string;
  };
  locale?: Locale;
  pageHeader?: {
    ghost: boolean;
  };
  direction?: DirectionType;
  space?: {
    size?: SizeType | number;
  };
  virtual?: boolean;
  dropdownMatchSelectWidth?: boolean;
  form?: {
    requiredMark?: RequiredMark;
  };
}
declare class SiriusInput extends React.Component<InputProps, InputState> {
  static Group: typeof Group;
  static Search: typeof Search;
  static TextArea: typeof TextArea;
  static Password: typeof Password;
  static defaultProps: {
    type: string;
  };
  input: HTMLInputElement;
  clearableInput: ClearableLabeledInput;
  removePasswordTimeout: any;
  direction: DirectionType;
  constructor(props: InputProps);
  static getDerivedStateFromProps(nextProps: InputProps, { prevValue }: InputState): Partial<InputState>;
  componentDidMount(): void;
  componentDidUpdate(): void;
  getSnapshotBeforeUpdate(prevProps: InputProps): null;
  componentWillUnmount(): void;
  focus: (option?: InputFocusOptions | undefined) => void;
  blur(): void;
  setSelectionRange(start: number, end: number, direction?: 'forward' | 'backward' | 'none'): void;
  select(): void;
  saveClearableInput: (input: ClearableLabeledInput) => void;
  saveInput: (input: HTMLInputElement) => void;
  onFocus: React.FocusEventHandler<HTMLInputElement>;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
  setValue(value: string, callback?: () => void): void;
  handleReset: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  renderInput: (prefixCls: string, size: SizeType | undefined, bordered: boolean, input?: ConfigConsumerProps['input']) => JSX.Element;
  clearPasswordValueAttribute: () => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  renderComponent: ({ getPrefixCls, direction, input }: ConfigConsumerProps) => JSX.Element;
  render(): JSX.Element;
}
