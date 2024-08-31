/**
 * 营销弹窗统一管理文件
 * 不与页面内逻辑耦合的弹窗，统一放置在这里，进行优先级顺序展示
 */
import React, { useState, useEffect, useRef } from 'react';
import qs from 'querystring';
import { api, EdmSendBoxApi, apiHolder, apis, EdmRewardTaskStateResp, RewardTaskPopupInfoRes, MarketingSuggestRes } from 'api';
import { usePermissionCheck } from '@/components/UI/PrivilegeEnhance';
import { AiWriteMailReducer, useActions } from '@web-common/state/createStore';
import { AiMarketingEnterModel } from '../AutoMarketingEnter/autoMarketingEnter';
// 需求pm及fe
// 促续费弹窗 @陈镇威 @徐林
import { RewardTaskModalComponent } from '../RewardTaskModal';
// 促活弹窗 @高鹏飞 @张宾
import { MarketingWeeklyTask } from '../../send/MarketingWeeklyTask/index';
// 营销托管弹窗 @彭冠嵩 @张彬彬
// import { AihostingModal } from '../AihostingModal';
// 自动获客弹窗 @彭冠嵩 @徐林
import { AiAutoAcquisitionModal } from '../AiAutoAcquisitionModal';
// 促发信弹窗 @彭冠嵩 @张青松
import { MarketingSuggestModal, MARKETING_SUGGEST_MODAL } from '../MarketingSuggestModal/marketingSuggestModal';

const systemApi = apiHolder.api.getSystemApi();
const eventApi = api.getEventApi();
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const storeApi = apiHolder.api.getDataStoreApi();

export const REWARD_TASK_MODAL = 'RewardTaskModal';
export const WEEKLY_TASK_MODAL = 'WeeklyTaskModal';
// export const AI_HOSTING_MODAL = 'AiHostingModal';
export const AI_AUTO_ACQUISITION_MODAL = 'AiAutoAcquisitionModal';
export const SUGGEST_MODAL = 'SuggestModal';

const REWARD_TASK_RESP_CACHE = 'rewardTaskRespCache';
const REWARD_TASK_NOT_JOIN_MODAL = 'rewardTaskNotJoinModal';
const REWARD_TASK_JOINED_MODAL = 'rewardTaskJoinedModal';

// 弹窗展示位置：营销托管首页、任务列表、邮箱预热、营销联系人、数据统计、邮件模板、草稿列表、自动化营销、多域名营销（已下线）
const ShowModalPages = ['aiHosting', 'index', 'warmup', 'addressBookIndex', 'contact', 'mailTemplate', 'drafts', 'autoMarketTask', 'senderRotateList'];

// const AIHOSTING_MODAL = 'AIHOSTING_MODAL';
const AIAUTOACQUISITION_MODAL = 'AIAUTOACQUISITION_MODAL';

export interface ModalItem {
  key: string;
  condition: () => boolean;
  render: () => React.ReactNode;
  delay?: number;
}

// 促活弹窗逻辑
const getCurPageByUrl = () => {
  const params = qs.parse(location.hash.split('?')[1]);
  return params.page as string;
};

// 弹窗列表总数组 用于保存所有弹窗数据 按优先级顺序
const modalKeyList = [REWARD_TASK_MODAL, WEEKLY_TASK_MODAL, AI_AUTO_ACQUISITION_MODAL, SUGGEST_MODAL];
// 弹窗列表clone数组 用于队列操作 按优先级顺序
let cloneModalKeyList = [...modalKeyList];

