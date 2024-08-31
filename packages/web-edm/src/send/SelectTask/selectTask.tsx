import React, { useState, useEffect } from 'react';
import {
  apiHolder,
  apis,
  DataStoreApi,
  EdmSendBoxApi,
  MailTemplateApi,
  MarketingSuggestRes,
  AddressBookNewApi,
  SendBoxConfRes,
  PrevScene,
  DataTrackerApi,
  ProductAuthApi,
} from 'api';
import classnames from 'classnames';
import style from './selectTask.module.scss';
import { Carousel } from 'antd';
import { ReactComponent as LineIcon } from '@/images/icons/edm/yingxiao/send-email-task-line.svg';
import { ReactComponent as LittleTips } from '@/images/icons/edm/yingxiao/selectTask/select-task-little-tips.svg';
import { ReactComponent as UseGuideIcon } from '@/images/icons/edm/yingxiao/selectTask/select-task-use-guide.svg';
import { ReactComponent as QuestionIcon } from '@/images/icons/edm/yingxiao/selectTask/select-task-question.svg';
import { ReactComponent as QuestionMark } from '@/images/icons/edm/yingxiao/selectTask/select-task-question-mark.svg';
import { ReactComponent as LittleTipsFirst } from '@/images/icons/edm/yingxiao/selectTask/select-task-little-tips-first.svg';
import { ReactComponent as LittleTipsSecond } from '@/images/icons/edm/yingxiao/selectTask/select-task-little-tips-second.svg';
import { ReactComponent as LittleTipsThird } from '@/images/icons/edm/yingxiao/selectTask/select-task-little-tips-third.svg';
import { ReactComponent as ArrowIcon } from '@/images/icons/edm/yingxiao/selectTask/select-task--arrow.svg';
import { ReactComponent as BehaviorFirst } from '@/images/icons/edm/yingxiao/selectTask/select-task-behavior-first.svg';
import { ReactComponent as BehaviorSecond } from '@/images/icons/edm/yingxiao/selectTask/select-task-behavior-second.svg';
import { ReactComponent as BehaviorThird } from '@/images/icons/edm/yingxiao/selectTask/select-task-behavior-third.svg';
import { ReactComponent as BehaviorFourth } from '@/images/icons/edm/yingxiao/selectTask/select-task-behavior-fourth.svg';
import { ReactComponent as ManualMore } from '@/images/icons/edm/yingxiao/selectTask/select-task-manual-more.svg';
import { ReactComponent as ManualDeep } from '@/images/icons/edm/yingxiao/selectTask/select-task-manual-deep.svg';
import { ReactComponent as ManualSend } from '@/images/icons/edm/yingxiao/selectTask/select-task-manual-send.svg';
import { ReactComponent as ManualReply } from '@/images/icons/edm/yingxiao/selectTask/select-task-manual-reply.svg';
import { ReactComponent as BehaviorIcon } from '@/images/icons/edm/yingxiao/selectTask/select-task-behavior-icon.svg';
import RecommandTaskFourteenDaysBg from '@/images/icons/edm/yingxiao/selectTask/recommand-task-fourteen-days.png';
import RecommandTaskSevenDaysBg from '@/images/icons/edm/yingxiao/selectTask/recommand-task-seven-days.png';
import { useOpenHelpCenter } from '@web-common/utils/utils';
import { useCancelToken } from '../../fetchHook';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { edmDataTracker } from '../../tracker/tracker';
import { FloatVideo, PlayState } from '@web-common/components/UI/Video';
import { EdmOperationTask } from 'api';
import { setTemplateContent } from '../../mailTemplate/template-util';
import { navigate } from '@reach/router';
import QuotaNotifyModal from '@web-common/components/QuotaNotifyModal';
import { AiWriteMailReducer, ConfigActions, useActions } from '@web-common/state/createStore';
import { NoWorriedTips } from '../NoWorriedTips';

const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const templateApi = apiHolder.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;
const addressBookNewApi = apiHolder.api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const productApi = apiHolder.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;

interface CarouselProps {
  title: string;
  id: string;
  videoUrl: string;
}
const carouselVideos: CarouselProps[] = [
  {
    title: '如何选择适合您的邮件营销方式',
    id: 'mode',
    videoUrl: 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/11/17/952a3b5b54c54af4833bc7cad8dd5a94.mp4',
  },
];

