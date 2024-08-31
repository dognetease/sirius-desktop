import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { Skeleton } from 'antd';
import { PrevScene, CompanyExists, ExcavateCompanyItem, GlobalSearchCompanyDetail, CustomButtonsType, IsPageSwitchItem } from 'api';
import { globalSearchDataTracker } from '../tracker';
import style from './companyDetail.module.scss';
import { CompanyDetailHeader } from './CompanyHeader';
import { edmCustomsApi, eventApi, globalSearchApi } from '../constants';
import { DetailContactTable } from './DetailContactTable';
import { SimilarCompany } from './SimilarCompanyTable';
import { CorporateInformation } from './corporateInformation';
import { useCompanyDetailFetch } from '../hook/useCompanyDetailFetch';
import { CustomsTabs } from './CustomsTabs';
import { getListItemReferByStatus, getTSourceByScene } from '../utils';
import { HeaderButtons } from './HeaderButtons';
import { useStickyTab } from '../hook/useStickyTab';
import ZnCompanyList from '../../CustomsData/customs/customsDetail/components/znCompanyList';
import { useIsForwarder } from '../../CustomsData/customs/ForwarderSearch/useHooks/useIsForwarder';
// import { Tabs } from '@web-common/components/UI/Tabs';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
import useGlobalSrcoll from '../hook/useGlobalScroll';
import { WmDataSentryKey, WmDataSentryOp, errorReportApi, getWmDataSentryKeyPrefix } from '../sentry-utils';
import { useMemoizedFn } from 'ahooks';

const { TabPane } = Tabs;
interface CompanyRelationState {
  companyId: string;
  status: string;
  leadsId: string;
}
export interface GlobalSearchDetailProps {
  id: string;
  scene?: PrevScene; // 来源
  reloadToken?: number;
  outerDetail?: GlobalSearchCompanyDetail;
  recommendShowName?: string;
  showNextDetail?(id: string): void;
  isContomFair?: boolean;
  onToggleSub?(id: string | number, collectId?: string | number): void;
  onToggleMergeCompanySub?(comId: string, cId?: string | number | null): void;
  onChangeListItem?(id: string | number, extraData: any): void;
  // 锚定到海关数据tab
  anchorCustoms?: boolean;
  // 是否显示公司订阅
  showSubscribe?: boolean;
  // 是否隐藏录入客户/线索相关按钮
  hideCustomerButtons?: boolean;
  // 是否隐藏深挖联系人按钮
  hideGrubButton?: boolean;
  queryGoodsShipped?: string;
  queryHsCode?: string;
  isPreciseSearch?: boolean;
  productSubPage?: boolean;
  onIgnoreCompany?(): void;
  // 用于数据反馈上报
  origin?: string;
  country?: string;
  setShowDetailClose?: () => void;
  // 扩展参数
  extraParams?: any;
  hideGlobalButtons?: boolean; // 隐藏全球搜所有操作按钮 除 crm来源按钮
  customButtons?: CustomButtonsType[]; // 自定义按钮
  switchOption?: IsPageSwitchItem; // 详情页翻页参数
}

