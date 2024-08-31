import React, { useContext, useEffect, useState } from 'react';
import { Drawer, Tooltip } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames/bind';
import { apiHolder, apis, IMTeamApi, SystemApi, NIMApi, DataTrackerApi, EntityContactItem, ContactModel } from 'api';
import lodashGet from 'lodash/get';
import { getDistanceFromTop } from '@web-im/utils/im_team_util';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { TeamAvatar } from '../common/imUserAvatar';
import { Context as teamsettingVisibleContext } from './store/teamsettingVisibleProvider';
import { Context as MemberContext } from './store/memberProvider';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import DiscussIntro from '@web-common/components/UI/DiscussIntro/discussIntro';
import styles from './imTeamChatHead.module.scss';
import { AddMembers as AddIcon, AddMembersSelected as AddSelectedIcon } from '@web-common/components/UI/Icons/svgs/AddMembers';
import { Anno as AnnoIcon, AnnoSelected as AnnoSelectedIcon } from '@web-common/components/UI/Icons/svgs/Anno';
import { Setting as SettingIcon, SettingSelected as SettingSelectedIcon } from '@web-common/components/UI/Icons/svgs/Setting';
import { TeamAnnoEditorModal } from '../components/TeamInfoEditor/teamInfoEditor';
import { MemberChooserModal } from '../components/MemberChooser/memberChooser';
import TeamSetting from '../components/TeamSetting/teamSetting';
import { TeamDiscussTag } from '../components/TeamSetting/teamDiscussTag';
import { useImTeam, useImTeamType } from '../common/hooks/useTeamInfo';
import { contactApi } from '@web-common/utils/contact_util';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(styles);
const imTeamApi = apiHolder.api.requireLogicalApi(apis.imTeamApiImpl) as IMTeamApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const findMyAccount = () => {
  const yunxinId: string = lodashGet(nimApi, '$instance.account', '');

  if (yunxinId && yunxinId.length) {
    return yunxinId;
  }

  return (
    lodashGet(systemApi.getCurrentUser(), 'contact.contactInfo', []).find((item: EntityContactItem) => {
      return item.contactItemType === 'yunxin';
    })?.contactItemVal || ''
  );
};

