import React from 'react';
import classnames from 'classnames/bind';
import { IMUser } from 'api';
import style from './empty.module.scss';
import { UserAvatar } from '../common/imUserAvatar';

const realStyle = classnames.bind(style);
interface SearchUserProps {
  customClassnames: string;
  user: IMUser;
  keyword: string;
}
export const IMSearchServiceNumber: React.FC<SearchUserProps> = props => {
  const { customClassnames, user, keyword } = props;
  return (
    <div className={realStyle('userInfo', customClassnames)}>
      <UserAvatar testId="im_search_service_avatar" user={user} />
      <p
        data-test-id="im_search_service_username"
        className={realStyle('userName')}
        dangerouslySetInnerHTML={{
          __html: `${user.nick}`.replace(keyword, arg => `<span class="${realStyle('highlight')}">${arg}</span>`),
        }}
      />
    </div>
  );
};
