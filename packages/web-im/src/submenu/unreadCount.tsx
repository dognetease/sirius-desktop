import React from 'react';
import classNames from 'classnames/bind';
import { Session, NIMApi, apiHolder } from 'api';
import { useObservable } from 'rxjs-hooks';
import { map } from 'rxjs/operators';
import styles from './imSessionItem.module.scss';

const realStyle = classNames.bind(styles);
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
// 消息未读数量
interface UnReadMsgApi {
  count: number;
  sessionId: string;
  className?: string;
}

const MuteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.9 6.50039C2.9 3.68374 5.18335 1.40039 8 1.40039C9.31967 1.40039 10.5223 1.90162 11.4278 2.72408L12.0757 2.07615L12.8257 2.82613L3.65142 12.0004H2V10.8004H2.9V6.50039ZM5.34848 12.0004H14V10.8004H13.1V6.50039C13.1 5.83269 12.9717 5.19496 12.7384 4.61052L11.7865 5.56242C11.8606 5.86287 11.9 6.17703 11.9 6.50039V10.8004H6.54848L5.34848 12.0004ZM8 2.60039C8.98827 2.60039 9.89069 2.96798 10.578 3.5739L4.1 10.0519V6.50039C4.1 4.34648 5.84609 2.60039 8 2.60039ZM5 13.3004V14.5004H11V13.3004H5Z"
      fill="#A8AAAD"
    />
  </svg>
);

export const MuteMark: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const $isMuted = useObservable(
    (_, $props) => {
      const $sessionId = $props.pipe(map(([id]) => id));
      return nimApi.imnotify.subscribeMuteStatus($sessionId);
    },
    false,
    [sessionId]
  );
  if ($isMuted) {
    return (
      <span data-test-id="im_list_sessionitem_muteicon" className={realStyle('isMuteIcon')}>
        <MuteIcon />
      </span>
    );
  }
  return null;
};

export const UnreadMsgCount: React.FC<UnReadMsgApi> = props => {
  const { count, sessionId, className = '' } = props;
  const $isMuted = useObservable(
    (_, $props) => {
      const $sessionId = $props.pipe(map(([id]) => id));
      return nimApi.imnotify.subscribeMuteStatus($sessionId);
    },
    false,
    [sessionId]
  );
  return (
    <span
      data-test-id="im_list_sessionitem_unreadcount"
      className={realStyle(
        'unReadCount',
        {
          isMuted: $isMuted,
        },
        [className]
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};
