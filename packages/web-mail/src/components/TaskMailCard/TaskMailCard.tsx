import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Progress } from 'antd';
import RightOutlined from '@ant-design/icons/RightOutlined';
import CheckOutlined from '@ant-design/icons/CheckOutlined';
import BellOutlined from '@ant-design/icons/BellOutlined';
import Fold from './Fold';
import TaskModal from './TaskModal';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import message from '@web-common/components/UI/Message/SiriusMessage';
import style from './TaskMailCard.module.scss';
import { apiHolder as api, apis, TaskMailApi, SystemEvent, ExecutorModel, DataTrackerApi, ContactApi, OrgApi, ContactModel, MailConfApi } from 'api';
import { useActions, useAppSelector, ReadMailActions } from '@web-common/state/createStore';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import moment from 'moment';
import cloneDeep from 'lodash/cloneDeep';
import { MailStatus } from '../../util';
import { debounce } from 'lodash';
import { getIn18Text } from 'api';
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
const taskMailApi = api.api.requireLogicalApi(apis.taskMailImplApi) as unknown as TaskMailApi;
const systemApi = api.api.getSystemApi();
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const mailConfApi: MailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
interface Props {
  todoId: number;
  isrcl?: boolean;
  account?: string;
  onError?: () => void;
  mailId?: string;
}

