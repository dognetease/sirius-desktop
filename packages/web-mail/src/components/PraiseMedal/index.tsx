// 单个勋章 view
import React, { useEffect, useState } from 'react';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import { apiHolder as api, apis, SystemApi, MailPraiseApi, PersonMedalDetailInfo, ContactAndOrgApi, DataTrackerApi } from 'api';
import styles from './index.module.scss';
import { getIn18Text } from 'api';
interface Styles {
  containStyle?: Record<string, string | number>;
  medalWidth: number;
  medalHeight: number;
}
interface Props {
  medalData: PersonMedalDetailInfo;
  styles?: Styles;
  from?: string; // readMail 勋章展示默认图标 contact other
  praiseOwner?: boolean; // contact是否是自己
}
const mailPraiseApi = api.api.requireLogicalApi(apis.mailPraiseApiImpl) as MailPraiseApi;
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const PraiseMedalItem: React.FC<Props> = props => {
  const { id, imageUrl, grayImageUrl, pendantImageUrl, name, description, count = 0, status } = props.medalData;
  const { medalWidth = 142, medalHeight = 142, containStyle } = props.styles || {};
  const { from, praiseOwner = false } = props;
  const [curPendantId, setCurPendantId] = useState('-1');
  // 当前用户挂件id
  const pendantId = systemApi.getCurrentUser()?.prop?.pendantId as string;
  useEffect(() => {
    setCurPendantId(pendantId);
  }, [pendantId]);
  const renderImage = () => {
    if (from === 'readMail' || count > 0) {
      return imageUrl;
    }
    return grayImageUrl;
  };
  const togglePendant = async () => {
    const isCurPendantId = curPendantId === String(id);
    const response = isCurPendantId ? await mailPraiseApi.cancelMedalPendant(id) : await mailPraiseApi.setMedalPendant(id);
    if (response.success) {
      message.success(isCurPendantId ? getIn18Text('TOUXIANGGUASHIYI') : getIn18Text('SHEZHICHENGGONG\uFF0C'));
      const newId = isCurPendantId ? -1 : id;
      setCurPendantId(String(newId));
      const contactId = systemApi.getCurrentUser()?.contact?.contact?.id;
      contactApi.doUpdateContactById({ id: contactId, avatarPendant: isCurPendantId ? '' : pendantImageUrl });
      mailPraiseApi.setCurrentUserPendantId(newId);
      // 埋点
      if (from === 'readMail') {
        trackApi.track(
          isCurPendantId ? 'pcMail_click_readMail_praiseLetter​_medalDetails_cancelAvatarPendant' : 'pcMail_click_readMail_praiseLetter​_medalDetails_setAsAvatarPendant'
        );
      } else if (from === 'contact' || from === 'other') {
        trackApi.track(
          isCurPendantId ? 'pcContact_click_contactsDetailPage_medalWall_setAvatarPendant' : 'pcContact_click_contactsDetailPage_medalWall_cancelAvatarPendant'
        );
      }
    } else {
      message.error(isCurPendantId ? getIn18Text('QUXIAOSHIBAI\uFF0C') : getIn18Text('SHEZHISHIBAI\uFF0C'));
    }
  };
  return (
    <div className={styles.medalItemWrap} style={{ ...containStyle }}>
      <img width={medalWidth} height={medalHeight} src={renderImage()} style={{ display: 'inline-block' }} alt="" />
      <div className={styles.medalName}>
        {name}
        {count > 1 && from !== 'readMail' ? <span>{count}</span> : null}
      </div>
      <div className={styles.desc}>{description}</div>
      {praiseOwner && status === 1 ? (
        <div className={classnames(styles.pendant, { [styles.pendantContact]: from !== 'readMail' })} onClick={togglePendant}>
          {curPendantId !== String(id) && <img width={30} height={30} src={pendantImageUrl} style={{ marginRight: 10 }} alt="" />}
          {curPendantId === String(id) ? getIn18Text('QUXIAO') : getIn18Text('SHEWEI')}
          {getIn18Text('TOUXIANGGUASHI')}
        </div>
      ) : null}
    </div>
  );
};
export default PraiseMedalItem;
