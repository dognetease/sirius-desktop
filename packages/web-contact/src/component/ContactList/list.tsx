import React, { useState, useCallback, useEffect, useRef, useImperativeHandle } from 'react';
import { VariableSizeList as VirtualList } from 'react-window';
import { HotKeys, KeyMap } from 'react-hotkeys';
import { Skeleton } from 'antd';
import { Item, contactHeaderheight, itemDepartmentHeight, itemHeight } from '../ListItem/item';
import { BackToTopIcon } from '@web-common/components/UI/Icons/icons';
import classnames from 'classnames';
import styles from './list.module.scss';
import ContactFooter from '../ContactFooter/footer';
import { api, SystemEvent } from 'api';

import { ContactOrgItem, isOrg, SelectedContactOrgMap } from '@web-common/components/util/contact';
import { getIn18Text } from 'api';

const eventApi = api.getEventApi();

export interface ContactListRefProps {}

export interface ContactListProps {
  _account?: string;
  ref?: React.Ref<ContactListRefProps>;
  hidden?: boolean;
  // 是否列表加载中
  loading?: boolean;
  // 列表数据
  data: ContactOrgItem[];
  // 展开的id集合
  expandIds: Set<string>;
  // 选中的当前数据
  selectedData?: ContactOrgItem;
  // 选中列表中的数据集合<id, 数据详情>
  checkedData?: SelectedContactOrgMap;
  // 列表宽度
  width: number;
  // 列表高度
  height: number;
  // 列表被占用高度（给外部浮动区域使用）
  placeholderHeight: number;
  // 是否要展示联系人的Tag
  showPersonalLabelTag?: boolean;
  // 当列表数据改变时滚动条回到最上面（默认 true）
  dataChangeScrollToTop?: boolean;
  // 当前列表搜索需要高亮的值
  searchValue?: string;
  // 当选中列表某条的回调
  onSelectItem?: (item: ContactOrgItem) => void;
  // 当选中列表某条的checkbox回调
  onCheckItem?: (item: ContactOrgItem, all: SelectedContactOrgMap) => void;
  // 当列表全选回调
  onCheckAll?: (all: SelectedContactOrgMap) => void;
  // 列表内部数据发生变化（拖拽）
  onDataChange?: (data: ContactOrgItem[]) => void;
  // 列表挂件点击
  onDecorateClick?: (item: ContactOrgItem) => void;
  // 点击可展开按钮
  onExpand?: (item: ContactOrgItem) => void;
  onMarked?: (marked: boolean) => void;
  // 列表发生排序
  onSort?: (currentIndex: number, dragIndex: number) => void;
  // 是否可以排序
  visibleSort?: boolean;
}

enum ListHotKey {
  KEY_UP,
  KEY_DOWN,
}

const listWithStickyHeaderPaddingTop = 12;

const keyMap: KeyMap = {
  [ListHotKey.KEY_UP]: 'up',
  [ListHotKey.KEY_DOWN]: 'down',
};

const systemApi = api.getSystemApi();
// const footerHeight = systemApi.isWebWmEntry()? `${getMainContOffsetTopHeight()}px` :`${getBodyFixHeight(false, true)}px`

