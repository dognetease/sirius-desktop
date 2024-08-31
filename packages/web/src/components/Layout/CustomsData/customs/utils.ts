import { UserQuotaItem } from 'api';

export const isReachTheLimit = (accountData: UserQuotaItem) => {
  const accountTotal = accountData.dayAccountDetailQuotaTotal || 0;
  const accountUsed = accountData.dayAccountDetailQuotaUsed || 0;
  const orgTotal = accountData.dayOrgDetailQuotaTotal || 0;
  const orgUsed = accountData.dayOrgDetailQuotaUsed || 0;
  if (orgTotal === -1) {
    if (accountTotal === -1) return false;
    return accountUsed >= accountTotal;
  }
  if (orgUsed >= orgTotal) return true;
  if (accountTotal === -1) return false;
  return accountUsed >= accountTotal;
};

export const getLimitNumRemain = (accountData: UserQuotaItem) => {
  const accountTotal = accountData.dayAccountDetailQuotaTotal || 0;
  const accountUsed = accountData.dayAccountDetailQuotaUsed || 0;
  const orgTotal = accountData.dayOrgDetailQuotaTotal || 0;
  const orgUsed = accountData.dayOrgDetailQuotaUsed || 0;
  if (orgTotal === -1) {
    if (accountTotal === -1) return Infinity;
    return accountTotal - accountUsed;
  }
  if (accountTotal === -1) return orgTotal - orgUsed;
  return accountTotal - accountUsed;
};
