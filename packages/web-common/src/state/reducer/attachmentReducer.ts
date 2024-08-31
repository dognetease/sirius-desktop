import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiHolder as api, apis, AccountApi, DataTransApi } from 'api';
import axios from 'axios';
import message from '@web-common/components/UI/Message/SiriusMessage';
import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';
import { Attachment, AttachmentsPreview, AttachmentViewStatuses } from '../state';
import { downloadFile } from '@web-common/components/util/file';
import { RootState } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
const httpApi = api.api.getDataTransApi() as DataTransApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const eventApi = api.api.getEventApi();
export interface IAttachmentReducer {
  attachments: Attachment[];
  attachmentsPreview: AttachmentsPreview;
  downloadProgress: number;
}
const InitialState: IAttachmentReducer = {
  attachments: [],
  attachmentsPreview: {
    visible: false,
    downloadContentId: null,
    downloadId: null,
    attachments: [],
  },
  downloadProgress: 0,
};
export interface DownloadPayload {
  fileName: string;
  fileSize: number;
  fileUrl: string;
  _account?: string;
}

/**
 * 文件下载
 * 实时更新进度条
 */
export const doDownloadAttchmentAsync = createAsyncThunk('attachmentReducer/download', async (fileInfo: DownloadPayload, { getState, dispatch }) => {
  const rootState = getState() as RootState;
  const currentMail = rootState.mailReducer.currentMail;
  const senderEmail = currentMail?.initSenderStr || fileInfo._account || '';
  const { fileName, fileSize, fileUrl } = fileInfo;
  const updateProgress = throttle((percentCompleted: number) => dispatch(attachmentSlice.actions.doUpdateDownloadProgress(percentCompleted)), 100);
  // senderEmail && accountApi.setCurrentAccount(senderEmail);
  axios
    .get(fileUrl, {
      responseType: 'blob',
      onDownloadProgress: progressEvent => {
        const { loaded } = progressEvent;
        const percentCompleted = Math.round((loaded * 100) / fileSize);
        updateProgress(percentCompleted);
      },
    })
    .then((res: any) => {
      downloadFile(res.data, fileName || getIn18Text('WEIMINGMINGWENJIAN11'));
    })
    .catch(_ => {
      message.error(getIn18Text('WANGLUOCUOWU\uFF0C'));
      dispatch(attachmentSlice.actions.doUpdateDownloadProgress(0));
    });
});

const saveDraft = debounce((mailId: string) => {
  eventApi.sendSysEvent({
    eventName: 'toSaveDraft',
    eventStrData: '',
    eventData: {
      type: 'localAndRemote',
      trigger: 'attachChange',
      mailId,
    },
  });
}, 1000);

