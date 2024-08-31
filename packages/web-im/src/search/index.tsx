import React, { useCallback, useEffect, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import { apiHolder, NIMApi } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { SearchTab } from './searchTab';
import { IM_SEARCH_TABS } from './searchTabEnum';
import { EmptyPlaceholder } from './emptyResult';
import { SearchInput } from './searchInput';
import { Result } from './searchResult';
import { CUSTOM_SEARCH_UIEVENTS } from './doSearchAction';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

interface Props {
  isModalVisible: boolean;
  showTeamExact: (keyword: string) => void;
  closeModal: () => void;
}

const Search: React.FC<Props> = ({ isModalVisible, showTeamExact, closeModal }) => {
  const [width, setWidth] = useState<number>(0);

  const [height, setHeight] = useState<number>(0);
  const [searchKey, setSearchKey] = useState('');
  // 使用number-number模式表示选中的item.第一个number表示的被选中的是哪个item 第二个number(0执行1执行)
  const [checkedNum, setCheckedNum] = useState(-1);
  // input submit
  const [submitFlag, setsubmitFlag] = useState(false);

  const [selectedTab, setSelectTab] = useState<IM_SEARCH_TABS>(IM_SEARCH_TABS.ALL);

  // 搜索信息摘要(包含关键字/tab/source->是否从服务端搜索)
  const [summaryContent, setSummaryContent] = useState('');

  const onChange = (text: string) => {
    setSearchKey(text);
  };

  useEffect(() => {
    setSummaryContent([encodeURIComponent(searchKey), selectedTab].join('/'));
  }, [selectedTab]);

  useEffect(() => {
    // 如果当前tab包含remote 清空
    selectedTab.indexOf('?') !== -1 && setSelectTab(selectedTab.replace(/\?\w+$/, ''));
    setSummaryContent([encodeURIComponent(searchKey), selectedTab.replace(/\?\w+$/, '')].join('/'));
  }, [searchKey]);

  const handleResize = useCallback(
    debounce(() => {
      const vh = document.body.clientHeight;
      const vw = document.body.clientWidth;
      if (typeof window !== 'undefined') {
        setWidth(vw - 146 * 2);
        setHeight(vh - 64 * 2);
      }
    }),
    []
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const searchRef = useRef<{
    clean(): void;
    focus(): void;
  }>(null);

  const afterClose = () => {
    searchRef.current?.clean();
    setSelectTab(IM_SEARCH_TABS.ALL);
  };

  useEffect(() => {
    if (!isModalVisible) {
      return;
    }
    searchRef.current?.focus();
  }, [isModalVisible]);

  useEffect(() => {
    isModalVisible && nimApi.emitCustomEvent(CUSTOM_SEARCH_UIEVENTS.trigger, {});
  }, [isModalVisible]);

  // 新关键词 | 切换Tab之后默认第一项是选中项
  useEffect(() => {
    setCheckedNum(0);
  }, [summaryContent]);
  // 切换Tab之后自动聚焦
  useEffect(() => {
    searchRef.current?.focus();
  }, [selectedTab]);

  const onChangeCount = (param: Record<'action', 'increase' | 'decrease' | 'confirm'>) => {
    const { action } = param;
    setCheckedNum(count => {
      if (action === 'decrease') {
        return Math.max(count - 1, 0);
      }
      return count + 1;
    });
  };
  const onPressEnter = () => {
    setsubmitFlag(true);
  };
  // keycodeEnter之后将submitFlag重置为false
  useEffect(() => {
    const $t = setTimeout(() => {
      submitFlag && setsubmitFlag(false);
    }, 500);
    return () => {
      clearTimeout($t);
    };
  }, [submitFlag]);

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
      <SearchInput ref={searchRef} onSearch={onChange} onPressEnter={onPressEnter} onChangeCount={onChangeCount} />
      {/* 搜索Tab */}
      <SearchTab checkedTab={selectedTab} onSwitchTab={setSelectTab} />

      {/* 空态 */}
      {!searchKey.trim().length ? <EmptyPlaceholder height={height - 130} /> : null}
      {searchKey.trim().length ? (
        <Result
          checkedNum={checkedNum}
          summaryContent={summaryContent}
          enterConfirmFlag={submitFlag}
          maxCount={selectedTab === IM_SEARCH_TABS.ALL ? 3 : Infinity}
          height={height - 130}
          goMore={setSelectTab}
          closeModal={closeModal}
          showTeamExact={showTeamExact}
          updateCheckedNum={setCheckedNum}
        />
      ) : null}
    </Modal>
  );
};

export default Search;
