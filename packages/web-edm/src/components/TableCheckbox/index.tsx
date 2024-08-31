import React, { FC, useState, useEffect } from 'react';
import { Checkbox } from 'antd';

export const TableCheckbox: FC<{
  defaultChecked: boolean;
  onchange: (e: any) => void;
}> = ({ defaultChecked, onchange }) => {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(defaultChecked);
  }, [defaultChecked]);

  return (
    <Checkbox
      checked={checked}
      defaultChecked={defaultChecked}
      onChange={e => {
        setChecked(e.target.checked);
        onchange(e);
      }}
    />
  );
};
