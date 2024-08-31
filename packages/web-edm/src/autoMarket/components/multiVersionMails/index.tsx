import React, { useEffect, useRef, useState, useImperativeHandle } from 'react';
import classnames from 'classnames/bind';
import { Switch, Progress, Button, Tooltip } from 'antd';
import { ReactComponent as WarningIcon } from '@/images/icons/edm/edm-common-notice.svg';
import { apiHolder, apis, EdmSendBoxApi, GPTDayLeft, GptAiContentReq, GPTAiContentRes, SentenceModel, AIModifyInfo, AIResults, AIRewriteConfRes } from 'api';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { ReactComponent as MultiVersionMailSvg } from '@/images/icons/edm/yingxiao/multi-version-mail.svg';
import gif from '@/images/icons/edm/yingxiao/load-more.gif';
import noDataPng from '@/images/icons/edm/yingxiao/noData.png';
// import gif from '@/images/edm_validating_email_1.gif';
import cloneDeep from 'lodash/cloneDeep';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { pickFullWords } from '../../../send/utils/pickFullWords';
import { AIContent } from '../AIModify/content';
import styles from './DoubleTrack.module.scss';
import { getUUID } from '../../utils';
import style from './multiVersionMails.module.scss';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';
import { MultiVersionWordError } from '../../../components/multiVersionMails/multiVersionWordError';

interface PickResult {
  words: Array<{ id: string; word: string }>;
  replacedMailContent: string;
}

export interface Props {
  contactSize: number;
  emailContent: string | '';
  sendShowForm: (showForm: boolean) => void;
  visible: boolean;
  onChange?: (arg: any) => void;
  value?: any;
  disabled?: boolean;
}
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const realStyle = classnames.bind(styles);

