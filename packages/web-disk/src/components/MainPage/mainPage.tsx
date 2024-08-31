import React, { useEffect, useState, useRef, useCallback, useMemo, ReactEventHandler } from 'react';
import { Select, Option, Checkbox } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import {
  apis,
  apiHolder,
  NetStorageApi,
  NetStorageType,
  NetStorageShareApi,
  ResponseExternalShareStatistic,
  RequestGetExternalShareList,
  ResponseExternalShareList,
  NSDirContent,
  ResourceType,
  PerformanceApi,
} from 'api';
import debounce from 'lodash/debounce';
import moment from 'moment';
import { ArgsProps } from 'antd/lib/message';
import DiskHead, { Props as DiskHeadProps } from '../DiskHead/diskHead';
import StatisticCounts from '../StatisticCounts/StatisticCounts';
import StatisticHead from '../StatisticHead/StatisticHead';
import DiskTable from '../DiskTable';
import CreateDir from '../CreateDir';
import { UploadFailModal, UploadFailInfo, UploadFile } from '../Upload';
import { UploadFileStatus, IUploadFile } from '../../upload';
import { DiskPage, DiskStoreTipKey, DiskStoreTipVisible } from '../../disk';
import style from './mainPage.module.scss';
import StatisticTable from './../StatisticTable';
import { DiskActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import EmptyFolder from '../EmptyFolder';
import { TemplateModal } from '../TemplateModal';
import { useTemplateModal } from '../TemplateModal/useTemplateModal';
import { templateTrack, trackerTransitionCached } from './extra';
import { Notification } from '../Notification';
import { getIn18Text } from 'api';
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const nsShareApi = apiHolder.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
const performanceApi = apiHolder.api.requireLogicalApi(apis.performanceImpl) as unknown as PerformanceApi;
const systemApi = apiHolder.api.getSystemApi();

const pageSize = 30;
interface DiskListProps {
  noEnqueue?: boolean;
  init?: boolean;
  cb?: Function;
}
interface Props {
  ref: any;
  defaultRangeTime?: [number, number];
  getRootInfo: () => void;
  setVisibleUpload: (val) => void; // 展示上传model
  downloadAction: (item, spaceId) => void;
  setUploadFileItems: (func) => void;
  tipVisible: DiskStoreTipVisible;
  onTipChange: (tipName: DiskStoreTipKey, visible: boolean) => void;
}
const indexBread = [{ id: 0, name: getIn18Text('ZHUYE') }];
const MainPage = React.forwardRef(
  // eslint-disable-next-line max-statements
  (props: Props, ref) => {
    const curDirId = useAppSelector(state => state.diskReducer.curDirId);
    const curSideTab = useAppSelector(state => state.diskReducer.curSideTab);
    const curRootInfo = useAppSelector(state => state.diskReducer.curRootInfo);
    const diskPsR = useAppSelector(state => state.diskReducer.diskPsR);
    const curContWidth = useAppSelector(state => state.diskReducer.curContWidth);
    const curUploadTriggerInfo = useAppSelector(state => state.diskReducer.curUploadTriggerInfo);
    const dispatch = useAppDispatch();
    const [logMark, setLokMark] = useState<boolean>(false);
    const { defaultRangeTime, getRootInfo, downloadAction, setVisibleUpload, setUploadFileItems } = props;
    // 主页
    // 主页 or 统计数据
    const [currentPage, setCurrentPage] = useState<DiskPage>('index');
    const [curRecentPage, setCurRecentPage] = useState<number>(1);
    // 主页-头部-统计数据loading
    const [externalStatisticTimeLoading, setExternalStatisticTimeLoading] = useState<boolean>(false);
    // 主页-头部-统计数据
    const [externalShareStatisticCounts, setExternalShareStatisticCounts] = useState<Partial<ResponseExternalShareStatistic>>({});
    // 统计数据参数
    const [externalShareListParams, setExternalShareListParams] = useState<Partial<RequestGetExternalShareList>>({
      page: 1,
      pageSize: 100,
      searchKey: '',
      createTime: {
        intervalType: 'RELATIVE',
        period: -1,
      },
      visitTime: {
        intervalType: 'RELATIVE',
        period: -1,
      },
    });
    const [externalShareListLoading, setExternalShareListLoading] = useState<boolean>(false);
    const [externalShareListError, setExternalShareListError] = useState<boolean>(false);
    // 选中的统计数据的值
    const [externalStatisticTime, setExternalStatisticTime] = useState<number>(-1);
    // 统计数据列表
    const [externalShareList, setExternalShareList] = useState<ResponseExternalShareList>({
      shareDetails: [],
      totalDownloadCounts: 0,
      totalShareUrlCounts: 0,
      totalVisitCounts: 0, // 阅读次数
    });
    // -------------------------------------------------------------------------------------
    // 新建文件夹
    const [createDirVisible, setCreateDirVisible] = useState(false);
    const [createDirLoading, setCreateDirLoading] = useState(false);
    // 当个人空间没有使用权限时隐藏新建上传按钮
    const hideNewUpload = useMemo(() => {
      if (!diskPsR.private.includes('USE')) return true;
      return false;
    }, [diskPsR]);
    const { templateModalVisible, docType, hideTemplateModal, showTemplateModal, createSuccessHandle } = useTemplateModal(() => {
      getCurrentList({ init: true });
    });
    /**
     * 埋点后 在调用 展示 模板库 弹层组件
     */
    const showTemplateModalBefore = useCallback<Exclude<DiskHeadProps['templateModalShow'], undefined>>((eventFrom, docType) => {
      trackerTransitionCached.way = eventFrom;
      templateTrack({
        operaType: 'show',
        way: trackerTransitionCached.way,
      });
      showTemplateModal(docType ?? 'all');
    }, []);
    const [listLoading, setListLoading] = useState(false);
    const [currentList, setCurrentList] = useState<{
      total: number;
      list: any[];
    }>({ total: 0, list: [] });
    // todo
    const [currentDetail, setCurrentDetail] = useState<any>({});
    const [curDirInfo, setCurDirInfo] = useState({});
    const [uploadFailVisible, setUploadFailVisible] = useState<boolean>(false);
    const [uploadFailInfo, setUploadFailInfo] = useState<UploadFailInfo>({});
    const [highlightDirId, setHighlightDirId] = useState(0); // 新建文件夹后 高亮的id
    const uploadFileRef = useRef<HTMLInputElement>(null);
    const handleCancel = () => {
      setCreateDirVisible(false);
      setCreateDirLoading(false);
    };
    // 获取统计数据看板
    const loadStatisticBoard = async (period?: any) => {
      setExternalStatisticTimeLoading(true);
      const res = await nsShareApi.getNSExternalShareStatistic({ period: period || -1 });
      setExternalStatisticTimeLoading(false);
      setExternalShareStatisticCounts(res);
      setExternalStatisticTime(period || -1);
    };
    // 获取统计数据列表
    const loadStatisticList = async (params?: Partial<RequestGetExternalShareList>) => {
      const oldParams = externalShareListParams;
      if (params) {
        Object.keys(params).forEach(item => {
          oldParams[item] = params ? params[item] : oldParams[item];
        });
        setExternalShareListParams(oldParams);
      }
      if (!externalShareListLoading) {
        setExternalShareListLoading(true);
        try {
          const res = await nsShareApi.getNSExternalShareList(oldParams);
          setExternalShareListLoading(false);
          setExternalShareList(res);
        } catch (e) {
          setExternalShareListError(true);
          setExternalShareListLoading(false);
        }
      }
    };
    // 主页 / 统计数据
    const changeCurrentPage = page => {
      setCurrentPage(page);
    };
    const getCurrentList = useCallback(
      debounce(async (options: DiskListProps) => {
        if (listLoading) return;
        const { init, cb } = options;
        if (currentList.total <= currentList.list.length && !init) return;
        let page = init ? 1 : curRecentPage + 1;
        setListLoading(true);
        try {
          const data = await diskApi.listNSRecently({ page, pageSize }, { noEnqueue: options.noEnqueue });
          setListLoading(false);
          cb && cb();
          // 没有数据
          if (!(data?.recentlyUseRecords?.length > 0)) return;
          setCurRecentPage(page);
          let next = {
            total: data.totalCount,
            list: data.recentlyUseRecords.map(item => ({
              ...item,
              name: item.resourceName,
              id: item.resourceId,
              source: 'recently',
            })),
          };
          if (!init) {
            next = {
              total: data.totalCount,
              list: [...currentList.list, ...next.list],
            };
          }
          // 当前list数据
          setCurrentList(next);
        } catch (e) {
          cb && cb();
          console.log(getIn18Text('HUOQUZHUYENEI'), e);
          setListLoading(false);
        }
      }, 50),
      [curDirId, currentList.list, curRecentPage, listLoading]
    );
    const handleUploadDone = useCallback(
      (file: IUploadFile) => {
        getCurrentList({ init: true, noEnqueue: true });
        getRootInfo();
      },
      [getCurrentList, getRootInfo]
    );
    const createDir = folderName => {
      setCreateDirLoading(true);
      // 创建至个人文件夹根目录
      const dirId = curRootInfo.private?.id;
      diskApi
        .doCreateFolder({
          folderName,
          type: 'personal',
          dirId,
        })
        .then(({ id }) => {
          getCurrentList({ init: true });
          setCreateDirVisible(false);
          setHighlightDirId(id);
          setTimeout(() => {
            setHighlightDirId(0);
          }, 2000);
          // @ts-ignore
          message.success({
            content: getIn18Text('XINJIANWENJIANJIA11'),
          });
        })
        .finally(() => setCreateDirLoading(false));
    };
    // 删除列表项
    const afterDelete = id => {
      const list = currentList.list.filter(item => item.useRecordId !== id);
      const res = {
        ...currentList,
        list,
      };
      setCurrentList(res);
      getRootInfo();
    };
    const afterRename = (id, newName: string, updateTime = moment().format('YYYY-MM-DD HH:mm:ss')) => {
      const updateNameAndDate = item => {
        if (item?.id === id) {
          item.name = newName;
          item.updateTime = updateTime;
        }
        return item;
      };
      setCurrentList(pre => ({
        ...pre,
        list: currentList.list.map(updateNameAndDate),
      }));
    };
    const upload = _curDirInfo => {
      setCurDirInfo(_curDirInfo);
      uploadFileRef.current?.click();
    };
    const onFileClick = (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
      (e.target as any).value = '';
    };
    const closeModal = () => {
      setUploadFailVisible(false);
    };
    // 开始上传
    const startUploadFiles = (files: File[], dirId: number, diskType: NetStorageType) => {
      setVisibleUpload(true);
      // 上传回调（无论成功/失败）
      const cb = (file: UploadFile) => {
        if (file.status === UploadFileStatus.DONE) {
          setUploadFileItems(fileItems => fileItems.filter(item => item !== file).concat(file));
          getCurrentList({ init: true, noEnqueue: true });
          getRootInfo();
        } else if (file.status === UploadFileStatus.FAIL) {
          setUploadFileItems(fileItems => [file].concat(fileItems.filter(item => item !== file)));
        } else {
          setUploadFileItems(fileItems => fileItems.slice());
        }
      };
      const removeCb = (file: UploadFile) => {
        setUploadFileItems(fileItems => fileItems.filter(item => item !== file));
      };
      const fileItems: UploadFile[] = files.map(file => new UploadFile(file, dirId, diskType, cb, removeCb));
      setUploadFileItems(curFileItems => fileItems.concat(curFileItems));
      fileItems.forEach(item => item.startUpload());
    };
    // 上传文件
    const uploadFiles = (files?: File[], dirInfo?: any) => {
      // 主页上传，传至个人空间根目录
      const dirId = curRootInfo.private?.id;
      if (!dirId) return;
      if (files?.length) {
        // 上传文件总大小
        const fileSize = files.reduce((count, cur) => count + cur.size, 0);
        // 当前所属空间
        const rookDiskInfo = curRootInfo && curRootInfo.private;
        const diskRemainSize = rookDiskInfo.sizeLimit - rookDiskInfo.totalSize;
        if (rookDiskInfo && fileSize > diskRemainSize) {
          setUploadFailInfo({
            files,
            fileSize,
            limitType: 'disk',
            sizeLimit: diskRemainSize,
            onCancel: uploadFiles,
          });
          setUploadFailVisible(true);
        } else {
          startUploadFiles(files, dirId, 'personal');
        }
      }
    };
    const onFileChange = () => {
      const fileUploader = uploadFileRef.current;
      if (!fileUploader) {
        return;
      }
      const { files } = fileUploader;
      if (files?.length) {
        uploadFiles(Array.from(files));
      }
    };
    const changeDir = (item: NSDirContent) => {
      console.log('itemitem', item);
    };
    // 收藏/取消收藏
    const collectAction = async (params: { id: number; collect: boolean; type: 'folder' | 'file' }) => {
      // 收藏请求
      const collectReq = async (resourceId: number, resourceType: ResourceType, collect: boolean) => {
        try {
          const method = collect ? 'addFavorite' : 'removeFavorite';
          const res = await diskApi[method]({ resourceId, resourceType });
          if (res === true) {
            message.success({
              content: collect ? getIn18Text('YISHOUCANG') : getIn18Text('QUXIAOSHOUCANG'),
            } as ArgsProps);
          }
          return res === true;
        } catch (error) {
          message.fail(
            (
              error as {
                message: string;
              }
            ).message || (collect ? getIn18Text('SHOUCANGSHIBAI') : getIn18Text('QUXIAOSHOUCANGSHI'))
          );
          return false;
        }
      };
      const { id, collect, type } = params;
      setCurrentList({
        ...currentList,
        list: currentList.list.map(item => {
          if (item.id === id) return { ...item, starred: collect };
          return item;
        }),
      });
      const reqRes = await collectReq(id, type === 'folder' ? 'DIRECTORY' : 'FILE', collect);
      // 失败撤回
      if (!reqRes) {
        setCurrentList({
          ...currentList,
          list: currentList.list.map(item => {
            if (item.id === id) return { ...item, starred: !collect };
            return item;
          }),
        });
      }
    };
    // 页面滚动
    const onScrollCapture = e => {
      e.persist();
      if (e?.currentTarget?.querySelector) {
        const contentBody = document.getElementById('contentBody');
        if (contentBody && contentBody.scrollHeight - contentBody.scrollTop - contentBody.clientHeight < 300) {
          !listLoading && getCurrentList({});
        }
      }
    };

    useMsgRenderCallback('diskInnerCtc', async data => {
      const { eventData } = data;
      const { name, cb } = eventData;
      // 刷新
      if (name === 'refresh' || name === 'refreshMainPage') {
        try {
          if (currentPage === 'index') {
            setCurrentList({ ...currentList, list: [] });
            loadStatisticBoard();
            getCurrentList({ init: true, cb });
          } else if (currentPage === 'static') {
            setExternalShareList({ ...externalShareList, shareDetails: [] });
            loadStatisticList();
          }
        } catch (_) {
          cb();
        }
      }
    });
    useEffect(() => {
      getCurrentList({ init: true });
    }, []);
    useEffect(() => {
      if (!listLoading && !logMark) {
        console.log('performanceApi', `disk_load_${curSideTab}_end`);
        performanceApi.timeEnd({
          statKey: `disk_${curSideTab}_load_time`,
        });
        setLokMark(true);
      }
    }, [listLoading]);
    useEffect(() => {
      if (curUploadTriggerInfo && curSideTab === curUploadTriggerInfo.tab && !curUploadTriggerInfo.triggered) {
        uploadFileRef.current?.click();
        dispatch(
          DiskActions.setCurUploadTriggerInfo({
            tab: curSideTab,
            triggered: true,
          })
        );
      }
    }, [curUploadTriggerInfo]);
    useEffect(() => {
      if (currentPage === 'index') {
        setCurrentList({ ...currentList, list: [] });
        loadStatisticBoard();
        getCurrentList({ init: true });
      } else if (currentPage === 'static') {
        setExternalShareList({ ...externalShareList, shareDetails: [] });
        loadStatisticList();
      }
    }, [currentPage]);
    useEffect(() => {
      defaultRangeTime && setCurrentPage('static');
    }, [defaultRangeTime]);
    return (
      <div className={style.mainPage}>
        {/* 主页 */}
        {currentPage === 'index' && (
          <div className={style.indexPage}>
            <div className={style.contentHead}>
              {/* 主页头部 导航栏 以及 新建、上传按钮 */}
              <DiskHead
                bread={indexBread}
                defaultVisitRangeTime={defaultRangeTime}
                list={currentList.list}
                curDirId={curRootInfo.private?.id!}
                upload={upload}
                listLoading={listLoading}
                createDirShow={() => {
                  setCreateDirVisible(true);
                }}
                templateModalShow={showTemplateModalBefore}
                currentPage={currentPage}
                setCurrentPage={changeCurrentPage}
                externalShareStatisticCounts={externalShareStatisticCounts}
                changeExternalShareList={loadStatisticList}
                changeCurrentDetail={setCurrentDetail}
                getCurrentList={getCurrentList}
                setUploadFileItems={setUploadFileItems}
                onUploadDone={handleUploadDone}
                setVisibleUpload={setVisibleUpload}
                hideNewUpload={hideNewUpload}
              />
            </div>
            <div id="contentBody" className={style.restBody + ' sirius-scroll ant-allow-dark'} onScrollCapture={onScrollCapture}>
              {/* 互动统计 */}
              {currentPage === 'index' && (
                <StatisticCounts
                  curDirId={curRootInfo.private?.id!}
                  templateModalShow={showTemplateModalBefore}
                  setCurrentPage={changeCurrentPage}
                  externalShareStatisticCounts={externalShareStatisticCounts}
                  externalStatisticTimeLoading={externalStatisticTimeLoading}
                  changeExternalStatisticTime={loadStatisticBoard}
                  getCurrentList={getCurrentList}
                />
              )}
              <TemplateModal
                visible={templateModalVisible}
                docType={docType}
                curDirId={curRootInfo.private?.id!}
                spaceKind="personal"
                onCancel={hideTemplateModal}
                onSuccess={createSuccessHandle}
              />
              {currentList?.list?.length > 0 && (
                <div className={style.recentlyTitle} hidden={!currentList?.list?.length}>
                  {getIn18Text('ZUIJINWENJIAN')}
                </div>
              )}
              {/* 由内容或正在加载中,展示table或骨架屏 */}
              {(currentList?.list?.length > 0 || listLoading) && (
                <DiskTable
                  bread={indexBread}
                  sideTab={curSideTab}
                  rootInfo={curRootInfo}
                  contentWidth={curContWidth}
                  currentPage={currentPage}
                  setCurrentPage={changeCurrentPage}
                  type="personal"
                  list={currentList.list}
                  downloadAction={downloadAction}
                  listLoading={listLoading}
                  changeDir={changeDir}
                  uploadFiles={uploadFiles}
                  highlightDirId={highlightDirId}
                  afterDel={afterDelete}
                  afterRename={afterRename}
                  skeletonStyle={{ marginTop: '28px', height: 'calc(100% - 28px)' }}
                  collectAble
                  collectAction={collectAction}
                  scrollMode={1}
                  tableParams={{ sticky: { offsetHeader: 28 } }}
                  // 强制刷新
                  forceRefresh={() => {
                    getCurrentList({
                      init: true,
                    });
                  }}
                />
              )}

              {currentList?.list?.length === 0 && !listLoading && (
                <EmptyFolder
                  className={style.emptyPage}
                  isMainPage
                  withoutOperate={!(!externalShareStatisticCounts.shareUrlCounts && curSideTab === 'recently' && externalStatisticTime === -1)}
                  emptyTip={getIn18Text('ZANWUWENJIAN\uFF0C11')}
                  createDir={() => {
                    setCreateDirVisible(true);
                  }}
                  folderId={curRootInfo.private?.id}
                  folderType="personal"
                  refreshList={() => {
                    getCurrentList({
                      init: true,
                    });
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* 互动统计列表 */}
        {currentPage === 'static' && (
          <div className={style.statisticPage}>
            <StatisticHead defaultVisitRangeTime={defaultRangeTime} setCurrentPage={changeCurrentPage} changeExternalShareList={loadStatisticList} />
            <div className={style.restBody}>
              <StatisticTable
                visible
                visitTime={externalShareListParams.visitTime!}
                externalShareList={externalShareList}
                listLoading={externalShareListLoading}
                listLoadError={externalShareListError}
                loadListData={loadStatisticList}
              />
            </div>
          </div>
        )}

        {/* 运营通知 */}
        <Notification />

        {/* 新建文件夹model */}
        <CreateDir isModalVisible={createDirVisible} createDirLoading={createDirLoading} handleOk={createDir} handleCancel={handleCancel} />
        <input type="file" hidden multiple ref={uploadFileRef} onChange={onFileChange} onClick={onFileClick} />
        <UploadFailModal visible={uploadFailVisible} uploadFailInfo={uploadFailInfo} closeModal={closeModal} />
      </div>
    );
  }
);
export default MainPage;
