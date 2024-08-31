import React, { useState, useEffect } from 'react';
import { api, apis, InsertWhatsAppApi, SenderStatus } from 'api';
import WhatsAppAd, { renderMap as WhastAppAdRenderMap, Keys as WhatsAppAdKeys } from '@/components/Layout/SNS/WhatsApp/components/ad';

const insertWhatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

interface WaAdContainerV1Props {
  type: WhatsAppAdKeys;
  children: React.ReactElement;
}

let getOrgStatusPromise: null | Promise<SenderStatus> = null;

export const WaAdContainerV1: React.FC<WaAdContainerV1Props> = props => {
  const { type, children } = props;
  const [visible, setVisible] = useState(false); // 广告展示

  useEffect(() => {
    if (!getOrgStatusPromise) {
      getOrgStatusPromise = insertWhatsAppApi.queryBindStatus();
    }
    getOrgStatusPromise.then(data => {
      if (['TRY', 'UNREGISTERED', 'PURCHASED', 'REGISTERED', 'VERIFIED'].includes(data.orgStatus)) {
        setVisible(false);
      } else {
        setVisible(true);
      }
    });
  }, []);

  if (visible) {
    return <WhatsAppAd comp={WhastAppAdRenderMap[type]} setChecked={() => {}} />;
  }

  return children;
};

export default WaAdContainerV1;
