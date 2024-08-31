import React from 'react';
import { useWaContextV2 } from '../WhatsAppV2/context/WaContextV2';
import WhatsAppAd, { renderMap as WhastAppAdRenderMap, Keys as WhatsAppAdKeys } from '@/components/Layout/SNS/WhatsApp/components/ad';

interface WaAdContainerV2Props {
  type: WhatsAppAdKeys;
  children: React.ReactElement;
}

export const WaAdContainerV2: React.FC<WaAdContainerV2Props> = props => {
  const { type, children } = props;
  const { orgStatus } = useWaContextV2();
  const visible = orgStatus === 'UNPURCHASED'; // 广告展示

  if (visible) {
    return <WhatsAppAd comp={WhastAppAdRenderMap[type]} setChecked={() => {}} />;
  }

  return children;
};

export default WaAdContainerV2;
