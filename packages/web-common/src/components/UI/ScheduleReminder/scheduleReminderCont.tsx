import React from 'react';
// import SiriusButton from '@web-common/components/UI/Button';
import SiriusButton from '@lingxi-common-component/sirius-ui/Button';
import IconCard from '@web-common/components/UI/IconCard/index';
import style from './scheduleReminderCont.module.scss';
import moment from 'moment';
import { apiHolder as api, ReminderInfo, SystemApi } from 'api';

const systemApi = api.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
const isMac = inElectron ? window.electronLib.env.isMac : api.env.isMac;

interface scheduleReminderContProp {
  reminders: ReminderInfo[];
  remReminder: (_index: number) => void;
  clearAll: () => void;
}

const scheduleReminderCont: React.FC<scheduleReminderContProp> = props => {
  const { reminders, remReminder, clearAll } = props;

  const close = () => clearAll();

  const iknow = (_index: number) => {
    remReminder(_index);
  };

  const startToEnd = (item: ReminderInfo) => {
    const { scheduleStartDate, scheduleEndDate } = item;
    if (!scheduleStartDate || !scheduleEndDate) return '';
    // 系统时区
    const systemTimeZone = systemApi.getSystemTimeZone()?.key || 8;
    const startMoment = moment(scheduleStartDate).utcOffset(systemTimeZone);
    const endMoment = moment(scheduleEndDate).utcOffset(systemTimeZone);
    // 同一天
    if (startMoment.format('YYYY-MM-DD') === endMoment.format('YYYY-MM-DD')) {
      return startMoment.format('YYYY-MM-DD HH:mm') + '-' + endMoment.format('HH:mm');
    }
    return startMoment.format('YYYY-MM-DD HH:mm') + '-' + endMoment.format('YYYY-MM-DD HH:mm');
  };

  return (
    <div className={style.scheduleReminder + ' sirius-scroll'}>
      {/* window的边框 */}
      {!isMac && (
        <>
          <span className={style.bor1} />
          <span className={style.bor2} />
          <span className={style.bor3} />
          <span className={style.bor4} />
        </>
      )}
      <div className={style.reminderHead}>
        <IconCard type="schedule" style={{ marginRight: 8 }} />
        <span className={style.headTitle}>日程提醒</span>
        <IconCard className={style.close + ' sirius-no-drag'} type="close" onClick={close} />
      </div>
      <div className={style.reminderList + ' sirius-no-drag'}>
        {reminders.map((item: ReminderInfo, index) => (
          <div className={style.reminder}>
            <div className={style.reminderTitle}>
              <span className={style.reminderTimeLeft}>{item?.reminder || ''}</span>
              <span className={style.reminderName}>{item?.title || '--'}</span>
            </div>
            <div className={style.reminderTime}>
              时间：<span className={style.reminderTimeText}>{startToEnd(item)}</span>
            </div>
            {item?.location && (
              <div className={style.reminderArea}>
                地点：<span className={style.reminderAreaText}>{item?.location || '暂无'}</span>
              </div>
            )}
            <div className={style.reminderSponsor}>
              发起者：<span className={style.reminderSponsorText}>{item?.creator || '--'}</span>
            </div>
            <div className={style.buttArea}>
              <SiriusButton className="sirius-no-drag" btnType="primary" onClick={() => iknow(index)}>
                我知道了
              </SiriusButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default scheduleReminderCont;
