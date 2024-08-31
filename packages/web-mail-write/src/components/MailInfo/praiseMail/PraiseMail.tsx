import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import classnames from 'classnames';
import ErrorIcon from '@web-common/components/UI/Icons/svgs/ErrorSvg';
import { MailActions, useAppSelector, useActions } from '@web-common/state/createStore';
import { apiHolder as api, apis, DataTrackerApi, MailApi, MedalInfo, MailBoxEntryContactInfoModel } from 'api';
import IconCard from '@web-common/components/UI/IconCard/index';
import styles from '../mailInfo.module.scss';
import PraiseMailSetting from './Setting';
import PraiseDesc from './PraiseDesc';
import { getIn18Text } from 'api';
import { remWaittingId } from '@web-mail-write/util';

const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const PraiseMail: React.FC = props => {
  const infoStatus = useAppSelector(state => state.mailReducer.currentMail.status);
  const curAccount = useAppSelector(state => state.mailReducer.currentMail?.optSender);
  const currentMailId = useAppSelector(state => state.mailReducer.currentMail.cid);
  const mailActions = useActions(MailActions);
  // const allMedals = mailApi.doGetPraiseMedals();
  const [allMedals, setMedals] = useState<any[]>([]);
  useEffect(() => {
    mailApi.doGetPraiseMedals().then(setMedals);
  }, []);
  useEffect(() => {
    if (curAccount && !curAccount.isMainAccount) {
      // 挂载账号下不支表扬邮件
      deletePraiseMailConfirm();
    }
  }, [curAccount]);
  const praiseMail = useAppSelector(state => state.mailReducer.currentMail.praiseMail);
  const curMedal: MedalInfo = allMedals.find(item => item.id === praiseMail?.medalId);
  const [winners, setWinners] = useState<MailBoxEntryContactInfoModel[]>([]);
  const praiseMailShow = infoStatus?.praiseMailShow;
  const praiseMailSetting = infoStatus?.praiseMailSetting;
  useEffect(() => {
    // 当收起表扬信时，如果什么类容都没有填写 就关闭表扬信
    if (praiseMailShow && !praiseMailSetting && !winners.length && !curMedal?.imageUrl && !praiseMail?.presentationWords) {
      mailActions.doPraiseShow(false);
    }
  }, [praiseMailShow, praiseMailSetting]);
  const deletePraiseMailConfirm = () => {
    mailActions.doPraiseShow(false);
    mailActions.doPraiseMailSetting(false);
  };
  const deletePraiseMail = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation();
    remWaittingId(currentMailId, true);
    Modal.confirm({
      icon: <ErrorIcon className="error-icon" />,
      okButtonProps: { danger: true, type: 'default' },
      title: getIn18Text('YAOSHANCHUBIAOYANG'),
      okText: getIn18Text('SHANCHU'),
      cancelText: getIn18Text('QUXIAO'),
      onOk: () => {
        deletePraiseMailConfirm();
        trackApi.track('pcMail_click_writeMail_addPraiseLetterPage_deletePraiseLetter');
      },
      width: 448,
      className: 'im-team',
      centered: true,
    });
  };
  const showSetting = () => {
    mailActions.doPraiseMailSetting(true);
  };
  return (
    <div className={classnames([styles.conferenceWrap])} style={{ height: praiseMailShow ? 'auto' : 0 }}>
      <div hidden={!praiseMailSetting}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <PraiseMailSetting deletePraiseMail={deletePraiseMail} {...props} />
      </div>
      <div hidden={praiseMailSetting || !praiseMailShow}>
        <div className={classnames([styles.infoItem])} onClick={showSetting}>
          <span className={styles.infoLabel}>{getIn18Text('BIAOYANGXIN')}</span>
          <span className={styles.colonLabel}>:</span>
          <div className={classnames([styles.conferenceTime, styles.conferenceTimeDesc])}>
            <PraiseDesc />
          </div>
          <div className={classnames([styles.btnBox, styles.closeBtn])}>
            <span className={classnames([styles.labelBtn, styles.labelCloseBtn])} onClick={deletePraiseMail}>
              <IconCard className="dark-invert" type="close" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PraiseMail;
