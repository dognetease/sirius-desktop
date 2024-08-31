import React, { useMemo, useState, useEffect, useImperativeHandle, useRef } from 'react';
import { apiHolder, apis, AddressBookNewApi, QuickMarktingGroup, MarktingContactGroup } from 'api';
import { Dropdown, Form, Input, Menu, message } from 'antd';
import style from './quickMarktingTab.module.scss';
import classnames from 'classnames/bind';
import { ReactComponent as Ellipsis } from '@/images/icons/contactDetail/ellipsis.svg';
import { ReactComponent as TranslateClose } from '@/images/translate_close.svg';
import lodashGet from 'lodash/get';
// import Modal from '@web-common/components/UI/SiriusModal/index';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import { CreateMarktingRule } from './createMarktingRule';
import zipObject from 'lodash/zipObject';
// import { Tabs as SiriusTabs } from '@web-common/components/UI/Tabs';
import SiriusTabs from '@lingxi-common-component/sirius-ui/Tabs';
import { jumpToAddressListContactList } from '../../utils';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import cloneDeep from 'lodash/cloneDeep';
import qs from 'querystring';
import { recordDataTracker } from '../../utils';

const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;
const eventApi = apiHolder.api.getEventApi();
const datastoreApi = apiHolder.api.getDataStoreApi();
const realStyle = classnames.bind(style);

export const AddRuleIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 8H13.5" stroke="#4C6AFF" stroke-linecap="round" />
      <path d="M8 13.5L8 2.5" stroke="#4C6AFF" stroke-linecap="round" />
    </svg>
  );
};

const type = 'DraggableTabNode';
interface DraggableTabPaneProps extends React.HTMLAttributes<HTMLDivElement> {
  index: React.Key;
  canDrag?: boolean;
  moveNode: (dragIndex: React.Key, hoverIndex: React.Key) => void;
}

const DraggableTabNode = ({ index, children, moveNode, canDrag = true }: DraggableTabPaneProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isOver, dropClassName }, drop] = useDrop({
    accept: type,
    collect: monitor => {
      const { index: dragIndex } = monitor.getItem() || {};
      if (dragIndex === index) {
        return {};
      }
      return {
        isOver: monitor.isOver(),
        dropClassName: 'dropping',
      };
    },
    drop: (item: { index: React.Key }) => {
      moveNode(item.index, index);
    },
  });
  const [, drag] = useDrag({
    type,
    item: { index },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });
  drop(drag(ref));

  return (
    <div ref={ref} style={{ marginRight: 12 }} className={isOver ? dropClassName : classnames('defaultMarktingDragTab')}>
      {children}
    </div>
  );
};

const DraggableTabs: React.FC<{
  items: PartialQuickMarktingGroup[];
  renderCustomTag(item: PartialQuickMarktingGroup, index: number): React.ReactNode;
  orderlist: React.Key[];
  setOrderlist(list: string[]): void;
  [key: string]: unknown;
}> = props => {
  const { items = [], renderCustomTag, orderlist: order, setOrderlist, ...restProps } = props;

  const moveTabNode = (_dragKey: React.Key, _hoverKey: React.Key) => {
    const dragKey = `${_dragKey}`;
    const hoverKey = `${_hoverKey}`;
    const newOrder: React.Key[] = cloneDeep(order);

    const dragIndex = newOrder.indexOf(`${dragKey}`);
    const hoverIndex = newOrder.indexOf(`${hoverKey}`);

    if (hoverIndex === 0) {
      message.error(`您不能将当前标签移动到[${items[0].group_name}]之前`);
      return;
    }

    if (dragIndex === -1 || hoverIndex == -1) {
      return;
    }

    newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, dragKey);

    setOrderlist(newOrder);
  };

  const renderTabBar = (item: PartialQuickMarktingGroup, index: number) => (
    <SiriusTabs.TabPane
      key={item.group_id}
      tab={
        item.disableDrag ? (
          <div className={classnames('defaultMarktingDragTab')} style={{ marginRight: 12 }}>
            {renderCustomTag(item, index)}
          </div>
        ) : (
          <DraggableTabNode key={item.group_id} index={item.group_id} moveNode={moveTabNode}>
            {renderCustomTag(item, index)}
          </DraggableTabNode>
        )
      }
    ></SiriusTabs.TabPane>
  );

  const sortByOrder = (items: PartialQuickMarktingGroup[]) => {
    const orderedList: PartialQuickMarktingGroup[] = [];
    if (!order || !order.length) {
      return items;
    }
    const itemMap = new Map(
      cloneDeep(items).map(item => {
        return [item.group_id, item];
      })
    );

    (order as number[]).forEach((_groupId: number) => {
      const groupId = Number(_groupId);
      if (!itemMap.has(groupId) || Number.isNaN(groupId)) {
        return;
      }
      orderedList.push(itemMap.get(groupId)!);
      itemMap.delete(groupId);
    });

    return [...orderedList, ...itemMap.values()];
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <SiriusTabs {...restProps}>{sortByOrder(items).map(renderTabBar)}</SiriusTabs>
    </DndProvider>
  );
};

