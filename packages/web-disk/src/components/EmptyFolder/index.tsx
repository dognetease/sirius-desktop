import { Button } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  apis,
  apiHolder,
  NetStorageApi,
  RequestNSFileCreateInfo,
  NSCreateFileType,
  NetStorageShareApi,
  SystemApi,
  DataTrackerApi,
  NetStorageType,
  DataStoreApi,
} from 'api';
import { normalizeShareUrl } from '../../utils';
import IconCard from '@web-common/components/UI/IconCard/index';
import style from './index.module.scss';
import { DiskTipKeyEnum } from '../../disk';
import { DiskActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
interface EmptyFolderProps {
  emptyTip?: string; // 提示文案
  folderId: number; // 文件夹id
  createDir?: () => void; // 创建新文件夹
  refreshList?: () => void; // 刷新文件列表
  folderType: NetStorageType; // 文件夹类型
  isMainPage: boolean; // 是否是主页
  withoutOperate: boolean; // 是否需要展示新建按钮
}
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const nsShareApi = apiHolder.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const dataStoreApi: DataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const EmptyFolder: React.FC<EmptyFolderProps> = ({ emptyTip, createDir, refreshList, folderId, folderType, isMainPage = false, withoutOperate = false }) => {
  const guideTipsInfo = useAppSelector(state => state.diskReducer.guideTipsInfo);
  const [addPermission, setAddPermission] = useState<boolean>(false);
  const [onlyUploadPermission, setOnlyUploadPermission] = useState<boolean>(false);
  const hasAddPermissionRoleNames = [getIn18Text('GUANLI'), getIn18Text('BIANJI')];
  const uploadPermissionRoleNames = [getIn18Text('SHANGCHUAN'), getIn18Text('SHANGCHUAN/XIAZAI')];
  const dispatch = useAppDispatch();
  const createFolder = () => {
    createDir && createDir();
  };
  // 检查权限
  const checkAddPermission = () => {
    diskApi
      .doGetNSFolderInfo({
        dirId: folderId,
        type: folderType,
      })
      .then(data => {
        const { roleInfos } = data.authorityDetail;
        const includeRole = roleInfos.findIndex(item => hasAddPermissionRoleNames.includes(item.roleName)) !== -1;
        const uploadRole = roleInfos.findIndex(item => uploadPermissionRoleNames.includes(item.roleName)) !== -1;
        setAddPermission(includeRole || uploadRole);
        setOnlyUploadPermission(!includeRole && uploadRole);
      });
  };
  useEffect(() => {
    checkAddPermission();
  }, [folderId, folderType]);
  const createFile = (type: NSCreateFileType) => {
    if (!folderId || !folderType) return;
    const req: RequestNSFileCreateInfo = {
      type: folderType,
      dirId: folderId,
      fileName: getIn18Text('WEIMINGMING'),
      fileType: type,
    };
    diskApi.doCreateFile(req).then(ret => {
      if (!ret?.id) {
        return;
      }
      // 云空间新建协同文档埋点
      const curUser = systemApi.getCurrentUser();
      trackerApi.track('pcDisk_new', {
        type: type === 'doc' ? 'doc' : 'sheet',
        way: 'Blank-new',
        fileid: ret.id,
        useraccount: curUser?.id,
      });
      refreshList && refreshList();
      nsShareApi.getNSShareLink({ resourceId: ret.id, resourceType: 'FILE' }).then(data => {
        if (data.shareUrl) {
          const shareUrl = normalizeShareUrl(data.shareUrl);
          if (systemApi.isElectron()) {
            systemApi.handleJumpUrl(-1, shareUrl);
          } else {
            systemApi.openNewWindow(shareUrl);
          }
        }
      });
    });
  };
  const createDoc = () => {
    createFile('doc');
  };
  const createSheet = () => {
    createFile('excel');
  };
  const closeCreateOrUploadTip = () => {
    // 仅主页场景下记录点击情况
    if (!isMainPage) return;
    dataStoreApi.put(DiskTipKeyEnum.CREATE_OR_UPLOAD_TIP, 'true');
    dispatch(
      DiskActions.setGuideTipsInfoByKey({
        key: DiskTipKeyEnum.CREATE_OR_UPLOAD_TIP,
        value: {
          ...guideTipsInfo[DiskTipKeyEnum.CREATE_OR_UPLOAD_TIP],
          showed: true,
          visiable: false,
        },
      })
    );
  };
  return (
    <div className={style.container}>
      {!addPermission || withoutOperate ? (
        <div className={style.empty}>
          <div className="sirius-empty sirius-empty-doc" />
          <span className={style.emptyText}>{getIn18Text('ZANWUWENJIAN')}</span>
        </div>
      ) : (
        <>
          <div className={style.bg} />
          <div className={style.tip}>{emptyTip || getIn18Text('ZANWUWENJIAN')}</div>
          <div className={style.btnGroup}>
            <Button
              className={style.btn}
              onClick={() => {
                createDoc();
                closeCreateOrUploadTip();
              }}
              icon={<IconCard className={style.icon} type="lxdoc" width={20} height={20} />}
            >
              {getIn18Text('XINJIANWENDANG')}
            </Button>
            <Button
              className={style.btn}
              onClick={() => {
                createSheet();
                closeCreateOrUploadTip();
              }}
              icon={<IconCard className={style.icon} type="lxxls" width={20} height={20} />}
            >
              {getIn18Text('XINJIANBIAOGE')}
            </Button>
            {!onlyUploadPermission && (
              <Button
                className={style.btn}
                onClick={() => {
                  createFolder();
                  closeCreateOrUploadTip();
                }}
                icon={<IconCard className={style.icon} type="folder" width={20} height={20} />}
              >
                {getIn18Text('XINJIANWENJIANJIA')}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
export default EmptyFolder;
