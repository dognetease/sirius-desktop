import { useMemo, useEffect } from 'react';
import { useAppSelector } from '@web-common/state/createStore';

const ProductVersion = {
  FREE: 'FREE', // 体验版
  FASTMAIL: 'FASTMAIL', // 外贸版
  WEBSITE: 'WEBSITE', // 建站版
  FASTMAIL_AND_WEBSITE: 'FASTMAIL_AND_WEBSITE', // 外贸和建站版
  FASTMAIL_EXPIRED: 'FASTMAIL_EXPIRED', // 外贸过期版
};

const useSitePermissions = () => {
  const productCode = useAppSelector(state => state.privilegeReducer.version);
  const accessModules = useAppSelector(state => state.privilegeReducer.modules);

  // 是否购买了邮件营销
  const isBuyEdm = useMemo(() => {
    return Reflect.has(accessModules, 'EDM');
  }, [accessModules]);

  // 是否购买了建站
  const isBuySiteBuilder = useMemo(() => {
    if (productCode === ProductVersion.WEBSITE || productCode === ProductVersion.FASTMAIL_AND_WEBSITE) {
      return true;
    }
    return false;
  }, [productCode]);

  // 只买了建站，没买外贸
  const isOnlyBuySite = useMemo(() => {
    if (productCode === ProductVersion.WEBSITE) {
      return true;
    }
    return false;
  }, [productCode]);

  return {
    productCode,
    isBuySiteBuilder,
    isOnlyBuySite,
    isBuyEdm,
  };
};

export default useSitePermissions;
