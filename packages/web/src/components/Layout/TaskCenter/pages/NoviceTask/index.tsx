import React, { useEffect, useState } from 'react';
import { apiHolder, apis, TaskCenterApi, NoviceTask, NoviceTaskStatus, NoviceTaskTeamStatsRes, DataTrackerApi } from 'api';
import { SiriusPageProps } from '@/components/Layout/model';
import { useLocation } from '@reach/router';
import VideoModal, { VideoModalProps } from '@/components/Layout/Worktable/components/VideoModal/VideoModal';
import { useAppSelector } from '@web-common/state/createStore';
import Button from '@lingxi-common-component/sirius-ui/Button';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import AiMarketingEnter from '@web-edm/components/AiMarketingEnter/aiMarketingEnter';
import AwardRulesModal from './AwardRulesModal';
import TeamStatsModal from './TeamStatsModal';
import { getTransText } from '@/components/util/translate';
import { Timeline } from 'antd';
import IconSuccess from '@/components/UI/Icons/svgs/Success';
import IconTodo from '@/components/UI/Icons/svgs/Todo';
import IconDone from '@/components/UI/Icons/svgs/Done';
import IconBook from '@/components/UI/Icons/svgs/Book';
import IconVideo from '@/components/UI/Icons/svgs/Video';
import { useOpenHelpCenter } from '@web-common/utils/utils';
import style from './index.module.scss';

const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const taskCenterApi = apiHolder.api.requireLogicalApi(apis.taskCenterApiImpl) as unknown as TaskCenterApi;

interface NoviceTaskProps extends SiriusPageProps {}