const inElectron = systemApi.isElectron();
const ImTeamChatHead: React.FC<{
  teamId: string;
}> = props => {
  const { teamId } = props;
  const topDis = getDistanceFromTop();
  const teamInfo = useImTeam(teamId, true);
  const { state: members } = useContext(MemberContext);
  const { state: teamsettingVisbleState, dispatch: dispatchTeamsettingVisible } = useContext(teamsettingVisibleContext);
  const [addMemberVisible, setAddMemberVisible] = useState<boolean>(false);
  const [settingVisible, setSettingVisible] = useState<boolean>(false);
  // 邮件讨论介绍弹窗
  const [shareIntro, setShareIntro] = useState<boolean>(false);
  const [tooltip, setTooltip] = useState<string>('');
  const [myAccount, setMyAccount] = useState(findMyAccount);

  useEffect(() => {
    if (myAccount && myAccount.length) {
      return;
    }
    const $t = setTimeout(() => {
      setMyAccount(findMyAccount());
    }, 1000);
    return () => {
      $t && clearTimeout($t);
    };
  }, [myAccount]);

  let discussGroup = useImTeamType(teamId, 'team') === 'discuss';
  const setAnnoEditorVisible = (visible: boolean) => {
    dispatchTeamsettingVisible({ annoEditorVisible: visible });
  };
  const setInfoEditorVisible = (visible: boolean) => {
    dispatchTeamsettingVisible({ infoEditorVisible: visible });
  };
  const toggleTeamSetting = () => {
    if (settingVisible) {
      setInfoEditorVisible(false);
    }
    setSettingVisible(!settingVisible);
    setTooltip('');
  };
  const openAnnoEditor = () => {
    setAnnoEditorVisible(true);
  };
  const closeAnnoEditor = () => {
    setAnnoEditorVisible(false);
  };
  const updateAnno = info => {
    const announcement = JSON.stringify({
      text: info.anno,
      accid: myAccount,
      create_time: Date.now(),
    });
    nimApi.excuteSync('updateTeam', {
      teamId,
      announcement,
    });
    closeAnnoEditor();
  };
  const closeMemberChooser = () => {
    setAddMemberVisible(false);
  };
  const openMemberChooser = async () => {
    setAddMemberVisible(true);
  };
  const addMembers = async (newMembers: ContactModel[]) => {
    const membersStr = newMembers
      .map(member => {
        return (
          member.contactInfo.find(item => {
            return item.contactItemType === 'yunxin';
          })?.contactItemVal || ''
        );
      })
      .join(',');
    closeMemberChooser();
    try {
      await imTeamApi.addMember(
        {
          members: membersStr,
          owner: myAccount,
          team_id: teamId,
        },
        false
      );
    } catch (ex) {
      message.info(lodashGet(ex, 'message', getIn18Text('TIANJIASHIBAI')));
    }
  };
  useEffect(() => {
    if (teamsettingVisbleState?.infoEditorVisible) {
      toggleTeamSetting();
    }
  }, [teamsettingVisbleState.infoEditorVisible]);
  const setSettingVisibleCb = () => setSettingVisible(false);
  useEffect(() => {
    nimApi.subCustomEvent('MESSAGE_SHORTCUTS_SEARCH', setSettingVisibleCb, {});
    return () => {
      nimApi.offCustomEvent('MESSAGE_SHORTCUTS_SEARCH', setSettingVisibleCb);
    };
  }, []);
  const getContainer = (): HTMLElement => (document.querySelector('.root-wrap') as HTMLElement) || document.body;
  const handleTrack = () => {
    trackApi.track('pc_click_mailChat_mailChatIntroduce');
  };
  return (
    <div className={realStyle('teamChatHeadWrapper')}>
      <TeamAvatar
        enableClick={systemApi.isElectron()}
        teamId={teamId}
        onClick={toggleTeamSetting}
        teamInfo={teamInfo}
        discussGroup={discussGroup}
        testId="im_session_content_avatar"
      />
      <p className={realStyle('nickname', discussGroup ? 'nicknameFlex' : '')}>
        <span className="sirius-no-drag" onClick={toggleTeamSetting}>
          <span data-test-id="im_session_content_name" className={realStyle('text')}>
            {teamInfo?.customTeamName || 'default_team'}（{teamInfo?.memberNum || '0'}）
          </span>
          {discussGroup ? (
            <>
              <TeamDiscussTag />
              <span
                className={realStyle('icon')}
                onClick={e => {
                  e.stopPropagation();
                  handleTrack();
                  setShareIntro(true);
                }}
              >
                <QuestionCircleOutlined style={{ fontSize: 12, color: '#7D8085' }} />
              </span>
            </>
          ) : null}
        </span>
      </p>
      <Tooltip title={getIn18Text('TIANJIACHENGYUAN')} visible={tooltip === 'add'} placement="bottom" overlayClassName="team-setting-tooltip">
        <span
          data-test-id="im_session_content_addmember_btn"
          className={classnames(styles.icon, {
            [styles.iconSelected]: addMemberVisible,
            'dark-invert': !addMemberVisible,
          })}
          onClick={openMemberChooser}
          onMouseEnter={() => setTooltip('add')}
          onMouseLeave={() => setTooltip('')}
        >
          {addMemberVisible ? <AddSelectedIcon /> : <AddIcon />}
        </span>
      </Tooltip>
      <Tooltip title={getIn18Text('QUNGONGGAO')} visible={tooltip === 'anno'} placement="bottom" overlayClassName="team-setting-tooltip">
        <span
          data-test-id="im_session_content_showanno_btn"
          className={classnames(styles.icon, {
            [styles.iconSelected]: teamsettingVisbleState?.annoEditorVisible,
            'dark-invert': !teamsettingVisbleState?.annoEditorVisible,
          })}
          onClick={openAnnoEditor}
          onMouseEnter={() => setTooltip('anno')}
          onMouseLeave={() => setTooltip('')}
        >
          {teamsettingVisbleState?.annoEditorVisible ? <AnnoSelectedIcon /> : <AnnoIcon />}
        </span>
      </Tooltip>
      <Tooltip title={getIn18Text('QUNSHEZHI')} visible={tooltip === 'set'} placement="bottom" overlayClassName="team-setting-tooltip">
        <span
          data-test-id="im_session_content_setting_btn"
          className={classnames(styles.icon, {
            [styles.iconSelected]: settingVisible,
            'dark-invert': !settingVisible,
          })}
          onClick={toggleTeamSetting}
          onMouseEnter={() => setTooltip('set')}
          onMouseLeave={() => setTooltip('')}
        >
          {settingVisible ? <SettingSelectedIcon /> : <SettingIcon />}
        </span>
      </Tooltip>
      <TeamAnnoEditorModal visible={teamsettingVisbleState!.annoEditorVisible} onOk={updateAnno} onCancel={closeAnnoEditor} teamId={teamId} />
      <MemberChooserModal
        visible={addMemberVisible}
        chosenMembers={members.map(item => ({
          contact: {
            accountName: lodashGet(item, 'user.email', ''),
          },
          contactInfo: [
            {
              contactItemType: 'yunxin',
              contactItemVal: lodashGet(item, 'user.account', ''),
            },
          ],
        }))}
        onOk={addMembers}
        onCancel={closeMemberChooser}
      />
      <Drawer
        width={456}
        className={realStyle('teamSettingDrawer')}
        placement="right"
        closable={false}
        onClose={toggleTeamSetting}
        visible={settingVisible}
        mask
        getContainer={getContainer}
        maskStyle={{
          backgroundColor: 'transparent',
          top: `-${topDis}px`,
          height: `calc(100% + ${topDis}px)`,
        }}
        contentWrapperStyle={{
          position: inElectron ? 'absolute' : 'fixed',
          top: `${topDis}px`,
          height: `calc(100% - ${topDis}px)`,
        }}
        destroyOnClose
      >
        <TeamSetting
          onClose={toggleTeamSetting}
          curUserId={myAccount || ''}
          teamId={teamId}
          ownerId={teamInfo?.owner || ''}
          teamName={teamInfo?.customTeamName || 'default_team'}
          teamInfo={teamInfo}
        />
      </Drawer>
      {/* 邮件讨论介绍弹窗 */}
      <Modal
        modalRender={() => <DiscussIntro close={() => setShareIntro(false)} hideBtn />}
        wrapClassName="discuss-intro-wrap"
        centered={true}
        visible={shareIntro}
        maskStyle={{ left: '68px', zIndex: 1090 }}
        getContainer={() => document.body}
      />
    </div>
  );
};
export default ImTeamChatHead;
