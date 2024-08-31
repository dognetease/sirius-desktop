import React from 'react';
import styles from './index.module.scss';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import { TimeZoneItem } from 'api';

interface TimeZoneSelectProps {
  timeZoneList: TimeZoneItem[];
  onChange?: (val: number) => void;
  timeZone?: string;
}

const TimeZoneSelect: React.FC<TimeZoneSelectProps> = ({ onChange, timeZone, timeZoneList }) => {
  const handleTimeZoneChange = (val: number) => {
    onChange && onChange(val);
  };

  return (
    <div className={styles.timeZoneSelect}>
      <EnhanceSelect defaultValue={8} value={timeZone || 8} onChange={handleTimeZoneChange} style={{ width: 228, height: 32, marginRight: 8 }}>
        {timeZoneList.map(({ key, value }) => (
          <InSingleOption value={key} key={key}>
            {value}
          </InSingleOption>
        ))}
      </EnhanceSelect>
    </div>
  );
};

export default TimeZoneSelect;
