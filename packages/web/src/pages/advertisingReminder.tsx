import React, { useEffect, useState } from 'react';
import { PageProps } from 'gatsby';
import { AdvertisingReminderInfo, apiHolder as api } from 'api';
import AdvertisingReminder from '@web-common/components/UI/AdvertisingReminder/advertisingReminder';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import EscCloseHotKey from '@web-common/components/UI/GlobalHotKeys/EscCloseHotKey';
import useDebounceForEvent from '@web-mail/hooks/useDebounceForEvent';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import { cloneDeep } from 'lodash';
import SiriusLayout from '../layouts';
const { isMac } = api.env;
const eventApi = api.api.getEventApi();
const countChars = (str: string) => {
  let totalCount = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if ((code >= 0x0000 && code <= 0x007f) || (code >= 0xff00 && code <= 0xffef)) {
      // 英文、数字和半角标点占1位
      totalCount += 1;
    } else {
      // 中文、全角标点和其他字符占2位
      totalCount += 2;
    }
  }
  return totalCount;
};
// 日程提醒页
const AdvertisingPage: React.FC<PageProps> = () => {
  const [data, setData] = useState<AdvertisingReminderInfo[]>([]);

  useCommonErrorEvent('advertisingErrorOb');

  // 计算日程提醒高度
  const calcHeight = (curReminders: AdvertisingReminderInfo[]) => {
    if (!curReminders?.length) return 0;
    // 超过两个用最大高度
    // if (curReminders.length > 2) {
    //   return 64 + 206 * 2 + 116 - 20;
    // }
    // 顶栏64
    let finalHeight = 64;
    const descContent = curReminders[0]?.content;
    if (descContent?.length) {
      const len = countChars(descContent);
      // 设每一行宽度为40个字符
      const baseLineLength = 41;

      if (len >= baseLineLength * 5) {
        finalHeight += 22 * 4;
      } else if (len >= baseLineLength * 4) {
        finalHeight += 22 * 3;
      } else if (len >= baseLineLength * 3) {
        finalHeight += 22 * 2;
      } else if (len >= baseLineLength * 2) {
        finalHeight += 22;
      }
      // else if (len >= baseLineLength * 3) {
      //   finalHeight += 22;
      // }
      // else {
      //   finalHeight += 22;
      // }
    }

    curReminders.forEach((item: AdvertisingReminderInfo) => {
      const { title } = item;
      let baseHeight = 172;
      // 无地址
      // if (!location?.length) baseHeight -= 30;
      // 标题两行
      if (countChars(title) > 36) baseHeight += 24;
      finalHeight += baseHeight;
    });
    // 首条数据顶部 - 20
    return finalHeight - 20;
  };

  const setWinBounds = async (newReminders: AdvertisingReminderInfo[]) => {
    const bodyClassName = document.body.className;
    if (!bodyClassName.includes('sirius-drag')) {
      document.body.className += ' sirius-drag';
    }
    // 宽高
    const width = 360;
    const height = calcHeight(newReminders);

    const priScreen = await window.electronLib.windowManage.getPrimaryScreen();
    const { workAreaSize, bounds } = priScreen;

    // 距离底部80
    await window.electronLib.windowManage.setBounds({
      x: bounds.x + workAreaSize.width - width - 20,
      y: bounds.y + workAreaSize.height - height + (isMac ? 20 : -20),
      width,
      height,
    });
  };

  // 设置显隐和宽高
  const setShowAndBounds = useDebounceForEvent(async (newReminders: AdvertisingReminderInfo[]) => {
    // 是否隐藏
    // const isVis = await window.electronLib.windowManage.isVisible();
    // 展示中 赋值 设置新的坐标宽高
    // if (isVis) {
    //   await setWinBounds(newReminders, 'baseBottom');
    // } else {
    await setWinBounds(newReminders);
    // }
    // 设置坐标宽高需要时间，故延时展示！
    setTimeout(() => {
      window.electronLib.windowManage.show();
    }, 1000);
  }, 500);

  // 添加提醒
  const addReminder = useCreateCallbackForEvent((eventData: any) => {
    console.log('**** advertisingReminder received :', eventData);
    const { reminders: inReminders, eventType } = eventData;
    if (eventType !== 'advertisingReminder') return;
    const len = inReminders?.length || 0;
    if (!len) return;
    // const filteredReminders = filterDuplicateReminder(inReminders);
    // if (filteredReminders.length <= 0) return;
    // const newReminders = [...inReminders, ...data.reminders];
    setData(inReminders);
    setShowAndBounds(inReminders);
  });

  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('customNotification', {
      name: 'advertisingAddReminder',
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
    const curReminders = cloneDeep(data || []);
    // if (curReminders[_index]) {
    //   catalogApi.doPutScheduleReminderDB([curReminders[_index]]);
    // }
    curReminders.splice(_index, 1);
    console.log('curReminderscurReminders', curReminders);
    // 为空隐藏
    if (!curReminders?.length) {
      setData([]);
      setTimeout(() => {
        window.electronLib.windowManage.hide();
      });
    } else {
      setWinBounds(curReminders);
      setData(curReminders);
    }
  };

  const clearAll = () => {
    // catalogApi.doPutScheduleReminderDB(data.reminders);
    setData([]);
    setTimeout(() => {
      window.electronLib.windowManage.hide();
    });
  };

  return (
    <EscCloseHotKey>
      <SiriusLayout.ContainerLayout isLogin={false}>
        <AdvertisingReminder reminders={data || []} remReminder={remReminder} clearAll={clearAll} />
      </SiriusLayout.ContainerLayout>
    </EscCloseHotKey>
  );
};

export default AdvertisingPage;
console.info('---------------------end AdvertisingPage page------------------');
