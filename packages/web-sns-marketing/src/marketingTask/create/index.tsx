import { getIn18Text } from 'api';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Steps } from 'antd';
import { api, apis, DataTrackerApi, SnsMarketingApi, SnsMarketingPost, SnsPostStatus, SnsTaskCompleteReq, SnsTaskStatus } from 'api';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import { navigate } from '@reach/router';
import classnames from 'classnames';

import style from './create.module.scss';
import { MarketingPlan } from './plan';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { PreviewCalendar } from './previewCalendar';
import { MarketingPrompt } from './prompt';
import { ReactComponent as ArrowRight } from '@web-sns-marketing/images/arrow-right.svg';
import { getSnsTaskBaseInfoSync, getSnsTaskDetailSync } from '@web-common/state/reducer/snsMarketingTaskReducer';
import { snsMarketingTaskActions } from '@web-common/state/reducer';
import { showSuccessModal } from './successModal';
import { PageLoading } from '@/components/UI/Loading';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { TongyongChenggongMian } from '@sirius/icons';
import { decodeAccountsQuery, getPostsMapFromList } from '../../utils';
import useAiQuota from '../../components/useAiQuota';
import { CheckPostModal } from './modals';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import TaskCheckModal from './TaskCheckModal';

const { Step } = Steps;
const snsMarketingApi = api.requireLogicalApi('snsMarketingApiImpl') as unknown as SnsMarketingApi;
const trackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const Circle = (props: { step: number; current: number }) => {
  return props.current > props.step ? (
    <span className={style.stepFinish}>
      <TongyongChenggongMian />
    </span>
  ) : (
    <span className={style.stepIcon} />
  );
};

