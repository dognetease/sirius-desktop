import React, { FC, useState, useCallback, useEffect, useRef } from 'react';
import { Input, Select, Button, Tabs, message, Modal, Skeleton, Popover } from 'antd';
// import SearchOutlined from '@ant-design/icons/SearchOutlined';
import classnames from 'classnames/bind';

import { apiHolder, apis, MailTemplateApi, TemplateConditionRes, GetTemplateListReq, DataStoreApi, DataTrackerApi, UpdateTimeProps } from 'api';
import { ViewMail } from '@web-common/state/state';
import CloseIcon from '@/images/icons/edm/close-icon-border.svg';
import SearchIcon from '@/images/icons/edm/search-icon.svg';
import SearchClose from '@/images/icons/edm/search-close.svg';
import { ReactComponent as ArrowIcon } from '@/images/icons/edm/arrow-icon.svg';
import { ReactComponent as ImportIcon } from '@/images/icons/edm/import-icon.svg';
import { useAppSelector, useActions, MailTemplateActions, ConfigActions } from '@web-common/state/createStore';

import styles from './mailTemplate.module.scss';
import { MarketingTemplateList, MarketingTemplateListRefType } from '../components/MarketingTemplateList';
import { Aggregation } from './Aggregation';
import Preview from './template/preview';
import { SearchTemplateList, TemplateList, TemplateItem } from './TemplateList';
// import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import Drawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
import { ReactComponent as NewTagIcon } from '@/images/icons/mail/edm-template-new-notice.svg';
import { ReactComponent as VideoIcon } from '@/images/icons/edm/video.svg';
import { getIn18Text } from 'api';
import { edmDataTracker } from '../tracker/tracker';

const { Search } = Input;
const { TabPane } = Tabs;
const templateApi = apiHolder.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const storeApi = apiHolder.api.getDataStoreApi();
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const realStyle = classnames.bind(styles);

const last_update_template_suggest_time = 'last_update_template_suggest_time';

const videoDrawerConfig = { videoId: 'V16', source: 'kehukaifa', scene: 'kehukaifa_8' };

const YINGXIAO = 'LX-WAIMAO';
const SEARCH_KEYS = 'SEARCH_KEYS';

// 埋点
const TrackEnum: Record<number, string> = {
  2: 'individual',
  4: 'enterprise',
  3: 'recommendation',
};

let defaultActiveTabIndex = 0;
let lastUpdateTimeFromServer = 0;

