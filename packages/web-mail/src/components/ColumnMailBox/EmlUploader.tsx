/**
 * eml文件选择上传
 */
import React, { useImperativeHandle, useRef, forwardRef } from 'react';
import { MailBoxModel } from 'api';
import { importMails } from '../../util';
import useState2RM from '../../hooks/useState2ReduxMock';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { useAppDispatch } from '@web-common/state/createStore';

interface Props {
  // props 的类型定义
}

interface RefObject {
  // 自定义 ref 方法的类型定义
}

const EmlUploader: React.FC<Props> = (props, ref) => {
  const dispatch = useAppDispatch();
  const uploadFileRef = useRef<HTMLInputElement>(null);

  // 邮件列表-文件夹-邮件导入-list
  const [importFolderId] = useState2RM('importFolderId');

  const onFileChange = (node: MailBoxModel) => {
    const fileUploader = uploadFileRef.current;
    if (!fileUploader) {
      return;
    }
    const { files } = fileUploader;
    if (files?.length && importFolderId?.folderId) {
      importMails({ fid: Number(importFolderId.folderId), fileList: Array.from(files), _account: importFolderId.accountId }).then(() => {
        // 刷新当前邮件列表
        dispatch(
          Thunks.refreshMailList({
            noCache: true,
            showLoading: false,
            // accountId: node?._account,
          })
        );
      });
    }
  };

  const onFileClick = (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
    (e.target as any).value = '';
  };

  useImperativeHandle(ref, () => uploadFileRef.current);

  // 组件的实现逻辑
  return <input type="file" accept=".eml" hidden multiple ref={uploadFileRef} onChange={onFileChange} onClick={onFileClick} />;
};

export default forwardRef(EmlUploader);