export const MarketingModalList = () => {
  const { changeAiHostingInitObj } = useActions(AiWriteMailReducer);
  // 当前路由，默认为首页【营销联系人】
  const curPage = getCurPageByUrl() || 'addressBookIndex';
  // 所有弹窗接口数据
  const modalDataListRef = useRef<Record<string, any>>();
  // 权限相关
  const hasEdmPermission = usePermissionCheck('VIEW', 'EDM', 'EDM_SENDBOX');
  // 促续费弹窗数据
  const [rewardTaskStateResp, setRewardTaskStateResp] = useState<EdmRewardTaskStateResp>();
  // 促活弹窗数据
  const [weeklyData, setWeeklyData] = useState<RewardTaskPopupInfoRes>({} as RewardTaskPopupInfoRes);
  // 自动获客弹窗数据
  const [autoData, setAutoData] = useState<AiMarketingEnterModel>({} as AiMarketingEnterModel);
  // 促发信数据
  const [suggestData, setSuggestData] = useState<MarketingSuggestRes>({} as MarketingSuggestRes);
  // 指定的展示弹窗的key 用于接收各个位置的通知以展示某个弹窗
  const modalKeyRef = useRef();
  const [currentModalKey, setCurrentModalKey] = useState<string>('');

  // （这个比较复杂单拿出来一个方法）
  // 促续费弹窗逻辑
  const whetherShowRewardTaskModal = (data: EdmRewardTaskStateResp) => {
    const modalKey = modalKeyRef.current;
    if (modalKey === REWARD_TASK_MODAL) {
      setRewardTaskStateResp(data);
      return true;
    }
    if (data.state !== -1) {
      storeApi.putSync(REWARD_TASK_RESP_CACHE, JSON.stringify(data));
    }
    const displayedNotJoinModal = storeApi.getSync(REWARD_TASK_NOT_JOIN_MODAL)?.data;
    const displayedJoinedModal = storeApi.getSync(REWARD_TASK_JOINED_MODAL)?.data;
    if (data.state === 0 && displayedNotJoinModal !== 'true') {
      // 活动进度是未领取且未展示过说明弹窗，显示弹窗Modal
      storeApi.putSync(REWARD_TASK_NOT_JOIN_MODAL, 'true');
      setRewardTaskStateResp(data);
      return true;
    } else if (data.state === 3 && displayedJoinedModal !== 'true') {
      // 活动进度是已领取且未展示过恭喜弹窗，显示弹窗Modal
      storeApi.putSync(REWARD_TASK_JOINED_MODAL, 'true');
      setRewardTaskStateResp(data);
      return true;
    } else {
      // 活动进度是无权限、不可见或其他活动进度不显示福利Modal
      return false;
    }
  };

  // 关闭当前弹窗
  const closeCurrentModal = (jumpOut?: boolean) => {
    setCurrentModalKey('');
    // 两种情况不继续展示后续弹窗：
    // 1.弹窗内操作页面跳出可展示弹窗的路由页面，例如营销建议弹窗内点击跳转到了营销联系人页面
    // 2.modalKey存在即此弹窗展示为用户手动触发，例如任务列表页面用户点击营销建议
    // 20231206由原来的按优先级依次展示改为每次只展示一个
    // if (!jumpOut && !modalKeyRef.current) {
    //   addModalToQueue();
    // }
    modalKeyRef.current = undefined;
  };

  const judgeDisplayCurrentModal = (currentKey: string) => {
    const data = modalDataListRef.current || [];
    const modalKey = modalKeyRef.current;
    if (!data.length) {
      return false;
    }
    const routerWord = systemApi.isWebWmEntry() ? '#intelliMarketing' : '#edm';
    const isDisplayModule = location.hash?.includes(routerWord) && ShowModalPages.includes(curPage);
    switch (currentKey) {
      case REWARD_TASK_MODAL:
        const rewardData = data[0];
        if (!rewardData) {
          return false;
        }
        // 有数据且非展示模块页面，不主动弹窗但是数据要写入
        if (modalKey !== REWARD_TASK_MODAL && !isDisplayModule) {
          setRewardTaskStateResp(rewardData);
          return false;
        }
        return whetherShowRewardTaskModal(rewardData);
      case WEEKLY_TASK_MODAL:
        const weeklyData = data[1];
        if (weeklyData?.needPopup === 1) {
          setWeeklyData(weeklyData);
          return true;
        }
        return false;
      // case AI_HOSTING_MODAL:
      // 1206版本产品需求下掉了营销托管弹窗
      // return false;
      // const hostingData1 = data[2];
      // const hostingData2 = data[3];
      // if (!hostingData1 && !hostingData2) {
      //   return false;
      // }
      // return (!hostingData1 || hostingData1.hasEdmRecord) && hostingData2?.edmHostingState === 0;
      case AI_AUTO_ACQUISITION_MODAL:
        const autoAcquisitionData = data[2];
        if (!autoAcquisitionData) {
          return false;
        }
        const taskId = autoAcquisitionData.hostingTaskId || '';
        const autoPlanCount = autoAcquisitionData.autoPlanCount;
        // 和服务端沟通，当没有自动获客任务时，taskId为空, 才需要显示入口引导 || autoPlanCount===0 代表没有自动自动获客任务
        if (taskId === '' || (autoPlanCount !== undefined && autoPlanCount !== null && autoPlanCount === 0)) {
          return true;
        } else {
          return false;
        }
      case SUGGEST_MODAL:
        const suggestData = data[3];
        if (!suggestData) {
          return false;
        }
        // 有数据且有已展示缓存，不主动弹窗但是数据要写入
        // 有数据并无已展示缓存，主动展示弹窗
        if (suggestData?.available) {
          const storageResult = storeApi.getSync(MARKETING_SUGGEST_MODAL);
          const curDate = moment().format('YYYY-MM-DD');
          setSuggestData(suggestData);
          if (modalKey !== SUGGEST_MODAL && storageResult.suc && storageResult?.data === curDate) {
            return false;
          } else {
            return true;
          }
        } else {
          return false;
        }
      default:
        return <></>;
    }
  };

  // 根据条件添加弹窗到队列
  const addModalToQueue = () => {
    const modalKey = modalKeyRef.current;
    // 通过点击事件吊起的弹窗，modalKey是点击弹窗的key，否则走默认逻辑展示下一个弹窗
    let currentKey = modalKey || cloneModalKeyList.shift();
    if (!currentKey) {
      return;
    }
    // -------- 弹窗展示的后置逻辑：--------
    if (judgeDisplayCurrentModal(currentKey)) {
      setCurrentModalKey(currentKey);
    }
    // 当前弹窗不符合展示条件且不是指定展示的弹窗 展示下一个
    else if (!modalKey) {
      addModalToQueue();
    }
  };

  // 事件通知展示某一个弹窗
  // const addOneModalToQueue = (key: string) => {
  //   const currentKey = modalKeyList.find(item => item === key);
  //   if (!currentKey) {
  //     return;
  //   }
  //   setCurrentModalKey(currentKey);
  // };

  // 开始所有弹窗的异步数据请求
  const startTotalModalRequest = (asyncList: any[]) => {
    Promise.all(asyncList)
      .then(res => {
        modalDataListRef.current = res;
      })
      .finally(() => {
        addModalToQueue();
      });
  };

  // 初始逻辑
  const initState = () => {
    const routerWord = systemApi.isWebWmEntry() ? '#intelliMarketing' : '#edm';
    const isDisplayModule = location.hash?.includes(routerWord) && ShowModalPages.includes(curPage);
    // 无营销权限不展示
    if (!hasEdmPermission) {
      return;
    }
    // 路由切换重置clone数组
    cloneModalKeyList = [...modalKeyList];
    // 异步promise数组
    const asyncList = [];
    // -------- 弹窗展示的前置逻辑：--------
    // 促续费弹窗前置逻辑（这个比较特殊有全局入口所以全局都展示）
    const stateResp = storeApi.getSync(REWARD_TASK_RESP_CACHE)?.data;
    const modalKey = modalKeyRef.current;
    if (stateResp && modalKey !== REWARD_TASK_MODAL) {
      const rewardStorageData = JSON.parse(stateResp);
      // 进度随时会更新为3已领取奖励状态，需要请求服务端，有如下两种场景
      if (rewardStorageData.state !== 4) {
        const currentDate = Date.now();
        // 场景1：当前活动进度2
        // 场景2：当前时间大于活动结束时间
        if (rewardStorageData.state === 2 || currentDate > rewardStorageData.expireTimestamp) {
          asyncList.push(edmApi.getRewardTaskState());
        } else {
          asyncList.push(Promise.resolve(rewardStorageData));
        }
      } else {
        asyncList.push(Promise.resolve());
      }
    } else {
      asyncList.push(edmApi.getRewardTaskState());
    }
    // 促活弹窗（周任务弹窗）（部分营销页面）
    if (isDisplayModule) {
      asyncList.push(edmApi.getRewardTaskPopupInfo());
    } else {
      asyncList.push(Promise.resolve());
    }
    // // 营销托管弹窗前置逻辑（部分营销页面、无缓存或缓存超时）
    // if (isDisplayModule) {
    //   const data = storeApi.getSync(AIHOSTING_MODAL);
    //   if (data.suc && data.data) {
    //     // 超时了，需要展示
    //     if (Date.now() > +data.data) {
    //       asyncList.push(edmApi.getSendBoxRecord(), edmApi.getSendBoxConf({ type: 1 }));
    //     } else {
    //       asyncList.push(Promise.resolve(), Promise.resolve());
    //     }
    //   } else {
    //     asyncList.push(edmApi.getSendBoxRecord(), edmApi.getSendBoxConf({ type: 1 }));
    //   }
    // } else {
    //   asyncList.push(Promise.resolve(), Promise.resolve());
    // }
    // 自动获客弹窗前置逻辑（这个在大数据智能推荐有全局入口但因为展示数据非动态所以可以限制在部分营销页面再执行）（部分营销页面、无缓存或缓存超时）
    if (isDisplayModule) {
      const data = storeApi.getSync(AIAUTOACQUISITION_MODAL);
      if (data.suc && data.data) {
        // 超时了，需要展示
        if (Date.now() > +data.data) {
          asyncList.push(edmApi.getSendBoxConf({ type: 2 }));
        } else {
          asyncList.push(Promise.resolve());
        }
      } else {
        asyncList.push(edmApi.getSendBoxConf({ type: 2 }));
      }
    } else {
      asyncList.push(Promise.resolve());
    }
    // 营销建议弹窗前置逻辑（部分营销页面）
    if (isDisplayModule) {
      asyncList.push(edmApi.getMarketingSuggest());
    } else {
      asyncList.push(Promise.resolve());
    }
    // -------- 弹窗展示的中置逻辑：--------
    // 促续费弹窗中置逻辑 (...)
    // 促活弹窗中置逻辑 (根据返回字段是否需要展示)
    // 营销托管弹窗中置逻辑 (获取是否有营销记录（包括普通任务和分批任务），没有的话不展示弹窗而是任务介绍页)
    // 营销建议弹窗中置逻辑 (是否有相关数据)
    // 开始所有弹窗的异步数据请求
    startTotalModalRequest(asyncList);
  };

  // -------- 初始逻辑 --------
  useEffect(() => {
    initState();
  }, [hasEdmPermission, location.hash]);

  useEffect(() => {
    // 注册展示弹窗事件
    const eventId = eventApi.registerSysEventObserver('displayMarketingModal', {
      func: ev => {
        const modalKey = ev?.eventData?.modalKey;
        const data = ev?.eventData?.data;
        if (modalKey) {
          // addOneModalToQueue(modalKey);
          modalKeyRef.current = modalKey;
          initState();
        }
        if (modalKey === AI_AUTO_ACQUISITION_MODAL && data) {
          setAutoData({ ...data });
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('displayMarketingModal', eventId);
    };
  }, [hasEdmPermission]);

  const renderCurrentModal = () => {
    switch (currentModalKey) {
      case REWARD_TASK_MODAL:
        return <RewardTaskModalComponent rewardTaskStateRespFromProp={rewardTaskStateResp} handleClose={closeCurrentModal} />;
      case WEEKLY_TASK_MODAL:
        return <MarketingWeeklyTask data={weeklyData} handleClose={closeCurrentModal} />;
      // case AI_HOSTING_MODAL:
      //   return <AihostingModal handleClose={closeCurrentModal} />;
      case AI_AUTO_ACQUISITION_MODAL:
        return <AiAutoAcquisitionModal data={autoData} handleClose={closeCurrentModal} />;
      case SUGGEST_MODAL:
        return <MarketingSuggestModal data={suggestData} handleClose={closeCurrentModal} />;
      default:
        return <></>;
    }
  };

  return <div>{renderCurrentModal()}</div>;
};
