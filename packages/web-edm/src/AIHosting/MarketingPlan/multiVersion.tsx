import { Button, Switch, Progress, Spin } from 'antd';
import React, { useState, useRef, useEffect, useImperativeHandle } from 'react';
import { AIContent } from '../../send/AIModify/content';
import {
  apiHolder,
  apis,
  EdmSendBoxApi,
  GPTDayLeft,
  SentenceModel,
  AIModifyInfo,
  AIResults,
  AIRewriteConfRes,
  defaultConfig,
  HostingReWriteReq,
  HostingReWriteResp,
  HostingReWriteDynamicInfo,
  Words,
  AIModifyParam,
  HostingSentence,
  Plan,
  EdmContentInfo,
  conf,
} from 'api';
import style from './multiVersion.module.scss';
import { ReactComponent as MultiVersionMailSvg } from '@/images/icons/edm/yingxiao/multi-version-mail.svg';
import { pickFullWords } from '../../send/utils/pickFullWords';
import cloneDeep from 'lodash/cloneDeep';
import { AllResultModal } from '../../send/AIModify/allResult';
import gif from '@/images/icons/edm/yingxiao/load-more.gif';
import noDataPng from '@/images/icons/edm/yingxiao/noData.png';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import { buildMailContentWithPlaceholder, constructAIModifyResult } from '../../send/AIModify/utils';
import RightArrow from '@/images/icons/edm/yingxiao/edm-right-arrow-black.svg';
import { getTransText } from '@/components/util/translate';
import { buildAiResultMatrix, hasAiModifyContent, isAiOn, ValueMap } from './utils';
import TongyongShuaXin from '@web-common/images/newIcon/tongyong_shuaxin';
import { MultiVersionWordError } from '../../components/multiVersionMails/multiVersionWordError';

import classNames from 'classnames';
import { getIn18Text } from 'api';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

export interface ModifyInfos {
  modify?: Map<number, AIModifyParam>;
  oriPlan?: Plan;
}

export interface MultiVersionImplInterface {
  isUsingModify: () => boolean;
  clearData: (plan?: Plan) => void;
  fetchModifyInfos: () => Promise<ModifyInfos>;
  reGeneral: () => void;
}

interface LocalPickResult {
  words: Words;
  text: string;
}

export interface Props {
  plan: Plan;
  handleOpenStateChange: (open: boolean) => void;
  multiStateChanged?: () => void;
  defaultIndex?: number;
  source?: string;
}

