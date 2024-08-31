/* eslint-disable consistent-return */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { Modal } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import {
  util,
  apis,
  apiHolder as api,
  NetStorageApi,
  NSDirContent,
  NSFileContent,
  RequestNSCommonFolderId,
  FileApi,
  SystemApi,
  ProductAuthApi,
  RequestNSCommonId,
  FileAttachModel,
  FsSaveRes,
  NetStorageType,
  PerformanceApi,
  inWindow,
  ModulePs,
} from 'api';
import { DiskAuthKeys, DiskFullAuths, DiskTab, electronDownloadProp, RootInfo, tabInterfaceMap, transDiskPrivileges } from './disk';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import SideContentLayout from '@/layouts/Main/sideContentLayout';
import { useEventObserver } from '@web-common/hooks/useEventObserver';
import SideContent from './components/SideContent';
import PublicPrivateContent from './components/PublicPrivateContent/publicPrivateContent';
import ShareWithMe from './components/ShareWithMe/shareWithMe';
import CloudAttCont from './components/CloudAttCont/cloudAttCont';
import Recycle from './components/Recycle/recycle';
import { formatFileSize, toFixed } from '@web-common/utils/file';
import Download from './components/Download';
import MainPage from './components/MainPage/mainPage';
import { DownloadFileStatus, DownloadDisk, IUploadFile } from './upload';
import FileList from './components/FileList/fileList';
import { getBodyFixHeight } from '@web-common/utils/constant';
import style from './index.module.scss';
import { DiskActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import UserWelcome from './components/UserWelcome/index';
import Favorites from './components/Favorites/favorites';
import NormalAtt from './components/NormalAtt/normalAtt';
import { getValidStoreWidth } from '@web-common/utils/utils';
import { getIn18Text } from 'api';
const eventApi = api.api.getEventApi();
const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const productAuthApi = api.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const performanceApi = api.api.requireLogicalApi(apis.performanceImpl) as unknown as PerformanceApi;
const fileApi = api.api.getFileApi() as FileApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
interface PageProps {
  name: string;
  tag: string;
  icon: any;
}
// 后端接口字段转换
export const tabInterfaceDownloadMap = {
  private: 'PERSONAL',
  public: 'QIYE',
  share: 'SHARE', // 分享页
};
const bizCodeSideTabMap = {
  qiye: 'public',
  personal: 'private',
  personal_share: 'share',
};
interface DiskDownloadProps {
  id: number;
  parentId: number;
  extensionType: string;
  name: string;
  totalSize: number;
  spaceId: number;
  // 用于主页
  resourceId?: number;
  resourceParentId?: number;
}
const STORE_DISK_TREE_WIDTH = 'STORE_DISK_TREE_WIDTH';
const storeApi = api.api.getDataStoreApi();
const Disk: React.FC<PageProps> = () => {
  const curRootInfo = useAppSelector(state => state.diskReducer.curRootInfo);
  const curUploadFileItems = useAppSelector(state => state.diskReducer.curUploadFileItems);
  const curSideTab = useAppSelector(state => state.diskReducer.curSideTab);
  const curContWidth = useAppSelector(state => state.diskReducer.curContWidth);
  const curActiveKey = useAppSelector(state => state.globalReducer.activeKey);
  const diskPs = useAppSelector(state => state.diskReducer.diskPs);
  const diskPsR = useAppSelector(state => state.diskReducer.diskPsR);
  const isNewUser = useAppSelector(state => state.diskReducer.isNewUser);
  const [fileItems, setFileItems] = useState<DownloadDisk[]>([]);
  const [visibleUpload, setVisibleUpload] = useState(false);
  const [userWelcomeVisible, setUserWelcomeVisible] = useState(false);
  const [uploadFileItems, setUploadFileItems] = useState<IUploadFile[]>([]);
  const [uploadSuspendVisible, setUploadSuspendVisible] = useState(false);
  const [downloadSuspendVisible, setDownloadSuspendVisible] = useState(false);
  const [defaultTreeWidth, setDefaultTreeWidth] = useState<number>(220);
  const tableRef = useRef<any>(null);
  const sideContentRef = useRef<any>(null);
  const publicPrivateRef = useRef<any>(null);
  const shareRef = useRef<any>(null);
  const cloudAttRef = useRef<any>(null);
  const normalAttRef = useRef<any>(null);
  const firstIntoDisk = useRef(true); // 首次进入网盘
  let defaultRangeTime: Array<number>;
  let anchorFolder: Record<string, string>;
  if (inWindow()) {
    defaultRangeTime = history?.state?.defaultRangeTime;
    anchorFolder = history?.state?.anchorFolder;
  }
  const [gettingRootInfo, setGettingRootInfo] = useState<boolean>(false);
  const [refreshModalShow, setRefreshModalShow] = useState<boolean>(false);
  const [initSuc, setInitSuc] = useState<boolean>(false); // 初始化成功
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(DiskActions.setCurUploadFileItems(uploadFileItems));
  }, [uploadFileItems]);
  useEffect(() => {
    curUploadFileItems && setUploadFileItems(curUploadFileItems);
  }, []);
  useEffect(() => {
    const visible = isNewUser;
    setUserWelcomeVisible(visible);
  }, [isNewUser]);
  // 企业空间基本信息
  const getEntRootInfo = async (): Promise<NSDirContent | undefined> => {
    try {
      const entRoot = await diskApi.doGetNSFolderInfo({ type: 'ent' });
      dispatch(DiskActions.setSpaceState({ public: 'normal' }));
      return entRoot;
    } catch (err) {
      console.log(getIn18Text('QIYEKONGJIANJI'), err);
      // 企业空间未开通
      if (err.data.code === 10403) {
        dispatch(DiskActions.setSpaceState({ public: 'noOpen' }));
      } else {
        message.error({ content: getIn18Text('QIYEKONGJIANJI'), duration: 4 });
      }
      // eslint-disable-next-line no-useless-return
      return;
    }
  };
  // 个人空间基本信息
  const getPrivateRootInfo = async (): Promise<NSDirContent | undefined> => {
    try {
      const isLocked = await diskApi.isLockEnabledUsingGET();
      if (isLocked) {
        dispatch(DiskActions.setSpaceState({ private: 'locked' }));
        return;
      }
      const privateInfo = await diskApi.doGetNSFolderInfo({ type: 'personal' });
      dispatch(DiskActions.setSpaceState({ private: 'normal' }));
      // eslint-disable-next-line consistent-return
      return privateInfo;
    } catch (err) {
      console.log(getIn18Text('GERENKONGJIANJI'), err);
      // 个人空间未开通
      if (err.data.code === 10403) {
        dispatch(DiskActions.setSpaceState({ private: 'noOpen' }));
      } else {
        message.error({ content: getIn18Text('GERENKONGJIANJI'), duration: 4 });
      }
      // eslint-disable-next-line no-useless-return
      return;
    }
  };
  // 云附件空间基本信息
  const getCloudAttRootInfo = async (): Promise<NSDirContent | undefined> => {
    try {
      const cloudAttInfo = await diskApi.doGetNSFolderInfo({ type: 'cloudAtt' });
      // eslint-disable-next-line consistent-return
      return cloudAttInfo;
    } catch (err) {
      console.log(getIn18Text('YUNFUJIANKONGJIAN11'), err);
      message.error({ content: getIn18Text('YUNFUJIANKONGJIAN11'), duration: 4 });
      // eslint-disable-next-line no-useless-return
      return;
    }
  };
  // 获取根目录信息 包括 空间根目录id 当前容量
  const getRootInfo = async (privileges?: ModulePs[]) => {
    if (gettingRootInfo) return;
    const privilegesReadable = privileges ? transDiskPrivileges(privileges) : null;
    const publicP = async () => {
      if ((privilegesReadable || diskPsR).public.includes('USE')) {
        try {
          const tmp = await getEntRootInfo();
          return tmp;
        } catch (error) {
          return null;
        }
      } else {
        return null;
      }
    };
    const privateP = async () => {
      if ((privilegesReadable || diskPsR).private.includes('USE')) {
        try {
          const tmp = await getPrivateRootInfo();
          return tmp;
        } catch (error) {
          return null;
        }
      } else {
        return null;
      }
    };
    setGettingRootInfo(true);
    return Promise.allSettled([publicP(), privateP(), getCloudAttRootInfo()])
      .then(resArr => {
        setGettingRootInfo(false);
        const latestRootInfo: RootInfo = {};
        resArr[0]?.status === 'fulfilled' && resArr[0].value && (latestRootInfo.public = resArr[0].value as unknown as NSDirContent);
        resArr[1]?.status === 'fulfilled' && resArr[1].value && (latestRootInfo.private = resArr[1].value as unknown as NSDirContent);
        resArr[2]?.status === 'fulfilled' && resArr[2].value && (latestRootInfo.cloudAtt = resArr[2].value as unknown as NSDirContent);
        dispatch(DiskActions.setCurRootInfo({ ...latestRootInfo }));
      })
      .catch(err => {
        setGettingRootInfo(false);
        console.log(getIn18Text('CHUSHIHUAKONGJIAN'), err);
        return false;
      });
  };
  const sideTabChange = (val: DiskTab) => {
    // 侧边栏切换tab触发
    dispatch(DiskActions.setCurSideTab(val));
  };
  const setTableSize = () => {
    const contWidth = tableRef?.current?.clientWidth || 0;
    dispatch(DiskActions.setCurContWidth(contWidth));
  };
  const debounceResizeSideContent = useCallback(
    debounce((_, data) => {
      //  调整左侧宽度，保存width into storage
      try {
        const {
          size: { width },
        } = data;
        storeApi.putSync(STORE_DISK_TREE_WIDTH, width, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' });
      } catch (e) {
        console.log('debounceResizeTable error', e);
      }
    }, 300),
    []
  );
  const debounceResizeTable = useCallback(
    debounce(() => {
      setTableSize();
    }, 300),
    []
  );

  const changeFileItems = (_fileItems: IUploadFile[]) => {
    setUploadFileItems(_fileItems);
  };
  // 启用electron下载
  const electronDownload = async (content: electronDownloadProp, fileUrl: string) => {
    const { id, name, extensionType, size, resourceSize, totalSize } = content;
    const itemId = id + new Date().getTime();
    const itemSize = size || resourceSize || totalSize; // todo 得做差异抹平...
    // 下载列表子项 用于下载列表展示
    const fileItem: DownloadDisk = {
      status: DownloadFileStatus.DOWNLOADING,
      id: itemId,
      name,
      fileType: extensionType,
      originSize: itemSize as number,
      fileSize: formatFileSize(itemSize as number),
      diskType: tabInterfaceMap[curSideTab],
      downloadSpeed: '0kb/s',
      fileUrl,
      progress: 1,
      cancel: () => {
        // eslint-disable-next-line no-console
        console.warn('abortFsDownload click', fileUrl);
        fileApi.abortFsDownload(fileUrl);
      },
      lastTime: new Date().getTime(),
    };
    const params: FileAttachModel = {
      fileUrl,
      fileName: name,
      fileSize: itemSize as number,
      fileSourceType: 1,
    };
    // 弹窗确认
    const data = (await fileApi.saveDownload(params, { saveAndDownload: false })) as FsSaveRes;
    if (data.success) {
      setFileItems(pre => [...pre, fileItem]);
      params.filePath = data.path;
      // 正式启动
      const res = await fileApi.download(params, {
        // 下载进程监听
        progressIndicator: (progress: number) => {
          console.warn('progress', progress);
          const curTime = new Date().getTime();
          // 更新下载进度
          setFileItems(pre =>
            pre.map(i => {
              if (i.id === itemId) {
                const mTime = (curTime - i.lastTime) / 1000;
                const mSize = (progress - i.progress / 100) * i.originSize;
                let speed = mSize / mTime;
                speed = speed > 0 ? speed : 0;
                //  lastTime: curTime, fix SIRIUS-3644
                const cur = {
                  ...i,
                  lastTime: curTime,
                  progress: toFixed(progress * 100, 2),
                  downloadSpeed: `${formatFileSize(speed)}/s`,
                };
                return cur;
              }
              return i;
            })
          );
        },
      });
      // 全部成功
      if (res.succ) {
        setFileItems(pre => {
          const preCur = pre.find(i => i.id === itemId) as DownloadDisk;
          if (preCur) {
            const cur = {
              ...preCur,
              status: DownloadFileStatus.DONE,
              progress: 100,
              downloadSpeed: '0/s',
            };
            return [cur, ...pre.filter(i => i.id !== itemId)];
          }
          return [...pre];
        });
        return;
      }
      setFileItems(pre => {
        const preCur = pre.find(i => i.id === itemId) as DownloadDisk;
        if (preCur) {
          const cur = { ...preCur, status: DownloadFileStatus.FAIL };
          return [cur, ...pre.filter(i => i.id !== itemId)];
        }
        return [...pre];
      });
    }
  };
  // 网盘内下载
  const downloadAction = (content: DiskDownloadProps, spaceId: number) => {
    const item = content;
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
        bizCode: tabInterfaceDownloadMap[curSideTab],
        appTag: systemApi.isElectron(),
        dirId: id,
        parentId,
        spaceId: item.spaceId,
        // packageName得放在最后面
        packageName: `${name}.zip`,
      };
      // 获取文件夹下载链接
      const resUrl = diskApi.doBatchZipDownload(fileReq as any);
      if (resUrl) {
        electronDownload({ ...item, name: `${item.name}.zip`, totalSize } as NSDirContent, resUrl);
      }
      return;
    }
    // 文件
    const spaceIdc = item.spaceId || spaceId;
    // 主页
    if (curSideTab === 'recently') {
      const params: RequestNSCommonId = {
        fileId: item.resourceId,
        dirId: item.resourceParentId,
        spaceId: spaceIdc,
      };
      setVisibleUpload(false);
      diskApi.getNSRecordDownloadUrl(params).then(data => {
        if (!data) return;
        if (inElectron) {
          electronDownload(item, data as unknown as string);
        } else if (typeof data === 'string') {
          const downloadLink = (data as string).replace('http:', 'https:');
          systemApi.webDownloadLink(downloadLink);
        }
      });
    } else {
      // 个人空间 企业空间
      const params: RequestNSCommonFolderId = {
        type: tabInterfaceMap[curSideTab] as NetStorageType,
        fileId: item.id,
        dirId: item.parentId,
        spaceId: spaceIdc,
      };
      setVisibleUpload(false);
      diskApi.doGetNSDownloadInfo(params, 'download').then(({ data }) => {
        if (inElectron) {
          electronDownload(item, data.data).then();
        } else {
          systemApi.webDownloadLink(data.data);
        }
      });
    }
  };
  // 重新下载
  const reDownload = item => {
    setFileItems(pre => pre.filter(i => i.id !== item.id));
    electronDownload({ ...item, size: item.originSize }, item.fileUrl);
  };
  // 刷新网盘(假刷新)，清空容量信息,重置空间状态,并重新获取容量信息，重新设置空间状态，并前往首页)
  const refreshDisk = (newPrivileges: ModulePs[]) => {
    // 前往主页
    dispatch(DiskActions.setCurSideTab('recently'));
    dispatch(DiskActions.setCurDirId(null));
    // 设置权限
    dispatch(DiskActions.setDiskPs(newPrivileges));
    // 刷新主页
    eventApi.sendSysEvent({
      eventName: 'diskInnerCtc',
      eventStrData: '',
      eventData: {
        name: 'refreshMainPage',
      },
    });
    // 重置状态
    dispatch(DiskActions.resetSpaceState());
    // 获取根目录信息
    getRootInfo(newPrivileges);
  };
  // 新老权限对比 判断权限是否发生改变
  const ifPrivilegeChange = (oldPs: ModulePs[], newPs: ModulePs[]) => !(JSON.stringify(transDiskPrivileges(oldPs)) === JSON.stringify(transDiskPrivileges(newPs)));
  // 重新获取权限并检查是否发生改变
  // true 变了 false 没变
  const checkPrivilege = async () => {
    // 窗口已弹出
    if (refreshModalShow) return false;
    const res = await productAuthApi.getGlobalAuthsWithCache();
    const { success, changed, val } = res;
    // 未请求成功
    if (!success) return;
    // 未改变
    if (success && !changed) return;
    const newPrivileges = val.filter((item: ModulePs) => DiskAuthKeys.includes(item.resourceLabel));
    // 正常返回
    if (newPrivileges && diskPs) {
      // 权限变了
      if (ifPrivilegeChange(diskPs, newPrivileges)) {
        setRefreshModalShow(true);
        Modal.error({
          width: 400,
          icon: '',
          title: getIn18Text('NINDEQUANXIANYOU'),
          content: '',
          cancelText: '',
          okText: getIn18Text('SHUAXIN'),
          centered: true,
          maskClosable: false,
          keyboard: false,
          closable: false,
          onOk: () => refreshDisk(newPrivileges),
          afterClose: () => setRefreshModalShow(false),
        });
        return true;
      }
      return false;
    }
    // 接口报错不处理，继续用老的
    return false;
  };
  // 首次获取权限
  const firGetPs = async () => {
    let newPrivileges = null;
    let newPrivilegesReadable = null;
    // 错误处理 认为拥有全部权限
    const errorHandle = () => {
      newPrivileges = DiskFullAuths;
      newPrivilegesReadable = transDiskPrivileges(newPrivileges);
      dispatch(DiskActions.setDiskPs(newPrivileges));
      return { newPrivileges, newPrivilegesReadable };
    };
    // 第一步 获取权限
    const res = await productAuthApi.getGlobalAuthsWithCache();
    const { success, val } = res;
    if (!success) {
      return errorHandle();
    }
    newPrivileges = val;
    newPrivilegesReadable = transDiskPrivileges(newPrivileges);
    dispatch(DiskActions.setDiskPs(newPrivileges));
    return { newPrivileges, newPrivilegesReadable };
  };
  // 网盘初始化请求
  const initDisk = async () => {
    const { newPrivileges, newPrivilegesReadable } = await firGetPs();
    // 第二步 尝试开通个人空间
    try {
      newPrivilegesReadable?.public && newPrivilegesReadable?.public.includes('USE') && (await diskApi.initPersonalSpace());
    } catch (error) {
      console.log(getIn18Text('KAITONGSHIBAI'), error);
    }
    // 第三步 获取根目录信息
    try {
      await getRootInfo(newPrivileges);
      setInitSuc(true);
    } catch (error) {
      console.log(getIn18Text('CHUSHIHUAWANGPAN'), error);
    }
  };
  useEffect(() => {
    const storeDiskTreeWidth = getValidStoreWidth(storeApi.getSync(STORE_DISK_TREE_WIDTH, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' }));
    if (storeDiskTreeWidth > 0) {
      setDefaultTreeWidth(storeDiskTreeWidth);
    }
    initDisk();
  }, []);
  useEffect(() => {
    // 初始化成功 进入时带有锚点
    if (initSuc && anchorFolder) {
      const { from, id } = anchorFolder;
      const fromSideTab = bizCodeSideTabMap[from];
      if (fromSideTab === 'share') {
        shareRef?.current?.outIn();
      }
      dispatch(DiskActions.setCurSideTab(fromSideTab));
      dispatch(DiskActions.setCurDirId(Number(id)));
    }
  }, [initSuc]);
  useEffect(() => {
    // 切到网盘时检查权限 第一次不检查
    if (curActiveKey === 'disk') {
      if (firstIntoDisk.current) {
        firstIntoDisk.current = false;
        return;
      }
      checkPrivilege();
    }
  }, [curActiveKey]);
  useEffect(() => {
    if (inWindow()) {
      setTableSize();
      window.addEventListener('resize', debounceResizeTable);
    }
    return () => {
      window.removeEventListener('resize', debounceResizeTable);
    };
  }, []);
  useEffect(() => {
    defaultRangeTime && dispatch(DiskActions.setCurSideTab('recently'));
  }, [defaultRangeTime]);
  useEffect(() => {
    // 已初始化完成时设置锚点
    if (anchorFolder && initSuc) {
      const { from, id } = anchorFolder;
      const fromSideTab = bizCodeSideTabMap[from];
      if (fromSideTab === 'share') {
        shareRef?.current?.outIn();
      }
      dispatch(DiskActions.setCurSideTab(fromSideTab));
      dispatch(DiskActions.setCurDirId(Number(id)));
    }
  }, [anchorFolder]);
  useMsgRenderCallback('diskInnerCtc', async data => {
    const { eventData } = data;
    const { name } = eventData;
    // 刷新页面 需更新各个空间的容量
    if (name === 'refresh') {
      const res = await checkPrivilege();
      // 权限未发生改变 继续刷新容量
      !res && getRootInfo();
    }
    // 刷新容量
    if (name === 'refreshVolume') {
      getRootInfo();
    }
    // 检查权限
    if (name === 'checkPrivilege') {
      checkPrivilege();
    }
  });
  useEventObserver('keyboard', {
    name: 'disk-keyboard-listener',
    func: ev => {
      console.log('disk-keyboard-listener', ev);
      const { eventStrData, eventData: e } = ev;
      if (eventStrData === 'disk' && e) {
        const commandKey = util.isMac() ? e.metaKey : e.ctrlKey;
        if (e.keyCode === 70 && commandKey && !e.shiftKey && !e.altKey) {
          sideContentRef?.current?.openSearch();
        }
      }
    },
  });
  useEffect(() => {
    console.log('performanceApi', `disk_load_${curSideTab}_begin`);
    performanceApi.time({
      statKey: `disk_${curSideTab}_load_time`,
    });
  }, [curSideTab]);

  const [defaultStyle] = useState<React.CSSProperties>({
    width: '100%',
    overflow: 'hidden',
  });

  return (
    <PageContentLayout allowDark from="disk" className={`${systemApi.isWebWmEntry() && style.pageContentWm}`} style={defaultStyle}>
      <SideContentLayout borderRight minWidth={200} defaultWidth={defaultTreeWidth} maxWidth={500} onResize={debounceResizeSideContent}>
        <SideContent ref={sideContentRef} downloadAction={downloadAction} setSideTab={sideTabChange} />
      </SideContentLayout>

      <div
        id="disk-main-page"
        className={style.diskMainWrap}
        style={{
          minWidth: '464px',
          height: `calc(100% - ${getBodyFixHeight(true)}px)`,
          // background: '#F4F4F5',
          paddingTop: getBodyFixHeight(true),
        }}
      >
        <div ref={tableRef} className={style.diskContent}>
          {/* 主页 */}
          {curSideTab === 'recently' && (
            <MainPage
              ref={publicPrivateRef}
              defaultRangeTime={defaultRangeTime}
              setVisibleUpload={setVisibleUpload}
              setUploadFileItems={setUploadFileItems}
              downloadAction={downloadAction}
              getRootInfo={getRootInfo}
            />
          )}
          {/* 个人空间 企业空间 */}
          {['public', 'private'].includes(curSideTab) && (
            <PublicPrivateContent
              ref={publicPrivateRef}
              setVisibleUpload={setVisibleUpload}
              setUploadFileItems={setUploadFileItems}
              downloadAction={downloadAction}
              getRootInfo={getRootInfo}
              getPrivateRootInfo={getPrivateRootInfo}
            />
          )}
          {/* 与我分享 */}
          {curSideTab === 'share' && <ShareWithMe ref={shareRef} contentWidth={curContWidth} rootInfo={curRootInfo} downloadAction={downloadAction} />}
          {/* 云附件 */}
          {curSideTab === 'cloudAtt' && (
            <CloudAttCont
              ref={cloudAttRef}
              setVisibleUpload={setVisibleUpload}
              setUploadFileItems={setUploadFileItems}
              getRootInfo={getRootInfo}
              electronDownload={electronDownload}
            />
          )}
          {/* 邮件往来附件 */}
          {curSideTab === 'normalAtt' && (
            <NormalAtt ref={normalAttRef} setVisibleUpload={setVisibleUpload} setUploadFileItems={setUploadFileItems} electronDownload={electronDownload} />
          )}
          {/* 回收站 */}
          {curSideTab === 'recycle' && <Recycle tab="personal" contentWidth={curContWidth} />}
          {/* 收藏 */}
          {curSideTab === 'favorites' && <Favorites downloadAction={downloadAction} contentWidth={curContWidth} />}
        </div>

        {/* 传输列表 */}
        <div className={style.diskTransferList} style={{ flexDirection: uploadSuspendVisible && downloadSuspendVisible ? 'row' : 'column' }}>
          {/* 下载列表 */}
          <Download
            visible={!!fileItems.length}
            fileItems={fileItems}
            visibleUpload={visibleUpload}
            setVisibleUpload={setVisibleUpload}
            setBtnVisible={setDownloadSuspendVisible}
            changeFileItems={setFileItems}
            reDownload={item => {
              reDownload(item);
            }}
          />
          {/* 上传列表 */}
          <FileList
            visible={!!uploadFileItems.length}
            visibleUpload={visibleUpload}
            setVisibleUpload={setVisibleUpload}
            setBtnVisible={setUploadSuspendVisible}
            fileItems={uploadFileItems}
            changeFileItems={changeFileItems}
          />
        </div>
        <UserWelcome isModalVisible={userWelcomeVisible} setVisible={setUserWelcomeVisible} />
      </div>
    </PageContentLayout>
  );
};
export default Disk;