export const MultiVersionMails = React.forwardRef((props: Props, ref) => {
  const { contactSize, emailContent, sendShowForm, visible, disabled = false } = props;
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState<'inStart' | 'inProgress' | 'complete' | 'wordsError' | 'netError'>('inStart');
  // const [percent, setPercent] = useState<number>(0);
  const [percent, _setPercent] = useState<number>(0);
  const [aiContentDayLeft, setAiContentDayLeft] = useState<number>(0);
  const [isFirst, setIsFirst] = useState<boolean>(true);
  const [contentChange, setContentChange] = useState<boolean>(false);
  const timer = useRef<null | NodeJS.Timeout | number>(null);
  const percentRef = useRef<number>(0);
  const aiModifyRef = useRef<any>();

  const [pickResult, setPickResult] = useState<PickResult>();
  const [aiServerResult, setAiServerResult] = useState<GPTAiContentRes>();
  const [aiResult, setAiResult] = useState<AIResults>();
  const wordsRef = useRef<SentenceModel[]>([]);
  const [componentId] = useState(`comp_${getUUID()}`);

  const setPercent = (v: number) => {
    _setPercent(v);
  };

  const checkStatus = async (checked: boolean) => {
    if (checked) {
      validateQuery();
    } else {
      setShowForm(false);
      resetPercent(0);
    }
  };

  const validateQuery = async () => {
    // const { contactSize, mailContent: newMailContent, mailTextContent } = emailContentRef.current
    // if (contactSize <= 1) {
    //   toast.error({ content: '收件人不足2人' });
    //   return false;
    // }

    if (!emailContent) {
      toast.error({ content: getTransText('QINGXIANTIANJIAYOUJIANNEIRONG') });
      return false;
    }

    try {
      const aiContentDayLeft = await resetDayLeft();
      if (!aiContentDayLeft || aiContentDayLeft <= 0) {
        toast.error({ content: getTransText('JINRIKEYONGCISHUWEI0') });
        return false;
      }
    } catch (e) {
      return false;
    }

    let conf: AIRewriteConfRes = {
      maximumBytes: 300,
      minimumBytes: 30,
      sentenceCount: 4,
      wordsBlackList: [],
    };
    try {
      // 获取ai重写配置，获取失败采用默认
      conf = await edmApi.getAIRewriteConf();
    } catch (err) {}
    const { words, text } = pickFullWords(emailContent, conf);
    if (words.length === 0) {
      setStatus('wordsError');
      setShowForm(true);
      return false;
    }

    const tempResult: PickResult = {
      words,
      replacedMailContent: text,
    };
    setPickResult(tempResult);

    wordsRef.current = words.map(item => {
      return { sentence: item.word };
    });

    setShowForm(true);
    return true;
  };

  const resetStatus = () => {
    setStatus('inStart');
    clearAndStopTime();
    setContentChange(false);
    resetDayLeft();
    setShowForm(false);
    resetPercent(0);
  };

  function stop() {
    return new Promise((resolve, reject) => {
      if (status === 'inProgress') {
        Modal.confirm({
          title: getTransText('ZHENGZAISHENGCHENGDUOBANBENYOUJIAN'),
          content: getTransText('JIANCEDAOSHEZHIYEMIANJIANGGUANBI'),
          type: 'warn',
          closable: true,
          className: style.modal,
          onOk() {
            resetStatus();
            resolve(true);
          },
          onCancel() {
            reject(false);
          },
        });
      } else {
        resolve(true);
      }
    });
  }

  useImperativeHandle(ref, () => {
    const getAiModifyInfo = async () => {
      if (showForm && !disabled) {
        return await aiModifyRef?.current?.getAIModifyResult();
      } else {
        return undefined;
      }
    };

    return {
      getAiModifyInfo,
      getStatus() {
        return status;
      },
      resetStatus,
      save() {
        if (status === 'inProgress') {
          toast.error({ content: getTransText('SHENGCHENGWANCHENGCAIKEBAOCUN') });
          return Promise.reject();
        }

        return getAiModifyInfo();
      },
      stop,
    };
  });

  const generateAgain = async () => {
    const isPass = await validateQuery();
    if (isPass) {
      fetchData();
    }
  };

  const stratTimeAndFetch = (first: boolean, taskId: string | null, reqCount: number) => {
    // clearTime();
    timer.current = setTimeout(() => {
      fetchAiContent(first, taskId, reqCount);
    }, 10000);
  };

  const clearTime = () => {
    timer.current && clearTimeout(Number(timer.current));
  };

  const clearAndStopTime = () => {
    clearTime();
    timer.current = -1 as unknown as NodeJS.Timeout;
  };

  const getGPTAiContent = async (req: GptAiContentReq) => {
    return await edmApi.getGPTAiContent(req);
  };

  const fetchAiContent = async (first: boolean, taskId: string | null, reqCount: number) => {
    const Req: GptAiContentReq = {
      contactSize, //联系人数量
      first,
      sentenceList: wordsRef.current,
      taskId: taskId,
      // languageLimit: 1,
    };
    timer.current = null;
    try {
      const res = await getGPTAiContent(Req);
      const { taskId: newTaskId } = res;
      clearTime();
      // 处理失败
      if (res.finishState === 2) {
        setStatus('netError');
      }
      // 处理成功
      if (res.finishState === 1) {
        setStatus('complete');
        resetPercent(100);
        resetDayLeft();
        setAiServerResult(res);
        setIsFirst(false);
        setContentChange(false);
      }
      // 处理中
      if (res.finishState === 0 && timer.current !== -1) {
        percentRef.current = percentRef.current + Math.round(Math.random() * (3 - 1) + 1);
        if (percentRef.current < 100) {
          setPercent(percentRef.current);
        }
        stratTimeAndFetch(false, newTaskId, reqCount);
      }
    } catch (e) {
      clearTime();
      if (reqCount > 0) {
        stratTimeAndFetch(!taskId, taskId, --reqCount);
      } else {
        setStatus('netError');
      }
    }
  };

  const constructResultData = () => {
    let tempResult = cloneDeep(pickResult);

    let modify = new Array<AIModifyInfo>();
    aiServerResult?.aiDynamicInfos?.forEach(item => {
      const aiSentenceList = item.aiSentenceList.map(i => {
        return { aiSentence: i.aiSentence, unSelected: false };
      });

      tempResult?.words.forEach(innerItem => {
        if (innerItem.word === item.originalSentence) {
          let info: AIModifyInfo = {
            id: innerItem.id,
            use: true,
            originalSentence: innerItem.word,
            aiSentenceList: aiSentenceList,
            placeholder: item.placeholder,
          };
          modify.push(info);
        }
      });
    });

    const result: AIResults = {
      mailContent: tempResult?.replacedMailContent || '',
      modify: modify,
    };
    setAiResult(result);
  };

  const resetDayLeft = async () => {
    const { aiContentDayLeft } = (await edmApi.getGPTQuota()) as GPTDayLeft;
    setAiContentDayLeft(aiContentDayLeft || 0);
    return aiContentDayLeft;
  };

  const resetPercent = (percent: number) => {
    setPercent(percent);
    percentRef.current = percent;
  };

  const fetchData = async () => {
    setStatus('inProgress');
    resetPercent(0);
    await fetchAiContent(true, null, 3);
    resetDayLeft();
  };

  const mailContentChanged = (needCheck: boolean) => {
    SiriusModal.warning({
      title: getTransText('YOUJIANZHENGWENBIANGENG'),
      content: getTransText('JIANCEDAOYOUJIANZHENGWENKENENGBEIBIANJIGUO'),
      okText: getTransText('CHONGXINSHENGCHENG'),
      icon: <WarningIcon />,
      className: style.multiVersionConfirmModal,
      cancelText: getTransText('QUXIAO'),
      centered: true,
      onOk() {
        needCheck ? generateAgain() : fetchData();
      },
    });
  };

  const startProcess = (needCheck: boolean) => {
    if (isFirst || status !== 'complete') {
      fetchData();
      return;
    }
    if (contentChange) {
      mailContentChanged(needCheck);
      return;
    }
  };

  const scrollToBottom = () => {
    const containerWrapper = document.querySelector('#writeStepContainer') as Element; // 外层容器 出现滚动条的dom
    if (containerWrapper) {
      setTimeout(() => {
        containerWrapper.scrollTo(0, containerWrapper.scrollHeight);
      }, 100);
    }
  };

  useEffect(() => {
    resetDayLeft();
    return () => {
      clearAndStopTime();
    };
  }, []);

  useEffect(() => {
    constructResultData();
  }, [aiServerResult, pickResult]);

  useEffect(() => {
    if (!visible) {
      setContentChange(false);
    }
    if (visible && contentChange && showForm && status !== 'inProgress') {
      setContentChange(false);
      mailContentChanged(true);
    }
  }, [visible, contentChange]);

  useEffect(() => {
    sendShowForm(showForm);
    if (showForm) {
      scrollToBottom();
    }
    if (status === 'wordsError') {
      return;
    }
    if (showForm) {
      startProcess(false);
    } else {
      clearAndStopTime();
    }
  }, [showForm]);

  useEffect(() => {
    setContentChange(true);
  }, [emailContent]);

  return (
    <div id={componentId} className={classnames(styles.doubleTrackWrapper)}>
      <div style={{ position: 'relative' }}>
        <span className={styles.dayLeft}>
          {getIn18Text('JINRIKEYONGCISHU')}
          <span className={styles.dayLeftNum}>{aiContentDayLeft}</span>
        </span>
        <div
          className={realStyle({
            infoWrapper: true,
            opened: showForm,
          })}
        >
          <div className={styles.container}>
            <div className={styles.icon}>
              <MultiVersionMailSvg />
            </div>
            <div className={styles.content}>
              <div className={styles.title}>
                <span>{getIn18Text('QIANYOUQIANMIAN')}</span>
                <span className={styles.tag} style={{ color: '#398E80', border: 'none' }}>
                  {getTransText('TISHENGSONGDALV')}
                </span>
              </div>
              <div className={styles.info}>
                {getTransText('BUGAIBIANYUANYOUNEIRONG')}{' '}
                <span className={styles.percent}>
                  50<span className={styles.percentMark}>%</span>
                </span>
                {getIn18Text('SONGDALV。')}
              </div>
            </div>
            <div className={styles.switch}>
              <Tooltip title={disabled ? getTransText('GAIGONGNENGZANBUZHICHIFUZHIHEBIANJICAOGAO') : ''}>
                <Switch
                  size="small"
                  checked={showForm}
                  disabled={disabled}
                  onChange={async checked => {
                    await stop();
                    checkStatus(checked);
                  }}
                />
              </Tooltip>
            </div>
          </div>

          {showForm && (
            <div>
              {status === 'inProgress' && (
                <div className={style.progressWrapper}>
                  <img style={{ marginTop: '20px' }} src={gif} alt="" width="130" height="130" />
                  <div className={style.percent}>
                    {getTransText('ZHENGZAISHENGCHENGYOUJIANNEIRONG')}（{percent}%）
                  </div>
                  <div className={style.info}>{getTransText('TONGGUOXIHUARENQUNCHAYIHUAFASONG')}</div>
                  <Progress strokeColor="#4C6AFF" percent={percent} showInfo={false} />
                </div>
              )}
              {status === 'complete' && aiResult && (
                <AIContent
                  ref={aiModifyRef}
                  reGeneral={() => {
                    generateAgain();
                  }}
                  aiResult={aiResult}
                  contactSize={contactSize}
                  componentId={componentId}
                />
              )}
              {(status === 'netError' || status === 'wordsError') && (
                <div className={style.progressWrapper}>
                  <img style={{ marginTop: '20px' }} src={noDataPng} alt="" width="130" height="130" />
                  {status === 'wordsError' ? <MultiVersionWordError /> : <div className={style.info}>{getTransText('SHIYONGRENSHUTAIDUOLA')}</div>}
                  <Button className={styles.retryBtn} type="ghost" onClick={generateAgain}>
                    {getIn18Text('ZHONG SHI')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
