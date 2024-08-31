import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Spin, Select } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import List from 'react-virtualized/dist/es/List';
import { DataNode, TreeProps } from 'antd/lib/tree';
import {
  apiHolder as api,
  apis,
  DataTrackerApi,
  MailApi,
  MailBoxModel,
  MailConfApi,
  MailEntryModel,
  MailModelEntries,
  MailOperationType,
  MailStatusType,
  queryMailBoxParam,
  SystemApi,
  SystemEvent,
} from 'api';
import { debounce, cloneDeep } from 'lodash';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import SideContentLayout from '@/layouts/Main/sideContentLayout';
import { iconMap, systemIsWindow } from '../util';
import useMsgCallback from '@web-common/hooks/useMsgCallback';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import useState2RM from '../hooks/useState2ReduxMock';
import { formateMailList } from '../state/customize';
import style from './mailExchange.module.scss';
import MailCard from '@web-mail/common/components/vlistCards/MailCard/MailCard';
import MailCardList from '@web-mail/common/components/vlist/MailCardList/MailCardList';
import { StrangerActions, useAppDispatch, useAppSelector, useActions, MailActions } from '@web-common/state/createStore';
import MailMenuCardList from '../common/components/vlist/MailCardList/MailMenuCardList';
import { CardOperRedFlag } from '../common/components/vlistCards/MailCard/defaultComs';
import { MailCardComProps } from '../types';
import useMailStore from '../hooks/useMailStoreRedux';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import useDebounceForEvent from '../hooks/useDebounceForEvent';
import { getCardHeight } from '@web-mail/utils/mailCardUtil';
import { getIn18Text } from 'api';
const mailManagerApi = api.api.requireLogicalApi('mailConfApiImpl') as unknown as MailConfApi;
const MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const MailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi: SystemApi = api.api.getSystemApi();
const eventApi = api.api.getEventApi();
const { Option } = Select;
type CheckStatus = {
  startDate?: string;
  offset?: number;
  status: MailStatusType;
  needRefresh: boolean;
  contactList: string[];
};
// 陌生人列表
const MailExchange: React.FC = () => {
  const curStranger = useAppSelector(state => state.strangerReducer.curStranger);
  // 邮件列表宽高设置
  const defaultListWidth = 324;
  const [listWidth, setListWidth] = useState(defaultListWidth);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [authLock, setAuthLock] = useState<boolean>(false);
  const [selectedKeys, setSelectedKeys] = useState<TreeProps['selectedKeys']>(['1']);
  const [selectedMenuKeys, setSelectedMenuKeys] = useState<TreeProps['selectedKeys']>();
  const [expandedMenuKeys, setExpandedMenuKeys] = useState<string[]>([]);
  const [treeMap, setTreeMap] = useState(new Map());
  const [selected, setSelected] = useState<number>(0);
  // 其实搜索数据
  const [startData, setStartData] = useState<CheckStatus>({
    status: 'ALL',
    needRefresh: true,
    contactList: [],
  });
  const [activeIds, setActiveIds] = useState<string[]>([]);
  // 邮件列表
  let listRef = useRef<List>(null);
  // const mailDataList = useAppSelector(state => state.strangerReducer.mailList);
  // const selectedMail = useAppSelector(state => state.strangerReducer.selectedMail);
  const [mailDataList, _setMailList] = useMailStore('mailRelateStrangeMailList');
  const [selectedMail, setSelectMail] = useState2RM('mailRelateStrangerActiveId', 'doUpdateMailRelateStrangerActiveId');
  const [selectedOrder, setSelectedOrder] = useState<number>();
  const [selectedFolder, setSelectedFolder] = useState<number>(1);
  const [checkedMails, setCheckedMails] = useState(new Map());
  const [flag, setFlag] = useState<boolean>();
  const [detailStatus, setDetailStatus] = useState<boolean>(false);
  const [listLoading, setListLoading] = useState<boolean>(true);
  const [refreshLoading, setFreshLoading] = useState<boolean>(true);
  const [mailTotal, setMailTotal] = useState<number>(20);
  const [hideMessage, setHideMessage] = useState<boolean>(false);
  // 收信按钮-loading状态
  const [refreshBtnLoading, setRefreshBtnLoading] = useState2RM('refreshBtnLoading', 'doUpdateRefershBtnLoading');
  // 标签修改自定义toast文案（成功）
  const [successMsg, setSuccessMsg] = useState('');
  // 标签修改自定义toast文案（失败）
  const [failMsg, setFailMsg] = useState('');
  // const { doUpdateMailTagList, doMailEditShow } = useActions(MailActions);
  // 邮件操作
  // 读操作
  const [treeList, setFolderList] = useState<MailBoxModel[]>([]);
  // 移动
  const [isShowTreeMenu, setTreeMenu] = useState<boolean>(false);
  const [mailMoveFid, setMailMoveFid] = useState<number>();
  // 弹窗
  const [isModalVisible, setModalVisible] = useState<boolean>(false);
  const [resetDialog, setDialog] = useState<object>();
  const refreshPageRef = useRef<any>(null);
  const [exchangeMailHeight, setExchangeMailHeight] = useState<number>(0);
  const exchangeMailRef = useRef<HTMLDivElement>(null);
  // 为了解决重新渲染导致拖拽中断的问题，临时解决方案
  // todo：梳理完毕引用关系后待删除
  refreshPageRef.current = refreshPage;
  const dispatch = useAppDispatch();
  const doMailAllDelete = () => {
    message.error({
      content: getIn18Text('BUZHICHICICAO'),
    });
  };
  const setMailList = (data: MailEntryModel[] | Function) => {
    const mailList = Array.isArray(data) ? data : data();
    console.log('mailListmailList', mailList);
    // dispatch(StrangerActions.setMailList(mailList));
    _setMailList(mailList);
  };
  const setSelectedMail = (id: string) => {
    // dispatch(StrangerActions.setSelectedMail(id));
    setSelectMail(id);
  };
  useEffect(() => {
    if (!curStranger) return;
    setStartData({
      ...startData,
      contactList: [curStranger.accountName],
    });
  }, [curStranger]);
  // 防抖刷新列表
  const debounceRefreshEmailList = useDebounceForEvent(() => {
    refreshEmailList();
  }, 400);
  useEffect(() => {
    if (startData.needRefresh && startData.contactList.length > 0) {
      debounceRefreshEmailList();
    }
  }, [startData]);
  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('initPage', {
      name: 'obImagePreviewInitPage',
      func: ev => {
        console.log('**** init page event received :', ev);
        if (ev && ev.eventData) {
          setStartData(startData => {
            startData.contactList.push(...(ev.eventData as string[]));
            // startData.needRefresh = true;
            return {
              needRefresh: true,
              contactList: startData.contactList,
              status: 'ALL',
            };
          });
          console.log(`**** setup init data :${JSON.stringify(startData)}`);
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('initPage', eid);
    };
  }, []);
  // 获取标签
  // const reqTag = async () => {
  //   setCurrentAccount();
  //     const res = await mailManagerApi.requestTaglist();
  //     res && sessionStorage.setItem('tags', JSON.stringify(res));
  // };
  useEffect(() => {
    dispatch(Thunks.requestTaglist({}));
  }, []);

  // 处理邮件列表中的标签 新增|删除|编辑|回滚
  // const updateMailListTag = (e: SystemEvent<any>, _list: MailEntryModel[]) => {
  //     const list = cloneDeep([..._list]);
  //     const { eventData, eventStrData } = e;
  //     const { tagNames = [] } = eventData;
  //     return list;
  // };
  // // 处理标签变动请求
  // const handleMailTagChangeRequest = (e: SystemEvent<any>) => {
  //     const { eventData, eventStrData } = e;
  //     const { mailList = [] as string[], tagNames = [], successMsg: _successMsg, failMsg: _failMsg, isNewTag } = eventData;
  //     setSuccessMsg(_successMsg);
  //     setFailMsg(_failMsg);
  //     if (eventStrData === 'tag') {
  //         // 发送请求
  //         const req = {
  //             ids: mailList,
  //             add: tagNames,
  //             isNewTag
  //         };
  //         setCurrentAccount();
  //         MailApi.updateMessageTags(req);
  //     }
  //     else if (eventStrData === 'untag') {
  //         // 发送请求
  //         const req = {
  //             ids: mailList,
  //             delete: tagNames
  //         };
  //         setCurrentAccount();
  //         MailApi.updateMessageTags(req);
  //     }
  // };
  // 初次加载
  useEffect(() => {
    refreshFolder();
  }, []);
  const refreshFolder = () => {
    // setCurrentAccount();
    MailApi.doListMailBox()
      .then(res => {
        setFolderList(res);
      })
      .catch(err => {
        console.log('mailRelatedBox.tsx refreshFolder error', err);
      });
  };

  const handleBackToTop = () => {
    setScrollTop(0);
    if (listRef && listRef.current) {
      listRef.current.scrollToPosition(0);
    }
  };

  const data2tree = (data: MailBoxModel) => {
    let array = [-1, 2, 4, 7, 5, 17, 19];
    if (mailMoveFid == 1) {
      array.splice(3, 2); // 收件箱可以移动至垃圾邮件或广告邮件
    }
    if (mailMoveFid == 1 || mailMoveFid == 3) {
      array = array.concat([1, 3]);
    } else if (mailMoveFid == 5) {
      array = array.concat([3]);
    } else if (mailMoveFid == 4) {
      array.splice(1, 1);
    } else {
      array.splice(3, 1);
      array = array.concat(mailMoveFid ? [mailMoveFid] : []);
    }
    const isShow = array.indexOf(data.entry.mailBoxId) < 0;
    const treeNode: DataNode = {
      key: data.entry.mailBoxId,
      title: data.entry.mailBoxName,
      isLeaf: !data.children?.length,
      icon: iconMap.get(data.entry?.mailBoxId),
      selectable: true,
      style: { display: isShow ? 'flex' : 'none' },
    };
    if (!treeNode.isLeaf && data.children && data.children.length > 0) {
      treeNode.children = data.children.map(data2tree);
    }
    return treeNode;
  };

  // 异步加载列表数据
  const hasData = mailDataList && mailDataList.length > 0;
  const loadMoreRows = ({ startIndex }, noCache?: boolean) => {
    setListLoading(true);
    console.log(`***** load mail data ${hasData} ${JSON.stringify(startData)}`);
    if (startData.contactList.length > 0) {
      setFreshLoading(true);
      // let _id = selectedKeys ? +selectedKeys[0] : 1;
      const _param: queryMailBoxParam = {
        relatedEmail: startData.contactList,
        count: 50,
        returnModel: true,
        startDate: startData?.startDate,
        status: startData.status,
        index: startData?.offset || 0,
        checkType: 'checkRelatedMail',
      };
      // setCurrentAccount();
      return MailApi.getRelatedMail(_param, noCache).then(
        res => {
          res = res as MailModelEntries;
          let _res;
          console.log('******* current mail list data:', mailDataList);
          setMailTotal(res.data.length);
          setMailList(mailDataList => {
            _res = mailDataList && mailDataList.length > 0 ? mailDataList.concat(res.data) : res.data;
            return formateMailList(_res);
          });
          setListLoading(false);
          if (res.additionalInfo && res.additionalInfo.startDate && res.additionalInfo.offset) {
            setStartData(startData => ({
              startDate: res.additionalInfo ? (res.additionalInfo.startDate as string) : startData.startDate,
              offset: Number(res.additionalInfo ? res.additionalInfo.offset : startData.offset),
              status: startData.status,
              needRefresh: false,
              contactList: startData.contactList,
            }));
          }
          setFreshLoading(false);
          // if (res.additionalInfo ) {
          //   setOffset(Number(res.additionalInfo['offset']));
          // }
        },
        reject => {
          if (reject.code == 'FA_NEED_AUTH2') {
            setAuthLock(true);
            setMailList([]);
          }
          setFreshLoading(false);
        }
      );
    }
    return Promise.reject(getIn18Text('LIANXIRENXINXI'));
  };
  const refreshEmailList = () => {
    handleBackToTop();
    setCheckedMails(new Map());
    setMailList([]);
    setMailTotal(0);
    setSelectedMail('');
    setListLoading(true);
    // setStartData({
    //
    // });
    // if (isSearching && !inputValue) return;
    loadMoreRows({ startIndex: 0 }).then();
  };
  // 刷新页面
  const refreshPage = (showMessage = true) => {
    if (refreshBtnLoading) return Promise.reject();
    if (!navigator.onLine) {
      showMessage &&
        message.error({
          content: getIn18Text('CAOZUOSHIBAI\uFF0C'),
        });
      return Promise.reject();
    }
    setRefreshBtnLoading(true);
    // if(!isCorpMail) {
    // setCurrentAccount();
    // mailManagerApi.requestTaglist();
    dispatch(Thunks.requestTaglist({}));
    // }
    // 同步文件夹
    MailApi.syncMailFolder();
    // setCurrentAccount();
    return MailApi.doListMailBox(true)
      .then(res => {
        setFolderList(res);
        loadMoreRows({ startIndex: 0 }, true);
        // setIsNoticeNum(0);
        showMessage &&
          message.success({
            content: getIn18Text('SHOUXINCHENGGONG'),
          });
      })
      .catch(res => {
        showMessage &&
          message.error({
            content: getIn18Text('SHOUXINSHIBAI'),
          });
      })
      .finally(() => {
        setTimeout(() => {
          setRefreshBtnLoading(false);
        }, 1000);
      });
  };
  const handleItemClick = (value: MailStatusType) => {
    setStartData({
      ...startData,
      status: value,
    });
  };

  // 重置往来邮件高度
  const resetExchangeMailsHeight = () => {
    const exchangeMailH = exchangeMailRef.current?.clientHeight;
    if (exchangeMailH) {
      setExchangeMailHeight(exchangeMailH - 54);
    }
  };
  useEffect(() => {
    resetExchangeMailsHeight();
    window.addEventListener('resize', resetExchangeMailsHeight);
    return () => {
      window.removeEventListener('resize', resetExchangeMailsHeight);
    };
  }, []);
  // 接受邮件标签的更新，提交到redux中
  // useMsgCallback('onMailTagList', e => {
  //     const { eventData } = e;
  //     doUpdateMailTagList(eventData);
  //     // 通知读信窗口
  //     // if (location.pathname !== '/') {
  //     // eventApi.sendSysEvent({
  //     //   eventName: 'mailTagChanged',
  //     //   eventStrData: 'syncTaglist',
  //     //   eventData: {
  //     //     tagNames: [],
  //     //     mailList: eventData,
  //     //   },
  //     // });
  //     // }
  // });
  const emptyEntry = (
    <div className="m-list-container">
      <div className="m-list">
        <div className="m-list-empty">
          {refreshLoading ? (
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          ) : (
            <>
              <div className="empty">{getIn18Text('ZANWUYOUJIAN')}</div>
              <div
                className="refresh"
                onClick={() => {
                  refreshEmailList();
                }}
              >
                {getIn18Text('SHUAXIN')}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
  const handleReadFlagClick = useCallback((data: MailEntryModel) => {
    const { mark, threadMessageIds, id } = data.entry || {};
    eventApi.sendSysEvent({
      eventName: 'mailStatesChanged',
      eventData: {
        mark: mark === 'none',
        id: id,
        type: 'redFlag',
      },
      _account: data._account,
      eventStrData: mark === 'none' ? 'mark' : 'unmark',
    });
  }, []);
  const CardOperRedFlagWrap = useCallback(
    (_props: MailCardComProps) => (
      <span
        onClick={e => {
          e.stopPropagation();
          handleReadFlagClick(_props.data);
        }}
      >
        <CardOperRedFlag {..._props} />
      </span>
    ),
    [handleReadFlagClick]
  );
  const VoidCom = () => <></>;
  const CustomMailCard = useCallback((_props: MailCardComProps) => {
    const isTask = _props?.data?.taskId != null;
    return <MailCard {..._props} summaryExtra={!isTask ? CardOperRedFlagWrap : VoidCom} />;
  }, []);
  return (
    <SideContentLayout
      borderRight
      minWidth={300}
      defaultWidth={defaultListWidth}
      className="m-email-list"
      onResize={(_, data) => {
        const {
          size: { width },
        } = data;
        setListWidth(width);
      }}
      onResizeStop={() => {}}
      onResizeStart={() => {}}
    >
      <div className={style.mailExchange} ref={exchangeMailRef}>
        <div className={style.top}>
          <span className={style.title}>{getIn18Text('WANGLAIYOUJIAN')}</span>
          <div className={style.typeSelector}>
            <Select defaultValue="ALL" style={{ width: 120 }} value={startData.status} onChange={handleItemClick} dropdownClassName={style.typeDropdown}>
              <Option className={style.typeOpt} value="ALL">
                {getIn18Text('QUANBU')}
              </Option>
              <Option className={style.typeOpt} value="SENT">
                {getIn18Text('WOFACHUDE')}
              </Option>
              <Option className={style.typeOpt} value="RECEIVED">
                {getIn18Text('WOSHOUDAODE')}
              </Option>
              <Option className={style.typeOpt} value="redFlag">
                {getIn18Text('HONGQIYOUJIAN')}
              </Option>
              <Option className={style.typeOpt} value="ATTACHMENT">
                {getIn18Text('DAIFUJIANDE')}
              </Option>
            </Select>
          </div>
        </div>
        {mailDataList.length === 0 && emptyEntry}
        <MailMenuCardList
          className={`${systemIsWindow() ? 'u-vlist-win' : 'u-vlist'}`}
          containerStyle={{}}
          height={exchangeMailHeight}
          card={CustomMailCard}
          rowHeight={getCardHeight}
          width={listWidth}
          // onScroll={onScroll}
          onLoadMore={start => loadMoreRows({ startIndex: start })}
          scrollTop={scrollTop}
          onScroll={params => setScrollTop(params.scrollTop)}
          batchSize={100}
          threshold={500}
          cardMargin={2}
          data={mailDataList}
          total={mailTotal}
          onPullRefresh={refreshPage}
          activeId={activeIds}
          onSelect={(keys, data, index, event) => {
            // todo: 与快捷键的交互，应该从index转换为id了
            setActiveIds(keys);
            setSelectedMail(keys[0]);
            // onSelect && onSelect(index, event);
          }}
          onDoubleClick={(keys, data, index, event) => {
            // onDoubleClick && onDoubleClick(data,index, event);
          }}
          onContextMenu={(keys, data, index, event) => {
            event.preventDefault();
            // onContextmenu && onContextmenu(data, index);
          }}
          // draggable={listCanDrag()}
          onDragStart={(e, data, index) => {
            // handleMailDragStart(e, data, index);
          }}
          onDragEnd={(e, data, index) => {}}
        />
      </div>
    </SideContentLayout>
  );
};
export default MailExchange;
