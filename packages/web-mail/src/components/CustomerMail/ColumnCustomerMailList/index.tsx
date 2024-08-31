// todo: 列表的部分机制改动还没有同步过来
import React, { useState, useEffect, useCallback, useMemo, useImperativeHandle, useRef, useContext } from 'react';
import { Spin, Tooltip } from 'antd';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import classnames from 'classnames';
import { apiHolder as api, apis, MailApi, MailEntryModel, SystemApi, mailPerfTool, DataTrackerApi, ICustomerManagerModel } from 'api';
import { BackToTopNewIcon } from '@web-common/components/UI/Icons/icons';

import '@web-mail/mailBox.scss';
import '@web-mail/components/MailList/index.scss';

import MailList from '@web-mail/components/MailList/MailList';
import MailListLong from '@web-mail/components/MailList/MailListLong';
import MailWrap from '@web-mail/components/MailColumnEntry/mailListWrap';
import FilterTabCm from '@web-mail/components/CustomerMail/ColumnCustomerMailList/filterElement';

import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import useMailStore from '@web-mail/hooks/useMailStoreRedux';

import { getTopMailSumHeight } from '@web-mail/utils/mail';

import { Thunks } from '@web-common/state/reducer/mailReducer';
import { MailActions, useActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { FLOLDER, TASK_MAIL_STATUS } from '@web-mail/common/constant';

import { stringMap } from 'types';
import { actions as mailTabActions, MailTabModel, tabType } from '@web-common/state/reducer/mailTabReducer';
import { getMainAccount } from '../../../util';
import icon from '@web-common/components/UI/Icons/svgs';

import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import useThrottleForEvent from '@web-mail/hooks/useThrottleForEvent';
import { useState2CustomerSlice, ctSliceContext } from '@web-mail/hooks/useState2SliceRedux';

import useListDiffFouceRender from '@web-mail/components/MailColumnEntry/useListDiffFouceRender';
import { getIn18Text } from 'api';
import { setCurrentAccount } from '@web-mail/util';

const MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const systemApi: SystemApi = api.api.getSystemApi();
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const { TongyongWarning } = icon;

// 列表加载失败的展示
const ListFail = (props: { loading: boolean; onRefresh: () => void }) => {
  const { loading = false, onRefresh = () => {} } = props;
  return (
    <div className="m-list">
      <div className="m-list-empty">
        <div className="empty">{getIn18Text('JIAZAISHIBAI')}</div>
        {loading ? (
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        ) : (
          <div className="refresh" onClick={onRefresh}>
            {getIn18Text('ZHONGXINJIAZAI')}
          </div>
        )}
      </div>
    </div>
  );
};

// 邮件列表为空提示
const ListEmpty = (props: { name: string; onRefresh: () => void; selected: string; isLeftRight?: boolean; showRefresh?: boolean }) => {
  const { name = '', onRefresh = () => {}, isLeftRight, showRefresh = true } = props;
  return (
    <div className="m-list">
      <div className="m-list-empty">
        {!isLeftRight && <div className="sirius-empty sirius-empty-doc" style={{ marginBottom: '20px' }} />}
        <div className="empty">{name}</div>
        {showRefresh && (
          <div className="refresh" onClick={onRefresh}>
            {getIn18Text('SHUAXIN')}
          </div>
        )}
      </div>
    </div>
  );
};

// 列表-回到顶部
const ListBackTop = (props: any) => {
  const { style, onClick } = props;
  return (
    <div style={style} className={classnames(['back-top-wrapper'])}>
      <Tooltip title={getIn18Text('HUIDAODINGBU')} mouseEnterDelay={1} mouseLeaveDelay={0.15}>
        <BackToTopNewIcon onClick={onClick} style={{ cursor: 'pointer' }} />
      </Tooltip>
    </div>
  );
};

type MailDelete = {
  realDeleteNum?: number;
  isThreadSign?: boolean;
  detail?: boolean;
  threadId?: string;
  showLoading?: boolean;
  showGlobalLoading?: boolean;
  isScheduleSend?: boolean;
};

// 邮件列表包裹组件
const MailListWrap = React.forwardRef<any, any>((props, ref) => {
  const { isLeftRight } = props;
  const listRef = useRef();
  useImperativeHandle(ref, () => listRef.current, []);
  const innerProps = useMemo(() => {
    return { ...props, ref: undefined };
  }, [props]);

  return isLeftRight ? <MailList {...innerProps} ref={listRef} /> : <MailListLong {...innerProps} ref={listRef} />;
});

const TOP_CALCULATED = 300;

// 收信箱邮件列表入口
const MailColumnEntry = ({ isLeftRight }: { isLeftRight: boolean }) => {
  const dispatch = useAppDispatch();
  const reducer = useActions(MailActions);
  const sliceId = useContext(ctSliceContext);

  /*
   * 本地状态 State
   */
  const [notice, setNotice] = useState<boolean>(systemApi.isSysNotificationAvailable() !== 'granted');
  const [curMenuMailId, setCurMenuMailId] = useState<any[]>();

  /*
   * redux
   */
  const currentTabType: string = useAppSelector(state => state.mailTabReducer.currentTab.type);
  // 未读数map
  const [unReadMap] = useState2RM('unReadMap_cm');
  const [mailDataList] = useMailStore('mailDataList', undefined, sliceId, 'customer');
  const [searchList] = useMailStore('searchList', undefined, sliceId, 'customer');
  // const currentTabId: string = useAppSelector(state => state.mailTabReducer.currentTab.id);

  /*
   * redux - slice
   */
  // 邮件列表是否处于loading
  const [listLoading, setListLoading] = useState2CustomerSlice('listLoading');
  // 搜索类型
  const [mailSearching] = useState2CustomerSlice('mailSearching');
  const [selectedKeys] = useState2CustomerSlice('selectedKeys');
  const [searchTotal] = useState2CustomerSlice('searchTotal');
  // 邮件列表宽高设置
  const [scrollTop, setScrollTop] = useState2CustomerSlice('scrollTop');
  // 新邮件提醒`
  const [isNoticeNum, setIsNoticeNum] = useState2CustomerSlice('noticeNum');
  // 邮件列表-选中的邮件idlist
  const [activeIds, setActiveIds] = useState2CustomerSlice('activeIds');
  // 邮件列表-右键菜单-是否显示
  const [mailListMenuVisible, setMailListMenuVisible] = useState2CustomerSlice('mailListMenuVisible');
  // 邮件列表-上部-二级tab选中
  const [selected] = useState2CustomerSlice('mailListStateTab');
  // 邮件-刷新按钮-是否处于loading状态
  const [refreshLoading, setFreshLoading] = useState2CustomerSlice('refreshBtnLoading');
  // 搜索列表-上部-二级tab选中
  const [searchSelected] = useState2CustomerSlice('searchListStateTab');
  // 邮件列表-当前选中的邮件id
  const [, setSelectedMail] = useState2CustomerSlice('selectedMailId');
  // 邮件-搜索-选中的邮件id
  // const [, setSearchMail] = useState2CustomerSlice( 'activeSearchMailId');
  // 邮件-邮件列表-总数
  const [mailTotal] = useState2CustomerSlice('mailTotal');
  // 邮件列表-首次加载-是否失败
  const [listLoadIsFail, setListLoadIsFail] = useState2CustomerSlice('mailListInitIsFailed');
  // 搜索列表-文件夹-选中的key
  const [selectedSearchKeys] = useState2CustomerSlice('selectedSearchKeys');
  // 搜索列表-文件夹-选中的联系人Email
  const [selectedSearchContacts] = useState2CustomerSlice('selectedSearchContacts');
  // 文件夹-选中的联系人Email
  const [selectedContacts] = useState2CustomerSlice('selectedContacts');

  const [listModel, setListModel] = useState2CustomerSlice('defaultMailListSelectedModel');

  // 邮件列表ref
  const mailListRef = useRef();

  // // 页签变化的时候，保持列表的st状态
  // useEffect(()=>{
  //   mailListRef?.current?.scrollToPosition(scrollTop);
  // },[currentTabId]);

  /*
   * 衍生状态
   */
  // 是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);
  // 邮件-搜索-是否是高级搜素
  const isAdvancedSearch = useMemo(() => mailSearching === 'advanced', [mailSearching]);
  const showListBackTop = useMemo(() => scrollTop > TOP_CALCULATED, [scrollTop]);
  const mailList = isSearching ? searchList : mailDataList;
  const havingContent = (mailList && mailList.length > 0) || listLoading;
  const isSelectedContact = useMemo(
    () => (isSearching ? selectedSearchContacts.list.length > 0 : selectedContacts.list.length > 0),
    [isSearching, selectedSearchContacts.list, selectedContacts.list]
  );
  const noManagerList = useMemo(() => {
    if (isSearching) {
      // 如果不是选择同事筛选项，则不关注此状态
      if (!selectedSearchKeys || !selectedSearchKeys.id || searchSelected !== 'COLLEAGUE') {
        return false;
      }
      return !(selectedSearchKeys?.managerList && selectedSearchKeys?.managerList?.some((item: ICustomerManagerModel) => item?.managerAccount != getMainAccount()));
    }
    // 如果不是选择同事筛选项，则不关注厕状态
    if (!selectedKeys || !selectedKeys.id || selected !== 'COLLEAGUE') {
      return false;
    }
    return !(selectedKeys?.managerList && selectedKeys?.managerList?.some((item: ICustomerManagerModel) => item?.managerAccount != getMainAccount()));
  }, [isSearching, selected, searchSelected, selectedKeys, selectedSearchKeys]);
  // 列表是否加载完成
  const initialized = selectedKeys?.id ? unReadMap.customerMap[selectedKeys.id]?.initialized || true : true;
  // 如果构建未完成，则强制置为0
  // TODO: 因为客户邮件接口不会返回 isInitialized 字段，所以绕了一个大弯
  const mailTotalByUnread = useMemo(() => {
    if (initialized) {
      return mailTotal;
    }
    return 0;
  }, [initialized, mailTotal]);

  // 通栏下-初始化邮件列表选中状态
  useEffect(() => {
    if (!isLeftRight && activeIds && activeIds.length == 0) {
      if (mailList?.length) {
        setActiveIds([mailList[0]?.id]);
      }
    }
  }, [isLeftRight, activeIds, mailList]);

  const listFouceRender = useListDiffFouceRender(mailDataList, searchList, isSearching, isLeftRight);

  // 邮件删除
  const handleMailDelete = useCallback((id?: string | string[], _isThread?: boolean, params?: MailDelete) => {
    dispatch(
      Thunks.deleteMail({
        id,
        showLoading: params?.showLoading ? (params?.showGlobalLoading ? 'global' : true) : false,
        isScheduleSend: params?.isScheduleSend,
        detail: params?.detail,
      })
    );
  }, []);

  // 刷新页面（仅仅刷新邮件列表）
  const refreshPage = useCallback(
    (showLoading = false) =>
      dispatch(
        Thunks.loadMailList_edm({
          showLoading,
          noCache: true,
          refresh: true,
          type: 'customer',
          sliceId,
        })
      ),
    []
  );

  // 右键中的移动邮件按钮事件
  const handleMailMove = useCallback((mid: string | string[], folder: number) => {
    reducer.showMailMoveModal({
      mailId: mid,
      folderId: folder,
    });
  }, []);

  // 请求搜索列表数据
  const loadSearchListData = useCallback(({ startIndex }, noCache: boolean = false) => {
    return dispatch(
      Thunks.loadMailList_edm({
        startIndex,
        noCache,
        showLoading: false,
        type: 'customer',
        sliceId,
      })
    );
  }, []);

  // 请求邮件列表数据
  const loadMailListData = useCallback(
    ({ startIndex }, noCache: boolean = false) => {
      if (!initialized) {
        getUnRead([selectedKeys.id + '']);
      }
      return dispatch(
        Thunks.loadMailList_edm({
          startIndex,
          noCache,
          showLoading: false,
          type: 'customer',
          sliceId,
        })
      );
    },
    [initialized, selectedKeys.id]
  );

  // 处理列表ListModal的变更
  const onListModelChange = useCallback(model => {
    setListModel(model);
  }, []);

  // 新窗口打开
  const openNewWindow = useCallback((ids: string[]) => {
    if (ids && ids.length) {
      dispatch(Thunks.openMailInNewWindow(ids[0]));
    }
  }, []);

  // 处理邮件的激活
  const handleMailActive = useCallback(
    (id: string, _index: number, data: MailEntryModel) => {
      const item = data;
      if (item && item.entry && item.entry.id) {
        trackApi.track('waimao_view_mailDetailPage', { type: 'The customer mail' });
        setSelectedMail({ id });
      }
    },
    [isLeftRight]
  );

  // 邮件双击
  const handleMailDoubleClick = useCallback((mail: MailEntryModel) => {
    const { isThread, _account, isTpMail, owner } = mail;
    mailPerfTool.mailContent('window', 'start', { isThread: !!isThread });
    trackApi.track('waimao_view_mailDetailPage', { type: 'The customer mail' });
    if (systemApi.isElectron()) {
      if (mail.entry.folder === FLOLDER.DRAFT) {
        // 草稿箱双击--再次编辑
        // setCurrentAccount(mail?._account);
        MailApi.doEditMail(mail.id, { draft: true, _account: mail?._account }).catch(() => {});
      } else {
        // 其他文件夹双击--打开单独窗口读信
        systemApi
          .createWindowWithInitData(
            { type: 'readMail', additionalParams: { account: _account } },
            {
              eventName: 'initPage',
              eventData: { id: mail?.id, accountId: _account, isTpMail, owner },
              eventStrData: isThread ? 'isthread' : '',
              _account,
            }
          )
          .catch(() => {});
      }
    } else {
      window.open(
        `${systemApi.getContextPath()}/readMail/?id=${mail?.id}${_account ? '&account=' + _account : ''}${isThread ? '&isthread=1' : ''}${isTpMail ? '&isTpMail=1' : ''}${
          owner ? '&owner=' + owner : ''
        }`,
        'readMail',
        'menubar=0,scrollbars=1,resizable=1,width=800,height=600'
      );
    }
  }, []);

  // 普通邮件列表公用属性
  const listCommonAttr = useMemo(() => {
    return {
      isLeftRight,
      activeId: activeIds,
      refreshPage,
      isSearching,
      onDoubleClick: handleMailDoubleClick,
      onActiveInWindow: openNewWindow,
      scrollTop,
      // listWidth,
      listLoading,
      showGroupDecorate: false,
      hkDisabled: currentTabType !== tabType.customer,
      showCheckbox: (mail: MailEntryModel) => {
        return !mail || !mail?.isTpMail;
      },
      onScroll: (param: { scrollTop: number }) => {
        setScrollTop(param.scrollTop);
      },
      // 用于在onSelect触发前，干预选中的邮件id。并且会保持快捷键model的正确变更
      beforeSelected: (_ids: string[], activeIds: string[]): string[] => {
        const isTask: stringMap = {};
        const isTpMailMap: stringMap = {};
        if (!isSearching) {
          (mailDataList as any).forEach((item: MailEntryModel) => {
            isTask[item.id + ''] = item?.taskInfo?.status === TASK_MAIL_STATUS.PROCESSING;
            isTpMailMap[item.id + ''] = item?.isTpMail;
          });
        } else {
          (searchList as any).forEach((item: MailEntryModel) => {
            isTask[item.id + ''] = item?.taskInfo?.status === TASK_MAIL_STATUS.PROCESSING;
            isTpMailMap[item.id + ''] = item?.isTpMail;
          });
        }
        if (activeIds.length == 1) {
          return activeIds;
        }
        return activeIds.filter(item => !isTask[item] && !isTpMailMap[item]);
      },
      onSelect: (_ids: string[], activeIds: string[]) => {
        setActiveIds(activeIds);
      },
      onUnSelect: (_ids: string[], activeIds: string[]) => {
        setActiveIds(activeIds);
      },
      onActive: handleMailActive,
      onContextMenu: (_key: string, data: any) => {
        setMailListMenuVisible(true);
        if (Array.isArray(data)) {
          setCurMenuMailId(data?.map(item => item?.id));
        } else {
          setCurMenuMailId([data?.id]);
        }
      },
    };
  }, [activeIds, isSearching, scrollTop, listLoading, handleMailActive, handleMailDoubleClick, isLeftRight, currentTabType]);

  // 通栏邮件列表公用属性
  const longListCommonAttr = useMemo(() => {
    return {
      isLeftRight,
      activeId: activeIds,
      refreshPage,
      isSearching,
      onDoubleClick: handleMailDoubleClick,
      onActiveInWindow: openNewWindow,
      scrollTop,
      listLoading,
      showGroupDecorate: false,
      hkDisabled: currentTabType !== tabType.customer,
      onScroll: (param: { scrollTop: number }) => {
        setScrollTop(param.scrollTop);
      },
      showCheckbox: (mail: MailEntryModel) => {
        return !mail || !mail?.isTpMail;
      },
      // 用于在onSelect触发前，干预选中的邮件id。并且会保持快捷键model的正确变更
      beforeSelected: (_ids: string[], activeIds: string[]): string[] => {
        const isTask: stringMap = {};
        const isTpMailMap: stringMap = {};
        if (!isSearching) {
          (mailDataList as any).forEach((item: MailEntryModel) => {
            isTask[item.id + ''] = item?.taskInfo?.status === TASK_MAIL_STATUS.PROCESSING;
            isTpMailMap[item.id + ''] = item?.isTpMail;
          });
        } else {
          (searchList as any).forEach((item: MailEntryModel) => {
            isTask[item.id + ''] = item?.taskInfo?.status === TASK_MAIL_STATUS.PROCESSING;
            isTpMailMap[item.id + ''] = item?.isTpMail;
          });
        }
        if (activeIds.length == 1) {
          return activeIds;
        }
        return activeIds.filter(item => !isTask[item] && !isTpMailMap[item]);
      },
      onSelect: (_ids: string[], activeIds: string[]) => {
        setActiveIds(activeIds);
      },
      onUnSelect: (_ids: string[], activeIds: string[]) => {
        setActiveIds(activeIds);
      },
      onActive: (id: string, _index: number, data: MailEntryModel) => {
        setActiveIds([id]);
        // 如果是通栏则新开页签
        let title = getIn18Text('WUZHUTI');
        try {
          title = data?.entry?.title.replace(/<b>/g, '').replace(/<\/b>/g, '') || getIn18Text('WUZHUTI');
        } catch (e) {
          console.error('[Error reg]', e);
        }
        const mailTabModel: MailTabModel = {
          id: id,
          title,
          type: tabType.read,
          closeable: true,
          isActive: true,
        };
        trackApi.track('waimao_view_mailDetailPage', { type: 'The customer mail' });
        dispatch(mailTabActions.doSetTab(mailTabModel));
      },
      onContextMenu: (_key: string, data: any) => {
        setMailListMenuVisible(true);
        if (Array.isArray(data)) {
          setCurMenuMailId(data?.map(item => item?.id));
        } else {
          setCurMenuMailId([data?.id]);
        }
      },
    };
  }, [activeIds, isSearching, scrollTop, listLoading, handleMailActive, handleMailDoubleClick, isLeftRight, currentTabType]);

  // 搜索邮件列表，分栏模式
  const searchMailListElement = useCallback(
    (config: { width: number; height: number }) => {
      const { height = 0, width = 0 } = config || {};
      const commonAttr = isLeftRight ? listCommonAttr : longListCommonAttr;
      return (
        <MailListWrap
          ref={mailListRef}
          {...commonAttr}
          listHeight={height}
          listWidth={width}
          data={searchList}
          rowCount={searchTotal}
          loadMoreRows={loadSearchListData}
          selectedKeys={searchSelected}
          isMerging={false}
          selected={selected}
          listModel={listModel}
          onListModelChange={onListModelChange}
          listFouceRender={listFouceRender}
        />
      );
    },
    [listCommonAttr, searchList, searchTotal, loadSearchListData, searchSelected, isLeftRight, longListCommonAttr, listModel, selected, listFouceRender]
  );

  const throttleOnScroll = useThrottleForEvent(
    (param: { scrollTop: number }) => {
      setScrollTop(param.scrollTop);
      // 距离顶部10px的时候，收起新邮件提醒
      if (param.scrollTop <= getTopMailSumHeight(mailDataList) && isNoticeNum != 0) {
        setIsNoticeNum(0);
      }
    },
    400,
    {
      leading: true,
      trailing: true,
    }
  );

  // 获取未读数
  const getUnRead = (customerIds: string[]) => {
    dispatch(Thunks.getUnread_cm({ customerIds }));
  };

  const listTipEle = useMemo(() => {
    if (initialized) {
      return <></>;
    }
    return (
      <div className="edm-mail-tip">
        <span className="edm-mail-tip-icon">
          <TongyongWarning />
        </span>
        <span style={{ marginLeft: '6px' }}>{getIn18Text('MAILNOTINITIALIZED')}</span>
      </div>
    );
  }, [initialized]);

  // 邮件列表，分栏模式
  const mailListElement = useCallback(
    (config: { width: number; height: number }) => {
      const { height = 0, width = 0 } = config || {};
      const commonAttr = isLeftRight ? listCommonAttr : longListCommonAttr;
      return (
        <MailListWrap
          ref={mailListRef}
          {...commonAttr}
          listHeight={height}
          listWidth={width}
          data={mailDataList}
          rowCount={mailTotalByUnread}
          loadMoreRows={loadMailListData}
          notice={notice}
          selectedKeys={selectedKeys}
          tagName={null}
          onScroll={throttleOnScroll}
          selected={selected}
          onDelete={(idList: string[]) => {
            if (idList && idList.length) {
              dispatch(Thunks.deleteMailFromHotKey(idList.length === 1 ? idList[0] : idList));
            }
          }}
          // topExtraData={}
          listModel={listModel}
          onListModelChange={onListModelChange}
          // 任务邮件的业务属性
          // goTaskMailBox={goTaskMailBox}
          listFouceRender={listFouceRender}
        />
      );
    },
    [listCommonAttr, mailDataList, mailTotalByUnread, loadMailListData, notice, selectedKeys, isLeftRight, longListCommonAttr, selected, listModel, listFouceRender]
  );

  // 初始化
  useEffect(() => {
    const showNotice: boolean = systemApi.isSysNotificationAvailable() == 'default';
    setNotice(showNotice);
  }, []);

  // 列表失败展示
  const ListFailCom = useMemo(
    () => (
      <ListFail
        loading={refreshLoading}
        onRefresh={() => {
          setListLoadIsFail(false);
          setListLoading(true);
          refreshPage(true);
        }}
      />
    ),
    [refreshLoading]
  );

  // 列表为空展示
  const ListEmptyCom = useMemo(
    () => (
      <ListEmpty
        name={noManagerList ? getIn18Text('WUTONGSHI') : getIn18Text('ZANWUYOUJIAN')}
        selected={selected}
        isLeftRight={isLeftRight}
        onRefresh={() => {
          setFreshLoading(true);
          refreshPage(true);
        }}
        showRefresh={isSelectedContact && !noManagerList}
      />
    ),
    [selected, isLeftRight, isSelectedContact, noManagerList]
  );

  const MailListCom = useCallback(
    (config: { height: number; width: number }) => (
      <div className="m-list">
        {listTipEle}
        <MailWrap
          visible={mailListMenuVisible}
          setVisible={setMailListMenuVisible}
          selectedKeys={selectedKeys}
          selected={selected}
          isAdvancedSearch={isAdvancedSearch}
          isSearching={isSearching}
          onMove={handleMailMove}
          onDelete={handleMailDelete}
          activeMailId={curMenuMailId}
          openNewWindow={openNewWindow}
        >
          {isSearching ? searchMailListElement(config) : mailListElement(config)}
        </MailWrap>
      </div>
    ),
    [isSearching, searchMailListElement, mailListElement, mailListMenuVisible, selectedKeys, selected, isAdvancedSearch, curMenuMailId]
  );

  const ListTipCom = listLoadIsFail ? ListFailCom : ListEmptyCom;

  return (
    <>
      <div className="m-list-container" style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flexShrink: 0 }}>
          <FilterTabCm sliceId={sliceId} />
        </div>
        <div style={{ width: '100%', flex: '1', minHeight: 0 }}>
          <AutoSizer style={{ width: '100%', height: '100%' }}>
            {({ height, width }) => {
              // 如果无法检测到窗体内容的高度，则默认给1000保证展示
              let max = 1000;
              try {
                max = window?.innerHeight || 1000;
              } catch (e) {
                console.log('[ window.innerHeight Error]', e);
              }
              const resHeight = height > max ? max : height;
              return havingContent ? MailListCom({ width, height: resHeight }) : ListTipCom;
            }}
          </AutoSizer>
        </div>
      </div>
      {showListBackTop && (
        <ListBackTop
          onClick={() => {
            setScrollTop(0);
          }}
        />
      )}
    </>
  );
};

export default MailColumnEntry;
