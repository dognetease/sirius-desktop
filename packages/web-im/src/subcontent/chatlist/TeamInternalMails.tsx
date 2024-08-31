import React, { FC, useState } from 'react';
import { Drawer } from 'antd';
import classnames from 'classnames/bind';
import { apiHolder, apis, IMTeamApi, SystemApi, NIMApi, MailListRes } from 'api';
import { getDistanceFromTop } from '@web-im/utils/im_team_util';
import { ReactComponent as DeleteIcon } from '@/images/icons/modal_close_temp.svg';
import EmptyImg from '@/images/mail/mail-discuss-empty.svg';
import styles from './teamInternalMails.module.scss';
import { MailListItem } from './MailListItem';
import { getIn18Text } from 'api';
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const realStyle = classnames.bind(styles);
const inElectron = systemApi.isElectron(); // 是否是electron打开
// doGetAccountIsAdmin 是否是管理员
// 群内邮件挂件弹出抽屉
export const TeamInternalMails: FC<{
  show: boolean;
  onClose: () => void;
  list: MailListRes['msgs']; // 列表
  teamId: string;
  total: number;
  needDelete: boolean; // 是否需要删除按钮
}> = props => {
  const { show, onClose, list = [], teamId, total, needDelete } = props;
  const topDis = getDistanceFromTop();
  const getContainer = (): HTMLElement => (document.querySelector('.root-wrap') as HTMLElement) || document.body;
  return (
    <Drawer
      width={380}
      className={realStyle('teamMailsDrawer')}
      placement="right"
      closable={false}
      mask
      visible={show}
      getContainer={getContainer}
      maskStyle={{
        backgroundColor: 'transparent',
        top: `-${topDis}px`,
        height: `calc(100% + ${topDis}px)`,
      }}
      contentWrapperStyle={{
        position: inElectron ? 'absolute' : 'fixed',
        top: `${topDis}px`,
        height: `calc(100% - ${topDis}px)`,
      }}
      destroyOnClose
      onClose={onClose}
    >
      {/* 内容区域 */}
      <div className={realStyle('teamMailList')}>
        {/* header区域 */}
        <div className={realStyle('teamMailListTitle')}>
          <div className={realStyle('teamMailListTitleLeft')}>
            {getIn18Text('QUNNEIYOUJIAN ')}
            {total})
          </div>
          <div className={`dark-svg-invert ${realStyle('teamMailListTitleRight')}`} onClick={onClose}>
            <DeleteIcon />
          </div>
        </div>
        {/* 列表区域 */}
        {list.length > 0 ? (
          <div className={realStyle('teamMailListWrapper')}>
            {list.map((item, index) => (
              <MailListItem needDelete={needDelete} key={index} teamId={teamId} item={item} />
            ))}
          </div>
        ) : (
          <div className={realStyle('teamListEmpty')}>
            <div className={realStyle('emptyContent')}>
              <img src={EmptyImg} alt="" />
              <div className={realStyle('emptyInfo')}>{getIn18Text('TAOLUNZUNEIZAN')}</div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};
