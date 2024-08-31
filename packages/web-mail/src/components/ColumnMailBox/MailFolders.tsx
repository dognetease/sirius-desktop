import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { Tooltip, Menu } from 'antd';
import Alert from '@web-common/components/UI/Alert/Alert';
import { FLOLDER, MAIL_SEARCH_FILTER } from '../../common/constant';
import variables from '@web-common/styles/export.module.scss';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { useActions, useAppDispatch, MailActions, useAppSelector, MailClassifyActions } from '@web-common/state/createStore';
import { apiHolder as api, apis, DataTrackerApi, MailBoxModel, SystemApi, AccountApi, MultAccountsLoginInfo, AccountTypes } from 'api';
import { MailTreeState } from '@web-mail/types';
import { actions as mailTabActions, MailTabModel, tabType } from '@web-common/state/reducer/mailTabReducer';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import { isObject } from 'lodash';
import Badge from '@web-common/components/UI/SiriusBadge';

/**
 * 工具方法
 */
import debounce from 'lodash/debounce';
import lodashGet from 'lodash/get';
import { jumpToContactPersonalMark } from '@web-common/utils/contact_util';
import { validateFolderOperForNode } from '../../state/customize';

import {
  treeDFS,
  getTreeNodeById,
  isCustomFolder,
  folderId2String,
  folderId2Number,
  mailLogicStateIsMerge,
  mailConfigStateIsMerge,
  getMainAccount,
  isMainAccount,
  folderIdIsContact,
  isSystemFolder,
  folderIdIsRealFolder,
  dragTransFileHasEml,
  getEmlFileFromDragTrans,
  importMails,
  getMapConfigBySameAccountKey,
} from '../../util';

/**
 * 自定义hook
 */
import useUserLocalStorageState from '@web-mail/hooks/useUserLocalStorageState';
import useCreateCallbackForEvent from '@web-mail/hooks/useCreateCallbackForEvent';
import useState2RM from '../../hooks/useState2ReduxMock';
import useStateRef from '@web-mail/hooks/useStateRef';

/**
 * 自定义组件
 */
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { MailTag } from '../MailTagList/MailTag';
import SiriusCollapse from '@web-mail/components/SiriusCollapse';
import FolderTree, { ExportFolderRefProps } from './FolderTree';
import MultAccountsLoginModal from '@web-common/components/UI/MultAccountsLoginModal';
import { getIn18Text } from 'api';

/**
 * api实例
 */
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const inElectron = systemApi.isElectron();

interface MailFoldersProps {
  uploadFileRef: any;
}

interface AccountTreeData {
  accountId: string;
  accountName: string;
  emailType: string;
  count: number;
  expired: boolean;
  mailFolderTreeList: any;
  expandedKeys: any;
}

/**
 * 根据账号获取账号后展示数字，目前是收件箱未读数
 */
const getCount = (treeMap: MailTreeState, isMerge = false) => {
  if (!treeMap) {
    return 0;
  }
  let count = 0;
  const ignoreFolder = [FLOLDER.DRAFT, FLOLDER.UNREAD, FLOLDER.DEFER, FLOLDER.STAR];
  treeMap?.mailFolderTreeList?.forEach((item: MailBoxModel) => {
    if (item && !ignoreFolder.includes(item?.entry?.mailBoxId)) {
      count += isMerge ? item?.entry?.threadMailBoxCurrentUnread : item?.entry?.mailBoxUnread;
    }
  });
  return count;
};

