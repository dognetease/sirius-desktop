import React from 'react';
import { isElectron, api, DataTrackerApi } from 'api';
import { config } from 'env_def';
const trackerApi = api.requireLogicalApi('dataTrackerApiImp') as DataTrackerApi;
const isDevOrTest = config('stage') === 'local' || config('stage') === 'test' || config('stage') === 'dev';
export const useHazel = () => {
  React.useEffect(() => {
    if (!(isElectron() && isDevOrTest)) return;
    const handler = (event: MessageEvent<any>) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'setHazelCookies' && window?.electronLib?.appManage?.setCookieStore) {
          const { cookies } = data.data;
          window.electronLib.appManage.setCookieStore({
            cookies: cookies.map((cookie: { name: string; value: string }) => {
              return {
                name: cookie.name,
                value: cookie.value,
                domain: '.cowork.netease.com',
                secure: true,
                sameSite: 'no_restriction',
              };
            }),
          });
        }
      } catch (e) {
        console.log('set cookie error', e);
        trackerApi.track('pc_disk_view_error', {
          type: 'useHazel',
          data: event.data,
        });
      }
    };
    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
    };
  }, []);
};