const TaskMailCard: React.FC<Props> = props => {
  const taskDetail = useAppSelector(state => state.readMailReducer.taskDetail);
  const { updateTaskDetail } = useActions(ReadMailActions);
  const { todoId, isrcl = false, account, onError, mailId } = props;
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [userStatus, setUserStatus] = useState<number>();
  const [executorList, setExecutorList] = useState<ExecutorModel[]>([]); //taskDetail.executorList.length <= 6 的情况下展示全部，否则展示5个
  const [loading, setLoading] = useState<boolean>(false);
  const [curAccountContentInfo, setCurAccountContentInfo] = useState<ContactModel | undefined>(systemApi.getCurrentUser()?.contact);

  /**
   * 根据账号获取联系人
   */
  const getContentByAccount = useCallback(
    debounce(
      async () => {
        if (account) {
          try {
            const res = await contactApi.doGetContactByEmailFilter({ emails: [account], _account: account });
            if (res && res[account]) {
              setCurAccountContentInfo(res[account]);
            }
          } catch (e) {
            console.error('[error TaskMailCard: doGetContactByEmailFilter]', e);
          }
        } else {
          setCurAccountContentInfo(systemApi.getCurrentUser()?.contact);
        }
      },
      500,
      {
        trailing: true,
        leading: true,
      }
    ),
    []
  );
  const deadline = useMemo(() => {
    if (taskDetail?.deadline) {
      const timeZone = mailConfApi.getTimezone();
      return moment(systemApi.getDateByTimeZone(taskDetail.deadline * 1000, timeZone)).format(
        taskDetail.type === 2 ? getIn18Text('NIANYUERI') : getIn18Text('NIANYUERIHH')
      );
    } else {
      return getIn18Text('WUJIEZHISHIJIAN');
    }
  }, [taskDetail?.deadline]);

  /**
   * 根据传入的account,获取对应的user信息已拿到cid，
   */
  useEffect(() => {
    getContentByAccount();
  }, [account]);

  const doGetTaskMailContent = () => {
    // setCurrentAccount(account);
    // 任务邮件-不支持多账号
    taskMailApi.doGetTaskMailContent(todoId).then(res => {
      if (res && res.data) {
        updateTaskDetail(res.data[0]);
      } else {
        onError && onError();
        // message.success({ content: res.message, duration: 1, key: todoId });
        updateTaskDetail({});
      }
    });
  };
  const getTaskMailInDb = (callback?: () => void) => {
    // setCurrentAccount(account);
    // 任务邮件-不支持多账号
    taskMailApi
      .getTaskMailInDb(todoId)
      .then(res => {
        if (res && res.length) {
          updateTaskDetail(res[0]);
        }
      })
      .finally(() => {
        if (callback) {
          callback();
        }
      });
  };
  // 更新当前用户状态
  // todo: 如果执行人中找到当前用户，则修改当前用户状态，如果没有找到应该重置当前用户状态，要不会保留上一封任务邮件的当前用户状态
  const updataUserStatus = (executorList: ExecutorModel[]) => {
    for (let i = 0; i < executorList.length; i++) {
      let executor = executorList[i];
      if (executor.accId === curAccountContentInfo?.contact?.id) {
        setUserStatus(executor.status);
        break;
      }
    }
  };
  // 催促一下
  const urgeTask = () => {
    // 操作埋点
    trackApi.track('pcMail_sclick_button_taskMailDetailPage', { buttonName: '创建人催促一下' });
    // setCurrentAccount(account);
    // 任务邮件-不支持多账号
    taskMailApi.doUrgeTask({ todoId }).then(res => {
      if (res.success) {
        message.success({ content: getIn18Text('YICUICUWEIWAN'), duration: 1, key: todoId });
      } else {
        message.success({ content: res.message, duration: 1, key: todoId });
      }
    });
  };
  const operateTask = (mark: number) => {
    if (loading) {
      message.success({ content: getIn18Text('QINGWUZHONGFUDIAN'), duration: 1, key: todoId });
    }
    setLoading(true);
    // 0-标记未完成，1-标记完成，2-创建者提前完成任务，3-创建者重新开启
    if (mark === 2 && (taskDetail.userType === 3 || taskDetail.userType === 7) && userStatus === 0 && taskDetail.total - taskDetail.completed <= 1) {
      // 即是任务发起人又是执行人，且仅自己未完成,当其他执行人都已完成任务，只有自己未完成任务时，点"完成任务"按钮实际效果为作为执行人完成此任务，任务进度变为100%。（注意不是作为发起人完成任务）
      mark = 1;
    }
    // 操作埋点
    let markName = ['执行人重新开启', '执行人完成', '创建人提前结束', '创建人重新开启'];
    trackApi.track('pcMail_sclick_button_taskMailDetailPage', { buttonName: markName[mark] });
    // const userId = account || '';
    const userId = curAccountContentInfo?.contact?.id || '';
    // setCurrentAccount(account);
    // 任务邮件-不支持多账号
    taskMailApi.doOperateTask({ todoId, mark }, userId).then(res => {
      if (res.success) {
        message.success({ content: getIn18Text('CAOZUOCHENGGONG'), duration: 1, key: todoId });
        getTaskMailInDb(() => setLoading(false));
      } else {
        setLoading(false);
        message.success({ content: res.message, duration: 1, key: todoId });
      }
    });
  };
  const handletaskChanged = (e: SystemEvent) => {
    const { taskMailList } = e.eventData;
    if (taskMailList && taskMailList.get(todoId)) {
      updateTaskDetail(taskMailList.get(todoId));
    }
  };
  useMsgRenderCallback('todoChange', handletaskChanged);

  useEffect(() => {
    if (todoId) {
      doGetTaskMailContent();
    } else {
      updateTaskDetail({});
    }
  }, [todoId, mailId]);
  useEffect(() => {
    if (taskDetail?.todoId) {
      updataUserStatus(taskDetail.executorList);
      if (taskDetail.executorList.length <= 6) {
        // css对展示进行了旋转，所以为了保证正确的顺序，数组进行了反转
        setExecutorList(cloneDeep(taskDetail.executorList).reverse());
      } else {
        setExecutorList(taskDetail.executorList.slice(0, 5).reverse());
      }
    }
  }, [taskDetail]);
  useEffect(() => {
    if (showDetailsModal) {
      // 操作埋点
      trackApi.track('pcMail_click_planProgress_taskMailDetailPage');
    }
  }, [showDetailsModal]);
  if (!taskDetail?.todoId) {
    return <></>;
  }
  return (
    <>
      <div className={style.taskCard} hidden={isrcl}>
        <div className={style.taskHeader}>
          <p className={style.cardTitle}>{getIn18Text('RENWUXIANGQING')}</p>
          <div className={style.progressBox} hidden={[2].indexOf(taskDetail.userType) !== -1}>
            <Progress
              percent={(taskDetail.completed / taskDetail.total) * 100}
              showInfo={false}
              strokeColor={{ '-2.4%': '#85AEFF', '127.98%': '#567BFF' }}
              trailColor="#D9E9FE"
            />
            <div className={style.progress}>
              <div className={style.progressUser} onClick={() => setShowDetailsModal(true)}>
                <div className={style.itemUser} hidden={taskDetail.executorList.length < 7}>
                  <i></i>
                  <i></i>
                  <i></i>
                </div>
                {executorList.map(_ => {
                  const contact = taskDetail.contactList.get(_.accId);
                  if (!contact) return null;
                  return (
                    <div className={style.itemUser}>
                      <AvatarTag size={22} contactId={contact?.contact?.id} />
                    </div>
                  );
                })}
              </div>
              <p className={style.progressProportion} onClick={() => setShowDetailsModal(true)}>
                <span style={{ marginRight: '7px' }}>
                  {getIn18Text('JINDU')}
                  {taskDetail.completed}/{taskDetail.total}
                </span>
                <RightOutlined style={{ color: '#7D8085', fontSize: '12px' }} />
              </p>
            </div>
          </div>
        </div>
        <div className={style.taskContent}>
          <p className={style.contentTitle}>{getIn18Text('ZHUTI')}</p>
          <p className={style.contentDetails}>
            <Fold>{taskDetail.title}</Fold>
          </p>
          <p className={style.contentTitle}>{getIn18Text('JIEZHISHIJIAN')}</p>
          <p className={style.contentDetails}>{deadline}</p>
          <div
            className={style.taskCompleteBox}
            hidden={taskDetail.status !== 1 && taskDetail.status !== 2 && ((taskDetail.userType !== 2 && taskDetail.userType !== 6) || userStatus !== 1)}
          >
            <div className={style.taskComplete}>
              <p
                style={{
                  left:
                    taskDetail.status === 1
                      ? '14px'
                      : taskDetail.status === 2
                      ? '8px'
                      : taskDetail.userType !== 3 && taskDetail.userType !== 7 && userStatus === 1
                      ? '19px'
                      : '0',
                }}
              >
                {taskDetail.status === 1
                  ? getIn18Text('RENWU')
                  : taskDetail.status === 2
                  ? getIn18Text('CHUANGJIANREN')
                  : (taskDetail.userType === 2 || taskDetail.userType === 6) && userStatus === 1
                  ? getIn18Text('WOYI')
                  : ''}
                <br />
                {taskDetail.status === 1
                  ? getIn18Text('YIWANCHENG')
                  : taskDetail.status === 2
                  ? getIn18Text('SHEWEIWANCHENG')
                  : (taskDetail.userType === 2 || taskDetail.userType === 6) && userStatus === 1
                  ? getIn18Text('WANCHENG')
                  : ''}
              </p>
            </div>
          </div>
          <p className={style.contentTitle}>{getIn18Text('SHOUYAOGUANZHUREN')}</p>
          <p className={style.contentDetails}>
            <Fold foldNum={1}>
              {taskDetail.focusList && taskDetail.focusList.length > 0
                ? taskDetail.focusList.map((_, i) => {
                    const contact = taskDetail.contactList.get(_);
                    if (!contact) return null;
                    const names = contact?.contact?.contactName + (i < taskDetail.focusList.length - 1 ? '、' : '');
                    return names;
                  })
                : getIn18Text('WU')}
            </Fold>
          </p>
        </div>
        <div className={style.bottomProgress} hidden={[1, 3, 4, 5, 6, 7].indexOf(taskDetail.userType) !== -1}>
          <Progress
            percent={(taskDetail.completed / taskDetail.total) * 100}
            showInfo={false}
            strokeColor={{ '-2.4%': '#85AEFF', '127.98%': '#567BFF' }}
            trailColor="#D9E9FE"
          />
          <div className={style.progress}>
            <div className={style.progressUser} onClick={() => setShowDetailsModal(true)}>
              <div className={style.itemUser} hidden={taskDetail.executorList.length < 7}>
                <i></i>
                <i></i>
                <i></i>
              </div>
              {executorList.map(_ => {
                const contact = taskDetail.contactList.get(_.accId);
                if (!contact) return null;
                return (
                  <div className={style.itemUser}>
                    <AvatarTag size={22} contactId={contact?.contact?.id} />
                  </div>
                );
              })}
            </div>
            <p className={style.progressProportion} onClick={() => setShowDetailsModal(true)}>
              <span style={{ marginRight: '7px' }}>
                {getIn18Text('JINDU')}
                {taskDetail.completed}/{taskDetail.total}
              </span>
              <RightOutlined style={{ color: '#7D8085', fontSize: '12px' }} />
            </p>
          </div>
        </div>
        <div className={style.taskOperate} hidden={(taskDetail.userType !== 1 && taskDetail.userType !== 5) || taskDetail.status === 1}>
          {/* 当前用户角色：创建、创建人兼关注人 */}
          <span className={`${style.operateBtn} ${style.operateBtnRed}`} hidden={taskDetail.status !== 0} onClick={urgeTask}>
            <BellOutlined className={style.operateBell} />
            {getIn18Text('CUICUYIXIA')}
          </span>
          <span className={`${style.operateBtn} ${style.operateBtnBlue}`} hidden={taskDetail.status !== 0} onClick={() => operateTask(2)}>
            <CheckOutlined className={style.operateCheck} />
            {getIn18Text('WANCHENGRENWU')}
          </span>
          <span className={`${style.operateBtn} ${style.operateBtnLine}`} hidden={taskDetail.status !== 2} onClick={() => operateTask(3)}>
            {getIn18Text('SHEWEIWEIWANCHENG')}
          </span>
        </div>
        <div className={style.taskOperate} hidden={(taskDetail.userType !== 2 && taskDetail.userType !== 6) || taskDetail.status === 2}>
          {/* 当前用户角色：执行人、执行人兼关注人 */}
          <span className={`${style.operateBtn} ${style.operateBtnBlue}`} hidden={userStatus !== 0} onClick={() => operateTask(1)}>
            <CheckOutlined className={style.operateCheck} />
            {getIn18Text('WANCHENGRENWU')}
          </span>
          <span className={`${style.operateBtn} ${style.operateBtnLine}`} hidden={userStatus !== 1} onClick={() => operateTask(0)}>
            {getIn18Text('SHEWEIWEIWANCHENG')}
          </span>
        </div>
        <div className={style.taskOperate} hidden={taskDetail.userType !== 3 && taskDetail.userType !== 7}>
          {/* 当前用户角色：创建人兼执行人、创建人兼关注人兼执行人 */}
          <span className={`${style.operateBtn} ${style.operateBtnRed}`} hidden={taskDetail.status !== 0} onClick={urgeTask}>
            <BellOutlined className={style.operateBell} />
            {getIn18Text('CUICUYIXIA')}
          </span>
          <span
            className={`${style.operateBtn} ${style.operateBtnBlue}`}
            hidden={taskDetail.status !== 0 || userStatus !== 0 || taskDetail.total - taskDetail.completed <= 1}
            onClick={() => operateTask(1)}
          >
            {getIn18Text('JINWOWANCHENG')}
          </span>
          <span className={`${style.operateBtn} ${style.operateBtnLine}`} hidden={taskDetail.status !== 0 || userStatus !== 1} onClick={() => operateTask(0)}>
            {getIn18Text('WOYIWANCHENG')}
          </span>
          <span className={`${style.operateBtn} ${style.operateBtnBlue}`} hidden={taskDetail.status !== 0} onClick={() => operateTask(2)}>
            <CheckOutlined className={style.operateCheck} />
            {getIn18Text('WANCHENGRENWU')}
          </span>
          <span className={`${style.operateBtn} ${style.operateBtnLine}`} hidden={taskDetail.status !== 1} onClick={() => operateTask(0)}>
            {getIn18Text('SHEWEIWEIWANCHENG')}
          </span>
          {/* 作为执行人角色设置未完成 */}
          <span className={`${style.operateBtn} ${style.operateBtnLine}`} hidden={taskDetail.status !== 2} onClick={() => operateTask(3)}>
            {getIn18Text('SHEWEIWEIWANCHENG')}
          </span>
          {/* 作为创建人角色设置再次开启 */}
        </div>
      </div>
      <div className={style.taskCard} hidden={!isrcl}>
        <div className={style.taskHeader}>
          <p className={style.cardTitle}>{getIn18Text('RENWUXIANGQING')}</p>
        </div>
        <div className={style.taskContent}>
          <p className={style.taskErr}>{getIn18Text('RENWUBUCUNZAI')}</p>
        </div>
      </div>
      <TaskModal
        showDetailsModal={showDetailsModal}
        setShowDetailsModal={setShowDetailsModal}
        contactList={taskDetail.contactList}
        executorList={taskDetail.executorList}
        total={taskDetail.total}
        completed={taskDetail.completed}
      />
    </>
  );
};
export default TaskMailCard;