export const MailTemplate: FC<{
  emitResult?: (data: ViewMail) => void; // 写信页模板点击”使用“的回调
  openPreviewModal?: (id: string, ids: string[]) => void;
  fromPage?: 1 | 2;
  defaultActiveTab?: number;
  goTemplateAdd: (templateId?: string, content?: string) => void;
  setVisibleModal?: (visible: boolean) => void;
  insertContent?: (content: string, successLabel) => void;
  showMarketing?: boolean;
}> = props => {
  const { emitResult, fromPage = 1, defaultActiveTab, goTemplateAdd, openPreviewModal, setVisibleModal, insertContent, showMarketing } = props;

  const { changeShowTemplateList } = useActions(MailTemplateActions);
  const marketingTemplateListRef = useRef<MarketingTemplateListRefType | null>(null);

  const [tabList, setTabList] = useState<TemplateConditionRes['tabList']>();
  const [activeKey, setActiveKey] = useState<string>();
  const [activeTags, setActiveTags] = useState<TemplateConditionRes['tabList'][0]['tagList']>();
  const [activeOrders, setActiveOrders] = useState<TemplateConditionRes['tabList'][0]['orderList']>();
  const [activeTypeList, setActiveTypeList] = useState<TemplateConditionRes['tabList'][0]['typeList']>();
  const [activeTagId, setActiveTagId] = useState<number>();
  const [activeOrder, setActiveOrder] = useState<{
    index: string;
    sort: number;
  }>();
  const [activeType, setActiveType] = useState<number>(); // 当前模板类型
  const [list, setList] = useState<Array<TemplateItem> | null>(null);
  const [searchValue, setSearchValue] = useState<string>('');
  const [inputVal, setInputVal] = useState<string>('');
  const [tabType, setTabType] = useState<number>(0);
  const [searchQueue, setSearchQueue] = useState<Array<string>>([]); // 搜索队列
  const [showDrawer, setShowDrawer] = useState(false);
  const [templateIds, setTemplateIds] = useState<Array<string>>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [spinning, setSpinning] = useState(false);

  const lastUpdateTimeFromLocal = Number(storeApi.getSync(last_update_template_suggest_time).data) || 0;

  const [shouldShowNewTag, setShouldShowNewTag] = useState<boolean>(false);

  const { showVideoDrawer } = useActions(ConfigActions);

  useEffect(() => {
    if (list != null) {
      const templateIds = list.map(item => item.templateId);
      setTemplateIds(templateIds);
    }
  }, [list]);

  useEffect(() => {
    if (TrackEnum[tabType] != null) {
      trackApi.track('pc_markting_edm_template__tab_click', {
        tabname: TrackEnum[tabType],
      });
    }
    if (shouldShowNewTag && tabType === 3) {
      storeApi.putSync(last_update_template_suggest_time, lastUpdateTimeFromServer.toString(), { noneUserRelated: false });
      setShouldShowNewTag(false);
    }
  }, [tabType, lastUpdateTimeFromServer]);

  const fetchNewTemplateIfNeeded = async () => {
    const updateTime = (await templateApi.fetchNewTemplateUpdateTime()) as UpdateTimeProps;
    lastUpdateTimeFromServer = updateTime?.lastAddTime || -1;
    const prevTime = lastUpdateTimeFromLocal || -1;
    if (lastUpdateTimeFromServer > prevTime) {
      setShouldShowNewTag(true);
    }
  };

  useEffect(() => {
    fetchNewTemplateIfNeeded();
  }, []);

  const getQueryCondition = useCallback(async () => {
    try {
      const { tabList } = await templateApi.getQueryCondition({
        fromPage,
      });

      setTabList(tabList);
      if (typeof defaultActiveTab !== 'number') {
        // 是否有默认选中的tab
        const key = tabList.findIndex(item => item.enterSelected);
        if (key > -1) {
          setActiveKey(key + '');
          defaultActiveTabIndex = tabList[key].tab.tabId;
        }
      } else {
        const key = tabList.findIndex(item => item.tab.tabId === defaultActiveTab);
        if (key > -1) {
          setActiveKey(key + '');
          defaultActiveTabIndex = tabList[key].tab.tabId;
        }
      }
    } catch (err) {
      message.error((err as Error).message || '未知错误');
    }
  }, [defaultActiveTab]);

  const getTemplateList = useCallback(async (req: GetTemplateListReq) => {
    try {
      setSpinning(true);
      const list = await templateApi.getTemplateList(req);
      setList(list?.templateList || []);
      setSpinning(false);
    } catch (err) {
      message.error((err as Error).message || '未知错误');
      setSpinning(false);
    }
  }, []);

  const queryList = (req: Omit<GetTemplateListReq, 'templateCategory'>) => {
    const { tabType, tagId, order, templateContentType } = req;

    const query: GetTemplateListReq = {
      templateCategory: YINGXIAO,
      tabType,
      ...(tagId != null ? { tagId } : {}),
      ...(order != null ? { order } : {}),
      ...(templateContentType != null ? { templateContentType } : {}),
    };
    getTemplateList(query);
  };

  // 获取聚合条件
  useEffect(() => {
    getQueryCondition();
  }, []);

  useEffect(() => {
    const list = [
      ...(searchValue !== ''
        ? [
            {
              tab: {
                tabId: 0,
                tab: getIn18Text('QUANBU'),
              },
            },
          ]
        : []),
      ...(tabList ?? []),
    ];
    if (activeKey != null && list != null && list.length > 0 && list[+activeKey]) {
      refreshList();
    }
  }, [activeTagId, activeOrder, activeType]);

  const refreshList = (list = false) => {
    if (searchValue === '' || list) {
      queryList({
        tabType: tabList![+activeKey!]!.tab.tabId,
        tagId: activeTagId,
        order: activeOrder,
        templateContentType: activeType, // todo 字段未定义
      });
    } else {
      if (activeKey === '0') {
        searchTemplate(searchValue);
      } else {
        setActiveKey('0');
      }
    }
  };

  // 设置完分组和筛选后才刷新页面
  // 用来设置分组和排序筛选。一定要在非前端拼接的tablist下触发，要不然有索引问题
  const setTabOrder = (): void => {
    const tags = tabList![+activeKey!]!.tagList || [];
    const orders = tabList![+activeKey!]!.orderList || [];
    const typeList = tabList![+activeKey!]!.typeList || [];
    setActiveTags(tags);
    setActiveOrders(orders);
    setActiveTypeList(typeList);
    let tagId;
    let order;
    let type;
    if (tags.length > 0) {
      tagId = tags[0].tagId;
    }
    if (orders.length > 0) {
      order = {
        index: orders[0].orderId,
        sort: 1,
      };
    }
    if (typeList.length > 0) {
      type = typeList[0].typeId;
    }
    if (tagId === activeTagId && order === activeOrder && type === activeType) {
      // 如果两个都相等，不触发副作用函数，直接刷新！
      refreshList(true);
    } else {
      setActiveTagId(tagId);
      setActiveOrder(order);
      setActiveType(type);
    }
  };

  // 搜索值或者tab切换，重新进行列表请求
  useEffect(() => {
    const list = [
      ...(searchValue !== ''
        ? [
            {
              tab: {
                tabId: 0,
                tab: getIn18Text('QUANBU'),
              },
            },
          ]
        : []),
      ...(tabList ?? []),
    ];
    if (activeKey != null && list != null && list.length > 0 && list[+activeKey]) {
      if (searchValue === '') {
        // 搜索内容为空，需要设置tag默认选中值
        setTabOrder();
      }
      setTabType(list[+activeKey].tab.tabId);
    }
  }, [activeKey]);

  useEffect(() => {
    if (searchValue !== '') {
      searchTemplate(searchValue);
    }
  }, [searchValue]);

  const searchTemplate = useCallback(async (query: string) => {
    try {
      setSpinning(true);
      const list = await templateApi.templateSearch({
        category: YINGXIAO,
        query,
      });
      setList(list);
      setSpinning(false);
      trackApi.track('pc_markting_edm_template_search');
    } catch (err) {
      message.error((err as Error).message || '未知错误');
      setSpinning(false);
    }
  }, []);

  const options = [
    {
      label: getIn18Text('QUANBULEIXING'),
      value: '',
    },
    {
      label: getIn18Text('CHUNWENDANGLEI'),
      value: '1',
    },
    {
      label: getIn18Text('TUWENYINGXIAOLEI'),
      value: '2',
    },
  ];

  const addNewTemplate = async (content = '') => {
    try {
      const res = await templateApi.templateQueryLimit();
      if (res.templateLimitVOList.length > 0) {
        const { count, limit } = res.templateLimitVOList[0];
        if (count >= limit) {
          message.error({
            content: getIn18Text('CHAOGUOZUIDAMOBANSHU'),
          });
          return;
        }
      }

      goTemplateAdd('', content);
    } catch (err) {
      goTemplateAdd('', content);
    }
  };

  // 添加搜索列表
  const pushSearch = (key: string, newQueue?: string[]): void => {
    if (key !== '') {
      const queue = [...(newQueue ?? searchQueue)];
      if (queue.length >= 30) {
        queue.pop();
      }
      queue.unshift(key);
      // 去一下重
      const set = new Set(queue);
      setSearchQueue([...set]);
    }
  };
  useEffect(() => {
    const result = dataStoreApi.getSync(SEARCH_KEYS);
    if (result.suc && result.data) {
      setSearchQueue(result.data.split(','));
    }
  }, []);

  useEffect(() => {
    return () => {
      dataStoreApi.putSync(SEARCH_KEYS, searchQueue.join(','));
    };
  }, [searchQueue]);

  const renderTabs = () => (
    <div className={styles.tabWrapper}>
      <Tabs activeKey={activeKey} className={styles.templateTabs} onChange={setActiveKey}>
        {[
          ...(searchValue !== ''
            ? [
                {
                  tab: {
                    tabId: 0,
                    tab: getIn18Text('QUANBU'),
                  },
                },
              ]
            : []),
          ...tabList!,
        ].map((item, index) => {
          return (
            <TabPane
              key={index + ''}
              tab={
                <div>
                  <span className={styles.tabItem}>{item.tab.tab}</span>
                  {item.tab.tabId === 3 && shouldShowNewTag && <NewTagIcon className={styles.newTagIcon} />}
                </div>
              }
            />
          );
        })}
      </Tabs>
    </div>
  );

  // 搜索值变化触发
  const searchChange = (value: string): void => {
    setSearchValue(value);
    setTimeout(() => {
      pushSearch(value);
    }, 500);
    if (value !== '') {
      setActiveKey('0');
      setTabType(0);
    } else {
      // 清空操作，需要刷新列表
      // 由于写信流程弹窗的tablist前端拼接了一个全部，隐藏掉了一个最近使用activeKey需要做处理

      const index = tabList!.findIndex(tab => tab.tab.tabId === defaultActiveTabIndex);
      if (index + '' === activeKey) {
        setTabOrder();
        // refreshList(true);
      } else {
        setActiveKey(index + '');
      }
    }
  };

  const renderAddBtn = () => {
    let button = (
      <Button
        className={`${styles.searchBtn} ${styles.searchBtn1}`}
        style={{
          width: 128,
          height: 32,
          color: '#fff',
        }}
        type={'primary'}
      >
        <span
          style={{
            marginRight: 9,
          }}
        >
          新建个人模板
        </span>
        <ArrowIcon
          className={styles.arrowIcon}
          style={{
            width: 6,
            height: 3.5,
            flexShrink: 0,
          }}
        />
      </Button>
    );
    if (fromPage === 2) {
      // 弹窗列表样式
      return (
        <Button
          className={styles.searchBtn}
          style={{
            width: 108,
            height: 32,
            color: '#386ee7',
          }}
          type={'primary'}
          ghost={true}
          onClick={() => addNewTemplate()}
        >
          <span
            style={{
              marginRight: 9,
            }}
          >
            新建个人模板
          </span>
        </Button>
      );
    }
    return (
      <Popover
        getPopupContainer={node => node}
        className={styles.popoverWrapper}
        content={
          <div className={styles.addBtn}>
            <div
              className={styles.addBtnItem}
              onClick={() => {
                addNewTemplate();
              }}
            >
              手动新建模板
            </div>
            <div
              className={styles.addBtnItem}
              onClick={() => {
                // 两件事：1. 把原来弹窗的内容隐藏掉；2. 展示现有弹窗，但是不能要mask（避免重复mask）
                setVisibleModal && setVisibleModal(true);
                if (marketingTemplateListRef.current) {
                  marketingTemplateListRef.current.setVisible(true, fromPage === 1);
                }
              }}
            >
              从营销任务选择
            </div>
          </div>
        }
      >
        {button}
      </Popover>
    );
  };

  const renderSearch = () => (
    <>
      <div className={styles.topOp}>
        <div className={styles.headTitle}>{getIn18Text('YOUJIANMOBAN')}</div>
        <div className={styles.rightFilter}>
          {fromPage !== 2 && (
            <p className={styles.videoTip} onClick={() => showVideoDrawer(videoDrawerConfig)}>
              <VideoIcon /> <span>快速了解邮件营销如何提升送达效果</span>
            </p>
          )}
          {/* 筛选区域 */}
          <Input
            // className={styles.searchInput}
            style={{
              width: 220,
              height: 32,
              marginRight: 12,
            }}
            placeholder={getIn18Text('SOUSUOYOUJIANMOBAN')}
            prefix={
              <img
                style={{
                  width: 12,
                  height: 12,
                }}
                src={SearchIcon}
              />
            }
            onPressEnter={evt => {
              const value: string = (evt.target as any).value || '';
              searchChange(value.trim());
            }}
            value={inputVal}
            // allowClear
            onChange={e => {
              const value = e.target.value;
              setInputVal(value.trim());
            }}
            suffix={
              inputVal !== '' && (
                <img
                  onClick={() => {
                    setInputVal('');
                    if (searchValue !== '') {
                      searchChange('');
                    }
                  }}
                  style={{
                    width: 16,
                    height: 16,
                    cursor: 'pointer',
                  }}
                  src={CloseIcon}
                  alt=""
                />
              )
            }
          />
          {/* 第一期先不做 */}
          {/* <Select defaultValue={''} options={options} style={{
          marginRight: 12,
          width: 132,
          height: 32,
        }} /> */}
          {renderAddBtn()}
          {fromPage === 2 && (
            <div
              style={{
                width: 16,
                height: 16,
                marginLeft: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => changeShowTemplateList({ isShow: false })}
            >
              <img src={SearchClose} alt="" />
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderAggregation = () => (
    <>
      {/* 搜索不会出现切换 */}
      {searchValue == '' && (
        <Aggregation
          fromPage={fromPage}
          key={activeKey}
          activeKey={activeKey}
          tagList={activeTags}
          orderList={activeOrders}
          typeList={activeTypeList}
          setActiveTagId={setActiveTagId}
          setActiveOrder={setActiveOrder}
          setActiveType={setActiveType}
        />
      )}
    </>
  );

  const renderList = () => (
    <SearchTemplateList
      spinning={spinning}
      action={(type, templateId) => {
        switch (type) {
          case 'display': {
            if (fromPage === 2) {
              openPreviewModal && openPreviewModal(templateId, templateIds);
            } else {
              setShowDrawer(true);
            }
            setTemplateId(templateId);
            break;
          }
          case 'search': {
            const index = +templateId;
            const value = searchQueue[index];
            setSearchValue(value);
            searchTemplate(value);
            setInputVal(value);
            // 把原来队列顺序调整一下
            const newQueue = [...searchQueue];
            newQueue.splice(index, 1);
            pushSearch(value, newQueue);
            break;
          }
          case 'deleteHistoryItem': {
            const index = +templateId;
            const newQueue = [...searchQueue];
            newQueue.splice(index, 1);
            setSearchQueue(newQueue);
            if (newQueue.length === 0) {
              searchChange('');
              setInputVal('');
            }
            break;
          }
          case 'deleteHistory': {
            setSearchQueue([]);
            searchChange('');
            setInputVal('');
            dataStoreApi.putSync(SEARCH_KEYS, '');
            break;
          }
          case 'edit': {
            setTemplateId(templateId);
            goTemplateAdd(templateId);
            break;
          }
          case 'deleteItem': {
            Modal.confirm({
              title: getIn18Text('QUEDINGYAOSHANCHUGAIMOBANMA\uFF1F'),
              okText: getIn18Text('QUEDING'),
              cancelText: getIn18Text('QUXIAO'),
              centered: true,
              onOk: () => {
                templateApi
                  .doDeleteMailTemplate({
                    templateId,
                  })
                  .then(res => {
                    if (res.data === 'success') {
                      message.success(getIn18Text('SHANCHUCHENGGONG'));
                      refreshList();
                    } else {
                      message.error(getIn18Text('SHANCHUSHIBAI\uFF0CQINGZHONGSHI'));
                    }
                  });
              },
            });
            break;
          }
        }
      }}
      emitResult={emitResult}
      searchQueue={searchQueue}
      activeTabId={tabType}
      refreshList={refreshList}
      searchValue={searchValue}
      list={list}
      orderList={activeOrders}
      order={activeOrder?.index}
      goTemplateAdd={goTemplateAdd}
      fromPage={fromPage}
      activeType={activeType}
    />
  );

  // 展示骨架屏
  if (activeKey == null || tabList == null) {
    return (
      <div className={styles.templateWrapper}>
        <div
          className={realStyle({
            templateHeaderModal: fromPage === 2,
            templateHeader: fromPage !== 2,
          })}
        >
          {renderSearch()}
        </div>
        <div
          style={{
            padding: 24,
          }}
        >
          <Skeleton active />
        </div>
      </div>
    );
  }

  const renderMarketingTemplateList = () => (
    <MarketingTemplateList
      insertContent={(content, needSave, successLabel) => {
        insertContent && insertContent(content);
        if (!needSave) {
          changeShowTemplateList({ isShow: false });
        }
      }}
      afterModalClose={() => {
        setVisibleModal && setVisibleModal(false);
      }}
      addNewTemplate={addNewTemplate}
      fromPage={fromPage}
      ref={marketingTemplateListRef}
    />
  );

  if (fromPage === 2) {
    // 弹窗模板列表样式
    return (
      <div className={styles.templateWrapper}>
        <div className={styles.templateHeaderModal}>{renderSearch()}</div>
        <div className={styles.templateModalList}>
          <Tabs
            className={realStyle({
              templateModalTabs: true,
              hideTab: searchValue !== '',
            })}
            tabPosition="left"
            activeKey={activeKey}
            onChange={setActiveKey}
          >
            {[
              ...(searchValue !== ''
                ? [
                    {
                      tab: {
                        tabId: 0,
                        tab: getIn18Text('QUANBU'),
                      },
                    },
                  ]
                : []),
              ...tabList,
            ].map((item, index) => {
              return (
                <TabPane
                  key={index + ''}
                  tab={
                    <div>
                      <span className={styles.tabItem}>{item.tab.tab}</span>
                      {item.tab.tabId === 3 && shouldShowNewTag && <NewTagIcon className={styles.newTagIcon} />}
                    </div>
                  }
                />
              );
            })}
          </Tabs>
          <div className={styles.rightList}>
            <div className={styles.leftTopBox} hidden={(activeTags == null || activeTags.length === 0) && (activeOrders == null || activeOrders.length === 0)}>
              {renderAggregation()}
            </div>
            {renderList()}
          </div>
          {showMarketing ? (
            <div
              onClick={() => {
                // 两件事：1. 把原来弹窗的内容隐藏掉；2. 展示现有弹窗，但是不能要mask（避免重复mask）
                setVisibleModal && setVisibleModal(true);
                if (marketingTemplateListRef.current) {
                  marketingTemplateListRef.current.setVisible(true, fromPage === 1);
                }
              }}
              className={styles.marketingList}
            >
              <ImportIcon
                style={{
                  width: 16,
                  height: 16,
                  marginRight: 4,
                }}
              />
              从营销任务选择
            </div>
          ) : (
            <></>
          )}
        </div>
        {renderMarketingTemplateList()}
      </div>
    );
  }

  return (
    <div className={styles.templateWrapper}>
      <div className={styles.templateHeader}>
        {renderSearch()}
        {renderTabs()}
        {renderAggregation()}
      </div>
      {renderList()}
      <Drawer
        bodyStyle={{ padding: '0px' }}
        width={872}
        title={null}
        closable={false}
        onClose={() => {
          setShowDrawer(false);
        }}
        visible={showDrawer}
      >
        <Preview
          templateId={templateId}
          allTemplateId={templateIds}
          closeModal={() => {
            setShowDrawer(false);
          }}
          emitResult={emitResult}
        />
      </Drawer>
      {renderMarketingTemplateList()}
    </div>
  );
};

export default MailTemplate;
