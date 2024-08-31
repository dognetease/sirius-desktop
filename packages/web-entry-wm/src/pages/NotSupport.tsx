import React from 'react';
import { getTransText } from '@/components/util/translate';
import MobileTipIcon from '@/images/icons/mobileTip.png';

const NotSupport: React.FC = () => {
  return (
    <div style={{ display: 'flex', padding: 30, height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <img style={{ width: 250 }} src={MobileTipIcon} alt="" />
        <div style={{ fontSize: 18, paddingTop: 30 }}>{getTransText('MobilePltTip')}</div>
      </div>
    </div>
  );
};

export default NotSupport;
