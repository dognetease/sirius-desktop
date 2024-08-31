import React, { useState, useContext, useEffect, useRef } from 'react';
import { Popover } from 'antd';
import TableList from '../ClientTableList/clientTableList';
import { EmptyList } from '@web-edm/components/empty/empty';
import style from './clientMain.module.scss';
import { clientContext } from '../../clientContext';
import { apiHolder, DataStoreApi, apis, CustomerApi, openSeaRules as ruleType } from 'api';
import { Skeleton } from 'antd';
import { useLocation } from '@reach/router';
import Search from '../Search/search';
import HeaderLayout from '../../../components/headerLayout/headerLayout';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { useAppDispatch } from '@web-common/state/createStore';
import { getModuleDataPrivilegeAsync } from '@web-common/state/reducer/privilegeReducer';
import TableFiledsModal from '../TableFieldsModal/tableFields';
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import { ReactComponent as QuestionIcon } from '@/images/icons/edm/question.svg';
import { getIn18Text } from 'api';
interface comsProps {
  className?: string | undefined;
}
const CUSTOMERS_DATA_TABLE_SETTING = 'CUSTOMERS_OPEN_SEA_DATA_TABLE_SETTING';
const ClientMain: React.FC<comsProps> = () => {
  const { state } = useContext(clientContext).value;
  const [isShowTable, setIsShowTable] = useState<boolean>(false);
  const [heightEvent, setHeightEvent] = useState(0);
  let [tableVisible, setTableVisible] = useState<boolean>(false);
  let [currentTableSetting, setCurrentTableSetting] = useState<string[]>([]);
  let tableRef = useRef<HTMLDivElement>(null);
  let [y, setY] = useState(0);
  const [rules, setRules] = useState<ruleType>();
  const appDispatch = useAppDispatch();
  useEffect(() => {
    appDispatch(getModuleDataPrivilegeAsync('CONTACT'));
    getOpenSeaRules();
  }, []);
  const getOpenSeaRules = () => {
    clientApi.returnCustomerOpenSeaRule().then(res => {
      setRules(res);
    });
  };
  const getLocalTableSetting = () => {
    const { data } = dataStoreApi.getSync(CUSTOMERS_DATA_TABLE_SETTING);
    if (data) {
      let oldData = JSON.parse(data);
      setCurrentTableSetting(oldData);
    }
  };
  const storeTableSetting = (data: string[]) => {
    dataStoreApi.putSync(CUSTOMERS_DATA_TABLE_SETTING, JSON.stringify(data), {
      noneUserRelated: false,
    });
    getLocalTableSetting();
  };
  const tableSetting = (keys?: string[]) => {
    setTableVisible(false);
    if (Array.isArray(keys)) {
      storeTableSetting(keys);
    }
  };
  useEffect(() => {
    getLocalTableSetting();
  }, []);
  useEffect(() => {
    if (state?.RresponseCompanyList?.original_size > 0) {
      setIsShowTable(true);
    } else {
      setIsShowTable(false);
    }
  }, [state.RresponseCompanyList]);
  const location = useLocation();
  useEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];
    if (moduleName !== 'customerOpenSea') {
      return;
    }
  }, [location.hash]);
  const content = (
    <div style={{ width: 336, borderRadius: 6, padding: 16, border: '0.5px solid rgba(38, 42, 51, 0.2)' }}>
      {rules?.conditions ? (
        rules?.conditions.map((item, pindex) => {
          return (
            <div key={pindex} className={style.ruleBox}>
              <div className={style.ruleName}>{item.ruleName}</div>
              {item.contents.map((content, index) => {
                return <div className={style.ruleContent}>{`${index + 1}. ${content}`}</div>;
              })}
            </div>
          );
        })
      ) : (
        <div className={style.ruleName}>{getIn18Text('ZANWUSHEZHIGONGHAIGUIZE')}</div>
      )}
    </div>
  );
  return (
    <PermissionCheckPage resourceLabel="CONTACT" accessLabel="VIEW" menu="CONTACT_LIST">
      <div className={style.clientWrap}>
        <HeaderLayout title={getIn18Text('KEHUGONGHAI')}>
          <Popover placement="bottomRight" overlayClassName={style.openSeaRules} content={content} trigger="hover">
            <div className={style.tips}>
              {getIn18Text('TUIGONGHAIGUIZE')}
              <QuestionIcon />
            </div>
          </Popover>
        </HeaderLayout>
        <Search className={style.search} onSetting={setTableVisible} onCollapse={() => setHeightEvent(Math.random())} />
        <Skeleton active loading={state.isLoading} paragraph={{ rows: 4 }}>
          <div className={style.clientTabWrap} ref={tableRef}>
            {isShowTable ? (
              <TableList currentTableSetting={currentTableSetting} heightEvent={heightEvent} />
            ) : (
              <div style={{ height: `calc(100vh - ${y}px)` }}>
                <EmptyList className={style.clientEmpty}>
                  <p className={style.emptyBlock}>
                    {getIn18Text('ZANWUKEHUGONGHAITONGXUNLUSHUJU')}
                    <br />
                  </p>
                </EmptyList>
              </div>
            )}
          </div>
        </Skeleton>
        {tableVisible && <TableFiledsModal visible={tableVisible} list={currentTableSetting} onCancel={tableSetting} />}
      </div>
    </PermissionCheckPage>
  );
};
export default ClientMain;
