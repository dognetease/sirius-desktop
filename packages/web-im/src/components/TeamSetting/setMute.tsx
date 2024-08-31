import React from 'react';
import { Switch } from 'antd';
import { apiHolder, NIMApi } from 'api';
import { useObservable } from 'rxjs-hooks';
import { map, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import styles from './teamSetting.module.scss';
import { setSessionMute } from '../../common/rxjs/setSessionMute';
import { getIn18Text } from 'api';
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
export interface TeamSetMuteProps {
  teamId: string;
}
export const TeamSetMute: React.FC<TeamSetMuteProps> = props => {
  const { teamId /* curUserId */ } = props;
  const $isMuted = useObservable(
    (_, $props) => {
      if (!$props) {
        return of(false);
      }
      const $id = $props.pipe(map(ids => `team-${ids[0]}`));
      return nimApi.imnotify.subscribeMuteStatus($id, false);
    },
    false,
    [teamId]
  );
  // 设置静音状态
  const toggleTeamMute = (muteTeam: boolean) => {
    setSessionMute(
      {
        toAccount: teamId,
        ismute: muteTeam,
      },
      false
    );
  };
  return (
    <div className={`ant-allow-dark ${styles.settingItem}`} data-test-id="im_session_setting_mute_wrapper">
      <span className={styles.settingLabel}>{getIn18Text('XIAOXIMIANDARAO')}</span>
      <Switch
        onChange={() => {
          toggleTeamMute(!$isMuted);
        }}
        defaultChecked={false}
        checked={$isMuted}
      />
    </div>
  );
};
