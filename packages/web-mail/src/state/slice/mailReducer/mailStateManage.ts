/* eslint-disable no-param-reassign */
import { PayloadAction } from '@reduxjs/toolkit';
import { MailApi, apiHolder, apis, CommonBatchResult } from 'api';
import { identity } from 'rxjs';
import { AsyncThunkConfig, MailActions } from '@web-common/state/createStore';
import { MailBoxReducerState, thunksStore, doTopMailParam, deleteMailFromListParam, doMoveMailParam } from '../../../types';
import { thunkHelperFactory, reduxMessage, getMailListByIdFromStore, getMailContentText } from '../../../util';
import { FolderThunks } from './folderThunks';
import { MailListThunks } from './listThunk';
import { getTopCountFromMailList, folderCanSortByTop, mailCanDoTop, isMerge, getAccountByMailId, getFolderByMailId, getIsSearchingMailByState } from '../../customize';
import { MAX_MAILTOP_SUM } from '../../../common/constant';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { getIn18Text } from 'api';
/**
 * api
 */
const mailApis = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
/**
 * thunk
 */
const ReducerName = 'MailReducer';
const Thunks: thunksStore = {};
const ReducersList: (() => void)[] = [];
const thunkHelper = thunkHelperFactory(ReducerName, Thunks, ReducersList);
// 邮件置顶  - 已废弃 2023-11-27
// thunkHelper({
//   name: 'doTopMail',
//   request: async (params: doTopMailParam, thunkAPI: AsyncThunkConfig) => {
//     const { dispatch, rejectWithValue } = thunkAPI;
//     const { mark, id } = params;
//     const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
//     const { selectedKeys } = state;
//     const mailDataList = getMailListByIdFromStore(state.mailDataList, state.mailEntities);
//     const isSearching = getIsSearchingMailByState(state);
//     // 聚合邮件下-不限制置顶数量
//     const topMailInMaxRange = getTopCountFromMailList(mailDataList) >= MAX_MAILTOP_SUM;
//     if (mark && topMailInMaxRange && !isMerge(selectedKeys.id, selectedKeys.accountId, isSearching) && !isSearching) {
//       SiriusModal.warning({
//         content: getIn18Text('MEIGEWENJIANJIAZDZDFYJ，QQXBFZDZTZJX', { count: MAX_MAILTOP_SUM }),
//         okText: getIn18Text('ZHIDAOLE'),
//       });
//       return rejectWithValue();
//     }
//     // const mailInList = mailDataList.findIndex(item => item.entry.id === id) >= 0;
//     // if (mailInList && mailCanDoTop(state, id)) {
//     //   if (!mark) {
//     //     // 从缓存加载刷新列表
//     //     dispatch(MailListThunks.refreshMailList({ showLoading: false }));
//     //   }
//     // } else if (mailInList && mark) {
//     //   dispatch(MailListThunks.refreshMailList({ showLoading: false }));
//     // }
//     try {
//       // setAccountByMailId(state, id);
//       const result = await mailApis.doMarkMail(mark, id, 'top', undefined, undefined, undefined, getAccountByMailId(state, id));
//       if (result) {
//         return result;
//       }
//     } catch (err) {
//       return rejectWithValue(err);
//     }
//   },
//   fulfilled: (state: MailBoxReducerState, action: PayloadAction<CommonBatchResult>) => {
//     const params: doTopMailParam = action.meta.arg || {};
//     // const res = action.payload;
//     const { id, mark } = params;
//     const mailDataList = getMailListByIdFromStore(state.mailDataList, state.mailEntities);
//     reduxMessage.success({
//       content: mark ? getIn18Text('YITIANJIAZHIDING') : getIn18Text('YIQUXIAOZHIDING'),
//       duration: 1,
//     });
//     const index = mailDataList.findIndex(item => item.entry.id === id);
//     const mailInList = index >= 0;
//     if (mailInList && mailCanDoTop(state, id)) {
//       if (mark) {
//         const mail = mailDataList[index];
//         mail.entry.top = true;
//         state.scrollTop = 0;
//         // 将列表以时间顺序插入到置顶邮件中
//         state.mailDataList.splice(index, 1);
//         let insertIndex = 0;
//         for (let i = 0; i < mailDataList.length; i++) {
//           const curMail = mailDataList[i];
//           if (curMail.entry.top) {
//             if (new Date(`${curMail.entry.receiveTime}`) < new Date(`${mail.entry.receiveTime}`)) {
//               break;
//             }
//             insertIndex += 1;
//           }
//         }
//         state.mailDataList.splice(insertIndex, 0, mail);
//       } else {
//         state.scrollTop = 0;
//         state.activeIds = [];
//       }
//     } else if (mailInList && mark) {
//       state.scrollTop = 0;
//       state.activeIds = [];
//     }
//   },
//   rejected: (state: MailBoxReducerState, action) => {
//     const error = action.payload;
//     const params: doTopMailParam = action.meta.arg || {};
//     const { mark } = params;
//     reduxMessage.error({
//       content: mark ? getIn18Text('ZHIDINGSHIBAI') : getIn18Text('QUXIAOZHIDINGSHI'),
//     });
//     console.warn(error);
//   },
// });
// 获取邮件正文语言
thunkHelper({
  name: 'doGetCurrentMailLang',
  request: async (params: { mid: string }, thunkAPI: AsyncThunkConfig) => {
    const { rejectWithValue } = thunkAPI;
    const { mid } = params;
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const { mailEntities } = state;
    const currentMailContent = mailEntities[mid];
    try {
      const mailContent = currentMailContent.entry?.content?.content;
      // 获取当前邮件的原始语言
      let result = currentMailContent?.entry?.langListMap?.originLang;
      if (result) {
        return {
          lang: result,
          mid,
        };
      }
      // 当前邮件内容存在
      if (mailContent) {
        // 当前邮件id变化了，但是没有原始的语言，去服务端获取
        const _content = getMailContentText({ content: mailContent, removeSign: true, removeUnSubText: true });
        if (_content) {
          const data = await mailApis.detectMailContentLang(mid, _content);
          // 服务端解析出来，服务端解析不出来
          if (data && data.detected) {
            return {
              lang: data.lang,
              mid,
            };
          }
        }
      }
      return {
        lang: 'zh-CHS',
        mid,
      };
    } catch (err) {
      return rejectWithValue(err);
    }
  },
  fulfilled: (state: MailBoxReducerState, action) => {
    const { mid, lang } = action.payload || {};
    const { mailEntities } = state;
    const currentMailContent = mailEntities[mid];
    const langListMap = currentMailContent.entry.langListMap || {};
    if (!langListMap.originLang) {
      langListMap.originLang = lang;
      currentMailContent.entry.langListMap = langListMap;
    }
    // return lang;
  },
  rejected: (state: MailBoxReducerState, action) => {
    const error = action?.error?.message || action.payload || action.error;
    console.warn('getMailListRequestParams', error);
  },
});
export const mailStateManageThunks = Thunks;
export const mailStateManageReducersList = ReducersList;
