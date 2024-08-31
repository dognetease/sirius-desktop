import React, { useEffect, useState } from 'react';
import { Button } from 'antd';
import { api } from 'api';
import ArrowRight from '@web-common/components/UI/Icons/svgs/disk/ArrowRight';
import style from './whatsAppMarketingModal.module.scss';
import { getIn18Text } from 'api';
const systemApi = api.getSystemApi();
export interface BindingSettingProps {
  showTitle: boolean;
  goTo?: (num: number) => void;
}
export const BindingSetting: React.FC<BindingSettingProps> = props => {
  return (
    <div className={style.bindingSetting}>
      {props.showTitle && <h5 className={style.title}>{getIn18Text('WhatsApp BANGDINGSHEZHI')}</h5>}
      <div className={style.stepList}>
        <section>
          <span className="icon-num">1</span>
          <div className="content">
            <div className="title">{getIn18Text('CHUANGJIAN Facebook Business Manager ZHANGHAO\uFF0CBINGRENZHENG')}</div>
          </div>
          <Button
            size="small"
            type="link"
            onClick={() =>
              systemApi.handleJumpUrl(-1, 'https://waimao.office.163.com/share_anonymous/#type=FILE&shareIdentity=f89cb33f948d4e8b8dad8143ec7e00d4&fileId=19000001539936')
            }
          >
            {getIn18Text('RUHECHUANGJIAN')}
            <ArrowRight className={style.arrowIcon} stroke="#386EE7" opcacity={1} />
          </Button>
        </section>
        <section>
          <span className="icon-num">2</span>
          <div className="content">
            <div className="title">{getIn18Text('DIANJIXIAZAIMOBAN\uFF0CXIANGWANGYISHANGWUTONGSHIHUODAILISHANGTIGONGWhatsapp business APIZHUCEZILIAO')}</div>
          </div>
          <Button
            size="small"
            type="link"
            onClick={() =>
              systemApi.handleJumpUrl(-1, 'https://waimao.office.163.com/share_anonymous/#type=FILE&shareIdentity=1976e79c4174442aa1991bc06bed5e64&fileId=19000001547896')
            }
          >
            {getIn18Text('DIANJIXIAZAIMOBAN')}
            <ArrowRight className={style.arrowIcon} stroke="#386EE7" opcacity={1} />
          </Button>
        </section>
        <section>
          <span className="icon-num">3</span>
          <div className="content">
            <div className="title">{getIn18Text('CHUSHIHUACANSHUBANGDINGSHEZHI')}</div>
          </div>
          <Button size="small" className={style.bindBtn} onClick={() => props.goTo && props.goTo(2)}>
            {getIn18Text('BANGDINGSHEZHI')}
          </Button>
        </section>
      </div>
    </div>
  );
};
