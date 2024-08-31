import React, { ReactNode, useEffect, useState, useRef, useCallback } from 'react';
import { Table, Modal } from 'antd';
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
  ResponseAnonymousDirList,
  conf,
  locationHelper,
} from 'api';
import { formatAuthority, normalizeShareUrl, getFileIcon, simpleFormatTime } from '../../utils';
import IconCard from '@web-common/components/UI/IconCard';
import { formatFileSize } from '@web-common/utils/file';
import { Bread } from '../../disk';
import FilenameCell, { FileNameCellProps } from './FilenameCell';
import RowName from './../RowName/rowName';
import TableSkeleton from './../TableSkeleton/tableSkeleton';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import style from './index.module.scss';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import { getIn18Text } from 'api';
const host = locationHelper.getHost();
const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const nsShareApi = api.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
const trackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const eventApi = api.api.getEventApi();
const contextPath = systemApi.getContextPath();
interface Props {
  bread?: Bread[];
  list: any;
  // deleteRN: (
  //     val: boolean,
  //     props: {
  //         setDeleteVisible: (val) => void;
  //         item: NSDirContent | NSFileContent | any;
  //     }
  // ) => ReactNode;
  // sideTab?: string;
  scrollFireLoading: () => void;
  changeDir: (item: NSDirContent) => void;
  listLoading: boolean;
  type?: NetStorageType;
  // uploadFiles?: (files?: File[], curDirInfo?: any) => void;
  contentWidth: number;
  highlightDirId?: number;
  spaceId?: number;
  downloadAction: (item, spaceId) => void;
  rootInfo: ResponseAnonymousDirList;
  forceRefresh?(): void;
  shareIdentity: string;
  // afterRename?(id: number, newName: string, updateTime?: string): void;
  role?: string;
}
const AnonymousDiskTable: React.FC<Props> = ({
  bread,
  list,
  // deleteRN,
  contentWidth,
  // sideTab,
  scrollFireLoading,
  downloadAction: downloadActionOrg,
  listLoading,
  changeDir,
  type,
  // uploadFiles,
  highlightDirId,
  spaceId,
  rootInfo,
  forceRefresh = () => {},
  shareIdentity,
  role,
  // afterRename,
}) => {
  const uploadHolderRef = useRef<HTMLDivElement>(null);
  // const uploadMaskRef = useRef<HTMLDivElement>(null);
  // const [shareVisible, setShareVisible] = useState<boolean>(false);
  // const [showUploadMask, setShowUploadMask] = useState<boolean>(false);
  // const [currentRow, setCurrentRow] = useState({});
  // const [detailVisible, setDetailVisible] = useState(false);
  // const [editingKey, setEditingKey] = useState<string>('');
  // const inRecentlyTab = sideTab === 'recently';
  // const inShareTab = true;
  // const isEditing = record => record.id === editingKey;
  // const fileText = ;
  const totalSizeKey = 'size';
  // const creatorKey =  'createUserNickName';
  // const updateTimeKey =  'updateTime';
  // const updateTimeText =  '修改时间';
  // const authKey =  'authorityDetail';
  const [listData, setListData] = useState<any[]>([]);
  useEffect(() => {
    setListData(list);
  }, [list]);
  useCommonErrorEvent();
  const columns = [
    {
      title: getIn18Text('WENJIAN'),
      dataIndex: 'name',
      key: 'name',
      width: 350,
      ellipsis: true,
      editable: true,
      render: (name, item) => {
        const frontName = name.slice(0, -8);
        const endFront = name.slice(-8);
        const isDir = item.extensionType === 'dir';
        const openFileOrDir = () => {
          if (isDir) {
            trackerApi.track('pc_disk_click_anonymous_list', { type: 'folder' });
            changeDir(item);
          } else {
            trackerApi.track('pc_disk_click_anonymous_list', { type: 'file' });
            // nsShareApi.previewAnonymousFileInfo({ fileId: item.id, shareIdentity }).then(data => {
            const url = `${host}${contextPath}/share_anonymous/#type=FILE&shareIdentity=${shareIdentity}&fileId=${item.id}`;
            if (url) {
              const shareUrl = normalizeShareUrl(url);
              if (systemApi.isElectron()) {
                systemApi.handleJumpUrl(-1, shareUrl);
              } else {
                systemApi.openNewWindow(shareUrl);
              }
            }
            // });
          }
        };
        return <RowName type={isDir ? 'dir' : getFileIcon(item)} name={name} openFileOrDir={openFileOrDir} />;
      },
    },
    {
      title: getIn18Text('DAXIAO'),
      dataIndex: totalSizeKey,
      key: totalSizeKey,
      width: 100,
      render: (size, item) => formatFileSize(typeof size === 'number' ? size : item.size, 1024),
    },
    // {
    //   title: '创建人',
    //   dataIndex: creatorKey,
    //   key: creatorKey,
    //   ellipsis: {
    //     showTitle: false,
    //   },
    //   render: nickName => nickName,
    // },
    // {
    //   title: updateTimeText,
    //   dataIndex: updateTimeKey,
    //   key: updateTimeKey,
    //   ellipsis: {
    //     showTitle: false,
    //   },
    //   render: time => simpleFormatTime(time),
    // },
    // {
    //   title: '权限',
    //   dataIndex: authKey,
    //   key: authKey,
    //   ellipsis: true,
    //   render: (auth, item) => {
    //     if (!auth) return '无权限';
    //     return formatAuthority(inRecentlyTab ? auth : auth.roleInfos, item.extensionType) || '无权限';
    //   },
    // },
    {
      title: '',
      dataIndex: '',
      key: 'updateTime',
      width: 80,
      render: (detail, item) => {
        const { extensionType, fileType } = item;
        // 权限为可下载 且为一般文件（非协同文档）
        const downloadAble = role == 'ROLE_USER_DOWNLOAD' && extensionType == 'file' && fileType == 'file';
        if (downloadAble) {
          return <IconCard type="doDownload" onClick={() => download(item)} />;
        }
        return null;
      },
    },
  ];
  const download = item => {
    // 文件夹
    if (item.extensionType === 'dir') {
      const { id, parentId, name, totalSize } = item;
      if (totalSize && totalSize > 1 * 1024 * 1024 * 1024) {
        Modal.error({
          title: getIn18Text('WENJIANJIADAXIAO'),
          content: '',
          okText: getIn18Text('ZHIDAOLE'),
        });
        return;
      }
      const fileReq = {
        type: 'personalShare',
        appTag: systemApi.isElectron(),
        dirIds: [id],
        parentId,
        packageName: `${name}.zip`,
      };
      diskApi.doBatchZipDownload(fileReq);
      return;
    }
    nsShareApi
      .downloadAnonymousFileInfo({ fileId: item.id, shareIdentity })
      .then(data => {
        if (data && data.content) {
          const shareUrl = normalizeShareUrl(data.content);
          systemApi.webDownloadLink(shareUrl);
        }
      })
      .catch(error => {
        console.warn(error);
        // 文件被删除 则清除此项
        // if([10701].includes(error?.data?.code)) {
        //   let i = 0
        //   const copyList = [...listData]
        //   while(i < copyList.length){
        //     if(copyList[i].id == item.id){
        //       copyList.splice(i, 1);
        //       setListData(copyList);
        //       break;
        //     }
        //     i ++
        //   }
        // }
        eventApi.sendSysEvent({
          eventName: 'error',
          eventLevel: 'error',
          eventStrData: '',
          eventData: {
            popupType: 'toast',
            popupLevel: 'info',
            title: error?.data?.message || getIn18Text('XIAZAISHIBAI'),
            code: 'PARAM.ERR',
          },
          eventSeq: 0,
        });
      });
  };
  const onScrollCapture = e => {
    e.persist();
    if (e.currentTarget && e.currentTarget.querySelector) {
      const tableBody = e.currentTarget.querySelector('.ant-table-body');
      if (tableBody.scrollHeight - tableBody.scrollTop - tableBody.clientHeight < 300) {
        scrollFireLoading();
      }
    }
  };
  // useEffect(() => {
  //   const tableDiv = uploadHolderRef.current?.querySelector('.ant-table-body');
  //   if (tableDiv) {
  //     tableDiv.scrollTop = 0;
  //   }
  // }, [sideTab]);
  // const downloadAction = (item: NSFileContent | NSDirContent) => {
  //   trackerApi.track(`pc_disk_click_download_${trackTypeMap[sideTab || '']}`);
  //   downloadActionOrg(item, spaceId);
  // };
  const mergedColumns = columns.map(col => {
    if (!col.editable) return col;
    const sideTab = 'share';
    return {
      ...col,
      onCell: record =>
        ({
          record,
          sideTab,
          // setEditingKey,
          // isEditing: isEditing(record),
          // afterRename,
        } as FileNameCellProps),
    };
  });
  return (
    <>
      {listLoading && listData.length === 0 && <TableSkeleton />}
      {listData.length > 0 && (
        <div
          className={classnames(style.container, { [style.containerShare]: true })}
          hidden={listData.length === 0}
          onScrollCapture={onScrollCapture}
          ref={uploadHolderRef}
        >
          <div style={{ height: '100%' }}>
            <SiriusTable
              className={style.diskTable}
              dataSource={listData}
              components={{
                body: {
                  cell: FilenameCell,
                },
              }}
              columns={mergedColumns}
              pagination={false}
              scroll={{ y: 'calc(100% - 64px)', scrollToFirstRowOnChange: true }}
              // loading={listLoading}
              rowClassName={item => `${highlightDirId === item.id ? style.highLight : ''}`}
              rowKey={item => item.id}
              headerBgColor={false}
            />
          </div>
        </div>
      )}
    </>
  );
};
export default AnonymousDiskTable;
