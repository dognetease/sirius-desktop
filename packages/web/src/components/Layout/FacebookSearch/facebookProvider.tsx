import React, { useReducer } from 'react';
import { initState, reducer, IFacebookSearchState, TUpdateTable, TUpdateGrubStatus } from './context';
import { api, apis, GlobalSearchApi } from 'api';
import { message } from 'antd';

import { timer, of, tap, mergeMap, retry, defer, throwError } from 'rxjs';
import { getIn18Text } from 'api';
const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

interface IFaceBookContext {
  state: IFacebookSearchState;
  updateTable: (result: TUpdateTable['payload']) => void;
  updatePagination: (params: { page: number; pageSize?: number }) => void;
  updateSelected: (keys: string[]) => void;
  updateQuery: (query: string) => void;
  updateTaskStatus: (taskStatus: number, extraTotal: number) => void;
  updateCertifyStatus: (isCertify: boolean) => void;
  fetchData: (showToast?: boolean, page?: number, pageSize?: number) => void;
  updateIsInit: (isInit: boolean) => void;
  updateGrubStatus: (payload: TUpdateGrubStatus['payload']) => void;
  cancelTimeoutTask: () => void;
}

const noop = () => {};

let subscription: any = null;

const FacebookContext = React.createContext<IFaceBookContext>({
  state: initState,
  updateTable: noop,
  updatePagination: noop,
  updateSelected: noop,
  updateQuery: noop,
  updateTaskStatus: noop,
  updateCertifyStatus: noop,
  fetchData: noop,
  updateIsInit: noop,
  updateGrubStatus: noop,
  cancelTimeoutTask: noop,
});

const FacebookProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initState);
  const formatResp = (result: any) => {
    let { taskStatus, total, totalExtraNums, data } = result;
    const extraTotal = totalExtraNums ?? 0;
    data = data ?? [];
    total = total ?? 0;

    data = data.map((each: any) => {
      let { id, name, nameHighLight, overviewDescription, facebookLike, facebookFans, facebookVerify, contactList, facebook, grubStatus } = each;
      contactList = contactList ?? [];
      return {
        id,
        name,
        grubStatus,
        heightLightName: nameHighLight ? nameHighLight : name,
        information: overviewDescription,
        follow: facebookFans ?? '-',
        thumbsUp: facebookLike ?? '-',
        isCertify: facebookVerify,
        facebookLink: facebook,
        contacts: contactList.map((ele: any) => {
          return {
            email: ele.contact,
            mobile: ele.phone,
          };
        }),
      };
    });
    return {
      total,
      extraTotal,
      taskStatus,
      data,
    };
  };

  const value: IFaceBookContext = {
    state,
    updateTable(tableResult) {
      dispatch({
        type: 'UPDATE_TABLE',
        payload: tableResult,
      });
    },
    updatePagination(pages) {
      dispatch({
        type: 'UPDATE_PAGE',
        payload: pages,
      });
    },
    updateSelected(keys) {
      dispatch({
        type: 'UPDATE_SELECT',
        payload: {
          selected: keys,
        },
      });
    },
    updateQuery(query) {
      dispatch({
        type: 'UPDATE_QUERY',
        payload: {
          query,
        },
      });
    },
    updateTaskStatus(taskStatus, extraTotal) {
      dispatch({
        type: 'UPDATE_TASK_STATUS',
        payload: {
          taskStatus,
          extraTotal,
        },
      });
    },
    updateCertifyStatus(isCertify) {
      dispatch({
        type: 'UPDATE_CERTIFY',
        payload: {
          isCertify,
        },
      });
    },
    updateIsInit(isInit) {
      dispatch({
        type: 'UPDATE_IS_INIT',
        payload: {
          isInit,
        },
      });
    },
    updateGrubStatus(payload) {
      dispatch({
        type: 'UPDATE_GRUB_STATUS',
        payload,
      });
    },
    cancelTimeoutTask() {
      // if (timeoutTaskId !== null) {
      //   window.clearTimeout(timeoutTaskId);
      // }
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }
    },
    fetchData(showToast = true, page = state.page, size = state.pageSize) {
      const params = {
        name: state.query,
        verified: state.isCertify,
        page,
        size,
      };
      value.cancelTimeoutTask();
      const http$ = defer(() => globalSearchApi.getFacebookCompanySearch(params)).pipe(
        tap(resp => {
          const { taskStatus, total, extraTotal, data } = formatResp(resp);
          value.updateTaskStatus(taskStatus, extraTotal);
          value.updateTable({
            total,
            tableData: data,
            status: data.length > 0 ? 'data' : 'loading',
          });

          // 任务完成
          if (taskStatus !== 1) {
            value.updateTable({
              status: 'data',
            });
          }
        }),
        mergeMap(resp => {
          const { taskStatus } = resp;
          return taskStatus === 1 ? throwError(() => new Error('tasking')) : of(resp);
        }),
        retry({
          delay(error) {
            if (error.message === 'tasking') {
              return timer(5000);
            } else {
              return throwError(() => error);
            }
          },
        })
      );

      subscription = http$.subscribe({
        next: resp => {
          if (showToast) {
            message.success(`${getIn18Text('FinishAISearchPrefix')}${resp.total}${getIn18Text('FinishAISearchSuffix')}`);
          }
        },
        error: () => {
          value.updateTable({
            status: 'data',
            total: 0,
            tableData: [],
          });
        },
      });
    },
  };

  return <FacebookContext.Provider value={value}>{children}</FacebookContext.Provider>;
};

export { FacebookContext, FacebookProvider };
