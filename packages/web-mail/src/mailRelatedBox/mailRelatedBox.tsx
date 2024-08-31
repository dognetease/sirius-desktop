import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Modal, Spin, Tree } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import List from 'react-virtualized/dist/es/List';
import { DataNode, TreeProps } from 'antd/lib/tree';
import { apiHolder as api, apis, MailApi, MailBoxModel, MailConfApi, MailEntryModel, MailModelEntries, MailStatusType, queryMailBoxParam } from 'api';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import SideContentLayout from '@/layouts/Main/sideContentLayout';
import Dialog from '@web-common/components/UI/Dialog/dialog';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { iconMap, getMailKey, setCurrentAccount, systemIsWindow } from '../util';
import { ModalCloseSmall } from '@web-common/components/UI/Icons/icons';
import ReadMail from '../components/ReadMail/ReadMail';
import useState2RM from '../hooks/useState2ReduxMock';
import { formateMailList } from '../state/customize';
import MailMenuCardList from '../common/components/vlist/MailCardList/MailMenuCardList';
import MailCard from '@web-mail/common/components/vlistCards/MailCard/MailCard';
import { CardOperRedFlag } from '../common/components/vlistCards/MailCard/defaultComs';
import { MailCardComProps } from '../types';
import MailSyncModal from '@web-mail/components/MailSyncModal/MailSyncModal';
import { stringMap } from 'types';
import useMailStore from '@web-mail/hooks/useMailStoreRedux';
import MailBoxEventHander from '@web-mail/components/mailBoxEventHander/readMailEventHandler';
import useCreateCallbackForEvent from '../hooks/useCreateCallbackForEvent';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { MailActions, useActions, useAppDispatch } from '@web-common/state/createStore';
import { getCardHeight } from '@web-mail/utils/mailCardUtil';
import { getIn18Text } from 'api';
import '@web-mail/mailBox.scss';
export interface MailRelateModel {
  startData: CheckStatus;
  setStartData: (data: CheckStatus) => void;
  mailAccount: string;
}

type CheckStatus = {
  startDate?: string;
  offset?: number;
  status: MailStatusType;
  needRefresh: boolean;
  contactList: string[];
  mailAccount: string;
};

