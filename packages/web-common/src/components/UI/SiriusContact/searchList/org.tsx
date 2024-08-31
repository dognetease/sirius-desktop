import React, { useCallback, useEffect, useImperativeHandle, useRef, useState, useMemo } from 'react';
import { HotKeys, KeyMap } from 'react-hotkeys';
import { FixedSizeList as VirtualList } from 'react-window';
import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { StringMap, MemorySearchCondition } from 'api';
import styles from './index.module.scss';
import debounce from 'lodash/debounce';
import { SelectedOrgMap, transOrgSearch2OrgItem } from '@web-common/components/util/contact';
import { SpinIcon } from '../../Icons/icons';
import { contactApi, OrgItem } from '@web-common/utils/contact_util';
import ListItem from '../listItem/org';
import { useOrgItemEffect } from '@web-common/components/UI/SiriusContact/useContactItemEffect';
import { getIn18Text } from 'api';
export interface OrgListRefs {
  handleInputEnter(e: any): void;

  handleInputKeyDown(e: any): void;

  handleInputChange(e: any): void;
}

export interface OrgListProp {
  // 每个list-item 所占的位置大小
  itemSize?: number;
  isIM?: boolean;
  ref?: React.Ref<OrgListRefs>;
  showAvatar?: boolean;
  showCheckbox?: boolean;
  showAddOrgBtn?: boolean;
  defaultSelectList?: OrgItem[];
  disableCheckList?: OrgItem[];
  multiple?: boolean;
  onSelect?(allList: OrgItem[], cur: OrgItem[]): void;
  showAddTeamBtn?: boolean;
}

enum ListHotKey {
  KEY_UP,
  KEY_DOWN,
  KEY_ENTER,
}

const keyMap: KeyMap = {
  [ListHotKey.KEY_UP]: 'up',
  [ListHotKey.KEY_DOWN]: 'down',
  [ListHotKey.KEY_ENTER]: 'enter',
};

const textMap: StringMap = {
  noCondition: 'WUFUHETIAOJIAN',
  noMore: 'DAODILA~',
};
const tranText = (text: string) => {
  return getIn18Text(textMap[text]);
};

