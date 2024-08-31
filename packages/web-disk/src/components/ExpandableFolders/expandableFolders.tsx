import React, { useState, useEffect } from 'react';
import { apiHolder as api, NetStorageType, NSDirContent } from 'api';
import styles from './expandableFolders.module.scss';
import Folder from './folder';
import IconCard from '@web-common/components/UI/IconCard';
import { useAppSelector } from '@web-common/state/createStore';
import Detail from './../Detail';
import { ShareModal } from './../SharePage/sharePage';
import { tabInterfaceMap } from './../../disk';
import { MoveDirModal } from './../MoveDir';
import Delete from '../Delete';
import FolderSkeleton from './folderSkeleton';
import { getIn18Text } from 'api';
const eventApi = api.api.getEventApi();
// 可展开文件夹
interface ExpanableFoldersProps {
  folders: NSDirContent[];
  folderCount: number;
  loading?: boolean;
  downloadAction: (item, spaceId) => void;
  forceRefresh: () => void;
  type?: NetStorageType;
  afterRenameFolder: (id: number, newName: string, updateTime, parentId) => void;
  afterDelFolder: (id: number) => void;
  expanded: boolean;
  expandFolder: (val: boolean) => void;
  collectAction: (params: { id: number; collect: boolean; type: 'folder' | 'file' }) => void;
}
// 展开收起按钮
interface ExpandAndCollapseProps {
  expanded: boolean;
  expandFolder: Function;
  totalNum: number;
}
const ExpandAndCollapse: React.FC<ExpandAndCollapseProps> = ({ expanded, expandFolder, totalNum }) => {
  // 展开/收起
  const expandAndCollapse = () => expandFolder(!expanded);
  const ExpandButton = () => (
    <div className={styles.expandButton} onClick={expandAndCollapse}>
      <IconCard type={expanded ? 'collapse' : 'expand'} />
      <span className={styles.actIntro}>{expanded ? getIn18Text('SHOUQI') : `展开全部${totalNum}个文件夹`}</span>
    </div>
  );
  return (
    <>
      {expanded ? (
        <ExpandButton />
      ) : (
        <div className={styles.expandContainer}>
          <ExpandButton />
          {Array(10)
            .fill(null)
            .map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={`p${index}`} className={styles.placeholder} />
            ))}
        </div>
      )}
    </>
  );
};
// 可展开文件夹
const ExpanableFolders: React.FC<ExpanableFoldersProps> = (props: ExpanableFoldersProps) => {
  const curContWidth = useAppSelector(state => state.diskReducer.curContWidth);
  const curRootInfo = useAppSelector(state => state.diskReducer.curRootInfo);
  const curSideTab = useAppSelector(state => state.diskReducer.curSideTab);
  const curDirId = useAppSelector(state => state.diskReducer.curDirId);
  const [expandAndCollapseVis, setExpandAndCollapseVis] = useState<boolean>(false);
  // diskTableOperate 相关
  const [curOprItem, setCurOprItem] = useState<NSDirContent>();
  const [detailVis, setDetailVis] = useState<boolean>(false);
  const [shareVis, setShareVis] = useState<boolean>(false);
  const [tabKey, setTabKey] = useState<string>('1');
  const [moveVis, setMoveVis] = useState<boolean>(false);
  const [moveTarget, setMoveTarget] = useState<NSDirContent>();
  const [delVis, setDelVis] = useState<boolean>(false);
  const [delItem, setDelItem] = useState<NSDirContent>();
  const { folders, folderCount, loading = false, downloadAction, type, forceRefresh, afterRenameFolder, afterDelFolder, expanded, expandFolder, collectAction } = props;
  // 重排列后
  const afterRecomposit = () => {
    const foldersEle = document.getElementById('folders');
    const firFolder = document.getElementById('folder0');
    if (!foldersEle || !firFolder) {
      setExpandAndCollapseVis(false);
      return;
    }
    // 内容超过4行
    if (foldersEle.clientHeight > 256) {
      // 每行多少个
      // const everyRowNum = Math.floor(foldersEle.clientWidth / firFolder.clientWidth);
      setExpandAndCollapseVis(true);
      return;
    }
    setExpandAndCollapseVis(false);
  };
  // 移动文件夹后
  const afterMoveFolder = (from, to, fromParent) => {
    forceRefresh();
    eventApi.sendSysEvent({
      eventName: 'diskInnerCtc',
      eventStrData: '',
      eventData: {
        name: 'moveDir1',
        from,
        to,
        fromParent,
      },
    });
  };
  const showDel = (item: NSDirContent) => {
    setDelItem(item);
    setDelVis(true);
  };
  // 切换文件夹 展开复原
  useEffect(() => {
    expandFolder(false);
  }, [curDirId]);
  // 当可用宽度与文件夹数量发生变化时触发重排列，这时判断展开/收起按钮是否展示
  useEffect(() => {
    afterRecomposit();
  }, [curContWidth, folders.length]);
  const FolderItem = (item: NSDirContent, index: number) => (
    <Folder
      key={item.id}
      index={index}
      folderItem={item}
      setCurOprItem={setCurOprItem}
      setDetailVis={setDetailVis}
      setTabKey={setTabKey}
      setShareVis={setShareVis}
      setMoveVis={setMoveVis}
      setMoveTarget={setMoveTarget}
      downloadAction={downloadAction}
      afterRenameFolder={afterRenameFolder}
      type={type}
      collectAction={collectAction}
      showDel={showDel}
    />
  );
  return (
    <>
      {loading && folders?.length === 0 && (
        // 骨架屏4行
        <FolderSkeleton height={244} />
      )}
      {folders?.length > 0 && (
        <div className={`ant-allow-dark ${styles.expanableFolders}`}>
          {/* 展示区（未展开时最多4行） */}
          <div className={`${styles.expandMode} ${expanded ? styles.expaned : ''}`}>
            <div id="folders" className={styles.folders}>
              {folders.map((item, index) => FolderItem(item, index))}
              {expandAndCollapseVis && <ExpandAndCollapse totalNum={folderCount} expanded={expanded} expandFolder={expandFolder} />}
              {Array(10)
                .fill(null)
                .map((_, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <div key={`f${index}`} className={styles.placeholder} />
                ))}
            </div>
          </div>

          {/* 详情 */}
          <Detail itemOrg={curOprItem} type={curSideTab} isModalVisible={detailVis} setVisible={setDetailVis} />
          {/* 分享弹窗 */}
          <ShareModal item={curOprItem} defaultTabKey={tabKey} sideTab={curSideTab} visible={shareVis} hideSharePage={() => setShareVis(false)} />
          {/* 移动文件夹弹窗 */}
          {moveVis && (
            <MoveDirModal
              rootInfo={curRootInfo}
              closeModal={() => {
                setMoveVis(false);
              }}
              moveSucc={(from, to, fromParent) => afterMoveFolder(from, to, fromParent)}
              sourceNsContent={moveTarget}
              visible={moveVis}
            />
          )}
          {/* 删除弹窗 */}
          {delItem && delVis && (
            <Delete
              isModalVisible={delVis}
              dataFromOperate={{ setDeleteVisible: setDelVis, item: delItem }}
              handleOk={afterDelFolder}
              type={tabInterfaceMap[curSideTab]}
              sideTab={curSideTab}
            />
          )}
        </div>
      )}
    </>
  );
};
export default ExpanableFolders;
