import React, { ReactElement, useEffect, useCallback, useState, useRef, FC, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DataTrackerApi, apiHolder } from 'api';
import { Tabs, Menu, Dropdown } from 'antd';
import classnames from 'classnames';
import PreviewContent from '@web-mail/components/AttachmentPreview/PreviewContent';
import ContactEmpty from '@web-contact/component/Empty/empty';
import DocPage from '../../docPage';
import SharePage from '../../sharePage';
import { parseUrlObjectParams } from '@web-common/utils/utils';
import { getFileIcon } from '../../utils';
import IconCard, { IconMapKey } from '@web-common/components/UI/IconCard';
import styles from './tabs.module.scss';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { useEventObserver } from '@web-common/hooks/useEventObserver';
import { presentationManagr } from '../Doc/full-screen';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import { UserCardMention } from '../UserCard';
import { util } from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import copy from 'copy-to-clipboard';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import ErrorBoundary from '@web-common/hooks/ErrorBoundary';
import { getIn18Text } from 'api';
const eventApi = apiHolder.api.getEventApi();
const { TabPane } = Tabs;
const inElectron = apiHolder.api.getSystemApi().isElectron;
const isMac = inElectron() ? window.electronLib.env.isMac : apiHolder.env.isMac;
const trackerApi = apiHolder.api.requireLogicalApi('dataTrackerApiImp') as DataTrackerApi;
const OpraDirection = isMac ? 'right' : 'left';
interface ResourceParams {
  titleName: string;
  previewUrl?: string;
  type: string;
  key: string;
  url: string;
  title: ReactElement;
}
enum ItemTypes {
  DND_TAB = 'DND_TAB',
}
interface Item {
  id: string;
  originalIndex: number;
}
interface TabNodeProps {
  id: string;
  index: string;
  isActive: boolean;
  moveTabNode: (id: string, to: string) => void;
  onDrop: (hash: string) => void;
}
interface ResourceTabsProps {
  hash: string;
  onClose: (tab?: string) => void;
  onTabDnD?: (hash: string, url: string, cacheTabPage?: ReactElement) => void;
  hideRefresh?: boolean;
}
enum resourceType {
  attachment = 'attachment',
  share = 'share',
  doc = 'doc',
  sheet = 'sheet',
  unitable = 'unitable',
}
const ResourceTabs: React.FC<ResourceTabsProps> = props => {
  // type=folder&id=19000000001588&from=PERSONAL&parentResourceId=19000000001554&spaceId=504685414
  const { hash, onClose, onTabDnD = () => {}, hideRefresh = false } = props;
  const [activeKey, setActiveKey] = useState('');
  const [tabs, setTabs] = useState<ResourceParams[]>([]);
  // tabs对应的页面内容映射表，为了tabs 与实际页面内容分离
  const [tabContent, setTabContent] = useState<Map<string, ReactElement>>(new Map());
  const [activeDragId, setActiveDragId] = useState<string>('');
  // 页签栏的拖动窗口事件与其他被拖拽页签到该窗口时互斥
  const [tabNoDrag, setTabNoDrag] = useState<boolean>(false);
  const [contSpinning, setContSpinning] = useState(false);

  // 设置桌面端页签显示title
  const setHTMLTitle = (title: string) => {
    if (title && title !== document.title) {
      document.title = title;
    }
  };
  // dragEnd 事件timeout句柄
  const dropTimeoutHandler = useRef(0 as unknown as NodeJS.Timeout);
  const from = 'tab';
  const tag = '[resources]';
  const hasTab = (hash: string) => tabs.some(resource => resource.key === hash);
  const findTabUrl = (hash: string) => tabs.find(item => item.key === hash);
  const setTabActive = (_activeKey: string) => {
    setActiveKey(key => {
      if (_activeKey !== key) {
        console.log(tag, 'sendVisibleChangeMsg', key, _activeKey);
        presentationManagr.sendVisibleChangeMsg(key, false);
        presentationManagr.sendVisibleChangeMsg(_activeKey, true);
        const tab = findTabUrl(_activeKey);
        if (tab) {
          setHTMLTitle(tab.titleName);
        }
        return _activeKey;
      }
      return key;
    });
  };
  const onShareLinkCopy = (_: string, result: boolean) => {
    if (result) {
      SiriusMessage.success({ content: getIn18Text('FUZHILIANJIECHENG') });
    } else {
      SiriusMessage.error({ content: getIn18Text('CAOZUOSHIBAI') });
    }
  };
  const remove = (targetKey: string) => {
    let lastIndex = -1;
    tabs.forEach((pane, i) => {
      if (pane.key === targetKey) {
        lastIndex = i - 1;
      }
    });
    const fiterTabs = tabs.filter(pane => pane.key !== targetKey);
    setActiveKey(currentKey => {
      let key = currentKey;
      if (fiterTabs.length && key === targetKey) {
        if (lastIndex >= 0) {
          key = fiterTabs[lastIndex].key;
        } else {
          key = fiterTabs[0].key;
        }
      }
      const tab = findTabUrl(key);
      if (tab) {
        // document.title = tab.titleName;
        setHTMLTitle(tab.titleName);
      }
      return key;
    });
    // removeTabContentPage(targetKey);
    setTabContent(content => {
      content.delete(targetKey);
      return content;
    });
    setTabs(fiterTabs);
    // 通知外层关闭的tab
    if (fiterTabs.length <= 0) {
      // 全都关闭了
      close();
    } else {
      // 关闭某一个
      onClose(targetKey);
    }
  };
  const onMenuClick = useCallback(
    (e, itemKey) => {
      console.log(tag, 'onMenuClick', e, itemKey);
      const menuKey = e?.key;
      e.domEvent?.stopPropagation();
      e.domEvent?.preventDefault();
      switch (menuKey) {
        case 'close':
          remove(itemKey);
          break;
        case 'copyLink':
          setTabs(state => {
            const tab = state.find(item => item.key === itemKey);
            let link = '';
            if (tab) {
              if (tab.type === resourceType.attachment) {
                link = tab.previewUrl || '';
              } else {
                link = tab.url;
              }
              const ret = copy(link);
              onShareLinkCopy(link, ret);
            }
            return state;
          });
          break;
        default:
          break;
      }
    },
    [setTabs, remove]
  );
  const menu = (itemKey: string) => (
    <Menu className={styles.menuContent} onClick={(e: any) => onMenuClick(e, itemKey)}>
      <Menu.Item key="copyLink">
        <div className={styles.menuLink}>
          <span>{getIn18Text('FUZHILIANJIE')}</span>
        </div>
      </Menu.Item>
      <Menu.Item key="close">
        <div className={styles.menuLink}>
          <span>{getIn18Text('GUANBI')}</span>
        </div>
      </Menu.Item>
    </Menu>
  );
  const renderTabTitle = (data = { dragKey: '', title: 'Loading...', iconType: '' }) => (
    <Dropdown overlay={menu(data.dragKey)} trigger={['contextMenu']}>
      <span className={classnames(styles.tabPane)}>
        {data.iconType !== '' ? (
          <span className={styles.tabIcon}>
            <IconCard height="16px" width="16px" type={data.iconType as IconMapKey} />
          </span>
        ) : (
          ''
        )}
        <span className={styles.tabTitle}>{data.title}</span>
      </span>
    </Dropdown>
  );
  // 接收到释放消息并告知 页签窗口ID，通过路由跳转到目标窗口添加页签 并 删除当前窗口的当前页签
  useMsgRenderCallback('tabsDrop', async data => {
    const { eventData } = data;
    const { type } = eventData;
    console.log(tag, 'onreceived', type);
    // if (dragEndFromWinId === webId) {
    //   return;
    // }
    switch (type) {
      // 收到窗口触发drop
      case 'drop':
        clearTimeout(dropTimeoutHandler.current);
        if (activeDragId) {
          const tab = findTabUrl(activeDragId);
          if (tab) {
            remove(activeDragId);
            onTabDnD(tab.url, `${tab.url}&targetWindow=${eventData.dragEndFromWinId}`);
          }
          setActiveDragId('');
        }
        break;
      // 收到其他窗口页签开始拖拽
      case 'beginDrag':
        setTabNoDrag(true);
        break;
      // 收到其他窗口页签释放拖拽
      case 'endDrag':
        setTabNoDrag(false);
        break;
      default:
        break;
    }
  });
  const syncTabInfo = useCallback((hash: string, info: any = {}, previewUrl?: string) => {
    console.warn(`${tag} syncTabInfo`, hash);
    try {
      // 刷新页面会在hash后新增自定义tag，回填title需要去调才会找到原本的hash值；
      const pureHash = hash.replace(/\&tabTag=\d+/, '');
      setTabs(state => {
        const tabs = [...state];
        return tabs.map(item => {
          if (item.key === pureHash) {
            const _title = info?.name || ''; // ?.length > 20 ? `${info.name?.substr(0, 20)}...` : info.name;
            item.title = renderTabTitle({
              dragKey: item.key,
              title: _title,
              iconType: info?.fileType === 'folder' ? 'dir' : getFileIcon(info),
            });
            if (item.type === resourceType.attachment) {
              console.warn(`${tag} syncTabInfo previewUrl`, previewUrl);
              item.previewUrl = previewUrl;
            }
            item.titleName = _title;
            // document.title = _title;
            setHTMLTitle(_title);
          }
          return item;
        });
      });
    } catch (error) {
      trackerApi.track('pc_disk_view_error', {
        type: 'syncTabInfo',
        error,
      });
    }
  }, []);
  const moveTabNode = useCallback(
    (fromId: string, toId: string) => {
      const fromIndex = tabs.findIndex(({ key }) => key === fromId);
      const toIndex = tabs.findIndex(({ key }) => key === toId);
      if (fromIndex >= -1 && toIndex >= -1) {
        const copy = tabs.slice();
        [copy[fromIndex], copy[toIndex]] = [copy[toIndex], copy[fromIndex]];
        setTabs(copy);
      }
    },
    [tabs, setTabs]
  );
  const TabNode: FC<TabNodeProps> = useMemo(
    () =>
      ({ id, children, moveTabNode, onDrop, isActive }) => {
        const originalIndex = id;
        const [{ isDragging, didDrop }, drag] = useDrag(
          () => ({
            type: ItemTypes.DND_TAB,
            options: {
              dropEffect: 'move',
            },
            item: () => {
              console.log(tag, 'beginDrag');
              eventApi.sendSysEvent({
                eventName: 'tabsDrop',
                eventStrData: '',
                eventData: {
                  type: 'beginDrag',
                },
              });
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
              console.log(tag, '!didDrop', droppedId, originalIndex);
              eventApi.sendSysEvent({
                eventName: 'tabsDrop',
                eventStrData: '',
                eventData: {
                  type: 'endDrag',
                },
              });
              setActiveDragId('');
              if (!didDrop) {
                console.log(tag, 'didDrop', droppedId, originalIndex);
                // moveTabNode(droppedId, originalIndex);
                onDrop(originalIndex);
              }
            },
          }),
          [id, originalIndex, moveTabNode]
        );
        const [, drop] = useDrop(
          () => ({
            accept: ItemTypes.DND_TAB,
            hover({ id: draggedId }: Item) {
              if (draggedId !== id) {
                console.log(tag, 'hover', draggedId, id);
                moveTabNode(draggedId, id);
              }
            },
          }),
          [moveTabNode]
        );
        const opacity = isDragging ? 0 : 1;
        return (
          <div ref={node => drag(drop(node))} className={classnames(styles.tabNodeWrapper, { [styles.tabActive]: isActive })} style={{ opacity }}>
            {children}
          </div>
        );
      },
    []
  );
  const renderTabBar = (props: any, DefaultTabBar: any) => (
    <DefaultTabBar {...props} className={classnames(styles.tabs, [isMac ? styles.tabMac : styles.tabWindow])}>
      {(node: any) => (
        <TabNode key={node.key} id={node.key} index={node.key} isActive={activeKey === node.key} moveTabNode={moveTabNode} onDrop={tabDropHandler}>
          {node}
        </TabNode>
      )}
    </DefaultTabBar>
  );
  const genPageContent = (type: string, hash: string) => {
    let resPageElement: ReactElement;
    switch (type) {
      case resourceType.doc:
      case resourceType.sheet:
      case resourceType.unitable:
        resPageElement = <DocPage onFetchDetail={syncTabInfo} from={from} hash={hash} type={type} />;
        break;
      case resourceType.attachment:
        resPageElement = <PreviewContent onFetchDetail={syncTabInfo} hash={hash} type={type} from={from} />;
        break;
      default:
        resPageElement = <SharePage onFetchDetail={syncTabInfo} from={from} hash={hash} />;
        break;
    }
    return (
      <ErrorBoundary
        name="main_tabs_content"
        extraInfo={{ type, hash }}
        onReset={() => {
          util.reload();
          return false;
        }}
      >
        {resPageElement}
      </ErrorBoundary>
    );
  };

  const addResourceTab = (type: any, hash: string, url: string) => {
    console.log(tag, 'addResourceTab', type, hash);
    if (hasTab(hash)) {
      console.log(tag, getIn18Text('hashYI'));
      return;
    }
    tabs.push({
      key: hash,
      type,
      url,
      title: renderTabTitle(),
      titleName: '',
    });
    // 如果tabs不包含hash 但页面内容被缓存过，那么刷新一下页面内容
    setTabContentPage(type, hash, tabContent.has(hash));
    setTabs(tabs);
  };
  const add = (hash: any) => {
    try {
      const url = new URL(hash);
      const key = url.hash;
      const params = parseUrlObjectParams(key);
      console.log(`${tag} add params`, params);
      addResourceTab(params.type, key, hash);
      setTabActive(key);
    } catch (e) {
      console.error(tag, getIn18Text('JIEXIURL'), e);
    }
  };
  /**
   * 关闭全部
   */
  const close = (tab?: string) => {
    // 关闭前需要置空 tabs activeKey否则会有缓存
    setActiveKey('');
    onClose(tab);
    clearTabContentPage();
  };
  const closeIcon = <ReadListIcons.TabDeleteSvg />;

  /**
   * 添加/重置内容页
   * @param type
   * @param hash
   * @param needRefresh 是否需要刷新对应页签内容
   * @returns
   */
  const setTabContentPage = (type: string, hash: string, needRefresh?: boolean) => {
    console.log(tag, 'setTabContentPage', hash);
    try {
      if (tabContent.has(hash) && !needRefresh) {
        return;
      }
      // 点击刷新更新hash后缀触发rerender
      if (needRefresh) {
        tabContent.set(hash, genPageContent(type, `${hash}&tabTag=${Date.now()}`));
        setTabs(tabs.slice());
      } else {
        tabContent.set(hash, genPageContent(type, hash));
      }
      setTabContent(tabContent);
    } catch (e) {
      trackerApi.track('pc_disk_view_error', {
        type: 'setTabContentPage',
        error: e,
      });
    }
  };

  const clearTabContentPage = () => {
    if (tabContent.size > 0) {
      tabContent.clear();
      setTabContent(tabContent);
    }
  };
  const onEdit = (targetKey: any, action: any) => {
    switch (action) {
      case 'remove':
        remove(targetKey);
        break;
      default:
        break;
    }
  };
  const refresh = async () => {
    // setContSpinning(true);
    console.log(`${tag} refresh`);
    const _item: ResourceParams | undefined = findTabUrl(activeKey);
    if (_item) {
      setTabContentPage(_item.type, _item.key, true);
    }
  };
  const refreshOpration = {
    [OpraDirection]: tabs.length ? (
      <div className={`${styles.uRefresh} btn sirius-no-drag ${contSpinning ? 'sirius-spin' : ''}`} onClick={() => refresh()}>
        <ReadListIcons.RefreshSvg />
      </div>
    ) : null,
  };
  useEventObserver('electronClosed', {
    name: 'resourcePageElectronClosed',
    func: () => {
      console.log(tag, 'resourcePageElectronClosed');
      setTabs([]);
      close(from);
      presentationManagr.unWatchFullscreenChange();
    },
  });
  useEffect(() => {
    console.log(tag, getIn18Text('JIANCEDAOha'), hash);
    if (hash === '' || hash === undefined) {
      return;
    }
    setTabNoDrag(false);
    if (hasTab(hash)) {
      console.log(tag, getIn18Text('hashYI'));
      // 有文档处于演示模式 & 新激活的文档不是演示模式文档，则退出演示模式
      if (inElectron() && presentationManagr.documentFullscreen) {
        /**
         * 在Mac客户端下，需要延时执行 500 毫秒用于修复 http://jira.netease.com/browse/COSPREAD-4601 bug
         */
        if (isMac) {
          setTimeout(() => {
            presentationManagr.exitFullScreen();
          }, 500);
        } else {
          presentationManagr.exitFullScreen();
        }
      }
      setTabActive(hash);
    } else {
      add(hash);
    }
  }, [hash]);
  const tabDropHandler = useCallback(
    dropId => {
      setActiveDragId(dropId);
      // 如果在500毫秒内未收到其他窗口drop事件通知，说明释放操作在非其他页签窗口， 创建新窗口
      dropTimeoutHandler.current = setTimeout(() => {
        const tab = findTabUrl(dropId);
        // 当前窗口只有一个页签不再开启新窗口
        if (tab && tabs.length > 1) {
          remove(dropId);
          onTabDnD(tab.url, `${tab.url}&targetWindow=new`);
        }
        setActiveDragId('');
      }, 500);
    },
    [remove, findTabUrl, onTabDnD, tabs]
  );
  const tabChangeHandler = useCallback(
    id => {
      const tab = findTabUrl(id);
      if (tab) {
        // document.title = tab.titleName;
        setHTMLTitle(tab.titleName);
      }
      setTabActive(id);
    },
    [findTabUrl, setTabActive]
  );
  const renderContent = () => {
    if (tabs?.length === 0) {
      return null;
    }
    // 单窗口页签大于10个，使用动态加载，节省内存
    if (tabs?.length > 10) {
      return (
        <div className={classnames('extheme', styles.tabContent)} key={activeKey}>
          {tabContent.get(activeKey)}
        </div>
      );
    } else {
      return Array.from(tabContent).map(([key, tab]) => (
        <div className={classnames('extheme', styles.tabContent, { [styles.tabHidden]: key !== activeKey })} key={key}>
          {tab}
        </div>
      ));
    }
  };

  return (
    <ErrorBoundary
      name="main_tabs"
      onReset={() => {
        util.reload();
        return false;
      }}
    >
      {tabs?.length && (
        <DndProvider backend={HTML5Backend}>
          <Tabs
            hideAdd
            size="small"
            tabBarExtraContent={hideRefresh ? null : refreshOpration}
            className={classnames('extheme', styles.tabContainer)}
            onChange={tabChangeHandler}
            activeKey={activeKey}
            renderTabBar={renderTabBar}
            type="editable-card"
            onEdit={onEdit}
          >
            {tabs.map(pane => {
              if (pane) {
                return <TabPane closeIcon={closeIcon} tab={pane.title} key={pane.key} />;
              }
              return null;
            })}
          </Tabs>
        </DndProvider>
      )}
      <div className={`extheme ${styles.tabDragLayer}`} hidden={!tabNoDrag} />
      {renderContent()}
      {inElectron() && <UserCardMention />}
    </ErrorBoundary>
  );
};
export default ResourceTabs;
