import React from 'react';
// import ShareList from '../ShareListContent';
// import { NoAuthority } from './preview';
// import { conf } from 'api';
// import styles from '@/components/Layout/Disk/components/Preview/preview.module.scss';
import { AnonymousNoAuthority } from './../Preview/preview_anonymous';
import AnonymousShareList from './../AnonymoseShare/anonymose_share';

interface Props {
  contentWidth: number;
  folderId: number;
  // spaceId?: number;
  hasAuthority?: boolean;
  shareIdentity: string;
}

// const forElectron = ('electron' === conf('build_for'));

export const AnonymousPreviewFolder: React.FC<Props> = ({ contentWidth, hasAuthority, folderId, shareIdentity }) =>
  // diskApi.doGetNSEntFolderAuthInfo(folderId)
  hasAuthority ? (
    <div style={{ height: '100vh', backgroundColor: '#f4f4f5', overflow: 'scroll' }}>
      {/* {forElectron ? <div className={styles.toolIcon} title="浏览器打开"/> : null} */}
      <AnonymousShareList
        contentWidth={contentWidth}
        shareIdentity={shareIdentity}
        // preview={true}
        dirId={folderId}
      />
    </div>
  ) : (
    <AnonymousNoAuthority />
  );
