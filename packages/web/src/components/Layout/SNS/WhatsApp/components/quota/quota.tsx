import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import classnames from 'classnames';
import moment from 'moment';
import { api, apis, apiHolder, WhatsAppApi, WhatsAppQuota, WhatsAppQuotaUserType, WhatsAppAuthenticateState } from 'api';
import Notice from '../notice/notice';
import PreminumModal from './preminumModal';
import { getTransText } from '@/components/util/translate';
import style from './quota.module.scss';
import { getIn18Text } from 'api';
interface QuotaProps {
  className?: string;
  type: 'topbar' | 'banner';
}
const authenticateLink = 'https://waimao.office.163.com/share_anonymous/#type=FILE&shareIdentity=f89cb33f948d4e8b8dad8143ec7e00d4&fileId=19000001539936';
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
const systemApi = api.getSystemApi();
const Quota = forwardRef((props: QuotaProps, ref) => {
  const { className, type } = props;
  const [quota, setQuota] = useState<WhatsAppQuota | null>(null);
  const [preminumModalVisible, setPreminumModalVisible] = useState<boolean>(false);
  const handleAuthenticate = () => {
    systemApi.handleJumpUrl(-1, authenticateLink);
  };
  const handleQuotaFetch = () => {
    whatsAppApi.getQuota({ productId: 'WhatsApp' }).then(data => {
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
    <div className={classnames(style.quota, className)}>
      {quota && (
        <>
          {type === 'topbar' && (
            <>
              <>
                {quota.userType === WhatsAppQuotaUserType.TRIAL && (
                  <div className={classnames(style.topbarContainer)}>
                    <span className={style.quotaTip}>
                      {getIn18Text('SHENGYULIULIANGBAOZONGLIANG')}
                      <span className={style.num}>{` ${quota.whatsappSendCount.quotaCount - quota.whatsappSendCount.usedCount} `}</span>
                      {getIn18Text('CI')}
                    </span>
                  </div>
                )}
              </>
              <>
                {quota.userType === WhatsAppQuotaUserType.OFFICIAL && quota.authenticateState === WhatsAppAuthenticateState.NOT_AUTHENTICATED && (
                  <div className={classnames(style.topbarContainer)}>
                    <span className={style.quotaTip}>
                      {!!quota.freeCycleMonthQuota.quotaCount && (
                        <>
                          {getTransText('BENYUEMIANFEIEDUYISHIYONG')}
                          <span className={style.num}>{` ${quota.freeCycleMonthQuota.usedCount} `}</span>
                          {getIn18Text('CI')}，
                        </>
                      )}
                      {getTransText('BENYUELIULIANGBAOYISHIYONG')}
                      <span className={style.num}>{` ${quota.payOnceMonthUsed} `}</span>
                      {getIn18Text('CI')}，{getIn18Text('SHENGYULIULIANGBAOZONGLIANG')}
                      <span className={style.num}>{` ${quota.whatsappSendCount.quotaCount - quota.whatsappSendCount.usedCount} `}</span>
                      {getIn18Text('CI')}
                    </span>
                  </div>
                )}
              </>
              <>
                {quota.userType === WhatsAppQuotaUserType.OFFICIAL && quota.authenticateState === WhatsAppAuthenticateState.AUTHENTICATED && (
                  <div className={classnames(style.topbarContainer)}>
                    <span className={style.quotaTip}>
                      {!!quota.freeCycleMonthQuota.quotaCount && (
                        <>
                          {getTransText('BENYUEMIANFEIEDUYISHIYONG')}
                          <span className={style.num}>{` ${quota.freeCycleMonthQuota.usedCount} `}</span>
                          {getIn18Text('CI')}，
                        </>
                      )}
                      {getTransText('BENYUELIULIANGBAOYISHIYONG')}
                      <span className={style.num}>{` ${quota.payOnceMonthUsed} `}</span>
                      {getIn18Text('CI')}，{getIn18Text('SHENGYULIULIANGBAOZONGLIANG')}
                      <span className={style.num}>{` ${quota.whatsappSendCount.quotaCount - quota.whatsappSendCount.usedCount} `}</span>
                      {getIn18Text('CI')}
                    </span>
                  </div>
                )}
              </>
            </>
          )}
          {type === 'banner' && (
            <>
              <>
                {quota.userType === WhatsAppQuotaUserType.TRIAL && (
                  <Notice className={style.bannerContainer} type="info">
                    <span className={style.quotaTip}>
                      {`${getTransText('DANGQIANNINDEQIYESHIYONGZHUANGTAI24')} ${quota.basePackage.quotaCount} ${getTransText('CIDANGQIANSHENGYUFASONG')} ${
                        quota.basePackage.quotaCount - quota.basePackage.usedCount
                      } ${getTransText('CIJIEZHIRIQI')} ${moment(+quota.expireDay).format('YYYY-MM-DD')}`}
                    </span>
                    <span className={style.quotaGuide} onClick={() => setPreminumModalVisible(true)}>
                      {getIn18Text('GOUMAIZHENGSHIBANBEN')}
                    </span>
                  </Notice>
                )}
              </>
              <>
                {quota.userType === WhatsAppQuotaUserType.OFFICIAL && quota.authenticateState === WhatsAppAuthenticateState.NOT_AUTHENTICATED && (
                  <Notice className={style.bannerContainer} type="error">
                    <span className={style.quotaTip}>
                      {`${getTransText('DANGQIANNINDEQIYEWEIJINXINGFBMRENZHENG24')} ${quota.basePackage.quotaCount} ${getTransText('CIDANGQIAN24XIAOSHIFAXINSHENGYU')} ${
                        quota.basePackage.quotaCount - quota.basePackage.usedCount
                      } ${getTransText('CI')}`}
                    </span>
                    <span className={style.quotaGuide} onClick={handleAuthenticate}>
                      {getIn18Text('QURENZHENG')}
                    </span>
                  </Notice>
                )}
              </>
              <>
                {quota.userType === WhatsAppQuotaUserType.OFFICIAL && quota.authenticateState === WhatsAppAuthenticateState.AUTHENTICATED && (
                  <Notice className={style.bannerContainer} type="info">
                    <span className={style.quotaTip}>
                      {`${getTransText('DANGQIANNINDEQIYEWEIYIRENZHENG24')} ${quota.basePackage.quotaCount} ${getTransText('CIDANGQIAN24XIAOSHIFAXINSHENGYU')} ${
                        quota.basePackage.quotaCount - quota.basePackage.usedCount
                      } ${getTransText('CI')}`}
                    </span>
                  </Notice>
                )}
              </>
            </>
          )}
        </>
      )}
      <PreminumModal visible={preminumModalVisible} onCancel={() => setPreminumModalVisible(false)} />
    </div>
  );
});
export default Quota;
export interface QuotaMethods {
  refresh: () => void;
  getQuota: () => WhatsAppQuota;
}