const attachmentSlice = createSlice({
  name: 'attachmentReducer',
  initialState: InitialState,
  reducers: {
    doUpdateDownloadProgress: (state, action: PayloadAction<number>) => {
      state.downloadProgress = action.payload;
    },
    // 设置附件列表
    doSetAttachments: (state, action: PayloadAction<Attachment[]>) => {
      // const attachments = action.payload?.filter(file => file?.fileSize !== 0);
      state.attachments = [...action.payload];
    },
    // 新添加附件
    doAddAttachment: (state, action: PayloadAction<Attachment[]>) => {
      const curAttachments = [...state.attachments] || [];
      // 附件独一无二的id数组（id并不具备唯一性）
      const attachmentUniqIdArr = curAttachments.map(item => `${item.mailId}_${item.id}`);
      // 过滤掉 0k 的无效附件
      const filteredAttachments = action.payload?.filter(file => file?.fileSize !== 0);
      // 设置状态
      filteredAttachments.forEach(it => {
        const { mailId, id, status } = it;
        if (!attachmentUniqIdArr.includes(mailId + '_' + id)) {
          let curStatus: AttachmentViewStatuses = 'uploading';
          // 个人/企业空间 云附件 往来附件 只要加上去就是完成态 无需上传过程
          if (it && ['netUrl', 'trs', 'fromInternalMail'].includes(it.type)) {
            curStatus = 'success';
            // 每次新增附件都触发一次存草稿
            mailId && saveDraft(mailId);
          } else {
            // 其他类型需要上传
            curStatus = status || 'uploading';
          }
          it.status = curStatus;
          curAttachments.push(it);
        }
      });
      state.attachments = curAttachments;
    },
    cloneAttachments: (state, action: PayloadAction<Attachment[]>) => {
      state.attachments = [...state.attachments, ...action.payload];
    },
    // 本地附件转云附件
    doTransAttachmentToCloud: (state, action: PayloadAction<number>) => {
      const realId = action.payload;
      if (!realId) return;
      state.attachments = state.attachments.map(item => {
        if (item?.realId === realId) {
          return { ...item, cloudAttachment: true };
        }
        return item;
      });
    },
    doSetSpecifiedMailAttachments: (
      state,
      action: PayloadAction<{
        mailId: number | string;
        attachments: Attachment[];
      }>
    ) => {
      const { mailId, attachments = [] } = action.payload;
      const curAttachments = state.attachments || [];
      const filterAttachments = curAttachments.filter(attachment => attachment.mailId !== mailId);
      state.attachments = [...filterAttachments, ...attachments];
    },
    doDelAttachment: (
      state,
      action: PayloadAction<{
        id?: number | null;
        cid?: string[];
      }>
    ) => {
      const { id, cid = [] } = action.payload;
      // 传入附件id
      if (id || id === 0) {
        state.attachments = state.attachments.filter(item => id !== item.id);
        return;
      }
      // 传入邮件cid
      if (cid?.length > 0) {
        state.attachments = state.attachments.filter(item => {
          const { mailId } = item;
          return !cid.includes(mailId as string);
        });
      }
    },
    doChangeAttachment: (
      state,
      action: PayloadAction<{
        downloadId?: string;
        status: any;
        id?: string;
        realId?: number;
        expired?: number;
      }>
    ) => {
      const { id, downloadId, status, realId, expired } = action.payload;
      state.attachments = state.attachments.map(at => {
        // TODO
        // 老写法真是乱...
        // @ts-ignore
        if (id && at.id === id) {
          at.status = status;
          at.expired = expired;
        }
        // @ts-ignore
        if (id && at.id === downloadId) {
          at.status = status;
          at.expired = expired;
          if (status === 'success') at.realId = realId; // realId由api层生成用于记录本地id
        }
        // 下载的附件 ID不能用 会重复
        if (downloadId && at.downloadId === downloadId) {
          at.status = status;
        }
        return at;
      });
    },
    // 批量开启下载
    doBatchStartAttachments: (state, action: PayloadAction<string[]>) => {
      const idArr = action.payload;
      state.attachments = state.attachments.map(at => {
        if (idArr.includes(at.id as unknown as string)) {
          return { ...at, status: 'uploading' };
        }
        return at;
      });
    },
    // 过滤出type为download的附件
    doFilterDownloadAttachment: state => {
      state.attachments = state.attachments.filter((item: any) => item.type === 'download');
    },
    doChangeAttachmentAttr: (
      state,
      action: PayloadAction<{
        downloadId?: string;
        key: string;
        val: any;
        expired?: number;
      }>
    ) => {
      const { downloadId, key, val } = action.payload;
      state.attachments = state.attachments.map(attachmnet => {
        if (attachmnet.downloadId === downloadId) {
          attachmnet[key] = val;
        }
        return attachmnet;
      });
    },
    doAttachmentPreview: (
      state,
      action: PayloadAction<{
        visible: boolean;
        downloadContentId?: string;
        downloadId?: string;
        attachments?: Attachment[];
      }>
    ) => {
      state.attachmentsPreview = action.payload;
    },
    doClearAttachmentById: (state, action: PayloadAction<string>) => {
      state.attachments = state.attachments.filter((item: any) => item.mailId !== action.payload);
    },
  },
  extraReducers: builder => {
    /** 监听其他reducer中的action操作，改变当前reduer中的state */
    const filterAttachments = (attachments: Attachment[]) => attachments?.filter(item => item.type === 'download');
  },
});
export const { actions } = attachmentSlice;
export default attachmentSlice.reducer;
