import React from 'react';
import { getIn18Text } from 'api';
interface Props {
  fromAccount: string;
  toAccount: string;
  children(id: string): React.ReactElement;
}
export const TransferTeam: React.FC<Props> = props => {
  const { fromAccount, toAccount, children: createUserComponent } = props;
  return (
    <>
      {createUserComponent(fromAccount)}
      <span>{getIn18Text('JIANGQUNZHUZHUANRANG')}</span>
      {createUserComponent(toAccount)}
    </>
  );
};
