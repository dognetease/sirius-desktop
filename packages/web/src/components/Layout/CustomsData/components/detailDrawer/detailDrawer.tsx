/* eslint-disable camelcase */
import React from 'react';
import { apis, apiHolder, EdmCustomsApi } from 'api';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import style from './detailDrawer.module.scss';
import { CompanyDetail } from '@/components/Layout/globalSearch/detail/CompanyDetail';

interface Props {
  visible: boolean;
  onClose: () => void;
  companyId?: string;
  goodsShipped?: string;
}

const DetailDrawer: React.FC<Props> = ({ visible, onClose, companyId, goodsShipped }) => {
  return (
    <Drawer visible={visible} onClose={onClose}>
      <div className={style.customsDataDetail}>
        {companyId && visible && (
          <CompanyDetail
            scene="customs"
            origin={'custom'}
            queryGoodsShipped={goodsShipped}
            showSubscribe
            id={companyId}
            reloadToken={0}
            extraParams={{ keyword: goodsShipped }}
          />
        )}
      </div>
    </Drawer>
  );
};

export default DetailDrawer;
