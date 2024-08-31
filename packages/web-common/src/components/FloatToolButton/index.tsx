import { getIn18Text, SystemApi } from 'api';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import { navigate } from 'gatsby';
// in this source file  @reach/router navigate 会导致history跳2次, 估计有其他地方hook了navigate
import { useLocation } from '@reach/router';
import { api, apis, apiHolder, DataTrackerApi, isElectron, EdmRoleApi, EdmSendBoxApi, EdmRewardTaskStateResp } from 'api';
import { config } from 'env_def';
import { Tooltip } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { useLocalStorageState } from 'ahooks';
import { ReactComponent as OpenToolButton } from '@web-common/images/icons/float_open.svg';
import { ReactComponent as CloseToolButton } from '@web-common/images/icons/float_close.svg';
import { ReactComponent as CloseReward } from '@web-common/images/icons/close.svg';
import { ReactComponent as KnowledgeCenterIcon } from '@/images/icons/knowledge-center.svg';
import { ReactComponent as KfIcon } from '@/images/icons/kf2.svg';
import { ReactComponent as PhaseIcon } from '@/images/icons/phase.svg';
import { ReactComponent as RewardTaskIcon } from '@/images/icons/reward-task-icon.svg';
import Draggable from 'react-draggable';
import { useAppSelector } from '@web-common/state/createStore';
import { getIsSomeMenuVisbleSelector } from '@web-common/state/reducer/privilegeReducer';
import GrubProcess from '@/components/Layout/globalSearch/search/GrubProcess/GrubProcess';
import SystemTaskEntry from '@/components/Layout/TaskCenter/components/SystemTaskEntry';
import { getSystemTaskEntryProps } from '@/components/Layout/TaskCenter/utils';
// import { ReactComponent as Tas } from '@/images/images/icons/task-global-icon.svg';
import { getTransText } from '@/components/util/translate';
import { RewardTaskModalComponent } from '@web-edm/components/RewardTaskModal';
import siriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { REWARD_TASK_MODAL } from '@web-edm/components/MarketingModalList/marketingModalList';
import style from './index.module.scss';
import { translateLangMap } from '@web-mail/components/TranslateTips/errCodeMsg';
import { bus } from '@web-common/utils/bus';
import * as CONST from './const';

export const RewardAlreadyGotit = CONST.RewardAlreadyGotit;

const trackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const storageApi = api.getDataStoreApi();
const roleApi = apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const eventApi = api.getEventApi();

export type OrgConfType = {
  orgId: string;
  corpId: number;
  corpName: string;
  domain: string;
};

export const FloatToolButtons: React.FC<{
  activeKey?: string;
  // activePages?: string | string[]
}> = ({ children, activeKey }) => {
  const { hash = '' } = useLocation();
  const activeTab = hash.split('?')[0];

  if (activeKey && activeKey !== activeTab) {
    return null;
  }
  const $root = document.querySelector('#wm-float-tool-buttons .custom-buttons');
  if ($root) {
    return ReactDOM.createPortal(<>{children}</>, $root);
  }
  return null;
};

const POSITION_KEY = 'floatToolbarY';
const OPEN_BUTTON_KEY = 'floatButtonOpen';
const REWARD_TASK_RESP_CACHE = 'rewardTaskRespCache';

