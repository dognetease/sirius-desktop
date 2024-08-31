import React, { useState, useEffect, useMemo } from 'react';
import qs from 'querystring';
import { api } from 'api';
import { useLocation } from '@reach/router';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { removeModuleNotification } from '@web-common/state/reducer/notificationReducer';
import GuideCarousel from '@web-common/components/GuideCarousel';

const systemApi = api.getSystemApi();
interface ModuleNotificationProps {}

const ModuleNotification: React.FC<ModuleNotificationProps> = () => {
  const id = systemApi.getCurrentUser()?.id;
  const location = useLocation();
  const dispatch = useAppDispatch();
  const version = useAppSelector(state => state.privilegeReducer.version);
  const globalNotification = useAppSelector(state => state.notificationReducer.globalNotification);
  const moduleNotifications = useAppSelector(state => state.notificationReducer.moduleNotifications);
  const [cacheGlobalNotificationVisibleUrl, setCacheGlobalNotificationVisibleUrl] = useState('');
  const params = qs.parse(location.hash.split('?')[1]);

  const currentNotification = useMemo(() => {
    const moduleName = location.hash.substring(1).split('?')[0];
    const params = new URLSearchParams(location.hash.split('?')[1]);
    const pageValue = params.get('page');
    if (globalNotification && !localStorage.getItem(`${globalNotification.name}-${id}`)) {
      setCacheGlobalNotificationVisibleUrl(location.hash);
      return null;
    }
    if (location.hash === cacheGlobalNotificationVisibleUrl) {
      return null;
    }
    if (moduleName) {
      const found = moduleNotifications.find(item => item.module === moduleName);
      if (found) {
        return found;
      }
    } else if (pageValue) {
      const found = moduleNotifications.find(item => item.pages && item.pages.includes(pageValue));
      if (found) {
        return found;
      }
    }
    return null;
  }, [globalNotification, moduleNotifications, location.hash]);
  const onClose = () => {
    const index = moduleNotifications.findIndex(item => item === currentNotification);
    dispatch(removeModuleNotification(index));
    if (currentNotification?.name) {
      localStorage.setItem(`${currentNotification.name}-${id}`, 'true');
    }
  };

  if (params.from === 'noviceTask' || !currentNotification || version === 'FASTMAIL_EXPIRED') return null;

  if (currentNotification.type === 'carousel' && currentNotification.config) {
    return <GuideCarousel config={currentNotification.config} onClose={onClose} />;
  }
  return null;
};

export default ModuleNotification;
