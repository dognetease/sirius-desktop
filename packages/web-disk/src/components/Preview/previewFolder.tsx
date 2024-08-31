import React, { useEffect, useState } from 'react';
import { conf, apiHolder, apis, NetStorageApi, NSDirContent } from 'api';
import { Modal } from 'antd';
import ShareList from '../ShareListContent';
import { NoAuthority } from './preview';
import styles from './../Preview/preview.module.scss';
import { getIn18Text } from 'api';
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const systemApi = apiHolder.api.getSystemApi();
interface Props {
  contentWidth: number;
  folderId: number;
  spaceId: number;
  hasAuthority?: boolean;
  onFetchFolderInfo?: (detail) => void;
}
const forElectron = conf('build_for') === 'electron';
export const PreviewFolder: React.FC<Props> = ({ contentWidth, hasAuthority, folderId, spaceId, onFetchFolderInfo = () => {} }) => {
  const [rootInfo, setRootInfo] = useState<{
    private: NSDirContent;
    public: NSDirContent;
  }>({ private: {} as NSDirContent, public: {} as NSDirContent });
  // 下载
  const downloadAction = (item, spaceId) => {
    const { extensionType, id, parentId, name } = item;
    // 文件夹
    if (extensionType === 'dir') {
      if (item.totalSize && item.totalSize > 1 * 1024 * 1024 * 1024) {
        Modal.error({
          title: getIn18Text('WENJIANJIADAXIAO'),
          content: '',
          okText: getIn18Text('ZHIDAOLE'),
        });
        return;
      }
      const fileReq = {
        bizCode: 'SHARE',
        appTag: systemApi.isElectron(),
        dirId: id,
        parentId,
        packageName: `${name}.zip`,
        spaceId: item.spaceId,
      };
      diskApi.doBatchZipDownload(fileReq);
      return;
    }
    // 文件
    const fileReq = {
      type: 'personalShare',
      fileId: id,
      dirId: parentId,
      spaceId,
    };
    diskApi.doGetNSDownloadInfo(fileReq, 'download').then(ret => {
      const url = ret?.data?.data;
      url && systemApi.webDownloadLink(url);
    });
  };
  const fetchRootInfo = async () => {
    const entRoot = await diskApi.doGetNSFolderInfo({ type: 'ent' });
    console.log('previewFolder entRoot', entRoot);
    const privateRoot = await diskApi.doGetNSFolderInfo({ type: 'personal' });
    rootInfo.private = privateRoot;
    rootInfo.public = entRoot;
    setRootInfo(rootInfo);
  };
  useEffect(() => {
    fetchRootInfo();
  }, []);
  // diskApi.doGetNSEntFolderAuthInfo(folderId)
  return hasAuthority ? (
    <div style={{ height: '100vh', backgroundColor: '#f4f4f5' }}>
      {forElectron ? <div className={styles.toolIcon} title={getIn18Text('LIULANQIDAKAI')} /> : null}
      <ShareList
        contentWidth={contentWidth}
        preview
        rootInfo={rootInfo}
        previewId={folderId}
        onFetchFolderInfo={onFetchFolderInfo}
        previewSpaceId={spaceId}
        downloadAction={downloadAction}
        sideTab="share"
      />
    </div>
  ) : (
    <NoAuthority />
  );
};
