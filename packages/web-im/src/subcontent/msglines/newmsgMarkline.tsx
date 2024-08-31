import React from 'react';
import classnames from 'classnames/bind';
import style from './line.module.scss';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
interface NewmsgMarklineApi {
  visible: boolean;
}
export const NewmsgMarkline: React.FC<NewmsgMarklineApi> = props => {
  const { visible } = props;
  if (visible) {
    return (
      <p data-test-id="im_session_content_newmsgline" className={realStyle('msgUnreadMarkline')}>
        {getIn18Text('YIXIAWEIXINXIAO')}
      </p>
    );
  }
  return null;
};
