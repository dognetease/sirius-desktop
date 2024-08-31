import React, { useState, useEffect } from 'react';
import FoldCard from '@/components/Layout/Customer/components/foldCard/foldCard';
import { EmailList } from '@/components/Layout/Customer/components/emailList/uniIndex';
import { CustomsList } from '@/components/Layout/Customer/components/customsList/uniCustomsList';
import style from './uniDetail.module.scss';
import { apiHolder, apis, EdmCustomsApi, CustomerEmailListCondition, customsRecordItem as customsTableType, reqBuyers as reqBuyersType, CustomerAuthDataType } from 'api';

import { Tabs } from 'antd';
import { PaginationProps } from 'antd/lib/pagination';
const { TabPane } = Tabs;

interface Props {
  noticeHandler: (data: { action: string; payload: Record<string, string> }) => void;
  condition?: string;
  mainResourceId?: string;
  relationDomain?: string;
  relationName: string;
  height?: number;
  title?: string;
}
type TabConfig = {
  key: string;
  text: string;
  trackerName: string;
};
const defaultPagination: PaginationProps = {
  current: 1,
  pageSize: 20,
  pageSizeOptions: ['20', '50', '100'],
  showSizeChanger: true,
};

const UiTabs: React.FC<Props> = ({ noticeHandler, mainResourceId, relationName, relationDomain }) => {
  const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

  const tabs: TabConfig[] = [
    { key: 'email', text: '往来邮件', trackerName: '' },
    { key: 'customs', text: '海关数据', trackerName: '' },
  ];

  const customsTabs: TabConfig[] = [
    { key: 'buysers', text: '采购', trackerName: '' },
    { key: 'suppliers', text: '供应', trackerName: '' },
  ];

  const [tabKey1, setTabKey1] = useState<string>(tabs[0].key);
  const [tabKey2, setTabKey2] = useState<string>(customsTabs[0].key);
  const [customsList, setCustomsList] = useState<customsTableType[]>([]);
  const [customsParams, setCustomsParams] = useState<reqBuyersType>({
    type: 'company',
    queryValue: '',
    from: 1,
    size: defaultPagination.pageSize,
  });
  const [customsPagination, setCustomsPagination] = useState<any>({
    total: 0,
    current: 1,
    customsTabKey: 'buysers',
  });
  const [customsTableLoading, setCustomsTableLoading] = useState<boolean>(false);

  useEffect(() => {
    if (customsPagination.customsTabKey === 'buysers') {
      if (relationName) {
        featchBuyserTable();
      }
    }
    if (customsPagination.customsTabKey === 'suppliers' && relationName) {
      if (relationName) {
        featchSppliersTable();
      }
    }
  }, [tabKey1, tabKey2, relationName]);

  const featchBuyserTable = () => {
    let params = {
      ...customsParams,
      queryValue: relationName,
      from: customsParams.from - 1,
      groupByCountry: true,
    };
    setCustomsTableLoading(true);
    edmCustomsApi.buyersList(params).then(res => {
      const { records, total } = res;
      setCustomsList(records);
      setCustomsPagination({
        ...customsPagination,
        total,
      });
      setCustomsTableLoading(false);
    });
  };
  const featchSppliersTable = () => {
    let params = {
      ...customsParams,
      queryValue: relationName,
      from: customsParams.from - 1,
      groupByCountry: true,
    };
    setCustomsTableLoading(true);
    edmCustomsApi.suppliersList(params).then(res => {
      const { records, total } = res;
      setCustomsList(records);
      setCustomsPagination({
        ...customsPagination,
        total,
      });
      setCustomsTableLoading(false);
    });
  };

  const handleTab1Click = (key: string) => {
    if (key === 'email') {
      console.log('tab-key', key);
    }
    if (key === 'customs') {
      console.log('tab-key', key);
    }
  };

  const handleTab2Click = (key: string) => {
    setCustomsParams({
      ...customsParams,
      from: 1,
    });
    setCustomsList([]);
    setCustomsPagination({
      ...customsPagination,
      customsTabKey: key,
      current: 1,
    });
    if (key === 'buysers') {
      console.log('tab-key', key);
    }
    if (key === 'suppliers') {
      console.log('tab-key', key);
    }
  };

  const handleCustomsDetail = (companyName: string, country: string) => {
    console.log('see-detail');
    const data = {
      action: 'customsDetail',
      payload: {
        companyName,
        country,
      },
    };
    noticeHandler(data);
    // let data = onDrawerOpen(recData, {to: customsPagination.customsTabKey, companyName, country}, 0);
    // setRecData({...data});
  };

  return (
    <div>
      <Tabs size="small" tabBarGutter={20} activeKey={tabKey1} onChange={setTabKey1} onTabClick={handleTab1Click}>
        {tabs.map(item => (
          <TabPane tab={item.text} key={item.key} />
        ))}
      </Tabs>
      {tabKey1 === 'email' && (
        <>
          <div className={style.contactEmails} style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '840px', padding: '10px' }}>
              <EmailList relationDomain={relationDomain} relationName={relationName} mainResourceId={mainResourceId} condition={CustomerEmailListCondition.Company} />
            </div>
          </div>
        </>
      )}
      {tabKey1 === 'customs' && (
        <>
          <FoldCard
            title={
              <Tabs size="small" tabBarGutter={20} activeKey={tabKey2} onChange={setTabKey2} onTabClick={handleTab2Click}>
                {customsTabs.map(item => (
                  <TabPane tab={item.text} key={item.key} />
                ))}
              </Tabs>
            }
          >
            <CustomsList
              data={customsList}
              tableLoading={customsTableLoading}
              pageChange={from => {
                setCustomsParams({
                  ...customsParams,
                  from,
                });
                setCustomsPagination({
                  ...customsPagination,
                  current: from,
                });
              }}
              onSeeDetail={handleCustomsDetail}
              pagination={{
                current: customsPagination.current,
                total: customsPagination.total,
              }}
            />
          </FoldCard>
        </>
      )}
    </div>
  );
};

export default UiTabs;
