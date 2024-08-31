import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Dropdown, Input, Tree } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder as api, apiHolder, apis, DataTrackerApi, NetStorageApi, NSDirContent, ProductAuthorityFeature } from 'api';
import IconCard from '@web-common/components/UI/IconCard/index';
import { DiskTab, tabInterfaceMap, trackTypeMap } from '../../disk';
import styles from './diskTree.module.scss';
import { DiskActions } from '@web-common/state/reducer';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import DiskTableOperate, { MoreOprsCont } from './../DiskTable/DiskTableOperate';
import Detail from './../Detail';
import { ShareModal } from './../SharePage/sharePage';
import { MoveDirModal } from './../MoveDir';
import { getIfHaveAuth } from '@web-common/utils/utils';
import Delete from './../Delete';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import { getIn18Text } from 'api';
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const trackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const eventApi = api.api.getEventApi();
interface ExtendNSDirContent extends NSDirContent {
  sideTab: DiskTab;
}
interface DataNode {
  title: string;
  key: number; // tree 节点需要的唯一标识
  sideTab: DiskTab;
  className?: string;
  icon?: any;
  isLeaf?: boolean;
  children?: DataNode[];
  detail?: ExtendNSDirContent; // 后端返回的原始内容
  root?: boolean; // 是否为根节点
  hid?: boolean;
}
//  -2 和 -3 是假的 临时占位
const privateTreeData: DataNode = {
  title: getIn18Text('GERENKONGJIAN'),
  key: -2,
  sideTab: 'private',
  icon: () => <IconCard type="privateDisk" />,
  isLeaf: false,
  root: true,
  hid: true,
};
const publicTreeData: DataNode = {
  title: getIn18Text('QIYEKONGJIAN'),
  key: -3,
  sideTab: 'public',
  icon: () => <IconCard type="publicDisk" />,
  isLeaf: false,
  root: true,
  hid: true,
};
// 云附件
const cloudAttTreeData: DataNode = {
  title: getIn18Text('YOUJIANYUNFUJIAN'),
  key: -4,
  className: styles.cloudAtt,
  sideTab: 'cloudAtt' as DiskTab,
  icon: <IconCard type="inbox" />,
  isLeaf: true,
};
// 往来附件
const normalAttTreeData: DataNode = {
  title: getIn18Text('YOUJIANWANGLAIFU'),
  key: -5,
  className: styles.normalAtt,
  sideTab: 'normalAtt',
  icon: <IconCard type="mailExchange" />,
  isLeaf: true,
};
// 回收站
const recycleTreeDate: DataNode = {
  title: getIn18Text('HUISHOUZHAN'),
  key: -6,
  sideTab: 'recycle',
  icon: <IconCard type="recycleBin" stroke="#7D8085" />,
  isLeaf: true,
};
// 初始数据
let initialTreeData: DataNode[] = [
  {
    title: getIn18Text('ZHUYE'),
    key: -7,
    sideTab: 'recently',
    icon: <IconCard type="homepage" />,
    isLeaf: true,
  },
  privateTreeData,
  publicTreeData,
  {
    // 与我分享 我分享的/分享给我的 根目录id都是0 !
    title: getIn18Text('YUWOFENXIANG'),
    key: 0,
    sideTab: 'share',
    icon: <IconCard type="sharePage" />,
    isLeaf: true,
  },
  {
    title: getIn18Text('SHOUCANG'),
    key: -8,
    sideTab: 'favorites',
    icon: <IconCard type="starGray" />,
    isLeaf: true,
  },
  normalAttTreeData,
  recycleTreeDate,
];

