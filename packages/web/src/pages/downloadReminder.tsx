import React, { useEffect, useState, useCallback, useRef } from 'react';
import { PageProps } from 'gatsby';
import { DownloadReminderInfo, apiHolder as api } from 'api';
import DownloadReminderCont from '@web-common/components/UI/DownloadReminder/downloadReminderCont';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import EscCloseHotKey from '@web-common/components/UI/GlobalHotKeys/EscCloseHotKey';
import useDebounceForEvent from '@web-mail/hooks/useDebounceForEvent';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import { cloneDeep, debounce } from 'lodash';
import SiriusLayout from '../layouts';

const eventApi = api.api.getEventApi();
const systemApi = api.api.getSystemApi();

// 下载提醒页
const DownloadReminderPage: React.FC<PageProps> = () => {
  const [data, setData] = useState<{ reminders: DownloadReminderInfo[] }>({ reminders: [] });
  const mouseInRef = useRef(false);

  useCommonErrorEvent('downloadReminderErrorOb');

  // 计算下载完成提醒高度
  const calcHeight = (curReminders: DownloadReminderInfo[]) => {
    if (!curReminders?.length) return 0;
    // 超过三个用最大高度
    if (curReminders.length > 3) return 260;
    // 顶栏64
    let topHeight = 58;
    return topHeight + 54 * curReminders.length + 12;
  };

  const hideWin = () => {
    if (!systemApi.getIsLowMemoryModeSync()) {
      window.electronLib.windowManage.hide();
    } else {
      window.electronLib.windowManage.close();
    }
  };

  const debounceHideReminder = useCallback(
    debounce(() => {
      if (mouseInRef.current !== true) {
        // 清空并关闭
        setData({ reminders: [] });
        setTimeout(() => {
          hideWin();
        });
      }
    }, 5 * 1000),
    []
  );

  const setWinBounds = async (newReminders: DownloadReminderInfo[], mode?: string) => {
    const bodyClassName = document.body.className;
    if (!bodyClassName.includes('sirius-drag')) {
      document.body.className += ' sirius-drag';
    }
    // 宽高
    const width = 360;
    const height = calcHeight(newReminders);

    const priScreen = await window.electronLib.windowManage.getPrimaryScreen();
    const { workAreaSize, bounds } = priScreen;

    // 一般情况
    // if(!mode) {
    // 距离底部80
    await window.electronLib.windowManage.setBounds({
      x: bounds.x + workAreaSize.width - width - 20,
      y: bounds.y + workAreaSize.height - 80 - height,
      width,
      height,
    });
    // }

    // 基于底部
    // if(mode === 'baseBottom') {
    //   const bounds = await window.electronLib.windowManage.getBounds();

    // }

    return;
  };

  // 设置显隐和宽高
  const setShowAndBounds = useDebounceForEvent(async (newReminders: DownloadReminderInfo[]) => {
    // 是否隐藏
    const isVis = await window.electronLib.windowManage.isVisible();
    // 展示中 基于当下底部往上累加
    if (isVis) {
      await setWinBounds(newReminders, 'baseBottom');
      debounceHideReminder();
    } else {
      await setWinBounds(newReminders);
      // 设置坐标宽高需要时间，故延时展示！
      setTimeout(() => {
        window.electronLib.windowManage.show();
        debounceHideReminder();
      }, 300);
    }
  }, 500);

  // 添加提醒
  const addReminder = useCreateCallbackForEvent((eventData: any) => {
    console.log('**** downloadReminder received :', eventData);
    const { reminders: inReminders, eventType } = eventData;
    if (eventType !== 'downloadReminder') return;
    const len = inReminders?.length || 0;
    if (!len) return;
    const newReminders = [...inReminders, ...data.reminders];
    setData(cloneDeep({ ...data, reminders: newReminders }));
    // 自动滚到顶部
    setTimeout(() => {
      const downloadReminderDiv = document.getElementById('downloadReminder');
      // 元素存在 且鼠标不在上面 滚动到顶部
      if (downloadReminderDiv && mouseInRef.current !== true) {
        downloadReminderDiv.scrollTop = 0;
      }
    }, 10);
    setShowAndBounds(newReminders);
  });

  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('customNotification', {
      name: 'customNotificationAddDownloadReminder',
      func: ({ eventData }) => {
        addReminder(eventData);
      },
    });

    return () => {
      eventApi.unregisterSysEventObserver('customNotification', eid);
    };
  }, []);

  // 关闭并清空提醒
  const clearAll = () => {
    setData({ reminders: [] });
    setTimeout(() => {
      hideWin();
    });
  };

  const mouseEnterAction = () => {
    mouseInRef.current = true;
  };

  const mouseLeaveAction = () => {
    mouseInRef.current = false;
    debounceHideReminder();
  };

  return (
    <EscCloseHotKey>
      <SiriusLayout.ContainerLayout isLogin={false}>
        <DownloadReminderCont reminders={data.reminders || []} clearAll={clearAll} mouseEnterAction={mouseEnterAction} mouseLeaveAction={mouseLeaveAction} />
      </SiriusLayout.ContainerLayout>
    </EscCloseHotKey>
  );
};

export default DownloadReminderPage;
console.info('---------------------end DownloadReminderPage page------------------');
