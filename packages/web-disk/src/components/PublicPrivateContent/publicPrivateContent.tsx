import React, { useEffect, useState, useRef, useImperativeHandle, useMemo, useCallback } from 'react';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apis, apiHolder, NetStorageApi, NetStorageType, NSDirContent, NSFileContent, apiHolder as api, ResourceType, PerformanceApi } from 'api';
import moment from 'moment';
import { ArgsProps } from 'antd/lib/message';
import DiskHead from '../DiskHead/diskHead';
import DiskTable from '../DiskTable';
import ExpandableFolders from './../ExpandableFolders/expandableFolders';
import CreateDir from '../CreateDir';
import { UploadFailModal, UploadFailInfo, UploadFile } from '../Upload';
import { UploadFileStatus, IUploadFile } from '../../upload';
import { Bread, DiskTab, tabInterfaceMap } from '../../disk';
import style from './publicPrivateContent.module.scss';
import { DiskActions, useAppSelector, useAppDispatch } from '@web-common/state/createStore';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import { formatAuthority } from '../../utils';
// eslint-disable-next-line import/no-duplicates
import { toastUploadPrivilegeError } from '../Upload';
import EmptyFolder from '../EmptyFolder';
import { TemplateModal } from '../TemplateModal';
import { useTemplateModal } from '../TemplateModal/useTemplateModal';
import { getIn18Text } from 'api';
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const performanceApi = apiHolder.api.requireLogicalApi(apis.performanceImpl) as unknown as PerformanceApi;
const eventApi = api.api.getEventApi();
const pageSize = 30;
const FolderPageSize = 100;
interface Props {
  getRootInfo: () => void;
  getPrivateRootInfo: () => Promise<NSDirContent | undefined>;
  setVisibleUpload: (val) => void; // 展示上传model
  downloadAction: (item, spaceId) => void;
  setUploadFileItems: (func) => void;
}
const PublicPrivateContent = React.forwardRef((props: Props, ref) => {
  const diskPsR = useAppSelector(state => state.diskReducer.diskPsR);
  const curSideTab = useAppSelector(state => state.diskReducer.curSideTab);
  const curRootInfo = useAppSelector(state => state.diskReducer.curRootInfo);
  const curContWidth = useAppSelector(state => state.diskReducer.curContWidth);
  const curSpaceState = useAppSelector(state => state.diskReducer.curSpaceState);
  const curUploadTriggerInfo = useAppSelector(state => state.diskReducer.curUploadTriggerInfo);
  const curDirId = useAppSelector(state => state.diskReducer.curDirId);
  // 何时正常展示
  const usual = useMemo(
    () => (curSideTab === 'private' && curSpaceState.private === 'normal') || (curSideTab === 'public' && curSpaceState.public === 'normal'),
    [curSpaceState, curSideTab]
  );
  const dispatch = useAppDispatch();
  const { getRootInfo, downloadAction, setVisibleUpload, setUploadFileItems, getPrivateRootInfo } = props;
  // 面包屑索引
  const [bread, setBread] = useState<Bread[]>([]);
  // 新建文件夹
  const [createDirVisible, setCreateDirVisible] = useState(false);
  const [createDirLoading, setCreateDirLoading] = useState(false);
  // 文件夹列表
  const [folderListLoading, setFolderListLoading] = useState<boolean>(false);
  const [folderList, setFolderList] = useState<NSDirContent[]>([]);
  const [folderCount, setFolderCount] = useState<number>(0);
  const [expanded, setExpanded] = useState<boolean>(false);
  // 文件列表
  const [fileListLoading, setFileListLoading] = useState<boolean>(false);
  const [fileList, setFileList] = useState<NSFileContent[]>([]);
  const [noMoreFile, setNoMoreFile] = useState<boolean>(false);
  const [filePage, setFilePage] = useState<number>(1);
  const [folderPage, setFolderPage] = useState<number>(1);
  const [currentDetail, setCurrentDetail] = useState<any>({});
  const [curDirInfo, setCurDirInfo] = useState({});
  const [uploadFailVisible, setUploadFailVisible] = useState<boolean>(false);
  const [uploadFailInfo, setUploadFailInfo] = useState<UploadFailInfo>({});
  const [highlightDirId, setHighlightDirId] = useState(0); // 新建文件夹后 高亮的id
  const uploadFileRef = useRef<HTMLInputElement>(null);
  const [showMask, setShowMask] = useState<boolean>(false);
  const publicPrivateRef = useRef<HTMLDivElement>(null);
  const dragMaskRef = useRef<HTMLDivElement>(null);
  const lastBread = useMemo(() => (bread?.length ? bread[bread.length - 1] : null), [bread]);
  const reqType = useMemo(() => tabInterfaceMap[(curSideTab as 'private') || 'private'], [curSideTab]);
  const [logMark, setLogMark] = useState<boolean>(false);
  const handleCancel = () => {
    setCreateDirVisible(false);
    setCreateDirLoading(false);
  };
  const updateBread = (tabName: DiskTab) => {
    // 获取目录列表
    diskApi
      .getDirPathInfoUsingGET({
        dirId: curDirId as number,
        type: tabInterfaceMap[(tabName as 'private') || 'public'],
      })
      .then(({ itemList }) => {
        setBread(() => {
          const newBread = itemList.map(i => ({
            id: i.dirId,
            name: i.dirName,
          }));
          return newBread;
        });
      });
  };
  const changeCurrentDirId = (dirId: number) => {
    dispatch(DiskActions.setCurDirId(dirId));
  };
  // 获取下一页文件夹
  // 自累加
  const getFolders = async ({ init = false }) => {
    // if (folderListLoading) return;
    const params = {
      type: reqType,
      parentDirId: curDirId,
      page: init ? 1 : folderPage + 1,
      pageSize: FolderPageSize,
      sort: 'updateTime',
    };
    try {
      setFolderListLoading(true);
      const res = await diskApi.listDir(params);
      // 请求过程中dirid变了，本次请求作废
      if (params.parentDirId !== curDirId) return;
      if (res) {
        const { list = [], count } = res;
        const folderl = list.map(item => ({ ...item, extensionType: 'dir' }));
        setFolderCount(count);
        if (init) {
          setFolderList(folderl);
          setFolderPage(1);
        } else if (list.length > 0) {
          setFolderList([...folderList, ...folderl]);
          setFolderPage(folderPage + 1);
        }
      }
      setFolderListLoading(false);
    } catch (err) {
      setFolderListLoading(false);
      // eslint-disable-next-line no-console
      console.log(getIn18Text('HUOQUWENJIANJIA'), err);
      message.error({
        content:
          (
            err as {
              message: string;
            }
          ).message || getIn18Text('HUOQUWENJIANJIA'),
      });
    }
  };
  // 刷新文件夹
  const refreshFolder = () => {
    // 收起 获取第一页
    // todo 有问题 ！
    setExpanded(false);
    getFolders({ init: true });
  };
  // 获取文件列表
  // 自累加
  const getFileList = async ({ init = false }) => {
    // 没有更多且已非初始
    if (noMoreFile && !init) return;
    const params = {
      type: reqType,
      parentDirId: curDirId,
      page: init ? 1 : filePage + 1,
      pageSize,
    };
    try {
      setFileListLoading(true);
      const res = await diskApi.listFile(params);
      // 请求过程中dirid变了，本次请求作废
      if (params.parentDirId !== curDirId) return;
      const { list = [], lastPage } = res;
      if (init) {
        setFileList(list);
        setFilePage(1);
      } else if (list.length > 0) {
        setFileList([...fileList, ...list]);
        setFilePage(filePage + 1);
      }
      setFileListLoading(false);
      setLogMark(true);
      setNoMoreFile(lastPage);
    } catch (err) {
      setFileListLoading(false);
      // eslint-disable-next-line no-console
      console.log(getIn18Text('HUOQUWENJIANLIE'), err);
      message.error({
        content:
          (
            err as {
              message: string;
            }
          ).message || getIn18Text('HUOQUWENJIANLIE'),
      });
    }
  };
  const { templateModalVisible, docType, showTemplateModal, hideTemplateModal, createSuccessHandle } = useTemplateModal(() => {
    getFileList({ init: true });
  }, [getFileList]);
  /**
   * 埋点后 在调用 展示 模板库 弹层组件
   */
  const showTemplateModalImpl = useCallback(
    (eventFrom, docType) => {
      showTemplateModal(docType);
    },
    [showTemplateModal]
  );
  // 完成新建
  const handleUploadDone = useCallback(
    (file: IUploadFile) => {
      getFileList({ init: true });
      getRootInfo();
    },
    [getFileList]
  );
  const changeDir = item => {
    changeCurrentDirId(item.id);
  };
  // 创建文件夹
  const createDir = folderName => {
    setCreateDirLoading(true);
    const dirId = curDirId as number;
    diskApi
      .doCreateFolder({
        folderName,
        type: reqType,
        dirId,
      })
      .then(({ id }) => {
        refreshFolder();
        setCreateDirVisible(false);
        setHighlightDirId(id);
        setTimeout(() => {
          setHighlightDirId(0);
        }, 2000);
        message.success({
          content: getIn18Text('XINJIANWENJIANJIA11'),
        } as ArgsProps);
      })
      .finally(() => setCreateDirLoading(false));
  };
  // 删除文件夹
  const afterDelFolder = id => {
    setFolderList(folderList.filter(item => item.id !== id));
    getRootInfo();
    eventApi.sendSysEvent({
      eventName: 'diskInnerCtc',
      eventStrData: '',
      eventData: {
        name: 'delDir1',
        id,
        sideTab: curSideTab,
      },
    });
  };
  // 删除文件
  const afterDelFile = id => {
    setFileList(fileList.filter(item => item.id !== id));
    getRootInfo();
  };
  const updateNameAndDate = (item, id, newName, updateTime) => {
    if (item?.id === id) {
      return {
        ...item,
        name: newName,
        updateTime,
      };
    }
    return item;
  };
  // 重命名文件夹后
  const afterRenameFolder = (id, newName: string, updateTime, parentId) => {
    setFolderList(folderList.map(item => updateNameAndDate(item, id, newName, updateTime)));
  };
  // 重命名文件后
  const afterRenameFile = (id, newName: string, updateTime = moment().format('YYYY-MM-DD HH:mm:ss')) => {
    setFileList(fileList.map(item => updateNameAndDate(item, id, newName, updateTime)));
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
        if (dirId === curDirId) {
          // 仍然在同一目录下
          getFileList({ init: true });
        }
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
    const dirId = curDirId;
    if (!dirId) {
      return;
    }
    // ??
    const currentDirInfo = currentDetail || dirInfo || curDirInfo;
    // 目标文件夹可容纳尺寸（-1无限制）
    const sizeLimit = currentDirInfo?.sizeLimit;
    if (files?.length) {
      // 上传文件总大小
      const fileSize = files.reduce((count, cur) => count + cur.size, 0);
      // 当前所属空间
      const rookDiskInfo = curRootInfo && curRootInfo[curSideTab];
      const dirRemainSize = sizeLimit !== -1 ? sizeLimit - currentDirInfo?.totalSize : fileSize;
      const diskRemainSize = rookDiskInfo.sizeLimit - rookDiskInfo.totalSize;
      // 当前文件夹容量超限
      if (currentDirInfo && fileSize > dirRemainSize) {
        setUploadFailInfo({
          files,
          fileSize,
          limitType: 'dir',
          sizeLimit: dirRemainSize,
          onCancel: uploadFiles,
        });
        setUploadFailVisible(true);
        // 空间容量超限
      } else if (rookDiskInfo && fileSize > diskRemainSize) {
        setUploadFailInfo({
          files,
          fileSize,
          limitType: 'disk',
          sizeLimit: diskRemainSize,
          onCancel: uploadFiles,
        });
        setUploadFailVisible(true);
      } else {
        startUploadFiles(files, dirId, tabInterfaceMap[curSideTab]);
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
  // 滚动加载
  const onScrollCapture = e => {
    const { target } = e;
    const { scrollHeight, scrollTop, clientHeight } = target as HTMLDivElement;
    // 展开时 快碰到文件夹内容的底部 加载下一页
    if (expanded) {
      const folderAreaEle = document.getElementById('folderArea');
      if (folderAreaEle && folderAreaEle.clientHeight - scrollTop - clientHeight < 300) {
        !folderListLoading && getFolders({ init: false });
      }
    }
    // 快要触底 加载下一页文件
    if (scrollHeight - scrollTop - clientHeight < 30) {
      !fileListLoading && getFileList({ init: false });
    }
  };
  // 展开时 用文件夹铺满屏幕
  const coverScreen = async () => {
    // 已加载完 没有可以继续加载的了
    if (folderList.length >= folderCount) return;
    // 内容容器
    const viewport = document.getElementById('contentBody');
    if (viewport) {
      const folderAreaEle = document.getElementById('folderArea');
      const { clientHeight: clientHeightF } = folderAreaEle as HTMLDivElement;
      const { clientHeight: clientHeightV, scrollTop: scrollTopV } = viewport as HTMLDivElement;
      // 需要被铺满的高度
      const fillHeight = clientHeightV - (clientHeightF - scrollTopV);
      // 已满
      if (fillHeight < 0) return;
      // 未满
      const folder0 = document.getElementById('folder0');
      const { clientWidth: clientWidth0, clientHeight: clientHeight0 } = folder0 as HTMLDivElement;
      const everyRowNum = Math.floor(curContWidth / (clientWidth0 + 12));
      // 铺满所需的个数
      const fillNum = Math.ceil(fillHeight / (clientHeight0 + 12)) * everyRowNum;
      // 铺满需要的页数
      const fillPageNum = Math.ceil(fillNum / FolderPageSize);
      const targetPageNum = folderPage + fillPageNum;
      // 请求后面的页面
      const params = {
        type: reqType,
        parentDirId: curDirId,
        pageSize: FolderPageSize,
        sort: 'updateTime',
      };
      let prePage = folderPage;
      let tmp = fillPageNum;
      const getReqs = () => {
        const reqs = [];
        while (tmp > 0) {
          prePage += 1;
          reqs.push(diskApi.listDir({ ...params, page: prePage }));
          tmp -= 1;
        }
        return reqs;
      };
      setFolderListLoading(true);
      Promise.all([...getReqs()])
        .then(values => {
          const newFolders = values.reduce((total: any[], curValue: any) => [...total, ...curValue.list], []);
          setFolderList([...folderList, ...newFolders]);
          setFolderCount(values[0].count);
          setFolderPage(targetPageNum);
          setFolderListLoading(false);
        })
        .catch(error => {
          // eslint-disable-next-line no-console
          console.log(getIn18Text('ZHANKAISHIBAI'), error);
          setFolderListLoading(false);
          message.error({ content: getIn18Text('ZHANKAISHIBAI') });
        });
    }
  };
  // 展开文件夹
  const expandFolder = (val: boolean) => {
    // 收起
    if (!val) {
      setExpanded(false);
      return;
    }
    // 展开 铺满
    coverScreen();
    setExpanded(true);
  };
  // 强制刷新
  const forceRefresh = async () => {
    await Promise.allSettled([getFolders({ init: true }), getFileList({ init: true })]);
  };
  // 尝试重新开通
  const retryOpen = async () => {
    try {
      await diskApi.initPersonalSpace();
      // 开通成功 获取个人根目录信息
      const priRes = await getPrivateRootInfo();
      if (priRes?.id) {
        dispatch(DiskActions.setCurRootInfo({ ...curRootInfo, private: priRes }));
        // 通过重新设置dirId的方式触发刷新
        dispatch(DiskActions.setCurDirId(priRes?.id));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(getIn18Text('KAITONGSHIBAI'), error);
      message.error({ content: getIn18Text('KAITONGSHIBAI') });
    }
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
        message.error(
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
    // 文件夹
    if (type === 'folder') {
      setFolderList(
        folderList.map(item => {
          if (item.id === id) return { ...item, starred: collect };
          return item;
        })
      );
      const reqRes = await collectReq(id, 'DIRECTORY', collect);
      // 失败撤回
      if (!reqRes) {
        setFolderList(
          folderList.map(item => {
            if (item.id === id) return { ...item, starred: !collect };
            return item;
          })
        );
      }
    }
    // 文件
    if (type === 'file') {
      setFileList(
        fileList.map(item => {
          if (item.id === id) return { ...item, starred: collect };
          return item;
        })
      );
      const reqRes = await collectReq(id, 'FILE', collect);
      // 失败撤回
      if (!reqRes) {
        setFileList(
          fileList.map(item => {
            if (item.id === id) return { ...item, starred: !collect };
            return item;
          })
        );
      }
    }
  };
  // 拖拽上传
  // 拖进
  const onDragover = (e: DragEvent) => {
    if (showMask) return;
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    // 非文件
    if (dt && dt.items && dt.items[0]?.kind !== 'file') return;
    setShowMask(true);
  };
  // 脱离蒙层
  const onDragleave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMask(false);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    if (dt) {
      const dropFiles: File[] = [];
      Array.from(dt.items).forEach(item => {
        if (item && item?.kind === 'file' && (item as any).webkitGetAsEntry().isFile) {
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
        const curBread = bread;
        const dir = curBread?.length && curBread[curBread.length - 1];
        if (!dir) return;
        if (curSideTab === 'private') {
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
              setShowMask(false);
            })
            .catch(() => {
              setShowMask(false);
            });
        }
      }
    }
    setShowMask(false);
  };
  const refOnDrop = useRef(onDrop);
  refOnDrop.current = onDrop;
  const onDropCb = (e: DragEvent) => refOnDrop.current(e);
  useEffect(() => {
    setLogMark(false);
    const publicPrivate = publicPrivateRef.current;
    const dragMask = dragMaskRef.current;
    publicPrivate?.addEventListener('dragover', onDragover);
    dragMask?.addEventListener('dragleave', onDragleave);
    publicPrivate?.addEventListener('drop', onDropCb);
    return () => {
      publicPrivate?.removeEventListener('dragover', onDragover);
      dragMask?.removeEventListener('dragleave', onDragleave);
      publicPrivate?.removeEventListener('drop', onDropCb);
    };
  }, []);
  // -------------------
  useImperativeHandle(ref, () => ({
    // 搜索结果页点击跳转
    changeCurrentDir: (newSideTab, dirId) => {
      if (curSideTab === newSideTab) {
        changeCurrentDirId(dirId);
      }
    },
  }));
  // 当状态正常且sidetab，dirId发生变化，刷新页面
  useEffect(() => {
    if (usual && curDirId && curDirId >= -1 && ['public', 'private'].includes(curSideTab)) {
      setFileList([]);
      setFolderList([]);
      updateBread(curSideTab);
      getFolders({ init: true });
      getFileList({ init: true });
    }
  }, [curDirId, curSideTab, usual]);
  useEffect(() => {
    // 每次空间切换 都得检查权限
    eventApi.sendSysEvent({
      eventName: 'diskInnerCtc',
      eventStrData: '',
      eventData: { name: 'checkPrivilege' },
    });
    setLogMark(false);
    // 当用户希望进入个人空间但没有个人空间的使用权限 去首页
    if (curSideTab === 'private' && !diskPsR.private.includes('USE')) {
      message.error({ content: getIn18Text('ZANWUGERENKONG') });
      dispatch(DiskActions.setCurSideTab('recently'));
      dispatch(DiskActions.setCurDirId(null));
    }
    // 当用户希望进入企业空间但没有企业空间的使用权限 去首页
    if (curSideTab === 'public' && !diskPsR.public.includes('USE')) {
      message.error({ content: getIn18Text('ZANWUQIYEKONG') });
      dispatch(DiskActions.setCurSideTab('recently'));
      dispatch(DiskActions.setCurDirId(null));
    }
  }, [curSideTab]);
  useEffect(() => {
    if (logMark) {
      console.log('performanceApi', `disk_load_${curSideTab}_end`);
      performanceApi.timeEnd({
        statKey: `disk_${curSideTab}_load_time`,
      });
    }
  }, [logMark]);
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
  useMsgRenderCallback('diskInnerCtc', async data => {
    const { eventData } = data;
    const { name } = eventData;
    // 刷新
    if (name === 'refresh') {
      const { cb } = eventData;
      try {
        setFolderList([]);
        setFolderCount(0);
        setFileList([]);
        await forceRefresh();
        cb();
      } catch (_) {
        cb();
      }
    }
    // 删除文件夹
    if (name === 'delDir') {
      const { id } = eventData;
      if (curDirId === id) {
        forceRefresh();
      }
      // 找到目标 删除
      if (folderList) {
        const targetIndex = folderList.findIndex(item => item.id === id);
        const tmp = [...folderList];
        tmp.splice(targetIndex, 1);
        setFolderList(tmp);
      }
    }
    // 重命名文件夹
    if (name === 'renameDir') {
      const { id } = eventData;
      if (curDirId === id) {
        updateBread(curSideTab);
      }
      // 找到目标 更改
      folderList &&
        setFolderList(
          folderList.map(item => {
            if (item.id === id) {
              return {
                ...item,
                name: eventData.newName,
              };
            }
            return item;
          })
        );
    }
    // 移动文件夹
    if (name === 'moveDir') {
      const { from, to } = eventData;
      if (curDirId === from) {
        updateBread(curSideTab);
      }
      if (folderList && folderList.find(item => item.id === from)) {
        refreshFolder();
      }
      if (curDirId === to) {
        refreshFolder();
      }
    }
  });
  const isFolder = !!currentDetail.parentId; // 是否是文件夹
  const isPublicTab = curSideTab === 'public';
  const isPrivateTab = curSideTab === 'private';
  const emptyTip =
    isPrivateTab && !isFolder ? getIn18Text('ZANWUWENJIAN\uFF0C12') : isPublicTab && !isFolder ? getIn18Text('ZANWUWENJIAN\uFF0C13') : getIn18Text('ZANWUWENJIAN\uFF0C');
  return (
    <div className={style.publicPrivateContent} ref={publicPrivateRef}>
      {/* 拖拽蒙层 */}
      <div id="drag-mask" className={style.dragMask} ref={dragMaskRef} draggable="true" hidden={!showMask}>
        <div className={style.dashArea}>
          <p className={style.dragIntro}>{`上传到 "${lastBread ? lastBread.name : ''}"`}</p>
        </div>
      </div>
      {
        // 正常情况下
        usual && (
          <>
            <div className={style.contentHead}>
              {/* 导航栏 以及 新建、上传按钮 */}
              <DiskHead
                bread={bread}
                list={[...folderList, ...fileList]}
                upload={upload}
                curDirId={+curDirId!}
                listLoading={fileListLoading}
                createDirShow={() => {
                  setCreateDirVisible(true);
                }}
                templateModalShow={showTemplateModalImpl}
                setCurrentDirId={changeCurrentDirId}
                changeCurrentDetail={setCurrentDetail}
                getCurrentList={getFileList}
                setUploadFileItems={setUploadFileItems}
                onUploadDone={handleUploadDone}
                setVisibleUpload={setVisibleUpload}
              />
            </div>

            <div id="contentBody" className={style.restBody + ' sirius-scroll'} onScrollCapture={onScrollCapture}>
              <div id="folderArea">
                {folderList?.length > 0 && <h6 className={style.foldersTitle}>{getIn18Text('WENJIANJIA')}</h6>}
                <ExpandableFolders
                  type={tabInterfaceMap[curSideTab]}
                  loading={folderListLoading}
                  folders={folderList}
                  folderCount={folderCount}
                  downloadAction={downloadAction}
                  forceRefresh={forceRefresh}
                  afterRenameFolder={afterRenameFolder}
                  afterDelFolder={afterDelFolder}
                  expanded={expanded}
                  expandFolder={expandFolder}
                  collectAction={collectAction}
                />
              </div>

              {fileList?.length > 0 && <h6 className={style.fileTitle}>{getIn18Text('WENJIANLIEBIAO')}</h6>}

              <DiskTable
                bread={bread}
                sideTab={curSideTab}
                contentWidth={curContWidth}
                rootInfo={curRootInfo}
                type={tabInterfaceMap[curSideTab]}
                list={fileList}
                downloadAction={downloadAction}
                listLoading={fileListLoading}
                changeDir={changeDir}
                uploadFiles={uploadFiles}
                highlightDirId={highlightDirId}
                afterDel={afterDelFile}
                afterRename={afterRenameFile}
                forceRefresh={forceRefresh}
                scrollMode={1}
                skeletonStyle={{ flex: 1, marginTop: '28px' }}
                collectAble
                collectAction={collectAction}
              />

              {!fileListLoading && !folderListLoading && folderList.length === 0 && fileList.length === 0 && (
                <EmptyFolder
                  className={style.emptyPage}
                  refreshList={forceRefresh}
                  createDir={() => {
                    setCreateDirVisible(true);
                  }}
                  folderId={Number(curDirId)}
                  folderType={tabInterfaceMap[curSideTab]}
                  emptyTip={emptyTip}
                />
              )}
            </div>

            {/* 新建文件夹model */}
            <CreateDir isModalVisible={createDirVisible} createDirLoading={createDirLoading} handleOk={createDir} handleCancel={handleCancel} />
            <input type="file" hidden multiple ref={uploadFileRef} onChange={onFileChange} onClick={onFileClick} />
            {/* 上传失败 */}
            <UploadFailModal visible={uploadFailVisible} uploadFailInfo={uploadFailInfo} closeModal={closeModal} />
          </>
        )
      }
      {
        // 异常情况下
        !usual && (
          <>
            {/* 个人空间被锁 */}
            {curSideTab === 'private' && curSpaceState.private === 'locked' && (
              <div className={style.lock}>
                <div className="sirius-empty" />
                <div className={style.lockDesc}>
                  {getIn18Text('GERENKONGJIANYI')}
                  <br />
                  {getIn18Text('DANGQIANBANBENZAN')}
                </div>
                <div className={style.lockDeal}>
                  {getIn18Text('KEQIANWANGJIUBAN')}
                  <a href="https://qiye.163.com/login/" target="_blank" rel="noreferrer">
                    qiye.163.com/login
                  </a>
                </div>
              </div>
            )}
            {/* 个人空间未开通 */}
            {curSideTab === 'private' && curSpaceState.private === 'noOpen' && (
              <div className={style.lock}>
                <div className="sirius-empty" />
                <div className={style.lockDesc}>{getIn18Text('JIAZAISHIBAI')}</div>
                <div className={style.restart} onClick={retryOpen}>
                  {getIn18Text('ZHONGSHI')}
                </div>
              </div>
            )}
            {/* 企业空间未开通 */}
            {curSideTab === 'public' && curSpaceState.public === 'noOpen' && (
              <div className={style.lock}>
                <div className="sirius-empty" />
                <div className={style.lockDesc}>{getIn18Text('WEIKAITONGQIYE')}</div>
              </div>
            )}
          </>
        )
      }
      {/* 模板库弹层组件 */}
      <TemplateModal
        visible={templateModalVisible}
        docType={docType}
        curDirId={curDirId!}
        spaceKind={tabInterfaceMap[curSideTab]}
        onCancel={hideTemplateModal}
        onSuccess={createSuccessHandle}
      />
    </div>
  );
});
export default PublicPrivateContent;
