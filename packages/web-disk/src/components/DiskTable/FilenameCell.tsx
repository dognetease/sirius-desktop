import React, { useState, useEffect, useRef } from 'react';
import { Input } from 'antd';
import { apis, apiHolder as api, NetStorageApi, NSFileContent, NSDirContent, RequestNSCommonFolderId } from 'api';
import useClickAway from '@web-common/hooks/useClickAway';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import IconCard from '@web-common/components/UI/IconCard';
import { getFileIcon } from '../../utils';
import { DiskTab, tabInterfaceMap } from '../../disk';
import style from './filenameCell.module.scss';
import { getIn18Text } from 'api';
export interface FileNameCellProps extends React.HTMLAttributes<HTMLElement> {
  isEditing: boolean;
  /** 设置当前正在重命名的文件id */
  setEditingKey: (id: string) => void;
  record: any;
  children?: React.ReactNode;
  /** 主页 | 个人空间 | 企业空间 | 与我分享 */
  sideTab: DiskTab;
  /** 本地更新文件列表数据回调 */
  afterRename(id: number, newName: string, updateTime?: string): void;
}
const FileNameCell: React.FC<FileNameCellProps> = props => {
  const { isEditing, setEditingKey, record, sideTab, afterRename, children, ...restProps } = props;
  const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
  // 重命名之前的名称，用于回滚
  const inputWrapperRef = useRef<any>(null);
  const oldNameRef = useRef<string>(record?.name || '');
  const inputRef = useRef<any>(null);
  const isDir = record?.extensionType === 'dir';
  const [fileName, setFileName] = useState<string>(() => record?.name);
  /** 重命名时自动高亮、全选文件后缀之前的文本 */
  useEffect(() => {
    if (inputRef.current && isEditing) {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(0, fileName.lastIndexOf('.'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);
  useClickAway(inputWrapperRef, () => {
    handleSaveFilename(fileName);
  });
  // 取消重命名
  const handleCancelRename = () => {
    setEditingKey('');
    setFileName(record?.name);
  };
  // 乐观更新，同步服务器文件名
  const handleSyncFilename = (file: NSDirContent | NSFileContent) => {
    const { id, name, updateTime } = file;
    afterRename(id, name, updateTime);
    setFileName(name);
    oldNameRef.current = name;
  };
  const handleFilenameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    if (value.length > 30) {
      /** 已存在文件长度过长的老文件，支持回退格 */
      if (value.length < fileName.length) {
        setFileName(value);
        return;
      }
      Toast.info({ content: getIn18Text('WENJIANMINGCHENGCHANG') });
      return;
    }
    setFileName(value);
  };
  /** 本地先更新文件名称，再同步服务器 */
  const handleSaveFilename = async (value: string) => {
    const newFilename = value.trim();
    if (!newFilename.length || newFilename === oldNameRef.current) {
      handleCancelRename();
      return;
    }
    /** 复制粘贴超过30 个字符情况 */
    if (newFilename.length > 30) {
      Toast.warn({ content: getIn18Text('WENJIANMINGCHENGCHANG11') });
      return;
    }
    const param: RequestNSCommonFolderId = {
      type: tabInterfaceMap[sideTab],
      dirId: isDir ? record.id : record.parentId,
      fileId: isDir ? null : record.id,
    };
    diskApi
      .renameNSFile({
        ...param,
        itemName: newFilename,
      })
      .then(_ => {
        // 同步冲突文件名
        isDir ? diskApi.doGetNSFolderInfo(param).then(handleSyncFilename) : diskApi.doGetNSFileInfo(param).then(handleSyncFilename);
      })
      .catch(_ => {
        // 回滚之前名称
        afterRename(record.id, oldNameRef.current);
      });
    setFileName(newFilename);
    afterRename(record.id, newFilename);
    setEditingKey('');
  };
  return (
    <td {...restProps}>
      {isEditing ? (
        <div className={style.nameColumn} style={{ margin: `${isEditing ? '-4px 0px' : '0px'}` }}>
          <div hidden={!isDir} className={style.nameIcon}>
            <IconCard type="dir" />
          </div>
          <div hidden={isDir} className={style.nameIcon}>
            <IconCard type={getFileIcon(record) as any} width="24px" height="24px" />
          </div>
          <div className={style.nameText}>
            <div className={style.renameWrapper} ref={inputWrapperRef}>
              <Input
                className={style.renameInput}
                ref={inputRef}
                placeholder={getIn18Text('QINGSHURUMINGCHENG')}
                onPressEnter={() => handleSaveFilename(fileName)}
                value={fileName}
                onChange={handleFilenameChange}
              />
              <span className={style.cancelBtn} onClick={handleCancelRename}>
                {getIn18Text('QUXIAO')}
              </span>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </td>
  );
};
export default FileNameCell;
