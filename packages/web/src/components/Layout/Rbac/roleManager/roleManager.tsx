/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from 'react';
import { apiHolder, apis, ContactApi, ContactModel, EdmRoleApi, OrgApi, RoleListItem, RoleModel } from 'api';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import style from './index.module.scss';
import { Button, Spin } from 'antd';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import CaretRightFilled from '@ant-design/icons/CaretRightFilled';
import classNames from 'classnames';
import { ColumnType } from 'antd/lib/table';
import classnames from 'classnames';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { AlertErrorIcon } from '@web-common/components/UI/Icons/icons';
import { navigateTo } from '@/components/util/blockableNavigate';
import { RoleMessageTip } from './tip';
import { getIn18Text } from 'api';
const roleApi = apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
export const RoleManager = () => {
  const user = apiHolder.api.getSystemApi().getCurrentUser();
  const [roleList, setRoleList] = useState<Array<RoleListItem>>([]);
  const [myRoles, setMyRoles] = useState<Array<RoleModel>>([]);
  const [loading, setLoading] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const columns: ColumnType<RoleListItem>[] = [
    {
      title: getIn18Text('JIAOSEMINGCHENG'),
      dataIndex: 'roleName',
      ellipsis: {
        showTitle: true,
      },
      render(name: string, item: RoleListItem) {
        return (
          <>
            {name}
            {item.roleType === 'SYSTEM' || item.roleType === 'ADMIN' ? <span className={style.systemRoleTag}>{getIn18Text('XITONGJIAOSE')}</span> : null}
          </>
        );
      },
    },
    {
      title: getIn18Text('CHUANGJIANSHIJIAN'),
      width: 350,
      dataIndex: 'createTime',
    },
    {
      title: getIn18Text('RENSHU'),
      dataIndex: 'count',
      width: 150,
    },
    {
      title: getIn18Text('CAOZUO'),
      width: 100,
      render(_, item) {
        return (
          <>
            <a onClick={() => navigateTo('/#rbac?page=roleDetail&id=' + item.roleId)}>
              {(item as any).roleType === 'ORG' ? getIn18Text('BIANJI') : getIn18Text('CHAKAN')}
            </a>
            {(item as any).roleType === 'ORG' && (
              <a onClick={() => handleDelete(item.roleId)} style={{ marginLeft: 8 }}>
                {getIn18Text('SHANCHU')}
              </a>
            )}
          </>
        );
      },
    },
  ];
  const fetchData = () => {
    setLoading(true);
    roleApi
      .getRoleList()
      .then(res => {
        setRoleList(res.roles);
        setMyRoles(res.myRoles);
      })
      .finally(() => setLoading(false));
  };
  const handleDelete = (roleId: string) => {
    SiriusModal.confirm({
      title: getIn18Text('QUERENSHANCHUGAIJIAOSE?'),
      className: 'no-content-confirm',
      icon: <AlertErrorIcon />,
      okType: 'danger',
      onOk: () => {
        // todo 删除
        roleApi
          .addOrRemoveRole({
            roleId,
            op: 2,
          })
          .then(fetchData);
      },
    });
  };
  useEffect(() => {
    fetchData();
  }, []);
  return (
    <div className={style.pageWrapper}>
      <div className={style.pageHeader}>
        <div className={style.pageTitle}>{getIn18Text('WODEJIAOSE')}</div>
        <div className={style.currentUser}>
          <AvatarTag
            size={32}
            user={{
              name: user?.nickName,
              avatar: user?.avatar,
              email: user?.id,
              color: user?.contact?.contact?.color,
            }}
          />
          <span>{user?.id}</span>
          {myRoles.map(role => (
            <div className={style.roleTag} key={role.roleId} title={role.roleName}>
              {role.roleName}
            </div>
          ))}
        </div>
      </div>
      <div className={style.roleListWrapper}>
        <div className={classnames([style.pageTitle, 'clearfix'])}>
          {getIn18Text('JIAOSELIEBIAO')}
          <Button type="primary" onClick={() => navigateTo('/#rbac?page=roleDetail&action=create')} className="pull-right">
            {getIn18Text('XINJIANJIAOSE')}
          </Button>
        </div>
        <RoleMessageTip>{getIn18Text('RUOQIYECHENGYUANWURENHEJIAOSE\uFF0CJIANGWUFACAOZUOXIANGGUANGONGNENGMOKUAI\u3002')}</RoleMessageTip>
        <Table
          rowKey="roleId"
          className={classnames([style.roleTable, 'edm-table'])}
          columns={columns}
          dataSource={roleList}
          pagination={false}
          loading={loading}
          expandable={{
            columnWidth: 30,
            expandIcon: ({ expanded, onExpand, record, expandable }) => {
              if (!expandable) return null;
              return <CaretRightFilled onClick={e => onExpand(record, e)} className={classNames([style.expandIcon, { [style.expandIconOpen]: expanded }])} />;
            },
            rowExpandable: record => record.count !== undefined && record.count > 0,
            expandedRowRender: (record, index, indent, expanded) => <RoleMembersExpand role={record} expanded={expanded} />,
          }}
        />
      </div>
    </div>
  );
};
const RoleMembersExpand = ({ role, expanded }: { role: RoleListItem; expanded: boolean }) => {
  const [contactList, setContactList] = useState<ContactModel[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (role.members && expanded) {
      contactApi.doGetContactById(role.members).then(res => {
        setContactList(res);
      });
    }
  }, [role.members, expanded]);
  if (!expanded) {
    return <Spin />;
  }
  return (
    <ul className={style.roleMemberList}>
      {contactList.map(item => (
        <li key={item.contact.id}>
          <AvatarTag
            innerStyle={{ border: 'none' }}
            size={32}
            user={{
              name: item.contact.contactName,
              email: item.contact.accountName,
            }}
          />
          <div>
            <div className={style.mainText}>{item.contact.contactName}</div>
            <div className={style.subText}>{item.contact.accountName}</div>
          </div>
        </li>
      ))}
    </ul>
  );
};
