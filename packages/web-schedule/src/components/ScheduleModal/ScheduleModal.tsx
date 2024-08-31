import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import { api } from 'api';
import { Divider } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { ScheduleActions, useActions, useAppSelector } from '@web-common/state/createStore';
import Left from './Left';
import Right from './Right';
import CreateScheduleBox from '../CreateBox/CreateBox';
import { SchedulePageEventData } from '../CreateBox/EventBody';
import { getContanctObjs, initDefaultMoment } from '../CreateBox/util';
import { getCatalogList, getCatalogUnChecked, queryFreeBusyList } from '../../service';
import styles from './left.module.scss';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import busyIcon from '@/images/emoji/busy.png';
import freeIcon from '@/images/emoji/free.png';
import { ScheduleSyncObInitiator } from '../../data';
import scheduleTracker from '../../tracker';
import { ContactItem } from '@web-common/utils/contact_util';
import { getIn18Text } from 'api';
const sysApi = api.getSystemApi();
const eventApi = api.getEventApi();
// 宽高
const MODAL_WIDTH = 640;
const MODAL_HEIGHT = 600;
interface ScheduleModalProps {
  user: string;
  showClose?: boolean; // 是否展示关闭按钮
}
const isContactModule = () => location.hash.slice(1, 8) === 'contact';
const ScheduleModal: React.FC<ScheduleModalProps> = ({ user, showClose = true }) => {
  const rightRef = useRef(null);
  const actions = useActions(ScheduleActions);
  // 是否展示弹窗
  const [visible, setvisible] = useState(false);
  // 同步日程状态
  const [loading, setLoading] = useState(false);
  // 选中的日期，视图显示日期
  const [selectedDay, setSelectedDay] = useState(moment());
  // 是否新建日程
  const [showBox, setShowbox] = useState(false);
  // 当前用户的忙闲状态
  const [isBusy, setIsBusy] = useState<boolean | null>(null);
  // 默认联系人
  const [defaultContactList, setDefaultContactList] = useState<ContactItem[] | undefined>(undefined);
  const { catalogList, unSelectedCatalogIds } = useAppSelector(state => state.scheduleReducer);
  // 进入执行，监听user变化，重新获取忙闲
  useEffect(() => {
    // 获取忙闲状态
    getFreeBusy();
  }, [user]);
  // 监听visible变化，获取日历数据和loading
  useEffect(() => {
    let eid: any;
    if (visible) {
      // 获取日历
      getCataLoglist();
      // 监听独立窗口创建成功
      eid = eventApi.registerSysEventObserver('syncSchedule', {
        func: e => {
          if (e.eventStrData === ScheduleSyncObInitiator.MODAL_MODULE) {
            e.eventData && SiriusMessage.success({ content: e.eventData.msg });
            setLoading(true);
          }
        },
      });
    }
    return () => {
      eventApi.unregisterSysEventObserver('syncSchedule', eid);
    };
  }, [visible]);
  // 获取日历信息
  const getCataLoglist = async () => {
    const catalogList = await getCatalogList();
    actions.updateCatlogList(catalogList);
    // 同步默认选中日历
    actions.updateUnSelectedCatalogIds(getCatalogUnChecked());
  };
  // 获取忙闲状态
  const getFreeBusy = () => {
    queryFreeBusyList({
      users: [user],
      start: moment().clone().subtract(15, 'minute').toDate(),
      end: moment().clone().add(15, 'minute').toDate(),
    }).then(res => {
      if (res[0] && res[0].freeBusyItems.length) {
        setIsBusy(true);
      } else {
        setIsBusy(false);
      }
    });
  };
  // 新建日程
  const addSchedule = async (isDirect: boolean, hour: number) => {
    // 如果是直接创建，则取当前时间，向后取半小时的整，如果传递了时间
    const defaultMoment = initDefaultMoment(selectedDay);
    const creatDirectStartTime = defaultMoment.startTime;
    const creatDirectEndTime = defaultMoment.endTime;
    if (!isDirect) {
      creatDirectStartTime.hour(hour).minutes(0);
      creatDirectEndTime.hour(hour + 1).minutes(0);
    }
    // 默认联系人
    const currentUser = sysApi.getCurrentUser()?.id;
    const users = [...new Set([user, currentUser as string])];
    const ContactList = await getContanctObjs(users);
    // 获取日历
    if (sysApi.isElectron()) {
      const initData: SchedulePageEventData = {
        catalogList,
        unSelectedCatalogIds,
        creatDirectStartTimeStr: creatDirectStartTime.format('YYYY-MM-DD HH:mm'),
        creatDirectEndTimeStr: creatDirectEndTime.format('YYYY-MM-DD HH:mm'),
        defaultContactList: ContactList,
        source: ScheduleSyncObInitiator.MODAL_MODULE,
      };
      sysApi.createWindowWithInitData('scheduleOpPage', { eventName: 'initPage', eventData: initData });
      // 半秒以后，选中区域消失
      setTimeout(() => {
        rightRef.current?.resetTimeClick();
      }, 500);
    } else {
      actions.setCreatDirectStartTime(creatDirectStartTime);
      actions.setCreatDirectEndTime(creatDirectEndTime);
      setDefaultContactList(ContactList);
      setShowbox(true);
    }
  };
  // 关闭新建
  const onCancel = () => {
    rightRef.current?.resetTimeClick();
    setShowbox(false);
  };
  // 创建成功关闭
  const onSyncCancel = () => {
    setLoading(true);
  };
  // 点击查看日程
  const onShow = event => {
    event.stopPropagation();
    setSelectedDay(moment());
    setvisible(true);
    scheduleTracker.scheduleContact({
      action: 'click',
      from: isContactModule() ? 'contact_detail' : 'contact_card',
    });
  };
  const onHide = event => {
    setvisible(false);
    event.stopPropagation();
  };
  useEffect(() => {
    scheduleTracker.scheduleContact({
      action: 'show',
      from: isContactModule() ? 'contact_detail' : 'contact_card',
    });
  }, [user]);
  return (
    <>
      <span>
        <span onClick={onShow}>{getIn18Text('CHAKANRICHENG')}</span>
        {isBusy !== null && (
          <span className={styles.textNormal}>
            <Divider type="vertical" />
            <img className={styles.busyFreeIcon} src={isBusy ? busyIcon : freeIcon} alt="" />
            {isBusy ? getIn18Text('DANGQIANMANGLUZHONG') : getIn18Text('DANGQIANKONGXIANZHONG')}
          </span>
        )}
      </span>
      <Modal
        bodyStyle={{ height: MODAL_HEIGHT, padding: 0, overflow: 'hidden' }}
        getContainer={() => document.body}
        maskStyle={{ zIndex: 1030 }}
        wrapClassName={styles.scheduleModalWrap}
        footer={null}
        destroyOnClose
        centered
        closable={showClose}
        width={MODAL_WIDTH}
        visible={visible}
        onCancel={onHide}
      >
        <div
          className="sirius-no-drag"
          style={{ display: 'flex', height: '100%' }}
          onClick={e => {
            e.stopPropagation();
          }}
        >
          <Left loading={loading} setLoading={setLoading} selectedDay={selectedDay} setSelectedDay={setSelectedDay} addSchedule={addSchedule} />
          <Right
            ref={rightRef}
            loading={loading}
            setLoading={setLoading}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            addSchedule={addSchedule}
            user={user}
          />
          {showBox && (
            <CreateScheduleBox
              source={ScheduleSyncObInitiator.MODAL_MODULE}
              defaultContactList={defaultContactList}
              onCancel={onCancel}
              onSyncCancel={onSyncCancel}
              getReferenceElement={() => null}
            />
          )}
        </div>
      </Modal>
    </>
  );
};
export default ScheduleModal;
