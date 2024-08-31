import React, { useEffect, useState } from 'react';
import { PageProps } from 'gatsby';
import { CatalogUnionApi, ReminderInfo, apiHolder as api, apis } from 'api';
import ScheduleReminderCont from '@web-common/components/UI/ScheduleReminder/scheduleReminderCont';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import EscCloseHotKey from '@web-common/components/UI/GlobalHotKeys/EscCloseHotKey';
import useDebounceForEvent from '@web-mail/hooks/useDebounceForEvent';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import { cloneDeep } from 'lodash';
import SiriusLayout from '../layouts';

const eventApi = api.api.getEventApi();
const sysApi = api.api.getSystemApi();
const catalogApi: CatalogUnionApi = api.api.requireLogicalApi(apis.catalogApiImpl) as CatalogUnionApi;

// 日程提醒页
const ScheduleReminderPage: React.FC<PageProps> = () => {
  const [data, setData] = useState<{ reminders: ReminderInfo[] }>({ reminders: [] });

  useCommonErrorEvent('scheduleReminderErrorOb');

  // 计算日程提醒高度
  const calcHeight = (curReminders: ReminderInfo[]) => {
    if (!curReminders?.length) return 0;
    // 超过两个用最大高度
    if (curReminders.length > 2) {
      return 64 + 206 * 2 + 116 - 20;
    }
    // 顶栏64
    let finalHeight = 64;
    curReminders.forEach((item: ReminderInfo) => {
      const { location, title } = item;
      let baseHeight = 206;
      // 无地址
      if (!location?.length) baseHeight -= 30;
      // 标题两行
      if (title?.length > 15) baseHeight += 24;
      finalHeight += baseHeight;
    });
    // 首条数据顶部 - 20
    return finalHeight - 20;
  };

  const setWinBounds = async (newReminders: ReminderInfo[], mode?: string) => {
    const bodyClassName = document.body.className;
    if (!bodyClassName.includes('sirius-drag')) {
      document.body.className += ' sirius-drag';
    }
    // 宽高
    const width = 360;
    const height = calcHeight(newReminders);
    // 只设size
    if (mode === 'size') {
      await window.electronLib.windowManage.setBounds({ width, height });
      return;
    }
    const priScreen = await window.electronLib.windowManage.getPrimaryScreen();
    const { workAreaSize, bounds } = priScreen;
    await window.electronLib.windowManage.setBounds({ x: bounds.x + workAreaSize.width - width - 20, y: bounds.y + 20, width, height });
    return;
  };

  // 设置显隐和宽高
  const setShowAndBounds = useDebounceForEvent(async (newReminders: ReminderInfo[]) => {
    // 是否隐藏
    const isVis = await window.electronLib.windowManage.isVisible();
    // 展示中 赋值 设置新的坐标宽高
    if (isVis) {
      await setWinBounds(newReminders, 'size');
    } else {
      await setWinBounds(newReminders);
    }
    // 设置坐标宽高需要时间，故延时展示！
    setTimeout(() => {
      window.electronLib.windowManage.show();
    }, 1000);
  }, 500);

  const filterDuplicateReminder = (curReminders: ReminderInfo[]) => {
    // if (data.reminders.length <= 0) return curReminders;
    const duplicateReminders: ReminderInfo[] = [];
    // 按照<日历id_会议开始时间_提醒内容>去重
    const res = Array.from(
      [...curReminders, ...data.reminders]
        .reduce((m, item) => {
          const { scheduleId, scheduleStartDate, reminder, deadline } = item;
          // 日历id_会议开始时间_提醒内容
          const reminderItem = `${scheduleId}_${scheduleStartDate}_${reminder}`;
          // 日历id_会议开始时间_提醒时间戳 为入库标识ID
          const dbReminderId = `${scheduleId}_${scheduleStartDate}_${deadline}`;
          // 重复的日程直接入库，不再提示
          if (m.has(reminderItem)) {
            const r = m.get(reminderItem);
            // 重复的提醒内容，不同的提醒时间，更新到DB，不再提示
            if (r && dbReminderId !== `${r.scheduleId}_${r.scheduleStartDate}_${r.deadline}`) {
              duplicateReminders.push(item);
            }
          } else {
            m.set(reminderItem, item);
          }
          return m;
        }, new Map())
        .values()
    );
    if (duplicateReminders.length) {
      catalogApi.doPutScheduleReminderDB(duplicateReminders);
    }
    return res;
  };

  // 添加提醒
  const addReminder = useCreateCallbackForEvent((eventData: any) => {
    console.log('**** scheduleReminder received :', eventData);
    const { reminders: inReminders, eventType } = eventData;
    if (eventType !== 'scheduleReminder') return;
    const len = inReminders?.length || 0;
    if (!len) return;
    const filteredReminders = filterDuplicateReminder(inReminders);
    if (filteredReminders.length <= 0) return;
    // const newReminders = [...inReminders, ...data.reminders];
    setData(cloneDeep({ ...data, reminders: filteredReminders }));
    setShowAndBounds(filteredReminders);
  });

  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('customNotification', {
      name: 'customNotificationAddReminder',
      func: ({ eventData }) => {
        addReminder(eventData);
      },
    });

    // const eid1 = eventApi.registerSysEventObserver('electronClose', {
    //   func: () => {
    //     // 清空关闭
    //     setData({ reminders: [] });
    //     sysApi.closeWindow();
    //   },
    // });
    return () => {
      eventApi.unregisterSysEventObserver('customNotification', eid);
      // eventApi.unregisterSysEventObserver('electronClose', eid1);
    };
  }, []);

  // 移除提醒
  const remReminder = async (_index: number) => {
    const curReminders = cloneDeep(data.reminders || []);
    if (curReminders[_index]) {
      catalogApi.doPutScheduleReminderDB([curReminders[_index]]);
    }
    curReminders.splice(_index, 1);
    console.log('curReminderscurReminders', curReminders);
    // 为空隐藏
    if (!curReminders?.length) {
      setData({ ...data, reminders: [] });
      setTimeout(() => {
        window.electronLib.windowManage.hide();
      });
    } else {
      setWinBounds(curReminders, 'size');
      setData({
        ...data,
        reminders: curReminders,
      });
    }
  };

  const clearAll = () => {
    catalogApi.doPutScheduleReminderDB(data.reminders);
    setData({ reminders: [] });
    setTimeout(() => {
      window.electronLib.windowManage.hide();
    });
  };

  return (
    <EscCloseHotKey>
      <SiriusLayout.ContainerLayout isLogin={false}>
        <ScheduleReminderCont reminders={data.reminders || []} remReminder={remReminder} clearAll={clearAll} />
      </SiriusLayout.ContainerLayout>
    </EscCloseHotKey>
  );
};

export default ScheduleReminderPage;
console.info('---------------------end ScheduleReminderPage page------------------');
