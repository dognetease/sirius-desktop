import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Popover, Tooltip } from 'antd';
import { IMDiscussApi, apiHolder, apis, SystemApi, DataTrackerApi, NIMApi } from 'api';
import classnames from 'classnames';
import styles from './mailDiscuss.module.scss';
import IconCard from '@web-common/components/UI/IconCard';
import MailDiscussPopover from '../MailDiscussPopover/mailDiscussPopover';
import useDebounceForEvent from '@web-mail/hooks/useDebounceForEvent';
import { Button, Modal } from 'antd';

import { getIn18Text } from 'api';

const discussApi: IMDiscussApi = apiHolder.api.requireLogicalApi(apis.imDiscussApiImpl) as unknown as IMDiscussApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const sysApi: SystemApi = apiHolder.api.getSystemApi();
const nimApi = apiHolder.api.requireLogicalApi('NIM') as NIMApi;

interface MailDiscussProps {
  keyIds?: {
    mid: string;
    tid?: string;
  };
  id?: string;
  style?: Object;
  visiable?: boolean;
  onClosed?: () => void;
}
const MailDiscussModal: React.FC<MailDiscussProps> = props => {
  const { keyIds, visiable = false, onClosed } = props;
  const popoverRef = useRef<null | { close: () => void }>(null);
  const [teamMsgs, setTeamMsgs] = useState({
    ownTeams: [],
    joinTeams: [],
  });
  // const [gettingMailDiscuss, setGettingMailDiscuss] = useState<boolean>(false);
  const midRef = useRef('');
  const isMounted = useRef(false);

  const teamCount = useMemo(() => {
    const { ownTeams, joinTeams } = teamMsgs;
    return ownTeams.length + joinTeams.length;
  }, [teamMsgs]);

  const resetTeamMsgs = () => {
    setTeamMsgs({
      ownTeams: [],
      joinTeams: [],
    });
  };

  // 获取邮件讨论
  const getMailDiscuss = async () => {
    // resetTeamMsgs();
    midRef.current = keyIds?.mid;
    // if (gettingMailDiscuss) {
    //     return;
    // setGettingMailDiscuss(true);
    const currentUser = sysApi.getCurrentUser();
    const contactInfo = currentUser?.contact?.contactInfo;
    if (!contactInfo) {
      // gettingMailDiscuss.current = false;
      return;
    }
    const yunxinInfo = contactInfo.find(item => item.contactItemType === 'yunxin');
    if (!yunxinInfo) {
      // setGettingMailDiscuss(false);
      return;
    }
    try {
      // 云信id
      const { contactItemVal: yxAccId } = yunxinInfo;
      const res = await discussApi.getMailDiscuss({
        yxAccId,
        emailTid: keyIds?.tid || '',
        emailMid: keyIds?.mid || '',
      });
      // setGettingMailDiscuss(false);
      if (!isMounted.current) {
        console.warn('mailDiscuss done component unmounted');
        return;
      }
      if (res.code === 0) {
        if (midRef.current === keyIds?.mid) {
          const { ownTeams, joinTeams } = res?.data;
          setTeamMsgs({ ownTeams: ownTeams || [], joinTeams: joinTeams || [] });
        } else {
          console.warn('mailDiscuss id 不一致');
        }
      } else {
        console.warn(getIn18Text('JIEKOUHUOQUYOU'), res.message);
      }
    } catch (error) {
      // setGettingMailDiscuss(false);
      console.error(getIn18Text('HUOQUYOUJIANTAO'), error);
    }
  };
  // 防抖获取邮件讨论组
  const debounceGetMailDiscuss = useDebounceForEvent(
    () => {
      getMailDiscuss();
    },
    600,
    { leading: false }
  );

  useEffect(() => {
    if (visiable) {
      trackApi.track('pcmail_hover_mailDetail_mailChatButton', {});
      debounceGetMailDiscuss();
    } else {
      setTeamMsgs({
        ownTeams: [],
        joinTeams: [],
      });
    }
  }, [visiable]);

  // mid tid发生变化 来一次
  useEffect(() => {
    isMounted.current = true;
    if (keyIds?.mid) {
      debounceGetMailDiscuss();
    } else {
      resetTeamMsgs();
    }
    return () => {
      isMounted.current = false;
    };
  }, [keyIds?.mid]);

  // 如果IM权限关闭 & 没有已参与的讨论组
  if (teamCount === 0 && !nimApi.getIMAuthConfig()) {
    return null;
  }

  const handleClose = () => {
    onClosed && onClosed();
  };

  // const popOverCont = () => <MailDiscussPopover mailMid={keyIds?.mid} teamMsgs={teamMsgs} teamCount={teamCount} closePopover={() => popoverRef.current?.close()} />;
  return (
    <Modal visible={visiable} onOk={handleClose} onCancel={handleClose} footer={null}>
      <MailDiscussPopover mailMid={keyIds?.mid} teamMsgs={teamMsgs} teamCount={teamCount} closePopover={handleClose} noWrap={true} />
    </Modal>
  );
};
export default MailDiscussModal;
