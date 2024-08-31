import React, { useState, useEffect } from 'react';
import { getIn18Text } from 'api';
import { navigate } from '@reach/router';
import { useWaContextV2 } from '../WhatsAppV2/context/WaContextV2';
import { NoPermissionPage } from '@/components/UI/PrivilegeEnhance';
import { WaRegisterModal } from './WaRegisterModal';

interface WaAllotContainerV2Props {
  key: string;
  children: React.ReactElement;
}

export const WaAllotContainerV2: React.FC<WaAllotContainerV2Props> = props => {
  const { children } = props;
  const { allotPhones, registrable, refreshAllotPhones } = useWaContextV2();
  const [visible, setVisible] = useState(true);

  if (allotPhones.length) return children;

  if (registrable) {
    return (
      <>
        {children}
        <WaRegisterModal
          visible={visible}
          onCancel={() => setVisible(false)}
          onFinish={() => {
            setVisible(false);
            refreshAllotPhones();
          }}
        />
      </>
    );
  }

  return (
    <div style={{ height: '100%' }}>
      <NoPermissionPage title={getIn18Text('ZANWUSHANGYEHAOQUANXIAN')} />
    </div>
  );
};

export default WaAllotContainerV2;
