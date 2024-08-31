import React, { useState, useMemo } from 'react';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import Erweima from '../../../images/erweima.png';
import AgentServiceHDB from '../../../images/sku-intro/agent-service-hdb.png';
import AgentService from '../../../images/sku-intro/agent-service.png';
import BrandBuildingIntroduction from '../../../images/sku-intro/brand-building-introduction.png';
import ConsignmentList from '../../../images/sku-intro/consignment-list.png';
import LinkedIN from '../../../images/sku-intro/linked-in.png';
import SiteFuntionList from '../../../images/sku-intro/site-function-list.png';
import SiteProductQuotation from '../../../images/sku-intro/site-product-quotation.png';
import SocialMediaList from '../../../images/sku-intro/social-media-list.png';

import styles from './index.module.scss';

export interface SkuIntroducePanelProps {}

const SkuIntroList: { value: string; label: string }[] = [
  {
    value: '1',
    label: '建站功能清单',
  },
  {
    value: '2',
    label: '品牌建设整体介绍',
  },
  {
    value: '3',
    label: '社媒运营清单',
  },
  {
    value: '4',
    label: 'LinkedIn矩阵清单图',
  },
  {
    value: '5',
    label: '代投放清单',
  },
  {
    value: '6',
    label: '建站产品报价',
  },
  {
    value: '7',
    label: '外贸通代运营服务',
  },
  {
    value: '8',
    label: '外贸通货代版代运营服务',
  },
];

const SkuIntroducePanel: React.FC<SkuIntroducePanelProps> = props => {
  const [selectVal, setSelectVal] = useState('1');
  const imageUrl = useMemo(() => {
    if (selectVal === '1') {
      return SiteFuntionList;
    }
    if (selectVal === '2') {
      return BrandBuildingIntroduction;
    }
    if (selectVal === '3') {
      return SocialMediaList;
    }
    if (selectVal === '4') {
      return LinkedIN;
    }
    if (selectVal === '5') {
      return ConsignmentList;
    }
    if (selectVal === '6') {
      return SiteProductQuotation;
    }
    if (selectVal === '7') {
      return AgentService;
    }
    if (selectVal === '8') {
      return AgentServiceHDB;
    }
    return '';
  }, [selectVal]);

  return (
    <div className={styles.skuIntroducePanel}>
      <div className={styles.header}>
        <div className={styles.left}>
          <span className={styles.title}>品牌建设功能介绍</span>
          <EnhanceSelect value={selectVal} onSelect={(value: string) => setSelectVal(value)} placeholder="请选择" style={{ width: 182 }}>
            {SkuIntroList.map(item => (
              <InSingleOption value={item.value}>{item.label}</InSingleOption>
            ))}
          </EnhanceSelect>
        </div>
        <div className={styles.right}>
          <div className={styles.contactImgWrapper}>
            <img className={styles.contactImg} src={Erweima} />
          </div>
          <div className={styles.info}>
            <div className={styles.mainTitle}>扫码添加企业微信</div>
            <div className={styles.subTitle}>品牌建设顾问为您1v1提供咨询服务</div>
          </div>
        </div>
      </div>
      <div className={styles.contentBorderContainer}>
        <div className={styles.content}>
          <img className={styles.image} src={imageUrl} />
        </div>
      </div>
    </div>
  );
};

export default SkuIntroducePanel;
