import React, { useState } from 'react';
import { TimeLinePickerProps } from 'api';
import { GroupContext } from './context';

export const TimeLinePickerGroup: React.FC<TimeLinePickerProps> = ({ children, ...props }) => {
  const [uniqueId, setUniqueId] = useState<any>();

  return (
    <GroupContext.Provider
      value={{
        props,
        onIdChange: setUniqueId,
        uniqueId,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};
