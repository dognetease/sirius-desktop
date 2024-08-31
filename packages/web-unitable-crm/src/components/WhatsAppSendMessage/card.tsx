import React, { useMemo } from 'react';
import classnames from 'classnames';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { getAvatarColor } from '@/components/Layout/SNS/utils';
import style from './card.module.scss';
import { SenderType } from './index';

interface Props {
  sender?: string;
  selected: boolean;
  type: SenderType;
  hanldeClickSender?: (type: SenderType, sender: string) => void;
  handleLoginPersonal?: () => void;
  login?: boolean; // 插件/bsp登录态是否有账号可以展示，个人号是有有绑定态
  avatarUrl?: string;
  accountName?: string;
  time?: string;
}

const PersonalSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={36} height={36} fill="none">
    <rect width={36} height={36} fill="#F0F2F7" rx={18} />
    <path stroke="#8D92A1" strokeLinecap="round" d="M12.5 18h11M18 23.5v-11" />
  </svg>
);
const BusinessSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={36} height={36} fill="none">
    <rect width={36} height={36} fill="#F0F2F7" rx={18} />
    <path
      stroke="#8D92A1"
      strokeLinejoin="round"
      strokeWidth={1.099}
      d="M15.264 12c.267 0 .512.145.642.378l.898 1.617a.734.734 0 0 1 .014.685l-.865 1.73s.251 1.288 1.3 2.337a4.989 4.989 0 0 0 2.333 1.295l1.73-.865a.734.734 0 0 1 .685.015l1.622.902c.233.13.377.375.377.642v1.861c0 .949-.88 1.633-1.78 1.33-1.844-.622-4.708-1.808-6.524-3.623-1.815-1.816-3-4.68-3.623-6.525-.303-.898.381-1.779 1.33-1.779h1.861Z"
    />
  </svg>
);

const timeStr = time => {
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const daysArr = [7, 15, 30];
  if (!time) return;
  for (let i = 0; i < daysArr.length; i++) {
    if (now - time < daysArr[i] * day) {
      return `近${daysArr[i]}天联系过`;
    }
  }
  return;
};

export const Card: React.FC<Props> = ({ sender, selected, type, hanldeClickSender, login, handleLoginPersonal, avatarUrl, accountName, time }) => {
  const accountType = useMemo(() => {
    switch (type) {
      case 'PERSONAL':
      case 'PERSONWA':
        return '个人账户';
      case 'BUSINESS':
        return '商业账户';
    }
  }, [type]);

  if (login) {
    return (
      <div
        className={classnames(style.account, type === 'BUSINESS' ? style.business : style.personal, selected ? style.selected : '')}
        onClick={() => hanldeClickSender && hanldeClickSender(type, sender!)}
      >
        <span className={style.tag}>{accountType}</span>
        <AvatarTag
          user={{
            name: sender,
            color: getAvatarColor(sender!),
            avatar: avatarUrl,
          }}
          size={36}
        />
        <div className={style.text}>
          <div className={style.label}>账户名称</div>
          <div className={style.name}>{accountName || sender}</div>
          {type ? <div className={classnames(style.timeTag, { [style.timeTagUntime]: !timeStr(time) })}>{timeStr(time) || '未联系过'}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className={classnames(style.account, type === 'BUSINESS' ? style.business : style.personal)} onClick={() => handleLoginPersonal && handleLoginPersonal()}>
      <span className={style.tag}>{accountType}</span>
      {type === 'BUSINESS' ? <BusinessSvg /> : <PersonalSVG />}
      <div className={style.text}>
        <div className={style.tips}>{type === 'BUSINESS' ? '联系管理员分配商业WhatsApp账号' : type === 'PERSONAL' ? '登录个人 WhatsApp' : '请先登录WA个人账号'}</div>
      </div>
    </div>
  );
};