export const MarketingTaskCreate = (props: { qs: Record<string, string> }) => {
  const { qs } = props;
  const [step, setStep] = useState(0);
  const appDispatch = useAppDispatch();
  const currentTask = useAppSelector(state => state.snsMarketingTaskReducer.currentTask);
  const taskStatus = useAppSelector(state => state.snsMarketingTaskReducer.currentTaskStatus);
  const loading = useAppSelector(state => state.snsMarketingTaskReducer.loadingCurrent);
  const loadingPost = useAppSelector(state => state.snsMarketingTaskReducer.currentPosts.loading);
  const hasErrorPost = useAppSelector(state => state.snsMarketingTaskReducer.currentPosts.hasError);
  const { AiQuota } = useAiQuota();

  const [savedFlag, setSavedFlag] = useState(Boolean(qs.id));

  const [loadingEnable, setLoadingEnable] = useState(false);
  const [showCheckPostModal, setShowCheckPostModal] = useState(false);

  const posts = useAppSelector(state => state.snsMarketingTaskReducer.currentPosts.posts);
  const postsRef = useRef<SnsMarketingPost[]>([]);
  postsRef.current = posts;
  const [taskCheckVisible, setTaskCheckVisible] = useState<boolean>(false);

  useEffect(() => {
    appDispatch(snsMarketingTaskActions.resetCurrent());
    if (qs.id) {
      // 获取草稿
      appDispatch(getSnsTaskDetailSync(qs.id))
        .unwrap()
        .then(detail => {
          if (qs.from === 'finish-generate-email') {
            setStep(1);
            setShowCheckPostModal(true);
          } else {
            setStep(detail.stage);
          }
        });
    } else {
      // 创建
      appDispatch(getSnsTaskBaseInfoSync());
      // 回填社媒主页
      if (qs.accounts) {
        const accounts = decodeAccountsQuery(qs.accounts);
        appDispatch(snsMarketingTaskActions.setAccounts(accounts));
      }
    }
    return () => {
      timerRef.current && clearTimeout(timerRef.current);
      appDispatch(snsMarketingTaskActions.resetCurrent());
    };
  }, []);

  const timerRef = useRef<number>();
  const checkPostAsync = (action: 'try' | 'createAll' | 'retryCreateAll' | 'retry'): Promise<SnsMarketingPost[]> => {
    appDispatch(
      snsMarketingTaskActions.setCurrentPosts({
        loading: true,
        action,
      })
    );
    return new Promise((resolve, reject) => {
      let errorCount = 0;
      function doCheck() {
        return snsMarketingApi
          .getAiTaskPosts({
            taskId: currentTask.taskId,
          })
          .then(list => {
            const postsMap = getPostsMapFromList(postsRef.current);

            appDispatch(
              snsMarketingTaskActions.setCurrentPosts({
                posts: list.map(item => ({
                  ...postsMap[item.postDbId],
                  ...item,
                })),
              })
            );
            const check = list.some(p => p.postStatus === SnsPostStatus.GENERATING);
            if (check) {
              timerRef.current = window.setTimeout(() => {
                doCheck();
              }, 3000);
            } else {
              appDispatch(
                snsMarketingTaskActions.setCurrentPosts({
                  loading: false,
                  hasError: list.some(post => post.postStatus === SnsPostStatus.FAILED_GENERATE),
                })
              );
              resolve(list);
            }
          })
          .catch(e => {
            console.error(e);

            errorCount++;
            if (errorCount > 5) {
              reject(getIn18Text('HUOQUTIEZISHIBAICI') + errorCount);
            } else {
              timerRef.current = window.setTimeout(() => {
                doCheck();
              }, 3000);
            }
          });
      }
      doCheck();
    });
  };

  useEffect(() => {
    if (!loading && taskStatus && taskStatus !== SnsTaskStatus.DRAFT) {
      checkPostAsync('createAll');
    }
  }, [loading]);

  const next = () => {
    if (step >= 2) return;

    if (step === 0) {
      if (currentTask.accounts.length === 0) {
        toast.error({ content: getIn18Text('QINGXUANZESHEMEIZHANGHAO') });
        return;
      }
      if (!currentTask.taskName) {
        toast.error({ content: getIn18Text('RENWUMINGCHENGBUNENGWEI') });
        return;
      }
      // handleSave();
    }
    setStep(step + 1);
    trackerApi.track('waimao_createtask_action', {
      type: step === 1 ? 'preview' : 'next',
    });
  };

  const prev = () => {
    if (step <= 0) return;
    setStep(step - 1);
    trackerApi.track('waimao_createtask_action', {
      type: 'prev',
    });
  };

  const handleBack = () => {
    const back = () => {
      switch (qs.from) {
        case 'snsCalendar':
          navigate('#site?page=snsCalendar');
          break;
        case 'snsAccountBinding':
          navigate('#site?page=snsAccountBinding');
          break;
        case 'brandBuilding':
          navigate('#site?page=brand');
          break;
        default:
          navigate('#site?page=snsMarketingTask');
      }
    };
    if (savedFlag) {
      // 保存过，直接保存后退出
      handleSave(true).then(() => back());
    } else {
      // 提示保存
      SiriusModal.warning({
        title: getIn18Text('YOUYIBIANJINEIRONGWEI'),
        content: getIn18Text('RUOBUBAOCUN，BENCI'),
        cancelText: getIn18Text('BUBAOCUN'),
        okText: getIn18Text('BAOCUN'),
        onCancel() {
          back();
        },
        onOk() {
          handleSave(true).then(() => back());
        },
      });
    }
  };

  const handleSave = (skipValid?: boolean) => {
    if (taskStatus !== SnsTaskStatus.DRAFT) {
      return Promise.resolve(false);
    }
    const taskToSave: Partial<SnsTaskCompleteReq> = {
      aiGeneratePostParam: currentTask.aiGeneratePostParam,
      stage: step,
      taskExecPlan: {
        accounts: currentTask.accounts,
      },
      taskId: currentTask.taskId,
      taskName: currentTask.taskName,
    };
    if (!skipValid && (!taskToSave.taskName || !currentTask.accounts || currentTask.accounts.length === 0)) {
      toast.error({ content: !taskToSave.taskName ? getIn18Text('RENWUMINGCHENGBUNENGWEI') : getIn18Text('QINGXUANZESHEMEIZHANGHAO') });
      return Promise.resolve(false);
    }
    return snsMarketingApi.saveSnsTask(taskToSave).then(() => {
      setSavedFlag(true);
      toast.success({ content: getIn18Text('BAOCUNCAOGAOCHENGGONG') });
      return true;
    });
  };

  const handleEnableTask = () => {
    setLoadingEnable(true);
    snsMarketingApi
      .enableSnsTask(currentTask.taskId)
      .then(suc => {
        showSuccessModal(currentTask.accounts.length, currentTask.plan ? currentTask.plan.postSendCount : 0);
      })
      .finally(() => {
        setLoadingEnable(false);
      });
  };

  const canStart = (taskStatus === SnsTaskStatus.FINISH_GENERATE || taskStatus === SnsTaskStatus.PAUSE) && !hasErrorPost;
  const crumbText = useMemo(() => {
    let text = getIn18Text('YINGXIAORENWU');
    if (qs?.from === 'snsCalendar') {
      text = '营销日历';
    } else if (qs.from === 'snsAccountBinding') {
      text = '账号绑定';
    } else if (qs.from === 'brandBuilding') {
      text = '我的社媒';
    }
    return text;
  }, [qs?.from]);

  return (
    <PermissionCheckPage resourceLabel="SOCIAL_MEDIA" accessLabel="VIEW+OP" menu="SOCIAL_MEDIA_CALENDAR">
      <div className={style.page} id="sns-task-create-root">
        <div className={classnames(style.pageHeader, 'sirius-no-drag')}>
          <h3>
            <div onClick={handleBack}>
              <span className={style.breadCrumb}>{crumbText}</span>
              <ArrowRight />
              {getIn18Text('CHUANGJIANYINGXIAOTUOGUANREN')}
            </div>
            <AiQuota style={{ marginLeft: 8 }} />
          </h3>
        </div>
        <div className={style.pageBody}>
          <div className={style.pageContent}>
            {loading && <PageLoading />}
            <Steps current={step} style={{ width: '681px', margin: '20px auto' }}>
              <Step title={getIn18Text('YINGXIAOFANGAN')} icon={<Circle current={step} step={0} />}></Step>
              <Step title={getIn18Text('AISHENGCHENGTIEZI')} icon={<Circle current={step} step={1} />}></Step>
              <Step title={getIn18Text('SHENGCHENGFATIERILI')} icon={<Circle current={step} step={2} />}></Step>
            </Steps>
            <div className={style.stepDetail}>
              {step === 0 && !loading && <MarketingPlan />}
              {step === 1 && !loading && <MarketingPrompt checkPostAsync={checkPostAsync} saveDraft={handleSave} />}
              {step === 2 && !loading && <PreviewCalendar />}
            </div>
          </div>
        </div>
        <div className={style.pageFooter}>
          <div style={{ flex: 1 }}></div>
          <div className={style.buttonGroups}>
            {step === 1 && <div className={style.previewTip}>{getIn18Text('YULANFATIERILIBU')}</div>}
            <Button onClick={handleBack}>{getIn18Text('CLOSE_TXT')}</Button>
            <Button
              onClick={() => {
                handleSave();
                trackerApi.track('waimao_createtask_action', {
                  type: 'save',
                });
              }}
              disabled={taskStatus !== SnsTaskStatus.DRAFT}
            >
              {getIn18Text('CUNCAOGAO')}
            </Button>
            {step !== 0 && <Button onClick={prev}>{getIn18Text('SHANGYIBU')}</Button>}
            {step === 0 && (
              <Button btnType="primary" onClick={next}>
                {getIn18Text('XIAYIBU')}
              </Button>
            )}
            {step === 1 && (
              <Button btnType="primary" onClick={next} disabled={taskStatus === SnsTaskStatus.DRAFT}>
                {getIn18Text('XIAYIBU')}
              </Button>
            )}
            {step == 2 && (
              <Button btnType="primary" onClick={() => setTaskCheckVisible(true)} disabled={loadingEnable || loadingPost || !canStart}>
                {getIn18Text('JIANCHABINGQIYONGZIDONG')}
              </Button>
            )}
          </div>
        </div>

        <CheckPostModal visible={showCheckPostModal} onOk={() => setShowCheckPostModal(false)} />
        <TaskCheckModal
          visible={taskCheckVisible}
          posts={posts}
          onFinish={() => {
            handleEnableTask();
            setTaskCheckVisible(false);
          }}
          onCancel={() => setTaskCheckVisible(false)}
        />
      </div>
    </PermissionCheckPage>
  );
};
