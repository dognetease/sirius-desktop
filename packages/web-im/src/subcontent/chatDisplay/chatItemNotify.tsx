import React, { useEffect, useState } from 'react';
import classnames from 'classnames/bind';
import { apiHolder, apis, ContactApi, OrgApi } from 'api';
import lodashGet from 'lodash/get';
import style from './chatItemNotify.module.scss';
import { useYunxinAccount } from '../../common/hooks/useYunxinAccount';
import { PopoverUser } from '../../common/usercard/userCard';

const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
const realStyle = classnames.bind(style);

interface AuthChangeTargetApi {
  ext: string;
  id: string;
  name: string;
  type: 'FILE' | 'DIR';
  url: string;
}
type PrivilegeApi = 'r' | 'w' | 'rw';
interface AuthChangeContentApi {
  from: string;
  privilege: PrivilegeApi[];
  target: AuthChangeTargetApi;
  to: string;
  // @ts-ignore
  to_type: 'UNIT' | 'PERSON';
}

interface ChatTypeNotifyApi {
  content: AuthChangeContentApi;
}

export const ChatTypeNotify: React.FC<ChatTypeNotifyApi> = props => {
  const { content } = props;

  const fromUser = useYunxinAccount(content.from, 'p2p');

  const [department, setDepartment] = useState('');
  const requestDepartment = async (idList: string[]) => {
    const result = await contactApi.doGetOrgList({
      idList,
    });

    const orgName = lodashGet(result, '[0].orgName', 'default');

    setDepartment(orgName);
  };
  // 查询部门信息
  useEffect(() => {
    content.to_type === 'UNIT' && requestDepartment([content.to]);
  }, []);

  return (
    <div className={realStyle('wrapper')}>
      <p className={realStyle('title')}>权限变更</p>
      <div className={realStyle('content')}>
        <PopoverUser user={fromUser}>
          <span className={realStyle('highlight')}>@{fromUser || ''}</span>
        </PopoverUser>
        给
        <>
          {content.to_type === 'PERSON' && '你'}
          {content.to_type === 'UNIT' && department}
        </>
        开通了[
        {content?.target?.name || ''}
        ]的
        {content.privilege.join('/')}
        权限
      </div>
    </div>
  );
};
