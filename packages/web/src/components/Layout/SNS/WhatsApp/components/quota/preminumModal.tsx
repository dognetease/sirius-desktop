import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { apiHolder, apis, WhatsAppApi, WhatsAppOrderQuotaTypeMap } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import CheckTrial from '@/images/icons/whatsApp/check-trial.png';
import CheckTrialDisabled from '@/images/icons/whatsApp/check-trial-disabled.png';
import CheckOfficial from '@/images/icons/whatsApp/check-official.png';
import style from './preminumModal.module.scss';
import { getIn18Text } from 'api';
interface OfficialModalProps {
  className?: string;
  visible: boolean;
  onCancel: () => void;
}
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
const OfficialModal: React.FC<OfficialModalProps> = props => {
  const { className, visible, onCancel } = props;
  const [quotaTypeMap, setQuotaTypeMap] = useState<WhatsAppOrderQuotaTypeMap | null>(null);
  useEffect(() => {
    whatsAppApi.getOrderQuota({ productId: 'WhatsApp' }).then(data => {
      setQuotaTypeMap(data.quotaPerTypeMap);
    });
  }, []);
  return (
    <Modal
      className={classnames(style.preminumModal, className)}
      width={792}
      title={getIn18Text('WhatsAppYINGXIAOSHENGJI')}
      visible={visible}
      footer={null}
      onCancel={onCancel}
    >
      {quotaTypeMap && (
        <>
          <div className={style.orders}>
            <div className={classnames(style.order, style.free)}>
              <div className={style.title}>{getIn18Text('SHIYONGBAN')}</div>
              <div className={style.subTitle}>{getIn18Text('LIJITIYAN WhatsApp YINGXIAO\uFF0CZHULIWAIMAOTAKE')}</div>
              <div className={style.price}>
                <span>¥</span>
                <span className={style.priceNum}>{quotaTypeMap.FREE.moneyPerYear}</span>
                <span>{getIn18Text('/NIAN')}</span>
              </div>
              <div className={style.content}>
                <div className={style.contentItem}>
                  <img className={style.contentIcon} src={CheckTrial} />
                  <span className={style.contentText}>
                    {getIn18Text('MEIGEQIYEZUIDUOCHUDAKEHUSHU')}
                    {quotaTypeMap.FREE.deliCountPer24h}
                    {getIn18Text('REN/TIAN')}
                  </span>
                </div>
                <div className={style.contentItem}>
                  <img className={style.contentIcon} src={CheckTrial} />
                  <span className={style.contentText}>
                    {getIn18Text('SHIYONGQI')}
                    {quotaTypeMap.FREE.probationTime}
                    {getIn18Text('TIAN')}
                  </span>
                </div>
                <div className={style.contentItem}>
                  <img className={style.contentIcon} src={CheckTrial} />
                  <span className={style.contentText}>{getIn18Text('YUKEHUGOUTONGXIANSHISHOUJIHAO')}</span>
                </div>
                <div className={style.contentItem}>
                  <img className={style.contentIcon} src={CheckTrial} />
                  <span className={style.contentText}>{getIn18Text('PINPAIXIANGQINGYEXIANSHIWANGYIMINGCHENG')}</span>
                </div>
                <div className={classnames(style.contentItem, style.contentItemDisabled)}>
                  <img className={style.contentIcon} src={CheckTrialDisabled} />
                  <span className={style.contentText}>{getIn18Text('SHOUDONGSHEZHIQIYEZHUANSHUXIAOXIMOBAN')}</span>
                </div>
              </div>
            </div>
            <div className={classnames(style.order, style.preminum)}>
              <div className={style.title}>
                <span>{getIn18Text('ZHENGSHIBAN')}</span>
                <span className={style.titleLabel}>{getIn18Text('TUIJIAN')}</span>
              </div>
              <div className={style.subTitle}>{getIn18Text('KEHUZHUANSHUTONGDAO\uFF0CFASONGLIANGDA\uFF0CMOBANFENGFU')}</div>
              <div className={style.price}>
                <span>¥</span>
                <span className={style.priceNum}>{quotaTypeMap.PREMINUM.moneyPerYear}</span>
                <span>{getIn18Text('/NIAN')}</span>
              </div>
              <div className={style.content}>
                <div className={style.contentItem}>
                  <img className={style.contentIcon} src={CheckOfficial} />
                  <span className={style.contentText}>
                    {getIn18Text('RENZHENGHOUMEIGEQIYEZUIDUOCHUDAKEHUSHU')}
                    {quotaTypeMap.PREMINUM.deliCountPer24h}
                    {getIn18Text('REN/TIAN')}
                  </span>
                </div>
                <div className={style.contentItem}>
                  <img className={style.contentIcon} src={CheckOfficial} />
                  <span className={style.contentText}>
                    {getIn18Text('MEIGEQIYEZUIDUOKESHENQING')}
                    {quotaTypeMap.PREMINUM.templateNum}
                    {getIn18Text('GEZHUANSHUMOBAN')}
                  </span>
                </div>
                <div className={style.contentItem}>
                  <img className={style.contentIcon} src={CheckOfficial} />
                  <span className={style.contentText}>{getIn18Text('YUKEHUGOUTONGXIANSHIMINGCHENGDAIYOURENZHENG')}</span>
                </div>
                <div className={style.contentItem}>
                  <img className={style.contentIcon} src={CheckOfficial} />
                  <span className={style.contentText}>{getIn18Text('BIAOJIDEQIYEMINGCHENG\uFF0CRANGKEHUGENGJIAXINREN')}</span>
                </div>
                <div className={style.contentItem}>
                  <img className={style.contentIcon} src={CheckOfficial} />
                  <span className={style.contentText}>{getIn18Text('SHOUDONGSHEZHIQIYEZHUANSHUXIAOXIMOBAN')}</span>
                </div>
              </div>
            </div>
          </div>
          <div className={style.tip}>{getIn18Text('LIJILIANXIWANGYISHANGWUTONGSHIGOUMAIHUOZIXUNSHENGJISHIYI')}</div>
        </>
      )}
    </Modal>
  );
};
export default OfficialModal;