const NoviceTask: React.FC<NoviceTaskProps> = props => {
  const location = useLocation();
  const openHelpCenter = useOpenHelpCenter();
  const [data, setData] = useState<NoviceTask[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [finishedCount, setFinishedCount] = useState<number>(0);
  const [rulesVisible, setRulesVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsSubmitting, setStatsSubmitting] = useState(false);
  const [tasks, setTasks] = useState<{ taskId: string; taskName: string }[]>([]);
  const [stats, setStats] = useState<NoviceTaskTeamStatsRes>({
    finishedCount: '',
    totalCount: '',
    teamTaskInfo: [],
  });
  const [videoModalParams, setVideoModalParams] = useState<VideoModalProps | null>(null);
  // const isAdmin = useAppSelector(state => state.privilegeReducer.roles.some(role => role.roleType === 'ADMIN'));
  const isAdmin = false; // 0415 隐藏新手任务团队统计

  const handleNoviceTaskFetch = () => {
    return taskCenterApi.getNoviceTasks().then(res => {
      setData(res.taskList);
      setTotalCount(res.totalCount);
      setFinishedCount(res.finishedCount);
    });
  };

  const handleTeamStatsFetch = () => {
    setStatsLoading(true);

    const fetchTasks = taskCenterApi.getNoviceTaskTeamTasks();
    const fetchStats = taskCenterApi.getNoviceTaskTeamStats();

    Promise.all([fetchTasks, fetchStats])
      .then(([nextTasks, nextStats]) => {
        setTasks(nextTasks);
        setStats(nextStats);
      })
      .finally(() => {
        setStatsLoading(false);
      });
  };

  const handleNoviceTaskVideoClick = (task: NoviceTask) => {
    setVideoModalParams({
      show: true,
      videoUrl: task.videoUrl,
      posterUrl: task.videoCoverUrl,
      videoParam: {
        mediaId: '',
        mediaName: '',
      },
    });
    trackApi.track('waimao_newusertask_operation', {
      action: `任务名=${task.taskName}&视频名=${task.videoTitle}`,
    });
  };

  const handleTeamStatsSubmit = () => {
    setStatsSubmitting(true);

    taskCenterApi
      .getNoviceTaskExternUrl()
      .then(data => {
        const { claimCouponUrl } = data;

        if (claimCouponUrl) {
          window.open(claimCouponUrl, '_blank');
        } else {
          Message.error(getTransText('WEIHUOQUDAOLINGQULIANJIE'));
        }
      })
      .finally(() => {
        setStatsSubmitting(false);
      });
  };

  const handleOpenHelpCenter = () => {
    openHelpCenter('/c/1600742350798307329.html');
  };

  useEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];

    if (moduleName === 'noviceTask') {
      handleNoviceTaskFetch();
    }
  }, [location.hash]);

  return (
    <div className={style.noviceTask}>
      <div className={style.container}>
        <div className={style.banner}>
          <div className={style.bannerContainer}>
            <div className={style.content}>
              <div className={style.bannerTitle}>{getTransText('KAISHISHIYONGWAIMAOTONG')} 🎉</div>
              <div className={style.bannerContent}>我们准备了新手任务和讲解，可以帮助您快速上手外贸通的功能，提升获客营销管理效率。</div>
            </div>
            <div className={style.bannerImg}></div>
          </div>
        </div>
        <div className={style.body}>
          <div className={style.content}>
            <div className={style.title}>
              {`${getTransText('XINSHOURENWU')} (${finishedCount}/${totalCount})`}
              <span className={style.knowledge} onClick={handleOpenHelpCenter}>
                <IconBook />
                <span>知识广场-新人上手</span>
              </span>
            </div>
            {isAdmin && (
              <div className={style.notice}>
                <div className={style.label}>
                  <span>HOT</span>
                </div>
                <div className={style.description}>
                  {getTransText('QIYESUOYOUYONGHUWANCHENGRENWUKEHUODE')}
                  <span className={style.highlight}>{` 500${getTransText('YUAN')} `}</span>
                  {getTransText('YOUHUIQUAN')}
                </div>
                <div className={style.rules} onClick={() => setRulesVisible(true)}>
                  {getTransText('HUODONGGUIZE')}
                </div>
                <Button
                  className={style.stats}
                  btnType="primary"
                  onClick={() => {
                    setStatsVisible(true);
                    handleTeamStatsFetch();
                  }}
                >
                  {getTransText('TUANDUIRENWUWANCHENGJINDU')}
                </Button>
              </div>
            )}
            <div className={style.tasks}>
              <Timeline>
                {data.map(task => (
                  <Timeline.Item key={task.id} dot={task.taskStatus === NoviceTaskStatus.COMPLETE ? <IconDone /> : <IconTodo />}>
                    <div className={style.task}>
                      <div className={style.taskBody}>
                        <div className={style.taskTitle}>{task.taskName}</div>
                        <div className={style.taskContent}>{task.taskContent}</div>
                        <div className={style.videoTitle} onClick={() => handleNoviceTaskVideoClick(task)}>
                          <IconVideo />
                          <span>{task.videoTitle}</span>
                        </div>
                      </div>
                      <div className={style.taskOption}>
                        {task.taskStatus === NoviceTaskStatus.COMPLETE && (
                          <div className={style.taskStatus}>
                            <IconSuccess />
                            <span className={style.taskStatusText}>{getTransText('YIWANCHENG')}</span>
                          </div>
                        )}
                        {/*task.taskStatus !== NoviceTaskStatus.COMPLETE && task.taskType === 'SEND_EDM_AI_HOSTING' && (
                          // 新手任务营销托管入口特殊处理，由于此方案未必100%适合，所以click事件处理不和其他Button事件合并到一起了
                          <AiMarketingEnter
                            btnType="primary"
                            handleType="create"
                            text={task.operateBtnText}
                            afterClick={() => {
                              taskCenterApi.handleNoviceTask(task);
                              trackApi.track('waimao_newusertask_operation', {
                                action: `任务名=${task.taskName}&按钮名=${task.operateBtnText}`,
                              });
                            }}
                            trackFrom="newUser"
                          />
                        )*/}
                        {task.taskStatus !== NoviceTaskStatus.COMPLETE && (
                          <Button
                            btnType="primary"
                            onClick={() => {
                              taskCenterApi.handleNoviceTask(task);
                              trackApi.track('waimao_newusertask_operation', {
                                action: `任务名=${task.taskName}&按钮名=${task.operateBtnText}`,
                              });
                            }}
                          >
                            {task.operateBtnText || getTransText('QUCHULI')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </div>
        </div>
      </div>
      <AwardRulesModal visible={rulesVisible} taskCount={data.length} onCancel={() => setRulesVisible(false)} />
      {videoModalParams && <VideoModal {...videoModalParams} handleCancel={() => setVideoModalParams(null)} />}
      <TeamStatsModal
        visible={statsVisible}
        loading={statsLoading}
        submitting={statsSubmitting}
        tasks={tasks}
        stats={stats}
        onOk={handleTeamStatsSubmit}
        onCancel={() => setStatsVisible(false)}
      />
    </div>
  );
};

export default NoviceTask;
