import React, { useReducer, useEffect } from 'react';
import ClinetMain from './components/ClientMain/clinetMain';
import { clientContext, clientAllState, reducer } from './clientContext';
import { apiHolder, apis, CustomerApi } from 'api';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';

const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import CustomerWrap from '../components/customerWrap/customerWrap';

const Client: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, clientAllState);

  const commonDispatch = res => {
    dispatch({
      type: 'updateTableList',
      payload: {
        RresponseCompanyList: res,
        companyList: res.content,
      },
    });
    changeStatus();
  };

  const fetchTableData = () => {
    const param = {
      ...state.requestTableParam,
    };
    clientApi.openSeaCustomerList(param).then(res => {
      commonDispatch(res);
    });
  };

  const changeStatus = () => {
    if (state.isLoading) {
      dispatch({
        type: 'setLoading',
        payload: {
          isLoading: false,
        },
      });
    }
  };

  // 初次触发不执行，通过参数变化驱动
  useEffect(() => {
    fetchTableData();
  }, [state.requestTableParam]);

  return (
    <PermissionCheckPage resourceLabel="CONTACT_OPEN_SEA" accessLabel="VIEW" menu="CONTACT_OPEN_SEA">
      <CustomerWrap>
        <clientContext.Provider value={{ value: { state, dispatch, fetchTableData } }}>
          <ClinetMain />
        </clientContext.Provider>
      </CustomerWrap>
    </PermissionCheckPage>
  );
};

export default Client;
