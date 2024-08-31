import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { Menu, Table, Dropdown } from 'antd';
import classnames from 'classnames';
import { apis, apiHolder as api, NetStorageApi, ResponseFavoriteItem, ResourceType, SystemApi, DataTrackerApi, NetStorageShareApi, isEdm } from 'api';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import RowName from './../RowName/rowName';
import { getFileIcon, simpleFormatTime, formatAuthority, normalizeShareUrl, checkActionAuth, isImage, edmJump } from '../../utils';
import { ShareModal } from '../SharePage/sharePage';
import IconCard from '@web-common/components/UI/IconCard';
import { formatTimeWithHM } from '@web-mail/util';
import Alert from '@web-common/components/UI/Alert/Alert';
import PopItem from '../PopItem/popItem';
import style from './favorites.module.scss';
import Detail from '../Detail';
import { getParameterByName, parseShareUrlParams } from '@web-common/utils/utils';
import { DiskActions, useAppDispatch } from '@web-common/state/createStore';
import TableSkeleton from '../TableSkeleton/tableSkeleton';
import FilenameCell from '../DiskTable/FilenameCell';
import ImgPreview from '@web-common/components/UI/ImagePreview/index';
import Empty from '../Empty/empty';
import { getIn18Text } from 'api';
import SiriusTable from '@web-common/components/UI/Table';
import { safeDecodeURIComponent } from '@web-common/utils/utils';

const trackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const nsShareApi = api.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
const systemApi = api.api.getSystemApi() as SystemApi;
// getFavoriteList
const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const performanceApi = api.api.requireLogicalApi(apis.performanceImpl) as unknown as PerformanceApi;
interface FavoritesProps {
  downloadAction: (item: any, spaceId?: string) => void; // 点击下载
  contentWidth: number;
}
const bizCodeSideTabMap = {
  QIYE: 'public',
  PERSONAL: 'private',
  PERSONAL_SHARE: 'share',
};
const tag = '[Favorites]';
const pageSize = 30;
const Favorites: React.FC<FavoritesProps> = props => {
  const { downloadAction, contentWidth } = props;
  const dispatch = useAppDispatch();
  const [total, setTotal] = useState(0);
  const [list, setList] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>({});
  const [shareVis, setShareVis] = useState<boolean>(false);
  const [mergedColumns, setColumns] = useState<any[]>([]);
  // const [tabKey, setTabKey] = useState<string>('1');
  const [editingKey, setEditingKey] = useState<string>('');
  const [rowHoverId, setRowHoverId] = useState<string>('');
  const isEditing = (record: { resourceId: any }) => record.resourceId === editingKey;
  const [detailVis, setDetailVis] = useState(false);
  const [moreOptActive, setMoreOptActive] = useState<boolean>(false);
  const [logMark, setLogMark] = useState<boolean>(false);
  const sideTab = 'favorites';
  const getFavoriteList = (init: boolean) => {
    let page = 1;
    if (!init) page = Math.floor(list.length / pageSize) + 1;
    setListLoading(true);
    diskApi
      .getFavoriteList({ page, pageSize })
      .then(({ starRecords: data, totalCount: _total }) => {
        setTotal(_total);
        // setTotal(100);
        const formatlist = data.map(item => ({
          id: item.resourceId,
          parentId: item.resourceParentId,
          name: item.resourceName,
          roleArr: item.roles,
          ...item,
        }));
        if (!init) {
          setList([...list, ...formatlist]);
        } else {
          setLogMark(true);
          setList(formatlist);
        }
        setListLoading(false);
      })
      .catch(() => {
        setListLoading(false);
      });
  };
  useEffect(() => {
    if (logMark) {
      console.log('performanceApi', `disk_load_favorites_end`);
      performanceApi.timeEnd({
        statKey: `disk_favorites_load_time`,
      });
    }
  }, [logMark]);
  const removeFavorite = (resourceId: number, resourceType: ResourceType) => {
    diskApi.removeFavorite({ resourceId, resourceType }).then(({ data }) => {
      setTotal(total - 1);
      setList(state => {
        const _list = [...state];
        return _list.filter(item => item.id !== resourceId);
      });
    });
  };
  const onVisibleChange = (visible: boolean, id: string) => {
    setMoreOptActive(visible);
    setRowHoverId && setRowHoverId(visible ? id : '');
  };
  const afterCkMenu = () => {
    setMoreOptActive(false);
    setRowHoverId && setRowHoverId('');
  };
  const onScrollCapture = (e: {
    persist: () => void;
    currentTarget: {
      querySelector: (arg0: string) => any;
    };
  }) => {
    e.persist();
    if (list.length < 30) return; // 一次加载100条，小于100标识 总数不足100，没有scroll加载的必要
    if (e.currentTarget && e.currentTarget.querySelector) {
      const tableBody = e.currentTarget.querySelector('.ant-table-body');
      if (tableBody.scrollHeight - tableBody.scrollTop - tableBody.clientHeight < 300) {
        scrollFireLoading();
      }
    }
  };
  const scrollFireLoading = () => {
    // 2.有下一页需要加载  3.不在加载过程中
    if (total > list.length && !listLoading) {
      getFavoriteList(false);
    }
  };
  const showShare = (item: ResponseFavoriteItem, key: string) => {
    trackerApi.track('pc_disk_click_share_favorites');
    // if (inRecentlyTab) {
    //   diskApi
    //     .doGetNSFileInfo({
    //       type: 'personalShare',
    //       dirId: item.resourceParentId,
    //       fileId: item.resourceId,
    //       spaceId: item.spaceId
    //     })
    //     .then(data => {
    //       setCurrentRow(data);
    //       setShareVis(true);
    //       setTabKey(key);
    //     });
    // } else {
    setCurrentRow(item);
    setShareVis(true);
    // setTabKey(key);
    // }
  };
  // 添加网盘刷新
  useMsgRenderCallback('diskInnerCtc', async data => {
    const { eventData } = data;
    const { name, cb } = eventData;
    if (name === 'refresh') {
      getFavoriteList(true);
      cb();
    }
  });
  const hideShare = () => {
    setShareVis(false);
  };
  const DropdownMenu = (rowItem: any, rowAfterCkMenu: () => void) => {
    const { fileType, resourceId, roles, resourceType, extensionType } = rowItem;
    const authText = formatAuthority(roles, extensionType);
    // !!权限控制条件判断是中文匹配，不要翻译
    const canRenameFile = authText?.includes('管理') || authText?.includes('编辑');
    const canViewDetail = checkActionAuth(rowItem, 'detail');
    const hideDownload = ['excel', 'doc', 'unitable'].includes(fileType);
    // !!权限控制条件判断是中文匹配，不要翻译
    const canDownload = authText?.includes('管理') || authText?.includes('下载');
    return (
      <Menu className={style.popContent} onClick={rowAfterCkMenu}>
        <PopItem
          divider
          name={getIn18Text('ZHONGMINGMING')}
          iconType="renameFile"
          disabled={!canRenameFile}
          // style={{ marginTop: shareMode === 1 ? 4 : 0 }}
          onClick={() => {
            setEditingKey(resourceId);
          }}
        />
        <PopItem
          divider
          name={getIn18Text('XIAZAI')}
          iconType="doDownload"
          hidden={hideDownload}
          disabled={!canDownload}
          style={{ marginTop: 4 }}
          onClick={() => {
            downloadAction(rowItem, rowItem.spaceId);
          }}
        />
        <PopItem
          divider
          disabled={!canViewDetail}
          style={{ marginTop: 4 }}
          name={getIn18Text('XIANGXIXINXI')}
          iconType="info"
          onClick={() => {
            setCurrentRow(rowItem);
            setDetailVis(true);
          }}
        />
        <PopItem
          name={getIn18Text('QUXIAOSHOUCANG')}
          style={{ marginTop: 4 }}
          iconType="recycleBin"
          onClick={() => {
            removeFavorite(resourceId, resourceType);
          }}
        />
      </Menu>
    );
  };
  const handleJumpUrl = (url: string) => {
    if (systemApi.isElectron()) {
      systemApi.handleJumpUrl(-1, url);
    } else {
      systemApi.openNewWindow(url);
    }
  };
  const updateNameAndDate = (item: any, id: string, newName: string, updateTime: string) => {
    if (item?.id === id) {
      return {
        ...item,
        resourceName: newName,
        updateTime,
      };
    }
    return item;
  };
  const afterRename = (id: string, newName: string, updateTime = moment().format('YYYY-MM-DD HH:mm:ss')) => {
    setList(list.map(item => updateNameAndDate(item, id, newName, updateTime)));
  };
  // 点击进入
  const openFileOrDir = (item: any) => {
    const isDir = item.extensionType === 'dir';
    const isImg = isImage(item);
    const { resourceId, resourceType, resourceParentId, spaceId, roles, extensionType, bizCode } = item;
    const authority = formatAuthority(roles, extensionType);
    const canDownload = authority.includes(getIn18Text('XIAZAI'));
    if (isDir) {
      if (!formatAuthority(item?.roles, 'dir')) {
        Alert.error({
          title: getIn18Text('ZANWUQUANXIANJIN'),
          content: '',
        });
      } else {
        trackerApi.track(`pc_disk_click_list_${sideTab}`, { type: 'folder' });
        const fromSideTab = bizCodeSideTabMap[bizCode];
        if (!fromSideTab) return;
        dispatch(DiskActions.setCurSideTab(fromSideTab));
        dispatch(DiskActions.setCurDirId(resourceId));
      }
    } else {
      trackerApi.track(`pc_disk_click_list_${sideTab}`, { type: 'file' });
      nsShareApi.getNSShareLink({ resourceId: item.resourceId, resourceType: 'FILE' }).then(async data => {
        if (data.shareUrl) {
          const shareUrl = normalizeShareUrl(data.shareUrl);
          const params = parseShareUrlParams(shareUrl);
          // TODO 图片跳转ImgPreview服务，目前接口返回不了图片地址，
          if (isImg && false) {
            const fileReq = {
              type: params.from,
              fileId: resourceId,
              dirId: resourceParentId,
              spaceId,
            };
            const previewData = {
              previewUrl: '',
              downloadUrl: '',
            };
            try {
              const previewRes = await diskApi.doGetNSDownloadInfo(fileReq, 'preview');
              previewData.previewUrl = getParameterByName('url', safeDecodeURIComponent(previewRes?.data?.data)) || '';
              console.log(previewData.previewUrl);
              if (canDownload) {
                const downloadRes = await diskApi.doGetNSDownloadInfo(fileReq, 'download');
                previewData.downloadUrl = downloadRes?.data?.data;
              }
              ImgPreview.preview({ data: [previewData], startIndex: 0 });
            } catch (error) {}
            return;
          }
          if (systemApi.isElectron()) {
            systemApi.handleJumpUrl(-1, shareUrl);
          } else {
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
  const columns = [
    {
      title: getIn18Text('WENJIAN'),
      dataIndex: 'resourceName',
      key: 'resourceName',
      ellipsis: true,
      editable: true,
      render: (name: string, item: any) => {
        const { hasExternalShared } = item;
        // item.fileType = item.resourceSubType;
        const isDir = item.extensionType === 'dir';
        return <RowName type={isDir ? 'dir' : getFileIcon(item)} name={name} showExtShare={hasExternalShared} openFileOrDir={() => openFileOrDir(item)} />;
      },
    },
    {
      title: getIn18Text('CHUANGJIANREN'),
      dataIndex: 'creatorName',
      key: 'creatorName',
      width: 160,
    },
    {
      title: getIn18Text('GENGXINSHIJIAN'),
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 160,
      render: (time: any) => {
        const date = time;
        if (!date) return '';
        // return simpleFormatTime(date);
        return formatTimeWithHM(date);
      },
    },
    {
      title: getIn18Text('QUANXIAN'),
      dataIndex: 'roles',
      key: 'roles',
      width: 120,
      render: (roles: any, item: any) => {
        if (!roles) return '';
        // 空数组无权限
        if (roles.length === 0) return getIn18Text('WUQUANXIAN');
        return formatAuthority(roles, item.extensionType, 'simple');
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      dataIndex: 'operation',
      key: 'operation',
      width: 88,
      render: (text: any, item: any) => {
        const { roles } = item;
        const noRoles = !roles || roles.length === 0;
        return (
          <div className={`${style.operate}`}>
            <div
              className={classnames('dark-svg-invert', style.item, { [style.disabled]: noRoles })}
              onClick={() => {
                if (noRoles) {
                  return;
                }
                showShare(item, item.id);
              }}
            >
              <IconCard type="share" stroke="rgba(60, 63, 71, .5)" />
            </div>

            <Dropdown overlay={DropdownMenu(item, afterCkMenu)} trigger={['click']} onVisibleChange={visible => onVisibleChange(visible, item.resourceId)}>
              <div className={`opeItem dark-invert ${moreOptActive && rowHoverId === item.resourceId ? 'active' : ''}`}>
                <IconCard type="more" stroke="#262A33" fillOpacity={0.5} />
              </div>
            </Dropdown>
          </div>
        );
      },
    },
  ];
  useEffect(() => {
    console.log(tag, contentWidth);
    mergeColumns(columns);
  }, [contentWidth]);
  const mergeColumns = (columns: any[]) => {
    if (contentWidth && contentWidth < 920) {
      columns = columns.filter((item: { dataIndex: string }) => item.dataIndex !== 'roles');
    }
    if (contentWidth && contentWidth < 800) {
      columns = columns.filter((item: { dataIndex: string }) => item.dataIndex !== 'updateTime');
    }
    setColumns(columns);
  };
  useEffect(() => {
    // console.log(tag, tableType);
    getFavoriteList(true);
  }, []);
  return (
    <div className={style.container}>
      <span
        className={style.title}
        onClick={() => {
          // setCurrentPage && setCurrentPage('index');
        }}
      >
        {getIn18Text('SHOUCANG')}
      </span>
      {listLoading && list.length === 0 && <TableSkeleton />}
      {list?.length > 0 && (
        <div className={classnames(style.tableContainer)} onScrollCapture={onScrollCapture}>
          <div style={{ height: '100%' }}>
            <SiriusTable
              className={classnames(style.table)}
              dataSource={list}
              components={{
                body: {
                  cell: FilenameCell,
                },
              }}
              columns={mergedColumns.map((col: any) => {
                if (!col.editable) return col;
                // 名称可编辑
                return {
                  ...col,
                  onCell: (record: any) => ({
                    record,
                    sideTab,
                    setEditingKey,
                    isEditing: isEditing(record),
                    afterRename,
                  }),
                };
              })}
              pagination={false}
              scroll={{ y: 'calc(100% - 64px)', scrollToFirstRowOnChange: true }}
              rowClassName={(item: any) => `${rowHoverId === item.resourceId ? style.hoverRow : ''}`}
              rowKey={item => item.resourceId}
              headerBgColor={false}
            />
          </div>

          {/* 文件夹/文件 详细信息 */}
          <Detail itemOrg={currentRow} type="recently" isModalVisible={detailVis} setVisible={setDetailVis} />

          <ShareModal item={currentRow} roles={currentRow.roles} defaultTabKey="1" sideTab={sideTab} visible={shareVis} hideSharePage={hideShare} />
        </div>
      )}
      {!listLoading && list.length === 0 && <Empty />}
    </div>
  );
};
export default Favorites;
