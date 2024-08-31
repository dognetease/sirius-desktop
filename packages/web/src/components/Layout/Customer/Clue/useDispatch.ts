import { useState, useEffect, Dispatch } from 'react';
import { apiHolder, apis, CustomerApi, EdmSendBoxApi, newMyClueListReq } from 'api';
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
import { navigate } from '@reach/router';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';

export interface clueState {
  activeTab: number;
  selectedRows: string[];
  requestParams: Partial<newMyClueListReq>;
  total: number;
}

export default (dispatch: Dispatch<{ type: string; payload: Partial<clueState> }>, selectedRowKeys: string[], searchParam: any, total: number) => {
  useEffect(() => {
    dispatch({
      type: 'updateSelectedRow',
      payload: {
        selectedRows: selectedRowKeys,
      },
    });
    dispatch({
      type: 'updateRequestParams',
      payload: {
        requestParams: searchParam,
      },
    });
    dispatch({
      type: 'updateTotal',
      payload: {
        total,
      },
    });
    return () => {
      dispatch({
        type: 'updateSelectedRow',
        payload: {
          selectedRows: [],
        },
      });
      dispatch({
        type: 'updateRequestParams',
        payload: {
          requestParams: {},
        },
      });
      dispatch({
        type: 'updateTotal',
        payload: {
          total: 0,
        },
      });
    };
  }, [selectedRowKeys, searchParam, total]);
};
