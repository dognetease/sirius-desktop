import { getIn18Text } from 'api';
import React, { useState, useEffect } from 'react';
import {
  apiHolder,
  apis,
  WhatsAppApi,
  InsertWhatsAppApi,
  WhatsAppBSP,
  WhatsAppFileExtractStatus,
  WhatsAppJobSendType,
  WhatsAppJobSubmitType,
  RequestEditWhatsAppJob,
  RequestEditWhatsAppJobV2,
} from 'api';
import { navigate } from '@reach/router';
import { getTransText } from '@/components/util/translate';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import style from './useWhatsAppMarket.module.scss';

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
const insertWhatsAppApi = apiHolder.api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

type UseWhatsAppMarket = () => {
  whatsAppLoading: boolean;
  whatsAppMarket: (phones: string[]) => void;
};

export const useWhatsAppMarket: UseWhatsAppMarket = () => {
  const fromHash = encodeURIComponent(window.location.hash);
  const [bsp, setBsp] = useState<WhatsAppBSP | null>(null);
  const [checking, setChecking] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [hasOrder, setHasOrder] = useState<boolean>(false);

  useEffect(() => {
    whatsAppApi.getBsp().then(nextBsp => {
      setBsp(nextBsp);

      if (nextBsp === WhatsAppBSP.IB) {
        insertWhatsAppApi.queryBindStatus().then(data => {
          setHasOrder(['TRY', 'UNREGISTERED', 'PURCHASED', 'REGISTERED', 'VERIFIED'].includes(data.orgStatus));
        });
      }

      if (nextBsp === WhatsAppBSP.NX) {
        whatsAppApi.getOrgStatusV2().then(status => {
          setHasOrder(status !== 'UNPURCHASED');
        });
      }
    });
  }, []);

  const extractReceivers = (phones: string[]) =>
    whatsAppApi.extractJobReceiverText({ text: phones.join(';') }).then(extractResult => {
      const extractResultFiltered = {
        ...extractResult,
        body: extractResult.body.filter(row => row.status !== WhatsAppFileExtractStatus.REPEAT),
      };

      return extractResultFiltered;
    });

  const createJobV1 = (phones: string[]) => {
    setCreating(true);
    extractReceivers(phones)
      .then(receivers => {
        return whatsAppApi.createJob({
          jobName: '',
          receivers,
          sendType: WhatsAppJobSendType.SEND_NOW,
          submit: WhatsAppJobSubmitType.DRAFT,
        } as unknown as RequestEditWhatsAppJob);
      })
      .then(job => {
        navigate(`#sns?page=whatsAppJobEdit&jobId=${job.jobId}&fromHash=${fromHash}`);
      })
      .finally(() => {
        setCreating(false);
      });
  };

  const createJobV2 = (phones: string[]) => {
    setCreating(true);
    extractReceivers(phones)
      .then(receivers => {
        return whatsAppApi.createJobV2({
          jobName: '',
          receivers,
          sendType: WhatsAppJobSendType.SEND_NOW,
          submit: WhatsAppJobSubmitType.DRAFT,
        } as unknown as RequestEditWhatsAppJobV2);
      })
      .then(job => {
        navigate(`#sns?page=whatsAppJobEdit&jobId=${job.jobId}&fromHash=${fromHash}`);
      })
      .finally(() => {
        setCreating(false);
      });
  };

  const whatsAppMarket = (phones: string[]) => {
    if (!phones.length) {
      return Toast.info(getIn18Text('QINGXUANZE Wha'));
    }
    if (!hasOrder) {
      return Toast.info(getIn18Text('NINDEQIYEZANWEIKAI'));
    }
    if (!bsp) {
      return Toast.info(getIn18Text('WEICHAXUNDAO Wh'));
    }
    if (bsp === WhatsAppBSP.IB) {
      setChecking(true);

      return whatsAppApi
        .getQuota({ productId: 'WhatsApp' })
        .then(quota => {
          if (!quota) return Toast.info(getIn18Text('WEICHAXUNDAO Wh'));

          const remainCount24h = quota.basePackage.quotaCount - quota.basePackage.usedCount;
          const remainCountTotal = quota.whatsappSendCount.quotaCount - quota.whatsappSendCount.usedCount;

          if (remainCount24h <= 0) {
            return Toast.info(getTransText('24hReachesLimit') || '');
          }

          if (remainCountTotal <= 0) {
            return Toast.info(getTransText('EnterpriseTotalReachesLimit') || '');
          }

          if (phones.length <= Math.min(remainCount24h, remainCountTotal)) {
            return createJobV1(phones);
          }

          if (remainCount24h < remainCountTotal) {
            return Modal.confirm({
              className: style.quotaConfirmModal,
              title: getTransText('24hReachesLimit') || '',
              content: (
                <>
                  {getTransText('24hReachesLimitContentPart1') || ''}
                  {phones.length}
                  {getTransText('24hReachesLimitContentPart2') || ''}
                  <span className={style.highlight}>
                    {getTransText('24hReachesLimitContentPart3') || ''}
                    {remainCount24h}
                    {getTransText('24hReachesLimitContentPart4') || ''}
                  </span>
                  {getTransText('24hReachesLimitContentPart5') || ''}
                </>
              ),
              onOk: () => createJobV1(phones.slice(0, remainCount24h)),
            });
          }

          if (remainCount24h >= remainCountTotal) {
            return Modal.confirm({
              className: style.quotaConfirmModal,
              title: getTransText('EnterpriseTotalReachesLimit') || '',
              content: (
                <>
                  {getTransText('EnterpriseTotalReachesLimitContent1') || ''}
                  {phones.length}
                  {getIn18Text('GE')}
                  {getTransText('EnterpriseTotalReachesLimitContent2') || ''}
                  <span className={style.highlight}>
                    {getTransText('EnterpriseTotalReachesLimitContent3') || ''}
                    {remainCountTotal}
                    {getTransText('EnterpriseTotalReachesLimitContent4') || ''}
                  </span>
                  {getTransText('EnterpriseTotalReachesLimitContent5') || ''}
                </>
              ),
              onOk: () => createJobV1(phones.slice(0, remainCountTotal)),
            });
          }
        })
        .finally(() => {
          setChecking(false);
        });
    }
    if (bsp === WhatsAppBSP.NX) {
      setChecking(true);

      return whatsAppApi
        .getQuotaV2()
        .then(quota => {
          const remainCount = quota.quotaCount - quota.usedCount;

          if (remainCount <= 0) {
            return Toast.info(getTransText('EnterpriseTotalReachesLimit') || '');
          }

          if (phones.length <= remainCount) {
            return createJobV2(phones);
          }

          return Modal.confirm({
            className: style.quotaConfirmModal,
            title: getTransText('EnterpriseTotalReachesLimit') || '',
            content: (
              <>
                {getTransText('EnterpriseTotalReachesLimitContent1') || ''}
                {phones.length}
                {getIn18Text('GE')}
                {getTransText('EnterpriseTotalReachesLimitContent2') || ''}
                <span className={style.highlight}>
                  {getTransText('EnterpriseTotalReachesLimitContent3') || ''}
                  {remainCount}
                  {getTransText('EnterpriseTotalReachesLimitContent4') || ''}
                </span>
                {getTransText('EnterpriseTotalReachesLimitContent5') || ''}
              </>
            ),
            onOk: () => createJobV2(phones.slice(0, remainCount)),
          });
        })
        .finally(() => {
          setChecking(false);
        });
    }
    return;
  };

  return {
    whatsAppLoading: checking || creating,
    whatsAppMarket,
  };
};
