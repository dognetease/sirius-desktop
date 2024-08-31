import React, { useEffect, useState } from 'react';

import { api } from 'api';
import { useGlobalEventObserver } from '@web-common/hooks/useEventObserver';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { hideGlobalNotification } from '@web-common/state/reducer/notificationReducer';
import GuideCarousel from '@web-common/components/GuideCarousel';

const systemApi = api.getSystemApi();
interface GlobalNotificationProps {}

const GlobalNotification: React.FC<GlobalNotificationProps> = () => {
  const dispatch = useAppDispatch();
  const id = systemApi.getCurrentUser()?.id;
  const version = useAppSelector(state => state.privilegeReducer.version);
  const globalNotification = useAppSelector(state => state.notificationReducer.globalNotification);
  const newbieTask = useAppSelector(state => state.notificationReducer.newbieTask);
  const [showNewbieTask, setShowNewbieTask] = useState(false);
  const [launchSuccess, setLaunchSuccess] = useState(false);

  useGlobalEventObserver('launchSuccessed', () => {
    setLaunchSuccess(true);
  });

  useEffect(() => {
    if (newbieTask) {
      setShowNewbieTask(true);
    }
  }, [newbieTask]);

  const onClose = () => {
    dispatch(hideGlobalNotification());
    if (globalNotification?.name) {
      localStorage.setItem(`${globalNotification.name}-${id}`, 'true');
    }
  };
  // 判断是否展示过
  if (globalNotification?.name) {
    if (localStorage.getItem(`${globalNotification.name}-${id}`)) {
      return null;
    }
  }
  if (!launchSuccess || !globalNotification || newbieTask || showNewbieTask || version === 'FASTMAIL_EXPIRED') {
    return null;
  }
  // if (globalNotification.type === 'render' && globalNotification.component) {
  //   return globalNotification.component
  // }
  if (globalNotification.type === 'carousel' && globalNotification.config) {
    return <GuideCarousel config={globalNotification.config} onClose={onClose} />;
  }
  return null;
};

export default GlobalNotification;
