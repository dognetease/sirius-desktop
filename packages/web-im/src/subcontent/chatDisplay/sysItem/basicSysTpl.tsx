import React from 'react';
import { getIn18Text } from 'api';
interface Props {
  fromAccount: string;
  accounts: string[];
  children(id: string): React.ReactElement;
  desc?: string;
}
export const BasicSysTpl: React.FC<Props> = props => {
  const { fromAccount, accounts, children: createUserComponent, desc = '' } = props;
  return (
    <>
      {createUserComponent(fromAccount)}
      {accounts.length ? <span>{getIn18Text('JIANG')}</span> : null}
      {accounts.map((account, index) => (
        <React.Fragment key={account}>
          {createUserComponent(account)}
          {index < accounts.length - 1 && <>、</>}
        </React.Fragment>
      ))}
      {desc}
    </>
  );
};
