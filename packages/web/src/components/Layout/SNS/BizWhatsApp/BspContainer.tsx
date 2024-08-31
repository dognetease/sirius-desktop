import React, { useState, useEffect } from 'react';
import { apiHolder, apis, WhatsAppApi, WhatsAppBSP } from 'api';

type BspContainerProps = Record<WhatsAppBSP, React.ReactElement>;

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

let getBspPromise: null | Promise<WhatsAppBSP> = null;

export const BspContainer: React.FC<BspContainerProps> = props => {
  const [bsp, setBsp] = useState<WhatsAppBSP | null>(null);

  useEffect(() => {
    if (!getBspPromise) {
      getBspPromise = whatsAppApi.getBsp();
    }
    getBspPromise.then(nextBsp => {
      setBsp(nextBsp);
    });
  }, []);

  if (!bsp) return null;

  return props[bsp] || null;
};

export default BspContainer;
