import { StrangerActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { apiHolder, apis, DataStoreApi, MailStrangerApi, EmailListPriority, PriorityIntroMap, DataTrackerApi } from 'api';
import React from 'react';
import message from '@web-common/components/UI/Message/SiriusMessage';
import LowModal from '@/components/UI/Modal/lowModal';
import style from './batchStrangerOpt.module.scss';
import useState2RM from '../../hooks/useState2ReduxMock';
import useMailStore from '../../hooks/useMailStoreRedux';
// import { setCurrentAccount } from '../../util';
import { getIn18Text } from 'api';
const mailStrangerApi = apiHolder.api.requireLogicalApi(apis.mailStrangerApiImpl) as unknown as MailStrangerApi;
const storeApi: DataStoreApi = apiHolder.api.getDataStoreApi();
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
interface BatchStrangerOptProp {}
// 批量处理陌生人
const BatchStrangerOpt: React.FC<BatchStrangerOptProp> = () => {
  const strangers = useAppSelector(state => state.strangerReducer.strangers);
  // const curActiveStrangerIds = useAppSelector(state => state.strangerReducer.activeStrangerIds);
  const [curActiveStrangerIds, setCurActiveStrangerIds] = useState2RM('activeStrangerIds', 'doUpdateActiveStrangerIds');
  const [mailDataList, setMailList] = useMailStore('mailRelateStrangeMailList');
  const [selectedMail, setSelectMail] = useState2RM('mailRelateStrangerActiveId', 'doUpdateMailRelateStrangerActiveId');
  const dispatch = useAppDispatch();
  // 设置优先级
  const setSmartPriorities = async (priority: 0 | 1 | 2) => {
    const priorityCn = PriorityIntroMap[priority] || '';
    trackerApi.track('pc_importance_of_sender', { mark_location: getIn18Text('BIAOJIMOSHENGFA'), important: priorityCn });
    // 名字数组
    const curActiveStrangerNames = curActiveStrangerIds.map(item => {
      const findRes = strangers.find(item1 => item1.accountName === item);
      return findRes?.contactName || item;
    });
    // setCurrentAccount();
    // console.log('curActiveStrangerIds', curActiveStrangerIds, curActiveStrangerNames);
    const res = await mailStrangerApi.setSmartPriorities({
      email: curActiveStrangerIds,
      name: curActiveStrangerNames,
      priority,
    });
    if (res.success === true) {
      message.success({
        content: `已设置${curActiveStrangerIds.length}位联系人为“${priorityCn}”`,
      });
      // 清空已选择陌生人列表
      // dispatch(StrangerActions.setActiveStrangerIds([]));
      setCurActiveStrangerIds([]);
      // 移除已标记陌生人
      dispatch(StrangerActions.removeStrangers([...curActiveStrangerIds]));
      // 清空邮件和读信
      // dispatch(StrangerActions.setMailList([]));
      setMailList([]);
      // dispatch(StrangerActions.setSelectedMail(''));
      setSelectMail([]);
    } else {
      message.fail({
        content: getIn18Text('SHEZHIYOUXIANJI'),
      });
    }
  };
  // modal二次确认
  const modalJudge = async () => {
    return new Promise((resolve, reject) => {
      // setCurrentAccount();
      const noMoreLowModalStore = storeApi.getSync('noMoreLowModal');
      const { data, suc } = noMoreLowModalStore;
      // 已选择不再提醒
      if (suc && data === 'true') {
        resolve(true);
        return;
      }
      trackerApi.track('pc_low_priority_window', { page: '邮件列表（陌生人列表）' });
      LowModal.show({
        title: getIn18Text('QUEDINGYAOJIANGXUAN'),
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  };
  // 低优
  const toLow = async () => {
    // 弹窗二次确认
    const judgeRes = await modalJudge();
    if (!judgeRes) return;
    await setSmartPriorities(2);
  };
  // 普通
  const toNormal = async () => await setSmartPriorities(1);
  // 高优
  const toHigh = async () => await setSmartPriorities(0);
  return (
    <div className={style.batchStrangerOpt}>
      <div className={style.optArea}>
        <div className={style.top}>
          <img className={style.batchHead} src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/04/02/a594cd874c844c4689aeaf9b5b3d992a.png" alt="" />
          <div className={style.strangerNumContainer}>
            <div className={style.strangerNum}>{curActiveStrangerIds.length}</div>
            <p className={style.intro}>{getIn18Text('YIXUANZEMOSHENG')}</p>
          </div>
        </div>
        <div className={style.opts}>
          <span className={style.low} onClick={toLow}>
            {getIn18Text('DIYOU')}
          </span>
          <span className={style.normal} onClick={toNormal}>
            {getIn18Text('PUTONG')}
          </span>
          <span className={style.high} onClick={toHigh}>
            {getIn18Text('GAOYOU')}
          </span>
        </div>
      </div>
    </div>
  );
};
export default BatchStrangerOpt;
