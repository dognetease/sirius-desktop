/*
 * @Author: your name
 * @Date: 2022-03-09 14:35:29
 * @LastEditTime: 2022-03-17 18:12:07
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/components/Layout/Write/components/MailInfo/praiseMail/PraiseMailBtn.tsx
 */
import message from '@web-common/components/UI/Message/SiriusMessage';
import React, { useImperativeHandle } from 'react';
import { DataTrackerApi, apis, apiHolder as api } from 'api';
import { MailActions, useActions, useAppSelector } from '@web-common/state/createStore';
import PraiseIcon from '@web-common/components/UI/Icons/svgs/PraiseIcon';
import styles from '../mailInfo.module.scss';
import classnames from 'classnames';
import { getIn18Text } from 'api';
import { remWaittingId } from '@web-mail-write/util';
interface Props {
  hidden?: boolean;
  ref?: React.Ref<{
    click: () => void;
  }>;
}
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const PraiseMailBtn = React.forwardRef((props: Props, ref) => {
  const mailActions = useActions(MailActions);
  const curAccount = useAppSelector(state => state.mailReducer.currentMail?.optSender);
  const isMainAccount = curAccount?.isMainAccount; // 是主账号还是挂载账号
  const infoStatus = useAppSelector(state => state.mailReducer.currentMail.status);
  const sender = useAppSelector(state => state.mailReducer.currentMail.sender);
  const currentMailId = useAppSelector(state => state.mailReducer.currentMail?.cid);
  const priaseMailShow = infoStatus?.praiseMailShow;
  const taskMailShow = infoStatus?.taskMailShow;
  const conferenceShow = infoStatus?.conferenceShow;
  const scheduleDate = useAppSelector(state => state.mailReducer.currentMail.scheduleDate);
  const clickPriase = () => {
    if (!isMainAccount) return;
    remWaittingId(currentMailId, true);
    trackApi.track('pcMail_click_writeMail_addPraiseLetter');
    trackApi.track('pcMail_click_addButton_writeMailPage', { buttonName: getIn18Text('BIAOYANGXIN') });
    if (scheduleDate) {
      // @ts-ignore
      message.warn({
        content: getIn18Text('BIAOYANGYOUJIANZAN'),
      });
    } else {
      mailActions.doPraiseShow(true);
      mailActions.doPraiseMailSetting(true);
      // 初始化表扬信内容
      const praiseMail = {
        winners: [],
        medalId: null,
        presentationWords: '',
        presenter: sender?.contact?.contact?.contactName,
      };
      mailActions.doPraiseMailChange(praiseMail);
    }
  };
  useImperativeHandle(ref, () => ({
    click: clickPriase,
  }));
  return props.hidden || priaseMailShow || taskMailShow || conferenceShow ? null : (
    <div className={classnames(styles.btnWrapper, { [styles.disabled]: !isMainAccount })} onClick={clickPriase}>
      <span className={classnames(styles.btnIcon)}>
        <PraiseIcon />
      </span>
      <span className={styles.btnText}>{getIn18Text('BIAOYANGXIN')}</span>
    </div>
  );
});
export default PraiseMailBtn;
