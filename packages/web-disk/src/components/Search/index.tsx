import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { apiHolder, NetStorageApi, apis, NSFileDetail, NetStorageShareApi, SystemApi } from 'api';
import { Spin } from 'antd';
import debounce from 'lodash/debounce';
import classnames from 'classnames';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import IconCard from '@web-common/components/UI/IconCard';
import { formatTime } from '@web-mail/util';
import { highlightText } from '@web-mail-write/util';
import { normalizeShareUrl, getFileIcon } from '../../utils';
import { truncate } from '@web-common/utils/utils';
import { DiskActions, useAppSelector, useAppDispatch } from '@web-common/state/createStore';
import './index.scss';
import { DiskTab } from '../../disk';
import InputContextMenu from '@web-common/components/UI/InputContextMenu/InputContextMenu';
// import { Input as LxInput } from '@web-common/components/UI/Input';
import LxInput from '@lingxi-common-component/sirius-ui/Input';
import { getIn18Text } from 'api';
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const diskShareApi = apiHolder.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const pageSize = 50;
interface DiskItemProps {
  item: NSFileDetail;
  keyword: string;
  chosen?: boolean;
  openFileOrDir: (item: NSFileDetail) => void;
  onMouseEnter: () => void;
}
const DiskItem: React.FC<DiskItemProps> = ({ item, keyword, chosen, openFileOrDir, onMouseEnter }) => {
  const isDir = item.searchDetailType === 'DIRECTORY';
  const iconType: any = isDir ? 'dir' : getFileIcon(item);
  const pathName = truncate(item.pathName + (isDir ? `/${item.name}` : ''), 28, '...');
  return (
    <div className={classnames('disk-item', { 'chosen-item': chosen })} onMouseEnter={onMouseEnter}>
      <IconCard type={iconType} width="24px" height="24px" />
      <div
        className="item-info"
        onClick={() => {
          openFileOrDir(item);
        }}
      >
        <div
          className="item-name"
          dangerouslySetInnerHTML={{
            __html: highlightText(item.name, keyword, 'highlight-text', { hitGlobal: true, splitSearchTerm: true }),
          }}
        />
        <div className="item-detail">
          <span
            dangerouslySetInnerHTML={{
              __html: `位置：${highlightText(pathName, keyword, 'highlight-text', { hitGlobal: true, splitSearchTerm: true })}`,
            }}
          />
          <span>
            {getIn18Text('GENGXIN\uFF1A')}
            {formatTime(item.updateTime)}
          </span>
          <span>
            {getIn18Text('CHUANGJIANREN\uFF1A')}
            {item.createUserNickName}
          </span>
        </div>
      </div>
    </div>
  );
};
interface SearchProps {
  isModalVisible: boolean;
  closeModal: () => void;
}
const Search: React.FC<SearchProps> = ({ isModalVisible, closeModal }) => {
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [searchKey, setSearchKey] = useState('');
  const [fetching, setFetching] = useState(false);
  const [searchList, setSearchList] = useState<NSFileDetail[]>([]);
  const [chosenIndex, setChosenIndex] = useState(-1);
  const [hasMore, setHasMore] = useState(true);
  const [isComposition, setIsComposition] = useState(false);
  const searchRef = useRef(null);
  const fetchRef = useRef(0);
  const searchListRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const dispatch = useAppDispatch();
  const debouncedSearch = useMemo(() => {
    const loadDiskDetails = (value: string) => {
      if (!value) {
        setSearchList([]);
        return;
      }
      const fetchId = fetchRef.current;
      setFetching(true);
      diskApi.doSearchDirAndFileList({ key: value, page: pageRef.current, pageSize }).then(res => {
        if (fetchId !== fetchRef.current) {
          return;
        }
        setHasMore(res?.detailList?.length > 0);
        if (pageRef.current > 1) {
          setSearchList(list => list.concat(res.detailList || []));
        } else if (res?.detailList?.length) {
          setSearchList(res.detailList);
          setTimeout(() => {
            searchListRef.current?.scroll(0, 0);
          });
          setChosenIndex(0);
        } else {
          setSearchList([]);
          setChosenIndex(-1);
        }
        pageRef.current++;
        setFetching(false);
      });
    };
    return debounce(loadDiskDetails, 700);
  }, []);
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
  useEffect(() => {
    if (isComposition) {
      return;
    }
    pageRef.current = 1; // ?
    debouncedSearch(searchKey);
    return () => {
      fetchRef.current += 1;
    };
  }, [searchKey, isComposition]);
  useEffect(() => {
    if (isModalVisible) {
      setTimeout(() => {
        searchRef.current?.focus();
      }, 300);
    }
  }, [isModalVisible]);
  const onChange = e => {
    e.persist();
    setSearchKey(e.target.value);
  };
  const afterClose = () => {
    setSearchKey('');
  };
  const openFileOrDir = (item?: NSFileDetail) => {
    if (!item) {
      return;
    }
    const isDir = item.searchDetailType === 'DIRECTORY';
    if (isDir) {
      // trackerApi.track(`pc_disk_click_list_${trackTypeMap[sideTab || '']}`, {type: 'folder'});
      let sideTab = '';
      const { bizCode } = item;
      switch (bizCode) {
        case 'PERSONAL':
          sideTab = 'private';
          break;
        case 'PERSONAL_SHARE':
          sideTab = 'share';
          break;
        default:
          sideTab = 'public';
          break;
      }
      dispatch(DiskActions.setCurSideTab(sideTab as DiskTab));
      item.id && dispatch(DiskActions.setCurDirId(item.id));
      closeModal && closeModal();
    } else {
      // trackerApi.track(`pc_disk_click_list_${trackTypeMap[sideTab || '']}`, {type: 'file'});
      diskShareApi.getNSShareLink({ resourceId: item.id, resourceType: 'FILE' }).then(data => {
        if (data.shareUrl) {
          const shareUrl = normalizeShareUrl(data.shareUrl);
          if (systemApi.isElectron()) {
            systemApi.handleJumpUrl(-1, shareUrl);
          } else {
            systemApi.openNewWindow(shareUrl);
          }
        }
      });
    }
  };
  const keyDownHandler: React.KeyboardEventHandler = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const nodes = Array.from(searchListRef.current?.children || []);
    let curIndex;
    // eslint-disable-next-line default-case
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        curIndex = chosenIndex === 0 ? 0 : chosenIndex - 1;
        setChosenIndex(curIndex);
        nodes[curIndex]?.scrollIntoView({ block: 'nearest' });
        break;
      case 'ArrowDown':
        e.preventDefault();
        curIndex = chosenIndex === searchList.length - 1 ? chosenIndex : chosenIndex + 1;
        setChosenIndex(curIndex);
        nodes[curIndex]?.scrollIntoView({ block: 'nearest' });
        break;
      case 'Enter':
        e.preventDefault();
        openFileOrDir(searchList[chosenIndex]);
        break;
    }
  };
  const onScroll = e => {
    const list = e.currentTarget;
    if (fetching || !hasMore || !list) {
      return;
    }
    if (list.scrollTop + list.offsetHeight + 100 >= list.scrollHeight) {
      debouncedSearch(searchKey);
    }
  };
  let content;
  if (!searchKey) {
    content = (
      <div className="select-empty">
        <div className="sirius-empty" />
        <div>{getIn18Text('QINGSHURUGUANJIAN')}</div>
      </div>
    );
  } else if (!searchList.length && !fetching) {
    content = (
      <div className="select-empty">
        <div className="sirius-empty sirius-empty-doc" />
        <div>{getIn18Text('ZANWUJIEGUO')}</div>
      </div>
    );
  } else {
    content = (
      <div className="search-list" ref={searchListRef} onScroll={onScroll}>
        <Spin spinning={fetching} className="loading">
          {searchList.map((item, index) => (
            <DiskItem
              key={item.id}
              item={item}
              chosen={chosenIndex === index}
              keyword={searchKey}
              openFileOrDir={openFileOrDir}
              onMouseEnter={() => {
                setChosenIndex(index);
              }}
            />
          ))}
        </Spin>
      </div>
    );
  }
  return (
    <Modal
      visible={isModalVisible}
      onCancel={closeModal}
      className="search-modal"
      getContainer={() => document.getElementById('disk-main-page') || document.body}
      afterClose={afterClose}
      closeIcon={<div className="search-close dark-invert" />}
      footer={null}
      width={width}
      bodyStyle={{
        height,
        overflow: 'auto',
      }}
    >
      <div className="search-page" tabIndex={0} onKeyDown={keyDownHandler}>
        <div className="search-top-bar">
          <InputContextMenu inputOutRef={searchRef}>
            <LxInput
              className="search-input"
              placeholder={getIn18Text('SOUSUOKONGJIAN')}
              value={searchKey}
              prefix={<IconCard type="search" className="dark-invert" />}
              onChange={onChange}
              onCompositionStart={() => {
                setIsComposition(true);
              }}
              onCompositionEnd={() => {
                setIsComposition(false);
              }}
              ref={searchRef}
            />
          </InputContextMenu>
          <div className="search-select">
            <div className="select-tab action">{getIn18Text('KONGJIAN')}</div>
          </div>
        </div>
        {content}
      </div>
    </Modal>
  );
};
export default Search;
