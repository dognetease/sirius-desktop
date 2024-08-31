import { GlobalSearchCompanyDetail, SimilarCompanyTableDataItem } from 'api';
import { useEffect, useRef, useState } from 'react';
import { ExtendsGlobalSearchCompanyDetail } from './useCompanyDetailFetch';

interface Props {
  data?: GlobalSearchCompanyDetail & { sourceCountry?: string };
  showBuyer?: boolean;
  showSupplier?: boolean;
  similarCompanyData?: SimilarCompanyTableDataItem[];
  showFreight?: boolean;
}

export const useStickyTab = ({ data, showSupplier, showBuyer, similarCompanyData, showFreight }: Props) => {
  const [stickyTab, setStickyTab] = useState<Array<{ key: string; value: string }>>([
    {
      key: 'companyInfo',
      value: '公司信息',
    },
  ]);
  const mainRef = useRef(null);
  const companyInfoRef = useRef<HTMLDivElement>(null);
  const relationProductRef = useRef<HTMLDivElement>(null);
  const customsDataRef = useRef<HTMLDivElement>(null);
  const customChangeRef = useRef<boolean>(false);
  const stickyNode = useRef<HTMLDivElement>(null);
  const similarCompanyRef = useRef<HTMLDivElement>(null);
  const corporateInformationRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState<boolean>(false);
  const [selectStickyTab, setSelectStickyTab] = useState<string>('contacts');
  const handleStickyTabChange = (key: string) => {
    key === stickyTab[stickyTab.length - 1].key ? (customChangeRef.current = true) : (customChangeRef.current = false);
    setSelectStickyTab(key);
    switch (key) {
      case 'contacts':
        // stickyNode.current?.scrollIntoView(true);
        (mainRef.current as unknown as HTMLDivElement).scrollTo(0, stickyNode.current ? stickyNode.current?.offsetTop - 100 : 0);
        break;
      case 'companyInfo':
        companyInfoRef.current?.scrollIntoView(true);
        // (mainRef.current as unknown as HTMLDivElement).scrollTo(0, companyInfoRef.current ? companyInfoRef.current?.offsetTop - 100 : 0)
        break;
      case 'relationProduct':
        (mainRef.current as unknown as HTMLDivElement).scrollTo(0, relationProductRef.current ? relationProductRef.current?.offsetTop - 100 : 0);
        // relationProductRef.current?.scrollIntoView(true);
        break;
      case 'customsData':
        // customsDataRef.current?.scrollIntoView(true);
        (mainRef.current as unknown as HTMLDivElement).scrollTo(0, customsDataRef.current ? customsDataRef.current?.offsetTop - 100 : 0);
        break;
      case 'similarCompany':
        (mainRef.current as unknown as HTMLDivElement).scrollTo(0, similarCompanyRef.current ? similarCompanyRef.current?.offsetTop - 100 : 0);
        break;
      case 'corporateInformation':
        (mainRef.current as unknown as HTMLDivElement).scrollTo(0, corporateInformationRef.current ? corporateInformationRef.current?.offsetTop - 100 : 0);
        break;
      default:
        companyInfoRef.current?.scrollIntoView(true);
        break;
    }
  };

  const handleScrollChange = (e: any) => {
    if (
      (corporateInformationRef.current &&
        corporateInformationRef.current.offsetTop - 100 <= (e.target as HTMLDivElement).scrollTop &&
        (e.target as HTMLDivElement).scrollTop < corporateInformationRef.current.clientHeight + corporateInformationRef.current.offsetTop - 100) ||
      (corporateInformationRef.current &&
        (e.target as HTMLDivElement).scrollTop + (e.target as HTMLDivElement).clientHeight + 20 > (e.target as HTMLDivElement).scrollHeight)
    ) {
      selectStickyTab === 'corporateInformation' ? '' : setSelectStickyTab('corporateInformation');
    } else if (
      relationProductRef.current &&
      relationProductRef.current.offsetTop - 100 <= (e.target as HTMLDivElement).scrollTop &&
      (e.target as HTMLDivElement).scrollTop < relationProductRef.current.clientHeight + relationProductRef.current.offsetTop - 100
    ) {
      if (
        customChangeRef.current &&
        ((stickyNode.current && stickyNode.current.offsetTop > (e.target as HTMLDivElement).scrollTop) ||
          (customsDataRef.current && customsDataRef.current.offsetTop > (e.target as HTMLDivElement).scrollTop) ||
          (similarCompanyRef.current && similarCompanyRef.current.offsetTop > (e.target as HTMLDivElement).scrollTop) ||
          (corporateInformationRef.current && corporateInformationRef.current.offsetTop > (e.target as HTMLDivElement).scrollTop))
      ) {
        customChangeRef.current = false;
      } else if (selectStickyTab !== 'similarCompany') {
        setSelectStickyTab('similarCompany');
      }
    } else if (
      relationProductRef.current &&
      relationProductRef.current.offsetTop - 100 <= (e.target as HTMLDivElement).scrollTop &&
      (e.target as HTMLDivElement).scrollTop < relationProductRef.current.clientHeight + relationProductRef.current.offsetTop - 100
    ) {
      if (
        customChangeRef.current &&
        ((stickyNode.current && stickyNode.current.offsetTop > (e.target as HTMLDivElement).scrollTop) ||
          (customsDataRef.current && customsDataRef.current.offsetTop > (e.target as HTMLDivElement).scrollTop) ||
          (similarCompanyRef.current && similarCompanyRef.current.offsetTop > (e.target as HTMLDivElement).scrollTop) ||
          (corporateInformationRef.current && corporateInformationRef.current.offsetTop > (e.target as HTMLDivElement).scrollTop))
      ) {
        customChangeRef.current = false;
      } else if (selectStickyTab !== 'relationProduct') {
        setSelectStickyTab('relationProduct');
      }
    } else if (
      customsDataRef.current &&
      customsDataRef.current.offsetTop - 100 <= (e.target as HTMLDivElement).scrollTop &&
      (e.target as HTMLDivElement).scrollTop < customsDataRef.current.clientHeight + customsDataRef.current.offsetTop - 100
    ) {
      if (
        customChangeRef.current &&
        ((stickyNode.current && stickyNode.current.offsetTop > (e.target as HTMLDivElement).scrollTop) ||
          (similarCompanyRef.current && similarCompanyRef.current.offsetTop > (e.target as HTMLDivElement).scrollTop) ||
          (corporateInformationRef.current && corporateInformationRef.current.offsetTop > (e.target as HTMLDivElement).scrollTop))
      ) {
        customChangeRef.current = false;
      } else if (selectStickyTab !== 'customsData') {
        setSelectStickyTab('customsData');
      }
    } else if (
      stickyNode.current &&
      stickyNode.current.offsetTop - 100 <= (e.target as HTMLDivElement).scrollTop &&
      (e.target as HTMLDivElement).scrollTop < stickyNode.current.clientHeight + stickyNode.current.offsetTop - 100
    ) {
      if (customChangeRef.current && similarCompanyRef.current && similarCompanyRef.current.offsetTop > (e.target as HTMLDivElement).scrollTop) {
        customChangeRef.current = false;
      } else if (selectStickyTab !== 'contacts') {
        setSelectStickyTab('contacts');
      }
    } else if (
      companyInfoRef.current &&
      companyInfoRef.current.offsetTop - 100 <= (e.target as HTMLDivElement).scrollTop &&
      (e.target as HTMLDivElement).scrollTop < companyInfoRef.current.clientHeight + companyInfoRef.current.offsetTop - 100
    ) {
      selectStickyTab === 'companyInfo' ? '' : setSelectStickyTab('companyInfo');
    }
  };

  const onContentScroll = (evt: any) => {
    if ((evt.target as HTMLDivElement).scrollTop > 0) {
      // stickyNode.current.offsetTop
      // mainRef.current = evt.target
      mainRef.current ? '' : (mainRef.current = evt.target);
      setIsSticky(true);
    } else {
      setIsSticky(false);
    }
    handleScrollChange(evt);
  };
  useEffect(() => {
    let defaultTab = stickyTab;
    if (data?.productList && data?.productList.length > 0) {
      defaultTab.some(item => item.key === 'relationProduct')
        ? ''
        : defaultTab.push({
            key: 'relationProduct',
            value: '相关产品',
          });
    }
    if (showBuyer || showSupplier || showFreight) {
      defaultTab.some(item => item.key === 'customsData')
        ? ''
        : defaultTab.push({
            key: 'customsData',
            value: showFreight ? '货运数据' : '海关数据',
          });
    }
    defaultTab = defaultTab.filter(item => item.key !== 'contacts');
    defaultTab.push({
      key: 'contacts',
      value: '联系人',
    });
    defaultTab = defaultTab.filter(item => item.key !== 'similarCompany');
    if (similarCompanyData && similarCompanyData?.length > 0) {
      defaultTab.some(item => item.key === 'similarCompany')
        ? ''
        : defaultTab.push({
            key: 'similarCompany',
            value: '相似公司',
          });
    }
    if (data?.newsList && data?.newsList?.length > 0) {
      defaultTab.some(item => item.key === 'corporateInformation')
        ? ''
        : defaultTab.push({
            key: 'corporateInformation',
            value: '企业资讯',
          });
    }
    setStickyTab(defaultTab);
  }, [data?.productList, showBuyer, showSupplier]);
  return {
    isSticky,
    onContentScroll,
    handleStickyTabChange,
    mainRef,
    stickyTab,
    companyInfoRef,
    relationProductRef,
    customsDataRef,
    stickyNode,
    selectStickyTab,
    similarCompanyRef,
    corporateInformationRef,
  };
};
