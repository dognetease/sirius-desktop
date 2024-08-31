import React from 'react';
import style from './product.module.scss';
import { ReactComponent as Icon1 } from '../../../../../images/icons/customs/icon1.svg';
import { ReactComponent as Icon2 } from '../../../../../images/icons/customs/icon2.svg';
import { ReactComponent as Icon3 } from '../../../../../images/icons/customs/icon3.svg';
import { ReactComponent as Icon4 } from '../../../../../images/icons/customs/icon4.svg';

const Product = () => (
  <div className={style.product}>
    <div className={style.title}>产品特点：</div>
    <div className={style.listWrap}>
      <div className={style.listItem}>
        <Icon1 />
        覆盖全球200多国、10亿的海关数据、航运数据和过境数据
      </div>
      <div className={style.listItem}>
        <Icon2 />
        实时更新，主要覆盖北美、南美、亚洲、印巴等区域
      </div>
      <div className={style.listItem}>
        <Icon3 />
        涵盖1000万国际采购商、800万全球供应商
      </div>
      <div className={style.listItem}>
        <Icon4 />
        准确性：权威的海关和商业信息数据库提供信息
      </div>
    </div>
  </div>
);

export default Product;
