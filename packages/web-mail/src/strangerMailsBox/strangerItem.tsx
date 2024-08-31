import React, { useRef } from 'react';
import { apiHolder, apis, DataStoreApi, MailStrangerApi, EmailListPriority, PriorityIntroMap, StrangerModel, DataTrackerApi } from 'api';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import style from './strangerItem.module.scss';
import LowModal from '@/components/UI/Modal/lowModal';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { StrangerActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import useMailStore from '../hooks/useMailStoreRedux';
import useState2RM from '../hooks/useState2ReduxMock';
// imz'Kt { setCurrentAccount } from '../util';
import { getIn18Text } from 'api';
const mailStrangerApi = apiHolder.api.requireLogicalApi(apis.mailStrangerApiImpl) as unknown as MailStrangerApi;
const storeApi: DataStoreApi = apiHolder.api.getDataStoreApi();
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
export interface StrangerItemProps {
  active: boolean;
  data: StrangerModel;
}
// 陌生人列表项
const StrangerItem: React.FC<StrangerItemProps> = props => {
  const curStranger = useAppSelector(state => state.strangerReducer.curStranger);
  const [mailDataList, setMailList] = useMailStore('mailRelateStrangeMailList');
  const [selectedMail, setSelectMail] = useState2RM('mailRelateStrangerActiveId', 'doUpdateMailRelateStrangerActiveId');
  const { data: strangerData, active } = props;
  const { accountName, contactName } = strangerData;
  const dispatch = useAppDispatch();
  // 设置优先级
  const setSmartPriorities = async (priority: 0 | 1 | 2) => {
    const priorityCn = PriorityIntroMap[priority] || '';
    trackerApi.track('pc_importance_of_sender', { mark_location: getIn18Text('BIAOJIMOSHENGFA'), important: priorityCn });
    // setCurrentAccount();
    const res = await mailStrangerApi.setSmartPriorities({
      email: accountName,
      name: contactName || accountName,
      priority,
    });
    if (res.success === true) {
      message.success({
        content: `已设置联系人为“${priorityCn}”`,
      });
      // 移除此陌生人
      dispatch(StrangerActions.removeStrangers([accountName]));
      // 此陌生人正在被查看
      if (accountName === curStranger?.accountName) {
        // 清空邮件和读信
        // dispatch(StrangerActions.setMailList([]));
        setMailList([]);
        setSelectMail('');
        // dispatch(StrangerActions.setSelectedMail(''));
      }
    } else {
      message.fail({
        content: getIn18Text('SHEZHIYOUXIANJI'),
      });
    }
  };
  // modal二次确认
  const modalJudge = async () => {
    return new Promise(resolve => {
      // setCurrentAccount();
      const noMoreLowModalStore = storeApi.getSync('noMoreLowModal');
      const { data, suc } = noMoreLowModalStore;
      // 已选择不再提醒
      if (suc && data === 'true') {
        resolve(true);
        return;
      }
      trackerApi.track('pc_low_priority_window', { page: getIn18Text('YOUJIANLIEBIAO\uFF08') });
      LowModal.show({
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  };
  // 低优
  const toLow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // 弹窗二次确认
    const judgeRes = await modalJudge();
    if (!judgeRes) return;
    await setSmartPriorities(2);
  };
  // 普通
  const toNormal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await setSmartPriorities(1);
  };
  // 高优
  const toHigh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await setSmartPriorities(0);
  };
  return (
    <div
      className={classnames(style.strangerItem, {
        [style.blue]: !!active,
      })}
    >
      <div className={style.itemContent}>
        <AvatarTag
          className={style.headPic}
          size={32}
          user={{
            name: contactName,
            email: accountName,
          }}
        />
        <div className={style.msg}>
          <p className={style.name} title={contactName}>
            {contactName}
          </p>
          <p className={style.email} title={accountName}>
            {accountName}
          </p>
        </div>
      </div>
      <div className={`${style.opts} priority-item-list`}>
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
  );
};
export default StrangerItem;