const MailFolders: React.FC<MailFoldersProps> = props => {
  const { uploadFileRef } = props;
  const _uploadFileRef = useStateRef(uploadFileRef.current);
  const dispatch = useAppDispatch();
  const reducer = useActions(MailActions);
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);

  // #region redux方法
  /**
   * redux方法  ****************************************************** ******************************************************
   */
  // 邮箱-多账号-失效账号列表
  const [expiredAccountList] = useState2RM('expiredAccountList', 'doUpdateExpiredAccountList');
  // 邮件文件夹相关状态map
  const [mailTreeStateMap, setTreeState] = useState2RM('mailTreeStateMap', 'doUpdateMailTreeState');
  // 邮件标签列表-选中的标签名称
  const [tagName] = useState2RM('mailTagFolderActiveKey');
  // 当前搜索账号
  const [mailSearchAccount] = useState2RM('mailSearchAccount', 'doUpdateMailSearchAccount');

  // 邮件的拖拽信息
  const [folderTreeDragModel] = useState2RM('folderTreeDragModel');
  // 邮件列表-上部-二级tab选中
  const [, setSelected] = useState2RM('', 'doUpdateMailListStateTab');

  // 当前页签
  const currentTabType = useAppSelector(state => state.mailTabReducer.currentTab.type);
  // 搜索-文件夹树-展开的key
  const [expandedSearchKeys] = useState2RM('expandedSearchKeys', 'doUpdateExpandedSearchKeys');
  // 搜索列表-当前选中的key
  const [selectedSearchKeys] = useState2RM('selectedSearchKeys', 'doUpdateSelectedSearchKey');
  // 邮件-文件夹-移动弹窗-是否展示
  const [, setFolderModveModalVisiable] = useState2RM('', 'doUpdateFolderModveModalVisiable');
  // 邮件-搜索-搜索类型
  const [mailSearching] = useState2RM('mailSearching', 'doUpdateMailSearching');
  // 邮件列表-当前选中的key
  const [selectedKeys, setSelectedKeys] = useState2RM('selectedKeys', 'doUpdateSelectedKey');
  // 文件夹树是否处于外部拖拽模式
  const [isDragModel] = useState2RM('isDragModel');
  // 对话弹窗配置项
  const [, setDialog] = useState2RM('', 'doUpdatedialogConfig');
  // 邮件-文件夹-用户自定义文件夹
  // 通用提示弹窗是否展示-ex：删除，删除全部
  const [, setModalVisible] = useState2RM('', 'doUpdateCommonModalVisible');
  // 是否展示添加联系人弹窗
  const [, setAddContactModelVisiable] = useState2RM('addContactModelVisiable');
  // 邮件-搜索-搜索状态对象
  const [mailSearchStateMap] = useState2RM('mailSearchStateMap', 'doUpdateMailSearchStateMap');
  // 邮件列表-文件夹-树形结构-list
  const [, setFolderMoveId] = useState2RM('', 'doUpdateFolderMoveId');
  // 邮件列表-文件夹-邮件导入-list
  const [, setImportFolderId] = useState2RM('', 'doUpdateImportFolderId');
  const { setMailFolderId, changeShowClassifyModal } = useActions(MailClassifyActions);
  // 当前邮件目录-邮件删除后保留的天数
  const [keepPeriod] = useState2RM('keepPeriod', 'doUpdateKeepPeriod');
  const [multAccountsLoginVisible, setMultAccountsLoginVisible] = useState<boolean>(false);
  const [multAccountsLoginInfo, setMultAccountsLoginInfo] = useState<MultAccountsLoginInfo>({ type: 'bind', way: 'mailSetting' });

  // #endregion

  // #region 内部状态
  /**
   * 内部状态  ****************************************************** ******************************************************
   */
  // 星标联系人文件夹是否展开了
  // const [, setStarFolderIsExpend] = useUserLocalStorageState<boolean>(STAR_FOLDER_IS_EXPAND, true);
  // const [, setFolderIsExpend] = useUserLocalStorageState<boolean>(FOLDER_EXPAND_ACCOUNT, {});

  // 是否展示星标联系人文件夹-新功能tag
  const [showStarFolderTag, setShowStarFolderTag] = useUserLocalStorageState<boolean>('showStarFolderTag', true);
  // 多账号，控制打开关闭手风琴的key，因为切换页签需要保持账号维度的打开闭合状态，提取到redux去
  // const [activeKey, setActiveKey] = useState<string[]>([]);
  const [activeKey, setActiveKey] = useState2RM('accountActiveKey', 'doUpdateAccountActiveKey');
  // 主邮箱-是否有用户自定义文件夹
  const [mainMailHasCustomFolder, setMailMailHasCtFolder] = useState(true);
  // 文件夹引用多账号map
  const folderRefMap = useRef<{ [key: string]: ExportFolderRefProps }>({});
  // // 邮件上传inputref
  // const uploadFileRef = useRef<HTMLInputElement>(null);
  // 账号失效弹窗
  const md = useRef<any>();
  // 左侧标签滚动区域
  const treeContainerRef = useRef<HTMLDivElement | null>(null);

  // #endregion

  // #region 计算属性
  /**
   * 计算属性  ****************************************************** ******************************************************
   */

  // 邮件-搜索-是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);

  const curTabIsReadTab = useMemo(() => currentTabType === tabType.read, [currentTabType]);

  // 是否处于邮件拖拽模式中
  const isMailDraging = useMemo(() => folderTreeDragModel != null, [folderTreeDragModel]);

  // 多账号信息处理成数组
  const maiTreeStateList = useMemo(() => {
    const arr: any[] = [];
    Object.keys(mailTreeStateMap).forEach(key => {
      // 账号后显示的数字，暂时选择展示收件箱数量
      if (key === 'main') {
        const count = getCount(mailTreeStateMap.main, mailConfigStateIsMerge());
        arr[0] = {
          ...mailTreeStateMap.main,
          accountId: getMainAccount(),
          count,
        };
      } else {
        const index = mailTreeStateMap[key].sort;
        const count = getCount(mailTreeStateMap[key]);
        arr[index] = {
          ...mailTreeStateMap[key],
          accountId: key,
          count,
        };
      }
    });
    return arr;
  }, [mailTreeStateMap]);

  // 计算所有账号的额未读数之和
  const mailUnReadSum = useMemo(() => {
    let sum = 0;
    maiTreeStateList.forEach(item => {
      if (item?.count) {
        sum += item.count;
      }
    });
    return sum;
  }, [maiTreeStateList]);

  // #endregion

  // #region 基本业务方法
  /**
   * 基本业务方法 ****************************************************** ******************************************************
   */

  // 获取当前列表是否处于逻辑聚合模式
  const isMerge = useCallback(() => mailLogicStateIsMerge(selectedKeys?.id, selectedKeys?.accountId, isSearching), [selectedKeys, isSearching]);

  /**
   * 账号失效提示
   */
  // const accountExpiredTip = useCallback(() => {
  //   if (md.current) {
  //     md.current.destroy();
  //   }
  //   md.current = SiriusModal.info({
  //     title: getIn18Text('accountExpiredTip'),
  //     okCancel: !0,
  //     cancelText: getIn18Text('QUXIAO'),
  //     onCancel: () => {
  //       md.destroy();
  //     },
  //     okText: getIn18Text('recheck'),
  //     onOk: () => {
  //       navigate('/#setting', { state: { currentTab: 'mail', mailConfigTab: 'OTHER' } });
  //       md.current.destroy();
  //     }
  //   });
  // }, []);

  // 清空文件夹下所有邮件
  const doMailAllDelete = useCallback((fid: number, accountId: string) => {
    if (fid) {
      return dispatch(
        Thunks.doMailAllDelete({
          fid,
          accountId,
        })
      );
    }
    return Promise.reject();
  }, []);

  // 获取删除弹窗配置
  const getDeletDialogConfig = useCallback(
    (node: MailBoxModel): object => {
      const fid = node.entry.mailBoxId;
      const accountId = node._account || '';
      if (fid === 4) {
        return {
          title: getIn18Text('QUEDINGCHEDIQINGK“YSC”ZZJFYJM？', { count: node?.entry.mailBoxTotal }),
          okText: getIn18Text('CHEDIQINGKONG'),
          danger: true,
          onOk: () => doMailAllDelete(fid, accountId),
          content: getIn18Text('CHEDIQINGKONGDE'),
        };
      }
      const getTitle = () => (
        <div style={{ display: 'inline-flex', maxWidth: '375px' }}>
          <span>{getIn18Text('QUEDINGQINGKONG\u201C')}</span>
          <span
            style={{
              flex: 1,
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {node?.entry.mailBoxName}
          </span>
          <span>
            {getIn18Text('\u201DZHONGDE')}
            {node?.entry.mailBoxTotal}
            {getIn18Text('FENGYOUJIANMA\uFF1F')}
          </span>
        </div>
      );
      return {
        title: getTitle(),
        okText: getIn18Text('QINGKONG'),
        danger: true,
        onOk: () => doMailAllDelete(fid, accountId),
        content: getIn18Text('QINGKONGDEYOUJIANJZCZ“YSC”WJJZT', { keepPeriod }),
      };
    },
    [doMailAllDelete]
  );

  // 控制tree container滚动
  const treeContainerScrollController = useCallback((top: number): void => {
    if (treeContainerRef.current != null && treeContainerRef.current.scrollBy) {
      treeContainerRef.current.scrollBy({
        top,
      });
    }
  }, []);

  // 通栏布局下，点击文件夹切页签
  const handleSwitchTab = useCallback((folder: MailBoxModel) => {
    let title = folder?.entry?.mailBoxName;
    // 17版本智能模式下线
    // const fid = folder?.entry?.mailBoxId;
    // const isThread = mailConfigStateIsMerge();
    // const showAIName = !isThread && fid == 1;
    // if (showAIName) {
    //   title = (getIn18Text('ZHINENG')) + title;
    // }
    const mailTabModel: MailTabModel = {
      id: '-1',
      title,
      type: tabType.readMain,
      closeable: false,
      isActive: true,
      extra: {
        accountId: folder?._account,
      },
    };
    dispatch(mailTabActions.doSetTab(mailTabModel));
  }, []);

  // 打开邮件设置
  const openMailSetting = useCallback((id: string) => {
    setMailFolderId(id);
    changeShowClassifyModal(true);
    trackApi.track('pcMail_view_mailClassificationNewPage', { type: 'folder' });
  }, []);

  /**
   * 文件夹-全标已读
   */
  const handleAllRead = useCallback(
    (fid: number, accountId?: string) => {
      reducer.updateAllReadLoading({
        accountId: accountId,
        folderId: fid,
        loading: true,
      });
      return dispatch(
        Thunks.doActiveFolderAllRead({
          folderId: fid,
          isThread: isMerge(),
          accountId,
        })
      )
        .unwrap()
        .finally(() => {
          reducer.updateAllReadLoading({
            accountId: accountId,
            folderId: fid,
            loading: false,
          });
        });
    },
    [isMerge]
  );

  /**
   * 渲染文件夹的未读数
   *
   */
  const renderUnread = useCallback(
    (node: MailBoxModel, unRead: string | number) => {
      if (node.mailBoxId === FLOLDER.DEFER) {
        return unRead ? (
          <span className={`u-unread ${node.mailBoxId === FLOLDER.DEFER ? 'u-undone' : ''}`}>
            {node.mailBoxId === FLOLDER.DEFER ? getIn18Text('JINRI') : ''}
            {unRead}
          </span>
        ) : null;
      }
      if (node.mailBoxId === FLOLDER.STAR && showStarFolderTag) {
        return <Badge intro={getIn18Text('XINGOGNNENG')} style={{ marginRight: 10 }} />;
      }
    },
    [showStarFolderTag]
  );

  /**
   * 文件夹相关操作方法 ****************************************************** ******************************************************
   */

  /**
   * 处理eml文件拖放到文件夹
   */
  const handleEmlDrop = useCallback((event, fid, accountId) => {
    event.preventDefault();
    // 获取拖拽文件夹中的eml文件
    const uploadFileList = getEmlFileFromDragTrans(event);
    if (uploadFileList.length) {
      importMails({ fid: Number(fid), fileList: uploadFileList, _account: accountId }, true).then(() => {
        // 延迟刷新当前邮件列表
        setTimeout(() => {
          dispatch(
            Thunks.refreshMailList({
              noCache: true,
              showLoading: false,
              // accountId: accountId,
            })
          );
        }, 1500);
      });
    }
    // 关闭拖拽响应
    reducer.updateOuterFileDragLeave({});
  }, []);

  /**
   * 邮件-文件夹-节点drop事件处理
   */
  const handleTreeItemDrop = useCallback((e, folderId: number, folderAccount: string) => {
    e.persist();
    const idlist: string[] = e.dataTransfer.getData('text').split(',');
    const isThread = e.dataTransfer.getData('isThread') == 'true';
    const accountId = e.dataTransfer.getData('accountId');
    if (folderAccount == accountId) {
      dispatch(
        Thunks.doMoveMail({
          mailId: idlist,
          folderId,
          showLoading: isThread ? 'global' : true,
          accountId,
        })
      );
    } else {
      Message.warn({
        content: getIn18Text('GAIYOUJIANBUSHUYDQZH'),
      });
    }
  }, []);

  // 文件夹树-右键菜单-点击
  const handleFolderTreeMenuClick = useCallback(() => {
    // 埋点收集文件夹树-邮件菜单-点击事件
    trackApi.track('pcMail_clickOption_rightKey_folderList');
  }, []);

  // 文件夹树-移动文件夹
  const handleMoveFolder = useCallback((node: MailBoxModel) => {
    setFolderMoveId({
      folderId: node.entry.mailBoxId,
      accountId: node._account,
    });
    setFolderModveModalVisiable(true);
  }, []);

  // 文件夹树-移动文件夹
  const handleImportFolder = useCallback((node: MailBoxModel) => {
    setImportFolderId({
      folderId: node.entry.mailBoxId,
      accountId: node._account,
    });
    // setFolderModveModalVisiable(true);
  }, []);

  // 前后触发，削减点击触发的数量
  const handleSwitchFolder = useCallback(
    debounce(
      (node: MailBoxModel) => {
        if (node) {
          let key = selectedSearchKeys[mailSearchAccount]?.folder || FLOLDER.SEARCH_ALL_RESULT;

          console.log('[FolderTree] 选择文件夹 handleSwitchFolder:', key, Date.now());
          const account: string = node?._account || mailSearchAccount;
          if (node.entry) {
            const { mailBoxId, mailBoxName } = node.entry;
            key = mailBoxId;
            const folderName = mailBoxName;
            if (isSearching) {
              trackApi.track('pcMail_select_leftOptions_mailSearchResultPage', {
                filtratesName: '文件夹筛选',
              });
            } else {
              // 埋点，收集文件夹切换
              if (key != FLOLDER.OTHERS && key != FLOLDER.TAG && key != FLOLDER.STAR) {
                try {
                  const isContant = folderIdIsContact(key);
                  let trackFolderName = folderName;
                  let trackFolderKey = key;
                  if (isContant) {
                    trackFolderKey = FLOLDER.STAR;
                    trackFolderName = getIn18Text('markContact');
                  } else {
                    if (key >= 100) {
                      trackFolderName = getIn18Text('ZIDINGYIWENJIAN');
                    }
                  }

                  trackApi.track('pcMail_switch_folder_folderList', {
                    folderType: trackFolderKey,
                    folderTypeName: trackFolderName,
                  });
                } catch (err) {
                  console.error(err);
                }
              }
            }
          }
          reducer.doSwitchFolder({
            id: key,
            accountId: account,
            authAccountType: node?.authAccountType,
          });
          if (isSearching) {
            if (!node?.entry) {
              let filterKey = '';
              if (isObject(node?.filterCond?.operand)) {
                filterKey = Object.keys(node.filterCond.operand)[0];
              } else {
                filterKey = node?.filterCond?.field;
              }
              trackApi.track('pcMail_select_leftOptions_mailSearchResultPage', {
                filtratesName: MAIL_SEARCH_FILTER[filterKey],
              });
            }
            // 搜索时判断父文件夹结果为0默认展开
            if (node?.entry && lodashGet(node, 'children.length', 0) > 0) {
              const parentCount = lodashGet(node, 'entry.mailBoxUnread', 0);
              const childrenCount = (node.children || []).reduce((prev, cur) => prev + lodashGet(cur, 'entry.mailBoxUnread', 0), 0);
              if (parentCount === childrenCount && node?.mailBoxId && !expandedSearchKeys.includes(node.mailBoxId)) {
                const expandList = [...expandedSearchKeys];
                expandList.push(node.mailBoxId);
                expandFolder(expandList);
              }
            }
            dispatch(Thunks.refreshMailList({ showLoading: false }));
            const sType = mailSearchStateMap[account] || 'local';
            trackApi.track('pcMail_executeMailSearch', {
              searchMode: `全文搜索（${sType === 'local' ? '本地' : '云端'}）`,
            });
          }
        }
      },
      300,
      {
        leading: true,
        trailing: true,
      }
    ),
    [isSearching, expandedSearchKeys, mailSearchStateMap]
  );

  /**
   * 处理邮件拖拽到文件夹上的移动行为
   */
  const handleMailDropFolder = useCallback(
    e => {
      const { event, node = {} } = e;
      // 如果是eml文件
      let hasEml = dragTransFileHasEml(event);
      if (hasEml) {
        // 处理eml文件的拖放
        const mailBoxId = node?.entry?.mailBoxId;
        handleEmlDrop(event, mailBoxId, node?._account);
      } else {
        // 处理邮件的拖放
        const mailBoxId = node?.entry?.mailBoxId;
        handleTreeItemDrop(event, mailBoxId, node?._account);
      }
    },
    [handleEmlDrop, handleTreeItemDrop]
  );

  const handleMailDropFolderRef = useCreateCallbackForEvent(handleMailDropFolder);

  /**
   * 星标文件夹-编辑按钮
   */
  const handleStarFolderEditClick = useCallback((node: MailBoxModel) => {
    jumpToContactPersonalMark();
  }, []);
  const handleStarFolderEditClickRef = useCreateCallbackForEvent(handleStarFolderEditClick);

  /**
   * 星标文件夹-添加按钮
   */
  const handleStarFolderAddClick = useCallback((node: MailBoxModel) => {
    trackApi.track('pcMail_click_addStarContact', { source: '文件夹列表添加星标按钮' });
    setAddContactModelVisiable(true);
  }, []);
  const handleStarFolderAddClickRef = useCreateCallbackForEvent(handleStarFolderAddClick);

  // 文件夹树-删除文件夹
  const handleDeleteFolder = useCallback(
    (node: MailBoxModel) => {
      // 判断文件夹下是否有邮件，有的话给出提示
      let mailTotal = 0;
      if (node) {
        treeDFS(node, item => {
          mailTotal += item.entry.mailBoxTotal;
        });
      }
      if (mailTotal > 0) {
        const al = Alert.info({
          title: getIn18Text('QINGXIANQINGKONGGAI'),
          funcBtns: [
            {
              text: getIn18Text('ZHIDAOLE'),
              type: 'primary',
              onClick: () => {
                al.destroy();
              },
            },
          ],
        });
      } else {
        // 如果当前文件夹或者子文件夹处于选中状态，将选中态置为收件箱
        let childsHasActiveNode = false;
        treeDFS(node, (item: MailBoxModel) => {
          if (selectedKeys && item.entry.mailBoxId === selectedKeys.id) {
            childsHasActiveNode = true;
          }
        });
        if (childsHasActiveNode) {
          const accountId = node?._account;
          setSelectedKeys({
            id: 1,
            accountId,
          });
        }
        // 文件夹的删除接口调用
        return dispatch(
          Thunks.deleteUserFolder({
            mailIds: [node.mailBoxId],
            accountId: node._account,
          })
        ).unwrap();
      }
    },
    [selectedKeys?.id]
  );

  const handleDeleteFolderRef = useCreateCallbackForEvent(handleDeleteFolder);

  /**
   * 多账号文件夹树-选中事件
   */
  const handleMultFolderSelect = useCallback(
    (folder: MailBoxModel, accountTreeData) => {
      const fid = folder.entry.mailBoxId;
      if (fid == FLOLDER.STAR || folderIdIsContact(fid)) {
        // 如果点击了星标联系人文件夹-去掉新功能tag
        setShowStarFolderTag(false);
      }
      if (fid === FLOLDER.STAR && folder.children && folder.children.length > 0) {
        let expandkeys = [...accountTreeData.expandedKeys];
        if (expandkeys.includes(FLOLDER.STAR)) {
          expandkeys = expandkeys.filter(item => item != FLOLDER.STAR);
          // setStarFolderIsExpend(false);
        } else {
          expandkeys.push(FLOLDER.STAR);
          //   setStarFolderIsExpend(true);
        }
        expandFolder(expandkeys, accountTreeData.accountId);
      } else {
        handleSwitchFolder(folder);
        // 切换页签
        handleSwitchTab(folder);
      }
    },
    [handleSwitchFolder, handleSwitchTab]
  );
  const handleMultFolderSelectRef = useCreateCallbackForEvent(handleMultFolderSelect);

  /**
   * 处理文件夹的拖拽排序和插入
   * warn: 现在只有主账号可以进行邮件的排序和拖拽，所以文件夹只读取住主账号下的文件夹，如果有需要在进行变更
   */
  const handleFolderDrop = useCallback(
    e => {
      // dropToGap 表示是否是跨层级拖拽
      const { dragNode, node, dropToGap, dropPosition } = e;
      let _dropToGap = dropToGap;
      const nodeId: number = node?.entry?.mailBoxId;
      const nodePid: number = node?.entry?.pid || 0;
      const dragNodeId: number = dragNode?.entry?.mailBoxId;
      // const dragNodePid: number = dragNode?.nodeData?.entry?.pid;
      // const { nodeData } = node;
      // 如果是选择插入到虚拟系统文件夹下，转换为排序
      if (!_dropToGap && nodeId < 0 && nodePid == 0) {
        _dropToGap = true;
      }
      const mailTreeList = mailTreeStateMap.main.mailFolderTreeList;
      // 进行操作合法性验证
      if (validateFolderOperForNode(mailTreeList, node, dragNode, _dropToGap, dropPosition)) {
        // 获取最高层级文件夹
        const systemFolderIdList: number[] = [];
        mailTreeList.forEach(node => {
          const pid = node?.entry?.pid || 0;
          const folderId = node?.entry?.mailBoxId;
          if (pid == 0) {
            systemFolderIdList.push(folderId);
          }
        });
        let idList = [];
        const id = _dropToGap ? nodePid : nodeId;
        // 获取目标层级idList
        idList = id === 0 ? systemFolderIdList : getTreeNodeById(mailTreeList, id)?.children?.map(item => item.entry.mailBoxId) || [];
        // 过滤掉正在操作的id
        idList = [...new Set([...idList.filter(item => item !== dragNodeId)])];
        // 求操作的目标文件夹id
        let nodeIdIndex = idList.findIndex(folderId => folderId === nodeId) || 0;
        // 插入到目标文件夹之后
        if (!(dropPosition && dropPosition < 0)) {
          nodeIdIndex += 1;
        }
        idList.splice(nodeIdIndex, 0, dragNodeId);
        dispatch(
          Thunks.moveSortUserFolder({
            id: dragNodeId,
            parent: id,
            sorts: idList,
            accountId: node?._account,
          })
        );
      }
    },
    [mailTreeStateMap?.main?.mailFolderTreeList]
  );
  const handleFolderDropRef = useCreateCallbackForEvent(handleFolderDrop);

  const expandFolder = useCallback((keys: any, accountId?: string) => {
    const numberKeys = folderId2Number(keys);
    setTreeState({
      accountId,
      name: 'expandedKeys',
      value: numberKeys,
    });
  }, []);

  const revalidateAccountFromPanel = (params: { accountType: AccountTypes; agentEmail: string; agentNickname: string }) => {
    const { accountType, agentEmail, agentNickname } = params;
    // 将这些更新合并为一次批处理操作
    // 为什么使用，因为这个方法是在异步方法里面，异步方法里面每一次操作set 都会更新一次视图
    unstable_batchedUpdates(() => {
      setMultAccountsLoginVisible(true);
      setMultAccountsLoginInfo({
        type: 'rebind',
        way: 'mailList',
        accountType,
        agentEmail,
        agentNickname,
      });
    });
  };

  // 重新验证账号
  const revalidateAccount = (accountData: AccountTreeData) => {
    const { emailType, accountId, accountName } = accountData;
    setMultAccountsLoginVisible(true);
    setMultAccountsLoginInfo({
      type: 'rebind',
      way: 'mailList',
      accountType: ['NeteaseQiYeMail', 'qyEmail'].includes(emailType) ? 'NeteaseQiYeMail' : (emailType as AccountTypes),
      agentEmail: accountId,
      agentNickname: accountName || accountId,
    });
  };

  const closeMultAccountsModal = () => {
    setMultAccountsLoginVisible(false);
  };

  /**
   * 多账号文件夹的折叠展开
   */
  const onMultAccountFolderExpand = useCallback(
    (keys: string[]) => {
      // 表示打开
      if (activeKey.length < keys.length) {
        const latestedKey = keys[keys.length - 1];
        // 新开的手风琴是失效的
        if (expiredAccountList.includes(latestedKey)) {
          // 获取账号信息
          const latestedAccount = maiTreeStateList.find(item => {
            return item?.accountId === latestedKey;
          });
          if (latestedAccount) {
            revalidateAccount(latestedAccount);
          }
        }
      }
      setActiveKey(keys);
    },
    [activeKey, expiredAccountList]
  );

  /**
   * 文件夹树策略 ************************************************************************************************************************************************
   *
   */

  /**
   * 邮件文件夹的自定义拖放规则
   */
  const folderAllowDrop = useCallback((dropNode: MailBoxModel, dragNode?: MailBoxModel) => {
    if (dragNode) {
      const dragKey = dragNode?.mailBoxId;
      const dragNodeIsRealSystem = isSystemFolder(dragKey) && folderIdIsRealFolder(dragKey);
      if (dragNodeIsRealSystem) {
        // api层会在数据上挂载 _deep 属性
        return dropNode?.entry?._deep <= 1 && !folderIdIsContact(dropNode?.entry?.mailBoxId);
      }
    }
    // 屏蔽掉-星标联系人及其文件夹
    return !folderIdIsContact(dropNode?.entry?.mailBoxId);
  }, []);

  /**
   *  邮件文件夹自定义是否可拖拽
   */
  const folderDragAble = useCallback((node: MailBoxModel) => {
    return !folderIdIsContact(node?.mailBoxId);
  }, []);

  /**
   * 自定义文件夹的操作按钮
   */
  const folderOperBtnVisibility = useCallback((node: MailBoxModel, defaultfn) => {
    let defaultVisibility = false;
    const key = node?.mailBoxId || '';
    // 如果是联系人伪文件夹，不展示操作按钮
    if (folderIdIsContact(key)) {
      return false;
    }
    if (defaultfn && typeof defaultfn === 'function') {
      defaultVisibility = defaultfn(node);
    }
    return defaultVisibility;
  }, []);

  /**
   * 文件夹的外部可拖放判断方法
   */
  const folderOuterAllowDrop = useCallback(node => {
    if (node && (node?.mailBoxId === FLOLDER.STAR || folderIdIsContact(node?.mailBoxId))) {
      return false;
    }
    return node?.mailBoxId > 0;
    // return !outerDropAllowFidMap.includes(node?.mailBoxId);
  }, []);

  /**
   * 文件夹支持eml文件是否可拖放的判断方法
   */
  const fodlerEmlAllowDrop = useCallback(node => {
    return folderIdIsRealFolder(node?.mailBoxId);
  }, []);

  /**
   * 文件夹树外部可拖放规则
   */
  const MainFolderTreeOuterDropRule = useCallback(
    (mailIsCurTree: boolean) => {
      if (isDragModel == 'eml') {
        return fodlerEmlAllowDrop;
      } else if (mailIsCurTree) {
        return folderOuterAllowDrop;
      }
      return false;
    },
    [isDragModel, fodlerEmlAllowDrop]
  );

  /**
   * 自定义的文件夹操作按钮
   */
  const folderOperBtnRender = useCallback((node: MailBoxModel) => {
    const key = node?.mailBoxId;
    if (key == FLOLDER.STAR) {
      return (
        <>
          <Tooltip title={getIn18Text('TIANJIA')} trigger={['hover']}>
            <div className="more" data-test-id="mail-start-contact-add-btn" onClick={() => handleStarFolderAddClickRef(node)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 8H13M8 13L8 3" stroke="#6F7485" stroke-linecap="round" />
              </svg>
            </div>
          </Tooltip>
          <Tooltip title={getIn18Text('GUANLI')} trigger={['hover']}>
            <div className="more" data-test-id="mail-start-contact-manage-btn" onClick={() => handleStarFolderEditClickRef(node)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="7.99992" cy="7.99967" r="1.66667" stroke="#6F7485" stroke-width="1.2" stroke-linecap="round" />
                <path
                  d="M7.49975 2.04063C7.80915 1.862 8.19034 1.862 8.49975 2.04063L12.9107 4.5873C13.2201 4.76593 13.4107 5.09606 13.4107 5.45332V10.5467C13.4107 10.9039 13.2201 11.2341 12.9107 11.4127L8.49975 13.9594C8.19035 14.138 7.80915 14.138 7.49975 13.9594L3.08879 11.4127C2.77939 11.2341 2.58879 10.9039 2.58879 10.5467V5.45332C2.58879 5.09606 2.77939 4.76593 3.08879 4.5873L7.49975 2.04063Z"
                  stroke="#6F7485"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </Tooltip>
        </>
      );
    }
  }, []);

  // 文件夹树-菜单
  const folderMenu = useCallback(
    (node: MailBoxModel) => {
      const isCustom = isCustomFolder(node?.entry?.mailBoxId);
      const showExtraFolderOper = isCustom;
      const fid = node?.entry?.mailBoxId;
      const isRealFolder = folderIdIsRealFolder(fid);
      const isMainAcc = isMainAccount(node._account);
      let showAllRead = false;
      let showImportEmls = isRealFolder;
      let total = 0;
      let unread = 0;
      const isThread = mailConfigStateIsMerge();
      const curUser = systemApi.getCurrentUser();
      // 只有主账号支持文件夹的右键菜单
      // 统计
      // const curMailTreeState = getTreeStatesByAccount(mailTreeStateMap, node._account);
      // if (curMailTreeState?.MailFolderTreeMap && Object.keys(curMailTreeState?.MailFolderTreeMap).length) {

      total = isThread ? node?.entry?.threadMailBoxTotal : node?.entry?.mailBoxTotal;
      unread = isThread ? node?.entry?.threadMailBoxCurrentUnread : node?.entry?.mailBoxCurrentUnread;
      // }
      // 任务邮件, 星标联系人下的联系人 不显示任何右键菜单
      if (folderIdIsContact(fid)) {
        return <></>;
      }
      // 判断是否显示已读按钮
      if ((fid < 2 || fid > 5) && fid !== 7 && unread && fid != FLOLDER.STAR && fid != FLOLDER.DEFER) {
        showAllRead = true;
      }
      const itemList: React.ReactElement[] = [];
      // 是否展示全标已读
      if (showAllRead) {
        itemList.push(
          <Menu.Item
            key="2"
            onClick={() => {
              // setFolderMenuVisible(false);
              // setFid({ mailBoxId: null });
              SiriusModal.confirm({
                title: getIn18Text('markAllConfirm'),
                hideCancel: true,
                okText: getIn18Text('QUEREN'),
                okButtonProps: { danger: true, type: 'default' },
                onOk: () => {
                  handleAllRead(fid, node._account);
                  handleFolderTreeMenuClick();
                },
                onCancel: () => {},
              });
            }}
          >
            {getIn18Text('QUANBIAOYIDU')}
          </Menu.Item>
        );
        itemList.push(<Menu.Divider />);
      }
      // 清空文件夹
      if (total) {
        itemList.push(
          <Menu.Item
            key="5"
            onClick={() => {
              // //setFolderMenuVisible(false);
              // setFid({ mailBoxId: fid });
              if (fid != null) {
                setDialog(getDeletDialogConfig(node));
                setModalVisible(true);
              }
              handleFolderTreeMenuClick();
            }}
          >
            {fid === 4 ? getIn18Text('CHEDIQINGKONGWEN') : getIn18Text('QINGKONGWENJIANJIA')}
          </Menu.Item>
        );
      }
      // 新建文件夹
      // 所有文件夹都可以创建同级文件夹
      itemList.push(
        <Menu.Item
          key="0"
          onClick={() => {
            try {
              const res = getMapConfigBySameAccountKey(folderRefMap?.current, node._account + '');
              if (res) {
                res?.appendFolder();
              }
            } catch (e) {
              console.warn('mail folder oper err', e);
            }
            handleFolderTreeMenuClick();
          }}
        >
          {getIn18Text('XINJIANWENJIANJIA')}
        </Menu.Item>
      );
      itemList.push(<Menu.Divider />);
      // 新建子文件夹
      // 实体文件夹都支持
      if (fid > 0) {
        itemList.push(
          <Menu.Item
            key="1"
            onClick={() => {
              try {
                const res = getMapConfigBySameAccountKey(folderRefMap?.current, node._account + '');
                if (res) {
                  res?.addFolder();
                }
              } catch (e) {
                console.warn('mail folder oper err', e);
              }
              handleFolderTreeMenuClick();
            }}
          >
            {getIn18Text('XINJIANZIWENJIAN')}
          </Menu.Item>
        );
        itemList.push(<Menu.Divider />);
      }
      // 重命名 移动至
      if (showExtraFolderOper) {
        itemList.push(
          <Menu.Item
            key="3"
            onClick={() => {
              try {
                const res = getMapConfigBySameAccountKey(folderRefMap?.current, node._account + '');
                if (res) {
                  res?.updateFolder();
                }
              } catch (e) {
                console.warn('mail folder oper err', e);
              }
              handleFolderTreeMenuClick();
            }}
          >
            {getIn18Text('ZHONGMINGMING')}
          </Menu.Item>
        );
        itemList.push(<Menu.Divider />);
        itemList.push(
          <Menu.Item
            key="4"
            onClick={() => {
              // setFolderMenuVisible(false);
              // setFid({ mailBoxId: null });
              handleMoveFolder(node);
              handleFolderTreeMenuClick();
            }}
          >
            {getIn18Text('YIDONGZHI')}
          </Menu.Item>
        );
        itemList.push(<Menu.Divider />);
      }
      // 非corp 非虚拟文件夹、自定义文件夹、待审核/已审核文件夹  - 只有主账号的文件夹有该存在 & 主账号是非三方账号
      if (!isCorpMail && (isCustom || (fid > 0 && fid !== 17 && fid !== 19 && fid != FLOLDER.SENT)) && isMainAcc && curUser?.prop?.authAccountType == '0') {
        itemList.push(
          <Menu.Item
            key="7"
            onClick={() => {
              // ////setFolderMenuVisible(false);
              // setFid({ mailBoxId: null });
              openMailSetting(fid);
              handleFolderTreeMenuClick();
            }}
          >
            {getIn18Text('SHEZHILAIXINFEN')}
          </Menu.Item>
        );
        itemList.push(<Menu.Divider />);
      }
      if (showExtraFolderOper) {
        itemList.push(
          <Menu.Item
            key="6"
            onClick={() => {
              try {
                const res = getMapConfigBySameAccountKey(folderRefMap?.current, node._account + '');
                if (res) {
                  res?.deleteFolder();
                }
              } catch (e) {
                console.warn('mail folder oper err', e);
              }
              handleFolderTreeMenuClick();
            }}
          >
            {getIn18Text('SHANCHU')}
          </Menu.Item>
        );
        itemList.push(<Menu.Divider />);
      }
      if (showImportEmls) {
        itemList.push(
          <Menu.Item
            key="8"
            onClick={() => {
              try {
                handleImportFolder(node);
                if (inElectron) {
                  importMails({ fid: node.entry.mailBoxId, _account: node._account }).then(() => {
                    // 刷新当前邮件列表
                    dispatch(
                      Thunks.refreshMailList({
                        noCache: true,
                        showLoading: false,
                        // accountId: node?._account,
                      })
                    );
                  });
                } else {
                  _uploadFileRef.current && _uploadFileRef.current?.click();
                }
              } catch (e) {
                console.warn('mail folder oper err', e);
              }
              handleFolderTreeMenuClick();
            }}
          >
            {getIn18Text('DAORUYOUJIAN')}
          </Menu.Item>
        );
        itemList.push(<Menu.Divider />);
      }

      // 排除最后一个横线
      itemList.pop();
      return itemList.length ? <Menu>{itemList}</Menu> : <></>;
    },
    [handleAllRead, handleFolderTreeMenuClick, getDeletDialogConfig, handleMoveFolder, openMailSetting, handleImportFolder]
  );

  /**
   * 文件夹邮件菜单
   */
  const getFolderMenu = useCallback(
    (data: MailBoxModel) => {
      if (data) {
        return folderMenu(data);
      }
      return <></>;
    },
    [folderMenu]
  );
  const getFolderMenuRef = useCreateCallbackForEvent(getFolderMenu);

  /**
   * 主要渲染流程 ***************** ***************** ***************** ***************** ***************** ***************** ***************** ***************** *****************
   */

  // 渲染多账号，非搜索下的主账号文件夹树和标签
  const renderTreeMainAccount = useCallback(
    (accountTreeData: { mailFolderTreeList: any; expandedKeys: any; accountId: string }) => {
      // 拖动的邮件是否属于当前邮件tree
      const mailIsCurTree = accountApi.getIsSameSubAccountSync(accountTreeData.accountId, folderTreeDragModel?.accountId);
      // 当前选中的目录是否属于当前tree
      const isCurTree = isMainAccount(selectedKeys.accountId);
      return (
        <>
          <FolderTree
            ref={folderRef => {
              folderRefMap.current[accountTreeData.accountId] = folderRef;
            }}
            data={accountTreeData.mailFolderTreeList}
            expandedKeys={folderId2String(accountTreeData.expandedKeys)}
            onExpand={(keys, { node, expanded }) => {
              // 记录星标联系人文件夹是否展开-现在只支持主账号，所以记录为单个值
              // if (node && (node?.mailBoxId == FLOLDER.STAR || folderIdIsContact(node?.mailBoxId))) {
              //   setStarFolderIsExpend(expanded);
              // }
              expandFolder(keys, accountTreeData.accountId);
            }}
            editAble
            dragModel={isDragModel ? 'drag' : 'move'}
            selectedKey={folderTreeDragModel || curTabIsReadTab ? null : isCurTree ? selectedKeys.id : null}
            isOuterDrag={!!isDragModel}
            menu={getFolderMenuRef}
            onAddFolder={(data: MailBoxModel, keyList: number[]) =>
              dispatch(
                Thunks.createUserFolder([
                  {
                    parent: data.entry.pid,
                    name: data.entry.mailBoxName,
                    accountId: data?._account,
                    // 用于排序的
                    _tempId: data?.entry?.mailBoxId,
                    sort: keyList,
                  },
                ])
              ).unwrap()
            }
            onUpdateFolder={(data: MailBoxModel) =>
              dispatch(
                Thunks.updateUserFolder([
                  {
                    id: data.entry.mailBoxId,
                    parent: data.entry.pid,
                    name: data.entry.mailBoxName,
                    accountId: data?._account,
                  },
                ])
              ).unwrap()
            }
            onDeleteFolder={handleDeleteFolderRef}
            onDrop={handleFolderDropRef}
            onOuterDrop={handleMailDropFolderRef}
            onNodeTitleClick={(folder: MailBoxModel) => {
              // 需求: 当再次点击选中的文件夹时，重置邮件列表筛选项
              if (folder?.mailBoxId == selectedKeys?.id) {
                setSelected('ALL');
              }
            }}
            onSelect={(folder: MailBoxModel) => {
              handleMultFolderSelectRef(folder, accountTreeData);
            }}
            operBtnRender={folderOperBtnRender}
            operBtnVisibility={folderOperBtnVisibility}
            allowDrop={folderAllowDrop}
            draggable={folderDragAble}
            unReadRender={renderUnread}
            outerAllowDrop={MainFolderTreeOuterDropRule(mailIsCurTree)}
          />
          <div
            data-test-id="mail-folder-add-btn"
            className="add-folder-wrap"
            onClick={() => {
              folderRefMap.current[accountTreeData.accountId]?.addFolder();
            }}
          >
            <div className="add-folder-icon" />
            <div className="add-folder-name">{getIn18Text('XINJIANWENJIANJIA')}</div>
          </div>
          {!mainMailHasCustomFolder ? (
            <div className="ct-folder-emptytip">
              {getIn18Text('ZIDINGYIZHUANSHU')}
              <div
                className="create-entry"
                onClick={() => {
                  folderRefMap.current[accountTreeData.accountId]?.addFolder();
                }}
              >
                {getIn18Text('XINJIANWENJIANJIA')}
              </div>
            </div>
          ) : (
            ''
          )}
          {!isCorpMail && <MailTag scrollController={treeContainerScrollController} activeName={tagName} disabled={isMailDraging} />}
        </>
      );
    },
    [folderTreeDragModel, curTabIsReadTab, isDragModel, selectedKeys, MainFolderTreeOuterDropRule, renderUnread, `${tagName?.key}${tagName?.accountId}`, isMailDraging]
  );

  // 渲染多账号，非搜索下的主账号文件夹树和标签
  const renderTreeDomNotMainAccount = useCallback(
    (accountTreeData: AccountTreeData) => {
      // 拖动的邮件是否属于当前邮件tree
      const mailIsCurTree = accountApi.getIsSameSubAccountSync(accountTreeData.accountId, folderTreeDragModel?.accountId);
      // 当前选中的目录是否属于当前tree
      const isCurTree = accountApi.getIsSameSubAccountSync(selectedKeys.accountId, accountTreeData?.accountId);

      // 如果失效则展示一个失效账号提示，UI待定
      if (accountTreeData.expired) {
        return (
          <div
            style={{
              lineHeight: '20px',
              fontSize: '12px',
              color: '#7d8085',
              paddingLeft: '30px',
            }}
          >
            账号失效，请
            <span onClick={() => revalidateAccount(accountTreeData)} style={{ color: '#5383fe', cursor: 'pointer' }}>
              重新验证
            </span>
          </div>
        );
      }
      return (
        <>
          <FolderTree
            ref={folderRef => {
              folderRefMap.current[accountTreeData.accountId] = folderRef;
            }}
            data={accountTreeData.mailFolderTreeList}
            expandedKeys={folderId2String(accountTreeData.expandedKeys)}
            onExpand={keys => {
              expandFolder(keys, accountTreeData.accountId);
            }}
            isMerge={false}
            editAble
            selectedKey={folderTreeDragModel || curTabIsReadTab ? null : isCurTree ? selectedKeys.id : null}
            dragModel={isDragModel ? 'drag' : 'move'}
            isOuterDrag={!!isDragModel}
            onSelect={(folder: MailBoxModel) => {
              handleMultFolderSelectRef(folder, accountTreeData);
            }}
            outerAllowDrop={MainFolderTreeOuterDropRule(mailIsCurTree)}
            menu={getFolderMenuRef}
            onAddFolder={(data: MailBoxModel, keyList: number[]) =>
              dispatch(
                Thunks.createUserFolder([
                  {
                    parent: data.entry.pid,
                    name: data.entry.mailBoxName,
                    accountId: data._account,
                    // 用于排序的
                    _tempId: data?.entry?.mailBoxId,
                    sort: keyList,
                  },
                ])
              ).unwrap()
            }
            onUpdateFolder={(data: MailBoxModel) =>
              dispatch(
                Thunks.updateUserFolder([
                  {
                    id: data.entry.mailBoxId,
                    parent: data.entry.pid,
                    name: data.entry.mailBoxName,
                    accountId: data._account,
                  },
                ])
              ).unwrap()
            }
            onDeleteFolder={handleDeleteFolderRef}
            onDrop={handleFolderDropRef}
            onOuterDrop={handleMailDropFolderRef}
            unReadRender={renderUnread}
          />
          <div
            className="add-folder-wrap"
            onClick={() => {
              folderRefMap.current[accountTreeData.accountId]?.addFolder();
            }}
          >
            <div className="add-folder-icon" />
            <div className="add-folder-name">{getIn18Text('XINJIANWENJIANJIA')}</div>
          </div>
          {!isCorpMail && <MailTag account={accountTreeData.accountId} scrollController={treeContainerScrollController} activeName={tagName} disabled={isMailDraging} />}
        </>
      );
    },
    [folderTreeDragModel, curTabIsReadTab, selectedKeys, isDragModel, MainFolderTreeOuterDropRule, renderUnread, `${tagName?.key}${tagName?.accountId}`]
  );

  // 渲染多账号，非搜索下的文件夹树和标签
  const renderTreeData = useMemo(() => {
    const dataList = maiTreeStateList.map((accountTreeData, idx) => {
      const { accountId, accountName, emailType, count, expired } = accountTreeData;
      return {
        key: accountId,
        title: accountName,
        // todo: 账号后的数量如何计算
        count: count > 999 ? '999+' : count + '',
        type: emailType,
        expired: expired || expiredAccountList.includes(accountId), // 账号本身失效或者在全局失效列表里面，则展示失效
        children: idx === 0 ? renderTreeMainAccount(accountTreeData) : renderTreeDomNotMainAccount(accountTreeData),
      };
    });
    return dataList;
  }, [maiTreeStateList, renderTreeMainAccount, renderTreeDomNotMainAccount]);

  /**
   * 渲染文件夹树
   */
  const renderTreeDomElement = useMemo(() => {
    return (
      <SiriusCollapse
        activeKey={activeKey}
        activeAccount={selectedKeys?.accountId}
        changeCb={keys => onMultAccountFolderExpand(keys)}
        dataList={renderTreeData}
        revalidateAccountFromPanel={revalidateAccountFromPanel}
        source="folder"
      />
    );
  }, [renderTreeData, activeKey, onMultAccountFolderExpand, selectedKeys?.accountId]);

  // #endregion

  /**
   * useEffect
   */
  // 检测更多文件夹下是否有文件夹
  useEffect(() => {
    // 获取主账号下的文件夹列表
    const mainMailFolderList = mailTreeStateMap.main?.mailFolderTreeList;
    if (mainMailFolderList && mainMailFolderList.length) {
      // > 99以上为自定义文件, 如果有自定义文件夹，则第一层级必然有至少1个
      const hasCtFolder = mainMailFolderList.some(folder => folder.entry.mailBoxId && isCustomFolder(folder.entry.mailBoxId));
      setMailMailHasCtFolder(hasCtFolder);
    }
  }, [mailTreeStateMap]);

  // 未读数发生变化的时候，更新二级tab中的数量
  useEffect(() => {
    if (mailUnReadSum != null) {
      dispatch(
        mailTabActions.doChangeTabById({
          id: '-1/-1',
          tabModel: {
            id: '-1/-1',
            extra: {
              unRead: mailUnReadSum,
            },
          },
        })
      );
    } else {
      dispatch(
        mailTabActions.doChangeTabById({
          id: '-1/-1',
          tabModel: {
            id: '-1/-1',
            extra: {
              unRead: 0,
            },
          },
        })
      );
    }
  }, [mailUnReadSum]);

  return (
    <div
      ref={treeContainerRef}
      className={maiTreeStateList.length > 1 ? 'add-pdl m-tree-container' : 'm-tree-container'}
      style={{ display: isSearching ? 'none' : 'block' }}
    >
      {renderTreeDomElement}
      {/* 重新验证多账号弹窗 */}
      <MultAccountsLoginModal visible={multAccountsLoginVisible} loginInfo={multAccountsLoginInfo} closeModel={closeMultAccountsModal} />
    </div>
  );
};

export default MailFolders;