export const SEND_MAIL_VIDEO = 'sendMailVideo';
interface SelectTaskProps {
  clickOperateTaskWithSubject?: (subject: string) => void;
  clickRecommandTaskWithKey?: (key: string) => void;
  clickSingleTask?: () => void;
  // create 是否是直接跳转到新建托管流程
  clickHostingTask?: (create: boolean) => void;
  clickCancel?: () => void;
  sendBoxConfRes: SendBoxConfRes;
  operationTasks: EdmOperationTask[];
  suggestData: MarketingSuggestRes;
}

interface SelectTaskNoCreatedTaskItemData {
  title: string;
  count: string;
  time: string;
}

interface SelectTaskNumberItemData {
  detail: string;
  icon: React.ReactElement;
}

interface SelectTaskManualTaskItemData {
  detail: string;
  icon: React.ReactElement;
}

interface ClickTaskData {
  type: 'single' | 'hosting' | 'auto' | 'operation' | 'sevenDays' | 'fourteenDays';
  isNew?: boolean;
  extraData?: EdmOperationTask | string;
}
const videoDrawerConfig = { videoId: 'V9', source: 'kehukaifa', scene: 'kehukaifa_1' };

export const SelectTaskComponent: React.FC<SelectTaskProps> = props => {
  const { clickSingleTask, clickOperateTaskWithSubject, clickRecommandTaskWithKey, clickHostingTask, clickCancel, sendBoxConfRes, operationTasks, suggestData } = props;
  const marketing0 = suggestData?.marketing0;
  const marketing1 = suggestData?.marketing1;

  const [floatVideoVisible, setFloatVideoVisible] = useState(false);
  const [floatVideoUrl, setFloatVideoUrl] = useState('');
  const [floatVideoTitle, setFloatVideoTitle] = useState('');
  const { showVideoDrawer } = useActions(ConfigActions);
  const [modalVideoVisible, setModalVideoVisible] = useState(false);
  const [showRecommandTask, setShowRecommandTask] = useState(false);
  // 是否展示创建次数弹窗
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  // 用户点击的任务类型
  const [clickTaskData, setClickTaskData] = useState<ClickTaskData>();
  const [modalVideoUrl, setModalVideoUrl] = useState('');
  const [modalVideoTitle, setModalVideoTitle] = useState('');
  const [modalVideoId, setModalVideoId] = useState('');
  const { changeAiHostingInitObj } = useActions(AiWriteMailReducer);
  const cancelToken = useCancelToken();
  const openHelpCenter = useOpenHelpCenter();

  useEffect(() => {
    const { data, suc } = dataStoreApi.getSync(SEND_MAIL_VIDEO);
    if (suc && data === 'true') {
      setFloatVideoVisible(false);
    } else {
      getSendBoxStatInfo();
    }
    const prevScene = (new URLSearchParams(location.href).get('from') as PrevScene) || 'newCreate';
    if (prevScene === 'newCreate') {
      setShowRecommandTask(true);
    }
  }, []);

  const getSendBoxStatInfo = async () => {
    const req = {};
    const config = {
      operator: cancelToken(),
    };
    try {
      const data = await edmApi.getSendBoxStatInfo(req, config);
      if (data?.sendEdmCount) {
        setFloatVideoVisible(false);
      } else {
        const res = await productApi.doGetProductVideos(videoDrawerConfig.videoId);
        if (res && res?.videoUrl) {
          setFloatVideoUrl(res.videoUrl);
          setFloatVideoTitle(res.title || '');
          setFloatVideoVisible(true);
        } else {
          setFloatVideoVisible(false);
        }
      }
    } catch (err) {
      setFloatVideoVisible(false);
    }
  };

  // visible为true弹窗展示 不执行后续逻辑
  const handleNotificationChange = (visible: boolean) => {
    if (!visible) {
      switch (clickTaskData?.type) {
        case 'single':
          clickSingleTask && clickSingleTask();
          edmDataTracker.track('pc_marketing_edm_select', {
            type: 'single',
          });
          edmDataTracker.track('pc_markting_edm_selectType', {
            type: 'single',
          });
          break;
        case 'hosting':
          if (clickTaskData?.isNew) {
            clickHostingTask && clickHostingTask(true);
          } else {
            clickHostingTask && clickHostingTask(false);
          }
          edmDataTracker.track('pc_marketing_edm_select', {
            type: 'host',
          });
          edmDataTracker.track('pc_markting_edm_selectType', {
            type: 'host',
          });
          break;
        case 'auto':
          edmDataTracker.track('pc_markting_edm_selectType', {
            type: 'autoHost',
          });
          changeAiHostingInitObj({ type: 'automatic', contacts: [], from: 'newCreate', back: '#edm?page=write', trackFrom: 'selectType' });
          navigate('#edm?page=aiHosting');
          break;
        case 'operation':
          clickOperateTask(clickTaskData?.extraData as EdmOperationTask);
          break;
        case 'sevenDays':
          clickRecommandTask(sevenDaysConditions());
          edmDataTracker.track('pc_markting_edm_selectType', {
            type: 'none',
          });
          break;
        case 'fourteenDays':
          clickRecommandTask(fourteenDaysConditions());
          edmDataTracker.track('pc_markting_edm_selectType', {
            type: 'once',
          });
          break;
        default:
          break;
      }
    }
  };

  // 点击创建任意任务之前
  const clickTaskBefore = (data: ClickTaskData) => {
    setShowNotificationModal(true);
    setClickTaskData(data);
  };

  const noCreatedTaskItemDataSource = () => {
    return [
      {
        title: '新客营销',
        count: '4轮发信',
        time: '深度营销',
      },
      {
        title: '老客转化',
        count: '3轮发信',
        time: '每周触达',
      },
      {
        title: '意向客户筛选',
        count: '2轮发信',
        time: '高效触达',
      },
      {
        title: '维系客户',
        count: '3轮发信',
        time: '长周期',
      },
    ];
  };

  const littleTipsDataSource = () => {
    const items: SelectTaskNumberItemData[] = [
      {
        detail: '每次发件任务不建议超过1000个收件人',
        icon: <LittleTipsFirst className={style.littleTipsItemNumber} />,
      },
      {
        detail: '同一个域名每周发信不建议超过5000个收件人',
        icon: <LittleTipsSecond className={style.littleTipsItemNumber} />,
      },
      {
        detail: '根据营销大数据统计，有40%以上的成交客户，都是经过2次以上发信后才收到回复建联。建议至少给收件人进行3轮以上的营销',
        icon: <LittleTipsThird className={style.littleTipsItemNumber} />,
      },
    ];
    return items;
  };

  const arriveQuestionDataSource = () => {
    return [
      '域名信誉度偏低甚至被拉黑。建议域名要完成基础配置，尽量使用常规后缀',
      '使用单一域名的发信频率不宜过高，短时间大量发信会被判定为垃圾行为',
      '单次给同一个域名的邮箱地址发信量不宜过大，如果有多个同域名的联系人，建议拆分为多个不同任务并开启安全发送',
      '邮件内容对送达效果影响很大，避免每次使用同一份邮件内容发信，不要给大量联系人一次性发相同邮件内容',
    ];
  };

  const effectQuestionDataSource = () => {
    return [
      '每个收件人都需要进行多轮营销，只进行一次发信很难有效转化。建议直接使用营销托管进行多轮营销',
      '针对送达未打开、已打开、打开未回复等不同状态的客户，可以进行针对性的再次营销',
      '每次发信要有针对性，内容和收件人要匹配，每次任务收件人不宜过多，尽量不要使用同一个任务同一个内容一次性给大量收件人发信。可以拆分为多天多次发送，或者直接使用营销托管进行自动发信',
    ];
  };

  const behaviorDataSource = () => {
    const items: SelectTaskNumberItemData[] = [
      {
        detail: '收件人包含大量错误邮箱，或经常给错误邮箱地址发信。发信前务必进行邮箱过滤，剔除无效地址',
        icon: <BehaviorFirst className={style.behaviorNumber} />,
      },
      {
        detail: '长期使用同一个域名进行大量邮件营销行为，域名很可能已经超限被拉黑',
        icon: <BehaviorSecond className={style.behaviorNumber} />,
      },
      {
        detail: '长期使用同一个模板且不修改内容进行发信，这类模板很容易命中反垃圾规则',
        icon: <BehaviorThird className={style.behaviorNumber} />,
      },
      {
        detail: '邮件内容中命中大量发垃圾关键词。请在发信前使用敏感词检查，修改邮件内容',
        icon: <BehaviorFourth className={style.behaviorNumber} />,
      },
    ];
    return items;
  };

  const clickArriveButton = () => {
    openHelpCenter('/d/1640684506989031426.html');
    edmDataTracker.track('pc_marketing_edm_select', {
      type: 'arrive',
    });
  };
  const clickOpenButton = () => {
    openHelpCenter('/d/1674041360610545665.html');
    edmDataTracker.track('pc_marketing_edm_select', {
      type: 'read',
    });
  };
  const clickBehaviorButton = () => {
    openHelpCenter('/d/1674043251663912961.html');
    edmDataTracker.track('pc_marketing_edm_select', {
      type: 'spam',
    });
  };

  const clickUseGuideVideo = () => {
    showVideoDrawer(videoDrawerConfig);
  };

  const manualTaskItemDataSource = () => {
    const items: SelectTaskManualTaskItemData[] = [
      {
        detail: '多轮营销',
        icon: <ManualMore className={style.createdTaskItemIcon} />,
      },
      {
        detail: '深度营销',
        icon: <ManualDeep className={style.createdTaskItemIcon} />,
      },
      {
        detail: '智能发信调度',
        icon: <ManualSend className={style.createdTaskItemIcon} />,
      },
      {
        detail: '回复率提升50%',
        icon: <ManualReply className={style.createdTaskItemIcon} />,
      },
    ];
    return items;
  };

  const autoPlanTaskItemDataSource = () => {
    const items: SelectTaskManualTaskItemData[] = [
      {
        detail: '智能推荐客户',
        icon: <div className={`${style.createdTaskItemIcon} ${style.selectTaskAutoAi}`} />,
      },
      {
        detail: '获客营销一体化',
        icon: <div className={`${style.createdTaskItemIcon} ${style.selectTaskAutoOverall}`} />,
      },
      {
        detail: '全自动业务员',
        icon: <div className={`${style.createdTaskItemIcon} ${style.selectTaskAutoSalesperson}`} />,
      },
    ];
    return items;
  };

  const manualTaskItemComp = (data: SelectTaskManualTaskItemData) => {
    return (
      <div className={style.createdTaskItem}>
        {data.icon}
        <span className={style.createdTaskItemDetail}>{data.detail}</span>
      </div>
    );
  };

  const manualTaskTaskItem = () => {
    return (
      <div className={style.taskItem} onClick={() => clickTaskBefore({ type: 'hosting', isNew: false })}>
        <span className={style.moreMarketingTag}>营销托管</span>
        <div className={`${style.leftImage} ${style.sendEmailMoreImage}`} />
        <div className={style.rightContent}>
          <div className={style.titleContainer}>
            <span className={style.title}>多轮发信任务</span>
            <span className={style.useTag}>推荐使用</span>
          </div>
          <span style={{ marginTop: '4px' }} className={style.detail}>
            系统自动按最佳发信方式完成多轮营销
          </span>
          <div className={style.createdTaskBottom}>
            {manualTaskItemDataSource().map(data => {
              return manualTaskItemComp(data);
            })}
          </div>
        </div>
      </div>
    );
  };

  const noManualTaskItemComp = (data: SelectTaskNoCreatedTaskItemData) => {
    return (
      <div className={style.noCreatedTaskItem}>
        <span className={style.noCreatedTaskItemTitle}>{data.title}</span>
        <LineIcon className={style.noCreatedTaskItemIcon} />
        <div className={style.noCreatedTaskItemBottom}>
          <span className={style.noCreatedTaskItemCount}>{data.count}</span>
          <span className={style.noCreatedTaskItemTime}>{data.time}</span>
        </div>
      </div>
    );
  };

  const noManualTaskTaskItem = () => {
    return (
      <div className={style.taskItem} onClick={() => clickTaskBefore({ type: 'hosting', isNew: true })}>
        <span className={style.moreMarketingTag}>营销托管</span>
        <div className={`${style.leftImage} ${style.sendEmailMoreImage}`} />
        <div className={style.rightContent}>
          <div className={style.titleContainer}>
            <span className={style.title}>多轮发信任务</span>
            <span className={style.useTag}>推荐使用</span>
          </div>
          <div className={style.detailContainer}>
            <span className={style.moreTypeDetail}>自动进行多轮营销触达</span>
            <span className={style.replayContent}>回复率提升50%</span>
          </div>
          <div className={style.noCreatedTaskBottom}>
            {noCreatedTaskItemDataSource().map(data => {
              return noManualTaskItemComp(data);
            })}
          </div>
        </div>
      </div>
    );
  };

  const isShowAutoPlanComp = () => {
    const taskId = sendBoxConfRes.hostingTaskId || '';
    // 和服务端沟通，当没有自动获客任务时，taskId为空
    if (taskId === '') {
      return true;
    }
    if (sendBoxConfRes.autoPlanCount === undefined || sendBoxConfRes.autoPlanCount === null) {
      return false;
    }
    if (sendBoxConfRes.autoPlanLimit === undefined || sendBoxConfRes.autoPlanLimit === null) {
      return false;
    }
    // 已经建的自动获客任务>=上限时不显示新建入口
    if (sendBoxConfRes.autoPlanCount >= sendBoxConfRes.autoPlanLimit) {
      return false;
    } else {
      return true;
    }
  };

  const autoPlanComp = () => {
    if (!isShowAutoPlanComp()) {
      return <></>;
    }

    return (
      <div className={style.taskItem} onClick={() => clickTaskBefore({ type: 'auto' })}>
        <div className={`${style.leftImage} ${style.sendEmailAutoImage}`} />
        <div className={style.rightContent}>
          <div className={style.titleContainer}>
            <span className={style.title}>自动获客任务</span>
          </div>
          <div style={{ marginTop: '4px' }} className={style.detail}>
            自动搜索目标客户，自动进行多轮营销
          </div>
          <div className={style.createdTaskBottom}>
            {autoPlanTaskItemDataSource().map(data => {
              return manualTaskItemComp(data);
            })}
          </div>
        </div>
      </div>
    );
  };

  const closeFloatVideo = (playState?: PlayState) => {
    if (playState) {
      const { playRate } = playState;
      trackerApi.track('unified_event_tracking_video_catalogs_rate', {
        source: videoDrawerConfig.source,
        scene: videoDrawerConfig.scene,
        mainvideo: videoDrawerConfig.videoId,
        mainvideorate: playRate,
      });
    }
    setFloatVideoVisible(false);
    dataStoreApi.put(SEND_MAIL_VIDEO, 'true');
  };

  const tipsComp = () => {
    return (
      <div className={style.tips}>
        <div className={style.useGuide}>
          <div className={style.useGuideTop}>
            <UseGuideIcon className={style.useGuideIcon} />
            <div className={style.useGuideTitle}>邮件营销使用指南</div>
          </div>
          <Carousel autoplay dotPosition="bottom" autoplaySpeed={5000}>
            {/* <div className={`${style.useGuideVideo} ${style.video0}`} onClick={clickUseGuideVideo}>
              <span className={style.useGuideVideoPlay} />
            </div> */}
            <div className={`${style.useGuideVideo} ${style.video1}`} onClick={clickUseGuideVideo}>
              <span className={style.useGuideVideoPlay} />
            </div>
          </Carousel>
        </div>
        <div className={style.littleTips}>
          <div className={style.littleTipsTop}>
            <LittleTips className={style.littleTipsIcon} />
            <div className={style.littleTipsTitle}>邮件营销小提示</div>
          </div>
          <div className={style.littleTipsBottom}>
            {littleTipsDataSource().map((data: SelectTaskNumberItemData) => {
              return (
                <div className={style.littleTipsItem}>
                  {data.icon}
                  <div className={style.littleTipsItemDetail}>{data.detail}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className={style.question}>
          <div className={style.questionTop}>
            <QuestionIcon className={style.questionIcon} />
            <div className={style.questionTitle}>为什么送达率偏低？</div>
          </div>
          <div className={style.questionContent}>
            {arriveQuestionDataSource().map(detail => {
              return (
                <div className={style.questionContentItem}>
                  <QuestionMark className={style.questionContentItemMark} />
                  {detail}
                </div>
              );
            })}
          </div>
          <div className={style.openContainer} onClick={clickArriveButton}>
            <span className={style.openContainerTitle}>提升送达率技巧</span>
            <ArrowIcon className={style.openContainerIcon} />
          </div>
        </div>
        <div className={style.question}>
          <div className={style.questionTop}>
            <QuestionIcon className={style.questionIcon} />
            <div className={style.questionTitle}>怎么发信效果更好？</div>
          </div>
          <div className={style.questionContent}>
            {effectQuestionDataSource().map(detail => {
              return (
                <div className={style.questionContentItem}>
                  <QuestionMark className={style.questionContentItemMark} />
                  {detail}
                </div>
              );
            })}
          </div>
          <div className={style.openContainer} onClick={clickOpenButton}>
            <span className={style.openContainerTitle}>提升打开率技巧</span>
            <ArrowIcon className={style.openContainerIcon} />
          </div>
        </div>
        <div className={style.behavior}>
          <div className={style.behaviorTitleContainer}>
            <BehaviorIcon className={style.behaviorIcon} />
            <span className={style.behaviorTitle}>这些行为可能会影响你的营销效果</span>
          </div>
          <div className={style.behaviorBottom}>
            {behaviorDataSource().map((data: SelectTaskNumberItemData) => {
              return (
                <div className={style.behaviorItem}>
                  {data.icon}
                  <div className={style.behaviorDetail}>{data.detail}</div>
                </div>
              );
            })}
          </div>
          <div className={style.openContainer} onClick={clickBehaviorButton}>
            <span className={style.openContainerTitle}>躲避垃圾邮件过滤技巧</span>
            <ArrowIcon className={style.openContainerIcon} />
          </div>
        </div>
      </div>
    );
  };

  const operateTaskComp = () => {
    return operationTasks.map(task => {
      return (
        <div className={style.operateTaskItem} onClick={() => clickTaskBefore({ type: 'operation', extraData: task })}>
          <div className={style.operateTaskItemTag}>
            <span className={style.operateTaskItemTagTitle}>{task.superscript}</span>
          </div>
          <img style={{ width: '221px', height: '99px', border: '2px solid #ffffff', borderRadius: '4px' }} src={task.iconUrl} alt="" />
          <span className={style.operateTaskItemSubject}>{task.subject}</span>
          <span className={style.operateTaskItemDesc}>{task.desc}</span>
          <div className={style.operateTaskItemLabelContent}>
            {task.labels?.map(label => {
              return (
                <div className={style.operateTaskItemLabel}>
                  <img src={label.iconUrl} className={style.operateTaskItemLabelIcon} alt="" />
                  <span className={style.operateTaskItemLabelDesc}>{label.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  const clickOperateTask = (task: EdmOperationTask) => {
    if (!task.templateId?.length) {
      return;
    }
    templateApi.doGetMailTemplateDetail({ templateId: task.templateId || '' }).then(res => {
      if (res.success && res.data) {
        edmDataTracker.track('pc_markting_edm_selectType', {
          type: 'holiday',
        });

        setTemplateContent(res.data.content, res.data.templateId);
        clickOperateTaskWithSubject && clickOperateTaskWithSubject(task.emailSubject || '');
      }
    });
  };

  const clickRecommandTask = async (conditions: string) => {
    try {
      const parseAfterConditions = JSON.parse(conditions);
      const params = {
        groupedFilter: parseAfterConditions,
      };
      const res = await addressBookNewApi.getMarktingFiltedEmails(params);
      if (res.length) {
        const filterRes = res.map(item => {
          return {
            contactEmail: item.email,
            contactName: item.contact_name,
            sourceName: item.source_name,
            increaseSourceName: '推荐方案',
          };
        });
        localStorage.setItem('customerMarketingEmails', JSON.stringify(filterRes));
        clickRecommandTaskWithKey && clickRecommandTaskWithKey('customerMarketingEmails');
      }
    } catch {}
  };

  const sevenDaysCount = () => {
    if (!marketing0?.full.length) {
      return 0;
    }

    let count = 0;
    marketing0.full.forEach(item => {
      if (item.statsType === 1) {
        count = item.count;
      }
    });
    return count;
  };

  const fourteenDaysCount = () => {
    if (!marketing1?.full.length) {
      return 0;
    }

    let count = 0;
    marketing1.full.forEach(item => {
      if (item.statsType === 2) {
        count = item.count;
      }
    });
    return count;
  };

  const sevenDaysConditions = () => {
    if (!marketing0?.full.length) {
      return '';
    }

    let conditions = '';
    marketing0.full.forEach(item => {
      if (item.statsType === 1) {
        conditions = item.conditions;
      }
    });
    return conditions;
  };

  const fourteenDaysConditions = () => {
    if (!marketing1?.full.length) {
      return '';
    }

    let conditions = '';
    marketing1.full.forEach(item => {
      if (item.statsType === 2) {
        conditions = item.conditions;
      }
    });
    return conditions;
  };

  const sevenDaysTaskComp = () => {
    return (
      <div className={style.operateTaskItem} onClick={() => clickTaskBefore({ type: 'sevenDays' })}>
        <div className={style.operateTaskItemTag} style={{ backgroundColor: '#FFF3E2' }}>
          <span className={style.operateTaskItemTagTitle} style={{ color: '#CC913D' }}>
            营销建议
          </span>
        </div>
        <img src={RecommandTaskSevenDaysBg} className={style.operateTaskItemImage} alt="" />
        <span className={style.operateTaskItemSubject}>最近7天添加未营销联系人</span>
        <span className={style.operateTaskItemDesc}>共有{sevenDaysCount()}个最近添加的联系人未营销，建议尽快发起营销进行触达</span>
      </div>
    );
  };

  const fourteenDaysTaskComp = () => {
    return (
      <div className={style.operateTaskItem} onClick={() => clickTaskBefore({ type: 'fourteenDays' })}>
        <div className={style.operateTaskItemTag} style={{ backgroundColor: '#FFF3E2' }}>
          <span className={style.operateTaskItemTagTitle} style={{ color: '#CC913D' }}>
            营销建议
          </span>
        </div>
        <img src={RecommandTaskFourteenDaysBg} className={style.operateTaskItemImage} alt="" />
        <span className={style.operateTaskItemSubject}>最近14天送达仅营销过1次联系人</span>
        <span className={style.operateTaskItemDesc}>共有{fourteenDaysCount()}个最近14天送达的联系人仅营销过1次，建议趁热打铁进行跟进营销</span>
      </div>
    );
  };

  const recommendTaskComp = () => {
    if (!showRecommandTask) {
      return <></>;
    }
    if (operationTasks.length === 0 && sevenDaysCount() === 0 && fourteenDaysCount() === 0) {
      return <></>;
    }

    return (
      <div className={style.recommandTask}>
        <span className={style.recommandTaskTitle}>推荐方案</span>
        <div className={style.recommandTaskContent}>
          {operationTasks.length ? operateTaskComp() : <></>}
          {sevenDaysCount() !== 0 ? sevenDaysTaskComp() : <></>}
          {fourteenDaysCount() !== 0 ? fourteenDaysTaskComp() : <></>}
        </div>
      </div>
    );
  };

  return (
    <div className={style.wrap}>
      <div className={style.top}>
        <div className={style.task}>
          <div className={style.defaultTask}>
            <span className={style.defaultTaskTitle}>默认方案</span>
            <div className={style.taskWrap}>
              <div className={style.taskItem} onClick={() => clickTaskBefore({ type: 'single' })}>
                <div className={`${style.leftImage} ${style.sendEmailNormalImage}`} />
                <div className={style.rightContent}>
                  <div className={style.titleContainer}>
                    <span className={style.title}>单次发信任务</span>
                  </div>
                  <span style={{ marginTop: '4px' }} className={style.detail}>
                    手动进行单次营销信发送，适用于少量精准收件人营销
                  </span>
                </div>
              </div>
              <NoWorriedTips formSelectPage />
            </div>
            {sendBoxConfRes.manualPlan === 1 ? manualTaskTaskItem() : noManualTaskTaskItem()}
            {autoPlanComp()}
          </div>
          {recommendTaskComp()}
        </div>
        {tipsComp()}
      </div>
      <div className={style.wrapBottom}>
        <Button
          className={style.cancel}
          size="mini"
          btnType={'minorLine'}
          onClick={() => {
            clickCancel && clickCancel();
          }}
        >
          取消
        </Button>
      </div>
      <FloatVideo
        url={floatVideoUrl}
        title={floatVideoTitle}
        visible={floatVideoVisible}
        hiddenClassName="selectTaskHidden"
        onClose={closeFloatVideo}
        fullScreenConfig={videoDrawerConfig}
      />
      {showNotificationModal && <QuotaNotifyModal type="createTask" onVisibleChange={handleNotificationChange} handleCancel={() => setShowNotificationModal(false)} />}
    </div>
  );
};
