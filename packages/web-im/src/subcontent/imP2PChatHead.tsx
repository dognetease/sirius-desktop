import React, { useState, useEffect } from 'react';
import { apiHolder, apis, IMTeamApi, ContactApi, OrgApi, ContactModel, SystemApi, NIMApi, EntityContactItem } from 'api';
import { Tooltip } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classNames from 'classnames/bind';
import { useObservable } from 'rxjs-hooks';
import lodashGet from 'lodash/get';
import { openSession } from '../common/navigate';
import { UserAvatar } from '../common/imUserAvatar';
import styles from './imP2PChatHead.module.scss';
import { useYunxinAccount } from '../common/hooks/useYunxinAccount';
import { MemberChooserModal } from '../components/MemberChooser/memberChooser';
import { filterContactListByYunxin } from '../utils/im_team_util';
import { PopoverUser } from '../common/usercard/userCard';
import { getIn18Text } from 'api';
const realStyles = classNames.bind(styles);
const imTeamApi = apiHolder.api.requireLogicalApi(apis.imTeamApiImpl) as IMTeamApi;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
interface ImSysChatHeadApi {
  toAccount: string;
}
export const ImSysChatHead: React.FC<ImSysChatHeadApi> = props => {
  const { toAccount } = props;
  const userInfo = useYunxinAccount(toAccount, 'p2p');
  return (
    // nick, avatar, email, scene
    <div className={realStyles('p2pChatHeadWrap')}>
      <UserAvatar testId="im_session_content_avatar" user={userInfo} enableClick={systemApi.isElectron()} />
      <p data-test-id="im_session_content_name" className={realStyles('nickname')}>
        {userInfo?.nick || ''}
      </p>
    </div>
  );
};
const ImP2PChatHead: React.FC<{
  toAccount: string;
}> = props => {
  const { toAccount } = props;
  const [addMemberVisible, setAddMemberVisible] = useState<boolean>(false);
  const [curMembers, setCurMembers] = useState<ContactModel[]>([]);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const userInfo = useYunxinAccount(toAccount, 'p2p');

  useEffect(() => {
    if (!userInfo?.contactId || !userInfo?.email) {
      return;
    }
    contactApi.addFrequentContact({
      list: [
        {
          contactId: userInfo.contactId,
          email: userInfo.email,
        },
      ],
      type: 'im',
      _account: systemApi.getCurrentUser()?.id || '',
    });
  }, [userInfo?.contactId]);

  const [myAccount] = useState(() => {
    const yunxinId = lodashGet(nimApi, '$instance.account', '');

    if (yunxinId) {
      return yunxinId;
    }
    return (
      lodashGet(systemApi.getCurrentUser(), 'contact.contactInfo', []).find((item: EntityContactItem) => {
        return item.contactItemType === 'yunxin';
      })?.contactItemVal || ''
    );
  });

  const openMemberChooser = async () => {
    const accounts = [myAccount, toAccount];

    const { contactModelList: list } = await contactApi.doGetContactByYunxin(accounts);

    if (list && list.length) {
      setCurMembers(filterContactListByYunxin(list));
      setAddMemberVisible(true);
      return;
    }

    contactApi.doGetServerContactByYunxin(accounts).then(contacts => {
      setCurMembers(filterContactListByYunxin(contacts));
      setAddMemberVisible(true);
    });
  };
  const createTeam = (newMemberModels: ContactModel[]) => {
    const yunxinIds = [myAccount, toAccount].concat(
      newMemberModels.map(member => {
        return contactApi.findContactInfoVal(member.contactInfo, 'yunxin');
      })
    );
    const [owner, ...members] = [...new Set(yunxinIds)];
    const option = {
      owner: owner,
      members: members.join(','),
      name: '',
      use_auto_name: 1,
    };
    imTeamApi
      .createTeam(option, false)
      .then(ret => {
        if (ret?.success) {
          // 跳转到当前会话
          openSession(
            {
              mode: 'normal',
              sessionId: `team-${ret.data.team_id}`,
            },
            {
              createSession: true,
            }
          );
        } else {
          message.fail(lodashGet(ret, 'message', getIn18Text('CHUANGJIANQUNSHIBAI')));
        }
        setAddMemberVisible(false);
      })
      .catch(err => {
        message.fail(lodashGet(err, 'message', getIn18Text('TIANJIASHIBAI')));
      });
  };
  const closeMemberChooser = () => {
    setAddMemberVisible(false);
  };
  return (
    // nick, avatar, email, scene
    <div className={realStyles('p2pChatHeadWrap')}>
      <PopoverUser user={userInfo} placement="bottom">
        <div>
          <UserAvatar testId="im_session_content_avatar" user={userInfo} enableClick={systemApi.isElectron()} />
        </div>
      </PopoverUser>
      <p className={realStyles('nickname')}>
        <PopoverUser user={userInfo} placement="bottom">
          <span data-test-id="im_session_content_name">{userInfo?.nick || ''}</span>
        </PopoverUser>
      </p>
      <Tooltip title={getIn18Text('CHUANGJIANQUNZU')} visible={showTooltip} placement="bottom" overlayClassName="team-setting-tooltip">
        <span
          className={`dark-invert ${realStyles('icon', 'addPeopleIcon')}`}
          onClick={openMemberChooser}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        />
      </Tooltip>
      {/* <Tooltip title="聊天记录" placement={'bottom'} overlayClassName={'team-setting-tooltip'}>
                    <span className={realStyles('icon', 'msgHistoryIcon')}></span>
                </Tooltip> */}
      <MemberChooserModal visible={addMemberVisible} chosenMembers={curMembers} onOk={createTeam} onCancel={closeMemberChooser} />
    </div>
  );
};
export default ImP2PChatHead;
