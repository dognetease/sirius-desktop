import React, { FC, useMemo, ReactNode } from 'react';
import { GlobalSearchCompanyDetail, MergeCompany, PrevScene, GloablSearchProductIntro } from 'api';
import classnames from 'classnames';
import { Tabs } from 'antd';
import DefaultLogo from '@/images/icons/edm/global_search_default_logo.png';
import { DataTagItem, renderDataTagList } from '@/components/Layout/utils';
import style from './companyDetail.module.scss';
import { getCustomerAndLeadsTagInDetail, getUniSourceTypeFromScene } from '../utils';
import CustomerTag from '../component/CustomerTag';
import { InfoList } from './InfoList';
import { Feedback } from './Feedback';
import { isWindows } from '../constants';
import ProductListIntro from './ProductListIntro';

interface CompanyRelationState {
  companyId: string;
  status: string;
  leadsId: string;
}

interface CompanyDetailHeaderProps {
  recommendShowName?: string;
  ButtonGroup: ReactNode;
  data?: GlobalSearchCompanyDetail & { sourceCountry?: string };
  scene: PrevScene;
  origin: string;
  headerCompanyList: Array<MergeCompany>;
  isSticky: boolean;
  onStickyTabChange: (key: string) => void;
  selectStickyTab: string;
  stickyTab: Array<{
    key: string;
    value: string;
  }>;
  companyRelationState: CompanyRelationState;
  refreshRelationState?: () => Promise<void>;
  extraTags?: DataTagItem[];
  hideMerge?: boolean;
  relationProduct?: GloablSearchProductIntro[];
  globalTabShow?: boolean;
  // 全球搜详情页顶部
  stickTab?: string;
  extraParams?: any;
  hideGlobalButtons?: boolean;
}
export const CompanyDetailHeader: FC<CompanyDetailHeaderProps> = ({
  recommendShowName,
  ButtonGroup,
  data,
  scene,
  origin,
  headerCompanyList,
  isSticky,
  refreshRelationState,
  onStickyTabChange,
  selectStickyTab,
  stickyTab,
  companyRelationState,
  extraTags,
  hideMerge,
  relationProduct,
  globalTabShow,
  stickTab,
  extraParams,
  hideGlobalButtons,
}) => {
  const customerTagContent = useMemo(() => getCustomerAndLeadsTagInDetail(companyRelationState), [companyRelationState]);
  const DataTagListComp = useMemo(
    () =>
      renderDataTagList([
        {
          content: customerTagContent ? (
            <CustomerTag
              tagProps={customerTagContent}
              companyName={data?.name}
              country={data?.country}
              refresh={refreshRelationState}
              source={getUniSourceTypeFromScene(scene)}
              hideTooltip={hideGlobalButtons}
            />
          ) : null,
          priority: true,
          style: 'green',
        },
        {
          content: data?.contactStatus ?? '',
          style: 'blue',
        },
        ...(extraTags ?? []),
      ]),
    [data, customerTagContent, extraTags]
  );
  const handleHeaderName = useMemo(() => {
    let strName = recommendShowName || data?.name || '';
    if (strName.length > 100) {
      return strName.slice(0, 100) + '...';
    } else {
      return strName;
    }
  }, [recommendShowName, data]);
  return (
    <div className={style.detailHeader}>
      <div className={style.header} style={isWindows ? { paddingTop: '30px' } : {}}>
        <div className={style.logo}>
          <img
            src={data?.logo || DefaultLogo}
            alt={data?.name}
            width="72"
            height="72"
            className={style.logo}
            onError={e => {
              (e.target as HTMLImageElement).src = DefaultLogo;
            }}
          />
        </div>
        <div className={style.headerRight}>
          <h2>
            <div className={style.headerTitle}>
              <div className={style.headerName} style={{ lineHeight: '32px' }}>
                <span style={{ maxWidth: `27vw` }} className={style.name}>
                  {handleHeaderName} {!hideMerge && data?.mergeCompanys && data?.mergeCompanys.length > 1 ? ` 等${data?.mergeCompanys.length}家相关公司` : ''}
                </span>
              </div>
            </div>
            <div className={style.headerButtons}>{ButtonGroup}</div>
          </h2>
          <div>{DataTagListComp}</div>
          {data?.overviewDescription ? <div className={style.shortDesc}>{data.overviewDescription}</div> : null}
        </div>
      </div>
      <InfoList scene={scene} extraParams={extraParams} headerCompanyList={headerCompanyList} data={data} />
      <Feedback origin={origin} data={data} poisition={relationProduct && relationProduct.length > 0} />
      {relationProduct && relationProduct.length > 0 && (
        <div style={{ paddingLeft: '92px' }}>
          <p style={{ marginBottom: 0, color: '#7a8599', fontSize: '12px', lineHeight: '28px' }}>网站相关图片：</p>
          <ProductListIntro scene={scene} extraParams={extraParams} list={relationProduct} poisition={true} data={data} />
        </div>
      )}
      <div
        className={classnames(style.stickyHeader, {
          [style.stickyTop]: isSticky,
          [style.stickyTab]: !globalTabShow && stickTab === 'global',
        })}
        hidden={!isSticky}
      >
        <div className={style.stickyTitle} style={isWindows ? { paddingTop: '60px' } : {}}>
          <div style={{ marginLeft: '8px', display: 'flex', alignItems: 'center' }}>
            <span className={style.stickyCompany}>
              {recommendShowName || data?.name}
              {!hideMerge && data?.mergeCompanys && data?.mergeCompanys.length > 1 ? `等${data?.mergeCompanys.length}家相关公司` : ''}
            </span>
            <div style={{ marginLeft: '4px', flexShrink: 0 }}>{DataTagListComp}</div>
          </div>
          <div className={style.headerButtons}>{ButtonGroup}</div>
        </div>
        <Tabs hidden={!globalTabShow && stickTab === 'global'} activeKey={selectStickyTab} tabBarGutter={0} onChange={onStickyTabChange}>
          {stickyTab.map(item => (
            <Tabs.TabPane key={item.key} className={style.tab} tab={<span>{item.value}</span>} />
          ))}
        </Tabs>
      </div>
    </div>
  );
};
