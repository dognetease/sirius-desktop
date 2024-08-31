import React, { useEffect, useMemo, useState } from 'react';
import { Button } from 'antd';
import { navigate } from '@reach/router';
import classNames from 'classnames';
import { BindStatus } from './index';
import style from './whatsAppMarketingModal.module.scss';
import { getIn18Text } from 'api';
export interface ContentsProps {
  bindStatus: BindStatus;
  goTo: (num: number) => void;
  onClose?: () => void;
}
export const Contents: React.FC<ContentsProps> = props => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  useEffect(() => {
    if (props.bindStatus.senderStatus) {
      if (['APPROVED'].includes(props.bindStatus.templateStatus)) {
        setActiveIndex(2);
      } else {
        setActiveIndex(1);
      }
    } else {
      setActiveIndex(0);
    }
  }, [props.bindStatus]);
  const templateBtnText = useMemo(() => {
    const { templateStatus } = props.bindStatus;
    switch (templateStatus) {
      case 'IN_APPEAL':
        return getIn18Text('SHENPIZHONG');
      case 'APPROVED':
        return getIn18Text('YITONGGUO');
      case 'REJECTED':
        return getIn18Text('WEITONGGUO');
      default:
        return getIn18Text('QIANWANGSHENQING');
    }
  }, [props.bindStatus.templateStatus]);
  return (
    <div className={style.contents}>
      <div className={style.stepList}>
        <section className={classNames({ active: activeIndex === 0 })}>
          <span className="icon-num">1</span>
          <div className="content">
            <div className="title">{getIn18Text('WANCHENGwhatspp CHUSHIHUABANGDING')}</div>
          </div>
          <Button disabled={props.bindStatus.senderStatus} size="small" onClick={() => props.goTo(1)}>
            {props.bindStatus.senderStatus ? getIn18Text('YIBANGDING') : getIn18Text('QIANWANGBANGDING')}
          </Button>
        </section>
        <section className={classNames({ active: activeIndex === 1 })}>
          <span className="icon-num">2</span>
          <div className="content">
            <div className="title">{getIn18Text('WANCHENGwhatsppXIAOXIMOBANSHENQING')}</div>
            <div className="description">{getIn18Text('ZHU\uFF1ASHENQINGHOUXUSHENHECHENGGONGCAIKEZAIQUNFAGONGNENGZHONGSHIYONGXIAOXIMOBAN')}</div>
          </div>
          <Button disabled={!props.bindStatus.senderStatus || props.bindStatus.templateStatus === 'APPROVED'} size="small" onClick={() => props.goTo(3)}>
            {templateBtnText}
          </Button>
        </section>
        <section className={classNames({ active: activeIndex === 2 })}>
          <span className="icon-num">3</span>
          <div className="content">
            <div className="title">{getIn18Text('SHEZHIWhatsappQUNFARENWU')}</div>
          </div>
          <Button disabled={activeIndex !== 2} size="small" onClick={() => navigate('#sns?page=whatsAppJobEdit')}>
            {getIn18Text('CHUANGJIANRENWU')}
          </Button>
        </section>
        <section className={classNames({ active: activeIndex === 3 })}>
          <span className="icon-num">4</span>
          <div className="content">
            <div className="title">在[消息]中通过whatsapp回复客户</div>
            <div className="description">{getIn18Text('DANGNINTONGGUOQUNFACHUDAKEHUHOU\uFF0CQIANKEZIXUNKEYIZAI\u3010XIAOXI\u3011ZHONGKUAISUCHULI')}</div>
          </div>
        </section>
      </div>
      <div className={style.intro}>
        <div className={style.figure}></div>
        <section>
          <h5>{getIn18Text('YIXIANGKEHUWhatsappYIJIANCHUDA')}</h5>
          <p>{getIn18Text('KUAISUCHUANGJIANQUNFARENWU\uFF0CYIXIANGMUBIAOKEHUWUXUJIAHAOYOUJIKEGAOXIAOBIANJIECHUDAKEHU')}</p>
        </section>
        <section>
          <h5>{getIn18Text('WhatsappLIAOTIANJILULIUCUN')}</h5>
          <p>{getIn18Text('WhatsAppGUANFANGRENZHENGJIEKOU\uFF0CGOUTONGJILUTONGBULIUCUN')}</p>
        </section>
      </div>
    </div>
  );
};
