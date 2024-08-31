import { apiHolder as api, SystemApi } from 'api';
import cloneDeep from 'lodash/cloneDeep';
import { actions as attachmentActions } from '../reducer/attachmentReducer';
import { RootState } from '../createStore';
import { Attachment } from '../state';

const fileApi = api.api.getFileApi();
const systemApi = api.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();

const forwardAttachment = (_stateAttachments, attachment, entryId, cid) => {
  let newAttachments;
  let exist = false; // 附件知否在读信模块已经加载过

  const stateAttachments = cloneDeep(_stateAttachments);
  newAttachments = stateAttachments.map(item => {
    // 已经点开过 附件已经存在
    // 读信的content.id === 转发写信的 entry.id
    if (item.downloadId === attachment.downloadId && item.mailId === cid) {
      // item.mailId = cid;
      exist = true;
    }
    return item;
  });
  if (!exist) {
    newAttachments = [...stateAttachments, attachment];
  }
  return { newAttachments, exist };
};
export const attachmentDownloadAction =
  (attachment: any, option?: { forward: boolean; entryId: string; cid: string }): any =>
  (dispatch, getState) => {
    const { attachments: stateAttachments } = (getState() as RootState).attachmentReducer;
    const { downloadId, id, expired } = attachment;
    // 来自 转发 重新编辑 等
    // 应该是无需考虑读信的 得重构
    if (option?.forward) {
      const { newAttachments, exist } = forwardAttachment(stateAttachments, attachment, option.entryId, option.cid);
      dispatch(attachmentActions.doSetAttachments(newAttachments));
      if (exist) return;
    } else {
      dispatch(attachmentActions.doAddAttachment([attachment]));
    }
    // 会进去
    // 下面这块应该是废弃的
    if (!inElectron || option?.forward) {
      dispatch(
        attachmentActions.doChangeAttachment({
          downloadId,
          id,
          status: 'success',
          expired,
        })
      );
      return;
    }

    dispatch(
      attachmentActions.doChangeAttachment({
        downloadId,
        status: 'before',
        expired,
      })
    );
  };

export const restartDownload =
  (downloadId, obj?: any): any =>
  (dispatch, getState) => {
    const { attachments: stateAttachments } = (getState() as RootState).attachmentReducer;
    const attachment = stateAttachments.find(item => item.downloadId === downloadId) || ({} as Attachment);
    let fileUrl;
    let fid;
    if (obj?.isFromChat) {
      fileUrl = obj?.fileUrl;
      fid = downloadId;
    } else {
      fileUrl = attachment.fileUrl;
      fid = attachment.fid;
    }
    return downloadAttachment(dispatch, { downloadId, fileUrl, fid });
  };

const downloadAttachment = (dispatch, { downloadId, fileUrl, fid }) => {
  dispatch(
    attachmentActions.doChangeAttachmentAttr({
      downloadId,
      key: 'status',
      val: 'downloading',
    })
  );

  return fileApi
    .download(
      { fileUrl, fid },
      {
        progressIndicator: n => {
          dispatch(
            attachmentActions.doChangeAttachmentAttr({
              downloadId,
              key: 'process',
              val: n * 100,
            })
          );
        },
        operatorSet: handler => {
          dispatch(
            attachmentActions.doChangeAttachmentAttr({
              downloadId,
              key: 'abortDownload',
              val: handler,
            })
          );
        },
      }
    )
    .then(res => {
      if (res && res.succ) {
        dispatch(
          attachmentActions.doChangeAttachment({
            downloadId,
            status: 'success',
          })
        );
      } else {
        dispatch(
          attachmentActions.doChangeAttachment({
            downloadId,
            status: 'fail',
          })
        );
      }
    })
    .catch(() => {
      dispatch(
        attachmentActions.doChangeAttachment({
          downloadId,
          status: 'fail',
        })
      );
    });
};
