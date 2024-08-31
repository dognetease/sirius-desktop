import { ScheduleModel } from 'api';
import classnames from 'classnames';
import React from 'react';
import { ScheduleActions, useActions } from '@web-common/state/createStore';
import Alert from '@web-common/components/UI/Alert/Alert';
import siriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { EnumRange, InviteType } from '../../data';
import { deleteEvent } from '../../service';
import { RangeContent } from '../CreateBox/PopContent';
import styles from './eventcontent.module.scss';
import { getIn18Text } from 'api';
const EventDelete: React.FC<{
  item: ScheduleModel;
  onDelete?(): void;
  scheduleDeleteFromMail?: boolean;
}> = ({ item, onDelete, scheduleDeleteFromMail = false }) => {
  const { syncSchedule } = useActions(ScheduleActions);
  const handleDelete = async (range?: EnumRange) => {
    // item.scheduleInfo.inviteeType 1 组织者 2 被邀请者
    siriusMessage.loading({ content: getIn18Text('SHANCHUZHONG'), duration: 3 });
    // 自建日程且有受邀成员
    const sendMailTipCondition =
      item.scheduleInfo.inviteeType === InviteType.ORGANIZER && item.contactInfo.filter(e => !e.isOrganizer).length > 0 && range === EnumRange.ALL;
    const sendMailText = sendMailTipCondition ? getIn18Text('\uFF0CBINGTONGZHILE') : '';

    const res = await deleteEvent(item, range);
    siriusMessage.destroy();
    Alert.destroyAll();
    if (String(res?.data?.code) === '200') {
      siriusMessage.success({ content: `删除成功${sendMailText}` });
      onDelete && onDelete();
      syncSchedule({
        type: 'delete',
        data: item,
        opRange: range,
      });
    } else {
      siriusMessage.error({ content: `删除失败 ${res?.data?.err_msg}` });
    }
  };
  const handleClick = () => {
    if (item.scheduleInfo.recurrenceId > 0) {
      let range = !!scheduleDeleteFromMail ? EnumRange.ALL : EnumRange.THIS;
      const al = Alert.info({
        title: getIn18Text('QINGXUANZEYAOSHAN'),
        content: (
          <RangeContent
            hideButton
            updateThisText={getIn18Text('JINSHANCHUBENCI')}
            updateAllText={getIn18Text('SHANCHUQUANBURI')}
            updateThisAndFutureText={getIn18Text('SHANCHUBENCIJI')}
            hideThisAndFuture={item.scheduleInfo.inviteeType === InviteType.INVITEE || !!scheduleDeleteFromMail}
            hideThis={!!scheduleDeleteFromMail}
            defaultRange={range}
            onChange={v => {
              range = v;
            }}
          />
        ),
        funcBtns: [
          {
            text: getIn18Text('QUXIAO'),
            onClick: () => (al ? al.destroy() : Alert.destroyAll()),
          },
          {
            text: getIn18Text('QUEDING'),
            danger: !0,
            onClick: () => handleDelete(range),
          },
        ],
      });
    } else {
      const al = Alert.warn({
        title: item.scheduleInfo.inviteeType === InviteType.INVITEE ? getIn18Text('QUEDINGSHANCHUGAI11') : getIn18Text('QUEDINGSHANCHUGAI12'),
        funcBtns: [
          {
            text: getIn18Text('QUXIAO'),
            onClick: () => (al ? al.destroy() : Alert.destroyAll()),
          },
          {
            text: getIn18Text('SHANCHU'),
            danger: !0,
            onClick: () => handleDelete(),
          },
        ],
      });
    }
  };
  return <i onClick={handleClick} className={classnames(styles.icon, styles.deleteWhite)} />;
};
export default EventDelete;