const OrgList = React.forwardRef((props: OrgListProp, ref) => {
  const {
    itemSize = 52,
    isIM = true,
    showAvatar = true,
    showCheckbox = true,
    multiple = true,
    onSelect,
    defaultSelectList = [],
    disableCheckList: defaultDisableCheckList,
    showAddTeamBtn = true,
  } = props;
  // 选中的item
  const [selectedContact, setSelectedContact] = useState<OrgItem>();
  //  选中的
  const [selectedMap, setSelectedMap] = useState<SelectedOrgMap>(new Map());
  // 搜索列表
  const [searchList, setSearchList] = useState<OrgItem[]>([]);
  // 搜索loading
  const [searchListLoading, setSearchListLoading] = useState<boolean>(false);
  // 搜索key
  const [searchValue, setSearchValue] = useState<string>();
  // 快捷键容器
  const hotKeyInnerRef = useRef<HTMLElement>(null);
  // 虚拟列表容器
  const listRef = useRef<VirtualList>(null);
  // 虚拟列表滚动容器
  const listScrollRef = useRef<OverlayScrollbarsComponent>(null);
  // 输入框容器
  const inputValueRef = useRef<string>('');

  // 默认选中
  useOrgItemEffect(defaultSelectList, () => {
    const itemMap = new Map();
    defaultSelectList.forEach(item => {
      const key = item.id;
      itemMap.set(key, item);
    });
    setSelectedMap(itemMap);
  });

  // 默认禁止
  const disabledMap = useMemo(() => {
    const itemMap = new Map();
    defaultDisableCheckList?.forEach(item => {
      const key = item.id;
      itemMap.set(key, item);
    });
    return itemMap;
  }, [defaultDisableCheckList]);

  /**
   * 处理键盘Enter选中或者选中列表中的某一条数据
   * @param params: 不传代表键盘enter
   * @param checked
   */
  const handleSelectedItem = useCallback(
    (params?: OrgItem, checked: boolean = true) => {
      const data = params || selectedContact || searchList[0];
      if (!data) {
        return;
      }
      handleOrgSelect(data, checked);
    },
    [selectedContact, searchList]
  );

  /**
   * 处理选中的企业组织
   * @param data: 选中的企业组织
   * @param checked
   */
  const handleOrgSelect = useCallback(
    async (data: OrgItem, checked: boolean) => {
      if (multiple) {
        if (checked) {
          selectedMap.set(data.id, data);
        } else {
          selectedMap.delete(data.id);
        }
        setSelectedMap(selectedMap);
        onSelect && onSelect([...selectedMap.values()], [data]);
      } else {
        onSelect && onSelect([data], [data]);
      }
    },
    [selectedMap]
  );

  /**
   * 处理列表的上下选中
   * @param stepNum
   */
  const handleListMove = useCallback(
    (stepNum: number) => {
      let step = stepNum;
      if (searchList?.length === 0) {
        return;
      }
      let currentIndex = 0;
      console.warn('selectedContact', selectedContact);
      if (selectedContact) {
        currentIndex = searchList.findIndex(item => {
          return selectedContact.id === item.id;
        });
      } else {
        step = 0;
      }
      const targetIndex = currentIndex + step;
      if (targetIndex < searchList.length && searchList[targetIndex]) {
        setSelectedContact(searchList[targetIndex]);
        listRef.current?.scrollToItem(targetIndex);
      }
    },
    [selectedContact, searchList]
  );
  /**
   * 搜素输入框enter事件
   */
  const handleInputEnter: React.KeyboardEventHandler<HTMLInputElement> = useCallback(() => {
    handleSelectedItem();
  }, []);
  /**
   * 搜素输入框上下键操作
   * @param e
   */
  const handleInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = useCallback(e => {
    if (e.keyCode === 38 || e.keyCode === 40) {
      let step;
      if (e.keyCode === 38) {
        step = -1;
      } else {
        step = 1;
      }
      handleListMove(step);
    }
  }, []);
  /**
   * 搜素输入框值发生变化
   * @param e
   */
  const handleInputChange = useCallback((e: any) => {
    if (typeof e === 'string') {
      setSearchValue(e);
      return;
    }
    const { value } = e.target;
    setSearchValue(value);
  }, []);
  /**
   * 给搜索输入框挂载方法
   */
  useImperativeHandle(ref, () => ({
    handleInputEnter,
    handleInputKeyDown,
    handleInputChange,
  }));

  /*
   * 搜索联系人相关数据，返回命中的人和群组
   * */
  const doSearch = async (query: string) => {
    setSearchListLoading(!0);
    const condition: MemorySearchCondition = {
      query,
      showDisable: false,
      isIM,
      useEdmData: false,
      enableUseMemory: false,
      exclude: ['contactName', 'contactPYName', 'contactPYLabelName', 'accountName'],
    };
    try {
      window.bridgeApi.master.forbiddenBridgeOnce();
    } catch (ex) {}

    const { main } = await contactApi.doSearchNew(condition);
    if (inputValueRef.current !== query) {
      return;
    }
    const searchedList: OrgItem[] = [];
    Object.keys(main).forEach(account => {
      const data = main[account] || {};
      const { orgList, personalOrgList, teamList } = data;
      [...orgList, ...personalOrgList]?.forEach(item => {
        searchedList.push(transOrgSearch2OrgItem(item));
      });
      // 如果支持群组搜索
      if (showAddTeamBtn) {
        (teamList || []).forEach(item => {
          searchedList.push(transOrgSearch2OrgItem(item));
        });
      }
    });
    setSearchList(searchedList);
    setSelectedContact(searchedList[0]);
    setSearchListLoading(false);
  };

  const debounceSearch = useCallback(
    debounce(
      value => {
        doSearch(value);
      },
      700,
      {
        leading: true,
      }
    ),
    []
  );

  useEffect(() => {
    if (!searchValue) {
      setSearchListLoading(false);
      setSearchList([]);
    } else {
      inputValueRef.current = searchValue;
      debounceSearch(searchValue);
    }
  }, [searchValue]);

  /**
   * 给搜索列表绑定快捷键
   */
  const listHotKeyHandler = {
    [ListHotKey.KEY_UP]: (e?: KeyboardEvent) => {
      e && e.preventDefault();
      handleListMove(-1);
    },
    [ListHotKey.KEY_DOWN]: (e?: KeyboardEvent) => {
      e && e.preventDefault();
      handleListMove(1);
    },
    [ListHotKey.KEY_ENTER]: (e?: KeyboardEvent) => {
      e && e.preventDefault();
      handleSelectedItem();
    },
  };
  /**
   * 无数据展示
   */
  const NoDataContent = useMemo(() => <div className={styles.noData}>{tranText('noCondition')}</div>, []);
  /**
   * 数据列表
   */
  const renderData = (
    <AutoSizer>
      {({ width, height }) => (
        <HotKeys keyMap={keyMap} handlers={listHotKeyHandler} allowChanges innerRef={hotKeyInnerRef}>
          <VirtualList
            itemSize={itemSize}
            itemCount={searchList.length + (searchValue && searchList.length === 0 ? 0 : 1)}
            height={height}
            width={width}
            ref={listRef}
            outerRef={listScrollRef}
            className="sirius-scroll"
          >
            {({ index, style }) => {
              if (index === searchList.length) {
                return (
                  <div className={styles.noMore} style={{ ...style }}>
                    {tranText('noMore')}
                  </div>
                );
              }
              const item = searchList[index];
              const selected = selectedContact?.id === item.id;
              const checked = selectedMap.has(item.id);
              const disableCheck = disabledMap.has(item.id);
              return (
                <div className={styles.listItem} key={item.id} style={{ ...style }}>
                  <ListItem
                    onSelect={() => {
                      handleSelectedItem(item, !checked);
                    }}
                    type="search"
                    showAvatar={showAvatar}
                    showCheckbox={showCheckbox}
                    checked={checked}
                    disableCheck={disableCheck}
                    selected={selected}
                    item={item}
                    searchText={searchValue}
                  />
                </div>
              );
            }}
          </VirtualList>
        </HotKeys>
      )}
    </AutoSizer>
  );
  const renderList = searchList.length === 0 ? NoDataContent : renderData;
  /**
   * 数据加载中
   */
  const renderLoading = useMemo(
    () => (
      <div className={styles.listLoading}>
        <SpinIcon className="sirius-spin" />
      </div>
    ),
    []
  );
  /**
   * 组建内容
   */
  return <div className={styles.listContainer}>{searchListLoading ? renderLoading : renderList}</div>;
});
export default OrgList;
