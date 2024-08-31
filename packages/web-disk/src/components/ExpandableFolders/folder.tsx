import React, { useState, useRef, useEffect } from 'react';
import { Input, Dropdown } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder as api, apis, DataTrackerApi, NetStorageApi, NetStorageType, NSDirContent } from 'api';
import classnames from 'classnames';
import styles from './folder.module.scss';
import DiskTableOperate, { MoreOprsCont } from './../DiskTable/DiskTableOperate';
import IconCard from '@web-common/components/UI/IconCard';
import { DiskActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { trackTypeMap, tabInterfaceMap } from '../../disk';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';
const trackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const eventApi = api.api.getEventApi();
interface FolderProps {
  index: number;
  folderItem: NSDirContent;
  setCurOprItem: (val: NSDirContent) => void;
  setDetailVis: (val: boolean) => void;
  setTabKey: (val: string) => void;
  setShareVis: (val: boolean) => void;
  setMoveVis: (val: boolean) => void;
  setMoveTarget: (val: NSDirContent) => void;
  downloadAction: (item, spaceId) => void;
  afterRenameFolder: (id: number, newName: string, updateTime, parentId) => void;
  collectAction: (params: { id: number; collect: boolean; type: 'folder' | 'file' }) => void;
  type?: NetStorageType;
  showDel: (item: NSDirContent) => void;
}
// 文件夹
const Folder: React.FC<FolderProps> = ({
  index,
  folderItem,
  setCurOprItem,
  setDetailVis,
  setTabKey,
  setShareVis,
  setMoveVis,
  setMoveTarget,
  downloadAction,
  afterRenameFolder,
  collectAction,
  type,
  showDel,
}) => {
  const curSideTab = useAppSelector(state => state.diskReducer.curSideTab);
  const curRootInfo = useAppSelector(state => state.diskReducer.curRootInfo);
  const dispatch = useAppDispatch();
  const [editting, setEditting] = useState<boolean>(false);
  const inputRef = useRef(null);
  // 点击文件夹
  const ckFolder = () => {
    dispatch(DiskActions.setCurDirId(folderItem.id));
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
    trackerApi.track(`pc_disk_click_download_${trackTypeMap[curSideTab || '']}`);
    const folderDetail = await diskApi.doGetNSFolderInfo({ type: tabInterfaceMap[curSideTab], dirId: item.id, spaceId: item.id });
    const { totalSize } = folderDetail;
    downloadAction({ ...item, totalSize }, null);
  };
  // 校验重命名
  const checkRenameFolder = (newName: string) =>
    new Promise(resolve => {
      // 值为空或没变
      if (!newName.length || folderItem.name === newName) {
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
  // 重命名文件夹
  const renameFolder = async e => {
    const newName = (e?.currentTarget?.value || '').trim();
    const checkRes = await checkRenameFolder(newName);
    // 校验不通过
    if (!checkRes) return;
    setEditting(false);
    // 先把内容改了 以免卡顿
    afterRenameFolder(folderItem.id, newName, folderItem.updateTime, folderItem.parentId);
    const param = {
      type: tabInterfaceMap[curSideTab],
      dirId: folderItem.id,
      itemName: newName,
    };
    try {
      const renameRes = await diskApi.renameNSFile(param);
      // 这块api层可能有问题
      if (renameRes) {
        const folderInfoRes = await diskApi.doGetNSFolderInfo(param);
        if (folderInfoRes) {
          afterRenameFolder(folderItem.id, folderInfoRes.name, folderInfoRes.updateTime, folderItem.parentId);
          eventApi.sendSysEvent({
            eventName: 'diskInnerCtc',
            eventStrData: '',
            eventData: {
              name: 'renameDir1',
              id: folderItem.id,
              sideTab: curSideTab,
            },
          });
        }
      }
    } catch (err) {
      console.log(getIn18Text('ZHONGMINGMINGSHIBAI'), err);
      message.error({
        content:
          (
            err as {
              message: string;
            }
          )?.message || getIn18Text('ZHONGMINGMINGSHIBAI'),
      });
    }
  };
  // 取消输入
  const cancelInput = (e: MouseEvent) => {
    e.stopPropagation();
  };
  // 收藏/取消收藏
  const ckStar = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    const { starred, id } = folderItem;
    collectAction({ id, collect: !starred, type: 'folder' });
  };
  useEffect(() => {
    const { current } = inputRef;
    if (current && editting) {
      (current as HTMLInputElement).focus();
      (current as HTMLInputElement).setSelectionRange(0, folderItem.name.length);
    }
  }, [editting]);
  const suffix = (
    <span className={styles.cancel} onClick={() => cancelInput}>
      {getIn18Text('QUXIAO')}
    </span>
  );
  const params = {
    item: { ...folderItem },
    downloadAction: item => folderDownloadAction(item),
    openMoveModal,
    showDetail: item => showDetail(item),
    renameFile1: setEditting,
    showShare: (item, key) => showSharePage(item, key),
    type,
    sideTab: curSideTab,
    rootInfo: curRootInfo,
    shareMode: 1,
    showDel,
  };
  return (
    <Dropdown overlay={MoreOprsCont(params)} trigger={['contextMenu']}>
      <div id={'folder' + index} className={styles.folder} onClick={ckFolder}>
        <IconCard type="dir" width="20px" height="20px" />
        {!editting ? (
          <span className={styles.folderLeftContainer}>
            {/* 需要这一层absolute保障不溢出 */}
            <span className={styles.folderNameContainer}>
              <span className={classnames([styles.folderName], { [styles.hasExternal]: folderItem?.hasExternalShared === true })}>{folderItem.name}</span>
              {/* 是否为外部分享 */}
              {folderItem?.hasExternalShared === true && <span className={styles.shareExternal}>{getIn18Text('WAIBU')}</span>}
              {/* 收藏 */}
              <div
                className={classnames([styles.starBlk], {
                  [styles.starGold]: folderItem.starred,
                  [styles.starGray]: !folderItem.starred,
                })}
                onClick={e => ckStar(e)}
              >
                <IconCard type={folderItem.starred ? 'starGold' : 'starGray'} />
              </div>
            </span>
          </span>
        ) : (
          <Input
            ref={inputRef}
            defaultValue={folderItem.name || ''}
            className={styles.inputFolderTitle}
            suffix={suffix}
            onPressEnter={e => renameFolder(e)}
            onBlur={e => renameFolder(e)}
            onClick={e => e.stopPropagation()}
          />
        )}
        <div onClick={e => e.stopPropagation()}>
          <DiskTableOperate {...params} />
        </div>
      </div>
    </Dropdown>
  );
};
export default Folder;
