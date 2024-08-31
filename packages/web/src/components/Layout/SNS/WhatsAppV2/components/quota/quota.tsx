import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import classnames from 'classnames';
import { apis, apiHolder, WhatsAppApi, WhatsAppQuotaV2 } from 'api';
import { getTransText } from '@/components/util/translate';
import style from './quota.module.scss';
import { getIn18Text } from 'api';
interface QuotaProps {
  className?: string;
  style?: React.CSSProperties;
}

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

const Quota = forwardRef((props: QuotaProps, ref) => {
  const { className, style: styleFromProps } = props;
  const [quota, setQuota] = useState<WhatsAppQuotaV2 | null>(null);

  const handleQuotaFetch = () => {
    whatsAppApi.getQuotaV2().then(data => {
      setQuota(data);
    });
  };

  useEffect(() => {
    handleQuotaFetch();
  }, []);

  useImperativeHandle(ref, () => ({
    refresh: handleQuotaFetch,
    getQuota: () => quota,
  }));

  return (
    <div className={classnames(style.quota, className)} style={styleFromProps}>
      <div className={classnames(style.topbarContainer)}>
        <span className={style.quotaTip}>
          {getTransText('LIULIANGBAOYISHIYONG')}
          <span className={style.num}>{` ${quota ? quota.usedCount : '-'} `}</span>
          {getIn18Text('CI')}，{getIn18Text('SHENGYULIULIANGBAOZONGLIANG')}
          <span className={style.num}>{` ${quota ? quota.quotaCount - quota.usedCount : '-'} `}</span>
          {getIn18Text('CI')}
        </span>
      </div>
    </div>
  );
});
export default Quota;
export interface QuotaMethods {
  refresh: () => void;
  getQuota: () => WhatsAppQuotaV2;
}
