import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Input } from 'antd';
import debounce from 'lodash/debounce';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import InputContextMenu from '@web-common/components/UI/InputContextMenu/InputContextMenu';
import { getIn18Text } from 'api';
interface Props {
  onSearch(text: string): void;
  onChangeCount(param: { action: 'increase' | 'decrease' }): void;
  onPressEnter(e: React.KeyboardEvent): void;
}
export interface RefType {
  focus(): Promise<void>;
  clean(): void;
}
export const SearchInput = React.forwardRef<RefType, Props>((props, ref) => {
  const { onSearch, onChangeCount, onPressEnter } = props;
  const [isComposition, setIsComposition] = useState(false);
  const [searchKey, setSearchKey] = useState('');
  const onChange = e => {
    setSearchKey(e.target.value);
  };
  const searchRef = useRef<Input>(null);
  const _search = useCallback(debounce(onSearch, 200), []);
  const autoFocus = async () => {
    await new Promise(resolve => {
      setTimeout(resolve, 100);
    });
    searchRef.current?.focus({
      cursor: 'end',
    });
  };
  useImperativeHandle(ref, () => ({
    focus: autoFocus,
    clean() {
      setSearchKey('');
    },
  }));
  const onKeyDown = (e: React.KeyboardEvent) => {
    const keycode = e.nativeEvent.key;
    if (['ArrowUp', 'ArrowDown'].includes(keycode)) {
      onChangeCount({
        action: keycode === 'ArrowUp' ? 'decrease' : 'increase',
      });
      e.stopPropagation();
    }
  };
  useEffect(() => {
    if (isComposition) {
      return;
    }
    _search(searchKey);
  }, [searchKey, isComposition]);
  return (
    <InputContextMenu inputOutRef={searchRef}>
      <Input
        autoFocus
        data-test-id="im_seach_modal_input"
        className="search-input"
        placeholder={getIn18Text('SOUSUO')}
        value={searchKey}
        prefix={<SearchIcon className="dark-invert" />}
        onChange={e => {
          e.persist();
          onChange(e);
        }}
        onCompositionStart={() => {
          setIsComposition(true);
        }}
        onCompositionEnd={() => {
          setIsComposition(false);
        }}
        onKeyDown={onKeyDown}
        onPressEnter={onPressEnter}
        ref={searchRef}
      />
    </InputContextMenu>
  );
});
