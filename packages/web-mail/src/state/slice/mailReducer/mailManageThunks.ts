/* eslint-disable no-param-reassign */
/**
 * 注意： 邮件的所有操作都需要提前设置所属账号信息
 *
 */
import { PayloadAction } from '@reduxjs/toolkit';
import { MailApi, apiHolder, apis, CommonBatchResult, SystemEvent, UpdateMailTagPayload, MailConfApi, MailBoxModel } from 'api';
import { AsyncThunkConfig, MailActions } from '@web-common/state/createStore';
import { MailBoxReducerState, thunksStore, deleteMailParam, deleteMailFromListParam, doMoveMailParam } from '../../../types';
import { thunkHelperFactory, reduxMessage, getMailListByIdFromStore, isMainAccount, folderIdIsContact } from '../../../util';
import { FolderThunks } from './folderThunks';
import { MailListThunks } from './listThunk';
import { MailBoxThunks } from './mailboxThunks';
import {
  getRealCountFromAvtiveMails,
  idIsTreadMail,
  setAccountByMailId,
  getAccountByMailId,
  getFolderByMailId,
  getIsSearchingMailByState,
  folderCanSortByTop,
} from '../../customize';
import { FLOLDER, TASK_MAIL_STATUS } from '../../../common/constant';
import { reducerHelper } from '@web-mail/state/slice/mailReducer/helper';
import { getShowByFolder } from '../../../common/components/MailMenu/util';
import { getIn18Text } from 'api';
/**
 * api
 */
const mailApis = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const mailManagerApi = apiHolder.api.requireLogicalApi('mailConfApiImpl') as unknown as MailConfApi;
/**
 * thunk
 */
