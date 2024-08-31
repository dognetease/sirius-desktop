import React, { useContext, useEffect, useRef, useState } from 'react';
import { Tooltip } from 'antd';
import classNames from 'classnames/bind';
import { apiHolder, NIMApi, Session, DataTrackerApi, apis } from 'api';
import lodashGet from 'lodash/get';
import styles from './imSessionItem.module.scss';
import { LOG_DECLARE } from '../common/logDeclare';
import { getIn18Text } from 'api';
const realStyle = classNames.bind(styles);
// 日志打点
const datatrackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
// 消息未读数量
interface LaterDealApi {
  session: Session;
}
export const LaterDeal: React.FC<LaterDealApi> = props => {
  const { session } = props;
  const [isLater, setLater] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  useEffect(() => {
    setLater(lodashGet(session, 'localCustom.later', false));
  }, [session]);
  if (!isLater) {
    return null;
  }
  const toggleLaterDeal = () => {
    nimApi.imlater.updateLater({
      sessionId: session.id,
      sessionType: session.scene,
      isLater,
    });
    datatrackApi.track(LOG_DECLARE.LATER.CLICK_CANCELLATER, {
      way: 'iconClick',
    });
  };
  return (
    <Tooltip
      title={() => (
        <div className={realStyle('laterDealTip')}>
          <span className={realStyle('laterDealComp')} />
          <span>{getIn18Text('YICHULI')}</span>
        </div>
      )}
      visible={showTooltip}
      placement="top"
    >
      <div
        data-test-id="im_list_sessionitem_latericon"
        className={realStyle('laterDealIcon')}
        onClick={e => {
          e.stopPropagation();
          toggleLaterDeal();
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      />
    </Tooltip>
  );
};
