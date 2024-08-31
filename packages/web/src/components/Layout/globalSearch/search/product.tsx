import React from 'react';
import style from '../../CustomsData/customs/product/product.module.scss';
import { ReactComponent as Icon1 } from '@/images/icons/edm/global-search-p1.svg';
import { ReactComponent as Icon2 } from '@/images/icons/edm/global-search-p2.svg';
import { getIn18Text } from 'api';
export const GlobalSearchDesction = () => (
  <div className={style.product} style={{ width: 'auto' }}>
    <div className={style.title}>{getIn18Text('CHANPINTEDIAN')}</div>
    <div
      className={style.listWrap}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <div className={style.listItem} style={{ color: '#4E5A70', width: 'auto', marginRight: 0 }}>
        <Icon1 />
        {getIn18Text('HUIJUQUANQIU200DUOGUOJIAYOUXIAOQIYESHUJU\uFF0CHUOKEGENGKUAIJIE')}
      </div>
      <div className={style.listItem} style={{ color: '#4E5A70', width: 'auto', marginRight: 0 }}>
        <Icon2 />
        {getIn18Text('FUGAIQUANQIUZHULIUSOUSUOYINQINGHESHEJIAOMEITI\uFF0CSHUJUGENGQUANMIAN')}
      </div>
    </div>
  </div>
);
export default GlobalSearchDesction;
