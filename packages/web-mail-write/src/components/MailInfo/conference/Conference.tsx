import React from 'react';
import { Modal } from 'antd';
import classnames from 'classnames';
import styles from '../mailInfo.module.scss';
import IconCard from '@web-common/components/UI/IconCard/index';
import ConferenceSetting from './Setting';
import ConferenceDesc from './ConferenceDesc';
import { MailActions, useAppSelector, useActions } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
import { remWaittingId } from '@web-mail-write/util';
interface Props {
  setVisible: (val: any) => void;
  visible: boolean;
}
export const conferenceWrapClassName: string = styles.conferenceWrap;
const Conference: React.FC<Props> = props => {
  const { status: infoStatus, conference, id } = useAppSelector(state => state.mailReducer.currentMail);
  const currentMailId = useAppSelector(state => state.mailReducer.currentMail.cid);
  const mailActions = useActions(MailActions);
  const conferenceShow = infoStatus?.conferenceShow;
  const conferenceSetting = infoStatus?.conferenceSetting;
  const deleteConfConfirm = async () => {
    mailActions.doShowUserBusyFree(false);
    mailActions.doConferenceShow(false);
    mailActions.doConferenceSettting(false);
    mailActions.doConferenceChange(undefined);
  };
  const deleteConf: React.MouseEventHandler<HTMLSpanElement> = e => {
    e.stopPropagation();
    remWaittingId(currentMailId, true);
    Modal.confirm({
      okButtonProps: { danger: true, type: 'default' },
      title: getIn18Text('QUEDINGSHANCHUHUI'),
      okText: getIn18Text('SHANCHU'),
      cancelText: getIn18Text('QUXIAO'),
      onOk: deleteConfConfirm,
      width: 448,
      className: 'im-team',
      centered: true,
    });
  };
  const showSetting = () => {
    mailActions.doConferenceSettting(true);
  };
  const set = conferenceShow ? (
    <div className={classnames([styles.infoItem])} onClick={showSetting}>
      <span className={styles.infoLabel}>{getIn18Text('HUIYI')}</span>
      <span className={styles.colonLabel}>:</span>
      <div className={classnames([styles.conferenceTime, styles.conferenceTimeDesc])}>
        <ConferenceDesc />
      </div>
      <div className={classnames([styles.btnBox, styles.closeBtn])}>
        <span className={classnames([styles.labelBtn, styles.labelCloseBtn])} onClick={deleteConf}>
          <IconCard className="dark-invert" type="close" />
        </span>
      </div>
    </div>
  ) : null;
  return (
    <div className={conferenceWrapClassName} style={{ height: conferenceShow ? 'auto' : 0 }}>
      <div hidden={!conferenceSetting}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        {conference && <ConferenceSetting key={id} deleteConf={deleteConf} {...props} />}
      </div>
      <div hidden={conferenceSetting}>{set}</div>
    </div>
  );
};
export default Conference;
