import { useEffect, useRef, useState } from 'react';
import { navigate } from 'gatsby';
import { edmCustomsApi } from '../constants';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { SearchJudgeResult, PrevScene } from 'api';
import qs from 'querystring';
interface Prop {
  country?: string;
  name: string;
  closeDraw?: () => void;
  showBtn: boolean;
  isPeers?: boolean;
}
const useTradeQuery = ({ country, name, closeDraw, showBtn, isPeers }: Prop) => {
  const [info, setInfo] = useState<SearchJudgeResult>({
    recordType: '',
    searchFlag: false,
  });
  const locationHash = location.hash;
  useEffect(() => {
    if (showBtn && name) {
      edmCustomsApi
        .getSearchJudge({
          companyName: name,
          searchValue: name,
          type: isPeers ? '4' : '3',
          country,
        })
        .then(res => {
          setInfo(res);
        });
    }
  }, [showBtn, name]);
  const makeTradeReport = () => {
    const params = qs.parse(locationHash.split('?')[1]);
    edmCustomsApi.getQuotaQuery().then(res => {
      if (res.dayResidualQuota > 0) {
        closeDraw && closeDraw();
        navigate(
          `#wmData?page=tradeAnalysis&country=${encodeURIComponent(country ?? '未公开')}&name=${encodeURIComponent(name)}&type=${encodeURIComponent(
            isPeers ? 'peers' : info.recordType === 'import' ? 'buysers' : 'supplier'
          )}&pageSource=${encodeURIComponent(params.page as PrevScene)}`
        );
      } else {
        SiriusMessage.warning({
          content: '今日已到查询限额，请明日再试',
        });
      }
    });
  };
  return {
    makeTradeReport,
    info,
  };
};

export default useTradeQuery;
