import React, { useState } from 'react';
import { Modal } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder, apis, DataTrackerApi, NIMApi } from 'api';
import Search from '@/images/empty/search.png';
import style from './mailDiscussPopover.module.scss';
import DiscussIntro from '@web-common/components/UI/DiscussIntro/discussIntro';
import IconCard from '@web-common/components/UI/IconCard';
import { openSession } from '@web-im/common/navigate';
import { MailActions } from '@web-common/state/reducer';
import { useActions } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const nimApi = apiHolder.api.requireLogicalApi('NIM') as NIMApi;
interface mailDiscussTeam {
  teamId: string;
  icon: string;
  teamName: string;
}
interface MailDiscussPopoverProps {
  teamMsgs: {
    ownTeams: mailDiscussTeam[];
    joinTeams: mailDiscussTeam[];
  };
  teamCount: number;
  mailMid: string;
  // 用于手动关闭Popover弹窗
  closePopover: () => void;
  noWrap?: boolean;
}
const MailDiscussPopover: React.FC<MailDiscussPopoverProps> = props => {
  const { teamMsgs, teamCount, mailMid, closePopover, noWrap } = props;
  const mailActions = useActions(MailActions);
  const [discussIntroVis, setDiscussIntroVis] = useState<boolean>(false);
  const ckWhatsDiscuss = () => {
    // 创建新会话 then 跳转
    if (!nimApi.getIMAuthConfig()) {
      message.info('消息模块已被关闭，请联系企业管理员！');
      return;
    }

    trackApi.track('pcmail_click_mailDetail_mailChatList_mailChatIntroduce', {});
    setDiscussIntroVis(true);
  };
  const close = () => setDiscussIntroVis(false);
  const discussIntroFun = () => <DiscussIntro close={close} mailMid={mailMid} />;
  // 查看群聊
  const checkDiscuss = (discuss: mailDiscussTeam) => {
    trackApi.track('pcmail_click_mailDetail_mailChatList_goToMailChat', {});
    // 创建新会话 then 跳转
    if (!nimApi.getIMAuthConfig()) {
      message.info(getIn18Text('XIAOXIMOKUAIYI'));
      return;
    }
    openSession(
      {
        sessionId: `team-${discuss.teamId}`,
        mode: 'normal',
      },
      {
        createSession: true,
        //   validateTeam: false
      }
    );
    closePopover && closePopover();
  };
  const createDiscuss = () => {
    trackApi.track('pcmail_click_mailDetail_mailChatList_addNewEmailChat', {});
    if (!nimApi.getIMAuthConfig()) {
      message.info(getIn18Text('XIAOXIMOKUAIYI'));
      return;
    }
    mailActions.doUpdateShareMailMid(mailMid);
    closePopover && closePopover();
  };
  return (
    <div className={noWrap ? style.mailDiscussNoWrap : style.mailDiscuss} onClick={e => e.stopPropagation()}>
      <div className={style.header}>
        {teamCount && teamCount > 0 ? `已关联${teamCount}个邮件讨论` : getIn18Text('YOUJIANTAOLUN')}
        <span className={style.whatsDiscuss} onClick={ckWhatsDiscuss}>
          {getIn18Text('SHENMESHIYOUJIAN')}
        </span>
      </div>

      <div className={style.content}>
        {/* 有邮件讨论 */}
        {teamCount > 0 && (
          <div className={style.hasDiscuss}>
            {teamMsgs.ownTeams.length > 0 && (
              <div className={style.startByMe}>
                <p className={style.discussTyTitle}>{getIn18Text('WOFAQIDEYOU')}</p>
                {teamMsgs.ownTeams.map((item, _) => (
                  <div className={style.discussItem} onClick={() => checkDiscuss(item)}>
                    <img className={style.discussIcon} src={item.icon} />
                    <span className={style.discussTitle}>{item.teamName}</span>
                    <div className={style.right}>
                      <IconCard type="arrowRight" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {teamMsgs.joinTeams.length > 0 && (
              <div className={style.join}>
                <p className={style.discussTyTitle}>{getIn18Text('WOJIARUDEYOU')}</p>
                {teamMsgs.joinTeams.map((item, _) => (
                  <div className={style.discussItem} onClick={() => checkDiscuss(item)}>
                    <img className={style.discussIcon} src={item.icon} />
                    <span className={style.discussTitle}>{item.teamName}</span>
                    <div className={style.right}>
                      <IconCard type="arrowRight" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 没有邮件讨论 */}
        {teamCount === 0 && (
          <div className={style.noDiscuss}>
            <img style={{ width: 130, height: 130, margin: '24px auto 0 auto', display: 'block' }} src={Search} alt="" />
            <p className={style.noDiscussYet}>{getIn18Text('GAIYOUJIANWEIFA')}</p>
          </div>
        )}
      </div>

      <div className={style.footer}>
        <button className={style.startDiscuss} onClick={createDiscuss}>
          {getIn18Text('QUFAQIYOUJIAN')}
        </button>
      </div>

      <Modal
        modalRender={discussIntroFun}
        wrapClassName="discuss-intro-wrap"
        centered={true}
        visible={discussIntroVis}
        maskStyle={{ left: '68px', zIndex: 1090 }}
        destroyOnClose={true}
      ></Modal>
    </div>
  );
};
export default MailDiscussPopover;
