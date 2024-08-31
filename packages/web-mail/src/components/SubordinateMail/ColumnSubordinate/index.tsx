import React, { useRef, useState, useEffect, useContext } from 'react';
import { Tooltip, Button, Spin } from 'antd';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { apiHolder as api, apis, MailApi, DataTrackerApi, MailConfApi as MailConfApiType } from 'api';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import NetWatcher from '@web-common/components/UI/NetWatcher';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import EditTree from '@web-mail/components/ColumnMailBox/EditTree';
import { AntTreeNodeProps } from '@web-mail/common/library/Tree';
import { CustomerTreeChildData, CustomerTreeData, loadEdmMailListParam, SliceIdParams } from '@web-mail/types';
import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import { reduxMessage, treeDFS } from '@web-mail/util';
import { actions as mailTabActions, tabId, tabType } from '@web-common/state/reducer/mailTabReducer';
import classnames from 'classnames/bind';
import './index.scss';
import useDebounceForEvent from '@web-mail/hooks/useDebounceForEvent';
import MailSubTab from '../../ColumnMailBox/MailSubTab';
import { useState2SubordinateSlice, SdSliceContext } from '@web-mail/hooks/useState2SliceRedux';
import { getIn18Text } from 'api';

const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApiType;
const storageApi = api.api.getDataStoreApi();

