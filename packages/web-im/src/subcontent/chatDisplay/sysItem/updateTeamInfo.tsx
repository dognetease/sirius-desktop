import React, { useMemo, useContext } from 'react';
import { inWindow, Team } from 'api';
import classnames from 'classnames/bind';
import style from '../../imChatList.module.scss';
import { Context as TeamsettingVisibleContext } from '../../store/teamsettingVisibleProvider';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
interface Props {
  fromAccount: string;
  enableClick: boolean;
  team: Partial<Team>;
  children(id: string): React.ReactElement;
}
const GRAY_LIST = [getIn18Text('QUNTOUXIANG')];
export const UpdateTeamInfo: React.FC<Props> = props => {
  const { fromAccount, team, enableClick, children: createUserComponent } = props;
  const { dispatch: dispatchTeamsettingVisible } = useContext(TeamsettingVisibleContext);
  const showEditor = (type: string) => {
    if (type === 'announcement') {
      dispatchTeamsettingVisible({ annoEditorVisible: true });
    } else {
      dispatchTeamsettingVisible({ infoEditorVisible: true });
    }
  };
  const getteam = (team: Partial<Team>) => {
    if (team.announcement) {
      return getIn18Text('QUNGONGGAO');
    }
    if (team.intro) {
      return getIn18Text('QUNJIANJIE');
    }
    if (team.name) {
      return getIn18Text('QUNMINGCHENG');
    }
    if (team.avatar) {
      return getIn18Text('QUNTOUXIANG');
    }
    return getIn18Text('QUNXINXI');
  };
  const msgType = useMemo(() => {
    if (team.announcement) {
      return 'announcement';
    }
    return 'info';
  }, []);
  const teamDesc = getteam(team);
  if (teamDesc === getIn18Text('QUNXINXI')) {
    return <span className={realStyle('defaultLabelName')}>{getIn18Text('QUNXINXIBIANGENG')}</span>;
  }
  const wordSeparator = inWindow() && window.systemLang === 'en' ? ' ' : '';
  return (
    <>
      {createUserComponent(fromAccount)}
      <span>
        {getIn18Text('GENGXINLE')}
        {wordSeparator}
        {enableClick ? (
          <span className={realStyle(GRAY_LIST.includes(teamDesc) ? 'mentionUserGray' : 'mentionUserLink')} onClick={() => showEditor(msgType)}>
            {teamDesc}
          </span>
        ) : (
          <span className={realStyle('defaultLabelName')}>{teamDesc}</span>
        )}
      </span>
    </>
  );
};
