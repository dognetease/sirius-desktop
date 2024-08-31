// import { IMUser } from 'api/src/api/logical/im';
import React, { useEffect, useState, useMemo } from 'react';
import { apiHolder, ContactApi, ContactModel, IMUser, NIMApi } from 'api';
import classnames from 'classnames/bind';
import { Popover } from 'antd';
import style from './userCard.module.scss';
import ContactDetail from '@web-contact/component/Detail/detail';

const realStyle = classnames.bind(style);
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

interface PopoverUserApi {
  user: IMUser | undefined;
}
const contactApi = apiHolder.api.requireLogicalApi('contactApi') as ContactApi;

// 用户卡片 封装
export const UserCard: React.FC<PopoverUserApi> = props => {
  const { user } = props;

  // const [contactInfo,setContactInfo]=useState<ContactModel|undefined>(undefined)
  // useEffect(()=>{
  //   if(!user || !user.contactId){
  //     return
  //   }
  //   contactApi.doGetContactById(user.contactId!).then((info)=>{
  //     setContactInfo(info[0])
  //   })
  // },[user?.contactId])
  // if(!contactInfo){
  //   return null
  // }
  return (
    <div className={`extheme ${realStyle('userCardWrapper')}`}>
      <ContactDetail contactId={user?.contactId} email={user?.email} branch />
    </div>
  );
};

const ForceupdateUser: React.FC<{ account: string; timestamp?: number }> = ({ account, timestamp }) => {
  useEffect(() => {
    if (timestamp !== 0 && account) {
      nimApi.imusers.requestUser(account + '@' + new Date().getTime());
    }
  }, [timestamp]);
  return null;
};

export const PopoverUser: React.FC<PopoverUserApi> = props => {
  const { user, classname = realStyle('mentionUserLink'), placement = 'top' } = props;
  const [forceUpdateTimestamp, setForceUpdateTimestamp] = useState(0);

  const popoverComponent = useMemo(
    () => (
      <Popover
        placement="bottom"
        transitionName=""
        content={
          <div>
            <UserCard user={user} />
          </div>
        }
        trigger={['click']}
        onVisibleChange={v => {
          v && setForceUpdateTimestamp(new Date().getTime());
        }}
        destroyTooltipOnHide
        overlayStyle={{ minWidth: '320px' }}
      >
        {props.children || <span className={classname}>{user?.nick || user?.account || 'default'}</span>}
      </Popover>
    ),
    [user?.account || '', user?.avatar]
  );
  // 如果是云信账号(系统通知类角色)
  if (/^lx_/.test(user?.account || '')) {
    return React.isValidElement(props.children) ? props.children : <span className={classname}>{user?.nick || user?.account || 'default'}</span>;
  }

  return (
    <>
      {popoverComponent}
      <ForceupdateUser timestamp={forceUpdateTimestamp} account={user?.account || ''} />
    </>
  );
};
