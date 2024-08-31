import React, { useMemo } from 'react';
import classnames from 'classnames/bind';
import style from '../chatItemAlt.module.scss';
import { PopoverUser } from '../../../common/usercard/userCard';
import { useYunxinAccount } from '../../../common/hooks/useYunxinAccount';

const realStyle = classnames.bind(style);
interface ItemAccountApi {
  id: string;
}
export const ItemAccount: React.FC<ItemAccountApi> = props => {
  const { id } = props;
  const user = useYunxinAccount(id);

  return useMemo(
    () => (
      <PopoverUser user={user}>
        <span className={realStyle('username')}>@{user?.nick || 'default'}</span>
      </PopoverUser>
    ),
    [user]
  );
};
