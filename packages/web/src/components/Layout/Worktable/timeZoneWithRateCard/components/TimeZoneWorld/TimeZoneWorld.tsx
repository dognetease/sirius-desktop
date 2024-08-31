import { getIn18Text } from 'api';
import React, { useEffect, useRef, useState } from 'react';
import { calculateTime, workTableTrackAction } from '../../../worktableUtils';
import momentTz from 'moment-timezone';
import { Select } from 'antd';
import styles from './TimeZoneWorld.module.scss';
import DropDownIcon from '../../../icons/DropDown';
import commonStyles from '../../common.module.scss';

const TimeZoneWorld: React.FC<{
  timeZoneList: { label: string; value: string }[];
  currTimeZone: { label: string; value: string; momentId: string };
  handleTimeZoneChange: (label: string, value: string) => void;
  handleDropDownVisibleChange: (open: boolean) => void;
  currTime: number;
}> = props => {
  const { timeZoneList, currTimeZone, handleTimeZoneChange } = props;
  const [timeInfo, setTimeInfo] = useState({
    hours: '--:--:--',
    date: getIn18Text('--YUE--RI'),
    week: '--',
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const handleSelectChange = (params: { label: string; value: string }) => {
    if (params.value === currTimeZone.value) return;
    workTableTrackAction('waimao_worktable_worldtime', 'area_choice');
    handleTimeZoneChange(params.label, params.value);
  };

  const handleDropDownVisibleChange = (open: boolean) => {
    props.handleDropDownVisibleChange(open);
  };

  useEffect(() => {
    // 计算新时间
    if (props.currTime < 0) return;
    const nextTime = calculateTime(momentTz(props.currTime).tz(currTimeZone.momentId));
    setTimeInfo({ ...nextTime });
  }, [props.currTime]);

  return (
    <div className={styles.timeZoneWorldCont} ref={containerRef}>
      {/* <div className={styles.title}>
        {getTransText("SHIJIESHIJIAN")}
      </div> */}
      <div className={styles.timeZoneSelect}>
        <Select
          value={{ label: currTimeZone.label, value: currTimeZone.value }}
          onChange={handleSelectChange}
          className={commonStyles.dropDownSelectCommon}
          suffixIcon={<DropDownIcon />}
          bordered={false}
          labelInValue={true}
          getPopupContainer={() => containerRef.current?.parentElement?.parentElement?.parentElement as unknown as HTMLDivElement}
          onDropdownVisibleChange={handleDropDownVisibleChange}
        >
          {timeZoneList.map(item => {
            return <Select.Option value={item.value}>{item.label}</Select.Option>;
          })}
        </Select>
      </div>
      <div className={styles.timeCountDownCont}>
        <div className={styles.hhmmss}>{timeInfo.hours}</div>
        <div className={styles.monthDay}>
          {timeInfo.date} {timeInfo.week}
        </div>
      </div>
    </div>
  );
};

export default TimeZoneWorld;
