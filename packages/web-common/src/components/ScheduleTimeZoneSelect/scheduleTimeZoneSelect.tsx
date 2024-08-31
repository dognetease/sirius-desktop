import { CatalogApi, FreeBusyApi, LAST_SELECT_TIMEZONE_ID, MeetingRoomApi, ScheduleApi, ZoneItem, apiHolder, apis } from 'api';
import { EnhanceSelect, InSingleOption } from '@web-common/components/UI';
import React, { CSSProperties, useCallback, useMemo } from 'react';
import classnames from 'classnames';
import { FC, useEffect, useState } from 'react';
import { ScheduleActions, useActions, useAppSelector } from '@web-common/state/createStore';
import styles from './scheduleTimeZoneSelect.module.scss';
import { getDurationText } from '@web-common/components/util/ics';
interface ScheduleTimezoneSelectProps {
  bordered?: boolean;
  showTimeDiffLabel?: boolean;
  localZoneStartTime?: Date;
  localZoneEndTime?: Date;
  allDay?: boolean;
  labelBreakLine?: boolean;
  renderLabelAsGMTFormat?: boolean;
  durationTextLabelStyle?: CSSProperties;
  selectClassName?: string;
}

const catalogApi = apiHolder.api.requireLogicalApi(apis.catalogApiImpl) as unknown as ScheduleApi & CatalogApi & MeetingRoomApi & FreeBusyApi;
const storeApi = apiHolder.api.getDataStoreApi();
const tag = 'scheduleTimeZoneSelect';
const ScheduleTimezoneSelect: FC<ScheduleTimezoneSelectProps> = ({
  bordered = false,
  showTimeDiffLabel = false,
  localZoneStartTime = new Date(),
  localZoneEndTime = new Date(),
  allDay = false,
  durationTextLabelStyle = {},
  labelBreakLine = false,
  renderLabelAsGMTFormat = false,
  selectClassName = '',
}) => {
  const { settingZoneList: sZoneList = [], showSecondaryZone: sShowSecondaryZone, lastSelectTimezone } = useAppSelector(state => state.scheduleReducer);
  const [zoneList, setZoneList] = useState<ZoneItem[]>([]);
  const [lastSelectTimezoneId, setLastSelectTimezoneId] = useState<number>(290);
  const scheduleActions = useActions(ScheduleActions);
  useEffect(() => {
    catalogApi.getZoneList().then(_zoneList => {
      const res = storeApi.getSync(LAST_SELECT_TIMEZONE_ID);
      let _lastSelectTimezoneId: number;
      if (res?.suc && res?.data) {
        _lastSelectTimezoneId = Number(res.data);
      } else {
        _lastSelectTimezoneId = _zoneList[0].id;
      }
      setLastSelectTimezoneId(_lastSelectTimezoneId);
      setZoneList(_zoneList);
      scheduleActions.setLastSelectTimezone(_zoneList.find(item => item.id === _lastSelectTimezoneId) || zoneList[0]);
    });
  }, []);
  const secondaryZoneList = useMemo(() => {
    if (zoneList.length === 0 || sZoneList.length === 0) return [];
    const zoneListMap = new Map();
    zoneList.forEach(item => {
      zoneListMap.set(item.id, item);
    });
    return sZoneList.map(id => zoneListMap.get(id));
  }, [sZoneList, zoneList]);
  const handleZoneItemChange = useCallback(
    value => {
      console.log(tag, 'handleZoneItemChange id', value);
      setLastSelectTimezoneId(value);
      if (zoneList.length > 0) {
        scheduleActions.setLastSelectTimezone(zoneList.find(item => item.id === value) || zoneList[0]);
      }
      storeApi.putSync(LAST_SELECT_TIMEZONE_ID, value);
    },
    [zoneList]
  );
  useEffect(() => {
    try {
      if (zoneList.length > 0) {
        let lastTimezoneIdExists = sZoneList.find(id => id === lastSelectTimezoneId);
        let backTimezone = zoneList.find(item => item.id === sZoneList[0]);
        if (!lastTimezoneIdExists) {
          const defualtId = backTimezone || zoneList[0];
          console.log(tag, 'setLastSelectTimezone', defualtId);
          handleZoneItemChange(defualtId.id);
        }
        // if (!lastTimezone && backTimezone) {
        //   handleZoneItemChange(backTimezone.id);
        // }
        // scheduleActions.setLastSelectTimezone(lastTimezone || backTimezone || zoneList[0]);
      }
    } catch (error) {
      console.error('setLastSelectTimezone error', error);
    }
  }, [sZoneList, zoneList]);

  useEffect(() => {
    if (!lastSelectTimezone?.id || lastSelectTimezone?.id === lastSelectTimezoneId) {
      return;
    }
    handleZoneItemChange(lastSelectTimezone?.id);
  }, [lastSelectTimezone]);

  // TODO 获取不同时区的时间展示
  const renderDurationTextByTimeZone = (optionItem: ZoneItem) => {
    if (renderLabelAsGMTFormat) {
      const localTimezone = -(new Date().getTimezoneOffset() / 60);
      const minutes = `${Math.floor((localTimezone % 1) * 60)}`.padStart(2, '0');
      return (
        <>
          <span className={styles.durationText} style={{ color: 'var(---Text-4-, #545A6E)', ...durationTextLabelStyle }}>
            {`GMT${localTimezone >= 0 ? '+' : '-'}${`${Math.floor(localTimezone)}`.padStart(2, '0')}:${minutes}`}
          </span>
          <span className={styles.durationTextExt} style={{ ...durationTextLabelStyle }}>
            {optionItem.offset}
          </span>
        </>
      );
    }
    const { startStr, endStr, affixStr, crossDay, crossYear } = getDurationText(localZoneStartTime, localZoneEndTime, !!allDay, true, false, optionItem?.totalSeconds);
    const breakLine = labelBreakLine && crossDay;
    return (
      <div className={styles.durationWrap}>
        <span className={styles.durationText} style={{ display: 'inline-block', ...durationTextLabelStyle, width: breakLine && !allDay ? 300 : 'auto' }}>
          {`${startStr}${breakLine ? '' : endStr}`}
          {!breakLine ? ` (${optionItem.offset})` : ''}
        </span>
        {breakLine && <span className={styles.durationTextExt} style={{ ...durationTextLabelStyle }}>{`${endStr}(${optionItem.offset})`}</span>}
      </div>
    );
  };
  const rederOption = (item: any) => {
    return (
      <InSingleOption value={item.id} label={showTimeDiffLabel ? renderDurationTextByTimeZone(item) : item.content} key={item.id}>
        {`${item.content} ${item.key}`}
      </InSingleOption>
    );
  };
  return sShowSecondaryZone && sZoneList?.length ? (
    <EnhanceSelect
      value={lastSelectTimezoneId}
      bordered={bordered}
      style={{ height: labelBreakLine ? 40 : 30 }}
      // style={{ width: '100%' }}
      onChange={value => {
        // langTemp = value;
        // setShowModal(true);
        handleZoneItemChange(value);
      }}
      dropdownAlign={{ overflow: { adjustX: true, adjustY: true } }}
      optionLabelProp="label"
      className={classnames([styles.timeZoneSelectWrap], [selectClassName])}
      dropdownMatchSelectWidth={false}
    >
      {secondaryZoneList.map(zoneItem => {
        return rederOption(zoneItem);
      })}
    </EnhanceSelect>
  ) : (
    <></>
  );
};

export default ScheduleTimezoneSelect;
