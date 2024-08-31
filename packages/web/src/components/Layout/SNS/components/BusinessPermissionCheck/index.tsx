import { getIn18Text } from 'api';
import React, { useEffect, useState, useCallback } from 'react';
import { api, apis, InsertWhatsAppApi } from 'api';
import { NoPermissionPage } from '@/components/UI/PrivilegeEnhance';
import style from './style.module.scss';

enum State {
  loading = 'loading',
  hasPermission = 'hasPermission',
  noPermission = 'noPermission',
}

const insertWhatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
// 接口缓存
let getAccountPromise: null | Promise<any> = null;

export const BusinessPermissionCheck: React.FC = props => {
  const { children } = props;
  const [state, setState] = useState<State>(State.loading);

  const checkPermission = useCallback(async () => {
    if (!getAccountPromise) {
      getAccountPromise = insertWhatsAppApi.getWhatsAppAccountList();
    }
    try {
      const res = await getAccountPromise;
      const hasPermission = (res?.whatsAppSenderList ?? []).some((item: any) => item.senderType === 'BUSINESS');
      setState(hasPermission ? State.hasPermission : State.noPermission);
    } catch (e) {
      setState(State.noPermission);
    }
  }, []);

  useEffect(() => {
    checkPermission();
  });

  if (state === State.loading) {
    return <></>;
  }

  if (state === State.hasPermission) {
    return <>{children}</>;
  }

  return (
    <div className={style.wrapper}>
      <NoPermissionPage title={getIn18Text('ZANWUSHANGYEHAOQUANXIAN')} />
    </div>
  );
};
