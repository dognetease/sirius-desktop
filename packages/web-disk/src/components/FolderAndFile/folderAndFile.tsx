import React from 'react';

import styles from './folderAndFile.module.scss';
import ExpandableFolders from './../ExpandableFolders/expandableFolders';

export const FolderAndFile: React.FC<any> = () => (
  <div className={styles.expanableFolders}>
    <ExpandableFolders />
  </div>
);

export default FolderAndFile;
