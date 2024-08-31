import React, { useState, useEffect, useCallback, useMemo } from 'react';
import classnames from 'classnames';
import moment, { Moment } from 'moment';
import { Drawer, Divider, Checkbox, Tooltip } from 'antd';
import { getEvents, syncPreNextEventsToDB, getSetting, updateSetting, getZoneList, getZoneId } from './service';
import styles from './settingDrawer.module.scss';
import stylesOuter from './eventsgroups.module.scss';
import { ReactComponent as IconWarn } from '@/images/icons/icon-warn.svg';
import { ScheduleActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { catalogSettingModel, getIn18Text, SystemApi, ZoneItem } from 'api';
import { api } from 'api';
import CloseIcon from '@web-common/components/UI/Icons/svgs/CloseMailSvg';
// import EnhanceSelect from '@web-common/components/UI/Select/enhanceSelect';
// import InSingleOption from '@web-common/components/UI/Select/options/inSingleOption';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import Button from '@web-common/components/UI/Button';

const storeApi = api.getDataStoreApi();
const systemApi = api.getSystemApi() as SystemApi;
const isEdm = !!process.env.BUILD_ISEDM;
const isWebWmEntry = !!process.env.IS_WM_ENTRY;
export interface SettingDrawerProps {
  visible: boolean;
  handleClose: (weekFirstDay: number, weekNumbersVisible: boolean, settingZoneList: number[], showSecondaryZone: boolean) => void;
}
const getTopByEnv = () => {
  if (systemApi.isElectron()) {
    return '0px';
  }
  if (isWebWmEntry) {
    return '47px';
  }
  if (isEdm) {
    return '0px';
  }
  return '47px';
};

const SettingDrawer: React.FC<SettingDrawerProps> = ({ visible = false, handleClose }) => {
  const {
    weekFirstDay: rdxWeekFirstDay,
    weekNumbersVisible: rdxWeekNumbersVisible,
    settingZoneList: sZoneList = [],
    showSecondaryZone: sShowSecondaryZone,
  } = useAppSelector(state => state.scheduleReducer);
  const [weekFirstDay, setWeekFirstDay] = useState<number>(rdxWeekFirstDay === 0 ? 7 : rdxWeekFirstDay);
  const [weekNumbersVisible, setWeekNumbersVisible] = useState<boolean>(!!rdxWeekNumbersVisible);
  const [notification, setNotification] = useState<boolean>(true);
  const [showSecondaryZone, setShowSecondaryZone] = useState<boolean>(sShowSecondaryZone);
  const [settingZoneList, setSettingZoneList] = useState<number[]>(sZoneList);
  const [zoneList, setZoneList] = useState<ZoneItem[]>([]);
  const [defaultZoneId, setDefaultZoneId] = useState<number>(290);
  useEffect(() => {
    getZoneList().then(res => {
      setZoneList(res);
    });
    getZoneId().then(res => {
      setDefaultZoneId(res);
    });
  }, []);
  useEffect(() => {
    if (visible) {
      getSetting().then((res: catalogSettingModel) => {
        setWeekNumbersVisible(!!res?.commonSetting?.showWeekNumber);
        // const weekFirstNumber = res.wkst === 7 ? 0 : res.wkst;
        setWeekFirstDay(res.wkst);
        setNotification(!!res.reminderNotice);
        setShowSecondaryZone(!!res?.commonSetting?.showSecondaryZone);
        if (res?.commonSetting?.secondaryZoneIds && res?.commonSetting?.secondaryZoneIds?.length > 0) {
          setSettingZoneList([...res?.commonSetting?.secondaryZoneIds]);
        }
      });
    }
  }, [visible]);

  const handleAddZone = useCallback(() => {
    if (settingZoneList && settingZoneList?.length < 10) {
      // settingZoneList.push(defaultZoneId);
      setSettingZoneList(list => {
        let res = [...list];
        res.push(defaultZoneId);
        return res;
      });
    }
  }, [settingZoneList, defaultZoneId]);
  const onDrawerClose = useCallback(() => {
    const weekFirstNumber = weekFirstDay === 7 ? 0 : weekFirstDay;
    handleClose(weekFirstNumber, weekNumbersVisible, settingZoneList, showSecondaryZone);
    updateSetting({
      wkst: weekFirstDay,
      commonSetting: { showWeekNumber: Number(weekNumbersVisible), secondaryZoneIds: settingZoneList, showSecondaryZone: Number(showSecondaryZone) },
      reminderNotice: Number(notification),
    });
  }, [weekFirstDay, weekNumbersVisible, notification, settingZoneList, showSecondaryZone]);
  const handleZoneItemRemove = useCallback(
    (idx: number) => {
      setSettingZoneList(list => {
        let res = [...list];
        res.splice(idx, 1);
        return res;
      });
    },
    [setSettingZoneList, settingZoneList]
  );
  const handleZoneItemChange = useCallback(
    (idx: number, val) => {
      setSettingZoneList(list => {
        let res = [...list];
        res.splice(idx, 1, val);
        return res;
      });
    },
    [setSettingZoneList, settingZoneList]
  );
  const renderSettingList = useMemo(() => {
    if (showSecondaryZone && settingZoneList.length > 0) {
      return (
        <div className={styles.settingZoneList}>
          {settingZoneList.map((item: number, idx) => {
            return (
              <>
                <div className={styles.settingZoneDiv}>
                  <span className={styles.settingZoneSpan}>{getIn18Text('CIYAOSHIQU')}</span>
                  <div onClick={() => handleZoneItemRemove(idx)}>
                    <CloseIcon className="dark-invert" />
                  </div>
                </div>
                <div className={styles.settingZoneSelect}>
                  <EnhanceSelect
                    value={item}
                    style={{ width: '100%' }}
                    onChange={value => {
                      // langTemp = value;
                      // setShowModal(true);
                      handleZoneItemChange(idx, value);
                    }}
                    // className={styles.settingMenuOperationsSelect}
                    options={zoneList.map(zoneItem => ({ value: zoneItem.id, label: `${zoneItem.content} ${zoneItem.key}` }))}
                  />
                </div>
              </>
            );
          })}
        </div>
      );
    }
    return <></>;
  }, [showSecondaryZone, settingZoneList]);
  const top = getTopByEnv();
  return (
    <Drawer
      className={styles.settingDrawer}
      mask={false}
      title={getIn18Text('RILISHEZHI')}
      closeIcon={<CloseIcon className="dark-invert" />}
      contentWrapperStyle={{ top, height: `calc(100% - ${top})` }}
      bodyStyle={{ padding: '0', paddingTop: '0px', overflowX: 'hidden' }}
      placement="right"
      width="720px"
      visible={visible}
      open={visible}
      onClose={onDrawerClose}
    >
      <div className={styles.settingMenu}>
        <div className={styles.settingMenuLabels}>
          <div className={styles.settingLabelCalendar}>
            <span className={`dark-invert ${styles.calendarIcon}`}></span>
            {getIn18Text('RILI')}
          </div>
        </div>
        <Divider style={{ margin: '0', height: '80%' }} type="vertical" />
        <div className={styles.settingMenuOperations}>
          <p className={styles.settingMenuP}>{getIn18Text('RILIXIANSHI')}</p>
          <p>{getIn18Text('MEIZHOUDEDIYIT')}</p>
          <EnhanceSelect
            value={weekFirstDay}
            onChange={value => {
              // langTemp = value;
              // setShowModal(true);
              setWeekFirstDay(value);
            }}
            className={styles.settingMenuOperationsSelect}
          >
            <InSingleOption value={6}>{getIn18Text('ZHOULIU')}</InSingleOption>
            <InSingleOption value={7}>{getIn18Text('ZHOURI')}</InSingleOption>
            <InSingleOption value={1}>{getIn18Text('ZHOUYI')}</InSingleOption>
          </EnhanceSelect>
          {/* <p>{getIn18Text('SHIFOUXUNAXHONG')}</p> */}
          <Checkbox
            checked={weekNumbersVisible}
            onChange={e => {
              setWeekNumbersVisible(!!e.target?.checked);
            }}
            defaultChecked={weekNumbersVisible}
          >
            <span className={styles.weekNumberCheckbox}>
              <span>{getIn18Text('XIANSHIZHOUSHU')}</span>
            </span>
          </Checkbox>
          {systemApi.isElectron() && (
            <>
              <div className={styles.noticeWrap}>
                <p className={styles.noticeLabel}>{getIn18Text('RICHENGZHUOMIANTONGZ')}</p>
                <Tooltip
                  overlayStyle={{ maxWidth: '400px' }}
                  placement="top"
                  title={
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{getIn18Text('RICHENGZHUOMIANTONGZFW：ZZDSZL【YYNTX】DRCSX，QXMZYXTJ：')}</span>
                      <span>{getIn18Text('1、YIXIARICHTX：ZJCJDRC，HZWJSD、DDD、WCZDRC。')}</span>
                      <span>{getIn18Text('2、YIXIARICBTX：WJJDRC，HZDYTRRLXDRC。')}</span>
                    </div>
                  }
                >
                  <IconWarn style={{ cursor: 'pointer', marginLeft: '4px' }} />
                </Tooltip>
              </div>
              <Checkbox
                checked={notification}
                onChange={e => {
                  setNotification(!!e.target?.checked);
                }}
                defaultChecked={notification}
              >
                <span className={styles.weekNumberCheckbox} style={{ marginTop: 0 }}>
                  <span>{getIn18Text('KAIQI')}</span>
                </span>
              </Checkbox>
            </>
          )}
          <>
            <p className={styles.settingMenuP} style={{ marginTop: 20, marginBottom: 0 }}>
              {getIn18Text('SHIQUSHEZHI')}
            </p>
            <Checkbox
              checked={showSecondaryZone}
              onChange={e => {
                setShowSecondaryZone(!!e.target?.checked);
              }}
              defaultChecked={showSecondaryZone}
            >
              <span className={styles.weekNumberCheckbox}>
                <span>{getIn18Text('XIANSHICIYAOSHIQ')}</span>
              </span>
            </Checkbox>
            {renderSettingList}
            <Button
              btnType="link"
              hidden={!showSecondaryZone}
              style={{ marginLeft: 10, marginTop: 8 }}
              disabled={settingZoneList.length >= 10}
              onClick={handleAddZone}
              size="small"
            >
              {getIn18Text('TIANJIASHIQU')}
            </Button>
          </>
        </div>
      </div>
    </Drawer>
  );
};
export default SettingDrawer;
