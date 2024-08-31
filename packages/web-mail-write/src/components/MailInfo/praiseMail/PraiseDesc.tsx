/* eslint-disable global-require */
/*
 * @Author: your name
 * @Date: 2022-03-10 10:58:15
 * @LastEditTime: 2022-03-21 11:34:41
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/components/Layout/Write/components/MailInfo/taskMail/TaskMailDesc.tsx
 */
import React, { useEffect, useState, useContext } from 'react';
import classnames from 'classnames';
import moment from 'moment';
import styles from './praiseMail.module.scss';
import { TaskMailType } from '@web-common/state/state';
import ContactTag, { IContactTagProps } from '../../Selector/contact-tag';
import { modelToContactInfo } from '../../Selector/helper';
import ContactChip from '../../Selector/contact-chip';
import { reminderOpts } from '@web-schedule/components/CreateBox/util';
import { getTeamMembers } from '@web-common/components/util/contact';
import { apiHolder as api, apis, MailBoxEntryContactInfoModel, MailApi, MedalInfo, MailEntryModel } from 'api';
import { useAppSelector } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const PraiseDesc: React.FC = () => {
  // const allMedals = mailApi.doGetPraiseMedals();
  const [allMedals, setMedals] = useState<any[]>([]);
  useEffect(() => {
    mailApi.doGetPraiseMedals().then(setMedals);
  }, []);
  const praiseMail = useAppSelector(state => state.mailReducer.currentMail.praiseMail);
  const curMedal: MedalInfo = allMedals.find(item => item.id === praiseMail?.medalId);
  const [winners, setWinners] = useState<MailBoxEntryContactInfoModel[]>([]);
  const receivers = useAppSelector(state => (state.mailReducer.currentMail as MailEntryModel)?.receiver) as MailBoxEntryContactInfoModel[];
  useEffect(() => {
    if (praiseMail && praiseMail.winners) {
      const filteredOptions = praiseMail.winners.map(item => modelToContactInfo(item, ''));
      console.log('contactTagItem', filteredOptions);
      setWinners(filteredOptions);
    }
  }, [praiseMail]);
  return (
    <>
      {praiseMail ? (
        <div className={classnames(styles.desc)}>
          {!!curMedal && (
            <div className={classnames(styles.item)}>
              <img className={classnames(styles.medalImg)} alt={curMedal?.name} src={curMedal?.imageUrl} />
              <span>{curMedal?.name}</span>
            </div>
          )}
          {!!winners.length && (
            <div className={classnames([styles.item, styles.winners])}>
              <span>{getIn18Text('BIAOYANGDUIXIANG\uFF1A')}</span>
              {!!winners.length && <ContactChip type={''} value={''} item={winners[0]} />}
              <span className={classnames(styles.winnersNum)}>{winners.length > 1 ? `共${winners.length}人` : ''}</span>
            </div>
          )}
          {!!praiseMail.presentationWords && (
            <div className={classnames(styles.item)}>
              <span>{getIn18Text('BANJIANGCI\uFF1A')}</span>
              <span className={classnames(styles.textContent)}>{praiseMail.presentationWords}</span>
            </div>
          )}
          {!!praiseMail.presenter && (
            <div className={classnames(styles.item)}>
              <span>{getIn18Text('BANJIANGREN\uFF1A')}</span>
              <span className={classnames(styles.textContent)}>{praiseMail.presenter}</span>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
};
export default PraiseDesc;