export const CompanyDetail: React.FC<GlobalSearchDetailProps> = props => {
  const {
    id,
    outerDetail,
    reloadToken,
    showNextDetail,
    onToggleSub,
    onToggleMergeCompanySub,
    onChangeListItem,
    anchorCustoms,
    showSubscribe,
    hideCustomerButtons,
    hideGrubButton,
    queryGoodsShipped,
    isPreciseSearch,
    queryHsCode,
    productSubPage,
    onIgnoreCompany,
    scene = 'globalSearch',
    origin = 'global',
    recommendShowName,
    country: domainCountry,
    setShowDetailClose,
    extraParams,
    hideGlobalButtons,
    customButtons,
    switchOption,
  } = props;
  const [hasImportCount, setHasImportCount] = useState<CompanyExists | null>(null);

  const { fetchData, headerCompanyList, loading, data, originData, setData, similarCompanyData, reqSimilarCompanyData } = useCompanyDetailFetch({
    queryGoodsShipped,
    domainCountry,
    defaultDetail: outerDetail,
  });
  const [baseTab, setBaseTab] = useState<string>('');
  const baseTablist = useMemo(() => {
    const infoList: Array<{
      key: string;
      value: string;
    }> = [];
    if (data?.contactCount && data.contactCount > 0) {
      infoList.push({
        key: 'contact',
        value: '联系人  ' + data.contactCount,
      });
    } else {
      infoList.push({
        key: 'contact',
        value: '联系人 ',
      });
    }
    if (similarCompanyData && similarCompanyData.length > 0) {
      infoList.push({
        key: 'similar',
        value: '相似公司  ' + (similarCompanyData.length > 0 ? similarCompanyData.length : ''),
      });
    }
    if (hasImportCount?.buyer || hasImportCount?.supplier) {
      infoList.push({
        key: 'customs',
        value: '海关数据',
      });
    }
    if (data?.newsList && data?.newsList.length > 0) {
      infoList.push({
        key: 'newsList',
        value: '企业资讯',
      });
    }
    setBaseTab(infoList[0].key);
    return infoList;
  }, [similarCompanyData, data?.contact, hasImportCount]);

  const { customsDataRef } = useStickyTab({
    data,
    similarCompanyData,
    showBuyer: hasImportCount?.buyer,
    showSupplier: hasImportCount?.supplier,
  });

  const { globalStickShow, globalTabShow, selectStickyTab, containerRef, onContentScroll } = useGlobalSrcoll({
    tabList: baseTablist,
    defaultTab: baseTab,
  });

  const [companyRelationState, setCompanyRelationState] = useState<CompanyRelationState>({ companyId: '', status: '', leadsId: '' });
  const [znCompanyList, setZnCompanyList] = useState<ExcavateCompanyItem[]>([]);
  const getCompanyRelationState = useCallback(
    async (syncList?: boolean) => {
      const { name, sourceCountry, id: sourceDataId } = data || {};
      if (!name) return;
      try {
        const res = await edmCustomsApi.getCompanyRelationStatus({ companyName: name, country: sourceCountry || '' });
        if (sourceDataId && syncList) {
          onChangeListItem?.(sourceDataId, getListItemReferByStatus(res));
        }
        setCompanyRelationState(res);
      } catch (e) {
        // do nothing
      }
    },
    [data, onChangeListItem]
  );
  const refreshRelationState = useCallback(() => getCompanyRelationState(true), [getCompanyRelationState]);
  useEffect(() => {
    refreshRelationState();
  }, [data?.name, data?.sourceCountry]);
  useEffect(() => {
    if (id) {
      const sentryId = errorReportApi.startTransaction({
        name: `${getWmDataSentryKeyPrefix(scene)}${WmDataSentryKey.Detail}`,
        op: WmDataSentryOp.Loaded,
      });
      fetchData(id, sentryId);
      reqSimilarCompanyData(id);
    }
  }, [id, reloadToken, scene]);

  const onToggleHideCommon = useCallback((hide: boolean) => {
    if (originData.current) {
      setData({
        ...originData.current,
        contactList: originData.current.contactList.filter(contact => !(hide && contact.isHidden)),
      });
    }
  }, []);
  const onLeadsFetch = useMemoizedFn(async (extraFetchParams?: any) => {
    if (!data) return;
    await globalSearchApi.globalSingleAddLeads({
      id: data.id,
      sourceType: getTSourceByScene(scene),
      ...extraFetchParams,
    });
  });

  const afterCompanyExistsFetch = useCallback((res: CompanyExists) => {
    setHasImportCount(res);
  }, []);

  useEffect(() => {
    if (data) {
      globalSearchDataTracker.trackSearchDetail({
        companyId: data.companyId as any,
        id: data.id,
        name: data.name,
        from: scene,
      });
    }
  }, [scene]);

  useEffect(() => {
    const dataId = data?.id;
    const eventID = eventApi.registerSysEventObserver('globalSearchGrubTaskFinish', {
      func: event => {
        if (dataId && (event?.eventData?.type === 'contact' || event?.eventData?.type === 'refresh') && event.eventData.data?.id === dataId) {
          fetchData(dataId);
        }
      },
    });

    return () => {
      eventApi.unregisterSysEventObserver('globalSearchGrubTaskFinish', eventID);
    };
  }, [data?.id]);

  useEffect(() => {
    if (anchorCustoms && (hasImportCount?.buyer || hasImportCount?.supplier)) {
      customsDataRef.current?.scrollIntoView(true);
    }
  }, [anchorCustoms, hasImportCount]);

  const refresh = useCallback(() => {
    if (!id) return;
    fetchData(id);
  }, [fetchData, id]);
  const isForwarder = useIsForwarder();
  const ExtraInfoComp = useMemo(
    () =>
      isForwarder ? (
        <ZnCompanyList
          className={style.znCompanyListBox}
          companyName={data?.name ?? ''}
          originCompanyName={data?.name ?? ''}
          country={data?.country ?? ''}
          onZnCompanyListChange={setZnCompanyList}
        />
      ) : null,
    [isForwarder, data]
  );
  return (
    <OverlayScrollbarsComponent
      className={style.detailPage}
      style={{
        padding: `${!data || loading ? '20px' : 0}`,
      }}
      options={{
        callbacks: {
          onScroll: onContentScroll,
        },
      }}
    >
      <Skeleton active loading={!data || loading} paragraph={{ rows: 4 }}>
        <div>
          <CompanyDetailHeader
            recommendShowName={recommendShowName}
            data={data}
            scene={scene}
            extraParams={extraParams}
            origin={origin}
            headerCompanyList={headerCompanyList}
            isSticky={globalStickShow}
            onStickyTabChange={value => {
              setBaseTab(value);
            }}
            selectStickyTab={selectStickyTab}
            stickyTab={baseTablist}
            companyRelationState={companyRelationState}
            refreshRelationState={refreshRelationState}
            relationProduct={data?.productList}
            globalTabShow={globalTabShow}
            stickTab={'global'}
            hideGlobalButtons={hideGlobalButtons}
            ButtonGroup={
              <HeaderButtons
                showSubscribe={showSubscribe}
                productSubPage={productSubPage}
                hideCustomerButtons={hideCustomerButtons}
                onIgnoreCompany={onIgnoreCompany}
                data={data}
                scene={scene}
                extraParams={extraParams}
                headerCompanyList={headerCompanyList}
                onToggleSub={onToggleSub}
                onToggleMergeCompanySub={onToggleMergeCompanySub}
                refresh={refresh}
                companyRelationState={companyRelationState}
                refreshRelationState={refreshRelationState}
                znCompanyList={znCompanyList}
                recommendShowName={recommendShowName}
                hasImportCount={hasImportCount}
                setShowDetailClose={setShowDetailClose}
                hideGlobalButtons={hideGlobalButtons}
                customButtons={customButtons}
                switchOption={switchOption}
              />
            }
          />
        </div>
        <div style={{ padding: '12px 20px 12px' }}>
          <div className={style.infoBase} ref={containerRef} style={{ background: '#fff', borderRadius: '4px', border: '1px solid #F0F1F5' }}>
            <div className={style.tabContent}>
              <Tabs
                activeKey={baseTab}
                onChange={value => {
                  setBaseTab(value);
                }}
              >
                {baseTablist.map(item => (
                  <TabPane tab={item.value} key={item.key} />
                ))}
              </Tabs>
            </div>
            <div ref={customsDataRef} key={id} hidden={baseTab !== 'customs'}>
              <CustomsTabs
                data={data}
                showNextDetail={showNextDetail}
                queryGoodsShipped={queryGoodsShipped}
                queryHsCode={queryHsCode}
                isPreciseSearch={isPreciseSearch}
                headerCompanyList={headerCompanyList}
                showBuyer={hasImportCount?.buyer}
                showSupplier={hasImportCount?.supplier}
                afterCompanyExistsFetch={afterCompanyExistsFetch}
                style={{ border: 'none' }}
              />
              {ExtraInfoComp}
            </div>
            {baseTab === 'contact' && (
              <div key={id}>
                <DetailContactTable
                  style={{ border: 'none' }}
                  onLeadsFetch={onLeadsFetch}
                  hideGrubButton={hideGrubButton}
                  companyRelationState={companyRelationState}
                  refreshRelationState={refreshRelationState}
                  refreshData={refresh}
                  data={data}
                  productSubPage={productSubPage}
                  scene={scene}
                  extraParams={extraParams}
                  onToggleHideCommon={onToggleHideCommon}
                  setShowDetailClose={setShowDetailClose}
                  hideGlobalButtons={hideGlobalButtons}
                />
              </div>
            )}
            {baseTab === 'similar' && similarCompanyData.length > 0 && (
              <div>
                <SimilarCompany tableData={similarCompanyData} showNextDetail={showNextDetail} id={id} source={origin} />
              </div>
            )}
            {baseTab === 'newsList' && data?.newsList && data.newsList.length > 0 && (
              <div>
                <CorporateInformation newsList={data?.newsList || []} />
              </div>
            )}
          </div>
        </div>
      </Skeleton>
    </OverlayScrollbarsComponent>
  );
};
