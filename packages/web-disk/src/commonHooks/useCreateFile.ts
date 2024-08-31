import { useCallback } from 'react';
import { useEffect, useState, useMemo } from 'react';
import { apis, apiHolder, NetStorageApi, DataTrackerApi, RequestNSFileCreateInfo, NSCreateFileType, NetStorageShareApi, SystemApi } from 'api';
import { normalizeShareUrl } from '../utils';
import { getIn18Text } from 'api';
interface PrivateSpaceStateInfo {
  state: 'locked' | 'normal' | 'noOpen' | 'unknown';
  dirId?: number;
}
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const nsShareApi = apiHolder.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
// 个人空间基本信息
export const getPrivateSpaceState = async (): Promise<PrivateSpaceStateInfo> => {
  try {
    const isLocked = await diskApi.isLockEnabledUsingGET();
    if (isLocked) {
      return {
        state: 'locked',
      };
    }
    const privateInfo = await diskApi.doGetNSFolderInfo({ type: 'personal' });
    return {
      state: 'normal',
      dirId: privateInfo.id,
    };
  } catch (err) {
    console.error('个人空间基本信息获取失败', err);
    // 个人空间未开通
    if ((err as any)?.data?.code === 10403) {
      return {
        state: 'noOpen',
      };
    }
    return {
      state: 'unknown',
    };
  }
};
type CreateFileFn = (fileType: 'doc' | 'excel' | 'unitable') => Promise<void>;
export const useCreateFile = (): [boolean, CreateFileFn, PrivateSpaceStateInfo | undefined] => {
  const [spaceInfo, setSpaceInfo] = useState<PrivateSpaceStateInfo>();
  const canCreateFile = useMemo(() => Boolean(spaceInfo && spaceInfo.state === 'normal' && spaceInfo.dirId), [spaceInfo]);
  const dirId = spaceInfo?.dirId!;
  useEffect(() => {
    getPrivateSpaceState().then(res => {
      setSpaceInfo(res);
    });
  }, []);
  const createFile = useCallback(
    async (fileType: 'doc' | 'excel' | 'unitable') => {
      // 协同文档 协同表格
      const req: RequestNSFileCreateInfo = {
        type: 'personal',
        dirId,
        fileName: getIn18Text('WEIMINGMING'),
        fileType: fileType as NSCreateFileType,
      };
      // 异步获取 CurrentWinInfo
      type GetCurrentWinInfoPromise = ReturnType<typeof systemApi.getCurrentWinInfo>;
      let getCurrentWinInfoPromise: GetCurrentWinInfoPromise | null = null;
      if (systemApi.isElectron()) {
        getCurrentWinInfoPromise = systemApi.getCurrentWinInfo(true);
      }
      const ret = await diskApi.doCreateFile(req);
      if (!ret?.id) {
        return;
      }
      const curUser = systemApi.getCurrentUser();
      trackerApi.track('pcDisk_new', {
        type: fileType === 'doc' ? 'doc' : 'sheet',
        way: 'filePage-new',
        fileid: ret.id,
        useraccount: curUser?.id,
      });
      const data = await nsShareApi.getNSShareLink({ resourceId: ret.id, resourceType: 'FILE' });
      if (data.shareUrl) {
        const shareUrl = normalizeShareUrl(data.shareUrl);
        if (systemApi.isElectron()) {
          if (getCurrentWinInfoPromise) {
            const { webId } = await getCurrentWinInfoPromise;
            systemApi.handleJumpUrl(-1, `${shareUrl}&targetWindow=${webId}`);
          }
        } else {
          systemApi.openNewWindow(shareUrl);
        }
      }
    },
    [dirId]
  );
  return [canCreateFile, createFile, spaceInfo];
};
