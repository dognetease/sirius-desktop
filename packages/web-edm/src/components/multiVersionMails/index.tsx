import React, { useEffect, useRef, useState, useImperativeHandle, useContext } from 'react';
import styles from '../doubleTrack/DoubleTrack.module.scss';
import style from './multiVersionMails.module.scss';
import classnames from 'classnames/bind';
import { Switch, Progress, Button, Tooltip } from 'antd';
import { edmDataTracker } from '../../tracker/tracker';
import { ReactComponent as RightArrow } from '@/images/icons/edm/yingxiao/right-arrow.svg';
import { ReactComponent as WarningIcon } from '@/images/icons/edm/edm-common-notice.svg';
import { apiHolder, apis, EdmSendBoxApi, GPTDayLeft, GptAiContentReq, GPTAiContentRes, SentenceModel, AIModifyInfo, AIResults, AIRewriteConfRes } from 'api';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { ReactComponent as MultiVersionMailSvg } from '@/images/icons/edm/yingxiao/multi-version-mail.svg';
import gif from '@/images/icons/edm/yingxiao/load-more.gif';
import noDataPng from '@/images/icons/edm/yingxiao/noData.png';
import { pickFullWords } from '../../send/utils/pickFullWords';
import { AIContent } from '../../send/AIModify/content';
import cloneDeep from 'lodash/cloneDeep';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';
import { MultiVersionWordError } from './multiVersionWordError';
import { edmWriteContext } from '../../send/edmWriteContext';
import { ValidatorContext } from '../../send/validator/validator-context';
import { useOpenHelpCenter } from '@web-common/utils/utils';

interface PickResult {
  words: Array<{ id: string; word: string }>;
  replacedMailContent: string;
}

export interface Props {
  emailContentRef: Ref;
  emailContent: string | '';
  sendShowForm: (showForm: boolean) => void;
  visible: boolean;
}
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const realStyle = classnames.bind(styles);
interface Ref {
  current: any;
}

