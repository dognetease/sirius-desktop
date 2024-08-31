import React, { FC, useEffect, useMemo, useState } from 'react';
import PurchaseChain from '../../CustomsData/customs/customsDetail/components/purchaseChain';
import { edmCustomsApi } from '../constants';
import { recData } from '../../CustomsData/customs/customs';

interface Props {
  relationCountryList?: string[];
  from: number;
  originCompanyName: string;
  companyName: string;
  country: string;
  openDrawer?: (content: recData['content']) => void;
  tabKey?: string;
  companyList?: Array<{
    name: string;
    country?: string;
    companyId: number;
    location?: string;
  }>;
  time: string[];
}
interface BuyAndSupportType {
  buy: any;
  supplie: any;
}
export const PurchaseChainTab: FC<Props> = ({ relationCountryList, from, originCompanyName, companyName, country, openDrawer, companyList, tabKey, time }) => {
  const [buyAndSupport, setBuyAndSupport] = useState<BuyAndSupportType>({} as BuyAndSupportType);
  const featchPurchaseBuyers = async () => {
    if (!companyList?.length) return [];
    // let buyers
    const res = await edmCustomsApi.getBuyersCompanyList({
      size: 10,
      companyList: companyList.map(item => ({ companyName: item.name, country: item.country })),
      country,
      groupByCountry: true,
      from: from - 1,
      sortBy: 'relationCompanyCnt',
      order: 'desc',
      relationCountry: relationCountryList,
      conCountryList: relationCountryList,
      shpCountryList: relationCountryList,
      startYear: '',
      endYear: '',
      beginDate: time[0],
      endDate: time[1],
      sourceType: 'global',
    });
    return res.companies;
  };
  const featchPurchaseSupplier = async () => {
    if (!companyList?.length) return [];
    const res = await edmCustomsApi.getSuppliersCompanyList({
      size: 10,
      companyList: companyList.map(item => ({ companyName: item.name, country: item.country })),
      groupByCountry: true,
      from: from - 1,
      sortBy: 'relationCompanyCnt',
      order: 'desc',
      relationCountry: relationCountryList,
      shpCountryList: relationCountryList,
      conCountryList: relationCountryList,
      startYear: '',
      endYear: '',
      beginDate: time[0],
      endDate: time[1],
      sourceType: 'global',
    });
    return res.companies;
  };
  const featchPurchase = async () => {
    const buyers = await featchPurchaseBuyers();
    const support = await featchPurchaseSupplier();
    setBuyAndSupport({
      buy: buyers,
      supplie: support,
    });
  };

  useEffect(() => {
    featchPurchase();
  }, [companyList]);
  const companyNames = useMemo(() => (companyList || []).map((item: any) => item.companyName), [companyList]);
  const recordParams = useMemo(
    () => ({
      relationCountryList,
      from,
      originCompanyName,
      companyList: (companyList ?? []).map(item => ({ companyName: item.name, country: item.country })),
    }),
    [relationCountryList, from, originCompanyName, companyList]
  );
  return (
    <>
      <PurchaseChain
        tabList={buyAndSupport}
        recordParams={recordParams}
        companyName={companyName}
        openDrawer={openDrawer}
        country={country}
        tabKey={tabKey}
        selectCompanyList={companyNames}
        fetchType="global"
        time={time}
      />
    </>
  );
};
