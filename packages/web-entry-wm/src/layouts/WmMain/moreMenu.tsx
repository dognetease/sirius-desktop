import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import style from './moreMenu.module.scss';
import { ReactComponent as TaskIcon } from '@web-common/images/icons/task.svg';
import { ReactComponent as KnowCenterIcon } from '@web-common/images/icons/knowCenter.svg';
import { ReactComponent as FudaiIcon } from '@web-common/images/icons/fudai.svg';
import { ReactComponent as NoviceTaskIcon } from '@web-common/images/icons/noviceTask.svg';
import aiIcon from '@web-common/images/icons/aidrawnormal.png';
import { useAppSelector } from '@web-common/state/createStore';
import { EdmRoleApi, apiHolder, apis, api, DataTrackerApi } from 'api';
import { getIsSomeMenuVisbleSelector } from '@web-common/state/reducer/privilegeReducer';
import { getSystemTaskEntryProps } from '@/components/Layout/TaskCenter/utils';
import { useLocation, navigate } from '@reach/router';
import SystemTaskEntry from '@/components/Layout/TaskCenter/components/SystemTaskEntry';
import { AIFloatButton } from '@web-common/components/AIFloatButton';
import { edmApi } from '@/components/Layout/globalSearch/constants';
import { REWARD_TASK_MODAL } from '@web-edm/components/MarketingModalList/marketingModalList';
import { eventApi } from '@web-unitable-crm/api';
import siriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { bus } from '@web-common/utils/bus';
import { Badge } from 'antd';
import { useOpenHelpCenter } from '@web-common/utils/utils';

const roleApi = apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
const storageApi = api.getDataStoreApi();
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const REWARD_TASK_RESP_CACHE = 'rewardTaskRespCache';

export const MoreMenu = () => {
  const version = useAppSelector(state => state.privilegeReducer.version);
  const [shouldShowBtn, setShouldShowBtn] = useState(false);
  const [openTask, setopenTask] = useState(false);
  const [openAiMaster, setopenAiMaster] = useState(false);
  const location = useLocation();
  const { moduleName, moduleTypes } = useMemo(() => getSystemTaskEntryProps(location), [location]);
  const visibleSystemTask = useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['TASK_CENTER']));
  const [visibleRewardTaskEntry, setVisibleRewardTaskEntry] = useState<boolean>(false);
  // const [taskCount, setTaskCount] = useState<number>(0);
  const { taskCount } = useAppSelector(state => state.taskReducer);
  const openHelpCenter = useOpenHelpCenter();

  useEffect(() => {
    // 是否在白名单，仅白名单用户展示按钮
    roleApi.aiFloatEntrance().then(res => {
      setShouldShowBtn(res?.showAIAssistance || false);
    });

    const stateResp = storageApi.getSync(REWARD_TASK_RESP_CACHE)?.data;
    if (stateResp) {
      const data = JSON.parse(stateResp);
      // 活动进度4：代表活动不可见直接return
      if (data.state === 4) {
        return;
      } else {
        requestRewardTaskState();
      }
    } else {
      requestRewardTaskState();
    }
  }, []);

  const listener = useCallback((num: number) => {
    // setTaskCount(num);
  }, []);

  useEffect(() => {
    bus.on('taskCount', listener);

    return () => {
      bus.off('taskCount', listener);
    };
  }, []);

  const clickRewardTaskEntry = () => {
    edmApi
      .getRewardTaskState()
      .then(data => {
        if ([0, 1, 2, 3].includes(data.state)) {
          // setRewardTaskStateResp(data);
          // 发事件
          eventApi.sendSysEvent({
            eventName: 'displayMarketingModal',
            eventData: { modalKey: REWARD_TASK_MODAL },
          });
        } else {
          // 无权限、活动不可见和其他不可预知的type不显示福利活动入口
          if (data.state === -1) {
            siriusMessage.error('无权限');
          } else {
            siriusMessage.error('活动已结束');
          }
          setVisibleRewardTaskEntry(false);
        }
      })
      .catch(error => {
        siriusMessage.error(error.message);
      })
      .finally(() => {});
  };

  const requestRewardTaskState = () => {
    edmApi
      .getRewardTaskState()
      .then(data => {
        if (data.state === 0 || data.state === 1 || data.state === 2 || data.state === 3) {
          // setRewardTaskStateResp(data);
          setVisibleRewardTaskEntry(true);
        } else {
          // 无权限 或 活动不可见 或 其他不可预知的type不显示福利活动入口
          setVisibleRewardTaskEntry(false);
        }
      })
      .catch(() => {
        setVisibleRewardTaskEntry(false);
      })
      .finally(() => {});
  };

  let items = [
    {
      icon: <TaskIcon />,
      tag: '',
      title: '我的任务',
      visible: visibleSystemTask,
      unreadNum: taskCount,
      click: () => {
        trackApi.track('waimao_more', { action: 'my_task' });
        bus.emit('openTask');
      },
    },
    {
      icon: <KnowCenterIcon />,
      title: '知识广场',
      tag: '',
      visible: !['FREE', 'FASTMAIL_EXPIRED'].includes(version), // 过期版体验版不让看
      unreadNum: 0,
      click: () => {
        trackApi.track('waimao_more', { action: 'knowledge_square' });
        openHelpCenter();
        // const targetUrl = location.host === 'waimao.cowork.netease.com' ? 'https://waimao.cowork.netease.com/helpCenter' : 'https://waimao.163.com/knowledgeCenter';
        // window.open(targetUrl, '_blank');
      },
    },
    {
      icon: <img src={aiIcon} height={28} width={28} alt="ai" />,
      tag: '',
      title: '网易AI出海大师',
      visible: version !== 'WEBSITE' && shouldShowBtn,
      unreadNum: 0,
      click: () => {
        trackApi.track('waimao_more', { action: 'AI' });
        bus.emit('aimaster');
      },
    },
    {
      icon: <FudaiIcon />,
      tag: '',
      title: '免费送营销封数',
      visible: visibleRewardTaskEntry,
      unreadNum: 0,
      click: () => {
        trackApi.track('waimao_more', { action: 'marketing_sale' });
        bus.emit('clickRewardTaskEntry');

        // clickRewardTaskEntry();
      },
    },
    {
      icon: <NoviceTaskIcon />,
      tag: '',
      title: '新手任务',
      visible: true,
      unreadNum: 0,
      click: () => {
        trackApi.track('waimao_more', { action: 'novice_task' });
        navigate('#noviceTask?page=noviceTask');
      },
    },
  ];

  return (
    <>
      <div className={style.container}>
        {items
          .filter(t => t.visible)
          .map(e => {
            return (
              <div className={style.card} onClick={e.click}>
                <div className={style.icon}>{e.icon}</div>
                <div className={style.title}>
                  {e.title}
                  {/* {!!e.unreadNum && <Badge count={e.unreadNum} overflowCount={99} size="small" />} */}
                  {!!e.unreadNum && <span className={style.dotShow}>{e.unreadNum > 99 ? '99+' : e.unreadNum}</span>}
                </div>
              </div>
            );
          })}
        {version !== 'WEBSITE' && <AIFloatButton showIcon={false} />}
        {/* <c moduleName={moduleName} moduleTypes={moduleTypes} showIcon={false} /> */}
      </div>
    </>
  );
};