const mailManagerApi = api.api.requireLogicalApi('mailConfApiImpl') as unknown as MailConfApi;
const MailRelatedBox: React.FC<MailRelateModel> = props => {
  const { mailAccount, startData, setStartData } = props;
  const MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
  const eventApi = api.api.getEventApi();
  const MailBoxEventHanderMemo = useMemo(() => <MailBoxEventHander />, []);
  // 邮件列表宽高设置
  const defaultListWidth = 324;
  const [listWidth, setListWidth] = useState(defaultListWidth);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [authLock, setAuthLock] = useState<boolean>(false);
  const [selectedKeys, setSelectedKeys] = useState<TreeProps['selectedKeys']>(['1']);
  const [selectedMenuKeys, setSelectedMenuKeys] = useState<TreeProps['selectedKeys']>();
  const [expandedMenuKeys, setExpandedMenuKeys] = useState<string[]>([]);
  // const [treeMap, setTreeMap] = useState(new Map());
  // const [selected, setSelected] = useState<number>(0);
  // 邮件列表
  let listRef = useRef<List>(null);
  const [mailDataList, setMailList] = useMailStore('mailRelateMailList');
  // const [selectedMail, setSelectedMail] = useState<string>(''); // 当前选中的邮件，这里有点问题，要保存上一封和下一封
  const [selectedMail, setSelectedMail] = useState2RM('mailRelateActiveMialId', 'doUpdateMailRelateActiveMialId');
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
  const [refreshBtnLoading, setRefreshBtnLoading] = useState2RM('mailRelateActiveMialId', 'doUpdateRefershBtnLoading');
  // 标签修改自定义toast文案（成功）
  const [successMsg, setSuccessMsg] = useState('');
  // 标签修改自定义toast文案（失败）
  const [failMsg, setFailMsg] = useState('');
  // 邮件操作
  // 读操作
  const [treeList, setFolderList] = useState<MailBoxModel[]>([]);
  // 移动
  const [isShowTreeMenu, setTreeMenu] = useState<boolean>(false);
  const [mailMoveFid, setMailMoveFid] = useState<number>();
  const [mailMoveMid, setMailMoveMid] = useState<string | string[]>('');
  // 弹窗
  const [isModalVisible, setModalVisible] = useState<boolean>(false);
  const [resetDialog, setDialog] = useState<object>();
  const [activeIds, setActiveIds] = useState<string[]>([]);
  // 邮件id到modal的映射
  const [mailIdMap, setMailMap] = useState<stringMap>({});
  const dispatch = useAppDispatch();
  useEffect(() => {
    let map: stringMap = {};
    mailDataList.forEach((item: MailEntryModel) => {
      map[item.entry.id] = item;
    });
    setMailMap(map);
  }, [mailDataList]);

  useEffect(() => {
    // if (refreshLoading) {
    //   setTimeout(() => {
    console.log(`******** start load related mail ${JSON.stringify(startData)}`);
    if (startData.needRefresh && startData.contactList.length > 0) {
      console.log(`******** will load related mail ${JSON.stringify(startData)}`);
      // loadMoreRows({ startIndex: 0 }).then();
      // 解决请求第一次500的问题
      setTimeout(() => {
        refreshEmailList();
      }, 100);
    }
    // }, 300);
    // }
  }, [startData]);

  // 获取标签
  // const reqTag = async () => {
  //   setCurrentAccount(mailAccount);
  //   const res = await mailManagerApi.requestTaglist();
  //   res && sessionStorage.setItem('tags', JSON.stringify(res));
  // };
  useEffect(() => {
    dispatch(Thunks.requestTaglist({}));
  }, []);
  type MailDelete = {
    realDeleteNum?: number;
    isThreadSign?: boolean;
    detail?: boolean;
    threadId?: string;
    showLoading?: boolean;
    showGlobalLoading?: boolean;
  };
  // 初次加载
  useEffect(() => {
    refreshFolder();
  }, []);
  const refreshFolder = () => {
    // setCurrentAccount(mailAccount);
    MailApi.doListMailBox(undefined, undefined, undefined, mailAccount)
      .then(res => {
        setFolderList(res);
      })
      .catch(err => {
        console.log('mailRelatedBox.tsx refreshFolder error', err);
      });
  };
  const onConfirmMove = () => {
    if (!selectedMenuKeys) return;
    if (!navigator.onLine) {
      message.error({
        content: getIn18Text('CAOZUOSHIBAI\uFF0C'),
      });
      return;
    }
    // setCurrentAccount(mailAccount);
    MailApi.doMoveMail(mailMoveMid, Number(selectedMenuKeys[0]), false, undefined, mailAccount).then(res => {
      if (res.succ) {
        message.success({
          content: getIn18Text('YIDONGCHENGGONG'),
        });
        setCheckedMails(new Map());
      } else {
        message.error({
          content: getIn18Text('YIDONGSHIBAI'),
        });
      }
    });
    setTreeMenu(false);
  };
  const onSelectMenuFid: TreeProps['onSelect'] = (_, { node }) => {
    setSelectedMenuKeys([node.key]);
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
  const MenuConfig = {
    title: `移动${checkedMails.size ? checkedMails.size : 1}封邮件到...`,
    width: '400px',
    wrapClassName: 'u-move-dialog',
    style: {
      maxHeight: '480px',
    },
  };
  // 异步加载列表数据
  const hasData = mailDataList && mailDataList.length > 0;
  const loadMoreRows = ({ startIndex }, noCache?: boolean) => {
    // if (refreshLoading) {
    //   setFreshLoading(false);
    // }
    setListLoading(true);
    console.log(`***** load mail data ${hasData} ${JSON.stringify(startData)}`);
    if (startData.contactList.length > 0) {
      setFreshLoading(true);
      const _param: queryMailBoxParam = {
        relatedEmail: startData.contactList,
        count: 50,
        returnModel: true,
        startDate: startData?.startDate,
        status: startData.status,
        index: startIndex || 0,
        checkType: 'checkRelatedMail',
        _account: mailAccount,
      };
      // if (selected == 1) {
      //   _param.filter = {
      //     flags: { read: false },
      //   };
      // } else if (selected == 2) {
      //   _param.filter = { label0: 1 };
      // }
      // let setting = MailConfApi.getMailMergeSettings();
      //
      // if (setting == 'true' && (_id == 1 || _id == -1 || _id >= 20)) {
      //   _param.checkType = 'checkThread';
      // }
      // setCurrentAccount(mailAccount);
      return MailApi.getRelatedMail(_param, noCache).then(
        res => {
          res = res as MailModelEntries;
          let _res;
          console.log('******* current mail list data:', mailDataList);
          setMailTotal(res.total || 0);
          setMailList(mailDataList => {
            _res = startIndex != 0 && mailDataList && mailDataList.length > 0 ? mailDataList.concat(res.data) : res.data;
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
  const loadMoreRowsRef = useCreateCallbackForEvent(loadMoreRows);
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
    // setTimeout(()=>{
    loadMoreRowsRef({ startIndex: 0 });
    // },3000)
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
    // setCurrentAccount(mailAccount);
    setRefreshBtnLoading(true);
    // if(!isCorpMail) {
    // mailManagerApi.requestTaglist();
    dispatch(Thunks.requestTaglist({}));
    // }
    // setCurrentAccount(mailAccount);
    // 同步文件夹
    MailApi.syncMailFolder(mailAccount);
    // setCurrentAccount(mailAccount);
    return MailApi.doListMailBox(true, undefined, undefined, mailAccount)
      .then(res => {
        setFolderList(res);
        loadMoreRowsRef({ startIndex: 0 }, true);
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
  /**
   * 临时解决方案
   * todo： 刷新页面的方法应该放到redux中去
   */
  const refreshPageRef = useRef<any>(null);
  // 为了解决重新渲染导致拖拽中断的问题，临时解决方案
  // todo：梳理完毕引用关系后待删除
  refreshPageRef.current = refreshPage;

  const handleItemClick = (ev, itemName) => {
    setStartData(startData => ({
      status: itemName as MailStatusType,
      needRefresh: true,
      contactList: startData.contactList,
    }));
    ev.stopPropagation();
  };
  const [exchangeMailHeight, setExchangeMailHeight] = useState<number>(0);
  const exchangeMailRef = useRef<HTMLDivElement>(null);
  // 重置往来邮件高度
  const resetExchangeMailsHeight = () => {
    const exchangeMailH = window.document.body.offsetHeight;
    if (exchangeMailH) {
      setExchangeMailHeight(exchangeMailH);
    }
  };
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
  useEffect(() => {
    resetExchangeMailsHeight();
    window.addEventListener('resize', resetExchangeMailsHeight);
    return () => {
      window.removeEventListener('resize', resetExchangeMailsHeight);
    };
  }, []);
  const menuItems = [
    { itemName: 'ALL', iconType: <ReadListIcons.FolderSvg />, showName: getIn18Text('QUANBU') },
    { itemName: 'SENT', iconType: <ReadListIcons.SendFolderSvg />, showName: getIn18Text('WOFACHUDE') },
    {
      itemName: 'RECEIVED',
      iconType: <ReadListIcons.ReceiveFolderSvg />,
      showName: getIn18Text('WOSHOUDAODE'),
    },
    {
      itemName: 'redFlag',
      iconType: <ReadListIcons.FlagFolderSvg />,
      showName: getIn18Text('HONGQIYOUJIAN'),
    },
    {
      itemName: 'ATTACHMENT',
      iconType: <ReadListIcons.AttachPinSvg />,
      showName: getIn18Text('DAIFUJIANDE'),
    },
  ];
  // const columnMailBox = ;
  const emptyEntry = (
    <div className="m-list-container" style={{ height: '100%' }}>
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
  const mailColumnEntry = hasData ? (
    <div ref={exchangeMailRef} style={{ padding: '10px 0' }}>
      <MailMenuCardList
        className={`${systemIsWindow() ? 'u-vlist-win' : 'u-vlist'}`}
        height={exchangeMailHeight}
        card={CustomMailCard}
        rowHeight={getCardHeight}
        width={listWidth}
        // onScroll={onScroll}
        onLoadMore={start => loadMoreRowsRef({ startIndex: start })}
        scrollTop={scrollTop}
        onScroll={params => setScrollTop(params.scrollTop)}
        total={mailTotal}
        batchSize={100}
        threshold={500}
        cardMargin={2}
        data={mailDataList}
        getUniqKey={getMailKey}
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
      />
    </div>
  ) : (
    emptyEntry
  );
  return (
    <>
      <PageContentLayout>
        <SideContentLayout borderRight minWidth={200} defaultWidth={220}>
          <div className="mail-related-container">
            <h3>{getIn18Text('WANGLAIYOUJIAN')}</h3>
            <div className="mail-options">
              {menuItems.map(({ itemName, showName, iconType }) => {
                const selected = startData.status === itemName;
                return (
                  <div key={itemName} className={`${selected ? 'selected ' : ''} option-item`} onClick={ev => handleItemClick(ev, itemName)}>
                    {iconType}
                    <span className="option-text">{showName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </SideContentLayout>
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
          {startData.contactList && startData.contactList.length > 0 ? mailColumnEntry : <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />}
        </SideContentLayout>
        <div style={{ minWidth: 500, height: '100%' }}>
          <ReadMail
            mailId={{
              id: selectedMail,
              account: mailAccount || '',
            }}
            tempContent={mailIdMap[selectedMail]}
            featureConfig={{
              mailDiscuss: false,
            }}
          />
        </div>
      </PageContentLayout>
      <Modal
        {...MenuConfig}
        visible={isShowTreeMenu}
        okText={getIn18Text('QUEDING')}
        cancelText={getIn18Text('QUXIAO')}
        okButtonProps={{ disabled: !selectedMenuKeys?.length }}
        onOk={onConfirmMove}
        closeIcon={<ModalCloseSmall />}
        onCancel={() => setTreeMenu(false)}
      >
        <div className="m-tree-container m-move-tree">
          <Tree
            selectedKeys={selectedMenuKeys}
            showIcon
            onExpand={(keys, info) => {
              setExpandedMenuKeys(keys as string[]);
            }}
            expandedKeys={expandedMenuKeys}
            treeData={treeList.map(data2tree)}
            icon={<ReadListIcons.FolderSvg />}
            onSelect={onSelectMenuFid}
            blockNode
          />
        </div>
      </Modal>
      <Dialog isModalVisible={isModalVisible} onCancel={setModalVisible} isCancel {...resetDialog} />
      <MailSyncModal />
      {MailBoxEventHanderMemo}
    </>
  );
};
export default MailRelatedBox;
