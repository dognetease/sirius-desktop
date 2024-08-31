import React from 'react';
import CustomerWrap from '../components/customerWrap/customerWrap';
import HeaderLayout from '../components/headerLayout/headerLayout';
import style from './openSea.module.scss';
import SeaClue from './components/SeaClue/seaClue';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { getIn18Text } from 'api';
const RESOURCE_LABEL = 'CHANNEL_OPEN_SEA';
const OpenSea: React.FC<any> = () => {
  return (
    <PermissionCheckPage resourceLabel={RESOURCE_LABEL} accessLabel="VIEW" menu="CHANNEL_OPEN_SEA">
      <CustomerWrap>
        <div className={style.customerLeadWrap}>
          <HeaderLayout title={getIn18Text('XIANSUOGONGHAI')}></HeaderLayout>
          <SeaClue />
        </div>
      </CustomerWrap>
    </PermissionCheckPage>
  );
};
export default OpenSea;
