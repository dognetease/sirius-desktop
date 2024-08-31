import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { Tabs, Table } from 'antd';

import { apiHolder, apis, AutoMarketApi, RequestAutoMarketTaskStats, EdmSendBoxApi } from 'api';
import { useGlobalState } from './taskBasicInfo';
import { defaultTabKey, ITabList, TAB_ACTION_EDM, additionalTabList, getCardTabList } from './config';
import { getBodyFixHeight, ELECTRON_TITLE_FIX_HEIGHT } from '@web-common/utils/constant';
import { ContactDetail } from '../addressBook/views/ContactDetail';
import { HistoryActionModal, IHistoryActionData } from '../components/historyAction/modal';
import { MailReplyListModal } from '../components/historyAction/replyModal';
import { openMail } from '../detail/detailHelper';
import style from './taskStats.module.scss';
import classnames from 'classnames';
import { getTransText } from '@/components/util/translate';

const { TabPane } = Tabs;
const autoMarketApi = apiHolder.api.requireLogicalApi(apis.autoMarketApiImpl) as unknown as AutoMarketApi;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

const TaskStats = () => {
  const [taskStats, setTaskStats] = useState(null);
  const [tabKey, setTabKey] = useState<string>('');
  const [cardTabKey, setCardTabKey] = useState<string | null>(null);
  const [dataCode, setDataCode] = useState<string | null>(null);
  const [detailInfo, setDetailInfo] = useState({ visible: false, addressId: 0 });
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const [taskDetail] = useGlobalState();
  useEffect(() => {
    if (taskDetail) {
      setTabKey(taskDetail.execAction.actionId);
    }
  }, [taskDetail]);
  // 监听 Tab 切换动态获取统计数据
  useEffect(() => {
    if (taskDetail?.taskId && tabKey && currTabList.length) {
      let currTab = currTabList.find(tab => tab.key === tabKey);
      currTab &&
        getTaskStats({
          taskId: taskDetail.taskId,
          actionId: tabKey,
        });
    }
  }, [taskDetail, tabKey, currentIndex]);
  const getTaskStats = (payload: RequestAutoMarketTaskStats) => {
    autoMarketApi.getTaskStats(payload).then(value => {
      setTaskStats(value);
    });
  };

  const actionBoxList = useMemo(() => {
    if (!taskDetail) {
      return [];
    }
    const { execAction, additionalActionLayerList = [] } = taskDetail;
    let tabList = [];
    if (execAction) {
      tabList.push({
        key: execAction?.actionId,
        text: TAB_ACTION_EDM.text,
        type: TAB_ACTION_EDM.type,
      });
    }
    additionalActionLayerList.forEach((item, index) => {
      const found = additionalTabList.find(subItem => subItem.matchActionType === item.truckAction.actionType);
      if (found) {
        tabList.push({
          key: item.truckAction?.actionId,
          isAdd: true,
          addIndex: index,
          text: `${getTransText('ZHUIJIADONGZUO')}${index + 1}`,
          type: 'infoBox', // todo ?
        });
      }
    });
    return tabList as ITabList[];
  }, [taskDetail]);

  const currTabList = useMemo(() => {
    if (!taskDetail || !actionBoxList) {
      return [];
    }

    if (!actionBoxList[currentIndex].isAdd && actionBoxList[currentIndex].key) {
      const { execAction } = taskDetail;
      return [
        {
          key: execAction?.actionId,
          text: TAB_ACTION_EDM.text,
          type: TAB_ACTION_EDM.type,
        },
      ];
    } else {
      let addIndex = actionBoxList[currentIndex].addIndex as number;
      let tabList = [];

      const { additionalActionLayerList = [] } = taskDetail;

      let action = additionalActionLayerList[addIndex as number];
      ['truckAction', 'branchAction'].forEach(key => {
        const found = additionalTabList.find(subItem => subItem.matchActionType === action[key]?.actionType);
        if (found) {
          tabList.push({
            key: action[key].actionId,
            text: found.text,
            type: found.type,
          });
        }
      });
      return tabList as ITabList[];
    }
  }, [taskDetail, actionBoxList, currentIndex, tabKey]);

  // const currTabList = useMemo(() => {
  //   if (!taskDetail) {
  //     return [];
  //   }
  //   const { execAction, additionalActionLayerList = [] } = taskDetail;
  //   let tabList = [];
  //   if (execAction) {
  //     tabList.push({
  //       key: execAction?.actionId,
  //       text: TAB_ACTION_EDM.text,
  //       type: TAB_ACTION_EDM.type
  //     })
  //   }
  //   additionalActionLayerList.forEach(item => {
  //     const found = additionalTabList.find(subItem => subItem.matchActionType === item.truckAction.actionType);
  //     if (found) {
  //       tabList.push({
  //         key: item.actionId,
  //         text: found.text,
  //         type: found.type
  //       })
  //     }
  //   })
  //   return tabList as ITabList[];
  // }, [taskDetail]);
  const [readList, setReadList] = useState<IHistoryActionData[]>([]);
  const [readListModalVisible, setReadListModalVisible] = useState<boolean>(false);
  const [replyList, setReplyList] = useState<any[]>([]);
  const [replyListModalVisible, setReplyListModalVisible] = useState<boolean>(false);

  const handleReadCountClick = useCallback((item: any) => {
    edmApi
      .getReadOperateList({
        edmEmailId: item.edmEmailId,
        contactEmail: item.contactEmail,
      })
      .then(data => {
        setReadList(data.operateInfoList as any);
        setReadListModalVisible(true);
      });
  }, []);
  const handleReplyEmailClick = useCallback((item: any) => {
    edmApi
      .getReplyOperateList({
        edmEmailId: item.edmEmailId,
        contactEmail: item.contactEmail,
        hideAutoReply: false,
      })
      .then(data => {
        setReplyList(data.operateInfoList as any);
        setReplyListModalVisible(true);
      });
  }, []);

  const handleExecListEmailClick = useCallback((item: any) => {
    setDetailInfo({ visible: true, addressId: item.contactAddressId });
  }, []);

  const currCardTabList = useMemo(() => {
    if (!taskDetail) {
      return [];
    }
    const cardTabList = getCardTabList({ handleReadCountClick, handleReplyEmailClick, handleExecListEmailClick });
    const found = currTabList.find(item => item.key === tabKey);
    return found ? cardTabList[found.type] : [];
  }, [taskDetail, tabKey, currTabList, handleReadCountClick, handleReplyEmailClick]);
  const subTabs = useMemo(() => {
    if (cardTabKey) {
      const cardTab = currCardTabList.find(item => item.key === cardTabKey);
      if (cardTab) {
        return cardTab.subTabs || [];
      }
      return [];
    }
    return [];
  }, [currCardTabList, cardTabKey]);
  useEffect(() => {
    if (subTabs.length) {
      setDataCode(subTabs[0].dataCode);
    }
  }, [subTabs]);
  const columns = useMemo(() => {
    const subTab = subTabs.find(item => item.dataCode === dataCode);

    return subTab ? subTab.columns : [];
  }, [subTabs, dataCode]);
  const dataSource = useMemo(() => {
    if (taskStats && dataCode) {
      return taskStats[dataCode] || [];
    }
    return [];
  }, [taskStats, dataCode]);
  // 动态设置第一个卡片Tab
  useEffect(() => {
    if (currCardTabList.length > 0) {
      setCardTabKey(currCardTabList[0].key);
    } else {
      setCardTabKey(null);
    }
  }, [tabKey, currCardTabList]);

  const showSubTabs = useMemo(() => subTabs.length > 1, [subTabs]);

  return (
    <div className={style.container}>
      <div className={style.tabsBox}>
        {actionBoxList.map((item, index) => (
          <div
            className={classnames(style.box, {
              [style.active]: index === currentIndex,
            })}
            onClick={() => {
              setCurrentIndex(index);
              setTabKey(item.key);
            }}
          >
            {item.text}
          </div>
        ))}
        <div></div>
      </div>
      <Tabs className={style.tabs} activeKey={tabKey} onChange={setTabKey}>
        {currTabList.map(tab => (
          <TabPane tab={tab.text} key={tab.key} />
        ))}
      </Tabs>
      <Tabs type="card" className={style.cardTab} activeKey={cardTabKey} onChange={setCardTabKey}>
        {currCardTabList.map(tab => (
          <TabPane
            key={tab.key}
            tab={
              <div className={style.tabItem}>
                {tab.icon && <img className={style.tabIcon} src={tab.icon} />}
                <div>
                  <div className={style.tabItemText}>{tab.text}</div>
                  <div className={style.tabItemCount}>{taskStats ? taskStats[tab.key] : '-'}</div>
                  {taskStats && tab.renderExtra && <div className={style.tabItemExtra}>{tab.renderExtra(taskStats)}</div>}
                </div>
              </div>
            }
          >
            {showSubTabs && (
              <div className={style.subTabs}>
                <Tabs activeKey={dataCode} onChange={setDataCode}>
                  {subTabs.map(subTab => (
                    <TabPane tab={subTab.name} key={subTab.dataCode} />
                  ))}
                </Tabs>
              </div>
            )}
            <Table
              // rowKey={columns[0]?.dataIndex}
              className={style.table}
              dataSource={dataSource}
              columns={columns}
              pagination={false}
            />
          </TabPane>
        ))}
      </Tabs>
      <HistoryActionModal
        visible={readListModalVisible}
        data={readList}
        onCancel={() => {
          setReadListModalVisible(false);
          setReadList([]);
        }}
        onOpenMail={openMail}
      />
      <MailReplyListModal data={replyList} visible={replyListModalVisible} onCancel={() => setReplyListModalVisible(false)} />

      {detailInfo.addressId ? (
        <ContactDetail
          id={1}
          hasContactPart={false}
          addressId={detailInfo.addressId}
          visible={detailInfo.visible}
          onClose={() => setDetailInfo({ visible: false, addressId: 0 })}
          onSuccess={() => {}}
          onError={() => {}}
          onWriteEmail={() => setDetailInfo({ visible: false, addressId: 0 })}
        />
      ) : (
        ''
      )}
    </div>
  );
};

export default TaskStats;
