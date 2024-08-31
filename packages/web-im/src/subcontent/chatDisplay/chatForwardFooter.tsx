import React, { useState } from 'react';
import classnames from 'classnames/bind';
import { Button } from 'antd';
import { apis, apiHolder as api, DataTrackerApi } from 'api';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import DiscussIntro from '@web-common/components/UI/DiscussIntro/discussIntro';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './chatForward.module.scss';
import { MailActions } from '@web-common/state/reducer';
import { useActions } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
export const ChatForwardFooter: React.FC<{
  onVisibleChange(flag: boolean): void;
  sendForwardMsg: () => void;
  loading?: boolean;
  okText?: string;
  checkedSessionIds: string[];
  mailMid?: string;
}> = props => {
  const { onVisibleChange, sendForwardMsg, okText = getIn18Text('ZHUANFA'), loading = false, checkedSessionIds, mailMid = '' } = props;
  const [shareIntro, setShareIntro] = useState<boolean>(false);
  const mailActions = useActions(MailActions);
  const handleDiscussTrack = (type: string) => {
    trackApi.track(type);
  };
  return (
    <>
      <div className={realStyle('footerWrapper')}>
        {okText === getIn18Text('FENXIANG') ? (
          <p className={realStyle('discuss')}>
            {getIn18Text('WUHESHIHUIHUA')}
            <span
              className={realStyle('discussLaunch')}
              onClick={() => {
                mailActions.doUpdateShareMailMid(mailMid);
                handleDiscussTrack('pcMail_click_shareMailPage_addNewEmailChat');
              }}
            >
              {getIn18Text('QUFAQIXINDE')}
            </span>
            <QuestionCircleOutlined
              className={realStyle('discussIcon')}
              onClick={() => {
                handleDiscussTrack('pcMail_click_shareMailPage_mailChatIntroduce');
                setShareIntro(true);
              }}
            />
          </p>
        ) : null}
        <section className={realStyle('btns')}>
          <span className={realStyle('createSessionBtn', 'btn')}>{getIn18Text('CHUANGJIANXINHUIHUA')}</span>
        </section>
        <section className={realStyle('btns')}>
          <Button className={realStyle('cancelBtn')} onClick={() => onVisibleChange(false)}>
            {getIn18Text('QUXIAO')}
          </Button>
          <Button loading={loading} type="primary" className={realStyle('forwardBtn')} onClick={() => sendForwardMsg()} disabled={!checkedSessionIds.length}>
            {okText}
          </Button>
        </section>
      </div>
      {/* 邮件讨论介绍弹窗 */}
      <Modal
        modalRender={() => <DiscussIntro mailMid={mailMid} close={() => setShareIntro(false)} />}
        wrapClassName="discuss-intro-wrap"
        centered={true}
        visible={shareIntro}
        maskStyle={{ left: '68px', zIndex: 1090 }}
      />
    </>
  );
};
