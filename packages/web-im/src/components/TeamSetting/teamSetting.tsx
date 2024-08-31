import React, { useState, useEffect, useContext, useRef } from 'react';
import { Button, Modal, Skeleton } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder, apis, IMTeamApi, ContactModel, IMUser, NIMApi, Team as IMTeamInfo, ContactAndOrgApi } from 'api';
import lodashGet from 'lodash/get';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import { useObservable } from 'rxjs-hooks';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { Context as MemberContext, TeamMemberInfo } from '../../subcontent/store/memberProvider';
import { SIDE_BAR_WIDTH, getBodyFixHeight } from '@web-common/utils/constant';
import { MemberChooserModal } from '../MemberChooser/memberChooser';
import { TeamInfoEditorModal } from '../TeamInfoEditor/teamInfoEditor';
import OwnerTransfer from '../OwnerTransfer/ownerTransfer';
import { MemberItem } from './member';
import EditIcon from '@web-common/components/UI/Icons/svgs/EditPenSvg';
import CloseIcon from '@web-common/components/UI/Icons/svgs/CloseMailSvg';
import styles from './teamSetting.module.scss';
import { TeamAvatar } from '../../common/imUserAvatar';
import AvatarEditor from '@web-common/components/UI/AvatarEditor/avatarEditor';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { transAvatarSize } from '@web-common/utils/contact_util';
import { getThumbnailImg } from '../../common/imgVideoHandle';
import { TeamSetSticktop } from './setStickTop';
import { TeamSetAllowSearch } from './setAllowSearch';
import { TeamSetMute } from './setMute';
import { TEAM_AUTH_EXPLAIN } from '../../utils/im_team_util';
import { transTeamMember2ContactItem } from '@web-common/components/util/contact';
import { getIn18Text } from 'api';
const imTeamApi = apiHolder.api.requireLogicalApi(apis.imTeamApiImpl) as IMTeamApi;
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactAndOrgApi;
export const modalProps = {
  cancelText: getIn18Text('QUXIAO'),
  okText: getIn18Text('QUEDING'),
  centered: true,
  destroyOnClose: true,
  maskClosable: true,
  closeIcon: <CloseIcon />,
  maskStyle: { background: 'rgba(0, 0, 0, 0.32)', top: `${getBodyFixHeight()}px`, left: `${SIDE_BAR_WIDTH}px` },
};
export interface Member {
  accid: string;
  createtime: number;
  custom: any;
  mute: boolean;
  nick: string;
  updatetime: number;
}
export interface TeamDetailProfile {
  admins: Member[];
  anno_json: string;
  announcement: string;
  intro: string;
  members: Member[];
  mute: boolean;
  owner: Member;
  size: number;
  tid: string;
  tname: string;
  custom: string;
}
export interface TeamContactModel extends ContactModel {
  isOwner?: boolean;
  isManager?: boolean;
}
export interface TeamSettingProps {
  onClose?: Function;
  teamId: string;
  curUserId: string;
  teamName: string | null;
  isTop?: boolean;
  isMute?: boolean;
  ownerId: string;
  teamInfo: IMTeamInfo;
}
const TeamSetting: React.FC<TeamSettingProps> = props => {
  const { onClose, teamId /* curUserId */, teamName, ownerId, teamInfo } = props;
  const [members, setMembers] = useState<TeamMemberInfo[]>([]); // 群成员
  // 是否允许搜索群
  const allowSearch = !!JSON.parse(teamInfo?.serverCustom || '{}').public_team;
  // 自己的个人信息
  const myAccount = useObservable(() => nimApi.imself.getMyField(), '');
  const myName = useObservable(() => {
    return nimApi.imself.getMyField('nick');
  }, '');
  const intro = useObservable(
    (_, $props) => {
      const _intro = nimApi.imteamStream.getTeamField($props) as Observable<string>;
      return _intro.pipe(
        map(info => {
          let introObj = {};
          try {
            introObj = JSON.parse(info) as {
              text: string;
              accid: string;
              create_time: number;
            } as {
              text: string;
            };
          } catch (ex) {}
          return lodashGet(introObj, 'text', '');
        })
      );
    },
    '',
    [teamId, 'intro']
  );
  const [editorVisible, setEditorVisible] = useState<boolean>(false);
  const [ownerTransferVisible, setOwnerTransferVisible] = useState<boolean>(false);
  const [addMemberVisible, setAddMemberVisible] = useState<boolean>(false);
  const [listLoading, setListLoading] = useState<boolean>(false);
  const { state: teamMemberList } = useContext(MemberContext);
  const [myRole, setMyRole] = useState<'normal' | 'owner' | 'manager'>('normal');
  const [showAvatarEditor, setShowAvatarEditor] = useState<Boolean>(false);
  const [curAvatar, setCurAvatar] = useState<File | string>();
  const teamAvatarInputRef = useRef<HTMLInputElement>(null);
  const [specialIdentity, setSpecialIdentity] = useState<boolean>(false);
  const [iconNameColor, setIconNameColor] = useState<string>('');
  const [iconIntroColor, setIconIntroColor] = useState<string>('');
  useEffect(() => {
    // 根据群成员角色展示排序
    const ownerList = teamMemberList.filter(item => item.type === 'owner');
    const managerList = teamMemberList.filter(item => item.type === 'manager');
    const normalList = teamMemberList.filter(item => item.type === 'normal');
    setMembers([...ownerList, ...managerList, ...normalList]);
  }, [teamMemberList, ownerId]);
  useEffect(() => {
    const realRole = teamMemberList.find(item => lodashGet(item, 'user.account', '') === myAccount)?.type || 'normal';
    // @ts-ignore
    setMyRole(realRole);
  }, [teamMemberList.length, myAccount]);
  const editTeamInfo = () => {
    setEditorVisible(true);
  };
  const removeTeam = () => {
    Modal.confirm({
      title: getIn18Text('JIESANQUNZU'),
      content: getIn18Text('JIESANHUIYICHU'),
      okText: getIn18Text('JIESAN'),
      cancelText: getIn18Text('QUXIAO'),
      async onOk() {
        const ret = await imTeamApi.removeTeam({
          owner: members[0]?.user?.account || '',
          team_id: teamId,
        });
        console.log(ret);
        onClose && onClose();
      },
      width: '448px',
      className: 'im-team',
      centered: true,
    });
  };
  const quitTeam = () => {
    Modal.confirm({
      title: getIn18Text('TUICHUQUNZU'),
      content: `确定退出${teamName}吗？退出后将不再接收此群组消息`,
      async onOk() {
        const ret = await imTeamApi.quitTeam({
          acc_id: myAccount,
          team_id: teamId,
        });
        console.log(ret);
        onClose && onClose();
      },
      width: '448px',
      className: 'im-team',
      ...modalProps,
      okText: getIn18Text('TUICHU'),
    });
  };
  const removeMember: (member: TeamMemberInfo) => void = member => {
    const { account: memberId, nick: memberName } = member.user as IMUser;
    Modal.confirm({
      title: getIn18Text('YICHUQUNCHENGYUAN'),
      content: `移除后，${memberName}将无法再接收该会话消息`,
      async onOk() {
        await imTeamApi.removeMember({
          owner: myAccount as string,
          team_id: teamId,
          members: memberId,
        });
      },
      width: '448px',
      className: 'im-team',
      ...modalProps,
      okText: getIn18Text('YICHU'),
    });
  };
  // 添加管理员
  const addManager: (member: TeamMemberInfo) => void = member => {
    const { account: memberId } = member?.user as IMUser;
    imTeamApi.addManager({
      members: memberId,
      owner: ownerId,
      team_id: teamId,
    });
  };
  // 移除管理员
  const removeManager: (member: TeamMemberInfo) => void = member => {
    const { account: mangerId } = member?.user as IMUser;
    imTeamApi.removeManager({
      members: mangerId,
      owner: ownerId,
      team_id: teamId,
    });
  };
  const transferOwner = () => {
    setOwnerTransferVisible(true);
  };
  // 转让群主
  const confirmTransferOwner = async newOwnerId => {
    await imTeamApi.changeOwner({
      new_owner: newOwnerId,
      owner: ownerId,
      team_id: teamId,
    });
    setOwnerTransferVisible(false);
    onClose && onClose();
  };
  const addMember = () => {
    setAddMemberVisible(true);
  };
  const updateTeamInfo = info => {
    if (!info) {
      return;
    }
    if (info.name && info.name !== teamInfo.name) {
      nimApi.excute('updateTeam', {
        teamId,
        name: info.name,
      });
    }
    // 是否要更新简介信息(原逻辑@何理维护 代码优化郭超维护)
    const flag = [() => lodashGet(intro, 'length', 0) !== 0 && info.intro !== intro, () => lodashGet(intro, 'length', 0) === 0 && info.intro].some(call => call());
    if (flag) {
      const intro = JSON.stringify({
        text: info.intro || '',
        accid: myAccount,
        create_time: Date.now(),
      });
      nimApi.excute('updateTeam', {
        teamId,
        intro,
      });
    }
    setEditorVisible(false);
  };
  useEffect(() => {
    setSpecialIdentity(TEAM_AUTH_EXPLAIN.teamAvatar.includes(myRole));
  }, [myRole]);
  // 修改群头像
  const checkAvatar = async () => {
    if (!specialIdentity) {
      return;
    }
    // 没有头像 唤起选择框
    if (!teamInfo?.avatar) {
      teamAvatarInputRef.current?.click();
    } else {
      const avatarUrl = await getThumbnailImg(teamInfo.avatar, {
        width: 480,
        height: 480,
      });
      const bigAvatar = transAvatarSize(avatarUrl, 'big');
      setCurAvatar(bigAvatar);
      setShowAvatarEditor(!showAvatarEditor);
    }
  };
  // 上传新的群头像
  const avatarInputChange = () => {
    const files = teamAvatarInputRef?.current?.files;
    if (files && files[0]) {
      const maxSize = 15 * 1024 * 1024;
      if (files[0].size > maxSize) {
        SiriusMessage.warn({ content: getIn18Text('TUPIANDAXIAOBU') });
        return;
      }
      setCurAvatar(files[0]);
      setShowAvatarEditor(true);
    }
  };
  const addTeamMember = async (members: TeamContactModel[]) => {
    const membersStr = members
      .map(member => {
        return contactApi.findContactInfoVal(member.contactInfo, 'yunxin');
      })
      .join(',');
    try {
      await imTeamApi.addMember(
        {
          members: membersStr,
          owner: myAccount as string,
          team_id: teamId,
        },
        false
      );
    } catch (ex) {
      message.fail(lodashGet(ex, 'message', getIn18Text('TIANJIASHIBAI')));
    }
    setAddMemberVisible(false);
  };
  return (
    <>
      <div className={styles.teamSettingWrapper}>
        <div className={styles.teamInfoBox}>
          {/* <DefaultTeamAvatar></DefaultTeamAvatar> */}
          <TeamAvatar avatarSize={40} teamId={teamId} teamInfo={teamInfo} hasHover={specialIdentity} onClick={checkAvatar} />
          {showAvatarEditor && curAvatar && <AvatarEditor avatar={curAvatar} teamId={teamInfo.teamId} hideAvatarEditor={() => setShowAvatarEditor(false)} />}
          <input
            ref={teamAvatarInputRef}
            type="file"
            accept="image/gif, image/jpeg, image/jpg, image/png"
            className={styles.teamAvatarUpload}
            onClick={event => {
              event.target.value = null;
            }}
            onChange={avatarInputChange}
          />
          <div
            className={`${styles.teamInfo} ${allowSearch ? styles.teamInfoMtop : ''}`}
            onMouseEnter={() => setIconNameColor('#2264DF')}
            onMouseLeave={() => setIconNameColor('')}
          >
            <div onClick={editTeamInfo}>
              <div className={styles.teamName}>
                <span>{teamName}</span>
                {/* <span>{name}</span> */}
                {TEAM_AUTH_EXPLAIN.teamNameIntro.includes(myRole) && (
                  <div data-test-id="im_session_setting_edit_name_icon" className={styles.editNameIcon}>
                    <EditIcon stroke={iconNameColor} />
                  </div>
                )}
              </div>
            </div>
            {allowSearch && (
              <div className={`${styles.teamDesc}`}>
                {getIn18Text('QUNHAO\uFF1A')}
                <span>{teamId}</span>
              </div>
            )}
          </div>
        </div>
        <div className={styles.settingBox}>
          <div className={styles.settingIntro}>
            <div className={styles.settingIntroTitle}>
              <span>{getIn18Text('QUNJIANJIE')}</span>
              {!intro && <span className={`${styles.settingDesc} ${styles.settingNoIntro}`}>{getIn18Text('(ZANWU)')}</span>}
              {TEAM_AUTH_EXPLAIN.teamNameIntro.includes(myRole) && (
                <div
                  data-test-id="im_session_setting_edit_desc_icon"
                  className={styles.editIntroIcon}
                  onClick={editTeamInfo}
                  onMouseEnter={() => setIconIntroColor('#2264DF')}
                  onMouseLeave={() => setIconIntroColor('')}
                >
                  <EditIcon stroke={iconIntroColor} />
                </div>
              )}
            </div>
            {intro && (
              <p data-test-id="im_session_setting_desc_text" className={styles.settingDesc}>
                {intro}
              </p>
            )}
          </div>
          {/* 消息免打扰 */}
          <TeamSetMute teamId={teamId} />
          {/* 消息置顶 */}
          <TeamSetSticktop teamId={teamId} />
          {/* 是否允许搜索 */}
          {myRole === 'owner' && <TeamSetAllowSearch teamName={teamName} teamId={teamId} allowSearch={allowSearch} />}
        </div>
        <div className={styles.teamMember}>
          <div className={styles.teamMemberTitle}>
            <span className={styles.label}>{getIn18Text('QUNCHENGYUAN')}</span>
          </div>
          <Skeleton loading={listLoading} active className={styles.listSkeleton}>
            <div className={styles.memberList}>
              <div className={styles.addButton} onClick={addMember}>
                <PlusOutlined data-test-id="im_session_setting_add_member_btn" className={styles.addButtonIcon} />
                {getIn18Text('TIANJIACHENGYUAN')}
              </div>
              {members.map(member => (
                <MemberItem
                  key={member.account}
                  member={member}
                  removeMember={removeMember}
                  addManager={addManager}
                  removeManager={removeManager}
                  myRoleType={myRole}
                  avatarSize={28}
                />
              ))}
            </div>
          </Skeleton>
        </div>
        <div className={styles.buttonBox}>
          {myAccount === ownerId ? (
            <>
              <Button data-test-id="im_session_setting_removegroup" danger onClick={removeTeam}>
                {getIn18Text('JIESANQUNZU')}
              </Button>
              <Button data-test-id="im_session_setting_transfergroup" onClick={transferOwner}>
                {getIn18Text('ZHUANRANGQUNZHU')}
              </Button>
            </>
          ) : (
            <Button data-test-id="im_session_setting_quitgroup" onClick={quitTeam} danger>
              {getIn18Text('TUICHUQUNZU')}
            </Button>
          )}
        </div>
      </div>
      <TeamInfoEditorModal
        name={teamInfo?.customTeamName}
        teamId={teamInfo?.teamId}
        intro={intro}
        visible={editorVisible}
        onOk={updateTeamInfo}
        onCancel={() => {
          setEditorVisible(false);
        }}
      />
      <SiriusModal
        title={getIn18Text('ZHUANRANGQUNZHU')}
        width={600}
        wrapClassName="im-change-owner"
        visible={ownerTransferVisible}
        footer={null}
        onCancel={() => {
          setOwnerTransferVisible(false);
        }}
        {...modalProps}
      >
        <OwnerTransfer
          onConfirm={confirmTransferOwner}
          onCancel={() => {
            setOwnerTransferVisible(false);
          }}
          members={members}
        />
      </SiriusModal>
      <MemberChooserModal
        visible={addMemberVisible}
        chosenMembers={members.map(item => transTeamMember2ContactItem(item))}
        onOk={addTeamMember}
        onCancel={() => {
          setAddMemberVisible(false);
        }}
      />
    </>
  );
};
export default TeamSetting;
