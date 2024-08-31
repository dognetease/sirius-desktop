import React, { useState, useEffect, useCallback, useMemo, useImperativeHandle, useRef, useContext } from 'react';
import { Spin, Tooltip } from 'antd';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import classnames from 'classnames';
import { apiHolder as api, apis, MailApi, MailEntryModel, SystemApi, mailPerfTool, DataTrackerApi } from 'api';
import { BackToTopNewIcon } from '@web-common/components/UI/Icons/icons';

import '@web-mail/mailBox.scss';
import '@web-mail/components/MailList/index.scss';

import MailList from '@web-mail/components/MailList/MailList';
import MailListLong from '@web-mail/components/MailList/MailListLong';
import MailWrap from '@web-mail/components/MailColumnEntry/mailListWrap';
import FilterTabCm from '@web-mail/components/SubordinateMail/ColumnSubordinateMailList/filterElement';

import useMailStore from '@web-mail/hooks/useMailStoreRedux';

import { getTopMailSumHeight } from '@web-mail/utils/mail';

import { Thunks } from '@web-common/state/reducer/mailReducer';
import { MailActions, useActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { FLOLDER, TASK_MAIL_STATUS } from '@web-mail/common/constant';

import { SliceIdParams, stringMap } from 'types';

import { actions as mailTabActions, MailTabModel, tabId, tabType } from '@web-common/state/reducer/mailTabReducer';

import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import { useState2SubordinateSlice, SdSliceContext } from '@web-mail/hooks/useState2SliceRedux';

import useListDiffFouceRender from '@web-mail/components/MailColumnEntry/useListDiffFouceRender';
import { getIn18Text } from 'api';

const MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const systemApi: SystemApi = api.api.getSystemApi();
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const defaultList: any[] = [];

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
const MailColumnEntry = ({ isLeftRight }: SliceIdParams<{ isLeftRight: boolean }>) => {
  const dispatch = useAppDispatch();
  const reducer = useActions(MailActions);
  const sliceId = useContext(SdSliceContext);
  /*
   * 本地状态 State
   */
  const [notice, setNotice] = useState<boolean>(systemApi.isSysNotificationAvailable() !== 'granted');
  const [curMenuMailId, setCurMenuMailId] = useState<any[]>();

  /*
   * redux
   */
  const [mailDataList] = useMailStore('mailDataList', undefined, sliceId, 'subordinate');
  /*
   * redux - slice
   */

  // 邮件列表是否处于loading
  const [listLoading, setListLoading] = useState2SubordinateSlice('listLoading');
  const [selectedKeys] = useState2SubordinateSlice('selectedKeys');
  // 邮件列表宽高设置
  const [scrollTop, setScrollTop] = useState2SubordinateSlice('scrollTop');
  // 新邮件提醒
  const [isNoticeNum, setIsNoticeNum] = useState2SubordinateSlice('noticeNum');
  // 邮件列表-选中的邮件id list
  const [activeIds, setActiveIds] = useState2SubordinateSlice('activeIds');
  // 邮件列表-右键菜单-是否显示
  const [mailListMenuVisible, setMailListMenuVisible] = useState2SubordinateSlice('mailListMenuVisible');
  // 邮件列表-上部-二级tab选中
  const [selected] = useState2SubordinateSlice('mailListStateTab');
  // 邮件-刷新按钮-是否处于loading状态
  const [refreshLoading, setFreshLoading] = useState2SubordinateSlice('refreshBtnLoading');
  // 邮件列表-当前选中的邮件id
  const [, setSelectedMail] = useState2SubordinateSlice('selectedMailId');
  // 邮件-邮件列表-总数
  const [mailTotal] = useState2SubordinateSlice('mailTotal');
  // 邮件列表-首次加载-是否失败
  const [listLoadIsFail, setListLoadIsFail] = useState2SubordinateSlice('mailListInitIsFailed');
  // 文件夹-选中的联系人Email
  const [selectedContacts] = useState2SubordinateSlice('selectedContacts');

  const [listModel, setListModel] = useState2SubordinateSlice('defaultMailListSelectedModel');

  const listFouceRender = useListDiffFouceRender(mailDataList, defaultList, false, isLeftRight);
  /*
   * 衍生状态
   */
  const currentTab: MailTabModel = useAppSelector(state => state.mailTabReducer.currentTab);
  // const currentTabId: string = useAppSelector(state => state.mailTabReducer.currentTab.id);

  // 邮件-搜索-是否是高级搜素
  const showListBackTop = useMemo(() => scrollTop > TOP_CALCULATED, [scrollTop]);
  const mailList = mailDataList;
  const havingContent = (mailList && mailList.length > 0) || listLoading;
  const isSelectedContact = useMemo(() => selectedContacts.list.length > 0, [selectedContacts.list]);

  // 邮件列表ref
  const mailListRef = useRef();

  // 页签变化的时候，保持列表的st状态
  // useEffect(()=>{
  //   mailListRef?.current?.scrollToPosition(scrollTop);
  // },[currentTabId]);

  // 通栏下-初始化邮件列表选中状态
  useEffect(() => {
    if (!isLeftRight && activeIds && activeIds.length == 0) {
      if (mailDataList?.length) {
        setActiveIds([mailDataList[0]?.id]);
      }
    }
  }, [isLeftRight, activeIds, mailDataList]);

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
          type: 'subordinate',
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

  // 请求邮件列表数据
  const loadMailListData = useCallback(({ startIndex }, noCache: boolean = false) => {
    return dispatch(
      Thunks.loadMailList_edm({
        startIndex,
        noCache,
        showLoading: false,
        type: 'subordinate',
        sliceId,
      })
    );
  }, []);

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
        trackApi.track('waimao_view_mailDetailPage', { type: 'Subordinate mail' });
        setSelectedMail({ id });
      }
    },
    [isLeftRight]
  );

  // 邮件双击
  const handleMailDoubleClick = useCallback((mail: MailEntryModel) => {
    const { isThread, _account, isTpMail, owner } = mail;
    mailPerfTool.mailContent('window', 'start', { isThread: !!isThread });
    trackApi.track('waimao_view_mailDetailPage', { type: 'Subordinate mail' });
    if (systemApi.isElectron()) {
      if (mail.entry.folder === FLOLDER.DRAFT) {
        // 草稿箱双击--再次编辑
        MailApi.doEditMail(mail.id, { draft: true }).catch(() => {});
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

  const beforeSelectedHandler = (_ids: string[], activeIds: string[]): string[] => {
    const isTask: stringMap = {};
    (mailDataList as any).forEach((item: MailEntryModel) => {
      isTask[item.id + ''] = item?.taskInfo?.status === TASK_MAIL_STATUS.PROCESSING;
    });
    if (activeIds.length == 1) {
      return activeIds;
    }
    return activeIds.filter(item => !isTask[item]);
  };

  // 普通邮件列表公用属性
  const listCommonAttr = useMemo(() => {
    return {
      showGroupDecorate: false,
      isLeftRight,
      activeId: activeIds,
      refreshPage,
      onDoubleClick: handleMailDoubleClick,
      onActiveInWindow: openNewWindow,
      scrollTop,
      listLoading,
      hkDisabled: true,
      showCheckbox: false,
      onScroll: (param: { scrollTop: number }) => {
        setScrollTop(param.scrollTop);
      },
      // 用于在onSelect触发前，干预选中的邮件id。并且会保持快捷键model的正确变更
      beforeSelected: beforeSelectedHandler,
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
  }, [activeIds, scrollTop, listLoading, handleMailActive, handleMailDoubleClick, isLeftRight, currentTab]);

  // 通栏邮件列表公用属性
  const longListCommonAttr = useMemo(() => {
    return {
      showGroupDecorate: false,
      isLeftRight,
      activeId: activeIds,
      refreshPage,
      onDoubleClick: handleMailDoubleClick,
      onActiveInWindow: openNewWindow,
      scrollTop,
      listLoading,
      hkDisabled: true,
      showCheckbox: false,
      onScroll: (param: { scrollTop: number }) => {
        setScrollTop(param.scrollTop);
      },
      // 用于在onSelect触发前，干预选中的邮件id。并且会保持快捷键model的正确变更
      beforeSelected: beforeSelectedHandler,
      onSelect: (_ids: string[], activeIds: string[]) => {
        setActiveIds(activeIds);
      },
      onUnSelect: (_ids: string[], activeIds: string[]) => {
        setActiveIds(activeIds);
      },
      onActive: (id: string, _index: number, data: MailEntryModel) => {
        setActiveIds([id]);
        let title = data?.entry?.title;
        try {
          title = title.replace(/<b>/g, '').replace(/<\/b>/g, '') || getIn18Text('WUZHUTI');
        } catch (e) {
          console.error('[Error reg]', e);
        }
        // 如果是通栏则新开页签
        const mailTabModel: MailTabModel = {
          id: id,
          title,
          type: tabType.read,
          closeable: true,
          isActive: true,
          extra: {
            from: tabId.subordinate,
          },
        };
        trackApi.track('waimao_view_mailDetailPage', { type: 'Subordinate mail' });
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
  }, [activeIds, scrollTop, listLoading, handleMailActive, handleMailDoubleClick, isLeftRight, currentTab]);

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
          rowCount={mailTotal}
          loadMoreRows={loadMailListData}
          notice={notice}
          selectedKeys={selectedKeys}
          tagName={null}
          onScroll={(param: { scrollTop: number }) => {
            setScrollTop(param.scrollTop);
            // 距离顶部10px的时候，收起新邮件提醒
            if (param.scrollTop <= getTopMailSumHeight(mailDataList) && isNoticeNum != 0) {
              setIsNoticeNum(0);
            }
          }}
          onDelete={(idList: string[]) => {
            if (idList && idList.length) {
              dispatch(Thunks.deleteMailFromHotKey(idList.length === 1 ? idList[0] : idList));
            }
          }}
          topExtraData={[]}
          selected={selected}
          listModel={listModel}
          onListModelChange={onListModelChange}
          listFouceRender={listFouceRender}
        />
      );
    },
    [listCommonAttr, mailDataList, mailTotal, loadMailListData, notice, selectedKeys, isLeftRight, longListCommonAttr, selected, listModel, listFouceRender]
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
        name={getIn18Text('ZANWUYOUJIAN')}
        selected={selected}
        isLeftRight={isLeftRight}
        onRefresh={() => {
          setFreshLoading(true);
          refreshPage(true);
        }}
        showRefresh={isSelectedContact}
      />
    ),
    [selected, isLeftRight, isSelectedContact]
  );

  const MailListCom = useCallback(
    (config: { height: number; width: number }) => (
      <div className="m-list">
        <MailWrap
          visible={mailListMenuVisible}
          setVisible={setMailListMenuVisible}
          selectedKeys={selectedKeys}
          selected={selected}
          onMove={handleMailMove}
          onDelete={handleMailDelete}
          activeMailId={curMenuMailId}
          openNewWindow={openNewWindow}
        >
          {mailListElement(config)}
        </MailWrap>
      </div>
    ),
    [mailListElement, mailListMenuVisible, selectedKeys, selected, curMenuMailId]
  );

  const ListTipCom = listLoadIsFail ? ListFailCom : ListEmptyCom;

  return (
    <>
      <div className="m-list-container" style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flexShrink: 0 }}>
          <FilterTabCm />
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
