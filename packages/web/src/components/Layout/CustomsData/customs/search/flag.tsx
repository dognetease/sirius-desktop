import React from 'react';
import * as allComs from './baseFlag';
interface Props {
  IconName: any;
}
const Flag = (props: Props) => {
  const { IconName } = props;
  let Component = allComs[IconName] ? allComs[IconName] : () => <span></span>;
  return <Component />;
};
export default Flag;
