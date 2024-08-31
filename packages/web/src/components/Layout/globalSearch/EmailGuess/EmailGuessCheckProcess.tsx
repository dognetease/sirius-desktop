import React from 'react';
import style from './emailguess.module.scss';
import ValidatingGif from '@/images/edm_validating_email_1.gif';
import { RightIcon } from '@web-edm/send/validEmailAddress/util';
import { Progress } from 'antd';

interface EmailGuessCheckProcessProps {
  filteredLen: number;
  total: number;
}

const EmailGuessCheckProcess: React.FC<EmailGuessCheckProcessProps> = ({ filteredLen, total }) => {
  const percent = (filteredLen / total) * 100;
  return (
    <div className={style.inNewProgressWrap}>
      <img src={ValidatingGif} alt="" width="130" height="130" />
      <div className={style.percentInfo}>
        已过滤&nbsp;<span className={style.color}>{filteredLen}</span>&nbsp;条数据...&nbsp;
        <span>({percent.toFixed(0)}%)</span>
      </div>
      <Progress strokeColor="#4C6AFF" className={style.progress} percent={percent} showInfo={false} />
      <div className={style.warnInfo}>
        <div className={style.warnInfoItem}>
          <RightIcon fillColor1="#4C6AFF" fillColor2="#94A6FF" />
          <span className={style.warnInfoText}>检查地址格式是否正确</span>
        </div>
        <div className={style.warnInfoItem}>
          <RightIcon fillColor1="#6FE6B5" fillColor2="#0FD683" />

          <span className={style.warnInfoText}>检查对方服务器状态是否正常</span>
        </div>
        <div className={style.warnInfoItem}>
          <RightIcon fillColor1="#FFD394" fillColor2="#FFB54C" />
          <span className={style.warnInfoText}>检查邮箱活跃状态</span>
        </div>
        <div className={style.warnInfoItem}>
          <RightIcon fillColor1="#83B3F7" fillColor2="#3081F2" />
          <span className={style.warnInfoText}>识别公共邮箱、同事客户等地址</span>
        </div>
      </div>
    </div>
  );
};

export default EmailGuessCheckProcess;
