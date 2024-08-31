import { NIMApi, apiHolder, Team } from 'api';
import { useObservable } from 'rxjs-hooks';
import { Observable, of } from 'rxjs';
import { useEffect } from 'react';

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

export function useImTeam(teamId: string, isForceUpdate = false) {
  useEffect(() => {
    nimApi.imteamStream.requestTeamById(teamId, isForceUpdate);
  }, []);
  return useObservable(() => nimApi.imteamStream.getTeamById(of(teamId)) as Observable<Team>, undefined, [teamId]);
}

export function useImTeamType(teamId: string, scene = 'team') {
  useEffect(() => {
    nimApi.imteamStream.requestTeamById(teamId);
  }, []);
  const teamInfo = useObservable(() => nimApi.imteamStream.getTeamById(of(teamId)) as Observable<Team>, undefined, [teamId]);
  let teamType = 'normal';
  try {
    teamType = JSON.parse(teamInfo?.serverCustom || '{}').eteam ? 'discuss' : 'normal';
  } catch (e) {}
  return teamType;
}

export function useIMTeamField(teamId: string, field = 'teamId') {
  return useObservable((_, $props) => nimApi.imteamStream.getTeamField($props) as Observable<Team[keyof Team]>, '', [teamId, field]);
}
