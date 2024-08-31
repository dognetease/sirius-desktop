import React, { useEffect, useState, useMemo } from 'react';
import classnames from 'classnames';
import { Dropdown, Menu, MenuProps, Tooltip } from 'antd';
import { EntityCatalog, CatalogAction, api, CatalogSyncRes, ProductTagEnum } from 'api';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import Icon from '@ant-design/icons/lib/components/Icon';
import MiniCalendar from './miniCalendar';
import styles from './eventsgroups.module.scss';
import {
  actionCatalog,
  getCatalogList,
  unsubscribeCatalogFromSelfList,
  actionSetting,
  getCatalogUnChecked,
  delelteMyCatalog,
  deleteThirdAccountCatalog,
} from './service';
import { colorGhost, diffCatalogList } from './util';
import SubscribeModal from './components/SubscribeModal/SubscribeModal';
import { CloseCircleIcon, SetCalendarIcon, SpinIcon } from '@web-common/components/UI/Icons/icons';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import scheduleTracker from './tracker';
import { ScheduleActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { ReactComponent as CheckboxSvg } from '@/images/icons/calendarDetail/checkboxbase.svg';
import { ReactComponent as CheckboxColorSvg } from '@/images/icons/calendarDetail/checkboxcolor.svg';
import iconPP from '@/images/icons/calendarDetail/icon_pp.png';
import iconDD from '@/images/icons/calendarDetail/icon_dd.png';
import iconFS from '@/images/icons/calendarDetail/icon_fs.png';
import iconQW from '@/images/icons/calendarDetail/icon_qw.png';
import iconOther from '@/images/icons/calendarDetail/icon_other.png';

import CatalogPanel, { CatalogPanelAddIcon } from './components/CatalogPanel/CatalogPanel';
import Alert from '@web-common/components/UI/Alert/Alert';
import ProductAuthTag from '@web-common/components/UI/ProductAuthTag/ProductAuthTag';
import { ScheduleSyncObInitiator } from './data';
import { useShouldProductAuthTagDisplay } from '@web-common/hooks/useGetProductAuth';
import { getIn18Text } from 'api';
const eventApi = api.getEventApi();
const sysApi = api.getSystemApi();
export const CheckIcon: React.FC<{
  catalog: EntityCatalog;
  checked?: boolean;
  loadingId: string[];
}> = ({ catalog, checked, loadingId }) => {
  // 是否是正在操作选中或者取消选中的日历
  const loading = loadingId.includes(catalog.id);
  // 计算颜色
  const color = colorGhost(catalog.color);
  const RenderIcon = checked ? CheckboxColorSvg : CheckboxSvg;
  const renderIcon = () => (
    <Icon
      component={() => <RenderIcon fill={checked ? color : 'none'} className={!checked ? 'dark-invert' : ''} />}
      style={{
        fill: checked ? color : 'none',
      }}
    />
  );
  return <span className={styles.checkbox}>{loading ? <SpinIcon className="sirius-spin" /> : renderIcon()}</span>;
};
export interface EventsGroupsProps {
  onCreate?(): void;
  // 日程是否正在加载
  schduleLoading: boolean;
  active?: boolean;
  onGotoDate?(date: any): void;
}
const EventsGroups: React.FC<EventsGroupsProps> = ({ onCreate, schduleLoading, active, onGotoDate }) => {
  /** 获取日历列表 */
  const [catalogList, setCatalogList] = useState<EntityCatalog[]>([]);
  const [catalogListLoading, setCatalogListLoading] = useState<boolean>(false);
  const [subscribeModalVisible, setSubscribeModalVisible] = useState<boolean>(false);
  // 正在选中或者取消的日历
  const [loadingCatalogListId, setLoadingCatalogListId] = useState<string[]>([]);
  const scheduleActions = useActions(ScheduleActions);
  const { updateCatlogList: dispatchUpdateCatalogList, toggleSelectedCatalogIds, updateUnSelectedCatalogIds, syncSchedule } = scheduleActions;
  const { unSelectedCatalogIds } = useAppSelector(state => state.scheduleReducer);
  const updateCatalogList = (forceUpdateSchdule: boolean = false, catalogListMemo?: EntityCatalog[], tip: boolean = false) => {
    setCatalogListLoading(true);
    // console.time('getCatalogList');
    getCatalogList()
      .then(list => {
        let triggerOnChange = false;
        let catalogDataChanged = false;
        if (catalogListMemo) {
          catalogDataChanged = diffCatalogList(list, catalogListMemo);
          setCatalogList(list);
        } else {
          setCatalogList(preList => {
            // 对比是否有更新
            const changed = diffCatalogList(list, catalogListMemo || preList);
            triggerOnChange = changed || forceUpdateSchdule;
            if (changed || forceUpdateSchdule) {
              // avoid trigger rendering parent node when itself`s render lifecycle is progressing
              return list;
            }
            return preList;
          });
        }
        if (catalogDataChanged && tip) {
          SiriusMessage.success({ content: getIn18Text('BAOCUNCHENGGONG') });
        }
        // 传入缓存数据，发生变化的也需要同步下redux的状态，防止创建日程时，日历数据不是最新的
        if (catalogDataChanged || triggerOnChange) {
          dispatchUpdateCatalogList(list);
          syncSchedule();
        }
        // console.timeEnd('getCatalogList');
      })
      .finally(() => {
        setCatalogListLoading(false);
      });
  };
  useEffect(() => {
    // 同步默认选中日历
    updateUnSelectedCatalogIds(getCatalogUnChecked());
    // 独立窗口初始化强制更新日程订阅
    if (sysApi.isElectron() && !sysApi.isMainPage()) {
      updateCatalogList(true); // 订阅日程
    }
  }, []);
  // 监听是否正在加载日程
  useEffect(() => {
    if (!schduleLoading) {
      setLoadingCatalogListId([]);
    }
  }, [schduleLoading]);
  const handleToggle = (item: EntityCatalog) => {
    toggleSelectedCatalogIds(item.id);
    // 如果正在操作选中或者取消选中，则不修改
    if (!loadingCatalogListId.includes(item.id)) {
      // 选中
      setLoadingCatalogListId([...loadingCatalogListId, item.id]);
    }
  };
  const handleCatalogAction = (menuInfo: Partial<Parameters<Exclude<MenuProps['onClick'], undefined>>[0]>) => {
    const key = menuInfo.key as CatalogAction;
    let shouldAction = false;
    switch (key) {
      case 'subscribe':
        setSubscribeModalVisible(!0);
        scheduleTracker.pc_schedule_follow();
        break;
      case 'create':
        scheduleTracker.scheduleNewCatalog();
        shouldAction = !0;
        break;
      case 'import':
        shouldAction = !0;
        scheduleTracker.scheduleImport();
        break;
      default:
        break;
    }
    shouldAction &&
      actionCatalog(key, () => {
        updateCatalogList(!0, catalogList.slice(), !0);
      });
  };
  const handleUnsubscribe = async (catalog: EntityCatalog) => {
    const success = await unsubscribeCatalogFromSelfList(catalog);
    if (success) {
      SiriusMessage.success({ content: getIn18Text('TUIDINGCHENGGONG') });
      updateCatalogList();
    }
  };
  const handleDeleteMyCatalog = async (catalog: EntityCatalog) => {
    const [succ, errMsg] = await delelteMyCatalog(catalog);
    if (!succ) {
      SiriusMessage.error({ content: errMsg });
    } else {
      updateCatalogList();
    }
  };
  const confirmDelete = (catalog: EntityCatalog) => {
    const al = Alert.error({
      title: getIn18Text('QUEDINGSHANCHURI'),
      content: getIn18Text('SHANCHUHOURILI'),
      onOk: async () => {
        handleDeleteMyCatalog(catalog);
        al.destroy();
      },
      okCancel: !0,
      okType: 'danger',
    });
  };

  // 删除第三方账号日历
  const deleteThirdAccount = async (arr: EntityCatalog[]) => {
    if (arr && arr.length) {
      const res = await deleteThirdAccountCatalog(arr);
      if (res) {
        SiriusMessage.success({ content: getIn18Text('SHANCHUCHENGGONG') });
        updateCatalogList(); // 成功后刷新一次
      } else {
        SiriusMessage.success({ content: getIn18Text('SHANCHUSHIBAI') });
      }
    }
  };

  const handleJumpToSetting = (catalog: EntityCatalog) => {
    actionSetting(() => {
      updateCatalogList(!0, catalogList.slice(), !0);
    }, catalog.id);
  };
  // 监听更新
  useEffect(() => {
    let eid: number;
    let eid2: number;
    if (active) {
      eid = eventApi.registerSysEventObserver('catalogNotify', {
        func: e => {
          const b = Object.entries(e.eventData as CatalogSyncRes).some(([key, value]) => key === 'catalog' && value.hasDiff);
          if (b) {
            updateCatalogList();
          }
        },
      });
      if (!sysApi.isMainPage()) {
        eid2 = eventApi.registerSysEventObserver('syncSchedule', {
          func: e => {
            if (e.eventStrData === ScheduleSyncObInitiator.INDEPENDED_MODULE && e.eventData) {
              const { startDate } = e.eventData;
              updateCatalogList();
              onGotoDate && onGotoDate(startDate);
            }
          },
        });
      }
    }
    return () => {
      if (eid) {
        eventApi.unregisterSysEventObserver('catalogNotify', eid);
      }
      if (eid2) {
        eventApi.unregisterSysEventObserver('syncSchedule', eid2);
      }
    };
  }, [active]);
  // 定时更新
  useEffect(() => {
    let timer: number | undefined;
    if (active) {
      updateCatalogList();
      timer = sysApi.intervalEvent({
        eventPeriod: 'long',
        handler: () => {
          updateCatalogList();
        },
        seq: 1,
      });
    }
    return () => {
      if (timer) {
        sysApi.cancelEvent('long', timer);
      }
    };
  }, [active]);
  // 是自己的日历并且不是第三方账号的
  const selfCatalogList = catalogList.filter(e => e.isOwner && !e.syncAccountId);
  // 不是自己的，且不是第三方账号的
  const subscribedCatalogList = catalogList.filter(e => !e.isOwner && !e.syncAccountId);
  // 第三方账号日历，需要按照账号信息分类,数据来源还是catalogList
  const thirdAccountCatalogList = useMemo(() => {
    const accountMap = new Map<number, EntityCatalog[]>();
    catalogList
      .filter(e => !!e.syncAccountId)
      .forEach(c => {
        const syncAccountId = c.syncAccountId as number;
        const arr = accountMap.get(syncAccountId);
        if (accountMap.has(syncAccountId)) {
          if (arr && arr.length) {
            accountMap.set(syncAccountId, [...arr, c]);
          } else {
            accountMap.set(syncAccountId, [c]);
          }
        } else {
          accountMap.set(syncAccountId, [c]);
        }
      });
    return Array.from(accountMap.values());
  }, [catalogList]);

  // 渲染第三方日历logo
  const renderOtherCalendarLogo = (catalog: EntityCatalog) => {
    if (catalog && catalog.thirdAccount?.appType) {
      switch (Number(catalog.thirdAccount?.appType)) {
        case 1:
          // 钉钉
          return <img src={iconDD} className={styles.calendarLogo} />;
          break;
        case 2:
          // 企业微信
          return <img src={iconQW} className={styles.calendarLogo} />;
          break;
        case 3:
          // 飞书
          return <img src={iconFS} className={styles.calendarLogo} />;
          break;
        case 4:
          // 泡泡
          return <img src={iconPP} className={styles.calendarLogo} />;
          break;
        case 100:
          // 其他
          return <img src={iconOther} className={styles.calendarLogo} />;
          break;
        default:
          return <img src={iconOther} className={styles.calendarLogo} />;
          break;
      }
    }
  };

  // 渲染第三方日历，提取出来
  const renderThirdAccountCatalogList = () => {
    return thirdAccountCatalogList.map((EntityCatalogArr: EntityCatalog[]) => {
      return EntityCatalogArr && EntityCatalogArr.length ? (
        <CatalogPanel
          header={
            <span title={EntityCatalogArr[0].thirdAccount?.appEmail || EntityCatalogArr[0].thirdAccount?.userName}>
              {getIn18Text('otherCalendar')}({renderOtherCalendarLogo(EntityCatalogArr[0])}
              {EntityCatalogArr[0].thirdAccount?.appEmail || EntityCatalogArr[0].thirdAccount?.userName})
            </span>
          }
          key={EntityCatalogArr[0].syncAccountId}
          icon={
            <CloseCircleIcon
              onClick={e => {
                e.stopPropagation();
                deleteThirdAccount(EntityCatalogArr);
              }}
              className={styles.itemClose}
              style={{ margin: '0', display: 'block' }}
            />
          }
        >
          {EntityCatalogArr.map(g => {
            const unchecked = unSelectedCatalogIds.includes(g.id);
            return (
              <div
                key={g.id}
                onClick={() => {
                  handleToggle(g);
                }}
                className={classnames([styles.item], { [styles.itemUnchecked]: unchecked })}
              >
                <CheckIcon catalog={g} loadingId={loadingCatalogListId} checked={!unchecked} />
                <span className="sirius-ellipsis-text" title={g.name}>
                  {g.name}
                </span>
                <Tooltip title={getIn18Text('RILISHEZHI')}>
                  <SetCalendarIcon
                    onClick={e => {
                      e.stopPropagation();
                      handleJumpToSetting(g);
                    }}
                    className={styles.itemSetting}
                  />
                </Tooltip>
              </div>
            );
          })}
        </CatalogPanel>
      ) : null;
    });
  };

  return (
    <div className={styles.eventsGroupsOuter}>
      <div className={`${styles.toolbar} eventsgroups-toolbar`}>
        <button
          type="button"
          onClick={() => {
            onCreate && onCreate();
            scheduleTracker.pc_create_schedule_add();
            scheduleTracker.pc_schedule_detail_show('create');
          }}
          className={classnames('sirius-no-drag', styles.button)}
        >
          <i className={styles.addIcon} />
          <span className={styles.text}>{getIn18Text('XINJIANRICHENG')}</span>
        </button>
        <i
          onClick={() => updateCatalogList(!0)}
          className={classnames('sirius-no-drag', `${styles.syncIcon} syncIcon`, {
            'sirius-spin': schduleLoading || catalogListLoading,
          })}
        />
      </div>
      <OverlayScrollbarsComponent
        options={{
          scrollbars: { autoHide: 'leave', autoHideDelay: 0 },
        }}
        className={styles.listScroll}
      >
        <div className={styles.calenderList}>
          <MiniCalendar />
          <div className={styles.collapse}>
            <CatalogPanel
              header={getIn18Text('WODERILI')}
              key="0"
              icon={
                <Dropdown
                  trigger={['click']}
                  placement="bottomLeft"
                  overlayClassName={styles.dropDownOverlay}
                  overlay={
                    <Menu onClick={handleCatalogAction}>
                      <Menu.Item className={styles.menuItem} key="create">
                        <span>{getIn18Text('XINJIANRILI')}</span>
                      </Menu.Item>
                      <Menu.Item className={styles.menuItem} key="import">
                        <span>{getIn18Text('DAORURILI')}</span>
                      </Menu.Item>
                    </Menu>
                  }
                >
                  <CatalogPanelAddIcon />
                </Dropdown>
              }
            >
              {selfCatalogList.map(g => {
                const unchecked = unSelectedCatalogIds.includes(g.id);
                return (
                  <div
                    key={g.id}
                    onClick={() => {
                      handleToggle(g);
                    }}
                    className={classnames([styles.item], {
                      [styles.itemUnchecked]: unchecked,
                    })}
                  >
                    <CheckIcon catalog={g} loadingId={loadingCatalogListId} checked={!unchecked} />
                    <span className="sirius-ellipsis-text" title={g.name}>
                      {g.name}
                    </span>
                    {/* <Tooltip title="删除日历">
              <CloseCircleIcon
                onClick={e => {
                  e.stopPropagation();
                  confirmDelete(g);
                }}
                className={styles.itemClose}
              />
            </Tooltip> */}
                    <Tooltip title={getIn18Text('RILISHEZHI')}>
                      <SetCalendarIcon
                        onClick={e => {
                          e.stopPropagation();
                          handleJumpToSetting(g);
                        }}
                        className={styles.itemSetting}
                      />
                    </Tooltip>
                  </div>
                );
              })}
            </CatalogPanel>
            {/* 第三方账号日历 */}
            {renderThirdAccountCatalogList()}
            {/* 订阅日历 */}
            <CatalogPanel
              header={
                <ProductAuthTag
                  style={{ marginRight: useShouldProductAuthTagDisplay(ProductTagEnum.CALENDAR_SHARING_SUBSCRIBE) ? '50px' : '' }}
                  tagName={ProductTagEnum.CALENDAR_SHARING_SUBSCRIBE}
                >
                  {getIn18Text('DINGYUERILI')}
                </ProductAuthTag>
              }
              key="1"
              icon={
                <CatalogPanelAddIcon
                  onClick={() => {
                    handleCatalogAction({ key: 'subscribe' });
                  }}
                />
              }
            >
              {subscribedCatalogList
                .slice()
                .reverse()
                .map(g => {
                  const unchecked = unSelectedCatalogIds.includes(g.id);
                  return (
                    <div
                      key={g.id}
                      onClick={() => {
                        handleToggle(g);
                      }}
                      className={classnames(styles.item, {
                        [styles.itemUnchecked]: unchecked,
                      })}
                    >
                      <CheckIcon catalog={g} loadingId={loadingCatalogListId} checked={!unchecked} />
                      <span className="sirius-ellipsis-text" title={g.name}>
                        {g.name}
                      </span>
                      <Tooltip title={getIn18Text('TUIDINGRILI')}>
                        <CloseCircleIcon
                          onClick={e => {
                            e.stopPropagation();
                            handleUnsubscribe(g);
                          }}
                          className={styles.itemClose}
                        />
                      </Tooltip>
                      {/* <Tooltip title="日历设置">
            <SetCalendarIcon
              onClick={e => {
                e.stopPropagation();
                handleJumpToSetting(g);
              }}
              className={styles.itemSetting}
            />
          </Tooltip> */}
                    </div>
                  );
                })}
            </CatalogPanel>
          </div>
        </div>
      </OverlayScrollbarsComponent>
      <SubscribeModal
        onSubscribe={updateCatalogList}
        visible={subscribeModalVisible}
        afterClose={() => updateCatalogList()}
        onCancel={() => setSubscribeModalVisible(false)}
        destroyOnClose
      />
    </div>
  );
};
export default EventsGroups;