type PartialQuickMarktingGroup = Partial<Pick<QuickMarktingGroup, 'group_filter_settings'> & { switchType: 'user' | 'system'; disableDrag: boolean }> &
  Omit<QuickMarktingGroup, 'group_filter_settings'>;
export const QuickMarktingTab: React.FC<{}> = props => {
  // const { onMarktingLabelChange } = props
  const query = useMemo(() => qs.parse(location.hash.split('?')[1]), [location?.hash]);
  const [checkedMarktingGroup, setcheckedMarktingGroup] = useState<PartialQuickMarktingGroup | null>(null);
  const [quickMarktingCountMap, setQuickMarktingCountMap] = useState<Record<string, number>>({});
  const [marktingLabelList, setMarktingLabellist] = useState<PartialQuickMarktingGroup[]>([]);
  const [orderlist, setOrderlist] = useState<React.Key[]>([]);
  const [originOrderList, setOriginOrderlist] = useState<React.Key[]>([]);

  const createMarktingGroupRef = useRef<{ showModal(): void }>();

  const fetchQuickMarktingGroupList = async () => {
    return addressBookApi.getQuickMarktingList().then(args => {
      // 设置列表
      setMarktingLabellist(
        args.map((item, index) => {
          if (index === 0) {
            return {
              ...item,
              disableDrag: true,
            };
          }
          return item;
        })
      );
      return args;
    });
  };

  // 删除自定义标签
  const removeUserLabel = async (item: PartialQuickMarktingGroup) => {
    Modal.warning({
      title: `是否要删除该自定义快捷营销规则?`,
      okText: '确定',
      cancelText: '取消',
      onCancel() {},
      async onOk() {
        const curGroupId = item.group_id;
        await addressBookApi.deleteQuickMarktingGroup({
          groupId: curGroupId,
        });

        const list = marktingLabelList.filter(item => item.group_id !== curGroupId);
        // 如果当前label是被选中状态 直接删除
        if (curGroupId === item?.group_id) {
          const firstTab = lodashGet(list, '[0]', null);
          setcheckedMarktingGroup(
            firstTab
              ? {
                  switchType: 'user',
                  ...firstTab,
                }
              : firstTab
          );
        }
        // 移除被删除label
        setMarktingLabellist(list);
        message.success('删除成功');
      },
    });
  };

  const generateInitOrder = (items: PartialQuickMarktingGroup[], _order: string[]) => {
    const groupIds = new Set(
      items.slice(1).map(item => {
        return `${item.group_id}`;
      })
    );
    const newOrder = [`${items[0].group_id}`];

    _order.forEach(_id => {
      if (!groupIds.has(_id)) {
        return;
      }
      newOrder.push(_id);
      groupIds.delete(_id);
    });

    newOrder.push(...groupIds);
    setOrderlist(newOrder);
  };

  useEffect(() => {
    if (!marktingLabelList.length) {
      return;
    }
    // 如果order长度为0 从本地内存中去取order排序
    if (orderlist.length) {
      generateInitOrder(marktingLabelList, orderlist as string[]);
      return;
    }

    datastoreApi.get('addressBookQuickMarktingTabOrder').then(({ suc, data: orderString }) => {
      if (!suc || !orderString || !orderString?.length) {
        generateInitOrder(marktingLabelList, []);
        return;
      }
      generateInitOrder(marktingLabelList, orderString.split(','));
    });
  }, [marktingLabelList.length]);

  // 请求所有快捷营销标签
  useEffect(() => {
    fetchQuickMarktingGroupList().then(list => {
      if (!list || !list.length) {
        return;
      }

      const firstTab =
        (query.markting_group_id &&
          list.find(item => {
            return `${item.group_id}` === query.markting_group_id;
          })) ||
        list[0];

      // 设置默认选中
      setcheckedMarktingGroup(
        Object.assign({
          switchType: 'system',
          ...firstTab,
        })
      );
    });
  }, []);

  // 获取所有营销标签数量
  useEffect(() => {
    if (!marktingLabelList.length || Object.keys(quickMarktingCountMap).length) {
      return;
    }

    Promise.all(
      marktingLabelList.map(item => {
        return addressBookApi.getQuickMarktingGroupCount({
          groupId: item.group_id,
          type: item.type,
        });
      })
    ).then(results => {
      console.log('dddddd', results);
      const countMap = zipObject(
        marktingLabelList.map(item => {
          return item.group_id;
        }),
        results
      );
      setQuickMarktingCountMap(countMap);
    });
  }, [marktingLabelList.length]);

  // 切换Tab
  useEffect(() => {
    if (!checkedMarktingGroup || !checkedMarktingGroup.group_id) {
      return;
    }
    // onMarktingLabelChange(checkedMarktingGroup)

    // 发送通知
    const $t = setTimeout(() => {
      addressBookApi
        .getQuickMarktingGroupCount({
          type: checkedMarktingGroup.type || 'INITITAL',
          groupId: checkedMarktingGroup.group_id,
        })
        .then(count => {
          setQuickMarktingCountMap(countMap => {
            return { ...countMap, [checkedMarktingGroup?.group_id]: count };
          });
        });

      eventApi.sendSysEvent({
        eventName: 'changeQuickMarktingGroup',
        eventData: checkedMarktingGroup,
      });
    }, 50);
    return () => {
      $t && clearTimeout($t);
    };
  }, [checkedMarktingGroup?.group_id]);

  useEffect(() => {
    if (!query.refreshkey || !(query.refreshkey as string).startsWith('markting') || !checkedMarktingGroup) {
      return;
    }

    addressBookApi
      .getQuickMarktingGroupCount({
        type: checkedMarktingGroup.type || 'INITITAL',
        groupId: checkedMarktingGroup.group_id,
      })
      .then(count => {
        setQuickMarktingCountMap(countMap => {
          return { ...countMap, [checkedMarktingGroup?.group_id]: count };
        });
      });
  }, [query?.refreshkey]);

  // 联动联系人列表
  // useEffect(() => {
  //   if (!checkedMarktingGroup || !checkedMarktingGroup.group_id || checkedMarktingGroup.switchType !== 'user') {
  //     return;
  //   }
  //   jumpToAddressListContactList({
  //     filter: checkedMarktingGroup.group_filter_settings?.grouped_filter,
  //     target: 'overview',
  //   });
  // }, [checkedMarktingGroup?.group_id]);

  const createdQuickMarktingGroup = async (params: { groupId: number; groupName: string }) => {
    const list = await fetchQuickMarktingGroupList();
    const hasCurGroup = list.find(item => {
      return item.group_id === params.groupId;
    });

    recordDataTracker('pc_marketing_contactBook_edmGuide', {
      action: 'new',
    });

    hasCurGroup &&
      setcheckedMarktingGroup({
        ...hasCurGroup,
        switchType: 'user',
      });
  };

  const switchTab = (id: string) => {
    const tab = marktingLabelList.find(item => {
      return `${item.group_id}` === id;
    });

    if (tab?.type === 'INITITAL') {
      const tabsnames = {
        1: 'all',
        2: 'none',
        3: 'threeMonths',
        4: 'once',
        5: 'noReply',
        6: 'noRead',
      };
      recordDataTracker('pc_marketing_contactBook_edmGuide', {
        action: lodashGet(tabsnames, `${tab.group_id}`, 'all'),
      });
    } else {
      recordDataTracker('pc_marketing_contactBook_edmGuide', {
        action: 'customTag',
      });
    }

    if (tab) {
      tab.switchType = 'user';
      setcheckedMarktingGroup(tab);
    }
  };

  useEffect(() => {
    if (!marktingLabelList.length) {
      return;
    }
  }, [marktingLabelList.length]);

  const changeOrderList = (list: string[]) => {
    setOrderlist(list);
    datastoreApi.put('addressBookQuickMarktingTabOrder', list.join(','));
  };

  return (
    <div className={realStyle('marktingLabelWrapper')}>
      {/* <span className={realStyle('labelPrefixTitle')}>快速营销</span> */}

      <DraggableTabs
        orderlist={orderlist}
        setOrderlist={changeOrderList}
        activeKey={`${checkedMarktingGroup?.group_id || -1}`}
        defaultActiveKey={lodashGet(marktingLabelList, `[${marktingLabelList.length}-1].group_id`)}
        onChange={switchTab}
        items={marktingLabelList}
        className={realStyle('moreMarktingLabelMenu')}
        renderCustomTag={(item, index) => {
          return (
            <div className={realStyle('systemMarktingLabel', { checked: item.group_id === checkedMarktingGroup?.group_id })}>
              {item.group_name}({lodashGet(quickMarktingCountMap, `${item.group_id}`, 0)})
              {item.type === 'CUSTOMIZE' ? (
                <TranslateClose
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    removeUserLabel(item);
                  }}
                />
              ) : null}
            </div>
          );
        }}
      ></DraggableTabs>
      <div
        className={realStyle('systemMarktingLabel', 'circle')}
        onClick={() => {
          createMarktingGroupRef.current && createMarktingGroupRef.current.showModal();
        }}
      >
        <AddRuleIcon />
      </div>
      {/* 创建规则弹窗 */}
      <CreateMarktingRule ref={createMarktingGroupRef} onOK={createdQuickMarktingGroup} />
    </div>
  );
};
