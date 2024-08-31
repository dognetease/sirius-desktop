import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from 'antd';
import debounce from 'lodash/debounce';
import classnames from 'classnames/bind';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import emptyStyle from './empty.module.scss';
import { SearchTab } from './searchTab';
import { IM_SEARCH_TABS } from './searchTabEnum';
import { EmptyPlaceholder } from './emptyResult';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';

const realStyle = classnames.bind(emptyStyle);

interface Props {
  isModalVisible: boolean;
  closeModal: () => void;
}

const SearchModal: React.FC<Props> = ({ isModalVisible, closeModal }) => {
  const [width, setWidth] = useState<number>(0);

  const [height, setHeight] = useState<number>(0);
  const [isComposition, setIsComposition] = useState(false);
  const [searchKey, setSearchKey] = useState('');

  const [selectedTab, setSelectTab] = useState<IM_SEARCH_TABS>(IM_SEARCH_TABS.ALL);

  const onChange = e => {
    // Prevents React from resetting its properties:
    e.persist();
    setSearchKey(e.target.value);
  };

  const handleResize = useCallback(
    debounce(() => {
      const vh = document.body.clientHeight;
      const vw = document.body.clientWidth;
      if (typeof window !== undefined) {
        setWidth(vw - 146 * 2);
        setHeight(vh - 64 * 2);
      }
    }),
    []
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [handleResize]);

  const afterClose = () => {
    setSearchKey('');
    setSelectTab(IM_SEARCH_TABS.ALL);
  };

  const searchRef = useRef<Input>(null);

  const autoFocus = async () => {
    await new Promise(resolve => {
      setTimeout(resolve, 500);
    });
    searchRef.current?.focus({
      cursor: 'start',
    });
  };
  useEffect(() => {
    if (!isModalVisible) {
      return;
    }
    autoFocus();
  }, [isModalVisible]);

  return (
    <Modal
      visible={isModalVisible}
      onCancel={() => {
        closeModal();
      }}
      className="search-modal"
      afterClose={afterClose}
      footer={null}
      width={width}
      bodyStyle={{
        height,
        overflow: 'auto',
      }}
      closeIcon={<CloseIcon className="dark-invert" />}
    >
      <Input
        className="search-input"
        placeholder="搜索"
        value={searchKey}
        prefix={<SearchIcon className="dark-invert" />}
        onChange={e => {
          // onChange(e);
        }}
        onCompositionStart={() => {
          setIsComposition(true);
        }}
        onCompositionEnd={() => {
          setIsComposition(false);
        }}
        ref={searchRef}
      />
      {/* 搜索Tab */}
      <SearchTab checkedTab={selectedTab} onSwitchTab={setSelectTab} />

      {/* 空态 */}
      {!searchKey.trim().length && <EmptyPlaceholder height={height} />}
    </Modal>
  );
};

export default Search;
