// 处理从云文档选择附件并上传
import {
  apiHolder as api,
  apis,
  CloudAtt,
  MailApi,
  MailAttachment,
  MailFileAttachModel,
  NetStorageApi,
  AddDiskFileToAttRes,
  NSDirContent,
  NSFileContent,
  RequestNSFolderContent,
  MailFileAttachmentType,
  AccountApi,
} from 'api';
import get from 'lodash/get';
import { createAsyncThunk, createDraftSafeSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { AttachmentActions, RootState, MailActions } from '../createStore';
import { getIn18Text } from 'api';
import { AttachmentView } from '@web-common/state/state';
const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
export interface IRootInfo {
  ent: NSDirContent | null;
  personal: NSDirContent | null;
}
type DoGetAttsAsyncParams = {
  type: tabMsgsKeys;
  init?: boolean;
};
type FailMsgsType = {
  failIntro: string;
  failParams: DoGetAttsAsyncParams;
};

// 列表项中基础的属性
type listItemBasedType = {
  rowId: string | number;
  name: string;
  size: number;
  updateTime: string;
};

// 列表项type 文件夹 文件 云附件 邮件 以及唯一id等展示用的类型
type listItemType = (NSDirContent | NSFileContent | CloudAtt | MailAttachment) & listItemBasedType;

type PersonalTabMsgs = {
  isLocked: boolean;
  page: number;
  list: listItemType[];
  totalCount: number;
};
type EntTabMsgs = {
  page: number;
  list: (NSDirContent | NSFileContent)[];
  totalCount: number;
};
type CloudAttTabMsgs = {
  page: number;
  list: any[];
  totalCount: number;
};
type NormalAttTabMsgs = {
  normalAttReady: boolean;
  page: number;
  list: any[];
  totalCount: number;
};
export interface IDiskReducer {
  /** 网盘空间信息 */
  rootInfo: IRootInfo;
  /** 当前网盘类型 */
  currentType: tabMsgsKeys;
  /** 列表加载状态 */
  listLoading: boolean;
  /** 网盘附件modal状态 */
  diskModalVisible: boolean;
  /** 多选选中的文件 */
  selectedRows: listItemType[];
  failMsgs: null | FailMsgsType;
  tabMsgs: {
    personal: PersonalTabMsgs;
    ent: EntTabMsgs;
    normalAtt: NormalAttTabMsgs;
    cloudAtt: CloudAttTabMsgs;
  };
  curDirId: number | null;
}
export interface DiskAttachmentsInfo {
  files: NSFileContent[];
  /* 添加为普通附件 | 云附件 */
  addType: 'normal' | 'cloud';
  mailId: string;
}
export interface DiskCloudAttachmentsInfo {
  fileDetail: MailFileAttachModel;
  mailId: string;
}
export interface DiskNormalAttachmentsInfo {
  fileDetail: MailAttachment | MailAttachment[];
  mailId: number;
}
export interface TabListVal {
  page: number;
  list: any[];
  totalCount: number;
}
const MaxReqNum = 5; // 最多请求5次
// 往来附件请求次数
let reqNum = 0;
let getNormalAttSt: number | null = null;
export type tabMsgsKeys = 'personal' | 'ent' | 'normalAtt' | 'cloudAtt';
const InitialRootInfo = {
  ent: null,
  personal: null,
};
const InitialTabMsgs = {
  personal: {
    isLocked: false,
    page: 1,
    list: [],
    totalCount: 0,
  },
  ent: {
    page: 1,
    list: [],
    totalCount: 0,
  },
  normalAtt: {
    normalAttReady: false,
    page: 1,
    list: [],
    totalCount: 0,
  },
  cloudAtt: {
    page: 1,
    list: [],
    totalCount: 0,
  },
};
const InitialState: IDiskReducer = {
  rootInfo: InitialRootInfo,
  listLoading: false,
  diskModalVisible: false,
  currentType: 'personal',
  selectedRows: [],
  failMsgs: null,
  // 各标签内容
  tabMsgs: InitialTabMsgs,
  curDirId: null,
};
const selectedRows = (state: RootState) => state.diskAttReducer.selectedRows;
export const selectedTotalSizeOver100M = createDraftSafeSelector(selectedRows, files => {
  const totalSize = files.reduce((acc, item) => acc + item?.size, 0);
  return totalSize / 1024 / 1024 > 100;
});
// 获取网盘根目录信息
export const doGetRootInfoAsync = createAsyncThunk('DiskReducer/doGetRootInfoAsync', async (_, { dispatch }) => {
  try {
    dispatch(diskSlice.actions.doSetListLoading(true));
    const isLocked = await diskApi.isLockEnabledUsingGET();
    dispatch(diskSlice.actions.doSetPersonalLock(isLocked));
    //  同时获取 个人空间/企业空间 列表
    const result = await Promise.allSettled([diskApi.doGetNSFolderInfo({ type: 'personal' }), diskApi.doGetNSFolderInfo({ type: 'ent' })]);
    dispatch(diskSlice.actions.doSetListLoading(false));
    const _result = result.reduce((acc, item, index) => {
      const type = index === 0 ? 'personal' : 'ent';
      if (item.status === 'fulfilled') {
        acc[type] = item.value;
      } else {
        acc[type] = null;
      }
      return acc;
    }, {} as IRootInfo);
    dispatch(diskSlice.actions.doSetRootInfo(_result));
  } catch (error) {
    dispatch(diskSlice.actions.doSetListLoading(true));
    console.log('获取网盘根目录失败', error);
  }
});
/** 获取列表 统一处理 */
export const doGetAttsAsync = createAsyncThunk('DiskReducer/doGetAttsAsync', async (param: DoGetAttsAsyncParams, { getState, dispatch }) => {
  try {
    dispatch(diskSlice.actions.doSetListLoading(true));
    dispatch(diskSlice.actions.doSetFailMsgs(null));
    const { tabMsgs, curDirId } = (getState() as RootState).diskAttReducer;
    // 当前类型
    const { type, init } = param;
    // 当前页码
    const curPage = init ? 1 : tabMsgs[type].page;
    // init 重置数据
    if (init) {
      dispatch(
        diskSlice.actions.doUpdateTabMsg({
          tab: type,
          val: InitialState.tabMsgs[type],
        })
      );
    }
    // 往来附件
    if (type === 'normalAtt') {
      const {
        success,
        list: normalAtts,
        total = 0,
        notReady,
      } = await mailApi.listAttachments({
        order: 'date',
        desc: true,
        start: (curPage - 1) * 30,
        limit: 10,
        returnTotal: true,
        skipLockedFolders: true,
      });
      if (success) {
        // 后台未准备好
        if (success && notReady) {
          // 超过最大次数，视为请求失败
          if (reqNum > MaxReqNum) {
            dispatch(diskSlice.actions.doSetListLoading(false));
            getNormalAttSt && clearTimeout(getNormalAttSt);
            message.error({ content: getIn18Text('QINGQIUSHIBAI') });
            dispatch(
              diskSlice.actions.doUpdateTabMsg({
                tab: 'normalAtt',
                val: {
                  page: 1,
                  totalCount: 0,
                  list: [],
                  normalAttReady: true,
                },
              })
            );
            return;
          }
          // 循环
          getNormalAttSt = setTimeout(() => {
            reqNum += 1;
            dispatch(doGetAttsAsync(param));
          }, 2000);
          dispatch(
            diskSlice.actions.doUpdateTabMsg({
              tab: 'normalAtt',
              val: {
                page: 1,
                totalCount: 0,
                list: [],
                normalAttReady: false,
              },
            })
          );
          return;
        }
        dispatch(diskSlice.actions.doSetListLoading(false));
        // 准备好了
        const managedList = (normalAtts || [])?.map(l => ({
          ...l,
          name: l?.attn,
          size: l?.attsize,
          updateTime: l?.sentDate,
          rowId: `${l?.id}__${l?.partId}`,
        }));
        dispatch(
          diskSlice.actions.doUpdateTabMsg({
            tab: 'normalAtt',
            val: {
              page: curPage + 1,
              totalCount: total,
              list: init ? managedList : [...tabMsgs['normalAtt'].list, ...managedList],
              normalAttReady: true,
            },
          })
        );
      }
      return;
    }
    // 云附件
    if (type === 'cloudAtt') {
      const { cloudAttachments = [], totalCount = -1 } = await diskApi.getCloudAttList({
        pageSize: 10,
        page: curPage,
      });
      dispatch(diskSlice.actions.doSetListLoading(false));
      const managedList = cloudAttachments?.map(l => ({
        ...l,
        name: l?.fileName,
        size: l?.fileSize,
        updateTime: l?.updateTime,
        rowId: l?.identity,
      }));
      dispatch(
        diskSlice.actions.doUpdateTabMsg({
          tab: 'cloudAtt',
          val: {
            page: curPage + 1,
            totalCount,
            list: init ? managedList : [...tabMsgs['cloudAtt'].list, ...managedList],
          },
        })
      );
      return;
    }
    // 个人空间/企业空间
    if (['personal', 'ent'.includes(type)]) {
      const { init } = param;
      if (!curDirId) return;
      // 个人空间被锁
      if (type === 'personal' && tabMsgs['personal'].isLocked) {
        dispatch(diskSlice.actions.doSetListLoading(false));
        return;
      }
      const {
        dirList,
        fileList,
        fileTotalCount = -1,
        dirTotalCount = -1,
      } = await diskApi.doListNSContent({
        ...param,
        dirId: curDirId,
        sort: 'createTime',
        pageSize: 10,
        needAuthorityInfo: true,
        page: curPage,
      } as RequestNSFolderContent);
      dispatch(diskSlice.actions.doSetListLoading(false));
      const managedList = [...dirList, ...fileList].map(item => ({
        ...item,
        rowId: item.id,
        size: (item as NSDirContent)?.totalSize || (item as NSFileContent)?.size || 0,
      }));
      dispatch(
        diskSlice.actions.doUpdateTabMsg({
          tab: type,
          val: {
            page: curPage + 1,
            totalCount: fileTotalCount + dirTotalCount,
            list: init ? managedList : [...tabMsgs[type as tabMsgsKeys].list, ...managedList],
          },
        })
      );
      return;
    }
  } catch (error) {
    dispatch(diskSlice.actions.doSetListLoading(false));
    dispatch(
      diskSlice.actions.doSetFailMsgs({
        failIntro: error === 'NETWORK.ERR.TIMEOUT' ? getIn18Text('WUWANGLUO\uFF0CQING') : getIn18Text('JIAZAISHIBAI\uFF0C'),
        failParams: { ...param },
      })
    );
    return;
  }
});

// 写信选择网盘文件，内容都属于主账号
/** 网盘文件添加为普通附件/云附件 */
export const doAddDiskAttachment = createAsyncThunk('DiskReducer/doAddDiskAttachment', async (param: DiskAttachmentsInfo, { getState, dispatch }) => {
  try {
    dispatch(diskSlice.actions.doSetListLoading(true));
    const { files, addType, mailId } = param;
    const rootState = getState() as RootState;
    const diskType = rootState.diskAttReducer.currentType;
    const currentMail = rootState.mailReducer.currentMail;
    const senderEmail = currentMail?.initSenderStr || '';
    const selectedRows = rootState.diskAttReducer.selectedRows;
    const currentAttachments = rootState.attachmentReducer.attachments.filter(at => at.mailId === mailId);
    const fileIds = files.map(f => f?.id);
    const isPersonal = diskType === 'personal';

    const addCloudAttachments = async (fileIds: number[], _account?: string) =>
      diskApi[isPersonal ? 'doAddAttachmentPersonalAsCloud' : 'doAddAttachmentEntAsCloud'](fileIds, _account);
    const addNormalAttachments = async (fileIds: number[], _account?: string) =>
      diskApi[isPersonal ? 'doAddAttachmentPersonalAsNormal' : 'doAddAttachmentEntAsNormal'](fileIds, _account);
    const over5G = files.some(file => file?.size / 1024 / 1024 / 1024 > 5);
    // 最终上传的附件
    let attachments: MailFileAttachModel[] = [];
    if (over5G) {
      message.warn(getIn18Text('TIANJIASHIBAI\uFF0C11'));
      return false;
    }
    // 个人空间/企业空间
    // 信息不完备 先请求详情 后添加
    if (['personal', 'ent'].includes(diskType)) {
      // senderEmail && accountApi.setCurrentAccount(senderEmail);
      let res: AddDiskFileToAttRes[] = [];
      // 添加为附件
      if (addType === 'normal') {
        // 将个人/企业空间文件添加为一般附件
        res = await addNormalAttachments(fileIds, '');
        attachments = res.map(({ fileName, fileUrl, isCloud, fileSize, expired, id }) => ({
          id: id as number,
          expired,
          fileName,
          fileSize,
          type: 'netUrl',
          fileUrl,
          isCloud,
          downloadContentId: fileUrl,
          downloadId: fileUrl,
        }));
      }
      // 添加为云附件
      if (addType === 'cloud') {
        res = await addCloudAttachments(fileIds);
        attachments = res.map(({ fileName, fileUrl, isCloud, fileSize, expired, identity }) => ({
          id: identity as string,
          expired,
          fileName,
          fileSize,
          type: 'netUrl',
          fileUrl,
          isCloud,
          downloadContentId: fileUrl,
          downloadId: fileUrl,
        }));
      }
    }
    // 云附件
    // 云附件列表拥有完备的信息
    if (diskType === 'cloudAtt') {
      attachments = (selectedRows as unknown as CloudAtt[])
        .map(item => {
          const { fileName, downloadUrl, identity, fileSize, expireTime } = item;
          return {
            expired: expireTime,
            downloadContentId: downloadUrl,
            downloadId: downloadUrl,
            fileName,
            fileSize,
            id: identity as string,
            type: 'trs' as MailFileAttachmentType,
            fileUrl: downloadUrl, // 下载地址
            isCloud: addType === 'cloud',
          };
        })
        ?.filter(n => {
          const target = currentAttachments.find(c => c.id === n.id);
          return !target;
        });
    }

    // 往来附件
    // 往来附件列表拥有完备的信息
    if (diskType === 'normalAtt') {
      attachments = (selectedRows as unknown as listItemType[])
        .map(item => {
          const { partId, id, attn, attsize, rowId } = item;
          // 生成下载地址
          const downloadUrl = (mailApi as any).mailContentHandler.buildAttachmentDownloadUrl(
            {
              // todo wanglijun 需要一个_account
              _account: '',
              filename: attn,
              id: partId,
            },
            id,
            true
          );
          return {
            id: rowId,
            expired: 0, // 永不过期
            fileName: attn,
            fileSize: attsize,
            type: 'fromInternalMail',
            midOfSourceMail: id,
            partOfSourceMail: partId,
            fileUrl: downloadUrl,
            isCloud: addType === 'cloud',
          };
        })
        ?.filter(n => {
          const target = currentAttachments.find(c => c.id === n.id);
          return !target;
        });
    }
    // senderEmail && accountApi.setCurrentAccount(senderEmail);
    mailApi
      .doAddAttachment(mailId, attachments, { usingCloud: addType === 'cloud' }, senderEmail)
      .then(res => {
        const attrs = attachments.map(({ fileName, fileUrl, fileSize, id, expired, type }) => ({
          mailId,
          fileUrl,
          size: fileSize,
          name: fileName,
          fileName,
          cloudAttachment: addType === 'cloud',
          type,
          id,
          expired,
        }));
        console.log('[attach reducer] add attachment:', attrs);
        dispatch(AttachmentActions.doAddAttachment(attrs));
        dispatch(diskSlice.actions.doToggleDiskModal(false));

        // 缓存附件用于发信失败重传
        dispatch(
          MailActions.doChangeCacheAttachment({
            id: mailId,
            type: addType === 'cloud' ? 'diskCloudFile' : diskType === 'normalAtt' ? 'diskNormalFile' : 'diskFile',
            value: attachments,
            operationType: 'add',
          })
        );
      })
      .catch(error => {
        console.log('warn', error);
        dispatch(diskSlice.actions.doSetListLoading(false));
        dispatch(diskSlice.actions.doToggleDiskModal(false));
      });
  } catch (error) {
    const errorCode = get(error, ['data', 'code'], -1);
    // 单独针对云附件
    if (errorCode == 10304) {
      message.error(getIn18Text('YUNFUJIANKONGJIAN12'));
    } else {
      message.error(getIn18Text('TIANJIAFUJIANSHI'));
    }
    dispatch(diskSlice.actions.doSetListLoading(false));
    return [];
  }
});
export const doAddCloudAttachment = createAsyncThunk('DiskReducer/doAddCloudAttachment', async (param: DiskCloudAttachmentsInfo, { dispatch, getState }) => {
  const rootState = getState() as RootState;
  const currentMail = rootState.mailReducer.currentMail;
  const senderEmail = currentMail?.initSenderStr || '';
  try {
    const { mailId, fileDetail } = param;
    const payload = [fileDetail];
    // senderEmail && accountApi.setCurrentAccount(senderEmail);
    mailApi
      .doAddAttachment(mailId, payload, { usingCloud: true }, senderEmail)
      .then(res => {
        if (res && res[0]) {
          const { fileName, fileSize, id, type, fileUrl, isCloud } = fileDetail;
          dispatch(
            AttachmentActions.doAddAttachment([
              {
                mailId,
                fileUrl,
                size: fileSize,
                name: fileName,
                fileName,
                cloudAttachment: isCloud,
                type,
                realId: res[0].realId,
                id,
              },
            ])
          );
        }
      })
      .catch(error => {
        console.log('warn', error);
      });
  } catch (error) {
    const errorCode = get(error, ['data', 'code'], -1);
    if (errorCode == 10304) {
      message.error(getIn18Text('YUNFUJIANKONGJIAN'));
    } else {
      message.error(getIn18Text('TIANJIAFUJIANSHI'));
    }
    return [];
  }
});

// 云文档往来附件 作为附件转发
export const doAddNormalAttachment = createAsyncThunk('DiskReducer/doAddNormalAttachment', async (param: DiskNormalAttachmentsInfo, { dispatch, getState }) => {
  const rootState = getState() as RootState;
  const currentMail = rootState.mailReducer.currentMail;
  const senderEmail = currentMail?.initSenderStr || '';
  try {
    const { mailId, fileDetail } = param;
    let payload: MailAttachment[] = [];
    if (Array.isArray(fileDetail)) {
      payload = fileDetail;
    } else {
      payload = [fileDetail];
    }
    mailApi
      .doAddAttachment(mailId, payload, { usingCloud: false }, senderEmail)
      .then(res => {
        if (res?.length) {
          const atts: AttachmentView[] = [];
          res.forEach(item => {
            const { fileName, fileSize, type, fileUrl, isCloud, realId } = item;
            atts.push({
              mailId,
              fileUrl,
              size: fileSize,
              name: fileName,
              fileName,
              cloudAttachment: isCloud,
              type,
              realId,
              id: realId, // 临时用realId替换id，以保证可删除
            });
          });
          dispatch(AttachmentActions.doAddAttachment(atts));
        }
      })
      .catch(error => {
        console.log('doAddAttachment warn', error);
        return [];
      });
  } catch (error) {
    const errorCode = get(error, ['data', 'code'], -1);
    if (errorCode == 10304) {
      message.error(getIn18Text('YUNFUJIANKONGJIAN'));
    } else {
      message.error(getIn18Text('TIANJIAFUJIANSHI'));
    }
    return [];
  }
});
const resetNormalAttSt = () => {
  getNormalAttSt && clearTimeout(getNormalAttSt);
  reqNum = 0;
};
const diskSlice = createSlice({
  name: 'DiskReducer',
  initialState: InitialState,
  reducers: {
    // 打开关闭网盘附件弹窗
    doToggleDiskModal: (state, action: PayloadAction<boolean>) => {
      // 重置计数器
      resetNormalAttSt();
      // 清空
      if (action.payload === false) {
        state.currentType = 'personal';
        state.listLoading = false;
        state.selectedRows = [];
      }
      state.diskModalVisible = action.payload;
    },
    // 重置内容
    doResetData: state => {
      state.rootInfo = InitialRootInfo;
      state.tabMsgs = InitialTabMsgs;
      state.curDirId = null;
      state.listLoading = false;
      state.currentType = 'personal';
      state.selectedRows = [];
      state.failMsgs = null;
      resetNormalAttSt();
    },
    doSetRootInfo: (state, action: PayloadAction<IRootInfo>) => {
      state.rootInfo = action.payload;
    },
    doSetCurDirId: (state, action: PayloadAction<number | null>) => {
      state.curDirId = action.payload;
    },
    /** 切换网盘类型 */
    doSwitchType: (state, action: PayloadAction<tabMsgsKeys>) => {
      resetNormalAttSt();
      state.selectedRows = [];
      state.currentType = action.payload;
    },
    /** 记录列表多选文件 */
    doSetSelectedKeys: (state, action: PayloadAction<NSFileContent[]>) => {
      state.selectedRows = action.payload;
    },
    /** 设置个人网盘锁 */
    doSetPersonalLock: (state, action: PayloadAction<boolean>) => {
      const tabMsgs = state.tabMsgs;
      tabMsgs['personal'].isLocked = action.payload;
      state.tabMsgs = tabMsgs;
    },
    // 列表加载
    doSetListLoading: (state, action: PayloadAction<boolean>) => {
      state.listLoading = action.payload;
    },
    doUpdateTabMsg: (
      state,
      action: PayloadAction<{
        tab: tabMsgsKeys;
        val: any;
      }>
    ) => {
      const { tab, val } = action.payload;
      const tabMsgs = state.tabMsgs;
      tabMsgs[tab] = {
        ...state.tabMsgs[tab],
        ...val,
      };
      state.tabMsgs = tabMsgs;
    },
    // 失败信息
    doSetFailMsgs: (state, action: PayloadAction<null | FailMsgsType>) => {
      state.failMsgs = action.payload;
    },
  },
});
export const { actions } = diskSlice;
export default diskSlice.reducer;
