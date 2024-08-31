import * as React from 'react';
import { useState, useImperativeHandle, useContext, useEffect } from 'react';
import classNames from 'classnames';
import pickAttrs from 'rc-util/lib/pickAttrs';
import KeyCode from 'rc-util/lib/KeyCode';
import type { LabelValueType, DisplayLabelValueType, RawValueType, CustomTagProps, DefaultValueType } from '../interface/generator';
import type { RenderNode } from '../interface';
import type { InnerSelectorProps } from './index';
import Input from './Input';
import useLayoutEffect from '../hooks/useLayoutEffect';
import { ContactActions, TempContactActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { WriteContext } from '@web-setting/Mail/components/CustomTemplate/template_add_modal';

interface SelectorProps extends InnerSelectorProps {
  // Icon
  removeIcon?: RenderNode;

  // Tags
  maxTagCount?: number | 'responsive';
  maxTagTextLength?: number;
  maxTagPlaceholder?: React.ReactNode | ((omittedValues: LabelValueType[]) => React.ReactNode);
  tokenSeparators?: string[];
  tagRender: (props: CustomTagProps) => React.ReactElement;
  onToggleOpen: (open?: boolean) => void;

  // Motion
  choiceTransitionName?: string;

  // Event
  onSelect: (value: RawValueType, option: { selected: boolean }) => void;

  onInputOrderChange?: (value: number) => void;
  inputOrderExternal?: number;

  // ref
  ref: React.Ref<RefMultiSelectorProps>;
}

export interface RefMultiSelectorProps {
  onKeyDown: React.KeyboardEventHandler;
  getLastEnabledIndex: () => number;
  setInputIndex: (index: number) => void;
  getChosenList: () => RawValueType[];
  clearChosenList: () => void;
  setChosenValue: (values: RawValueType[]) => void;
}

const SelectSelector: React.FC<SelectorProps> = React.forwardRef((props, ref) => {
  const {
    id,
    prefixCls,

    values,
    open,
    searchValue,
    inputRef,
    placeholder,
    disabled,
    mode,
    showSearch,
    autoFocus,
    autoComplete,
    accessibilityIndex,
    tabIndex,

    removeIcon,

    // maxTagCount,
    maxTagTextLength,
    // maxTagPlaceholder = (omittedValues: LabelValueType[]) => `+ ${omittedValues.length} ...`,
    tagRender,
    onToggleOpen,

    onSelect,
    onInputChange,
    onInputPaste,
    onInputKeyDown,
    onInputMouseDown,
    onInputCompositionStart,
    onInputCompositionEnd,
    onInputOrderChange,
    inputOrderExternal,
  } = props;

  const { isMailTemplate } = useContext(WriteContext);

  const measureRef = React.useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState(0);
  const [focused, setFocused] = useState(false);
  const [inputOrder, setInputOrder] = useState(0); // 从右至左计数
  const [chosenList, setChosenList] = useState<string[]>([]);
  const onContactActions = isMailTemplate ? TempContactActions : ContactActions;
  const contactActions = useActions(onContactActions);
  const { emails } = useAppSelector(state => (isMailTemplate ? state.tempContactReducer.selectedTags : state.contactReducer.selectedTags));

  // ===================== Search ======================
  const inputValue = open || mode === 'tags' ? searchValue : '';
  const inputEditable: boolean = mode === 'tags' || (showSearch && (open || focused)) || false;

  const allTags: string[] = values.map(v => v.label?.props?.item?.email);
  const selectType: string = values.map(v => v.label?.props?.item?.mailMemberType)[0];

  const toogleSelect = (emails: string[], cursorMail: string) => (emails.includes(cursorMail) ? emails.filter(email => email !== cursorMail) : [...emails, cursorMail]);

  useEffect(() => {
    onInputOrderChange && onInputOrderChange(inputOrder);
  }, [inputOrder]);

  useEffect(() => {
    if (typeof inputOrderExternal === 'number') {
      setInputOrder(inputOrderExternal);
    }
  }, [inputOrderExternal]);

  useImperativeHandle(ref, () => ({
    onKeyDown: async e => {
      const { which, metaKey, shiftKey, ctrlKey } = e;
      if (which === KeyCode.LEFT) {
        if (inputOrder < values.length) {
          setInputOrder(inputOrder + 1);
        }
        if (shiftKey) {
          const cursorMail = allTags[values.length - 1 - inputOrder];

          contactActions.doSelectTags({
            emails: toogleSelect(emails, cursorMail),
            type: selectType,
          });
        }
        setChosenList([]);
      } else if (which === KeyCode.RIGHT) {
        if (inputOrder > 0) {
          setInputOrder(inputOrder - 1);
        }
        if (shiftKey) {
          const cursorMail = allTags[values.length - inputOrder];
          contactActions.doSelectTags({
            emails: toogleSelect(emails, cursorMail),
            type: selectType,
          });
        }
        setChosenList([]);
      } else if (which === KeyCode.A && (metaKey || ctrlKey)) {
        /** 搜索时 ctrl+a 选中搜索文本否则选中全部 tag */
        if (inputValue.length > 0) return;

        contactActions.doSelectTags({
          emails: allTags,
          type: selectType,
        });

        setChosenList(values?.map(val => val?.value as string));
      }
    },
    getLastEnabledIndex: () => values.length - inputOrder - 1,
    getChosenList: () => chosenList,
    clearChosenList: () => {
      setChosenList([]);
    },
    setInputIndex: (index: number) => {
      setInputOrder(index);
    },
    setChosenValue: (valList: RawValueType[]) => {
      setChosenList(valList as string[]);
    },
  }));

  const selectionPrefixCls = `${prefixCls}-selection`;

  // We measure width and set to the input immediately
  useLayoutEffect(() => {
    setInputWidth(measureRef?.current?.scrollWidth || 4);
  }, [inputValue]);

  function customizeRenderSelector(
    value: DefaultValueType,
    content: React.ReactNode,
    itemDisabled: boolean,
    closable: boolean,
    onClose: (event?: React.MouseEvent<HTMLElement, MouseEvent>) => void,
    chosen: boolean
  ) {
    return (
      <span
        className={classNames(`${selectionPrefixCls}-item contact-tag-item`, {
          [`${selectionPrefixCls}-item-disabled`]: itemDisabled,
          'item-chosen': chosen,
        })}
      >
        {tagRender({
          label: content,
          value,
          disabled: itemDisabled,
          closable,
          onClose,
        })}
      </span>
    );
  }

  function renderItem({ disabled: itemDisabled = false, label, value }: DisplayLabelValueType) {
    const closable = !disabled && !itemDisabled;

    let displayLabel: React.ReactNode = label;

    if (typeof maxTagTextLength === 'number') {
      if (typeof label === 'string' || typeof label === 'number') {
        const strLabel = String(displayLabel);

        if (strLabel.length > maxTagTextLength) {
          displayLabel = `${strLabel.slice(0, maxTagTextLength)}...`;
        }
      }
    }

    const onClose = (event?: React.MouseEvent<HTMLElement, MouseEvent>) => {
      onSelect(value as string, { selected: false });
    };
    const chosen = chosenList.indexOf(value as string) >= 0;
    return customizeRenderSelector(value as string, displayLabel, itemDisabled, closable, onClose, chosen);
  }

  // >>> Input Node
  const inputNode = (
    <div
      className={`${selectionPrefixCls}-search`}
      style={{ width: inputWidth }}
      onFocus={() => {
        setFocused(true);
      }}
      onBlur={() => {
        setFocused(false);
      }}
    >
      <Input
        ref={inputRef}
        open={open}
        prefixCls={prefixCls}
        id={id}
        inputElement={null}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        editable={inputEditable}
        accessibilityIndex={accessibilityIndex}
        value={inputValue}
        onKeyDown={onInputKeyDown}
        onMouseDown={onInputMouseDown}
        onChange={onInputChange}
        onPaste={onInputPaste}
        onCompositionStart={onInputCompositionStart}
        onCompositionEnd={onInputCompositionEnd}
        tabIndex={tabIndex}
        attrs={pickAttrs(props, true)}
      />

      {/* Measure Node */}
      <span ref={measureRef} className={`${selectionPrefixCls}-search-mirror`} aria-hidden>
        {inputValue}
        &nbsp;
      </span>
    </div>
  );

  const selectionNode = (
    <>
      {values.map((value, index) => {
        const item = renderItem({ label: value.label, value: value.value });
        if (inputOrder === values.length - index) {
          return (
            <>
              {inputNode}
              {item}
            </>
          );
        }
        return [<div style={{ width: 4 }} />, item];
      })}
      {inputOrder === 0 ? inputNode : null}
    </>
  );

  return (
    <>
      {selectionNode}
      {!values.length && !inputValue && <span className={`${selectionPrefixCls}-placeholder`}>{placeholder}</span>}
    </>
  );
});

export default SelectSelector;
