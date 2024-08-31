import React from 'react';
import { getIn18Text } from 'api';
interface Props {
  fromAccount: string;
  accounts: string[];
  children(id: string): React.ReactElement;
}
export const AddTeamMembers: React.FC<Props> = props => {
  const { fromAccount, accounts, children: createUserComponent } = props;
  return (
    <>
      {createUserComponent(fromAccount)}
      <span>{getIn18Text('YAOQING')}</span>
      {accounts.map((account, index) => (
        <React.Fragment key={account}>
          {createUserComponent(account)}
          {index < accounts.length - 1 && <>、</>}
        </React.Fragment>
      ))}
      {getIn18Text('JIARUQUNZU')}
    </>
  );
};
