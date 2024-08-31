import { useState } from 'react';
import { RequestBusinessaAddCompany as customerType } from 'api';

export function useUniDrawerData() {
  const [uniVisible, setUniVisible] = useState(false);
  const [customerData, setCustomerData] = useState<Partial<customerType>>({} as Partial<customerType>);

  return {
    uniVisible,
    customerData,
    setUniVisible,
    setCustomerData,
  };
}
