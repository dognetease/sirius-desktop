import React, { useState, useEffect } from 'react';
import { useObservable } from 'rxjs-hooks';
import classnames from 'classnames/bind';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { useLocation } from '@reach/router';
import ExclamationCircleFilled from '@ant-design/icons/ExclamationCircleFilled';
import { SearchTeamOrgModel, apiHolder, apis, IMTeamApi, NIMApi } from 'api';
import lodashGet from 'lodash/get';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './empty.module.scss';
import { TeamAvatar } from '../common/imUserAvatar';
import { openSession } from '../common/navigate';
import { MemberItem } from '../components/TeamSetting/member';
import { useYunxinAccounts } from '../common/hooks/useYunxinAccount';
import { TeamMemberInfo } from '../subcontent/store/memberReduce';
import { getIn18Text } from 'api';
const imHttpApi = apiHolder.api.requireLogicalApi(apis.imTeamApiImpl) as unknown as IMTeamApi;
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const realStyle = classnames.bind(style);
const TEAM_MEMBER_COUNT = 12;
interface Props {
  isModalVisible: boolean;
  keyword: string;
  closeModal: () => void;
}
export const TeamMembersComponent: React.FC<{
  teamMembers: string[];
  teamInfo;
}> = props => {
  const { teamMembers, teamInfo } = props;
  const userListMap = useYunxinAccounts(teamMembers.slice(0, TEAM_MEMBER_COUNT));
  const userList = Object.values(userListMap);
  return (
    <div className={realStyle('searchTeamExactMembers')}>
      {userList.map(member => {
        const item = { ...member, user: null, type: 'normal' } as unknown as TeamMemberInfo;
        item.user = member;
        if (item.account === lodashGet(teamInfo, 'owner', '')) {
          item.type = 'owner';
        } else if (lodashGet(teamInfo, 'admins', []).includes(item.account)) {
          item.type = 'manager';
        }
        return <MemberItem key={item.account} member={item} removeMember={() => {}} addManager={() => {}} removeManager={() => {}} myRoleType="normal" avatarSize={28} />;
      })}
    </div>
  );
};
export const SearchTeamExact: React.FC<Props> = props => {
  const { isModalVisible, keyword, closeModal } = props;
  const location = useLocation();
  const account = useObservable(() => nimApi.imself.getMyField(), '');
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const showFailModal = () => {
    Modal.error({
      title: `没有找到关于“${keyword}”的内部公开群组`,
      content: (
        <div>
          <p>{getIn18Text('1\u3001QINGJIANCHA')}</p>
          <p>{getIn18Text('2\u3001QUNZHUKE')}</p>
        </div>
      ),
      icon: <ExclamationCircleFilled />,
      okText: getIn18Text('ZHIDAOLE'),
      centered: true,
      className: realStyle('searchErrModal'),
    });
    closeModal();
  };
  // 点击“查找公开群组”进行搜索时，无结果展示无结果弹窗，点击入群按钮时始终resolve返回
  const getTeamInfo = (kw: string, type: string = 'init'): Promise<void> => {
    setLoading(true);
    return new Promise<void>((resolve, reject) => {
      imHttpApi
        .searchTeamPublic(kw)
        .then(result => {
          if (result?.data || type === 'add') {
            resolve(result);
          } else {
            showFailModal();
            reject();
          }
        })
        .finally(() => {
          setLoading(false);
        });
    });
  };
  useEffect(() => {
    if (teamInfo || !account) {
      return;
    }
    getTeamInfo(keyword).then(result => {
      const teamData = { ...lodashGet(result, 'data', {}) };
      const ownerAccount = lodashGet(result, 'data.owner', '');
      const members = [...lodashGet(result, 'data.admins', [])].concat([...lodashGet(result, 'data.members', [])]);
      members.unshift(ownerAccount);
      teamData.inTeam = members.includes(account);
      teamData.teamMembers = members;
      teamData.teamIntro = JSON.parse(lodashGet(result, 'data.intro', '') || '{}')?.text;
      teamData.avatar = lodashGet(result, 'data.icon', '');
      teamData.id = lodashGet(result, 'data.tid', '');
      setTeamInfo(teamData);
    });
  }, [account]);
  // 路由发生变化则认为页面切换，关闭弹窗
  useEffect(() => {
    if (isModalVisible && !!teamInfo) {
      closeModal();
    }
  }, [location.hash]);
  // 打开群组
  const triggerTeam = (info: SearchTeamOrgModel) => {
    const teamId = info?.id.replace(/[^\d]+/, '');
    openSession(
      {
        sessionId: `team-${teamId}`,
        mode: 'normal',
      },
      {
        createSession: true,
      }
    );
    closeModal();
  };
  const handleOk = () => {
    // 重新检查用户是否在群内
    // 1.用户在群内（a.原来就在群内 b.刚刚被邀入群） - 直接打开群会话
    // 2.用户不在群内（a.原来就不在群内 b.原来在群内被踢出群 ）- 重新入群打开群会话
    // 3.意外情况（a.群被解散 b.人数超上限）- 提示相应信息，关闭弹窗停留在当前位置
    getTeamInfo(keyword, 'add').then(result => {
      const ownerAccount = lodashGet(result, 'data.owner', '');
      const members = [...lodashGet(result, 'data.admins', [])].concat([...lodashGet(result, 'data.members', [])]);
      members.unshift(ownerAccount);
      const inTeam = members.includes(account);
      if (inTeam) {
        triggerTeam(teamInfo);
      } else if (members.length >= 1000) {
        message.error(getIn18Text('QUNRENSHUDADAO'));
        closeModal();
      } else {
        nimApi.excute('applyTeam', {
          teamId: teamInfo?.id,
          done: (err: Error, res: any) => {
            if (err) {
              if (lodashGet(err, 'code', '') === 809) {
                triggerTeam(teamInfo);
              } else {
                let errMsg = lodashGet(err, 'message', getIn18Text('QUNBUCUNZAIHUO')).replace('applyTeam error: ', '');
                lodashGet(err, 'code', '') === 803 && (errMsg = getIn18Text('QUNBUCUNZAIHUO'));
                message.error(errMsg);
              }
              closeModal();
            } else {
              triggerTeam(teamInfo);
            }
          },
        });
      }
    });
  };
  return (
    <Modal
      visible={isModalVisible && !!teamInfo}
      title=""
      okText={teamInfo?.inTeam ? getIn18Text('DAKAIQUNHUIHUA') : getIn18Text('JIARUQUNZU')}
      cancelText={getIn18Text('QUXIAO')}
      confirmLoading={loading}
      centered
      className={realStyle('searchSucModal')}
      onOk={() => {
        handleOk();
      }}
      onCancel={() => {
        closeModal();
      }}
      closeIcon={<div className={realStyle('searchTeamExactClose')} />}
    >
      <div className={realStyle('searchTeamExact')}>
        <div className={realStyle('searchTeamExactHead')}>
          <TeamAvatar className={realStyle('searchTeamExactAvatar')} teamId={teamInfo?.id} teamInfo={teamInfo} style={{ width: '120px', height: '120px' }} />
          <p className={realStyle('searchTeamExactName')}>{`${teamInfo?.tname}（${teamInfo?.size}）`}</p>
        </div>
        <div className={realStyle('searchTeamExactBody')}>
          <p className={realStyle('searchTeamExactTitle')}>
            {getIn18Text('QUNJIANJIE')}
            {teamInfo?.teamIntro ? null : <span className={realStyle('searchTeamExactDesc', 'searchTeamExactEmpty')}>{getIn18Text('\uFF08ZANWU\uFF09')}</span>}
          </p>
          {teamInfo?.teamIntro && <p className={realStyle('searchTeamExactDesc')}>{teamInfo?.teamIntro}</p>}
          <p className={realStyle('searchTeamExactTitle')}>{getIn18Text('QUNCHENGYUAN')}</p>
          <TeamMembersComponent teamMembers={teamInfo?.teamMembers} teamInfo={teamInfo} />
          {lodashGet(teamInfo, 'size', 0) > TEAM_MEMBER_COUNT && <p className={realStyle('searchTeamExactMore')}>{getIn18Text('JIARUKECHAKAN')}</p>}
        </div>
      </div>
    </Modal>
  );
};
