import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown, Menu, Tabs, Tooltip } from 'antd';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import classnames from 'classnames';
import IconCard from '@web-common/components/UI/IconCard';
import { apiHolder, apis, DataTrackerApi, HtmlApi, SystemApi, util } from 'api';
import styles from './MailTab.module.scss';
import { actions as mailTabActions, MailTabModel, ReadTabModel, tabId, tabType, WriteMailTypes } from '@web-common/state/reducer/mailTabReducer';
import { MailActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import TabMemuClose from '@web-common/components/UI/Icons/svgs/mail/TabMemuClose';
import TabCloseIcon from '@web-common/components/UI/Icons/svgs/mail/TabCloseIcon';
// import ReplyIcon from '@web-common/components/UI/Icons/svgs/ReplySvg';
// import TransmitIcon from '@web-common/components/UI/Icons/svgs/TransmitSvg';
// import ReplyAllIcon from '@web-common/components/UI/Icons/svgs/ReplyAllSvg';
import WriteLetterIcon from '@web-common/components/UI/Icons/svgs/WriteLetterSvg';
// import { useWhyDidYouUpdate } from 'ahooks';
import { getIn18Text } from 'api';

const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const htmlApi = apiHolder.api.requireLogicalApi(apis.htmlApi) as unknown as HtmlApi;

const { TabPane } = Tabs;
interface MailTabProps {
  onBeforeClose?: (closeIds: string[]) => Promise<boolean>;
  onDbClick?: (id: string) => Promise<boolean>;
}
interface TabNodeProps {
  id: string;
  index: string;
  isActive: boolean;
  // moveTabNode: (id: string, to: string) => void;
  onDrop: (hash: string) => void;
  onTabDbClick: (e: any, id: MailTabModel['id']) => void;
}
interface TabTitleProps {
  data: MailTabModel;
  activeKey: string;
}
interface DropdownButtonProps {
  dropdownVisible: boolean;
  displayChange: (isShow: boolean) => void;
  onClick?: () => void;
  isFloat: boolean;
}
enum ItemTypes {
  DND_TAB = 'DND_TAB',
}
interface Item {
  id: string;
  originalIndex: number;
}
const tag = '[MailTab]';
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron;

const isMac = inElectron() ? window.electronLib.env.isMac : apiHolder.env.isMac;
const TAB_FLOAT_COUNT = isMac ? 15 : 13;
const DefaultPromiseFn = () => Promise.resolve(true);

const tooltipContainer = () =>
  (document.getElementById('mailboxModule') || document.getElementsByClassName('mailtab-layout')[0] || document.body) as unknown as HTMLElement;

const TabTitle: FC<TabTitleProps> = ({ data, activeKey, orginActiveKey }) => {
  const decodeTitle = useMemo(() => {
    return htmlApi.decodeHtml(data?.title);
  }, [data?.title]);
  const [showPopover, setShowPopover] = useState<boolean>(false);
  const titleRef = useRef<HTMLDivElement>(null);

  const validShowPopover = useCallback(() => {
    if (titleRef?.current) {
      setShowPopover(titleRef?.current?.scrollWidth > titleRef?.current?.clientWidth);
    }
  }, []);

  useEffect(() => {
    validShowPopover();
  }, [decodeTitle]);

  const title = useMemo(() => {
    const tabIsActive = data.id === activeKey;
    let proxyTitle = '';
    /**
     * 处理二级页签需要在父级页签title联动的逻辑
     */
    // 判断当前激活节key是否属于当前节点
    if (orginActiveKey?.includes('/') && orginActiveKey.split('/')[0] == data.id && data?.subTabs) {
      const activeSubTab = data?.subTabs?.find(item => item?.id == orginActiveKey);
      if (activeSubTab && activeSubTab?.proxyTitle) {
        proxyTitle = htmlApi.decodeHtml(activeSubTab?.proxyTitle);
      }
    }
    // 第一个单独处理
    if (data.id === tabId.readMain) {
      const activeSubTab = data?.subTabs?.find(item => !!item.isActive);
      if (activeSubTab && activeSubTab?.proxyTitle) {
        proxyTitle = htmlApi.decodeHtml(activeSubTab?.proxyTitle);
      }
    }

    return (
      <span className={classnames(styles.tabPane, { [styles.tabPaneActive]: tabIsActive })}>
        {WriteMailTypes.includes(data.type) && (
          <span className={styles.tabIcon}>
            <WriteLetterIcon
              opacity={data.id === activeKey || !systemApi.isElectron() ? '1' : '0.4'}
              stroke={data.id === activeKey || !systemApi.isElectron() ? '#262A33' : '#FFFFFF'}
            />
            {/* {getWriteIcon(data.type, { opacity: data.id === activeKey ? '1' : '0.4', stroke: data.id === activeKey ? '#262A33' : '#FFFFFF' })} */}
          </span>
        )}
        {data?.render ? (
          data.render(data, tabIsActive)
        ) : (
          <span className={styles.tabTitle} ref={titleRef}>
            {proxyTitle ? proxyTitle : decodeTitle}
          </span>
        )}
      </span>
    );
  }, [data, activeKey, orginActiveKey]);

  return (
    <Tooltip
      placement="bottom"
      getPopupContainer={tooltipContainer}
      overlayClassName={classnames(styles.tabNodeTip, { [styles.tabNodeTipHide]: !showPopover })}
      autoAdjustOverflow
      title={<div className={styles.tabNodeTipCnt}>{util.chopStrToByteSize(decodeTitle, 60)}</div>}
    >
      {title}
    </Tooltip>
  );
};

// 处理页签切换的打点上报逻辑
const trackMailTabClick = (id: string) => {
  if (id == tabId.readCustomer) {
    trackApi.track('wiamao_mail_tab', { type: 'The_customer_mail' });
  } else if (id == tabId.subordinate) {
    trackApi.track('wiamao_mail_tab', { type: 'Subordinate_mail' });
  }
};

const MailTab: React.FC<MailTabProps> = props => {
  const { onBeforeClose = DefaultPromiseFn, onDbClick = DefaultPromiseFn } = props;
  const [activeKey, setActiveKey] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isDropdownButtonShow, setDropdownButtonShow] = useState<boolean>(true);
  const [isDropdownButtonFloat, setDropdownButtonFloat] = useState<boolean>(false);
  const currentTabId: string = useAppSelector(state => state.mailTabReducer.currentTab.id);
  const tabList: MailTabModel[] = useAppSelector(state => state.mailTabReducer.tabList);
  const readTabList: ReadTabModel[] = useAppSelector(state => state.mailTabReducer.readTabList);
  const dispatch = useAppDispatch();

  // const iconMap: any = {
  //   reply: ReplyIcon,
  //   replyAll: ReplyAllIcon,
  //   forward: TransmitIcon,
  //   common: WriteLetterIcon
  // };
  // type IconMapKey = keyof typeof iconMap;
  // const getWriteIcon = (type: IconMapKey, props: any) => {
  //   const WriteIcon = iconMap[type];
  //   return <WriteIcon {...props} />;
  // };

  // useWhyDidYouUpdate('MailTab', { ...props, activeKey,dropdownVisible,isDropdownButtonShow,isDropdownButtonFloat});

  // 处理下拉菜单浮动
  // todo: useeffect 转useMemo
  useEffect(() => {
    // 如果页签数量 大于限定 并且 下拉按钮不在可视范围，则浮动
    if (tabList.length >= TAB_FLOAT_COUNT && !isDropdownButtonShow) {
      setDropdownButtonFloat(true);
    } else if (tabList.length < TAB_FLOAT_COUNT) {
      // 按页签数量作为取消浮动条件，直接else会疯狂闪烁
      setDropdownButtonFloat(false);
    }
  }, [tabList.length, isDropdownButtonShow]);

  // const firstWriteTab = useMemo(() => {
  //   return tabList.find(item => WriteMailTypes.includes(item.type));
  // }, [tabList]);

  const setTabActive = useCallback((_activeKey: string) => {
    setActiveKey(key => {
      if (_activeKey !== key) {
        if (_activeKey?.includes('/')) {
          return _activeKey?.split('/')[0];
        }
        return _activeKey;
      }
      return key;
    });
  }, []);

  // 切换页签
  const onSwitch = useCallback((e, id: MailTabModel['id']) => {
    // e?.stopPropagation();
    console.log(tag, 'onSwitch', id);
    setDropdownVisible(false);
    setTabActive(id);
    dispatch(mailTabActions.doChangeCurrentTab(id));
  }, []);
  // 双击
  const onTabDbClick = useCallback((e, id: MailTabModel['id']) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(tag, 'onTabDbClick', id);
    onDbClick(id);
    // dispatch(mailTabActions.doChangeCurrentTab(id));
  }, []);
  // 关闭
  const onClose = useCallback(async (e, id) => {
    const res = await onBeforeClose([id]);
    if (id?.includes('&seq&')) {
      dispatch(MailActions.doRemWaittingMailId(id));
    }
    setDropdownVisible(false);
    // 可直接关闭 （二次弹窗在TabWriteLetter进行）
    if (res) {
      dispatch(mailTabActions.doCloseTab(id));
      dispatch(mailTabActions.doDeleteReadTabById(id));
    }
  }, []);
  // 关闭全部
  const closeAll = useCallback(async () => {
    setDropdownVisible(false);
    // 关闭全部至少有2个页签以上
    if (tabList.length <= 1) {
      return;
    }
    const res = await onBeforeClose(tabList.filter(item => item.closeable)?.map(item => item.id));
    // 可直接关闭 （二次弹窗在TabWriteLetter进行）
    if (res) {
      dispatch(mailTabActions.doCleanTabs());
      dispatch(mailTabActions.doCleanReadTab());
    }
    dispatch(MailActions.doSetWaittingMailIds([]));
  }, [tabList]);
  const menuItem = useCallback(
    (item: MailTabModel) => (
      <Menu.Item key={item.id} className={classnames(styles.tabMenuItem, { [styles.tabMenuItemDivider]: !item.closeable })}>
        <span
          className={classnames(styles.tabMenuItemTxt, { blue: item.id === currentTabId })}
          onClick={e => {
            onSwitch(e, item.id);
          }}
        >
          {htmlApi.decodeHtml(item.title)}
        </span>
        {item.closeable ? (
          <span
            onClick={e => {
              onClose(e, item.id);
            }}
            className={styles.tabMenuItemCloseIcon}
          >
            <TabMemuClose />
          </span>
        ) : (
          ''
        )}
      </Menu.Item>
    ),
    [onSwitch, onClose]
  );
  const tabDropHandler = useCallback(
    dropId => {
      onDbClick(dropId);
    },
    [onDbClick]
  );
  const handleDropdownDisplayChange = useCallback(
    isShow => {
      console.log(tag, 'handleDropdownDisplayChange', isShow);
      setDropdownButtonShow(isShow);
    },
    [setDropdownButtonShow]
  );
  const renderTabBar = useCallback(
    (props: any, DefaultTabBar: any) => (
      <DefaultTabBar {...props} className={classnames(styles.tabs, [isMac ? styles.tabMac : styles.tabWindow], { [styles.backButtonPlace]: !inElectron() })}>
        {(node: any) => (
          <TabNode key={node.key} id={node.key} index={node.key} isActive={activeKey === node.key} onDrop={tabDropHandler} onTabDbClick={onTabDbClick}>
            {node}
          </TabNode>
        )}
      </DefaultTabBar>
    ),
    [activeKey, tabDropHandler, onTabDbClick]
  );

  const TabNode: FC<TabNodeProps> = useMemo(
    () =>
      ({ id, children, onDrop, isActive, onTabDbClick }) => {
        const originalIndex = id;
        const [{ isDragging, didDrop }, drag, preview] = useDrag(
          () => ({
            type: ItemTypes.DND_TAB,
            options: {
              dropEffect: 'move',
            },
            item: () => {
              console.log(tag, 'beginDrag');
              return { id, originalIndex };
            },
            collect: monitor => ({
              isDragging: monitor.isDragging(),
              didDrop: monitor.didDrop(),
            }),
            end: (
              item: {
                id: any;
                originalIndex: any;
              },
              monitor: {
                didDrop: () => any;
              }
            ) => {
              const { id: droppedId, originalIndex } = item;
              const didDrop = monitor.didDrop();
              console.log(tag, 'didDrop', !didDrop);
              if (!didDrop) {
                onDrop(originalIndex);
              }
            },
          }),
          [id, originalIndex]
        );
        const [, drop] = useDrop(
          () => ({
            accept: ItemTypes.DND_TAB,
          }),
          []
        );
        const opacity = isDragging ? 0 : 1;
        const previewContent = (
          <div
            ref={node => {
              if (id == '-1' || !inElectron()) {
                return node;
              }
              return drag(drop(node));
            }}
            style={{ opacity }}
          >
            {children}
          </div>
        );
        return (
          <>
            <div
              onDoubleClick={e => onTabDbClick(e, id)}
              className={classnames(
                styles.tabNodeWrapper,
                { [styles.tabActive]: isActive },
                { [styles.tabNodePin]: ([tabId.readMain, tabId.readCustomer] as string[]).includes(id) },
                { [styles.tabNodeDragging]: isDragging }
              )}
            >
              {previewContent}
            </div>
          </>
        );
      },
    []
  );
  const DropdownButton: FC<DropdownButtonProps> = useMemo(
    () =>
      ({ dropdownVisible, displayChange, onClick = () => {}, isFloat }) => {
        const intersectionButton = useRef(null);
        const intersection = useRef<IntersectionObserver | null>(null);
        useEffect(() => {
          intersection.current = new IntersectionObserver(entries => {
            const entry = entries[0];
            console.log(tag, 'intersection', entry.intersectionRatio, entry.isIntersecting);
            if (!entry.isIntersecting) {
              displayChange(false);
            } else {
              displayChange(true);
            }
          });
          intersectionButton?.current && intersection.current!.observe(intersectionButton?.current);
          return () => {
            intersectionButton?.current && intersection.current!.unobserve(intersectionButton?.current);
            intersection.current!.disconnect();
          };
        }, []);
        return (
          <a
            ref={intersectionButton}
            onClick={onClick}
            className={classnames(styles.tabDropdownA, { [styles.tabDropdownActive]: dropdownVisible, [styles.tabDropdownAFloat]: isFloat })}
          >
            {inElectron() ? (
              <IconCard height="8px" stroke={dropdownVisible ? '#232D47' : ''} width="8px" type="tabDropdown" />
            ) : (
              <IconCard height="8px" stroke={dropdownVisible ? '#232D47' : '#8D92A1'} width="8px" type="tabDropdown" />
            )}
          </a>
        );
      },
    []
  );

  const dropDown = useCallback(
    () => (
      <Dropdown
        overlay={
          <Menu className={styles.tabMenu} hidden={!dropdownVisible}>
            {
              <Menu.Item
                key={'closeAll'}
                hidden={tabList?.length <= 1}
                className={classnames(styles.tabMenuItem, styles.tabMenuItemDivider)}
                onClick={() => {
                  closeAll();
                }}
              >
                <span className={styles.tabMenuItemCloseTxtRed}>{getIn18Text('GUANBIQUANBU')}</span>
              </Menu.Item>
            }
            <div className={styles.tabMenuScrollWrap}>
              {tabList.map(item => {
                return menuItem(item);
              })}
            </div>
          </Menu>
        }
        overlayClassName={styles.tabDropdownContainer}
        onVisibleChange={visible => setDropdownVisible(visible)}
        trigger={['click']}
        placement="bottomCenter"
      >
        <DropdownButton dropdownVisible={dropdownVisible} isFloat={isDropdownButtonFloat} displayChange={handleDropdownDisplayChange} />
      </Dropdown>
    ),
    [dropdownVisible, tabList, closeAll, isDropdownButtonFloat, handleDropdownDisplayChange]
  );
  // useCallback
  const remove = async (targetKey: string) => {
    if (targetKey?.includes('&seq&')) {
      dispatch(MailActions.doRemWaittingMailId(targetKey));
    }
    const res = await onBeforeClose([targetKey]);
    if (res) {
      dispatch(mailTabActions.doCloseTab(targetKey));
      dispatch(mailTabActions.doDeleteReadTabById(targetKey));
      setTimeout(() => {
        const target = tabList.find(v => v.id === targetKey && [tabType.customer, tabType.subordinate].includes(v.type));
        if (target) {
          if (target.type === tabType.customer) {
            dispatch(MailActions.doRemoveSlice_cm({ sliceId: targetKey }));
          } else if (target.type === tabType.subordinate) {
            dispatch(MailActions.doRemoveSlice_sd({ sliceId: targetKey }));
          }
        }
      }, 1000);
    }
  };
  // useCallback
  const onEdit = (targetKey: any, action: any) => {
    switch (action) {
      case 'remove':
        remove(targetKey);
        break;

      default:
        break;
    }
  };

  // todo: useeffect 转useMemo
  useEffect(() => {
    const newTabId = `${currentTabId}`;
    if (newTabId !== activeKey) {
      setTabActive(newTabId);
    }
  }, [currentTabId]);

  const tabChangeHandler = useCallback(id => {
    setTabActive(id);
    trackMailTabClick(id);
    dispatch(mailTabActions.doChangeCurrentTab(id));
  }, []);

  // useMemo
  return (
    <>
      {(tabList.length && (
        <DndProvider backend={HTML5Backend}>
          <Tabs
            size="small"
            addIcon={dropDown()}
            className={classnames(
              process.env.BUILD_ISEDM ? styles.tabContainerEdm : styles.tabContainer,
              { [styles.floatDropdownWrap]: isDropdownButtonFloat },
              { [styles.webComp]: !inElectron() && !process.env.BUILD_ISEDM }
            )}
            onChange={tabChangeHandler}
            activeKey={activeKey}
            renderTabBar={renderTabBar}
            type="editable-card"
            onEdit={onEdit}
            tabPosition="top"
            animated={false}
          >
            {tabList.map(pane => {
              if (pane) {
                return (
                  <TabPane
                    closable={pane.closeable}
                    closeIcon={<TabCloseIcon className={inElectron() ? styles.tabCloseIcon : styles.tabCloseWebIcon} />}
                    tab={<TabTitle data={pane} activeKey={activeKey} orginActiveKey={currentTabId} />}
                    key={pane.id}
                  />
                );
              }
              return null;
            })}
          </Tabs>
        </DndProvider>
      )) ||
        ''}
    </>
  );
};
export default MailTab;
