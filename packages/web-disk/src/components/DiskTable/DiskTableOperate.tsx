import React, { useEffect, useState } from 'react';
import { Dropdown, Tooltip, Menu } from 'antd';
import { NetStorageType, NSDirContent, NSFileContent, apiHolder, SystemApi, DataStoreApi, apis, DataTrackerApi } from 'api';
import lodashGet from 'lodash/get';
import { formatAuthority, formatAuthTexts, computeAuthWeight, checkActionAuth } from '../../utils';
import style from './index.module.scss';
import IconCard from '@web-common/components/UI/IconCard';
import PopItem from '../PopItem/popItem';
import { checkDiskGuideTipsPriority, DiskPage, DiskTipKeyEnum, RootInfo } from '../../disk';
import { DiskActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { UploadFileStatus } from '../../upload';
import { getIn18Text } from 'api';
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const dataStoreApi: DataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const eventApi = apiHolder.api.getEventApi();
// 是否可分享
// 公共文档不可分享
export const getShareAble = item => !item?.publicDoc && !!(item?.roleArr?.length > 0);
interface Props {
  item: NSDirContent | NSFileContent;
  showDel: (val: NSDirContent | NSFileContent) => void;
  downloadAction: (val) => void; // 点击下载
  showDetail: (val) => void; // 点击查看详情
  showShare: (val, tabKey?: string) => void;
  renameFile?: (val) => void; // 点击重命名
  renameFile1?: (val) => void;
  setRowHoverId?: (val) => void;
  currentPage?: DiskPage;
  openMoveModal(item: NSDirContent | NSFileContent): void; // 点击移动至
  type?: NetStorageType;
  sideTab?: string;
  rootInfo?: RootInfo;
  shareMode?: number; // 0 单独的icon展示 1 操作popOver里展示
  setOprActive?: (val) => void;
  menuVisChange?: (val: boolean) => void; // 菜单的显影发生变化
}
interface OperatePops {
  item: NSDirContent | NSFileContent;
  showDel: (val: NSDirContent | NSFileContent) => void;
  downloadAction: (val) => void; // 点击下载
  showDetail: (val) => void; // 点击查看详情
  showShare: (val, tabKey?: string) => void;
  renameFile?: (val) => void; // 点击重命名
  renameFile1?: (val) => void;
  openMoveModal(item: NSDirContent | NSFileContent): void; // 点击移动至
  type?: NetStorageType;
  sideTab?: string;
  rootInfo?: RootInfo;
  shareMode?: number; // 0 单独的icon展示 1 操作popOver里展示
  afterCkMenu?: () => void;
}
const getTrackerItemType = (item: NSDirContent | NSFileContent): string => {
  const isDir = item?.extensionType === 'dir';
  const fileType = (item as NSFileContent)?.fileType;
  const fileMap = {
    doc: 'doc',
    excel: 'sheet',
    file: 'file',
    unitable: 'unitable',
  };
  return isDir ? 'folder' : (fileType && fileMap[fileType]) || 'file';
};
// 更多操作弹窗主体(单独拆出方便使用)
export const MoreOprsCont = ({
  showDetail,
  renameFile,
  renameFile1,
  item,
  type,
  sideTab,
  downloadAction,
  openMoveModal,
  rootInfo,
  shareMode,
  showDel,
  showShare,
  afterCkMenu,
}: OperatePops) => {
  const [moveDirVisible, setMoveDirVisible] = useState(false);
  const [shareAble, setShareAble] = useState<boolean>(false);
  // 重命名
  const canRenameFile = checkActionAuth(item, 'rename');
  const hideRename = (type as NetStorageType) === 'personalShare' || sideTab === 'recently';
  // ---------------------------------------------------------------
  // 查看详情
  const canViewDetail = checkActionAuth(item, 'detail');
  // ---------------------------------------------------------------
  // 移除/删除
  let canDelete = false;
  const isShareOrRecentlyTab = ['share', 'recently'].includes(sideTab);
  const deleteText = isShareOrRecentlyTab ? getIn18Text('YICHU') : getIn18Text('SHANCHU');
  let hideDel = false;
  // 注意移除与删除的区别！
  switch (sideTab) {
    // 个人空间 都可删除
    case 'private':
      canDelete = true; // 都可删除
      break;
    // 企业空间，当拥有管理者权限，可删除，当没有权限，不可移除！
    case 'public': {
      const authText = formatAuthority(item?.roleArr || [], item?.extensionType);
      // !!权限控制条件判断是中文匹配，不要翻译
      if (authText?.includes('管理')) canDelete = true; // 管理权限，可删除
      break;
    }
    // 主页
    case 'recently': {
      canDelete = true; // 都可移除
      break;
    }
    // 与我分享
    case 'share': {
      // 与我分享 进入第二层（没有有resourceId）, 则不可移除, 并隐藏按钮
      if (!item.resourceId) {
        canDelete = false;
        hideDel = true;
      }
      // 第一层
      const roles = item?.roleArr || [];
      // 无权限也可移除
      if (roles.length >= 0) canDelete = true;
      break;
    }
    default:
      break;
  }
  // ---------------------------------------------------------------
  // 下载
  let canDownload = true;
  const hideDownload = ['excel', 'doc', 'unitable'].includes(item.fileType);
  if (type !== 'personal' || sideTab === 'recently') {
    const authText = formatAuthority(item.roleArr, item?.extensionType);
    // !!权限控制条件判断是中文匹配，不要翻译
    if (!authText?.includes('管理') && !authText?.includes('下载')) canDownload = false;
  }
  // ---------------------------------------------------------------
  // 移动至
  useEffect(() => {
    const itemAuthTexts = formatAuthTexts(lodashGet(item, 'roleArr', null));
    const itemWeights = computeAuthWeight(itemAuthTexts);
    // 最起码是管理权限
    setMoveDirVisible(itemWeights >= 3);
  }, []);
  // ---------------------------------------------------------------
  useEffect(() => {
    setShareAble(getShareAble(item));
  }, [item]);
  // 点击菜单
  const ckMenu = ckParam => {
    afterCkMenu && afterCkMenu();
    ckParam?.domEvent?.stopPropagation();
  };
  // 点击分享
  const ckShare = () => {
    eventApi.sendSysEvent({
      eventName: 'diskInnerCtc',
      eventStrData: '',
      eventData: { name: 'checkPrivilege' },
    });
    trackerApi.track('pc_disk_click_share');
    trackerApi.track('pc_disk_file_behavior', {
      opera_type: 'share',
      type: getTrackerItemType(item),
    });
    showShare(item, '1');
  };
  return (
    <Menu className={style.popContent} onClick={ckMenu}>
      <PopItem divider name={getIn18Text('FENXIANG')} testId="share" iconType="renameFile" disabled={!shareAble} hidden={shareMode !== 1} onClick={() => ckShare()} />
      <PopItem
        name={getIn18Text('ZHONGMINGMING')}
        iconType="renameFile"
        testId="rename"
        disabled={!canRenameFile}
        hidden={hideRename}
        style={{ marginTop: shareMode === 1 ? 4 : 0 }}
        onClick={() => {
          renameFile && renameFile(item);
          renameFile1 && renameFile1(true);
          trackerApi.track('pc_disk_file_behavior', {
            opera_type: 'rename',
            type: getTrackerItemType(item),
          });
        }}
      />
      <PopItem
        divider
        name={getIn18Text('YIDONGZHI')}
        iconType="moveTo"
        testId="move"
        disabled={
          ![
            () => moveDirVisible && rootInfo,
            () => {
              if (['private', 'public'].includes(sideTab) || item.bizCode !== 'PERSONAL') {
                return true;
              }
              const curUser = systemApi.getCurrentUser();
              const curId = lodashGet(curUser, 'contact.contact.id', '');
              return `${item.creatorId}` === `${curId}`;
            },
          ].every(call => call())
        }
        onClick={() => {
          openMoveModal(item);
        }}
      />
      <PopItem
        divider
        name={getIn18Text('XIAZAI')}
        iconType="doDownload"
        testId="download"
        disabled={!canDownload}
        style={{ marginTop: 4 }}
        hidden={hideDownload}
        onClick={() => {
          downloadAction(item);
        }}
      />
      <PopItem
        divider={!hideDel}
        disabled={!canViewDetail}
        name={getIn18Text('XIANGXIXINXI')}
        style={{ marginTop: hideRename && hideDownload && !moveDirVisible ? 0 : 4 }}
        iconType="info"
        testId="info"
        onClick={() => {
          showDetail(item);
          trackerApi.track('pc_disk_file_behavior', {
            opera_type: 'info',
            type: getTrackerItemType(item),
          });
        }}
      />
      {/* 删除 移除 */}
      <PopItem
        name={deleteText}
        style={{ marginTop: 4 }}
        hidden={hideDel}
        iconType="recycleBin"
        testId="remove"
        disabled={!canDelete}
        onClick={() => {
          showDel(item);
          if (!isShareOrRecentlyTab) {
            trackerApi.track('pc_disk_file_behavior', {
              opera_type: 'delete',
              type: getTrackerItemType(item),
            });
          }
        }}
      />
    </Menu>
  );
};
// 列表项操作集合
const DiskTableOperate: React.FC<Props> = props => {
  const { item, showShare, currentPage, setRowHoverId, shareMode = 0, setOprActive, menuVisChange } = props;
  const guideTipsInfo = useAppSelector(state => state.diskReducer.guideTipsInfo);
  const curUploadFileItems = useAppSelector(state => state.diskReducer.curUploadFileItems);
  const curSideTab = useAppSelector(state => state.diskReducer.curSideTab);
  const dispatch = useAppDispatch();
  // 是否可分享
  const [shareAble, setShareAble] = useState<boolean>(false);
  // 更多操作是否被激活
  const [moreOptActive, setMoreOptActive] = useState<boolean>(false);
  // 是否展示新增外部分享功能tip
  const [addOutShareTipVisible, setAddOutShareTipVisible] = useState<boolean>(false);
  useEffect(() => {
    setShareAble(getShareAble(item));
  }, [item]);
  const isShowTipItem = !!item && !!item.externalShareTipVisible;
  const isMainPage = curSideTab === 'recently' && currentPage === 'index';
  const needCheckTipShow = isShowTipItem && isMainPage;
  useEffect(() => {
    // 何时展示tip: welcomeTip 展示完成后, 在主页中, 若之前未曾展示过, 进入云文档时, 没有上传中的文件, 列表中有文件, 展示分享提示.
    if (!needCheckTipShow) return;
    const isShareTipShowed = guideTipsInfo[DiskTipKeyEnum.EXTERNAL_SHARE_TIP].showed;
    const isUploading = curUploadFileItems.findIndex(fileItem => fileItem.status === UploadFileStatus.UPLOADING) !== -1;
    const isCurPriority = checkDiskGuideTipsPriority(guideTipsInfo, DiskTipKeyEnum.EXTERNAL_SHARE_TIP);
    const visible = !isShareTipShowed && !isUploading && isCurPriority;
    setAddOutShareTipVisible(visible);
  }, [guideTipsInfo, currentPage, item, curUploadFileItems]);
  useEffect(() => {
    dispatch(
      DiskActions.setGuideTipsInfoByKey({
        key: DiskTipKeyEnum.EXTERNAL_SHARE_TIP,
        value: {
          ...guideTipsInfo[DiskTipKeyEnum.EXTERNAL_SHARE_TIP],
          visiable: addOutShareTipVisible,
        },
      })
    );
  }, [addOutShareTipVisible]);
  const closeShareTip = () => {
    setAddOutShareTipVisible(false);
    dataStoreApi.put(DiskTipKeyEnum.EXTERNAL_SHARE_TIP, 'true');
    dispatch(
      DiskActions.setGuideTipsInfoByKey({
        key: DiskTipKeyEnum.EXTERNAL_SHARE_TIP,
        value: {
          ...guideTipsInfo[DiskTipKeyEnum.EXTERNAL_SHARE_TIP],
          showed: true,
          visiable: false,
        },
      })
    );
  };
  const createTipDiv = (
    <div>
      <span className={style.tip}>{getIn18Text('KEYIJIANGWENJIAN')}</span>
      <span
        onClick={() => {
          closeShareTip();
          showShare(item, '2');
        }}
        className={style.confirm}
      >
        {getIn18Text('QUSHISHI')}
      </span>
    </div>
  );
  // 点击分享按钮
  const ckShareIcon = () => {
    // 每次点击，都检查权限
    eventApi.sendSysEvent({
      eventName: 'diskInnerCtc',
      eventStrData: '',
      eventData: { name: 'checkPrivilege' },
    });
    closeShareTip();
    trackerApi.track('pc_disk_click_share');
    trackerApi.track('pc_disk_file_behavior', {
      opera_type: 'share',
      type: getTrackerItemType(item),
    });
    showShare(item, '1');
  };
  const onVisibleChange = (visible: boolean) => {
    setMoreOptActive(visible);
    setRowHoverId && setRowHoverId(visible ? item.id : '');
    menuVisChange && menuVisChange(visible);
  };
  const afterCkMenu = () => {
    setMoreOptActive(false);
    setRowHoverId && setRowHoverId('');
    menuVisChange && menuVisChange(false);
  };
  useEffect(() => {
    setOprActive && setOprActive(moreOptActive);
  }, [moreOptActive]);
  // 分享icon
  const shareIcon = (
    <div className="opeItem dark-invert" style={{ marginRight: '8px' }} data-test-id="disk_table_share_btn" onClick={ckShareIcon}>
      <IconCard type="share" stroke="rgba(60, 63, 71, .5)" />
    </div>
  );
  // 更多操作选项
  const moreOperates = (
    <Dropdown overlay={MoreOprsCont({ ...props, afterCkMenu })} placement="bottomRight" trigger={['click']} onVisibleChange={onVisibleChange}>
      <div className={`opeItem dark-invert ${moreOptActive ? 'active' : ''}`}>
        <IconCard type="more" stroke="#262A33" fillOpacity={0.5} />
      </div>
    </Dropdown>
  );
  const operates = (
    <div className={style.operate}>
      {shareMode === 0 && shareAble ? shareIcon : ''}
      {moreOperates}
    </div>
  );
  return (
    <>
      {addOutShareTipVisible && needCheckTipShow ? (
        <Tooltip
          visible={addOutShareTipVisible && shareMode === 0 && shareAble}
          overlayClassName={style.diskExternalShareTooltip}
          placement="bottomRight"
          title={createTipDiv}
          getPopupContainer={node => node}
        >
          {operates}
        </Tooltip>
      ) : (
        operates
      )}
    </>
  );
};
export default DiskTableOperate;
