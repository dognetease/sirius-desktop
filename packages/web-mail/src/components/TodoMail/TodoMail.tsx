import React, { useState, useEffect, useMemo } from 'react';
import { Checkbox } from 'antd';
import { apiHolder as api, apis, MailApi as MailApiType, SystemApi } from 'api';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import ScheduleDatePicker from '@web-schedule/components/FormComponents/ScheduleDatePicker';
import TimeStepPicker from '@web-schedule/components/TimeStepPicker/TimeStepPicker';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import moment, { Moment } from 'moment';
import NiceModal, { createNiceModal, useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import './index.scss';
import { MailActions, MailTabActions, useActions, useAppSelector, useAppDispatch } from '@web-common/state/createStore';
// import { setCurrentAccount } from 'util';
import noneIcon from '@/images/icons/todomail/none.svg';
import oneIcon from '@/images/icons/todomail/one.svg';
import twoIcon from '@/images/icons/todomail/two.svg';
import nineteenIcon from '@/images/icons/todomail/nineteen.svg';
import nineIcon from '@/images/icons/todomail/nine.svg';
import tnineteenIcon from '@/images/icons/todomail/nineteen.svg';
import otherIcon from '@/images/icons/todomail/other.svg';
import { ReactComponent as DeleteIcon } from '@/images/icons/modal_close_temp.svg';
import { filterTabMap, FLOLDER } from '../../common/constant';
import { promiseIsTimeOut } from '@web-mail/util';
import { getIn18Text } from 'api';

const MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApiType;
const systemApi = api.api.getSystemApi() as SystemApi;

// 获取中英文文案

const options = [
  { type: '0', title: getIn18Text('WU'), icon: noneIcon },
  { type: '1', title: getIn18Text('1XIAOSHIHOU'), icon: oneIcon },
  { type: '2', title: getIn18Text('2XIAOSHIHOU'), icon: twoIcon },
  { type: '3', title: getIn18Text('JINWAN 19'), icon: nineteenIcon },
  { type: '4', title: getIn18Text('MINGZAO 9:'), icon: nineIcon },
  { type: '5', title: getIn18Text('MINGWAN 19'), icon: tnineteenIcon },
  { type: '6', title: getIn18Text('QITASHIJIAN'), icon: otherIcon },
];

const TodoMail = () => {
  const [isRemind, setRemind] = useState<boolean>(true);
  const [onActive, setActive] = useState<String>('1');
  const [remindDate, setRemindDate] = useState<Moment>();
  const modal = useNiceModal('mailTodo');
  const dispatch = useAppDispatch();

  // 邮件-搜索-搜索状态
  const mailSearching = useAppSelector(state => state.mailReducer.mailSearching);
  // 是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);

  useEffect(() => {
    if (modal.args.isDefer && modal.args.deferTime) {
      // 修改
      if (modal.args.deferTime.indexOf('2200') !== -1) {
        setActive('0');
        setRemind(false);
      } else {
        setActive('6');
        if (moment(modal.args.deferTime, 'YYYY-MM-DD HH:mm:ss').valueOf() > new Date().getTime()) {
          // 未逾期
          setRemindDate(moment(modal.args.deferTime, 'YYYY-MM-DD HH:mm:ss'));
        } else {
          setRemindDate(moment().add(1, 'm'));
        }
        setRemind(!!modal.args.deferNotice);
      }
    }
  }, [modal.args]);

  const optionClick = (type: string) => {
    if (type === '0') {
      setActive(type);
      setRemind(false);
    } else if (type === '6') {
      setActive(type);
      setRemindDate(moment().add(1, 'm'));
    } else if (type === '3' && moment().valueOf() > moment('19:00', 'HH:mm').valueOf()) {
      Message.warning({ content: getIn18Text('BUNENGXUANZEGUO'), key: modal.args.mailId });
    } else {
      setActive(type);
      setRemind(true);
    }
  };

  const Footer = () => {
    const { doUpdateSelectedKey, doUpdateMailTabs } = useActions(MailActions);
    const { doChangeCurrentTab } = useActions(MailTabActions);
    const onChange = (e: CheckboxChangeEvent) => {
      setRemind(e.target.checked);
    };
    const cancelRemind = () => {
      modal.hide();
    };
    const checkDefer = () => {
      doChangeCurrentTab('-1');
      doUpdateMailTabs(filterTabMap.defer);
      doUpdateSelectedKey({ id: FLOLDER.DEFER });
      Message.destroy(modal.args.mailId);
    };
    const submitRemind = async () => {
      let _remindDate;
      if (onActive === '0') {
        _remindDate = moment('2200-01-01 00:00:00', 'YYYY-MM-DD HH:mm:ss');
      } else if (onActive === '1') {
        _remindDate = moment().add(1, 'h');
      } else if (onActive === '2') {
        _remindDate = moment().add(2, 'h');
      } else if (onActive === '3') {
        _remindDate = moment().hour(19).minute(0).second(0);
      } else if (onActive === '4') {
        _remindDate = moment().add(1, 'd').hour(9).minute(0).second(0);
      } else if (onActive === '5') {
        _remindDate = moment().add(1, 'd').hour(19).minute(0).second(0);
      } else if (onActive === '6') {
        _remindDate = remindDate;
      }
      if (moment().valueOf() > (_remindDate as Moment).valueOf()) {
        Message.warning({ content: getIn18Text('BUNENGXUANZEGUO'), key: modal.args.mailId });
        return;
      }
      setRemindDate(_remindDate);
      // 只有主账号有
      // setCurrentAccount();
      const res = await MailApi.doMarkMailDefer(modal.args.mailId, true, { deferTime: moment(_remindDate).valueOf(), deferNotice: isRemind });
      if (res && res.succ) {
        Message.success({
          content: (
            <span>
              {getIn18Text('SHEZHICHENGGONG\uFF0C11')}
              <span hidden={!systemApi.isMainPage() || isSearching} onClick={checkDefer} style={{ color: '#386ee7', marginLeft: '24px', cursor: 'pointer' }}>
                {getIn18Text('CHAKAN')}
              </span>
            </span>
          ),
          key: modal.args.mailId,
        });

        // 刷新文件夹
        promiseIsTimeOut(dispatch(Thunks.refreshFolder({ noCache: true })), 'pc_refreshFolder_timeout', {
          from: 'todoMail',
        });
      } else {
        Message.warning({ content: getIn18Text('CAOZUOSHIBAI\uFF0C11') });
      }
      modal.hide();
    };
    return (
      <div className="todo-mail-modal-footer">
        <Checkbox checked={isRemind} onChange={onChange} disabled={onActive === '0'}>
          {getIn18Text('TIXINGWOCHULI')}
        </Checkbox>
        <div className="btn-box">
          <p className="cancel-btn btn" onClick={cancelRemind}>
            {getIn18Text('QUXIAO')}
          </p>
          <p className="submit-btn btn" onClick={submitRemind}>
            {getIn18Text('QUEDING')}
          </p>
        </div>
      </div>
    );
  };

  const Schedule = () => {
    const onChangeDate = (date: Moment | null) => {
      date && setRemindDate(date);
    };
    const filterPassedDate = (time: Date) => {
      const currentDate = new Date();
      const selectedDate = new Date(time);
      return !moment(moment(selectedDate).format('YYYY-MM-DD')).isBefore(moment(currentDate).format('YYYY-MM-DD'));
    };
    const filterPassedTime = (time: Date) => {
      const currentDate = new Date();
      const selectedDate = new Date(time);
      return currentDate.getTime() < selectedDate.getTime();
    };
    return (
      <div className="schedule-box" hidden={onActive !== '6'}>
        <span className="schedule-title">{getIn18Text('JIEZHISHIJIAN')}</span>
        <ScheduleDatePicker
          onKeyDown={(e: any) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onChange={onChangeDate}
          allowClear={false}
          value={remindDate}
          className="date-picker"
          filterDate={filterPassedDate}
        />
        <TimeStepPicker
          onKeyDown={(e: any) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onChange={onChangeDate}
          timeIntervals={1}
          value={remindDate}
          className="time-picker"
          filterTime={filterPassedTime}
        />
      </div>
    );
  };

  return (
    <NiceModal
      id="mailTodo"
      title={getIn18Text('SHEZHICHULISHI')}
      closeIcon={<DeleteIcon className="dark-invert" />}
      footer={<Footer />}
      width="464px"
      className="todo-mail-modal"
    >
      <div className="modal-body">
        {options.map(i => (
          <div className={i.type === onActive ? 'option-item-active option-item' : 'option-item'} onClick={() => optionClick(i.type)} key={i.type}>
            <img src={i.icon} alt={i.title} />
            <p>{i.title}</p>
          </div>
        ))}
      </div>
      <Schedule />
    </NiceModal>
  );
};

const MailTodoModal = createNiceModal('mailTodo', TodoMail);

export default MailTodoModal;
