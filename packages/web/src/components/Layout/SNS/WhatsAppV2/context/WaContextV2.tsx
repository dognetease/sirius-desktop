import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiHolder, apis, WhatsAppApi, WhatsAppOrgStatusV2, WhatsAppPhoneV2 } from 'api';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

interface WaContextV2Types {
  orgStatus: WhatsAppOrgStatusV2;
  allotPhones: WhatsAppPhoneV2[];
  allotable: boolean;
  registrable: boolean;
  refreshOrgStatus: () => Promise<WhatsAppOrgStatusV2>;
  refreshAllotPhones: () => Promise<WhatsAppPhoneV2[]>;
}

const WaContextV2 = createContext<WaContextV2Types>({
  orgStatus: 'UNPURCHASED',
  allotPhones: [],
  allotable: false,
  registrable: false,
  refreshOrgStatus: () => Promise.resolve('UNPURCHASED'),
  refreshAllotPhones: () => Promise.resolve([]),
});

let getOrgStatusPromise: null | Promise<WhatsAppOrgStatusV2> = null;
let getAllotPhonesPromise: null | Promise<WhatsAppPhoneV2[]> = null;

export const WaProviderV2: React.FC = ({ children }) => {
  const [orgStatus, setOrgStatus] = useState<WhatsAppOrgStatusV2>('UNPURCHASED');
  const [allotPhones, setAllotPhones] = useState<WhatsAppPhoneV2[]>([]);

  const allotable = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'WHATSAPP_BUSINESS_ACCOUNT', 'ALLOT'));
  const registrable = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'WHATSAPP_BUSINESS_ACCOUNT', 'REGISTER'));

  const refreshOrgStatus = () =>
    whatsAppApi.getOrgStatusV2().then(nextOrgStatus => {
      setOrgStatus(nextOrgStatus);

      return nextOrgStatus;
    });

  const refreshAllotPhones = () =>
    whatsAppApi.getAllotPhones().then(nextPhones => {
      setAllotPhones(nextPhones || []);

      return nextPhones;
    });

  useEffect(() => {
    if (!getOrgStatusPromise) {
      getOrgStatusPromise = whatsAppApi.getOrgStatusV2();
    }
    if (!getAllotPhonesPromise) {
      getAllotPhonesPromise = whatsAppApi.getAllotPhones();
    }
    getOrgStatusPromise.then(nextOrgStatus => {
      setOrgStatus(nextOrgStatus);
    });
    getAllotPhonesPromise.then(nextPhones => {
      setAllotPhones(nextPhones || []);
    });
  }, []);

  return (
    <WaContextV2.Provider
      value={{
        orgStatus,
        allotPhones,
        allotable,
        registrable,
        refreshOrgStatus,
        refreshAllotPhones,
      }}
    >
      {children}
    </WaContextV2.Provider>
  );
};

export const useWaContextV2 = () => useContext(WaContextV2);

export default WaProviderV2;