export const MultiVersion = React.forwardRef<MultiVersionImplInterface, Props>((props: Props, ref) => {
  const { multiStateChanged, source } = props;

  const [refreshKey, setRefreshKey] = useState(false);

  const [status, setStatus] = useState<'inStart' | 'inProgress' | 'complete' | 'wordsError' | 'netError' | 'languageError'>('inStart');

  const [config, setConfig] = useState<AIRewriteConfRes>();

  // 选择 plan 的信息
  const [selectedPlan, setSelectedPlan] = useState<Plan>({});

  const [allResultVisiable, setAllResultVisiable] = useState(false);

  const [quota, setQuota] = useState<GPTDayLeft>();

  const [percent, _setPercent] = useState<number>(0);

  const [aiServerResult, setAiServerResult] = useState<HostingReWriteResp>();

  const timer = useRef<null | NodeJS.Timeout | number>(null);

  const percentRef = useRef<number>(0);

  const hostingReWriteReqRef = useRef<HostingReWriteReq>({ sentenceLists: [], first: true, maxVersion: 0 });

  const [indexArray, setIndexArray] = useState<Array<Array<number>>>([]);
  const [valueMatrix, setValueMatrix] = useState<Array<Array<ValueMap>>>([]);

  const [reGen, setReGen] = useState(false);

  const isHostingRes = source === 'hostingRes';

  useEffect(() => {
    setSelectedPlan(cloneDeep(props.plan));
  }, [props.plan]);

  const setPercent = (v: number) => {
    _setPercent(v);
  };

  useImperativeHandle(ref, () => ({
    isUsingModify() {
      return selectedPlan.aiOn || false;
    },
    fetchModifyInfos: async () => {
      let infos = new Map();
      combineServerResult();
      const param = await constructAIModifyResult(selectedPlan.aiResult, false);
      if (selectedPlan.aiOn && param) {
        infos.set(selectedPlan.round, param);
      }
      return {
        modify: cloneDeep(infos),
        oriPlan: cloneDeep(selectedPlan),
      };
    },
    clearData(plan?: Plan) {
      if (plan) {
      } else {
        setStatus('inStart');
        setConfig(undefined);
        setSelectedPlan({});
        setAllResultVisiable(false);
      }
    },
    reGeneral: () => {
      setReGen(true);
    },
  }));

  const fetchData = async () => {
    resetPercent(0);
    await fetchAiContent(true, null, 3);
    resetDayLeft();
    refresh();
  };

  useEffect(() => {
    if (reGen) {
      generateAgain();
      setReGen(false);
    }
  }, [reGen]);

  const generateAgain = async () => {
    clearAndStopTime();

    const isPass = await validateQuery();
    if (isPass) {
      setAiOn(true, selectedPlan);
      // 1. 获取配置
      await splitQuery();
      if (selectedPlan?.pickResult?.words.length === 0) {
        setStatus('wordsError');
        return;
      }
      setStatus('inProgress');
      fetchData();
    }
  };

  const resetDayLeft = async () => {
    const quota = await edmApi.getGPTQuota();
    setQuota(quota);
    return quota.aiContentDayLeft;
  };

  useEffect(() => {
    resetDayLeft();
  }, []);

  const validateQuery = async () => {
    try {
      const aiContentDayLeft = await resetDayLeft();
      if (!aiContentDayLeft) {
        toast.error({ content: getIn18Text('JINRIKEYONGCISHUBU') });
        return false;
      }
    } catch (e) {
      return false;
    }
    return true;
  };

  const setAiOn = (on: boolean, plan: Plan) => {
    selectedPlan.aiOn = on;
    refresh();
  };

  const getAIRewriteConf = async () => {
    let conf = defaultConfig;
    try {
      conf = await edmApi.getAIRewriteConf();
      setConfig(conf);
    } catch (err) {}
    return conf;
  };
  useEffect(() => {
    getAIRewriteConf();
  }, []);

  const splitQuery = async () => {
    let conf = await getAIRewriteConf();

    // 2. 本地筛选句子
    selectedPlan.pickResult = pickFullWords(selectedPlan.mailInfo?.emailContent || '', conf);
    selectedPlan.aiResult = undefined;
    selectedPlan.multiContentId = undefined;
    // 3. 服务端改写
    let sentenceLists = new Array<HostingSentence>();
    let sentences =
      selectedPlan.pickResult?.words.map(innerItem => {
        const sentence: SentenceModel = { sentence: innerItem.word };
        return sentence;
      }) || [];
    if (sentences.length === 0) {
      return;
    }
    const temp: HostingSentence = {
      index: selectedPlan.round || 1,
      sentenceList: sentences,
    };
    sentenceLists.push(temp);
    hostingReWriteReqRef.current.sentenceLists = sentenceLists || [];
    hostingReWriteReqRef.current.maxVersion = conf.hostingMaxVersion || defaultConfig.hostingMaxVersion;
  };

  const combineServerResult = () => {
    aiServerResult?.aiDynamicInfosList.forEach(item => {
      selectedPlan.aiResult = constructAiResult(selectedPlan.pickResult, item);
      selectedPlan.aiResult.title = selectedPlan.title;
    });
    return selectedPlan;
  };

  useEffect(() => {
    if (aiServerResult?.finishState !== 1 && !selectedPlan.aiResult) {
      return;
    }
    combineServerResult();
    aiServerResult?.aiDynamicInfosList.forEach(innerItem => {
      if (innerItem.index === selectedPlan.round) {
        selectedPlan.aiOn = true;
      }
    });

    const result = buildAiResultMatrix(selectedPlan?.aiResult);
    setIndexArray(result.indexMatrix || []);
    setValueMatrix(result.valueMatrix || []);
    // 切换 tab 要重置状态
    if (result.indexMatrix?.length || (0 > 0 && status !== 'complete') || status !== 'inStart') {
      setStatus('complete');
    }

    refresh();
  }, [aiServerResult, selectedPlan]);

  const fetchAiContent = async (first: boolean, taskId: string | null | undefined, reqCount: number) => {
    let sentences = hostingReWriteReqRef.current.sentenceLists;
    if (sentences?.length === 0) {
      setStatus('wordsError');
      return;
    }
    const req: HostingReWriteReq = {
      maxVersion: hostingReWriteReqRef.current.maxVersion || 20, //联系人数量
      first,
      sentenceLists: sentences,
      aiTaskId: taskId,
      languageLimit: 1,
    };
    timer.current = null;
    try {
      setStatus('inProgress');
      const res = await edmApi.generalHostingReWriteContent(req);
      const { aiTaskId: newTaskId } = res;
      clearTime();
      // 处理失败
      if (res.finishState === 2) {
        setStatus('netError');
      }
      if (res.finishState === 3) {
        setStatus('languageError');
      }
      // 处理成功
      if (res.finishState === 1) {
        setStatus('complete');
        resetPercent(100);
        resetDayLeft();
        res.aiDynamicInfosList.sort((a, b) => {
          return a.index - b.index;
        });
        setAiServerResult(res);
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

  const stratTimeAndFetch = (first: boolean, taskId: string | null | undefined, reqCount: number) => {
    // clearTime();
    timer.current = setTimeout(() => {
      fetchAiContent(first, taskId, reqCount);
    }, 10000);
  };

  const resetPercent = (percent: number) => {
    setPercent(percent);
    percentRef.current = percent;
  };

  const clearTime = () => {
    timer.current && clearTimeout(Number(timer.current));
  };

  const clearAndStopTime = () => {
    clearTime();
    timer.current = -1 as unknown as NodeJS.Timeout;
  };

  const constructAiResult = (localResult?: LocalPickResult, serverResult?: HostingReWriteDynamicInfo): AIResults => {
    let modify = new Array<AIModifyInfo>();
    serverResult?.aiDynamicInfos?.forEach(item => {
      const aiSentenceList = item.aiSentenceList?.map(i => {
        return { aiSentence: i.aiSentence, unSelected: false };
      });

      localResult?.words.forEach(innerItem => {
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
      mailContent: localResult?.text || '',
      modify: modify,
    };
    return result;
  };

  const refresh = () => {
    setRefreshKey(!refreshKey);
  };

  const needReqCurrentSelectedMultiVersion = (plan?: Plan): boolean => {
    let p = plan ? plan : selectedPlan;
    return hasAiModifyContent(p) ? false : true;
  };

  const SwitchComp = () => {
    const maxVersion = config?.hostingMaxVersion || defaultConfig.hostingMaxVersion || 0;
    return (
      <div className={style.container} style={{}}>
        <div className={style.icon}>
          <MultiVersionMailSvg />
        </div>
        <div className={style.content}>
          <div className={style.title}>
            <span>{getIn18Text('QIANYOUQIANMIAN')}</span>
            <span className={style.tag} style={{ color: '#0DC076', border: '0.5px solid #0DC076' }}>
              {getTransText('TISHENGSONGDALV')}
            </span>
          </div>
          <div className={style.info}>
            {getIn18Text('MEIFENGZUIDUOKEZAISHENG')}
            <span className={style.percent}>{maxVersion}</span>
            {getIn18Text('FENGYINGXIAOXIN')}
          </div>
        </div>
        <div className={style.switch} style={{ marginTop: '8px' }}>
          <Switch
            size="small"
            checked={isAiOn(selectedPlan)}
            disabled={false}
            onChange={value => {
              if (value === false && selectedPlan) {
                selectedPlan && setAiOn(false, selectedPlan);
              }
              if (value === true) {
                switchChanged();
              }
              refresh();
              multiStateChanged && multiStateChanged();
            }}
          />
        </div>
      </div>
    );
  };

  const getErrorInfo = () => {
    if (status === 'wordsError') {
      return <MultiVersionWordError />;
    }
    if (status === 'languageError') {
      return <div className={style.info}>抱歉，暂不支持中文邮件内容改写</div>;
    }
    return <div className={style.info}>{getTransText('SHIYONGRENSHUTAIDUOLA')}</div>;
  };

  const BodyComp = () => {
    if (status === 'inProgress') {
      return (
        <div
          className={classNames(style.progressWrapperIn, {
            [style.progressWrapperHosting]: isHostingRes,
          })}
        >
          <img style={{ marginTop: '-20px' }} src={gif} alt="" width="130" height="130" />
          <div
            className={classNames(style.percent, {
              [style.percentHosting]: isHostingRes,
            })}
          >
            {getTransText('ZHENGZAISHENGCHENGYOUJIANNEIRONG')}（{percent}%）
          </div>
          <div
            className={classNames(style.info, {
              [style.infoHosting]: isHostingRes,
            })}
          >
            {getTransText('TONGGUOXIHUARENQUNCHAYIHUAFASONG')}
          </div>
          <Progress
            className={classNames({
              [style.progressHosting]: isHostingRes,
              // [styles.infoTextEllipsis]: showCopy
            })}
            strokeColor="#4C6AFF"
            percent={percent}
            showInfo={false}
          />
        </div>
      );
    }

    if (status === 'netError' || status === 'wordsError' || status === 'languageError') {
      return (
        <div
          className={classNames(style.progressWrapper, {
            [style.progressWrapperHosting]: isHostingRes,
          })}
        >
          <img style={{ marginTop: '20px' }} src={noDataPng} alt="" width="130" height="130" />
          {/* {status === 'wordsError' ? <MultiVersionWordError /> : <div className={style.info}>{getTransText('SHIYONGRENSHUTAIDUOLA')}</div>} */}
          {getErrorInfo()}
          <Button
            type="primary"
            onClick={() => {
              generateAgain();
            }}
          >
            {getIn18Text('ZHONG SHI')}
          </Button>
        </div>
      );
    }
    return AllResultComp();
  };

  const BodyHeaderComp = () => {
    if (status !== 'inStart' && status !== 'complete') {
      return undefined;
    }
    let title = getIn18Text('YISHENGCHENGYINGXIAOXIN');
    if (indexArray.length === 0 && config) {
      title = `已生成${calcMailCount()}封营销信`;
    }

    const limitValue = quota ? `换一换(${quota?.aiContentDayLeft}/${quota?.aiContentDayLimit})` : getIn18Text('HUANYIHUAN');

    return (
      <div className={style.bodyHeader}>
        <span className={style.leftText}>{title}</span>
        <div
          className={style.button}
          onClick={() => {
            generateAgain();
          }}
        >
          <TongyongShuaXin stroke={'#4C6AFF'} />
          <span className={style.text}>{limitValue}</span>
        </div>
      </div>
    );
  };

  const AllResultComp = () => {
    if (!isAiOn(selectedPlan) || indexArray.length === 0) {
      return undefined;
    }

    const aiResult = selectedPlan?.aiResult;
    let tempContent = cloneDeep(buildMailContentWithPlaceholder(aiResult));
    if (indexArray?.length === 0) {
      tempContent = aiResult?.mailContent || '';
    }
    let maxShowCount = 20;
    let currentCount = 0;

    return (
      <div style={{ padding: '12px 16px 8x' }}>
        <div className={style.allResult}>
          {indexArray.map((combine, _) => {
            if (currentCount >= maxShowCount) {
              return undefined;
            }
            return combine.map((item, index) => {
              // 1. index 表示 原味的第几处, 对应的事  valueMatrix 的 index
              // 2. item 表示 valueMatrix 的二维数组里面的 index
              const valueMap = valueMatrix[index][item];
              if (valueMap && valueMap.placeholder && valueMap.aiSentence) {
                if (currentCount >= maxShowCount) {
                  return undefined;
                }
                currentCount += 1;

                tempContent = tempContent.replace(valueMap.placeholder, valueMap.aiSentence);
                return (
                  <div className={style.mailContentRoot}>
                    <div
                      className={style.mailContent}
                      onClick={() => {
                        setAllResultVisiable(true);
                      }}
                      dangerouslySetInnerHTML={{ __html: cloneDeep(tempContent) }}
                    ></div>
                  </div>
                );
              }
            });
          })}
        </div>
      </div>
    );
  };

  const AllResultModalComp = () => {
    if (selectedPlan.aiResult) {
      selectedPlan.aiResult.title = selectedPlan.title;
    }
    let aiResults: AIResults = selectedPlan.aiResult || ({} as AIResults);
    return (
      allResultVisiable && (
        <AllResultModal aiResults={[aiResults]} defaultTab={(selectedPlan?.round || 1) - 1} onClose={() => setAllResultVisiable(false)} visiable={allResultVisiable} />
      )
    );
  };

  const calcMailCount = () => {
    let basic = 1;
    const modifySuggests = selectedPlan?.aiResult?.modify;
    modifySuggests?.forEach(item => {
      if (!item.use) {
        return;
      }
      let selectedSentence = 0;
      item.aiSentenceList?.forEach(aiItem => {
        if (!aiItem.unSelected) {
          selectedSentence++;
        }
      });
      basic = basic * (selectedSentence + 1);
    });
    return basic;
  };

  const SummaryComp = () => {
    if (indexArray.length === 0) {
      return undefined;
    }
    if (status !== 'complete') {
      return undefined;
    }

    return (
      <div className={style.summary}>
        <div style={{ display: 'flex' }}>
          {getIn18Text('GONGSHENGCHENG')}
          <span className={style.num}>{calcMailCount()}</span>
          {getIn18Text('FENGNEIRONG')}
        </div>
        <div onClick={() => setAllResultVisiable(true)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '4px' }}>
          <span className={style.title}>{getTransText('CHAKANSUOYOUNEIRONG')}</span>
          <img className={style.icon} src={RightArrow} />
        </div>
      </div>
    );
  };

  useEffect(() => {
    return () => {
      clearAndStopTime();
    };
  }, []);

  const switchChanged = () => {
    // 只考虑当前选中的信是否需要请求
    if (needReqCurrentSelectedMultiVersion(selectedPlan)) {
      generateAgain();
      return;
    }
    setAiOn(true, selectedPlan);
    // 当前选中的信有结果, 就直接展示结果就好了
    clearAndStopTime();
  };

  return (
    <div className={style.root}>
      <div className={style.body}>
        {SwitchComp()}
        {isAiOn(selectedPlan) && indexArray.length > 0 && BodyHeaderComp()}
        {isAiOn(selectedPlan) && BodyComp()}
        {isAiOn(selectedPlan) && indexArray.length > 0 && SummaryComp()}
      </div>
      {AllResultModalComp()}
    </div>
  );
});
