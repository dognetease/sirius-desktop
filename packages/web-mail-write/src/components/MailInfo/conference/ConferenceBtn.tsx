/*
 * @Author: your name
 * @Date: 2022-01-26 17:41:25
 * @LastEditTime: 2022-03-21 11:56:22
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/components/Layout/Write/components/MailInfo/conference/ConferenceBtn.tsx
 */
import React from 'react';
import classnames from 'classnames';
import { DataTrackerApi, apis, apiHolder as api } from 'api';
import styles from '../mailInfo.module.scss';
import { conferenceInit } from '@web-mail/util';
import { MailActions, useActions, useAppSelector } from '@web-common/state/createStore';
import IconCard from '@web-common/components/UI/IconCard';
import conferenceStyle from './conference.module.scss';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';
import { remWaittingId } from '@web-mail-write/util';
import { TongyongRili } from '@sirius/icons';
const ConferenceBtn: React.FC<{}> = () => {
  const mailActions = useActions(MailActions);
  const infoStatus = useAppSelector(state => state.mailReducer.currentMail.status);
  const currentMailId = useAppSelector(state => state.mailReducer.currentMail.cid);
  const attachments = useAppSelector(state => state.attachmentReducer.attachments);
  const conferenceShow = infoStatus?.conferenceShow;
  const priaseMailShow = infoStatus?.praiseMailShow;
  const taskMailShow = infoStatus?.taskMailShow;
  const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
  let icsExist = false;
  if (Array.isArray(attachments)) {
    icsExist = attachments.some(i => i.mailId === currentMailId && !i.forwardWithout && i.fileType === 'ics');
  }
  const clickConf = async () => {
    // 埋点，收集写信 会议邀请按钮点击
    trackApi.track('pcMail_click_conferenceInvitation_writeMailPage');
    trackApi.track('pcMail_click_addButton_writeMailPage', { buttonName: getIn18Text('RICHENG') });
    remWaittingId(currentMailId, true);
    if (icsExist) {
      SiriusMessage.info({
        content: <span>{getIn18Text('TIANJIARICHENGXU')}</span>,
      });
      return;
    }
    mailActions.doConferenceShow(true);
    mailActions.doConferenceSettting(true);
    const conference = await conferenceInit();
    if (conference) {
      mailActions.doConferenceChange(conference);
    } else {
      SiriusMessage.error({
        content: getIn18Text('MORENRILIBU'),
      });
    }
  };
  return conferenceShow || priaseMailShow || taskMailShow ? null : (
    <div
      className={classnames(styles.btnWrapper, conferenceStyle.btnWrapper, {
        [conferenceStyle.isEdm]: process.env.BUILD_ISEDM,
      })}
      onClick={clickConf}
    >
      {process.env.BUILD_ISEDM ? (
        <>
          <TongyongRili className={conferenceStyle.icon} wrapClassName={conferenceStyle.iconWrap} />
          <span className={conferenceStyle.iconText}>{getIn18Text('HUIYIYAOQING')}</span>
        </>
      ) : (
        <>
          <span className={styles.btnIcon}>
            <IconCard type="conference" />
          </span>
          <span className={styles.btnText}>{getIn18Text('HUIYIYAOQING')}</span>
        </>
      )}
    </div>
  );
};
export default ConferenceBtn;
