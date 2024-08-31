import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Table, Tooltip, Select } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import {
  apis,
  apiHolder as api,
  NetStorageApi,
  NSDirContent,
  NSFileContent,
  DataTrackerApi,
  SystemApi,
  NetStorageShareApi,
  NetStorageType,
  DataStoreApi,
  apiHolder,
  isEdm,
} from 'api';
import Alert from '@web-common/components/UI/Alert/Alert';
import { formatAuthority, normalizeShareUrl, getFileIcon, simpleFormatTime, edmJump } from '../../utils';
import IconCard from '@web-common/components/UI/IconCard';
import RowName from '@web-disk/components/RowName/rowName';
import { formatTimeWithHM } from '@web-mail/util';
import Detail from '../Detail';
import { formatFileSize } from '@web-common/utils/file';
import { ShareModal } from '../SharePage/sharePage';
import { toastUploadPrivilegeError } from '../Upload';
import { trackTypeMap, Bread, RootInfo, DiskPage, DiskTab, DiskTipKeyEnum } from '../../disk';
import { MoveDirModal } from '../MoveDir';
import FilenameCell, { FileNameCellProps } from './FilenameCell';
import style from './index.module.scss';
import DiskTableOperate, { getShareAble } from './../DiskTable/DiskTableOperate';
import Delete from '../Delete';
import TableSkeleton from './../TableSkeleton/tableSkeleton';
import { NpsArea } from '../Nps';
import { getIn18Text } from 'api';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';

const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const nsShareApi = api.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
const trackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const dataStoreApi: DataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const Option = Select.Option;

