import React, { useEffect, useState, useCallback } from 'react';
import { Spin } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder, apis, FileApi, FileAttachModel, FsSaveRes, inWindow, NetStorageApi, NetStorageShareApi, NSFileContent } from 'api';
import SiriusLayout from '@/layouts';
import { PreviewPage } from './components/Preview/preview';
import { PreviewFolder } from './components/Preview/previewFolder';
import { formatAuthority } from './utils';
import { parseShareUrlParams } from '@web-common/utils/utils';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import { PermissionApply } from './components/PermissionApply';
import { usePermissionApply } from './components/PermissionApply/hooks';
import style from '@/styles/pages/share.module.scss';
import { DownloadDisk, DownloadFileStatus } from './upload';
import { electronDownloadProp, tabInterfaceMap } from './disk';
import { formatFileSize, toFixed } from '@web-common/utils/file';
import Download from './components/Download';
import { getIn18Text } from 'api';
const systemApi = apiHolder.api.getSystemApi();
const inElectron = systemApi.isElectron();
const fileApi = apiHolder.api.getFileApi() as FileApi;
interface SharePageProps {
  hash: string;
  from?: string;
  onFetchDetail?: (hash, detail) => void;
}
const SharePage: React.FC<SharePageProps> = props => {
  const nsShareApi = apiHolder.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
  const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
  const { forElectron } = apiHolder.env;
  const { hash, onFetchDetail = () => {}, from = '' } = props;
  const [hashData, setHashData] = useState<string>(hash);
  const [hasAuthority, setHasAuthority] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState<boolean>(true); // spin中
  const [fileDetail, setFileDetail] = useState<NSFileContent>();
  const [type, setType] = useState<string>('');
  const [typeOrg, setTypeOrg] = useState<'personal' | 'ent'>('ent');
  const [fileOrDir, setFileOrDir] = useState<'FILE' | 'DIRECTORY'>('FILE');
  const [folderId, setFolderId] = useState<number>(0);
  const [spaceId, setSpaceId] = useState(0);
  const [previewLink, setPreviewLink] = useState<string>('');
  const [dlFileAble, setDlFileAble] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [fileItems, setFileItems] = useState<DownloadDisk[]>([]); // 下载列表
  const params = parseShareUrlParams(hashData);
  // 获取权限申请信息
  const closeLoading = useCallback(() => {
    setLoading(false);
    setSpinning(false);
  }, []);
  const { permissionApplyInfo, getPermissionApplyInfo, noPermission, setNoPermission } = usePermissionApply(
    {
      resourceId: params.id,
      resourceType: params.type,
      ref: params.ref,
    },
    fetchShareFileInfo,
    closeLoading
  );
  useCommonErrorEvent('shareErrorOb');
  // useEventObserver('initPage', {
  //   name: 'sharePageInitOb',
  //   func: (ev: SystemEvent) => {
  //     if (ev && ev.eventData !== hashData) {
  //       setHashData(ev.eventData);
  //     }
  //   },
  // });
  // 同时检测传参变化 更新hash
  useEffect(() => {
    if (hash === '' || hash === undefined || hash === hashData) {
      return;
    }
    setHashData(hash);
  }, [hash]);
  async function fetchShareFileInfo() {
    if (!hashData || hashData.length == 0) return;
    setNoPermission(false);
    setErrorMsg('');
    setSpinning(true);
    setLoading(true);
    setTypeOrg(params.from);
    let authority = '';
    const fileReq = {
      type: params.from,
      fileId: params.id,
      dirId: params.parentResourceId,
      spaceId: params.spaceId,
    };
    function handleErr(data, noPermission = false) {
      setSpinning(false);
      let info = { name: getIn18Text('YEMIANCHUCUOLE'), fileType: '' };
      if (params.type === 'FILE' && (noPermission || +data?.code === 10100)) {
        setNoPermission(true);
        getPermissionApplyInfo();
        info = { name: getIn18Text('WUQUANXIAN'), fileType: '' };
      } else {
        setErrorMsg(data.message);
        setLoading(false);
      }
      onFetchDetail(hash, info);
    }
    try {
      const shareAuth = await nsShareApi
        .checkShareAuth({
          resourceId: params.id,
          resourceType: params.type,
          ref: params.ref,
        })
        .catch(e => e?.data);
      if (shareAuth?.success === false || shareAuth.roleInfos?.length === 0) {
        handleErr(shareAuth, shareAuth.roleInfos?.length === 0);
        return;
      }
      authority = formatAuthority(shareAuth.roleInfos, params.type === 'DIRECTORY' ? 'dir' : '') || '';
      if (params.type === 'FILE') {
        const fileDetailRes = await diskApi.doGetNSFileInfo(fileReq);
        if ((fileDetailRes as any)?.success === false) {
          handleErr(fileDetailRes);
          return;
        }
        setFileDetail(fileDetailRes);
        console.log('[sharePage]', 'onFetchDetail', hashData);
        onFetchDetail(hashData, fileDetailRes);
      }
    } catch (_) {
      setHasAuthority(false);
    }
    setType(params.from === 'ent' ? 'public' : 'share');
    if (params.type === 'FILE' && authority.includes('查看')) {
      // 文件
      diskApi
        .doGetNSDownloadInfo(fileReq, 'preview')
        .then(ret => {
          setLoading(false);
          console.log('🚀 ~ file: share.tsx ~ line 52 ~ diskApi.doGetNSDownloadInfo ~ ret', ret);
          if (ret.data?.success) {
            const link = ret.data.data;
            // file-preview 域名时 隐藏此域名下的loading，并保留自己的loading
            if (link.includes('file-preview')) {
              setPreviewLink(link + '&hideLoading=true');
              setTimeout(() => setSpinning(false), 8000);
            } else {
              setPreviewLink(link);
              setLoading(false);
              setSpinning(false);
            }
          }
        })
        .catch(err => {
          setLoading(false);
          setSpinning(false);
          if (err.data?.message) {
            setErrorMsg(err.data.message);
          }
        });
      if (authority.includes('下载')) {
        setDlFileAble(true);
      }
      setHasAuthority(true);
    } else if (params.type === 'DIRECTORY' && (authority.includes('查看') || authority.includes('上传'))) {
      // 文件夹
      setFileOrDir(params.type);
      setFolderId(params.id);
      setSpaceId(params.spaceId);
      setHasAuthority(true);
      setLoading(false);
      setSpinning(false);
    } else {
      setLoading(false);
      setSpinning(false);
    }
  }
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
      // diskType: , // 目标网盘 非必须
      downloadSpeed: '0kb/s',
      fileUrl,
      progress: 1,
      cancel: () => {
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
          const curTime = new Date().getTime();
          // 更新下载进度
          setFileItems(pre =>
            pre.map(i => {
              if (i.id === itemId) {
                const mTime = (curTime - i.lastTime) / 1000;
                const mSize = (progress - i.progress / 100) * i.originSize;
                let speed = mSize / mTime;
                speed = speed > 0 ? speed : 0;
                const cur = {
                  ...i,
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
  // 下载文件行为
  const dlFileAction = async () => {
    const fileReq = {
      type: params.from,
      fileId: params.id,
      dirId: params.parentResourceId,
      spaceId: params.spaceId,
    };
    try {
      const res = await diskApi.doGetNSDownloadInfo(fileReq, 'download');
      if (res?.data?.success && res?.data?.data) {
        const fileDLLink = res?.data?.data;
        if (inElectron) {
          electronDownload({ ...fileDetail }, fileDLLink);
        } else {
          systemApi.webDownloadLink(fileDLLink);
        }
      } else {
        message.error(res?.data?.message || getIn18Text('XIAZAISHIBAI'));
      }
    } catch (error) {
      message.error(
        (
          error as {
            message: string;
          }
        ).message || getIn18Text('XIAZAISHIBAI')
      );
    }
  };
  // 重新下载
  const reDownload = (dlItem: DownloadDisk) => {
    setFileItems(pre => pre.filter(i => i.id !== dlItem.id));
    electronDownload({ ...dlItem, size: dlItem.originSize }, dlItem.fileUrl);
  };
  useEffect(() => {
    fetchShareFileInfo();
  }, [hashData]);
  const onMessageCb = (e: { data: string }) => {
    if (e.data === 'hideSpinner') {
      setSpinning(false);
    }
  };
  useEffect(() => {
    window.addEventListener('message', onMessageCb);
    return () => {
      window.removeEventListener('message', onMessageCb);
    };
  }, []);
  const page =
    fileOrDir === 'FILE' ? (
      <PreviewPage
        hasAuthority={hasAuthority}
        item={fileDetail}
        type={type}
        previewLink={previewLink}
        dlFileAble={dlFileAble}
        dlFileAction={dlFileAction}
        hashData={hashData}
        typeOrg={typeOrg}
        errorMsg={errorMsg}
      />
    ) : (
      <PreviewFolder
        folderId={folderId}
        contentWidth={inWindow() ? window.document.body.clientWidth : 1000}
        hasAuthority={hasAuthority}
        onFetchFolderInfo={info => {
          onFetchDetail(hashData, info);
        }}
        spaceId={spaceId}
      />
    );
  // 权限申请
  const permissionApply = <PermissionApply type={type} info={permissionApplyInfo} />;
  const spin = (
    <div className={style.spinContainer} hidden={!spinning}>
      <Spin size="large" spinning={spinning} />
    </div>
  );
  const content = (
    <>
      {spin}
      {!loading && (noPermission ? permissionApply : page)}
      {/* 下载列表 */}
      <div className={style.dlFloatWin}>
        <Download
          visible={!!fileItems.length}
          fileItems={fileItems}
          visibleUpload={false}
          changeFileItems={setFileItems}
          reDownload={(item: DownloadDisk) => {
            reDownload(item);
          }}
        />
      </div>
    </>
  );
  return forElectron && from !== 'tab' ? <SiriusLayout.ContainerLayout>{content}</SiriusLayout.ContainerLayout> : content;
};
export default SharePage;
