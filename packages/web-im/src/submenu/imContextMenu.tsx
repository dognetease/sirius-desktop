import React, { useContext, useEffect, useState } from 'react';
import { Modal } from 'antd';
import classNames from 'classnames/bind';
import { apiHolder, DataTrackerApi, apis, NIMApi, Session } from 'api';
import { useObservable } from 'rxjs-hooks';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';
import lodashGet from 'lodash/get';
import styles from './imContextMenu.module.scss';
import RecycleIcon from '@web-common/components/UI/Icons/svgs/Recycle';
import { setSessionMute } from '../common/rxjs/setSessionMute';
import { LOG_DECLARE } from '../common/logDeclare';
import { getIn18Text } from 'api';
const realStyles = classNames.bind(styles);
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
// 日志打点
const datatrackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
// 消息未读数量
interface ContextMenuMuteApi {
  session: Session;
}
export const ContextMenuMute: React.FC<ContextMenuMuteApi> = props => {
  const { session } = props;
  const $isMuted = useObservable(
    ($defaultMute, $props) => {
      if (!$props) {
        return of(false);
      }
      const $sessionId = $props.pipe(map(ids => ids[0]));
      return nimApi.imnotify.subscribeMuteStatus($sessionId);
    },
    false,
    [session.id]
  );
  const toggleMute = (session: Session) => {
    setSessionMute(
      {
        toAccount: session.to,
        ismute: !$isMuted,
      },
      session.scene === 'p2p'
    );
  };
  return (
    <div
      data-test-id="im_list_sessionitem_mute"
      className={realStyles('sessionContextmenuItem')}
      onClick={() => {
        toggleMute(session);
      }}
    >
      {$isMuted ? getIn18Text('DAKAIXIAOXITONG') : getIn18Text('GUANBIXIAOXITONG')}
    </div>
  );
};
export const ContextMenuLater: React.FC<ContextMenuMuteApi> = props => {
  const { session } = props;
  const [isLater, setLater] = useState(false);
  useEffect(() => {
    setLater(lodashGet(session, 'localCustom.later', false));
  }, [lodashGet(session, 'localCustom.later', false)]);
  const toggleLaterDeal = () => {
    nimApi.imlater.updateLater({
      sessionId: session.id,
      sessionType: session.scene,
      isLater,
    });
    datatrackApi.track(isLater ? LOG_DECLARE.LATER.CLICK_SETLATER : LOG_DECLARE.LATER.CLICK_CANCELLATER, {
      scene: session.scene === 'p2p' ? 'single' : 'group',
      way: 'rightClick',
    });
  };
  return (
    <div
      data-test-id="im_list_sessionitem_later"
      className={realStyles('sessionContextmenuItem')}
      onClick={() => {
        toggleLaterDeal();
      }}
    >
      {isLater ? getIn18Text('YICHULI') : getIn18Text('SHAOHOUCHULI')}
    </div>
  );
};
interface ImContextMenuApi {
  session: Session & {
    isTop?: Boolean;
  };
  close?(): void;
}
export const ImContextMenu: React.FC<ImContextMenuApi> = props => {
  const { close = () => {}, session } = props;
  const { isTop = false, id, scene, localCustom } = props.session;
  const triggerStickTopSession = () => {
    // @ts-ignore
    if (isTop) {
      nimApi.excuteSync('deleteStickTopSession', { id });
    } else {
      nimApi.excuteSync('addStickTopSession', {
        id,
        topCustom: JSON.stringify({ createTime: new Date().getTime() }),
      });
    }
    datatrackApi.track(isTop ? LOG_DECLARE.STICK_TOP.SET_TOP : LOG_DECLARE.STICK_TOP.CANCEL_TOP);
  };
  const removeSession = (ids: string) => {
    nimApi.sessionStream.deleteSession(ids);
  };
  const confirmSession = () => {
    Modal.confirm({
      title: getIn18Text('QUEDINGYICHUHUI'),
      icon: <span className={realStyles('sessionContextmenuRemoveIcon')} />,
      content: getIn18Text('GAIHUIHUAYISHE'),
      okText: getIn18Text('YICHU'),
      cancelText: getIn18Text('QUXIAO'),
      centered: true,
      className: realStyles('imSessionContextModal'),
      onOk: () => {
        nimApi.imlater.updateLater({
          sessionId: session.id,
          sessionType: session.scene,
          isLater: true,
        });
        removeSession(session.id);
      },
    });
  };
  return (
    <div
      className={realStyles('imSessionContextmenu')}
      onClick={() => {
        close();
      }}
    >
      <div
        data-test-id={!isTop ? 'im_list_sessionitem_top' : 'im_list_sessionitem_canceltop'}
        className={realStyles('sessionContextmenuItem')}
        onClick={e => {
          triggerStickTopSession();
          return false;
        }}
      >
        {isTop ? getIn18Text('QUXIAOZHIDING') : getIn18Text('ZHIDINGHUIHUA')}
      </div>
      <div
        data-test-id="im_list_sessionitem_delete"
        className={realStyles('sessionContextmenuItem')}
        onClick={() => {
          datatrackApi.track(LOG_DECLARE.SESSION.REMOVE);
          localCustom?.later ? confirmSession() : removeSession(session.id);
          return false;
        }}
      >
        {getIn18Text('YICHUHUIHUA')}
      </div>
      <ContextMenuLater session={session} />
      <ContextMenuMute session={session} />
    </div>
  );
};
export const ImTopContextmenu: React.FC<any> = props => {
  const { id } = props;
  const deleteStickTopSession = () => {
    nimApi.excuteSync('deleteStickTopSession', { id });
  };
  return (
    <div className={realStyles('imSessionContextmenu', 'topContextMenu')}>
      <div
        data-test-id="im_top_sessionitem_canceltop"
        className={realStyles('sessionContextmenuItem', 'contextmenuItemFlex')}
        onClick={() => {
          deleteStickTopSession();
        }}
      >
        {/* <span className={realStyles(styles.icon)}>
          <RecycleIcon />
        </span> */}
        {getIn18Text('QUXIAOZHIDING')}
      </div>
    </div>
  );
};