interface Props {
  bread?: Bread[];
  list: any;
  sideTab: string;
  currentPage?: DiskPage;
  setCurrentPage?: (val: DiskPage) => void; // ??
  scrollFireLoading?: () => void;
  changeDir: (item: NSDirContent) => void;
  listLoading: boolean;
  type: NetStorageType;
  uploadFiles?: (files?: File[], curDirInfo?: any) => void;
  highlightDirId?: number;
  spaceId?: number;
  downloadAction: (item, spaceId) => void;
  forceRefresh?: () => void;
  afterRename?: (id: number, newName: string, updateTime?: string) => void;
  rootInfo: RootInfo;
  contentWidth: number;
  afterDel: (id) => void;
  delParams?: Object;
  tableParams?: Object; // antd table组件需要的参数
  scrollMode?: number; // 0 内部滚动 1 直接展示
  skeletonStyle?: {};
  collectAble?: boolean;
  collectAction?: (params: { id: number; collect: boolean; type: 'folder' | 'file' }) => void;
}
// 哪些地方用了它 ： 主页 主页部分 + 个人/企业空间 + 内部分享 + 与我分享
const DiskTable: React.FC<Props> = ({
  bread,
  list,
  currentPage,
  sideTab,
  scrollFireLoading,
  downloadAction,
  listLoading,
  changeDir,
  type,
  uploadFiles,
  highlightDirId,
  spaceId,
  forceRefresh = () => {},
  afterRename,
  contentWidth,
  rootInfo,
  afterDel,
  delParams,
  scrollMode = 0,
  skeletonStyle,
  collectAble,
  collectAction,
  tableParams,
}) => {
  const curRootInfo = rootInfo;
  const curContWidth = contentWidth;
  const uploadHolderRef = useRef<HTMLDivElement>(null);
  const uploadMaskRef = useRef<HTMLDivElement>(null);
  const [shareVis, setShareVis] = useState<boolean>(false);
  const [tabKey, setTabKey] = useState<string>('1');
  const [showUploadMask, setShowUploadMask] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState({});
  const [detailVis, setDetailVis] = useState(false);
  const [editingKey, setEditingKey] = useState<string>('');
  const [rowHoverId, setRowHoverId] = useState<number>();
  const [delVis, setDelVis] = useState<boolean>(false);
  const [delItem, setDelItem] = useState<NSDirContent | NSFileContent>();
  const [selectedTableOpt, setSelectedTableOpt] = useState<'creator' | 'size'>('creator');
  const inRecentlyTab = sideTab === 'recently';
  const inShareTab = sideTab === 'share';
  const isPublicTab = sideTab === 'public';
  const isPrivateTab = sideTab === 'private';
  const isEditing = record => record.id === editingKey;
  // table 第一column标题
  const fileText = inRecentlyTab ? (
    <div style={{ height: '22px' }}>
      <span>{getIn18Text('ZUIJINWENJIAN')}</span>
      <Tooltip title={getIn18Text('ZHANSHIZUIJINBAN')}>
        <span style={{ verticalAlign: '-.2em', marginLeft: '4px' }}>
          <IconCard type="info" stroke="#A8AAAD" />
        </span>
      </Tooltip>
    </div>
  ) : (
    getIn18Text('WENJIAN')
  );
  const handleChangeTableOpt = (val: 'creator' | 'size') => {
    setSelectedTableOpt(val);
  };
  const tableOptions = (
    <Select
      className={style.tableOptionsSelector}
      dropdownClassName={style.tableOptionsDrop}
      defaultValue={selectedTableOpt}
      onChange={handleChangeTableOpt}
      suffixIcon={<IconCard type="filterTriangleDown" />}
    >
      <Option value="creator">{getIn18Text('CHUANGJIANREN')}</Option>
      <Option value="size">{getIn18Text('DAXIAO')}</Option>
    </Select>
  );
  const totalSizeKey = inRecentlyTab ? 'resourceSize' : 'totalSize';
  const creatorKey = inRecentlyTab ? 'creatorName' : 'createUserNickName';
  const updateTimeKey = inRecentlyTab ? 'recordTime' : 'updateTime';
  const updateTimeText = inRecentlyTab ? getIn18Text('ZUIJINDAKAI') : getIn18Text('XIUGAISHIJIAN');
  const authKey = inRecentlyTab ? 'roles' : 'authorityDetail';
  const v = dataStoreApi.getSync(DiskTipKeyEnum.EXTERNAL_SHARE_TIP)?.data !== 'true' && !!list.length && sideTab === 'recently';
  if (v) {
    let flag = true;
    list = list.map(item => {
      const showShareIcon = getShareAble(item);
      if (flag && showShareIcon) {
        flag = false;
        item.externalShareTipVisible = true;
      }
      return item;
    });
  }
  let columns = [
    {
      title: fileText,
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      editable: true,
      render: (name, item) => {
        // const frontName = name.slice(0, -8);
        // const endFront = name.slice(-8);
        const isDir = item.extensionType === 'dir';
        const { hasExternalShared } = item;
        const openFileOrDir = () => {
          if (isDir) {
            if (inShareTab && !formatAuthority(item?.authorityDetail?.roleInfos, 'dir')) {
              Alert.error({
                title: getIn18Text('ZANWUQUANXIANJIN'),
                content: '',
              });
            } else {
              trackerApi.track(`pc_disk_click_list_${trackTypeMap[sideTab || '']}`, { type: 'folder' });
              changeDir(item);
            }
          } else {
            trackerApi.track(`pc_disk_click_list_${trackTypeMap[sideTab || '']}`, { type: 'file' });
            nsShareApi.getNSShareLink({ resourceId: item.id, resourceType: 'FILE' }).then(data => {
              if (data.shareUrl) {
                const shareUrl = normalizeShareUrl(data.shareUrl);
                if (systemApi.isElectron()) {
                  systemApi.handleJumpUrl(-1, shareUrl);
                } else {
                  // 外贸先跳至灵犀中转页，进行登录预处理后，再进入目标页
                  if (isEdm()) {
                    edmJump(shareUrl);
                  } else {
                    systemApi.openNewWindow(shareUrl);
                  }
                }
              }
            });
          }
        };
        return (
          <RowName
            id={item.id}
            type={isDir ? 'dir' : getFileIcon(item)}
            name={name}
            showExtShare={hasExternalShared}
            openFileOrDir={openFileOrDir}
            collectAble={collectAble || false}
            starred={item.starred}
            collectAction={collectAction}
          />
        );
      },
    },
    // 创建人 + 大小
    {
      title: tableOptions,
      dataIndex: totalSizeKey,
      key: totalSizeKey,
      width: 160,
      render: (_, item) => {
        if (selectedTableOpt === 'creator') {
          return <span className={style.creatorColumn}>{item[creatorKey]}</span>;
        }
        if (selectedTableOpt === 'size') {
          try {
            const realSize = item[totalSizeKey] || item.size;
            return <span className={style.sizeColumn}>{formatFileSize(realSize, 1024)}</span>;
          } catch (error) {
            return '';
          }
        }
      },
    },
    // {
    //     title: getIn18Text("DAXIAO"),
    //     dataIndex: totalSizeKey,
    //     key: totalSizeKey,
    //     width: 160,
    //     render: (size, item) => {
    //         return formatFileSize(typeof size === 'number' ? size : item.size, 1024)
    //     },
    // },
    // {
    //     title: getIn18Text("CHUANGJIANREN"),
    //     dataIndex: creatorKey,
    //     key: creatorKey,
    //     ellipsis: {
    //         showTitle: false,
    //     },
    //     width: 160,
    //     render: nickName => nickName,
    // },
    // {
    //     title: getIn18Text("DAXIAO"),
    //     dataIndex: totalSizeKey,
    //     key: totalSizeKey,
    //     width: 160,
    //     render: (size, item) => {
    //         return formatFileSize(typeof size === 'number' ? size : item.size, 1024)
    //     },
    // },
    // {
    //     title: getIn18Text("CHUANGJIANREN"),
    //     dataIndex: creatorKey,
    //     key: creatorKey,
    //     ellipsis: {
    //         showTitle: false,
    //     },
    //     width: 160,
    //     render: nickName => nickName,
    // },
    {
      title: updateTimeText,
      dataIndex: updateTimeKey,
      key: updateTimeKey,
      width: 160,
      ellipsis: {
        showTitle: false,
      },
      render: (time, item) => {
        const date = item.recordTime || item.updateTime;
        if (!date) return '';
        // return simpleFormatTime(date, false, isPrivateTab || isPublicTab);
        return formatTimeWithHM(date);
      },
    },
    {
      title: getIn18Text('QUANXIAN'),
      dataIndex: authKey,
      key: authKey,
      ellipsis: true,
      width: 120,
      render: (auth, item) => {
        // 后期加上骨架屏后此部分删除
        const roles = item?.roles || item?.authorityDetail?.roleInfos;
        if (!roles) return '';
        // 空数组无权限
        if (roles.length === 0) return getIn18Text('WUQUANXIAN');
        return formatAuthority(roles, item.extensionType, 'simple');
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      dataIndex: '',
      key: 'updateTime',
      width: 88,
      render: (detail, item1) => (
        <DiskTableOperate
          downloadAction={item => diskDownloadAction(item)}
          item={item1}
          openMoveModal={openMoveModal}
          showDetail={item => showDetail(item)}
          currentPage={currentPage}
          renameFile={item => setEditingKey(item.id)}
          setRowHoverId={id => setRowHoverId(id)}
          showShare={(item, key) => showShare(item, key)}
          type={type}
          sideTab={sideTab}
          rootInfo={curRootInfo}
          showDel={showDel}
        />
      ),
    },
  ];
  if (sideTab === 'private') {
    columns = columns.filter(item => item.dataIndex !== 'authorityDetail');
  }
  // if (curContWidth && curContWidth < 920) {
  //     columns = columns.filter(item => item.title !== (getIn18Text("DAXIAO")));
  // }
  // if (curContWidth && curContWidth < 800) {
  //     columns = columns.filter(item => item.title !== (getIn18Text("CHUANGJIANREN")));
  // }
  const showDetail = item => {
    setCurrentRow(item);
    setDetailVis(true);
  };
  const showDel = (item: NSDirContent | NSFileContent) => {
    setDelItem(item);
    setDelVis(true);
  };
  const showShare = (item, key) => {
    trackerApi.track(`pc_disk_click_share_${trackTypeMap[sideTab || '']}`);
    if (inRecentlyTab) {
      diskApi
        .doGetNSFileInfo({
          type: 'personalShare',
          dirId: item.resourceParentId,
          fileId: item.resourceId,
          spaceId: item.spaceId,
        })
        .then(data => {
          setCurrentRow(data);
          setShareVis(true);
          setTabKey(key);
        });
    } else {
      setCurrentRow(item);
      setShareVis(true);
      setTabKey(key);
    }
  };
  const hideShare = () => {
    setShareVis(false);
  };
  // 拖进table
  const onDragover = useCallback((e: DragEvent) => {
    const dt = e.dataTransfer;
    // 非文件
    if (dt && dt.items && dt.items[0]?.kind !== 'file') {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    // 出现蒙层
    setShowUploadMask(true);
  }, []);
  // 脱离蒙层
  const onDragleave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowUploadMask(false);
  }, []);
  // 放下
  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const dt = e.dataTransfer;
      if (dt) {
        const dropFiles: File[] = [];
        Array.from(dt.items).forEach(item => {
          if (item.kind === 'file' && item.webkitGetAsEntry().isFile) {
            const file = item.getAsFile();
            if (file) {
              dropFiles.push(file);
            }
          }
        });
        if (dropFiles.length !== dt.items.length) {
          message.info({
            duration: 2,
            content: <span>{getIn18Text('BUZHICHIWENJIAN')}</span>,
          });
        }
        if (dropFiles.length) {
          const dir = bread?.length && bread[bread.length - 1];
          if (!dir) return;
          if (sideTab === 'private' || inRecentlyTab) {
            uploadFiles && uploadFiles(Array.from(dropFiles), dir);
          } else {
            diskApi
              .doGetNSEntFolderAuthInfo(dir.id)
              .then(auth => {
                const authText = formatAuthority(auth.roleInfos, 'dir');
                // !!权限控制条件判断是中文匹配，不要翻译
                if (!authText?.includes('管理') && !authText?.includes('上传')) {
                  toastUploadPrivilegeError();
                } else {
                  uploadFiles && uploadFiles(Array.from(dropFiles), dir);
                }
                setShowUploadMask(false);
              })
              .catch(() => {
                setShowUploadMask(false);
              });
          }
        }
      }
      setShowUploadMask(false);
    },
    [bread, uploadFiles, sideTab]
  );
  // useEffect(() => {
  //   if (sideTab === 'share') {
  //     return;
  //   }
  //   const uploadHolder = uploadHolderRef.current;
  //   const uploadMask = uploadMaskRef.current;
  //   uploadHolder?.addEventListener('dragover', onDragover);
  //   uploadMask?.addEventListener('dragleave', onDragleave);
  //   return () => {
  //     uploadHolder?.removeEventListener('dragover', onDragover);
  //     uploadMask?.removeEventListener('dragleave', onDragleave);
  //   };
  // }, [sideTab, onDragover, onDragleave]);
  // useEffect(() => {
  //   if (sideTab === 'share') {
  //     return;
  //   }
  //   const uploadHolder = uploadHolderRef.current;
  //   uploadHolder?.addEventListener('drop', onDrop);
  //   return () => {
  //     uploadHolder?.removeEventListener('drop', onDrop);
  //   };
  // }, [sideTab, onDrop]);
  const onScrollCapture = e => {
    e.persist();
    if (list.length < 30) return; // 一次加载50条，小于50标识 总数不足50，没有scroll加载的必要
    if (e.currentTarget && e.currentTarget.querySelector) {
      const tableBody = e.currentTarget.querySelector('.ant-table-body');
      if (tableBody.scrollHeight - tableBody.scrollTop - tableBody.clientHeight < 300) {
        scrollFireLoading && scrollFireLoading();
      }
    }
  };
  useEffect(() => {
    const tableDiv = uploadHolderRef.current?.querySelector('.ant-table-body');
    if (tableDiv) {
      tableDiv.scrollTop = 0;
    }
  }, [sideTab]);
  const diskDownloadAction = (item: NSFileContent | NSDirContent) => {
    trackerApi.track(`pc_disk_click_download_${trackTypeMap[sideTab || '']}`);
    downloadAction(item, spaceId);
  };
  const [moveVis, setMoveVis] = useState(false);
  const [moveTarget, setMoveTarget] = useState<NSFileContent | NSDirContent | undefined>();
  // 移动文件/文件夹窗口
  const openMoveModal = (item: NSFileContent | NSDirContent) => {
    setMoveVis(true);
    setMoveTarget(item);
  };
  const dirName = bread?.length ? bread[bread.length - 1]?.name : '';
  const mergedColumns = columns.map(col => {
    if (!col.editable) return col;
    // 名称可编辑
    return {
      ...col,
      onCell: record =>
        ({
          record,
          sideTab,
          setEditingKey,
          isEditing: isEditing(record),
          afterRename,
        } as FileNameCellProps),
    };
  });
  return (
    <>
      {/* 自带骨架屏 */}
      {listLoading && list.length === 0 && <TableSkeleton style={skeletonStyle || {}} />}
      {list?.length > 0 && (
        <div className={classnames('ant-allow-dark', style.container, { [style.endless]: scrollMode === 1 })} onScrollCapture={onScrollCapture} ref={uploadHolderRef}>
          <div style={{ height: '100%' }}>
            <SiriusTable
              className={classnames(style.diskTable, { [style.endless]: scrollMode === 1 })}
              dataSource={list}
              components={{
                body: {
                  cell: FilenameCell,
                },
              }}
              columns={mergedColumns}
              pagination={false}
              scroll={scrollMode === 0 ? { y: 'calc(100% - 64px)', scrollToFirstRowOnChange: true } : { scrollToFirstRowOnChange: true, y: '999px' }}
              rowClassName={item => `${highlightDirId === item.id ? style.highLight : ''} ${rowHoverId === item.id ? style.hoverRow : ''}`}
              rowKey={item => item.id}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...tableParams}
              headerBgColor={false}
            />
          </div>

          {/* 上传蒙层 */}
          <div ref={uploadMaskRef} className={classnames(style.uploadMask, { [style.hidden]: !showUploadMask })}>
            <div className={style.uploadBox}>
              <div className={style.uploadTip}>{`上传到“${dirName}”`}</div>
            </div>
          </div>

          {/* 文件夹/文件 详细信息 */}
          <Detail spaceId={spaceId} itemOrg={currentRow} type={sideTab} isModalVisible={detailVis} setVisible={setDetailVis} />

          {/* 个人文件夹/企业文件夹显示移动文件夹弹窗 */}
          {moveVis && (
            <MoveDirModal
              rootInfo={curRootInfo}
              closeModal={flag => {
                // 刷新目录
                flag && forceRefresh();
                setMoveVis(false);
              }}
              sourceNsContent={moveTarget}
              visible={moveVis}
            />
          )}

          <ShareModal
            item={currentRow}
            // type={type}
            defaultTabKey={tabKey}
            sideTab={sideTab}
            visible={shareVis}
            hideSharePage={hideShare}
          />
          <NpsArea />
          {delItem && delVis && (
            <Delete
              isModalVisible={delVis}
              dataFromOperate={{ setDeleteVisible: setDelVis, item: delItem }}
              handleOk={afterDel}
              type={type}
              sideTab={sideTab as DiskTab}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...delParams}
            />
          )}
        </div>
      )}
    </>
  );
};
export default DiskTable;