const ReducerName = 'MailReducer';
const Thunks: thunksStore = {};
const ReducersList: (() => void)[] = [];
const thunkHelper = thunkHelperFactory(ReducerName, Thunks, ReducersList);
// 没有引用
// 删除当前文件及所有邮件
// thunkHelper({
//     name: 'doActiveFolderMailDeleteALl',
//     request: async (params: any[], thunkAPI: AsyncThunkConfig) => {
//         const { dispatch, rejectWithValue, getState } = thunkAPI;
//         const state = getState().mailReducer;
//         const { selectedKeys } = state;
//         const res = await mailApis.doDeleteMail(Number(selectedKeys.id));
//         if (res && res.succ) {
//             dispatch(FolderThunks.refreshFolder());
//             return { res };
//         }
//         return rejectWithValue();
//     },
//     fulfilled: state => {
//         state.commonModalVisible = false;
//         state.mailDataList = [];
//     },
//     rejected: () => {
//         reduxMessage.error({ content: getIn18Text("QINGKONGSHIBAI") });
//     }
// });
// 整个文件夹标记已读
thunkHelper({
  name: 'doActiveFolderAllRead',
  request: async (params, thunkAPI: AsyncThunkConfig) => {
    const { rejectWithValue, getState, dispatch } = thunkAPI;
    const { folderId, isThread = false, accountId } = params || {};
    const state = getState().mailReducer;
    const { selectedKeys, mailTreeStateMap } = state;
    if (folderId == null) {
      reduxMessage.error({ content: getIn18Text('WEIQUEDINGSUOZAI') });
      return rejectWithValue();
    }
    try {
      // setCurrentAccount(accountId);
      let res;
      // 获取主账号下所有有未读邮件的文件夹
      if (folderId === FLOLDER.UNREAD) {
        if (isMainAccount(accountId)) {
          // 查找主账号下文件夹中，有未读邮件的id
          let map = mailTreeStateMap?.main?.MailFolderTreeMap;
          let idList = [];
          for (let i in map) {
            let folder = map[i] as MailBoxModel;
            if (folder && folder.mailBoxId && folder?.mailBoxId >= 0 && folder?.entry?.mailBoxUnread > 0 && !folder.entry.locked) {
              idList.push(folder.mailBoxId);
            }
          }
          // 未读文件夹-未支持多账号
          res = await mailApis.doMarkMailFolderRead(idList, isThread);
        }
      } else if (folderIdIsContact(folderId)) {
        // 星标联系人-未支持多账号
        res = await mailApis.doMarkStarMailAll(folderId);
      } else {
        res = await mailApis.doMarkMailInfFolder(true, folderId, isThread as boolean, accountId);
      }

      if (res && res.succ) {
        if (selectedKeys.id == folderId) {
          // 刷新文件夹数量
          dispatch(FolderThunks.refreshFolder({ noCache: true }));
        }
        return res;
      }
    } catch (err) {
      console.error('[doActiveFolderAllRead Error]', err);
      return rejectWithValue(err);
    }
  },
  pending: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    // const params = action.meta.arg;
    // const { isThread, folderId } = params || {};
    // if (isThread && folderId !== FLOLDER.UNREAD ) {
    //   state.showGlobalLoading = true;
    // }
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    const params = action.meta.arg;
    const { folderId } = params || {};
    // state.showGlobalLoading = false;
    if (folderId == state.selectedKeys.id) {
      state.mailDataList.forEach(id => {
        const mail = state.mailEntities[id];
        if (mail) {
          mail.entry.readStatus = 'read';
        }
      });
    }
  },
  rejected: (state: MailBoxReducerState) => {
    // state.showGlobalLoading = false;
    reduxMessage.error({ content: getIn18Text('BIAOJISHIBAI') });
  },
});
// 待办邮件全标已处理
thunkHelper({
  name: 'doActiveAllReadDefer',
  request: async (params, thunkAPI: AsyncThunkConfig) => {
    const { deferTime } = params || {};
    const { rejectWithValue, dispatch } = thunkAPI;
    try {
      // setCurrentAccount();
      const res = await mailApis.doMarkMailDeferAll(deferTime);
      if (res && res.succ) {
        reduxMessage.success({
          content: getIn18Text('YICHULI'),
        });
        dispatch(FolderThunks.refreshFolder({ noCache: true }));
        return res;
      }
    } catch (err) {
      return rejectWithValue(err);
    }
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    const params = action.meta.arg;
    const { folderId } = params || {};
    if (folderId == state.selectedKeys.id && action.payload?.succ) {
      state.mailDataList.forEach((id, index) => {
        const mail = state.mailEntities[id];
        if (!mail.taskId) {
          state.mailDataList.splice(index);
        }
      });
      state.mailTotal = 0;
    } else {
      reduxMessage.error({ content: getIn18Text('CAOZUOSHIBAI\uFF0C11') });
    }
  },
  rejected: (state: MailBoxReducerState) => {
    reduxMessage.error({ content: getIn18Text('CAOZUOSHIBAI\uFF0C11') });
  },
});
// 从列表中删除邮件
thunkHelper({
  name: 'deleteMailFromList',
  request: async (params: deleteMailFromListParam, thunkAPI: AsyncThunkConfig) => {
    const { dispatch, rejectWithValue } = thunkAPI;
    const { id, showLoading = true } = params;
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const fid = getFolderByMailId(state, id);
    if (!fid) {
      showLoading &&
        reduxMessage.error({
          content: getIn18Text('WEIQUERENSUOZAI'),
        });
      return rejectWithValue();
    }
    try {
      // setAccountByMailId(state, id);
      const result = await mailApis.doDeleteMail({ fid, id, _account: getAccountByMailId(state, id) });
      return result;
      // if (result) {
      //   /**
      //    * 如果列表数量不足，重新请求数据进行填充
      //    * todo：详细的判断需要计算邮件的总高度与窗口高度之间的关系
      //    */
      //   dispatch(MailListThunks.loadMailListIfNotFullScreen(id));
      //   // 向下移动选中的邮件
      //   dispatch(MailActions.activeNextMailById(id));
      // }
    } catch (err) {
      return rejectWithValue(err);
    }
  },
  pending: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    // 快速关闭邮件操作弹窗
    state.commonModalVisible = false;
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<CommonBatchResult>) => {
    const params: deleteMailFromListParam = action.meta.arg || {};
    const res = action.payload;
    const { id, showLoading = true } = params;
    // const {
    //   mailSearchStateMap, searchList, mailDataList, mailTotal
    // } = state;
    // const isSearching = Object.keys(mailSearchStateMap).length > 0;
    // const idLen = typeof id === 'string' ? 1 : id.length;
    const isDeletedFolder = state.selectedKeys.id === FLOLDER.DELETED;
    if (res.succ) {
      state.commonModalVisible = false;
      showLoading &&
        reduxMessage.success({
          content: `邮件删除成功${isDeletedFolder ? '' : getIn18Text('\u3002KEZAI\u201CYI')}`,
        });
    }
  },
  rejected: (state: MailBoxReducerState, action) => {
    const error = action.payload;
    const { showLoading = true } = action.meta.arg || {};
    showLoading &&
      reduxMessage.error({
        content: getIn18Text('YOUJIANSHANCHUSHI'),
      });
    console.warn(error);
  },
});
// 删除邮件
thunkHelper({
  name: 'deleteMail',
  request: async (params: deleteMailParam, thunkAPI: AsyncThunkConfig) => {
    const { dispatch } = thunkAPI;
    const { id, detail = false, showLoading = true, isScheduleSend = false, folderId } = params || {};
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const { selectedKeys } = state;
    const key = folderId ? folderId : selectedKeys.id;
    const isDeleted = key === 4;
    let result = null;
    if (typeof id === 'string' && !isDeleted && !detail && !isScheduleSend) {
      result = await dispatch(Thunks.deleteMailNoConfirm(params));
    } else {
      result = await dispatch(Thunks.deleteMailReConfirm(params));
    }
    return result;
  },
});
// 直接删除邮件
thunkHelper({
  name: 'deleteMailNoConfirm',
  request: async (params: deleteMailParam, thunkAPI: AsyncThunkConfig) => {
    const { dispatch, rejectWithValue } = thunkAPI;
    const { id, showLoading = true } = params || {};
    // const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    // const messageKey = id?.toString();
    // const showGlobalLoading = showLoading === 'global';
    // 展示loading
    // if (showLoading) {
    //   if (showGlobalLoading) {
    //     state.showGlobalLoading = true;
    //   } else {
    //     reduxMessage.loading({ content: '邮件删除中', duration: 30, key: messageKey });
    //   }
    // }
    // 多选状态闭环检测
    dispatch(MailActions.mailOperCheck(id));
    try {
      const result = await dispatch(
        Thunks.deleteMailFromList({
          id,
          showLoading: false,
        })
      ).unwrap();
      return result;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
  pending: (state: MailBoxReducerState, action: PayloadAction<refreshParams>) => {
    const params: deleteMailParam = action.meta.arg || {};
    const { id, showLoading = true } = params || {};
    const messageKey = id?.toString();
    const showGlobalLoading = showLoading === 'global';
    // 展示loading
    if (showLoading) {
      if (showGlobalLoading) {
        state.showGlobalLoading = true;
      } else {
        reduxMessage.loading({
          content: getIn18Text('YOUJIANSHANCHUZHONG'),
          duration: 30,
          key: messageKey,
        });
      }
    }
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<CommonBatchResult>) => {
    const params: deleteMailParam = action.meta.arg || {};
    const { id, showLoading = true, isScheduleSend = false, folderId } = params || {};
    const res = action.payload;
    const { selectedKeys } = state;
    const key = selectedKeys ? selectedKeys.id : '';
    const messageKey = id?.toString();
    const showGlobalLoading = showLoading === 'global';
    const folder = folderId ? folderId : state.selectedKeys.id;
    const isDeletedFolder = folder === FLOLDER.DELETED;
    if (res && res.succ) {
      showLoading &&
        reduxMessage.success({
          content: `邮件删除成功${isDeletedFolder ? '' : getIn18Text('\u3002KEZAI\u201CYI')}`,
          duration: 2,
          key: messageKey,
        });
      if (showGlobalLoading) {
        state.showGlobalLoading = false;
      }
    } else {
      showLoading && reduxMessage.error({ content: getIn18Text('YOUJIANSHANCHUSHI'), duration: 2, key: messageKey });
      if (showGlobalLoading) {
        state.showGlobalLoading = false;
      }
    }
  },
  rejected: (state: MailBoxReducerState, action: PayloadAction<CommonBatchResult>) => {
    const error = action.payload;
    const params: deleteMailParam = action.meta.arg || {};
    const { id, showLoading = true, isScheduleSend = false } = params || {};
    const messageKey = id?.toString();
    reduxMessage.error({ content: getIn18Text('YOUJIANSHANCHUSHI'), duration: 2, key: messageKey });
    state.showGlobalLoading = false;
    console.warn(error);
  },
});
// 删除邮件-二次确认弹窗
thunkHelper({
  name: 'deleteMailReConfirm',
  request: async (params: deleteMailParam, thunkAPI: AsyncThunkConfig) => {
    const { dispatch } = thunkAPI;
    const { id, isScheduleSend = false, realDeleteNum, folderId } = params || {};
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const { selectedKeys, mailSearchStateMap } = state;
    const isSearching = getIsSearchingMailByState(state);
    const key = folderId ? folderId : selectedKeys.id;
    let isDeleted = key === 4;
    const mailCount = typeof id === 'string' ? 1 : id.length;
    const mailNum = getRealCountFromAvtiveMails(state);
    // eslint-disable-next-line no-nested-ternary
    let content = isDeleted ? getIn18Text('CHEDISHANCHUDE') : isScheduleSend ? getIn18Text('SHANCHUYOUJIANHOU') : '';
    // 如果是虚拟文件夹
    if (isSearching || key === FLOLDER.TAG || key === FLOLDER.REDFLAG) {
      isDeleted = false;
      if (realDeleteNum && realDeleteNum !== mailCount) {
        content = `其中${realDeleteNum}封已删除的邮件将彻底删除`;
      }
    }
    const deleteDialog = {
      danger: true,
      content,
      title: `确定${isDeleted ? getIn18Text('CHEDI') : ''}删除${typeof id === 'string' ? getIn18Text('GAI') : `选中的${mailNum}封`}邮件吗？`,
      okText: `${isDeleted ? getIn18Text('CHEDI') : ''}删除`,
      onOk: () => {
        // 多选状态闭环检测
        dispatch(MailActions.mailOperCheck(id));
        dispatch(Thunks.deleteMailNoConfirm(params));
      },
    };
    return deleteDialog;
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<object>) => {
    const deleteDialog = action.payload;
    state.dialogConfig = deleteDialog;
    state.commonModalVisible = true;
  },
});
// 邮件删除-快捷键操作
thunkHelper({
  name: 'deleteMailFromHotKey',
  request: async (params: string | string[], thunkAPI: AsyncThunkConfig) => {
    const { dispatch, rejectWithValue } = thunkAPI;
    const id = params;
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const { selectedKeys, mailEntities } = state;
    const key = selectedKeys.id;
    const isDeleted = key === 4;
    // 如果是未完成的任务邮件，拦截删除
    const idlist = typeof id === 'string' ? [id] : id;
    const mailList = idlist.map(id => mailEntities[id])?.filter(item => item) || [];
    if (mailList.some(mail => mail.taskId && mail.taskInfo && mail.taskInfo.status === TASK_MAIL_STATUS.PROCESSING)) {
      reduxMessage.info({ content: getIn18Text('WEIWANCHENGDEREN') });
      // 主动跳到错误
      return rejectWithValue();
    }
    if (typeof id === 'string' && !isDeleted) {
      // 乐观删除，不论成功与失败
      // setAccountByMailId(state, id);
      mailApis.doDeleteMail({ fid: Number(selectedKeys.id), id, _account: getAccountByMailId(state, id) }).then(res => {
        reduxMessage.success({
          content: `邮件删除成功`,
          duration: 1,
          key: id + '',
        });
      });
      // 推迟执行
      setTimeout(() => {
        dispatch(MailListThunks.loadMailListIfNotFullScreen(id));
      }, 0);
      // 向下移动选中的邮件
      return dispatch(MailActions.activeNextMailById(id));
    }
    dispatch(Thunks.deleteMail({ id }));
    return rejectWithValue();
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<CommonBatchResult>) => {
    // 二次弹窗会有问题
    const id = action.meta.arg || '';
    const { selectedKeys, searchList, searchResultObj, mailDataList, mailTotal } = state;
    const isSearching = getIsSearchingMailByState(state);
    const key = selectedKeys ? selectedKeys.id : '';
    const isDeleted = key === 4;
    if (typeof id === 'string' && !isDeleted) {
      if (isSearching) {
        state.searchList = searchList.filter(mailId => mailId !== id);
        state.searchResultObj = {
          ...searchResultObj,
          total: searchResultObj.total - 1,
        };
      } else {
        state.mailDataList = mailDataList.filter(mailId => mailId !== id);
        state.mailTotal = mailTotal - 1;
      }
    }
  },
});
// 从列表总移动邮件
thunkHelper({
  name: 'doMoveMail',
  request: async (params: doMoveMailParam, thunkAPI: AsyncThunkConfig) => {
    const { dispatch, rejectWithValue, getState } = thunkAPI;
    const { mailId, folderId, showLoading = true } = params;
    try {
      const state = getState().mailReducer;
      // setAccountByMailId(state, mailId);
      const res = await mailApis.doMoveMail(mailId, folderId, undefined, undefined, getAccountByMailId(state, mailId));
      if (res && res.succ) {
        /**
         * 如果列表数量不足，重新请求数据进行填充
         * todo：详细的判断需要计算邮件的总高度与窗口高度之间的关系
         */
        // dispatch(MailListThunks.loadMailListIfNotFullScreen(mailId));
        // // 向下移动选中的邮件
        // dispatch(MailActions.activeNextMailById(mailId));
        return res;
      }
    } catch (err) {
      return rejectWithValue(err);
    }
  },
  pending: (state: MailBoxReducerState, action: PayloadAction<CommonBatchResult>) => {
    const { mailId, showLoading = true } = action.meta.arg;
    const messageKey = mailId.toString();
    const showGlobalLoading = showLoading === 'global';
    if (showLoading) {
      if (showGlobalLoading) {
        state.showGlobalLoading = true;
      } else {
        reduxMessage.loading({
          content: getIn18Text('YOUJIANYIDONGZHONG'),
          duration: 35,
          key: messageKey,
        });
      }
    }
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<CommonBatchResult>) => {
    const params = action.meta.arg;
    const { mailId, showLoading = true } = params;
    const { searchList, mailDataList } = state;
    const isSearching = getIsSearchingMailByState(state);
    const showGlobalLoading = showLoading === 'global';
    const messageKey = mailId.toString();
    showLoading &&
      reduxMessage.success({
        content: getIn18Text('YOUJIANYIDONGCHENG'),
        duration: 1,
        key: messageKey,
      });
    if (showGlobalLoading) {
      state.showGlobalLoading = false;
    }
    // if (isSearching) {
    //   state.searchList = searchList.filter(id => {
    //     if (typeof mailId === 'string') {
    //       return id !== mailId;
    //     }
    //     return mailId?.indexOf(id) < 0;
    //   });
    // } else {
    //   state.mailDataList = mailDataList.filter(id => {
    //     if (typeof mailId === 'string') {
    //       return id !== mailId;
    //     }
    //     return mailId?.indexOf(id) < 0;
    //   });
    // }
  },
  rejected: (state: MailBoxReducerState, action) => {
    const { mailId, showLoading = true } = action.meta.arg;
    const error = action.payload;
    const messageKey = mailId.toString();
    showLoading && reduxMessage.warn({ content: getIn18Text('YOUJIANYIDONGSHI'), duration: 1, key: messageKey });
    state.showGlobalLoading = false;
    console.warn(error);
  },
});
// 移动弹窗的确认按钮
thunkHelper({
  name: 'doMoveMailFromModal',
  request: async (params: doMoveMailParam, thunkAPI: AsyncThunkConfig) => {
    const { dispatch } = thunkAPI;
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const { mfModalSelectedFids, mailMoveMid } = state;
    if (!mfModalSelectedFids) {
      reduxMessage.error({
        content: getIn18Text('QINGXUANZEYAOYI'),
      });
      return;
    }
    const showLoading = typeof mailMoveMid === 'string' && idIsTreadMail(mailMoveMid) ? 'global' : true;
    dispatch(
      Thunks.doMoveMail({
        mailId: mailMoveMid.mailId,
        folderId: mfModalSelectedFids[0],
        showLoading,
        accountId: mailMoveMid.accountId,
      })
    );
  },
  fulfilled: (state: MailBoxReducerState) => {
    state.mailMoveModalVisiable = false;
  },
});
// 邮件置顶的api层反向同步
thunkHelper({
  name: 'syncMailTop',
  request: async (params: SystemEvent<any>, thunkAPI: AsyncThunkConfig) => {
    const { dispatch } = thunkAPI;
    // const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    // const { mailDataList, selectedKeys } = state;
    // const { eventData, eventStrData, _account } = params;
    // const { id, mark } = eventData.params;

    dispatch(
      MailListThunks.refreshMailList({
        showLoading: false,
        toTop: false,
        // accountId: _account,
      })
    );

    // 处于当期那账号的列表下的时候
    // if (eventStrData === 'top' && _account == selectedKeys.accountId) {
    //   if (eventData.status === 'success') {
    //     // const top = rank === -10;
    //     const isSearching = getIsSearchingMailByState(state);
    //     // 判断置顶的邮件，是否在当前列表中
    //     const index = mailDataList.findIndex(item => item === id);
    //     // if (mailDataList && mailDataList.length) {
    //     //   if (index >= 0) {
    //     //     // 判断是否需要进行处理
    //     //     if (!isSearching && folderCanSortByTop(state.selectedKeys.id) && state.mailListStateTab === 'ALL') {
    //     //       if (!mark) {
    //     //         await dispatch(
    //     //           MailListThunks.loadMailList({
    //     //             loadMailList: 0,
    //     //             showLoading: false,
    //     //             // accountId: _account,
    //     //           })
    //     //         )
    //     //           .unwrap()
    //     //           .then(data => {
    //     //             const { result } = data;
    //     //             // 取消置顶后，如果其范围超出列表。取消其选中状态。
    //     //             if (!(result && result.data && result.data.length && result.data.find(item => item.entry.id === id))) {
    //     //               dispatch(MailActions.doUpdateActiveIds([]));
    //     //             }
    //     //           });
    //     //       }
    //     //       return;
    //     //     }
    //     //   } else {
    //     //     /**
    //     //      * 当邮件取消置顶后存在邮件空挂的情况。在这种情况下，再次操作置顶，需要刷新列表
    //     //      */
    //     //     if (!mark) {
    //     //       dispatch(
    //     //         MailListThunks.refreshMailList({
    //     //           showLoading: false,
    //     //           // accountId: _account,
    //     //         })
    //     //       );
    //     //     }
    //     //   }
    //     }
    //   }
    // if (eventData.status === 'fail') {
    //   dispatch(
    //     MailListThunks.refreshMailList({
    //       showLoading: false,
    //       // accountId: _account,
    //     })
    //   );
    // }
    // }
  },
  // pending: (state: MailBoxReducerState, action: PayloadAction<SystemEvent<any>>) => {
  //   const { eventData, eventStrData } = action.meta.arg;
  // },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<SystemEvent<any>>) => {
    const params = action.meta.arg;
    const { eventData, eventStrData, _account } = params;
    // const { id, mark } = eventData.params;
    // const { mailDataList, mailEntities, selectedKeys } = state;
    // const maillist = getMailListByIdFromStore(mailDataList, mailEntities);
    // const index = mailDataList.findIndex(item => item === id);
    // const mail = maillist[index];
    // if (_account == selectedKeys.accountId) {
    //   // 受限制的文件夹，列表不进行变化
    //   if (eventData.status === 'success' && state.selectedKeys.id !== FLOLDER.REDFLAG && !getShowByFolder(mail, [FLOLDER.DELETED, FLOLDER.SPAM, FLOLDER.DRAFT])) {
    //     if (mark) {
    //       // 列表回到顶部
    //       state.scrollTop = 0;
    //       // 将列表以时间顺序插入到置顶邮件中
    //       // mailDataList.splice(index, 1);
    //       // let insertIndex = 0;
    //       // let start = 0;
    //       // if (maillist[0]?.taskId) {
    //       //   start += 1;
    //       // }
    //       // if (maillist[1]?.taskId && start == 1) {
    //       //   start += 1;
    //       // }
    //       // insertIndex = start;
    //       // for (let i = start; i < maillist.length; i++) {
    //       //   // 排除任务邮件的影响
    //       //   const curMail = maillist[i];
    //       //   if (curMail.entry.top) {
    //       //     if (new Date(curMail.entry.receiveTime) < new Date(mail.entry.receiveTime)) {
    //       //       break;
    //       //     }
    //       //     insertIndex += 1;
    //       //   }
    //       // }
    //       // // if(index < insertIndex){
    //       // //   insertIndex -= 1;
    //       // // }
    //       // // state.mailDataList = mailDataList.filter(item=>item !== id);
    //       // mailDataList.splice(insertIndex, 0, id);
    //     }
    //   }
    if (eventData.status === 'success' || eventData.status === 'fail') {
      // 同步装填
      reducerHelper.updateMailEntity(state.mailEntities, 'top', eventData.result);
    }
    // }
  },
});
// 邮件删除的api层消息同步
thunkHelper({
  name: 'syncMailDeleted',
  request: async (params: SystemEvent<any>, thunkAPI: AsyncThunkConfig) => {
    const { dispatch } = thunkAPI;
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const { eventData, eventStrData, _account } = params;
    const { selectedKeys } = state;
    const isSearching = getIsSearchingMailByState(state);
    const isUseRealList = state.useRealList && !isSearching;
    if (eventData.status === 'success' && eventData.result && _account == selectedKeys.accountId) {
      const mailIds = eventData.params.id;
      // eventData.result?.forEach((item, id) => {
      //   if(item && id){
      //     mailIds.push(id);
      //   }
      // });
      // 列表不足则加载
      // todo: 删除后的数量判断需要根据idlist 计算，现在只是1
      setTimeout(() => {
        dispatch(
          MailListThunks.loadMailListIfNotFullScreen({
            mailIds,
            ids: isUseRealList ? mailIds : [],
            accountId: _account,
          })
        );
      }, 0);
      // 如果是分栏&处于主tab
      if (state.configMailLayout != '2') {
        dispatch(MailActions.activeNextMailById(mailIds));
      }
    }
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<SystemEvent<any>>) => {
    const params = action.meta.arg || {};
    const { eventData, _account } = params;
    // const mailIds: string[] = [];
    // 邮件删除的消息，不用区分账号，按照id操作即可
    if (eventData.status === 'success') {
      const mailIds = Array.isArray(eventData.params.id) ? eventData.params.id : [eventData.params.id];
      // eventData.result?.forEach((item, id) => {
      //   if(item && id){
      //     mailIds.push(id);
      //   }
      // });
      const { searchList, searchResultObj, mailDataList, mailTotal } = state;
      const idLen = mailIds.length;
      // 过滤搜索列表
      state.searchList = searchList.filter(mailId => {
        return mailIds.indexOf(mailId) < 0;
      });
      state.searchResultObj = {
        ...searchResultObj,
        total: searchResultObj.total - idLen,
      };
      // 过滤邮件列表
      state.mailDataList = mailDataList.filter(mailId => {
        return mailIds?.indexOf(mailId) < 0;
      });
      for (let key in state.customer) {
        if (state.customer[key]) {
          const { mailDataList, mailTotal } = state.customer[key];
          state.customer[key].mailDataList = mailDataList?.filter(mailId => {
            return mailIds?.indexOf(mailId) < 0;
          });
          state.customer[key].mailTotal = mailTotal - idLen;
        }
      }
      state.mailTotal = mailTotal - idLen;
      // 过滤邮件详情中的邮件id列表
      state.readMailChildMailList = state.readMailChildMailList.filter(id => mailIds?.indexOf(id) < 0);
      // 清空独立读信页的id
      // todo: 独立的读信页不会主动关闭
      if (mailIds?.includes(state.readMailWindowActiveMailId)) {
        state.readMailWindowActiveMailId = null;
      }
      // 往来邮件
      if (mailIds?.includes(state.mailRelateActiveMialId)) {
        state.mailRelateActiveMialId = null;
      }
      if (mailIds.some((item: string) => state.mailRelateMailList.includes(item))) {
        state.mailRelateMailList = state.mailRelateMailList.filter(item => !mailIds.includes(item));
      }
      // 陌生人往来邮件
      if (mailIds?.includes(state.mailRelateStrangerActiveId)) {
        state.mailRelateStrangerActiveId = '';
      }
      if (mailIds.some((item: string) => state.mailRelateStrangeMailList.includes(item))) {
        state.mailRelateStrangeMailList = state.mailRelateStrangeMailList.filter(item => !mailIds.includes(item));
      }
      // todo: 外贸的有邮件操作，需要加到此处。
      // if(mailIds.some((item:string)=>{state.activeStrangerIds.includes(item)})){
      //   state.activeStrangerIds = state.activeStrangerIds.filter(item=>!mailIds.includes(item))
      // }
    }
  },
});
// 邮件移动的的api层消息同步
thunkHelper({
  name: 'syncMailMove',
  request: async (params: SystemEvent<any>, thunkAPI: AsyncThunkConfig) => {
    const { dispatch } = thunkAPI;
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const { eventData, eventStrData, _account } = params;
    const isSearching = getIsSearchingMailByState(state);
    const isUseRealList = state.useRealList && !isSearching;
    if (eventData.status === 'success' && _account == state.selectedKeys.accountId) {
      const { id, fid } = eventData?.params || {};
      if (id && fid) {
        // 如果当期那操作的邮件在当前选中的文件夹下
        if (fid !== state.selectedKeys.id) {
          if (!isUseRealList) {
            setTimeout(() => {
              dispatch(MailListThunks.loadMailListIfNotFullScreen(id));
            }, 0);
          } else {
            setTimeout(() => {
              dispatch(MailListThunks.loadMailListIfNotFullScreen({ ids: Array.isArray(id) ? id : [id] }));
            }, 0);
          }
          // 向下移动选中的邮件
          dispatch(MailActions.activeNextMailById(id));
        }
      }
    }
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<SystemEvent<any>>) => {
    const params = action.meta.arg || {};
    const { eventData } = params;
    const { mailDataList } = state;
    if (eventData?.status === 'success' || eventData?.status === 'fail') {
      // 同步装填
      // reducerHelper.updateMailEntity(state.mailEntities, 'move', eventData.result);
      // 修改邮件属性
      const { id, fid } = eventData?.params || {};
      if (id) {
        const mailId = Array.isArray(id) ? id : [id];
        const isSearching = getIsSearchingMailByState(state);
        const isUseRealList = state.useRealList && !isSearching;
        if (isUseRealList) {
          state.mailTotal = state.mailTotal - mailId.length;
        }
        mailId.forEach(item => {
          const mail = state.mailEntities[item];
          if (mail) {
            mail.entry.folder = fid;
          }
        });
        // 过滤邮件列表
        if (fid !== state.selectedKeys.id) {
          state.mailDataList = mailDataList.filter(item => {
            return mailId?.indexOf(item) < 0;
          });
        }
      }
    }
  },
});
// 同步邮件标签的api状态
thunkHelper({
  name: 'syncMailTagOper',
  request: async (param: UpdateMailTagPayload, thunkAPI: AsyncThunkConfig) => {
    const { dispatch } = thunkAPI;
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const { type, params, _account } = param;
    if (type == 'add') {
      // 重新获取邮件标签- 现在只有主账号有
      // setCurrentAccount();
      dispatch(MailBoxThunks.requestTaglist({ account: _account }));
    }
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<UpdateMailTagPayload>) => {
    const param = action.meta.arg || {};
    const { type, params, _account } = param;
    if (type == 'delete') {
      if (params && params.length) {
        const tagName = params[0];
        const { mailTagFolderActiveKey, selectedKeys } = state;
        // 如果删除的标签是当前选中的标签，则将文件夹的选中态移动到收件箱去
        if (selectedKeys.id === FLOLDER.TAG && tagName === mailTagFolderActiveKey?.key) {
          state.selectedKeys = { ...state.selectedKeys, id: FLOLDER.DEFAULT };
        }
        // 清除所有邮件的该标签而不发送请求
        if (tagName?.key) {
          for (let mail of Object.values(state.mailEntities)) {
            if (mail && mail.tags && _account == mail?._account) {
              mail.tags = mail.tags.filter((t: string) => t != tagName?.key);
            }
          }
        }
      }
    } else if (type == 'replace' || type == 'update') {
      const tagName = params[0];
      const alias = params[1]?.alias;
      if (tagName && alias) {
        for (let mail of Object.values(state.mailEntities)) {
          if (mail && mail.tags && _account == mail?._account) {
            mail.tags = mail.tags.map((tag: string) => {
              if (tag === tagName) {
                return alias;
              }
              return tag;
            });
          }
        }
      }
    }
  },
});
export const mailManageThunks = Thunks;
export const mailManageReducersList = ReducersList;