export const MultiVersionMails = React.forwardRef((props: Props, ref) => {
  const { emailContentRef, emailContent, sendShowForm, visible } = props;
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState<'inStart' | 'inProgress' | 'complete' | 'wordsError' | 'netError' | 'languageError'>('inStart');
  // const [percent, setPercent] = useState<number>(0);
  const [percent, _setPercent] = useState<number>(0);
  const [aiContentDayLeft, setAiContentDayLeft] = useState<number>(0);
  const [isFirst, setIsFirst] = useState<boolean>(true);
  const [contentChange, setContentChange] = useState<boolean>(false);
  const [tipVisible, setTipVisible] = useState<boolean>(false);
  const [autoOpen, setAutoOpen] = useState<boolean>(false);
  const timer = useRef<null | NodeJS.Timeout | number>(null);
  const percentRef = useRef<number>(0);
  const aiModifyRef = useRef();
  const [pickResult, setPickResult] = useState<PickResult>();
  const [aiServerResult, setAiServerResult] = useState<GPTAiContentRes>();
  const [aiResult, setAiResult] = useState<AIResults>();
  const wordsRef = useRef<SentenceModel[]>([]);
  const setPercent = v => {
    _setPercent(v);
  };
  const openHelpCenter = useOpenHelpCenter();

  const { state: edmWriteInfo } = useContext(edmWriteContext).value;
  // 任务诊断相关
  const validatorProvider = useContext(ValidatorContext);

  const checkStatus = async (checked: boolean, showToast: boolean = true) => {
    if (checked) {
      validateQuery(showToast);
    } else {
      setShowForm(false);
      resetPercent(0);
    }
  };

  // 注册检测事件
  useEffect(() => {
    validatorProvider?.dispatch({
      type: 'multiVersion:action',
      payload: [() => checkStatus(true)],
    });
  }, []);

  const validateQuery = async (showToast: boolean = true) => {
    const { contactSize, mailContent: originMailContent, mailTextContent } = emailContentRef.current;
    // 默认从context中取，不存在就从props中透传
    const newMailContent = edmWriteInfo.mailContent || originMailContent;
    if (contactSize <= 1) {
      toast.error({ content: getIn18Text('SHOUJIANRENBUZU2REN') });
      return false;
    }
    if (!mailTextContent) {
      toast.error({ content: getIn18Text('NEIRONGBIANJIWUNEIRONG') });
      return false;
    }

    try {
      const aiContentDayLeft = await resetDayLeft();
      if (!aiContentDayLeft || aiContentDayLeft <= 0) {
        showToast && toast.error({ content: getIn18Text('JINRIQIANYOUQIANBIANKE') });
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
    const { words, text } = pickFullWords(newMailContent, conf);
    if (words.length === 0) {
      setStatus('wordsError');
      setShowForm(true);
      // ai改写失败之后进行记录
      validatorProvider?.dispatch({
        type: 'multiVersion',
        payload: {
          aiRewrite: false,
        },
      });
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

  useImperativeHandle(ref, () => ({
    async getAiModifyInfo() {
      if (showForm) {
        return await aiModifyRef?.current?.getAIModifyResult();
      } else {
        return undefined;
      }
    },
    openMultiVersionSwitch() {
      if (!showForm) {
        setAutoOpen(true);
        checkStatus(true, true);
      }
    },
    closeMultiVersionSwitch() {
      if (showForm) {
        checkStatus(false);
      }
    },
    closeTipVisible() {
      setTipVisible(false);
    },
    getAiModifyStatus() {
      return status;
    },
    getAiModifySwitchChecked() {
      return showForm;
    },
  }));

  const generateAgain = async () => {
    const isPass = await validateQuery();
    if (isPass) {
      fetchData();
    }
  };

  const stratTimeAndFetch = (first: boolean, taskId: string | null, reqCount: number, repeatCount: number) => {
    // clearTime();
    timer.current = setTimeout(() => {
      fetchAiContent(first, taskId, reqCount, repeatCount);
    }, 10000);
  };

  const clearTime = () => {
    timer.current && clearTimeout(Number(timer.current));
  };

  const clearAndStopTime = () => {
    clearTime();
    timer.current = -1 as unknown as NodeJS.Timeout;
  };

  const getCurTimeStamp = () => {
    return new Date().valueOf();
  };

  const getGPTAiContent = async (req: GptAiContentReq) => {
    return await edmApi.getGPTAiContent(req);
  };

  const fetchAiContent = async (first: boolean, taskId: string | null, reqCount: number, repeatCount: number) => {
    const Req: GptAiContentReq = {
      contactSize: emailContentRef?.current?.contactSize || 0, //联系人数量
      first,
      sentenceList: wordsRef.current,
      taskId: taskId,
      languageLimit: 1,
    };
    timer.current = null;
    repeatCount++;
    const startTime = getCurTimeStamp();
    try {
      const res = await getGPTAiContent(Req);
      const { taskId: newTaskId } = res;
      clearTime();
      // 处理失败
      if (res.finishState === 2) {
        setStatus('netError');
        // ai改写成功之后进行记录
        validatorProvider?.dispatch({
          type: 'multiVersion',
          payload: {
            aiRewrite: false,
          },
        });
      }
      // 语言类型不支持
      if (res.finishState === 3) {
        setStatus('languageError');
        // ai改写成功之后进行记录
        validatorProvider?.dispatch({
          type: 'multiVersion',
          payload: {
            aiRewrite: false,
          },
        });
      }
      // 处理成功
      if (res.finishState === 1) {
        setStatus('complete');
        resetPercent(100);
        resetDayLeft();
        setAiServerResult(res);
        setIsFirst(false);
        setContentChange(false);
        if (validatorProvider) {
          // ai改写成功之后进行记录
          validatorProvider.dispatch({
            type: 'multiVersion',
            payload: {
              aiRewrite: true,
            },
          });
        }
      }
      // 处理中
      if (res.finishState === 0 && timer.current !== -1) {
        percentRef.current = percentRef.current + Math.round(Math.random() * (3 - 1) + 1);
        if (percentRef.current < 100) {
          setPercent(percentRef.current);
        }
        stratTimeAndFetch(false, newTaskId, reqCount, repeatCount);
      }
    } catch (e) {
      clearTime();
      sendErrorTracker({ reason: e, timeout: getCurTimeStamp() - startTime, contactSize: Req.contactSize, repeatCount: repeatCount, taskId: taskId || '' });
      if (reqCount > 0) {
        stratTimeAndFetch(!taskId, taskId, --reqCount, repeatCount);
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
    await fetchAiContent(true, null, 3, 0);
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
        if (autoOpen) {
          setTipVisible(true);
          setAutoOpen(false);
        }
      }, 100);
    }
  };

  const sendErrorTracker = async (params: { reason: any; timeout: number; contactSize: number; repeatCount: number; taskId: string }) => {
    edmDataTracker.trackEdmAiContentError(params);
  };

  const renderTitle = () => {
    return (
      <div className={style.content}>
        <span>{getIn18Text('YIWEININZIDONGKAIQI')}</span>
        <span
          className={style.btn}
          onClick={() => {
            setTipVisible(false);
          }}
        >
          {getIn18Text('ZHIDAOLE')}
        </span>
      </div>
    );
  };

  useEffect(() => {
    resetDayLeft();
    return () => {
      clearAndStopTime();
      setTipVisible(false);
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

  // 诊断记录开启按钮
  useEffect(() => {
    validatorProvider?.dispatch({
      type: 'multiVersion',
      payload: {
        open: showForm,
      },
    });
  }, [showForm]);

  useEffect(() => {
    setContentChange(true);
  }, [emailContent]);

  const getErrorInfo = () => {
    if (status === 'wordsError') {
      return <MultiVersionWordError />;
    }
    if (status === 'languageError') {
      return <div className={style.info}>抱歉，暂不支持中文邮件内容改写</div>;
    }
    return <div className={style.info}>{getTransText('SHIYONGRENSHUTAIDUOLA')}</div>;
  };

  return (
    <div className={styles.doubleTrackWrapper} style={{ marginBottom: '12px' }}>
      <div style={{ position: 'relative' }}>
        <span className={styles.dayLeft}>
          {getIn18Text('JINRIKEYONGCISHU')}
          {aiContentDayLeft}
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
                <span className={styles.tag} style={{ color: '#0DC076', border: '0.5px solid #0DC076' }}>
                  {getTransText('TISHENGSONGDALV')}
                </span>
              </div>
              <div className={styles.info}>
                {getIn18Text('AIZHINENGSHENGCHENGDUO')}
                <span className={styles.percent}>
                  50<span className={styles.percentMark}>%</span>
                </span>
                {getIn18Text('SONGDALV。')}
                <span
                  className={styles.infoMore}
                  onClick={() => {
                    edmDataTracker.taskIntellectTrack('multiVersion');
                    openHelpCenter('/d/1639247033264074753.html');
                    // window.open('https://waimao.163.com/helpCenter/d/1639247033264074753.html                  ');
                  }}
                >
                  {getIn18Text('KUAISULEJIE')}
                  <RightArrow />
                </span>
              </div>
            </div>
            <div className={styles.switch} style={{ marginTop: '30px' }}>
              <Tooltip placement="right" title={renderTitle} visible={tipVisible} overlayClassName={style.autoMultiMailTip}>
                <Switch
                  size="small"
                  checked={showForm}
                  onChange={checked => {
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
                  contactSize={emailContentRef?.current.contactSize}
                />
              )}
              {['netError', 'wordsError', 'languageError'].includes(status) && (
                <div className={style.progressWrapper}>
                  <img style={{ marginTop: '20px' }} src={noDataPng} alt="" width="130" height="130" />
                  {/* {status === 'wordsError' ? <MultiVersionWordError /> : <div className={style.info}>{getTransText('SHIYONGRENSHUTAIDUOLA')}</div>} */}
                  {getErrorInfo()}
                  <Button type="primary" onClick={generateAgain}>
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