export const FloatButtonRoot = (props: { visible?: boolean; showGrubProcess?: boolean }) => {
  const { visible, showGrubProcess } = props;
  const [open, setOpen] = useState(false);
  const [showTask, setShowTask] = useLocalStorageState('floattoolshowTask', { defaultValue: true });
  // const [open, setOpen] = useState(() => storageApi.getSync(OPEN_BUTTON_KEY).data !== 'false');
  const draggingRef = useRef<boolean>(false);
  const location = useLocation();
  const { moduleName, moduleTypes } = useMemo(() => getSystemTaskEntryProps(location), [location]);
  const [transformY] = useState(() => storageApi.getSync(POSITION_KEY).data);
  const version = useAppSelector(state => state.privilegeReducer.version);
  const [knowledgeAlt, setKnowledgeAlt] = useLocalStorageState('FloatToolKnowledgeAlt', { defaultValue: true });
  const [alreadyCloseReward, setalreadyCloseReward] = useLocalStorageState('alreadyCloseReward', { defaultValue: false });
  const [shouldShowEntry, setShouldShowEntry] = useState<boolean>(false);
  const [rewardTaskStateResp, setRewardTaskStateResp] = useState<EdmRewardTaskStateResp>();
  const [showTip, setShowTip] = useLocalStorageState(RewardAlreadyGotit, { defaultValue: false });

  // 七鱼sdk参数
  let [orgconf, setorgconf] = useState<OrgConfType>({
    orgId: '',
    corpId: 0,
    corpName: '',
    domain: '',
  });
  const [visibleRewardTaskEntry, setVisibleRewardTaskEntry] = useState<boolean>(false);
  // const [showRewardTaskModal, setShowRewardTaskModal] = useState<boolean>(false);

  const visibleSystemTask = useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['TASK_CENTER']));

  // const handleClickKnowledge = () => {
  //   trackApi.track('waimao_knowledge_square', {
  //     action: 'floatwindow_knowledge_square',
  //   });
  //   // 重复了啊
  //   trackApi.track('waimao_floatwindow', {
  //     action: 'knowledge_square',
  //   });
  //
  //   if (knowledgeAlt) {
  //     setKnowledgeAlt(false);
  //   }
  //
  //   goKnowledgeCenter();
  // };

  const handleKf = () => {
    trackApi.track(process.env.BUILD_ISELECTRON ? 'client_customer_service' : 'web_customer_service');
    let name = '网易售后沟通X' + orgconf.corpId + orgconf.corpName + orgconf.domain;
    window.ysf('config', {
      robotId: 5390874,
      referrer: 'https://khd.waimao.office.163.com/khd',
      name: name || '网易售后沟通X3941499网易外贸测试waimao.elysys.net',
      title: '外贸通客户端',
      robotShuntSwitch: 1,
      groupid: 482281247,
      success: function () {
        // 成功回调
        console.log('succ');
        window?.ysf('open', {
          templateId: 6666111,
        });
      },
      error: function (err) {
        // 成功回调
        message.error(err);
        console.log(err);
      },
      templateId: 6666111,
      qtype: 4491460,
      hidden: 1,
    });
  };

  const handlePhase = () => {
    // 客户端底层框架useEffect有问题，非一级菜单的一级组件，如phase，helpcenter，会导致2+次hash变化，导致history记录跳2+次， 见switchPage
    let target = process.env.BUILD_ISELECTRON ? '#phase?page=phase' : '#enterpriseSetting?page=phase&showSidebar=false';
    navigate(target);
  };

  const handleClickSystemTask = () => {
    trackApi.track('waimao_floatwindow', {
      action: 'my_task',
    });
    trackApi.track('waimao_floatwindow_todo_my_task', {
      string: moduleTypes.join(','),
    });
  };

  const handleToogleFold = () => {
    if (draggingRef.current) return;

    setOpen(!open);
    storageApi.put(OPEN_BUTTON_KEY, String(!open));
    trackApi.track('waimao_floatwindow', {
      action: 'unfold_fold',
    });
  };

  const defaultPosition = useMemo(() => {
    return transformY ? { x: 0, y: Number(transformY) } : undefined;
  }, [transformY]);

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
          trackApi.track('waimao_marketing_sale_pop', { action: 'click' });
        } else {
          // 无权限、活动不可见和其他不可预知的type不显示福利活动入口
          if (data.state === -1) {
            siriusMessage.error('无权限');
          } else {
            siriusMessage.error('活动已结束');
          }
          // setShowRewardTaskModal(false);
          setVisibleRewardTaskEntry(false);
        }
      })
      .catch(error => {
        siriusMessage.error(error.message);
        // setShowRewardTaskModal(false);
      })
      .finally(() => {});
  };

  const requestRewardTaskState = () => {
    edmApi
      .getRewardTaskState()
      .then(data => {
        if (data.state === 0 || data.state === 1 || data.state === 2 || data.state === 3) {
          setRewardTaskStateResp(data);
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

  useEffect(() => {
    roleApi.showKfEntry().then(data => {
      setShouldShowEntry(data?.showHelpEntrance);
    });
    roleApi.getKfInfo().then(data => {
      setorgconf(data);
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

  useEffect(() => {
    let listener = () => clickRewardTaskEntry();

    bus.on('clickRewardTaskEntry', listener);

    return () => {
      bus.off('clickRewardTaskEntry', listener);
    };
  }, []);

  const handleCloseTask = () => {
    setShowTask(false);
    bus.emit('closeTask');
    trackApi.track('waimao_my_task_pop', { action: 'close' });
  };

  const handleCloseReward = () => {
    setalreadyCloseReward(true);
    bus.emit('closeReward');
    trackApi.track('waimao_marketing_sale_pop', { action: 'close' });
  };

  const rewardTaskEntry = () => {
    if (alreadyCloseReward) return null;

    return (
      <div className={style.rewardTask}>
        <CloseReward className={style.closeRewardTaskIcon} onClick={handleCloseReward}></CloseReward>
        <RewardTaskIcon className={style.rewardTaskIcon} onClick={clickRewardTaskEntry}></RewardTaskIcon>
      </div>
    );
  };

  // const handleClose = () => {
  //   setShowRewardTaskModal(false);
  // };

  return (
    <Draggable
      bounds="body"
      axis="y"
      cancel="#wm-float-tool-buttons .buttons"
      defaultPosition={defaultPosition}
      onDrag={() => {
        draggingRef.current = true;
      }}
      onStop={(_, data) => {
        console.log('Draggable', data);
        storageApi.put(POSITION_KEY, String(data.y));
        setTimeout(() => {
          draggingRef.current = false;
        });
      }}
    >
      {
        <div id="wm-float-tool-buttons" className={style.buttonRoot} style={{ display: visible === false ? 'none' : undefined }}>
          {visibleRewardTaskEntry && rewardTaskEntry()}
          {
            <div
              style={{
                display: showTask ? 'flex' : 'none',
              }}
              className={style.buttonsContainer}
            >
              <div className="buttons" style={!open ? { display: 'none' } : {}}>
                <div className="custom-buttons" />
                <div className={style.globalBtns}>
                  {/* <Tooltip title={getTransText('phase')} mouseEnterDelay={0.3} placement="left">
                  <div className={classnames(style.buttonWrap)} onClick={handlePhase} title={'话术库'}>
                    <PhaseIcon />
                  </div>
                </Tooltip> */}
                  {/* {visibleSystemTask && (
                  <div className={style.buttonWrap} title={getTransText('WODERENWU')} onClick={handleClickSystemTask}>
                    <SystemTaskEntry moduleName={moduleName} moduleTypes={moduleTypes} />
                  </div>
                )} */}
                  {
                    // <Tooltip title={getTransText('CHAKANWAIMAOGANHUO')} mouseEnterDelay={0.3} placement="left">
                    //   <div
                    //     className={classnames(style.buttonWrap, knowledgeAlt ? style.redFlag : '')}
                    //     onClick={handleClickKnowledge}
                    //     title={getTransText('ZHISHIGUANGCHANG')}
                    //   >
                    //     <KnowledgeCenterIcon />
                    //   </div>
                    // </Tooltip>
                  }
                </div>
              </div>
              {/* 下面这层 div 是为了避免 Tooltip 抖动 */}
              {/* <div style={{ position: 'relative' }}>
              <Tooltip
                title={getTransText('DIANJIZHANKAISHOUQIHUOTUODONG')}
                mouseEnterDelay={0.3}
                placement="left"
                getTooltipContainer={node => node.parentElement || document.body}
              >
                <div className={classnames(style.buttonWrap, style.toggleButton)} onClick={handleToogleFold}>
                  {!open ? <OpenToolButton /> : <CloseToolButton />}
                </div>
              </Tooltip>
            </div> */}
              {/* 我的任务 */}
              {visibleSystemTask && (
                <div style={{ position: 'relative' }}>
                  {
                    <div className={style.buttonWrap} title={getTransText('WODERENWU')} onClick={handleClickSystemTask}>
                      <CloseReward className={style.closeTaskIcon} onClick={handleCloseTask}></CloseReward>
                      <SystemTaskEntry moduleName={moduleName} moduleTypes={moduleTypes} />
                    </div>
                  }
                </div>
              )}
            </div>
          }

          <div className={style.otherTools}>
            {/* {shouldShowEntry && (
              <Tooltip title={getIn18Text('kfOnline')} mouseEnterDelay={0.3} placement="left">
                <div className={classnames(style.buttonWrap)} onClick={handleKf} title={'在线客服'}>
                  <KfIcon />
                </div>
              </Tooltip>
            )} */}
            {showGrubProcess && <GrubProcess className={style.buttonWrap} />}
            {/*{showRewardTaskModal && (*/}
            {/*  <RewardTaskModalComponent rewardTaskStateRespFromProp={rewardTaskStateResp} showRewardTaskModal={showRewardTaskModal} handleClose={handleClose} />*/}
            {/*)}*/}
          </div>
        </div>
      }
    </Draggable>
  );
};
