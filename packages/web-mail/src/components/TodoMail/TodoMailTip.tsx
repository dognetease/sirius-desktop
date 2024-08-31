import React, { useMemo } from 'react';
import { getIn18Text } from 'api';
import { apiHolder as api, apis, MailConfApi, MailEntryModel, SystemApi } from 'api';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import ontimeIcon from '@/images/icons/todomail/ontime.svg';
import timeoutIcon from '@/images/icons/todomail/timeout.svg';
import { TASK_MAIL_STATUS } from '../../common/constant';
import './index.scss';

interface Props {
  content: MailEntryModel;
  isDefer: boolean;
  deferTime: string;
  deferNotice: boolean;
}

const systemApi: SystemApi = api.api.getSystemApi();

const mailConfApi: MailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
const eventApi = api.api.getEventApi();

const TodoMailTip: React.FC<Props> = props => {
  const { content, isDefer, deferTime, deferNotice } = props;
  const mid = useMemo(() => content.id, [content]);
  const taskUndone = useMemo(() => content.taskId && content.taskInfo?.status === TASK_MAIL_STATUS.PROCESSING, [content]);
  const isOverdue = useMemo(() => {
    const timeZone = mailConfApi.getTimezone();
    return systemApi.getDateByTimeZone(deferTime, timeZone) < systemApi.getDateByTimeZone(new Date(), timeZone);
  }, [deferTime]);
  const modal = useNiceModal('mailTodo');

  // const now =
  const _deferTime = useMemo(() => {
    const timeZone = mailConfApi.getTimezone();
    return moment(new Date(systemApi.getDateByTimeZone(deferTime, timeZone))).format('YYYY-MM-DD HH:mm:ss');
  }, [deferTime]);

  const todoChange = () => {
    modal.show({ mailId: mid, isDefer, deferTime, deferNotice });
  };

  const done = () => {
    // 只有主账号有
    eventApi.sendSysEvent({
      eventName: 'mailStatesChanged',
      eventData: {
        id: mid,
        isDefer,
        deferTime,
        deferNotice,
      },
      _account: '',
      eventStrData: 'undefer',
    });
  };

  if (!isDefer) {
    return null;
  }
  return (
    <div className="todo-mail-tip">
      <div>
        <img src={isOverdue ? timeoutIcon : ontimeIcon} />
        <span className={isOverdue ? 'todo-mail-tip-time-overdue todo-mail-tip-time' : 'todo-mail-tip-time'}>
          {getIn18Text('CHULISHIJIAN')}
          {_deferTime.indexOf('2200') !== -1 ? getIn18Text('WEISHEZHI') : moment(_deferTime).format(getIn18Text('MMYUEDD11'))}{' '}
          {_deferTime.indexOf('2200') === -1 && getIn18Text('QIAN')}
        </span>
        <span className="todo-mail-tip-changebtn" hidden={!!taskUndone} onClick={todoChange}>
          {getIn18Text('XIUGAI')}
        </span>
      </div>
      <span className="todo-mail-tip-donebtn" hidden={!!taskUndone} onClick={done}>
        {getIn18Text('BIAOWEIYICHULI')}
      </span>
    </div>
  );
};

export default TodoMailTip;
