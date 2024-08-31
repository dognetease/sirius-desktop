import { useEffect, Dispatch } from 'react';
import { opportunityListReq } from 'api';

export interface businessState {
  activeTab: number;
  selectedRows: number[];
  requestParams: Partial<opportunityListReq>;
  total: number;
}

export default (dispatch: Dispatch<{ type: string; payload: Partial<businessState> }>, selectedRowKeys: number[], searchParam: any, total: number) => {
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
