import React from 'react';
import moment from 'moment';

export interface Props {
  format?: string;
  value: string | number;
  defaultVal?: string;
}

export const DateFormat: React.FC<Props> = props => {
  const { value, format = 'YYYY-MM-DD', defaultVal = '--' } = props;
  return <span>{!value || Number.isNaN(+value) ? defaultVal : moment(value).format(format)}</span>;
};
