import React from 'react';
import { Switch } from 'antd';
import { apiHolder, NIMApi, Session } from 'api';
import { useObservable } from 'rxjs-hooks';
import { Observable } from 'rxjs';
import { combineLatestWith, map, pluck, tap } from 'rxjs/operators';
import styles from './teamSetting.module.scss';
import { getIn18Text } from 'api';
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
export interface TeamSetSticktopProps {
  teamId: string;
}
export const TeamSetSticktop: React.FC<TeamSetSticktopProps> = props => {
  const { teamId /* curUserId */ } = props;
  const $isStickTop = useObservable(
    (_, $props) => {
      const sessionSubject = nimApi.sessionStream.getSubject() as Observable<Session[]>;
      return $props.pipe(
        map(([id]) => id),
        combineLatestWith(sessionSubject),
        map(([to, sessionList]) => sessionList.find(item => item.to === to) as Session),
        tap(flag => {
          console.log('[setStickTop]before distinct', flag);
        }),
        pluck('isTop')
      );
    },
    false,
    [teamId]
  );
  // 置顶功能
  const toggleStickTop = () => {
    if ($isStickTop) {
      nimApi.excuteSync('deleteStickTopSession', {
        id: `team-${teamId}`,
      });
    } else {
      nimApi.excuteSync('addStickTopSession', {
        id: `team-${teamId}`,
        topCustom: JSON.stringify({ createTime: new Date().getTime() }),
      });
    }
  };
  return (
    <div className={`ant-allow-dark ${styles.settingItem}`} data-test-id="im_session_setting_top_wrapper">
      <span className={styles.settingLabel}>{getIn18Text('XIAOXIZHIDING')}</span>
      <Switch
        onChange={() => {
          toggleStickTop();
        }}
        checked={$isStickTop}
      />
    </div>
  );
};
