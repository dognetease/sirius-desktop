/* eslint-disable max-statements */
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
// import { Input } from 'antd';
import classnames from 'classnames';
import './index.scss';
import styles from './index.module.scss';
import IconCard from '@web-common/components/UI/IconCard';
import InputContextMenu from '@web-common/components/UI/InputContextMenu/InputContextMenu';
// import { Input as LxInput } from '@web-common/components/UI/Input';
import LxInput from '@lingxi-common-component/sirius-ui/Input';
export interface CurrentSearchState {
  index: number;
  count: number;
  text: string;
  matchCase: boolean; // 是否区分大小写
  wholeWord: boolean; // 是否需要整个单词匹配
  inSelection: boolean;
}
interface Props {
  closeSearch?: () => void;
  index: number;
  count: number;
  searchContent: (keyword: string, forward?: boolean) => void;
  searchInputVisible: boolean;
  setSearchInputVisible: React.Dispatch<boolean>;
}

const ContentSearch: React.FC<Props> = props => {
  const { searchContent, closeSearch, index, count, searchInputVisible, setSearchInputVisible } = props;
  const [keyword, setKeyword] = useState('');
  const inputRef = useRef(null);
  const [afterFirstSearch, setAfterFirstSearch] = useState(false);

  useEffect(() => {
    if (!searchInputVisible) {
      setKeyword('');
    }
    if (searchInputVisible && inputRef.current) {
      inputRef.current.input.focus();
    }
  }, [searchInputVisible]);

  const nextPrev = useCallback(
    (type: string) => {
      if (type === 'next') {
        searchContent(keyword);
        return;
      }
      searchContent(keyword, false);
    },
    [searchContent, keyword]
  );

  const searchOperate = useMemo(() => {
    return (
      <div className={styles.operate}>
        {count > 0 && (
          <>
            <IconCard
              type="arrowLeft"
              className={`dark-invert ${styles.nextPrev}`}
              onClick={() => {
                nextPrev('prev');
              }}
            />
            <span>
              {index + 1}/{count}
            </span>
            <IconCard
              type="arrowRight"
              opcacity="1"
              className={`dark-invert ${styles.nextPrev}`}
              onClick={() => {
                nextPrev('next');
              }}
            />
          </>
        )}
        {count === 0 && afterFirstSearch && '没有结果'}
      </div>
    );
  }, [index, count, nextPrev, afterFirstSearch]);

  useEffect(() => {
    if (index === -1) {
      setAfterFirstSearch(false);
    }
  }, [index]);

  const closeSearchFn = () => {
    closeSearch && closeSearch();
    searchContent('');
    setKeyword('');
    setSearchInputVisible(false);
    setAfterFirstSearch(false);
  };

  return (
    <div className={classnames(styles.wrapper)} hidden={!searchInputVisible}>
      <InputContextMenu inputOutRef={inputRef}>
        <LxInput
          className={styles.searchInput}
          onChange={e => {
            setKeyword(String(e.target.value));
          }}
          ref={inputRef}
          value={keyword}
          placeholder="输入正文关键字按回车进行搜索"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              searchContent(keyword);
              setAfterFirstSearch(true);
            }
          }}
          suffix={searchOperate}
          style={{ height: '28px' }}
        />
      </InputContextMenu>
      <div className={classnames(styles.close)} onClick={closeSearchFn}>
        <IconCard type="close" />
      </div>
    </div>
  );
};
export default ContentSearch;