interface TitleRenderProps {
  node: DataNode;
  updateTreeData: any;
  setCurOprItem: any;
  setDetailVis: any;
  setTabKey: any;
  setShareVis: any;
  setMoveVis: any;
  setMoveTarget: any;
  downloadAction: any;
  showDel: any;
}
interface DiskTreeProps {
  setSideTab: (val) => void;
  downloadAction: (item, spaceId) => void;
}
// 树节点内容
const TitleRender: React.FC<TitleRenderProps> = titleRenderProps => {
  const curRootInfo = useAppSelector(state => state.diskReducer.curRootInfo);
  const curSideTab = useAppSelector(state => state.diskReducer.curSideTab);
  const [editting, setEditting] = useState<boolean>(false); // 编辑中
  const [oprActive, setOprActive] = useState<boolean>(false); // 操作栏被打开
  const [mouseIn, setMouseIn] = useState<boolean>(false); // 鼠标进入
  const [rcMenuVis, setRcMenuVis] = useState<boolean>(false); // 邮件菜单显影
  const [optMenuVis, setOptMenuVis] = useState<boolean>(false); // 操作菜单显影
  const { node: folderItem, updateTreeData, setCurOprItem, setDetailVis, setTabKey, setShareVis, setMoveVis, setMoveTarget, downloadAction, showDel } = titleRenderProps;
  const inputRef = useRef(null);
  const nodeContRef = useRef(null);
  // 当鼠标在其中 或 操作栏被打开 或 正在编辑中
  const showOprsIcon = useMemo(() => mouseIn || oprActive || editting, [mouseIn, oprActive, editting]);
  // 菜单显影
  const menuVis = useMemo(() => rcMenuVis || optMenuVis, [rcMenuVis, optMenuVis]);
  // 校验重命名
  const checkRenameFolder = (newName: string) =>
    new Promise(resolve => {
      // 值为空或没变
      if (!newName.length || folderItem.title === newName) {
        setEditting(false);
        resolve(false);
      }
      // 超过30个字符
      if (newName.length > 30) {
        Toast.warn({ content: getIn18Text('WENJIANMINGCHENGCHANG') });
        resolve(false);
      }
      resolve(true);
    });
  // 重命名文件夹后
  const afterRenameFolder = (targetId, targetParentId, newName) => {
    updateTreeData(targetId, 1);
    eventApi.sendSysEvent({
      eventName: 'diskInnerCtc',
      eventStrData: '',
      eventData: {
        name: 'renameDir',
        id: targetId,
        newName,
      },
    });
  };
  // 重命名文件夹
  const renameFolder = async e => {
    const newName = (e?.currentTarget?.value || '').trim();
    const checkRes = await checkRenameFolder(newName);
    // 校验不通过
    if (!checkRes) return;
    const param = {
      type: tabInterfaceMap[folderItem.sideTab],
      dirId: folderItem.key,
      itemName: newName,
    };
    try {
      const renameRes = await diskApi.renameNSFile(param);
      // 这块api层可能有问题
      if (renameRes) {
        const folderInfoRes = await diskApi.doGetNSFolderInfo(param);
        if (folderInfoRes) {
          afterRenameFolder(folderItem.key, folderItem.detail?.parentId, folderInfoRes.name);
          setEditting(false);
        }
      }
    } catch (err) {
      console.log(getIn18Text('ZHONGMINGMINGSHIBAI'), err);
      setEditting(false);
    }
  };
  // 取消输入
  const cancelInput = e => {
    e.stopPropagation();
    setEditting(false);
  };
  // 查看详情
  const showDetail = (item: NSDirContent) => {
    setCurOprItem(item);
    setDetailVis(true);
  };
  // 分享
  const showSharePage = (item, key) => {
    trackerApi.track(`pc_disk_click_share_${trackTypeMap[curSideTab || '']}`);
    setCurOprItem(item);
    setTabKey(key);
    setShareVis(true);
  };
  // 移动文件夹窗口
  const openMoveModal = (item: NSDirContent) => {
    setMoveVis(true);
    setMoveTarget(item);
  };
  // 下载
  const folderDownloadAction = async (item: NSDirContent) => {
    trackerApi.track(`pc_disk_click_download_${trackTypeMap[folderItem.sideTab]}`);
    const folderDetail = await diskApi.doGetNSFolderInfo({ type: tabInterfaceMap[folderItem.sideTab], dirId: item.id, spaceId: item.id });
    const { totalSize } = folderDetail;
    downloadAction({ ...item, totalSize }, null);
  };
  useEffect(() => {
    const { current } = inputRef;
    if (current && editting) {
      (current as HTMLInputElement).focus();
      (current as HTMLInputElement).setSelectionRange(0, folderItem.title.length);
    }
  }, [editting]);
  useEffect(() => {
    // 树节点最深处
    if (!nodeContRef?.current?.parentNode?.parentNode?.parentNode?.className) return;
    if (menuVis) {
      nodeContRef.current.parentNode.parentNode.parentNode.className += ' gray';
    } else {
      nodeContRef.current.parentNode.parentNode.parentNode.className = nodeContRef.current.parentNode.parentNode.parentNode.className.replace('gray', '');
    }
  }, [menuVis]);
  const suffix = (
    <span className={styles.cancel} onClick={cancelInput}>
      {getIn18Text('QUXIAO')}
    </span>
  );
  const params = {
    item: { ...folderItem.detail },
    downloadAction: item => folderDownloadAction(item),
    openMoveModal,
    showDetail: item => showDetail(item),
    renameFile1: setEditting,
    showShare: (item, key) => showSharePage(item, key),
    showDel,
    type: tabInterfaceMap[folderItem.sideTab],
    sideTab: folderItem.sideTab,
    rootInfo: curRootInfo,
    shareMode: 1,
  };
  const mouseEnter = () => setMouseIn(true);
  const mouseLeave = () => setMouseIn(false);
  // 点击右键菜单后
  const afterCkRcMenu = () => {
    setRcMenuVis(false);
  };
  // 右键菜单的显影改变
  const rcMenuVisChange = (vis: boolean) => {
    setRcMenuVis(vis);
  };
  // 选择菜单的显影
  const optsMenuVisChange = (vis: boolean) => {
    setOptMenuVis(vis);
  };
  return (
    <>
      {
        // 子节点
        folderItem.detail ? (
          <Dropdown overlay={MoreOprsCont({ ...{ ...params, afterCkMenu: afterCkRcMenu } })} trigger={['contextMenu']} onVisibleChange={rcMenuVisChange}>
            <div ref={nodeContRef} className={styles.nodeContent} onMouseEnter={mouseEnter} onMouseLeave={mouseLeave}>
              {!editting ? (
                <span className={styles.folderTitle}>
                  <span>{folderItem.title}</span>
                </span>
              ) : (
                <Input
                  ref={inputRef}
                  defaultValue={folderItem.title}
                  className={styles.inputFolderTitle}
                  suffix={suffix}
                  onPressEnter={e => renameFolder(e)}
                  onBlur={e => renameFolder(e)}
                  onClick={e => e.stopPropagation()}
                />
              )}
              <div hidden={!showOprsIcon} onClick={e => e.stopPropagation()}>
                <DiskTableOperate
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...{ ...params, menuVisChange: optsMenuVisChange }}
                  setOprActive={setOprActive}
                  setCurOprItem={setCurOprItem}
                />
              </div>
            </div>
          </Dropdown>
        ) : (
          //  根节点
          <div className={styles.nodeContent}>
            <span className={styles.folderTitle}>{folderItem.title}</span>
          </div>
        )
      }
    </>
  );
};
// 目录树
const diskTree: React.FC<DiskTreeProps> = props => {
  const curRootInfo = useAppSelector(state => state.diskReducer.curRootInfo);
  const curSideTab = useAppSelector(state => state.diskReducer.curSideTab);
  const curDirId = useAppSelector(state => state.diskReducer.curDirId);
  const curSpaceState = useAppSelector(state => state.diskReducer.curSpaceState);
  const diskPsR = useAppSelector(state => state.diskReducer.diskPsR);
  const [diskTreeData, setDiskTreeData] = useState<any>(initialTreeData);
  const diskTreeDataRef = useRef<any>(diskTreeData);
  diskTreeDataRef.current = diskTreeData;
  const [selectedIds, setSelectedIds] = useState<number[]>([-7]); // 默认主页被选中
  const dispatch = useAppDispatch();
  const { setSideTab, downloadAction } = props;
  // diskTableOperate 相关
  const [curOprItem, setCurOprItem] = useState<NSDirContent>();
  const [detailVis, setDetailVis] = useState<boolean>(false);
  const [shareVis, setShareVis] = useState<boolean>(false);
  const [tabKey, setTabKey] = useState<string>('1');
  const [moveVis, setMoveVis] = useState<boolean>(false);
  const [moveTarget, setMoveTarget] = useState<NSDirContent>();
  const [delVis, setDelVis] = useState<boolean>(false);
  const [delItem, setDelItem] = useState<ExtendNSDirContent>();
  const filtereDiskTreeData = useMemo(() => diskTreeData.filter((item: any) => !item.hid), [diskTreeData]);
  // 获取当前节点下的目录
  const getCatalogues = async (parentDirId: number, sideTab: DiskTab) => {
    const params = {
      type: tabInterfaceMap[sideTab],
      parentDirId,
      sort: 'letter',
    };
    try {
      const res = await diskApi.listDir(params);
      if (res?.list) {
        // 整合
        res.list = (res.list || []).map(item => ({ ...item, extensionType: 'dir' }));
      }
      return res;
    } catch (e) {
      console.log(getIn18Text('HUOQUZIMULU'), e);
    }
  };
  // 更新树的节点(更新父节点的子节点)
  const updateTreeData = async (targetKey: React.Key, mode = 0) => {
    // 有没有找到目标
    let finded: boolean = false;
    // 将返回的列表项转换为节点
    const translItemToNode = (item, parentSideTab) => {
      const { id, name, hasSub } = item;
      return {
        key: id,
        title: name,
        isLeaf: !hasSub,
        sideTab: parentSideTab,
        detail: JSON.parse(JSON.stringify({ ...item, sideTab: parentSideTab })),
      };
    };
    // 将旧children的必要的值留给新children
    const leaveNecValsToNew = (olds, news) =>
      news.map(newNode => {
        const { key } = newNode;
        const oldIndex = olds.findIndex(old => old.key === key);
        // 全新的children
        if (oldIndex === -1) {
          return newNode;
        }
        // 目前有价值的只有children
        // 就算有children也不要了
        if (newNode.isLeaf) {
          return newNode;
        }
        const oldChildren = olds[oldIndex]?.children;
        // 旧值留下的chldren无用
        if (!oldChildren || oldChildren?.length === 0) {
          return newNode;
        }
        // 旧值已获取的children保留
        return {
          ...newNode,
          children: oldChildren,
        };
      });
    // 更新找到的节点
    const updateFindedNode = async item => {
      const { key, sideTab } = item;
      try {
        const res = await getCatalogues(key, sideTab);
        if (!res) return item;
        const { count, list } = res;
        // 没有返回children
        if (!count || count < 1) {
          delete item.children;
          // 根节点isLeaf永远为false,永远可展开
          if (item.root !== true) {
            item.isLeaf = true;
          }
          return item;
        }
        const oldChildren = item.children;
        const newChildren = list.map(li => translItemToNode(li, sideTab));
        // 原先没有children
        if (!oldChildren || oldChildren.length === 0) {
          return {
            ...item,
            isLeaf: false,
            children: newChildren,
          };
        }
        // 原先有children
        return {
          ...item,
          isLeaf: false,
          children: leaveNecValsToNew(oldChildren, newChildren),
        };
      } catch (e) {
        console.log(getIn18Text('HUOQUZIWENJIAN'), e);
        return item;
      }
    };
    // 遍历
    const loop = (nodes: DataNode[]) =>
      Promise.all(
        nodes.map(async item => {
          const { key, children } = item;
          // 传入子节点 找到了
          if (mode === 1 && (children || []).find(chid => chid.key === targetKey)) {
            finded = true;
            const newNode = await updateFindedNode(item);
            return newNode;
          }
          // 传入父节点 找到了
          if (mode === 0 && key === targetKey) {
            finded = true;
            const newNode = await updateFindedNode(item);
            return newNode;
          }
          // 没有children或者已经找到啦
          if (!children || finded) {
            return item;
          }
          return { ...item, children: await loop(children) };
        })
      );
    try {
      const newTreeData = await loop(diskTreeDataRef.current);
      setDiskTreeData(newTreeData);
    } catch (e) {
      console.log(getIn18Text('GENGXINJIEDIANSHI'), e);
    }
  };
  const onLoad = async () => {
    console.log('onLoad');
  };
  // 展开
  const onExpand = (selectedKeys, { expanded, node }) => {
    // 收起
    if (!expanded) return;
    // 展开
    const { sideTab, key } = node;
    // 个人空间
    if (sideTab === 'private') {
      const { private: curState } = curSpaceState;
      if (curState === 'uninitial') return;
      if (curState === 'noOpen') {
        message.error({ content: getIn18Text('WUFADAKAI\uFF0C11') });
        return;
      }
      if (curState === 'locked') {
        message.error({ content: getIn18Text('WUFADAKAI\uFF0C12') });
        return;
      }
      if (curState === 'normal') {
        // 更新子文件夹
        updateTreeData(key);
      }
    }
    // 企业空间
    if (sideTab === 'public') {
      const { public: curState } = curSpaceState;
      if (curState === 'uninitial') return;
      if (curState === 'noOpen') {
        message.error({ content: getIn18Text('WUFADAKAI\uFF0C') });
        return;
      }
      if (curState === 'normal') {
        // 更新子文件夹
        updateTreeData(key);
      }
    }
  };
  // 点击节点（快速点击是否会出错..）
  const onSelect = (_: unknown, { node }) => {
    const { key, sideTab, detail } = node;
    trackerApi.track(`pc_disk_view_${trackTypeMap[sideTab]}_homepage`);
    // 个人空间
    if (sideTab === 'private') {
      const { private: curState } = curSpaceState;
      if (curState === 'uninitial') return;
      // 未开通
      if (curState === 'noOpen') {
        setSideTab(sideTab);
        dispatch(DiskActions.setCurDirId(null));
      }
      // 已锁
      if (curState === 'locked') {
        setSideTab(sideTab);
        dispatch(DiskActions.setCurDirId(null));
      }
      // 正常
      if (curState === 'normal') {
        setSideTab(sideTab);
        // 更新自己（通过更新父文件夹）
        // 根目录没有detail
        detail && updateTreeData(detail.parentDirId);
        key && key > 0 && dispatch(DiskActions.setCurDirId(key));
      }
      return;
    }
    // 企业空间
    if (sideTab === 'public') {
      const { public: curState } = curSpaceState;
      if (curState === 'uninitial') return;
      // 未开通
      if (curState === 'noOpen') {
        setSideTab(sideTab);
        dispatch(DiskActions.setCurDirId(null));
      }
      // 正常
      if (curState === 'normal') {
        setSideTab(sideTab);
        // 更新自己（通过更新父文件夹）
        // 根目录没有detail
        detail && updateTreeData(detail.parentDirId);
        key && key > 0 && dispatch(DiskActions.setCurDirId(key));
      }
      return;
    }
    // 其他
    setSideTab(sideTab);
    dispatch(DiskActions.setCurDirId(key));
  };
  // 移动后
  // 被移动文件夹 目标文件夹 被移动文件夹的的父级
  const afterMove = async (from, to, fromParent) => {
    // 更新来源的父文件夹
    await updateTreeData(fromParent);
    // 更新目标
    await updateTreeData(to);
    eventApi.sendSysEvent({
      eventName: 'diskInnerCtc',
      eventStrData: '',
      eventData: {
        name: 'moveDir',
        from,
        to,
        fromParent,
      },
    });
  };
  // 展示删除弹窗
  const showDel = (item: ExtendNSDirContent) => {
    setDelItem(item);
    setDelVis(true);
  };
  // 确认删除后
  const afterDelFolder = targetKey => {
    const loop = (nodes: DataNode[]) =>
      nodes
        .map(item => {
          const { key, children } = item;
          if (key === targetKey) {
            return null;
          }
          return children ? { ...item, children: loop(children) } : item;
        })
        .filter(item => !!item);
    setDiskTreeData(loop(diskTreeData));
    eventApi.sendSysEvent({
      eventName: 'diskInnerCtc',
      eventStrData: '',
      eventData: {
        name: 'delDir',
        id: targetKey,
      },
    });
  };
  useEffect(() => {
    const tmp = [...diskTreeData];
    const privateRootId = curRootInfo?.private?.dirId || -2;
    const publicRootId = curRootInfo?.public?.dirId || -3;
    // 个人空间
    if (!diskPsR.private.includes('USE')) {
      tmp.splice(1, 1, { ...tmp[1], key: privateRootId, hid: true });
    } else {
      tmp.splice(1, 1, { ...tmp[1], key: privateRootId, hid: false });
    }
    if (!diskPsR.public.includes('USE')) {
      tmp.splice(2, 1, { ...tmp[2], key: publicRootId, hid: true });
    } else {
      tmp.splice(2, 1, { ...tmp[2], key: publicRootId, hid: false });
    }
    setDiskTreeData(tmp);
  }, [diskPsR, curRootInfo]);
  useEffect(() => {
    setSelectedIds([curDirId as number]);
  }, [curDirId]);
  useEffect(() => {
    if (getIfHaveAuth(ProductAuthorityFeature.ORG_SETTING_BIG_ATTACH_SHOW)) {
      if (!diskTreeData.find(item => item.key === -4)) {
        const tmp = [...diskTreeData];
        tmp.splice(tmp.length - 2, 0, cloudAttTreeData);
        setDiskTreeData(tmp);
      }
    }
  }, []);
  useMsgRenderCallback('diskInnerCtc', async data => {
    const { eventData } = data;
    const { name } = eventData;
    // 删除文件夹
    if (name === 'delDir1') {
      const { id } = eventData;
      updateTreeData(id, 1);
    }
    // 重命名文件夹
    if (name === 'renameDir1') {
      const { id } = eventData;
      updateTreeData(id, 1);
    }
    // 移动文件夹
    if (name === 'moveDir1') {
      const { from, to } = eventData;
      updateTreeData(from, 1);
      updateTreeData(to);
    }
  });
  // 函数中转
  const TmpTitleRender = node => (
    <TitleRender
      node={node}
      updateTreeData={updateTreeData}
      setCurOprItem={setCurOprItem}
      setDetailVis={setDetailVis}
      setTabKey={setTabKey}
      setShareVis={setShareVis}
      setMoveVis={setMoveVis}
      setMoveTarget={setMoveTarget}
      downloadAction={downloadAction}
      showDel={showDel}
    />
  );
  return (
    <div className={styles.diskTree}>
      <Tree
        showIcon
        blockNode
        treeData={filtereDiskTreeData}
        loadData={onLoad}
        onExpand={onExpand}
        onSelect={onSelect}
        titleRender={TmpTitleRender}
        selectedKeys={selectedIds}
      />
      {/* 详情 */}
      <Detail itemOrg={curOprItem} type={curOprItem?.sideTab} isModalVisible={detailVis} setVisible={setDetailVis} />
      {/* 分享弹窗 */}
      <ShareModal item={curOprItem} defaultTabKey={tabKey} sideTab={curSideTab} visible={shareVis} hideSharePage={() => setShareVis(false)} />
      {/* 移动文件夹弹窗 */}
      {moveVis && (
        <MoveDirModal
          rootInfo={curRootInfo}
          closeModal={() => setMoveVis(false)}
          moveSucc={(from, to, fromParent) => afterMove(from, to, fromParent)}
          sourceNsContent={moveTarget}
          visible={moveVis}
        />
      )}
      {delItem && delVis && (
        <Delete
          isModalVisible={delVis}
          dataFromOperate={{ setDeleteVisible: setDelVis, item: delItem }}
          handleOk={afterDelFolder}
          type={tabInterfaceMap[delItem.sideTab]}
          sideTab={delItem.sideTab}
        />
      )}
    </div>
  );
};
export default diskTree;