const ColumnMailBox: React.ForwardRefRenderFunction<any, SliceIdParams> = () => {
  const dispatch = useAppDispatch();
  const sliceId = useContext(SdSliceContext);
  /*
   * 本地状态 Ref
   */
  // 写邮件-按钮-超时计时器
  const btnWriteMailLoadingTimer = useRef<number | null>(null);

  /*
   * 本地状态 State
   */
  const [btnWriteMailLoading, setBtnWriteMailLoading] = useState(false);

  /*
   * redux
   */
  // 当前页签
  const currentTabType = useAppSelector(state => state.mailTabReducer.currentTab.type);

  /*
   * redux - slice
   */
  // 客户列表是否处于loading
  const [subordinateListLoading] = useState2SubordinateSlice('subordinateListLoading');
  // 文件夹-选中的key
  const [selectedKeys, setSelectedKeys] = useState2SubordinateSlice('selectedKeys');
  // 文件夹-选中的联系人Email
  const [, setSelectedContacts] = useState2SubordinateSlice('selectedContacts');
  // 收信按钮-loading状态
  const [refreshBtnLoading] = useState2SubordinateSlice('refreshBtnLoading');
  // 邮件列表-文件夹-树形结构-list
  const [treeList] = useState2SubordinateSlice('customerTreeList');
  // 邮件-文件夹树-展开的key
  const [expandedKeys, setExpandKeys] = useState2SubordinateSlice('expandedKeys');
  // 邮件列表-上部-二级tab选中
  const [, setFilterSelected] = useState2SubordinateSlice('mailListStateTab');

  /*
   * 衍生状态
   */
  // 分栏通栏
  const isLeftRight = mailConfApi.getMailPageLayout() === '1';

  // 初始化的时候预置请求
  useEffect(() => {
    try {
      const localTask = storageApi.getSync('atSdMsilList')?.data;
      if (localTask && new Date().getTime() - new Date(+localTask).getTime() < 60000) {
        const key = selectedKeys?.id;
        let activeNode: Record<string, AntTreeNodeProps> = {};
        treeDFS(treeList, (node: AntTreeNodeProps) => {
          if (node && node?.key == key) {
            activeNode = node;
          }
        });
        if (activeNode && activeNode?.key) {
          onTreeSelectDebounce([activeNode?.key], { node: { ...activeNode } });
        }
        storageApi.del('atSdMsilList').then();
      }
    } catch (e) {
      storageApi.del('atSdMsilList').then();
      console.error('[configSdTab localTask atSdMsilList Error]', e);
    }
  }, [treeList]);

  const loopTreeData = (data: CustomerTreeData[], searchValue: string, isLeaf = false): CustomerTreeData[] =>
    data.map(item => {
      const strTitle = item.title as string;
      const index = strTitle.toLowerCase().indexOf(searchValue);
      const beforeStr = strTitle.substring(0, index);
      const afterStr = strTitle.slice(index + searchValue.length);
      const title =
        index > -1 ? (
          <span>
            {beforeStr}
            <span style={{ color: '#386ee7' }}>{searchValue}</span>
            {afterStr}
          </span>
        ) : (
          <span>{strTitle}</span>
        );
      if (item.children) {
        return { ...item, title, isLeaf, children: loopTreeData(item.children, searchValue, true) as CustomerTreeChildData[] };
      }
      return {
        ...item,
        title,
      };
    });

  const onLoadData = async (node: any) => {
    // 目前下属数据是一次性加载，所以没有 onLoadData 的过程
    console.log('subordinate onLoadData', node);
  };

  const handleWriteBtnClick = useDebounceForEvent(() => {
    // 唤起写信页
    // setCurrentAccount();
    mailApi.doWriteMailToContact();
    // 打点
    trackApi.track('pcMail_click_writeMailButton_topBar', { source: 'subordinateMail' });
    setBtnWriteMailLoading(true);
    // 新标签方式打开，1.5秒足够
    if (!btnWriteMailLoadingTimer.current) {
      btnWriteMailLoadingTimer.current = setTimeout(() => {
        setBtnWriteMailLoading(false);
        btnWriteMailLoadingTimer.current = null;
      }, 1500) as any;
    }
  }, 200);

  const activeSubordinateTab = () => {
    // 通栏模式下点击文件夹进行跳转
    if (!isLeftRight) {
      dispatch(mailTabActions.doChangeCurrentTab(tabId.subordinate));
    }
  };

  const onTreeSelect = (selectedKeys: string[], { node }: { node: AntTreeNodeProps }) => {
    if (!selectedKeys || selectedKeys.length == 0) {
      return;
    }
    if (node?.key === 'all') {
      if (expandedKeys?.includes('all')) {
        setExpandKeys(expandedKeys.filter(item => item != 'all'));
      } else {
        setExpandKeys(['all', ...expandedKeys]);
      }
      return;
    }
    activeSubordinateTab();
    setSelectedKeys({ id: selectedKeys[0], accountName: node.accountName });
    setFilterSelected('ALL');
    const { children, email } = node;
    let toList: string[];
    if (Array.isArray(children)) {
      toList = (children as CustomerTreeChildData[]).map(v => v.email);
    } else {
      toList = email ? [email] : [];
    }
    setSelectedContacts({ list: toList });
    const params: loadEdmMailListParam = {
      noCache: false,
      startIndex: 0,
      type: 'subordinate',
      sliceId,
    };
    dispatch(Thunks.loadMailList_edm(params));
  };

  const onTreeSelectDebounce = useDebounceForEvent(onTreeSelect, 300, {
    leading: true,
    trailing: true,
  });

  return (
    <>
      <NetWatcher />
      <MailSubTab />
      <div className="m-edit-container">
        <Button
          type="primary"
          className="u-mail-btn sirius-no-drag"
          icon={
            <span className="icon">
              <ReadListIcons.EditSvg />
            </span>
          }
          onClick={handleWriteBtnClick}
          loading={btnWriteMailLoading}
        >
          <span className="text">{getIn18Text('XIEYOUJIAN')}</span>
        </Button>
        <Tooltip placement="bottom" title={refreshBtnLoading ? getIn18Text('SHUAXINZHONG') : getIn18Text('SHUAXIN')} mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
          <div
            className={`u-refresh sirius-no-drag btn ${refreshBtnLoading ? 'sirius-spin' : ''}`}
            onClick={() => {
              if (!refreshBtnLoading) {
                dispatch(Thunks.refreshPage_sd({ sliceId }));
              } else {
                reduxMessage.success({ content: `${getIn18Text('SHUAXINZHONG')}, ${getIn18Text('QINGSHAOHOU')}` });
              }
            }}
          />
        </Tooltip>
      </div>
      <div className={classnames('m-tree-container', 'customer-tree-container')} style={{ marginTop: 20 }}>
        {subordinateListLoading ? (
          <div className="u-loading">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          </div>
        ) : (
          <></>
        )}
        {!subordinateListLoading && (
          <AutoSizer style={{ width: '100%', height: '100%' }}>
            {({ height }) => {
              return (
                <>
                  <EditTree
                    loadData={onLoadData}
                    height={height}
                    blockNode
                    showIcon
                    treeData={treeList}
                    expandedKeys={expandedKeys}
                    defaultExpandedKeys={expandedKeys}
                    onExpand={setExpandKeys}
                    editAble={false}
                    selectedKeys={currentTabType === tabType.read ? null : [selectedKeys.id]}
                    onSelect={onTreeSelectDebounce}
                    menu={null}
                    draggable={false}
                  />
                  <p className="m-search-res" style={{ display: subordinateListLoading || treeList.length > 0 ? 'none' : 'block' }}>
                    {getIn18Text('WUKEHU')}
                  </p>
                </>
              );
            }}
          </AutoSizer>
        )}
      </div>
    </>
  );
};

export default React.forwardRef(ColumnMailBox);
