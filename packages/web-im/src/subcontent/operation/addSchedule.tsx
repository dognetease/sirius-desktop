import React, { useContext, useEffect, useState } from 'react';
import { Tooltip } from 'antd';
import classnames from 'classnames/bind';
import { api, IMUser } from 'api';
import { navigate } from 'gatsby-link';
import { Link } from 'gatsby';
import { Context as TeamMemberContext } from '../store/memberProvider';
import styles from './operation.module.scss';
import { SchedulePageEventData } from '@web-schedule/components/CreateBox/EventBody';
import { ScheduleActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { getCatalogList } from '@web-schedule/service';
import { CurSessionContext } from '../store/currentSessioProvider';
import { initDefaultMoment } from '@web-schedule/components/CreateBox/util';
import { ScheduleSyncObInitiator } from '@web-schedule/data';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { ContactItem } from '@web-common/utils/contact_util';
import { getIn18Text } from 'api';
const sysApi = api.getSystemApi();
const eventApi = api.getEventApi();
const realStyle = classnames.bind(styles);
interface IMAddScheduleProps {
  // p2p team
  scene: string;
}
const getDirectTimeStr = () => {
  const defaultTime = initDefaultMoment();
  const creatDirectStartTime = defaultTime.startTime;
  const creatDirectEndTime = defaultTime.endTime;
  const formateStr = 'yyyy-MM-DD HH:mm';
  return [creatDirectStartTime.format(formateStr), creatDirectEndTime.format(formateStr)];
};
export const IMAddSchedule: React.FC<IMAddScheduleProps> = ({ scene }) => {
  const [opening, setOpening] = useState<boolean>(false);
  const { catalogList, unSelectedCatalogIds } = useAppSelector(state => state.scheduleReducer);
  const { state: teamMemberlist } = useContext(TeamMemberContext);
  const p2pSessionContext = useContext(CurSessionContext);
  const scheduleActions = useActions(ScheduleActions);
  const getDefaultList = () => {
    let defaultContactList: ContactItem[];
    const meEmail = sysApi.getCurrentUser()?.id;
    if (scene === 'team') {
      defaultContactList = (teamMemberlist.filter(e => e.user && e.user.email !== meEmail).map(e => e.user) as IMUser[]).map(e => ({
        name: e.nick,
        email: e.email,
      }));
    } else {
      defaultContactList = p2pSessionContext.userInfo
        ? [
            {
              name: p2pSessionContext.userInfo.nick,
              email: p2pSessionContext.userInfo.email,
            },
          ]
        : [];
    }
    return defaultContactList;
  };
  const handleCreateFromSessionMembers = async () => {
    if (catalogList.length > 0 && !opening) {
      const [creatDirectStartTimeStr, creatDirectEndTimeStr] = getDirectTimeStr();
      const initData: SchedulePageEventData = {
        unSelectedCatalogIds,
        catalogList,
        defaultContactList: getDefaultList(),
        creatDirectStartTimeStr,
        creatDirectEndTimeStr,
        source: ScheduleSyncObInitiator.IM_MODULE,
      };
      setOpening(true);
      try {
        await sysApi.createWindowWithInitData('scheduleOpPage', { eventName: 'initPage', eventData: initData });
      } catch (error) {
        console.error('IM open schedule error', error, initData.defaultContactList);
      }
      setOpening(false);
    }
  };
  useEffect(() => {
    if (catalogList.length === 0) {
      getCatalogList().then(list => {
        scheduleActions.updateCatlogList(list);
      });
    }
    const eid = eventApi.registerSysEventObserver('syncSchedule', {
      func: e => {
        if (e.eventStrData === ScheduleSyncObInitiator.IM_MODULE && e.eventData) {
          const { startDate } = e.eventData;
          SiriusMessage.success({
            content: (
              <>
                <span>{e.eventData.msg}</span>
                &nbsp;&nbsp;
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a
                  onClick={async ase => {
                    ase.preventDefault();
                    SiriusMessage.destroy();
                    const scheduleSubWindowInfo = await sysApi.navigateToSchedule();
                    if (typeof scheduleSubWindowInfo === 'boolean') {
                      !scheduleSubWindowInfo &&
                        eventApi.sendSysEvent({
                          eventName: 'routeChange',
                          eventStrData: 'gatsbyStateNav',
                          eventData: {
                            url: '/#schedule',
                            state: {
                              time: startDate,
                            },
                          },
                        });
                    } else if (scheduleSubWindowInfo.success) {
                      // 如果存在独立窗口 直接转发消息到该窗口
                      try {
                        window.electronLib.windowManage.exchangeData({
                          id: scheduleSubWindowInfo.webId,
                          data: {
                            ...e,
                            eventStrData: ScheduleSyncObInitiator.INDEPENDED_MODULE,
                          },
                        });
                      } catch (error) {
                        console.error('send msg to targrt schedule window faild');
                      }
                    }
                  }}
                >
                  {getIn18Text('QURILICHAKAN')}
                </a>
              </>
            ),
            duration: 3,
          });
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('syncSchedule', eid);
    };
  }, []);
  return (
    <Tooltip title={getIn18Text('CHUANGJIANRICHENG')} overlayClassName="team-setting-tooltip">
      <span data-test-id="im_session_add_schedule_btn" className={realStyle('operationIcon', 'iconSchedule')} onClick={handleCreateFromSessionMembers} />
    </Tooltip>
  );
};
