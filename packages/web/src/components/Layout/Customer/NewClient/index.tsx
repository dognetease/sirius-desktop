import React, { useReducer, useEffect, useState, useRef } from 'react';
import MailsExchanged from './components/MailsExchanged/mailsExchanged';
import ClinetMain from './components/ClientMain/clinetMain';
import { clientContext, clientAllState, reducer } from './clientContext';
import { apiHolder, apis, CustomerApi, RresponseCompanyList } from 'api';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';

const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import CustomerWrap from '../components/customerWrap/customerWrap';

const Client: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, clientAllState);
  const [isInit, setIsInit] = useState(true);
  const closeMailsPage = () => {
    dispatch({
      type: 'setState',
      payload: {
        pageState: 'tablePage',
      },
    });
  };
  const tabNumber = useRef(1);

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
    tabNumber.current = state.activeTab;
    if (state.activeTab === 1) {
      clientApi.companyMyList(param).then(res => {
        if (tabNumber.current === 1) {
          commonDispatch(res);
        }
      });
    }
    if (state.activeTab === 2) {
      clientApi.companyAllList(param).then(res => {
        if (tabNumber.current === 2) {
          commonDispatch(res);
        }
      });
    }
    if (state.activeTab === 3) {
      clientApi.companyForwardList(param).then(res => {
        if (tabNumber.current === 3) {
          commonDispatch(res);
        }
      });
    }
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
    if (isInit) {
      setIsInit(false);
    } else {
      if (state.requestTableParam.page) {
        fetchTableData();
      }
    }
  }, [state.requestTableParam]);
  return (
    <PermissionCheckPage resourceLabel="CONTACT" accessLabel="VIEW" menu="CONTACT_LIST">
      <CustomerWrap>
        <clientContext.Provider value={{ value: { state, dispatch, fetchTableData } }}>
          {state.pageState === 'tablePage' ? <ClinetMain /> : <MailsExchanged condition="company" close={closeMailsPage} />}
        </clientContext.Provider>
      </CustomerWrap>
    </PermissionCheckPage>
  );
};

export default Client;
