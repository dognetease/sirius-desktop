import React from 'react';
import { Button } from 'antd';
import { EmailScoreStage } from 'api';
import EmailScoreBg from '@/images/icons/edm/emailscore/email-score-checkbg.png';
import EmailScoreBg2 from '@/images/icons/edm/emailscore/email-score-checkbg2.png';
import SuccessIcon from '@/images/icons/edm/emailscore/success.svg';
import EmailScoreDetail from './emailScoreDetail';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import classnames from 'classnames';
import style from './emailScore.module.scss';
import { getIn18Text } from 'api';

interface EmailScoreProps {
  visible: boolean;
  stage: EmailScoreStage;
  progress: number;
  email: string;
  emailFetching: boolean;
  limit: number;
  sending: boolean;
  detail: any;
  onSend: () => void;
  onCancel: () => void;
  onRescore: () => void;
}

const MessageList = [
  {
    default: getIn18Text('JIANCEFAJIANIPSHIFOUZHENGCHANG'),
    checking: getIn18Text('ZHENGZAIJIANCEFAJIANIPSHIFOUZHENGCHANG'),
    done: getIn18Text('FAJIANIPJIANCEWANCHENG'),
  },
  // {
  //   default: '检测发件地址是否正常',
  //   checking: '正在检测发件地址是否正常',
  //   done: '发件地址检测完成',
  // },
  // {
  //   default: '检测邮件格式是否正确',
  //   checking: '正在检测邮件格式是否正确',
  //   done: '邮件格式检测完成',
  // },
  {
    default: '',
    checking: getIn18Text('ZHENGZAIJINXINGLAJIYOUJIANGUOLV'),
    done: getIn18Text('LAJIYOUJIANGUOLVWANCHENG'),
  },
  {
    default: getIn18Text('JIANCEYOUJIANZHONGSHIFOUHANYOUHUAILIAN'),
    checking: getIn18Text('ZHENGZAIJIANCEYOUJIANZHONGSHIFOUHANYOUHUAILIAN'),
    done: getIn18Text('YOUJIANZHONGSHIFOUHANYOUHUAILIANJIANCEWANCHENG'),
  },
];

const EmailScore: React.FC<EmailScoreProps> = props => {
  const {
    visible,
    stage,
    progress = -1,
    // email,
    // emailFetching,
    limit,
    sending,
    detail,
    onSend,
    onCancel,
    onRescore,
  } = props;

  const isInprogress = stage === 'COMPOSE' || (stage === 'END' && progress < 3 && progress > -1);
  const isEnd = stage === 'END' && (progress === 3 || progress < 0);

  return (
    <Modal visible={visible} width={490} closable={false} title={null} className={style.emailScore} onCancel={onCancel} footer={null}>
      <div className={style.body}>
        <div className={classnames([style.head, isInprogress ? style.inProgress : ''])}>
          <div className={style.title}>
            <div className={style.f1}>{getIn18Text('YOUJIANPINGFEN')}</div>
            <div className={style.close} onClick={onCancel}></div>
          </div>
        </div>
        <div className={style.content}>
          {stage === 'PRE' && (
            <>
              <div className={classnames([style.center, style.scoreBgWrapper])}>
                <img className={style.scoreBg} src={EmailScoreBg} alt="prepare" />
              </div>
              <div className={style.desc}>{getIn18Text('YOUJIANPINGFEN\uFF0CZHENGGEGUOCHENGXUYAOJIFENZHONG\uFF0CQIJIANKEJIXUCAOZUOQITANEIRONG')}</div>
              <div className={style.center}>
                <Button className={style.button} type="primary" loading={sending} onClick={() => onSend()}>
                  {getIn18Text('KAISHIJIANCE')}
                </Button>
              </div>
              <div className={style.tip}>
                {getIn18Text('ZHU\uFF1ABENCIRENWUZUIDUOKEJINXING')}
                {limit}
                {getIn18Text('CIYOUJIANPINGFEN')}
              </div>
            </>
          )}

          {isInprogress && (
            <>
              <div className={classnames([style.center])}>
                <img className={style.scoreBg2} src={EmailScoreBg2} alt="prepare" />
              </div>
              <div className={style.progress}>
                {MessageList.map((message, index) => {
                  return (
                    <div className={classnames([style.progressStage, progress === index ? style.isChecking : '', progress > index ? style.isDone : ''])}>
                      {progress < index && <div className={style.progressText}>{message.default}</div>}
                      {progress === index && (
                        <div>
                          {message.checking}
                          <span className={style.dotting}></span>
                        </div>
                      )}
                      {progress > index && (
                        <div className={style.progressText}>
                          <img src={SuccessIcon} className={style.progressIcon} />
                          {message.done}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {isEnd && (
            <div className={style.detailWrapper}>
              <div className={style.detail}>
                <EmailScoreDetail detail={detail} />
                <div className={style.operate}>
                  <Button className={classnames([style.operateBtn, style.operateBtnGhost])} type="ghost" onClick={onRescore}>
                    {getIn18Text('ZAICIJIANCE')}
                  </Button>
                  <Button className={style.operateBtn} type="primary" onClick={onCancel}>
                    {getIn18Text('QUEDING')}
                  </Button>
                </div>
                <div className={style.tip}>
                  {getIn18Text('ZHU\uFF1ABENCIRENWUZUIDUOKEJINXING')}
                  {limit}
                  {getIn18Text('CIYOUJIANPINGFEN')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
export default EmailScore;
