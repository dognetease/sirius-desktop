import React from 'react';
// import SiriusButton from '@web-common/components/UI/Button';
import SiriusButton from '@lingxi-common-component/sirius-ui/Button';
import IconCard from '@web-common/components/UI/IconCard/index';
import style from './advertisingReminder.module.scss';
import { apiHolder as api, getIn18Text, AdvertisingReminderInfo, AdvertisingReminderApi, SystemApi, apis, WorktableApi } from 'api';

const systemApi = api.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
const reminderApi = api.api.requireLogicalApi(apis.remindersImpl) as AdvertisingReminderApi;
const isMac = inElectron ? window.electronLib.env.isMac : api.env.isMac;
const worktableApi = api.api.requireLogicalApi('worktableApiImpl') as WorktableApi;

interface AdvertisingReminderProp {
  reminders: AdvertisingReminderInfo[];
  remReminder: (_index: number) => void;
  clearAll: () => void;
}

const AdvertisingReminder: React.FC<AdvertisingReminderProp> = props => {
  const { reminders, remReminder, clearAll } = props;

  const close = () => clearAll();

  const iknow = async (_index: number) => {
    const value = reminders[_index]?.clickUrl;
    if (value) {
      let url = value;
      const protocalSplitSign = '://';
      const [protocal] = value.split(protocalSplitSign);
      if (protocal === value) {
        url = 'http://' + url;
      }
      // 处理需要加密的URL，如果不含有加密的标志 enc=1，会原样返回
      const processedUrl = await worktableApi.encryptedReportUrl(url);
      window.open(processedUrl);
      reminderApi.trackLog(reminders[_index].id);
    }
    remReminder(_index);
  };

  // const startToEnd = (item: AdvertisingReminderInfo) => {
  //   const { scheduleStartDate, scheduleEndDate } = item;
  //   if (!scheduleStartDate || !scheduleEndDate) return '';
  //   // 系统时区
  //   const systemTimeZone = systemApi.getSystemTimeZone()?.key || 8;
  //   const startMoment = moment(scheduleStartDate).utcOffset(systemTimeZone);
  //   const endMoment = moment(scheduleEndDate).utcOffset(systemTimeZone);
  //   // 同一天
  //   if (startMoment.format('YYYY-MM-DD') === endMoment.format('YYYY-MM-DD')) {
  //     return startMoment.format('YYYY-MM-DD HH:mm') + '-' + endMoment.format('HH:mm');
  //   }
  //   return startMoment.format('YYYY-MM-DD HH:mm') + '-' + endMoment.format('YYYY-MM-DD HH:mm');
  // };

  return (
    <div className={style.advertisingReminder + ' sirius-scroll'}>
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
        <span className={style.headTitle}>{reminders[0]?.notice}</span>
        <IconCard className={style.close + ' sirius-no-drag'} type="close" onClick={close} />
      </div>
      <div className={style.reminderList + ' sirius-no-drag'}>
        {reminders.map((item: AdvertisingReminderInfo, index) => (
          <div className={style.reminder}>
            <div className={style.reminderTitle}>
              {/* <span className={style.reminderTimeLeft}>{item?.reminder || ''}</span> */}
              <span className={style.reminderName}>{item?.title || '--'}</span>
            </div>
            <div className={style.reminderDesc}>
              <span className={style.reminderSponsorText}>{item?.content || '--'}</span>
            </div>
            <div className={style.buttArea}>
              <SiriusButton className="sirius-no-drag" btnType="primary" onClick={() => iknow(index)}>
                {item?.clickName || getIn18Text('CHAKANXIANGQING')}
              </SiriusButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AdvertisingReminder;
