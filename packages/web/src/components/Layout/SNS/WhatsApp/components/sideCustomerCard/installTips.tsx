import { getIn18Text } from 'api';
import React, { ReactNode, useEffect, useState } from 'react';
import { api, apis, InsertWhatsAppApi } from 'api';
import { ReactComponent as Icon1 } from '@/images/icons/whatsApp/extension-des-1.svg';
import { ReactComponent as Icon2 } from '@/images/icons/whatsApp/extension-des-2.svg';
import { ReactComponent as Icon3 } from '@/images/icons/whatsApp/extension-des-3.svg';

import style from './installTips.module.scss';
import { getTransText } from '@/components/util/translate';
const insertWhatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
interface TipItemProps {
  icon?: ReactNode;
  title: string;
  content: string | ReactNode;
}

interface InstallTipsProps {
  installed?: boolean;
  opened?: boolean;
  logined?: boolean;
  showSteps?: boolean;
  snsId?: string;
}

const TIP_ITEMS: TipItemProps[] = [
  {
    title: getTransText('YOUJIANKEHUSHUOMING1-1'),
    content: getTransText('SHIYONGWhatsAppGOUTONGSHI'),
    icon: <Icon1 />,
  },
  {
    title: getTransText('YOUJIANKEHUSHUOMING2-1'),
    content: getTransText('GENJUWhatsAppLIANXIREN'),
    icon: <Icon2 />,
  },
  {
    title: getTransText('TONGBULIAOTIANJILUDAOKEHU'),
    content: getTransText('TONGBULIAOTIANJILUDAOXIANGQINGYE'),
    icon: <Icon3 />,
  },
];

export const TipItem = ({ icon, title, content }: TipItemProps) => (
  <>
    <div className={style.tipItemHeader}>
      <span className={style.tipIconWrap}>{icon}</span>
      {title}
    </div>
    <div className={style.tipContent}>{content}</div>
  </>
);

// eslint-disable-next-line react/destructuring-assignment
const StepState = (props: { active?: boolean }) => (
  <span className={props.active ? style.active : ''}>{props.active ? getIn18Text('YIWANCHENG') : getIn18Text('WEIWANCHENG')}</span>
);

export const InstallTips = (props: InstallTipsProps) => {
  const { installed, opened, logined, showSteps } = props;
  const [count, setCount] = useState<number>(0);
  useEffect(() => {
    setInterval(() => {
      setCount(prevCount => prevCount + 1);
    }, 1000);
  }, []);
  useEffect(() => {
    if (props.snsId) {
      insertWhatsAppApi.loginPersonalWA({ sender: props.snsId });
      localStorage.setItem('whatsapp_number', props.snsId);
    }
  }, [props.snsId]);
  useEffect(() => {
    if (count > 3 && !props.snsId) {
      const whatsAppNumberCache = localStorage.getItem('whatsapp_number');
      if (whatsAppNumberCache) {
        insertWhatsAppApi.logoutPersonalWA({ sender: whatsAppNumberCache });
        localStorage.removeItem('whatsapp_number');
      }
    }
  }, [props.snsId, count]);
  return (
    <div className={style.tipContainer}>
      <div className={style.header}>{getTransText('JIERUWhatsAppZHULICHENGDAN')}</div>
      <div className={style.body}>
        <ul>
          {TIP_ITEMS.map(item => (
            <li>
              <TipItem title={item.title} icon={item.icon} content={item.content} />
            </li>
          ))}
        </ul>
        {showSteps !== false && (
          <div className={style.installSteps}>
            <h3>{getTransText('JIERUWhatsAppANZHUANGBUZHOU')}</h3>
            <ul>
              <li>
                {getTransText('WhatsAppANZHUANGSTEP1')}
                <StepState active={installed} />
              </li>
              <li>
                {getTransText('WhatsAppANZHUANGSTEP2')}
                <StepState active={opened} />
              </li>
              <li>
                {getTransText('WhatsAppANZHUANGSTEP3')}
                <StepState active={logined} />
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
