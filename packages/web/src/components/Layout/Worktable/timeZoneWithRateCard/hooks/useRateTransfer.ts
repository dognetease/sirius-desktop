import { WorkbenchCurrencyListItem, WorktableApi, api } from 'api';
import { useState } from 'react';
const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;
const WORKTABLE_RATE_DEFAULT_VALUE_CURRENCY_CODE = 'WORKTABLE_RATE_DEFAULT_VALUE_CURRENCY_CODE';

export function useRateTransfer() {
  const [currencyList, setCurrencyList] = useState<WorkbenchCurrencyListItem[]>([]);
  const [currencyValue, setCurrencyValue] = useState<WorkbenchCurrencyListItem>({ currencyCnName: '', currencyCode: '' });
  const [rateVal, setRateVal] = useState('');
  const [rateTime, setRateTime] = useState('');

  const fetchCurrencyList = async () => {
    const { currencyList } = await worktableApi.getWorkBenchCurrencyList();
    if (currencyList.length > 0) {
      setCurrencyList([...currencyList]);

      const defaultCurrencyCode = localStorage.getItem(WORKTABLE_RATE_DEFAULT_VALUE_CURRENCY_CODE);
      const defaultCurrencyValue = currencyList.find(item => item.currencyCode === defaultCurrencyCode) || currencyList[0];
      setCurrencyValue({
        currencyCnName: `${defaultCurrencyValue.currencyCnName}（${defaultCurrencyValue.currencyCode}）`,
        currencyCode: defaultCurrencyValue.currencyCode,
      });
    }
  };

  const fetchRateValByCode = async () => {
    const { rate, updateAt } = await worktableApi.getWorkBenchExchangeRate({ currencyCode: currencyValue.currencyCode });
    setRateVal(rate);
    setRateTime(updateAt);
  };

  const handleCurrencyChange = (currencyName: string, currencyCode: string) => {
    if (currencyCode === currencyValue.currencyCode) return;
    setCurrencyValue({
      currencyCnName: currencyName,
      currencyCode,
    });
    localStorage.setItem(WORKTABLE_RATE_DEFAULT_VALUE_CURRENCY_CODE, currencyCode);
  };

  return {
    currencyList,
    rateVal,
    rateTime,
    currencyValue,
    fetchCurrencyList,
    fetchRateValByCode,
    handleCurrencyChange,
  };
}
