import { Tooltip } from 'antd';
import { GloablSearchProductIntro, getIn18Text, GlobalSearchCompanyDetail, PrevScene } from 'api';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import React from 'react';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import styles from './productlistintro.module.scss';
import { globalSearchDataTracker, GlobalSearchDetailEvent } from '../tracker';
interface ProductListIntroProps {
  list?: GloablSearchProductIntro[];
  isContomFair?: boolean;
  poisition?: boolean;
  scene: PrevScene;
  data?: GlobalSearchCompanyDetail & { sourceCountry?: string };
  extraParams?: any;
}
const ProductListIntro: React.FC<ProductListIntroProps> = ({ list, isContomFair, poisition, scene, data, extraParams }) => {
  if (!list || list.length === 0) {
    return null;
  }
  return (
    <>
      <h2 hidden={poisition} className={styles.title}>
        {getIn18Text('XIANGGUANCHANPIN')}
      </h2>
      <OverlayScrollbarsComponent
        options={{
          overflowBehavior: {
            x: 'scroll',
          },
        }}
      >
        <div className={styles.list}>
          {list.map((prd, index) => (
            <div className={styles.item} key={index} style={{ width: poisition ? '160px' : '180px' }}>
              <div className={styles.imgWrapper} style={{ height: poisition ? '160px' : '180px' }}>
                <div
                  className={styles.img}
                  onClick={() => {
                    if (prd.imgUrl) {
                      ImgPreview.preview({
                        data: list.map(e => ({
                          previewUrl: e.imgUrl,
                          downloadUrl: e.imgUrl,
                          OriginUrl: e.imgUrl,
                          name: e.name,
                        })),
                        startIndex: index,
                      });
                      globalSearchDataTracker.trackDetailClick(GlobalSearchDetailEvent.ProductImgDetail, scene, data?.companyId, data?.id, extraParams);
                      if (isContomFair) {
                        globalSearchDataTracker.trackContomFairDetailClick('productImg');
                      }
                    }
                  }}
                  style={{
                    backgroundImage: `url(${prd.imgUrl})`,
                  }}
                />
              </div>
              <Tooltip title={prd.name}>
                <p className={styles.name}>{prd.name}</p>
              </Tooltip>
              <Tooltip title={prd.price}>
                <p className={styles.price}>{prd.price}</p>
              </Tooltip>
            </div>
          ))}
        </div>
      </OverlayScrollbarsComponent>
    </>
  );
};
export default ProductListIntro;