export const ContactList = React.forwardRef((props: ContactListProps, ref) => {
  const {
    data: dataList,
    expandIds,
    loading,
    hidden,
    checkedData: checkedMap = new Map(),
    selectedData: propsSelectedData,
    width,
    height,
    dataChangeScrollToTop = true,
    placeholderHeight,
    showPersonalLabelTag,
    visibleSort,
    onMarked,
    searchValue,
    onCheckItem,
    onCheckAll,
    onSelectItem,
    onExpand,
    onSort,
  } = props;

  const [selectedData, setSelectedData] = useState<ContactOrgItem | undefined>(propsSelectedData);

  // 设置选中的项目
  // const [checkedMap, setCheckedMap] = useState<SelectedContactOrgMap>(new Map());

  // 是否展示回到顶部按钮
  const [showBackTop, setShowBackTop] = useState<boolean>(false);

  // 是否展示联系人批量选择组件
  const [visibleBatchCheckBox, setVisibleBatchCheckBox] = useState<boolean>(false);

  const [listDragActive, setListDragActive] = useState<boolean>(false);

  // 当前列表
  const listRef = useRef<VirtualList>(null);

  const listInnerRef = useRef<any>(null);
  const listOuterRef = useRef<any>(null);

  const dragdingRef = useRef<any>(null);

  /**
   * 联系人展示的列表数据发生变化时需要处理的业务
   * 1. 默认选中联系人列表的第一条数据
   * 2. 清空勾选中的联系人（分组）列表
   */

  const [defaultSelectedContactId, setSelectedContactId] = useState('');
  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('sendSelectedContactIdOnContactPage', {
      func: (e: SystemEvent<{ id: string }>) => {
        const checkedContactId = e.eventData?.id || '';
        setSelectedContactId(checkedContactId);
      },
    });
    return () => {
      eid && eventApi.unregisterSysEventObserver('sendSelectedContactIdOnContactPage', eid);
    };
  }, []);

  useEffect(() => {
    if (dataChangeScrollToTop) {
      const currentSelectData =
        dataList.find(item => {
          return item.id === defaultSelectedContactId;
        }) || dataList[0];
      setSelectedData(currentSelectData);
      if (!isOrg(currentSelectData)) {
        onSelectItem && onSelectItem(currentSelectData);
      }
      handleCheckAll(false);
    }
  }, [dataList, dataChangeScrollToTop]);

  // 当选中的列表发生变化,或者选中某一条发生变化需要滚动位置
  useEffect(() => {
    listRef.current?.resetAfterIndex(0);
    if (selectedData && dataChangeScrollToTop) {
      const index = dataList.findIndex(item => item.id === selectedData.id);
      listRef.current?.scrollToItem(index > -1 ? index : 0);
    }
  }, [selectedData, dataList, dataChangeScrollToTop]);

  useEffect(() => {
    checkedMap.size > 0 && setVisibleBatchCheckBox(true);
  }, [checkedMap.size]);

  useEffect(() => {
    setSelectedData(propsSelectedData);
  }, [propsSelectedData]);

  // 点击列表item的checkbox
  const handleCheck = useCallback(
    (item: ContactOrgItem) => {
      if (item.id) {
        if (checkedMap.has(item.id)) {
          checkedMap.delete(item.id);
        } else {
          checkedMap.set(item.id, item);
        }
      }
      onCheckItem && onCheckItem(item, checkedMap);
    },
    [checkedMap]
  );

  // 选中全部
  const handleCheckAll = useCallback(
    (checked?: boolean) => {
      const res: SelectedContactOrgMap = new Map();
      if (checked) {
        dataList.forEach(item => {
          res.set(item.id!, item);
        });
      }
      onCheckAll && onCheckAll(res);
      // setCheckedMap(res);
    },
    [dataList]
  );

  // 点击列表item
  const handleSelect = useCallback((item: ContactOrgItem) => {
    setSelectedData(item);
    onSelectItem && onSelectItem(item);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      setListDragActive(false);
      const dragIndex = e.dataTransfer.getData('index');
      const index = dataList.length - 1;
      if (index !== Number(dragIndex)) {
        onSort && onSort(index + 1, Number(dragIndex));
        const parentWrap = document.querySelector('#contact-drag-item') as HTMLElement;
        if (parentWrap) {
          parentWrap.innerHTML = '';
        }
      }
    },
    [dataList.length]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const index = dataList.length - 1;
      dragdingRef.current = e.target;
      const findItem = e.dataTransfer.types.find(item => item.includes('drag_index_'));
      if (findItem) {
        const _index = findItem.split('drag_index_')[1];
        if (Number(_index) !== index) {
          console.log('[contact_list] handleDragEnter', _index);
          setListDragActive(true);
        }
      }
    },
    [dataList.length]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (dragdingRef.current === e.target) {
      console.log('[contact_list] handleDragLeave', e.target);
      setListDragActive(false);
      dragdingRef.current = undefined;
    }
  }, []);

  /**
   * 列表快捷键移动
   * @param step 移动步长
   * @returns
   */
  const handleListMove = (step: number) => (e?: KeyboardEvent) => {
    e && e.preventDefault();
    if (dataList && selectedData) {
      const currentIndex = dataList.indexOf(selectedData);
      const targetIndex = currentIndex + step;
      if (dataList[targetIndex]) {
        setSelectedData(dataList[targetIndex]);
        listRef.current?.scrollToItem(targetIndex);
      }
    }
  };

  /**
   * 获取行高
   */
  const getRowHeight = useCallback(
    index => {
      const item = dataList[index];
      let size = itemHeight;
      if (item) {
        if (!('orgType' in item)) {
          if (searchValue && item.type === 'enterprise' && item.position?.length) {
            size = itemDepartmentHeight + itemHeight;
          } else if (showPersonalLabelTag && item.labelPoint) {
            size = itemHeight + contactHeaderheight;
          }
        }
      }
      return size;
    },
    [dataList, searchValue, showPersonalLabelTag]
  );

  const getCountsHeight = useCallback(
    (count: number = 5) => new Array(count).fill(null).reduce((prev, _, curi) => getRowHeight({ index: curi }) + prev, 0),
    [getRowHeight]
  );

  const listHotKeyHandler = {
    [ListHotKey.KEY_UP]: handleListMove(-1),
    [ListHotKey.KEY_DOWN]: handleListMove(1),
  };

  // 回到列表顶部
  const handleBackToTop = useCallback(() => {
    listRef.current?.scrollTo(0);
  }, []);

  const subHeight = checkedMap.size > 0 ? 60 + placeholderHeight : placeholderHeight;
  return (
    <div
      data-test-id="contact_list"
      className={`ant-allow-dark ${styles.listContainer}`}
      style={{ paddingTop: subHeight }}
      hidden={hidden}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <HotKeys keyMap={keyMap} handlers={listHotKeyHandler} allowChanges>
        <VirtualList
          onScroll={({ scrollOffset }) => {
            setShowBackTop(scrollOffset > getCountsHeight());
          }}
          itemSize={getRowHeight}
          itemCount={dataList.length}
          ref={listRef}
          height={height - subHeight}
          width={width}
          innerElementType={props => {
            const { children, style } = props;
            return (
              <div className={styles.vListInnerWrap} style={{ ...style }}>
                <>{children}</>
                <div className={styles.vListInnerDragPlaceholder} hidden={!listDragActive}>
                  <div className={styles.circle}></div>
                  <div className={styles.line}></div>
                </div>
              </div>
            );
          }}
          innerRef={listInnerRef}
          outerRef={listOuterRef}
        >
          {({ index, style }) => {
            const item = dataList[index];
            const top = parseFloat(style.top as string) + (!showPersonalLabelTag ? listWithStickyHeaderPaddingTop : 0);
            let checked;
            let key;
            let showCheckbox = true;
            let expanded;
            let visibleExpandIcon;
            let visibleMarked;
            let visibleDrag = visibleSort;
            let isOrgchildren = false;
            let selected;
            const selectedKey = selectedData && 'renderKey' in selectedData ? selectedData.renderKey : selectedData?.id;
            if (item) {
              if ('orgType' in item) {
                selected = selectedKey === item.id;
                key = item.id;
                checked = checkedMap.has(item.id);
                visibleExpandIcon = true;
                expanded = expandIds.has(key);
                visibleMarked = item.orgType === 'personalOrg';
              } else {
                key = item.renderKey || item.id;
                selected = selectedKey === key;
                checked = Boolean(item.id && checkedMap.has(item.id));
                showCheckbox = !item.renderKey;
                visibleMarked = item.type === 'personal' && !item.renderKey;
                isOrgchildren = !!item.renderKey;
                visibleDrag = visibleDrag && !isOrgchildren;
              }
            }
            return (
              <div key={key} style={{ ...style, top }}>
                <Skeleton className={styles.itemSkeleton} active loading={loading} paragraph={{ rows: 2 }} title={false} avatar>
                  <Item
                    showTag={showPersonalLabelTag}
                    item={item}
                    index={index}
                    checked={checked}
                    selected={selected}
                    onCheck={() => handleCheck(item)}
                    onSort={onSort}
                    onExpand={() => {
                      onExpand && onExpand(item);
                    }}
                    visibleMarked={visibleMarked}
                    onSelect={() => handleSelect(item)}
                    searchValue={searchValue}
                    visibleDrag={visibleDrag}
                    onMarked={onMarked}
                    showCheckbox={showCheckbox}
                    visibleExpandIcon={visibleExpandIcon}
                    isOrgchildren={isOrgchildren}
                    expanded={expanded}
                  />
                </Skeleton>
              </div>
            );
          }}
        </VirtualList>
      </HotKeys>
      <div className={styles.batchCheckBoxWrap} hidden={!visibleBatchCheckBox}>
        <ContactFooter
          width={width}
          onCheck={handleCheckAll}
          totalCount={dataList.length}
          checkedCount={checkedMap.size}
          onCancel={() => {
            handleCheckAll(false);
            setVisibleBatchCheckBox(false);
          }}
        />
      </div>
      <div hidden={!showBackTop} style={{ marginLeft: width - 58 }} className={classnames(styles.backTopWrapper, checkedMap.size > 0 && styles.backTopWrapperWithFooter)}>
        <BackToTopIcon title={getIn18Text('HUIDAODINGBU')} onClick={handleBackToTop} style={{ cursor: 'pointer' }} />
      </div>
      <div className={styles.dragWrapRef} style={{ position: 'absolute', zIndex: -9999, top: -10000 }}>
        <div id="contact-drag-item" style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', overflow: 'hidden' }} />
      </div>
    </div>
  );
});

// const CustomScrollBar: React.ElementType = React.forwardRef(({ onScroll, ...props }: any, ref) => (
//   <OverlayScrollbarsComponent
//     ref={ref}
//     options={{
//       scrollbars: { autoHide: 'leave', autoHideDelay: 0 },
//       callbacks: {
//         onScroll
//       }
//     }}
//     // eslint-disable-next-line react/jsx-props-no-spreading
//     {...props}
//   />
// ));
