/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-bitwise */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/destructuring-assignment */
import classnames from 'classnames';
import React, { useCallback, useState, useEffect, useImperativeHandle } from 'react';
import {
  AdminAccountInfo,
  apiHolder,
  apis,
  ContactApi,
  ContactModel,
  EdmRoleApi,
  EntityOrg,
  MEMBER_TYPE,
  ModulePrivilege,
  OrgApi,
  PrivilegeItem,
  RoleDetailModel,
} from 'api';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import ArrowRight from '@web-common/components/UI/Icons/svgs/disk/ArrowRight';
import { Button, Input } from 'antd';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { AlertErrorIcon } from '@web-common/components/UI/Icons/icons';
import { TreeSelect } from '../components/selectContact/index';
import EllipsisMore from '@/components/Layout/Customer/components/ellipsisMore/ellipsisMore';
import { EditablePrivilegeSelect } from '../components/privilegeSelect';
import { PageLoading } from '@/components/UI/Loading';
import { listenToNaviate, navigateTo } from '@/components/util/blockableNavigate';
import { RoleMessageTip } from './tip';
import style from './detail.module.scss';

const roleApi = apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;

const backWithConfirm = () =>
  new Promise(resolve => {
    SiriusModal.confirm({
      title: '还未保存设置，确定退出？',
      className: 'no-content-confirm',
      icon: <AlertErrorIcon />,
      okType: 'danger',
      okText: '退出',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });

interface PageProps {
  qs?: Record<string, string>;
  index?: number;
  [key: string]: any;
}

export const RoleDetail: React.FC<PageProps> = props => {
  const [roleId, setRoleId] = useState(props.qs?.id || '');
  const [roleName, setRoleName] = useState('');
  const [data, setData] = useState<RoleDetailModel>();
  const [privilegeList, setPrivilegeList] = useState<ModulePrivilege[]>([]);
  const [loading, setLoading] = useState(false);
  const [readonly, setReadonly] = useState(false);
  const [readonlyRoleName, setReadonlyRoleName] = useState(false);
  const [readonlyPrivilege, setReadonlyPrivilege] = useState(false);
  const [editState, setEditState] = useState(0); // 1 2 4, 二进制位分别表示第一二三个组件是否在编辑状态
  const isCreate = props.qs?.action === 'create';

  const fetchData = useCallback(
    id => {
      setLoading(true);
      roleApi
        .getRoleDetail(id)
        .then(data => {
          setData(data);
          setRoleName(data.roleName);
          if (data.roleType === 'ORG') {
            // 企业设置角色
            setReadonly(false);
            setReadonlyPrivilege(false);
            setReadonlyRoleName(false);
          } else if (data.roleType === 'SYSTEM') {
            // 系统角色
            setReadonly(false);
            setReadonlyRoleName(true);
            setReadonlyPrivilege(true);
          } else {
            // 管理员
            setReadonly(true);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [setData]
  );

  useEffect(() => {
    if (props.qs?.id) {
      fetchData(props.qs.id);
    }
  }, [props.qs?.id]);

  useEffect(() => {
    roleApi.getAllPrivilege().then(res => {
      setPrivilegeList(res);
    });
  }, []);

  useEffect(
    () =>
      listenToNaviate(() => {
        if (editState === 0) {
          return Promise.resolve(true);
        }
        return backWithConfirm().then(flag => !!flag);
      }),
    [editState]
  );

  const createRole = (name: string) =>
    roleApi.addOrRemoveRole({
      op: 1,
      roleName: name,
    });

  const onSaveRoleName = async () => {
    if (roleName.trim() === '') {
      toast.success({ content: '请输入角色名称' });
      return false;
    }
    if (isCreate && !roleId) {
      const id = (await createRole(roleName)).roleId;
      setRoleId(id);
    } else {
      await roleApi.addOrRemoveRole({
        op: 3, // 修改
        roleId,
        roleName,
      });
    }
    toast.success({ content: '保存成功' });
    return true;
  };

  const saveMembers = async (members: AdminAccountInfo[]) => {
    if (!roleId) {
      toast.error({ content: '请先保存角色名称' });
      return false;
    }
    return roleApi.saveMembersToRole({ roleId, members }).then(() => {
      toast.success({ content: '保存成功' });
      return true;
    });
  };

  const savePrivileges = async (privileges: PrivilegeItem[]) => {
    if (!roleId) {
      toast.error({ content: '请先保存角色名称' });
      return false;
    }
    return roleApi
      .savePrivilege({
        roleId,
        privileges: privileges || [],
      })
      .then(() => {
        toast.success({ content: '保存成功' });
        return true;
      });
  };
  return (
    <div className={style.roleDetailPage}>
      <div className={style.pageHead}>
        <div className={style.breadCrumb}>
          <div className={classnames([style.breadCrumbItem, style.clickableCrumb])} onClick={() => navigateTo('#rbac?page=rolePermissions')}>
            角色列表
          </div>
          <ArrowRight stroke="#51555C" />
          <div className={style.breadCrumbItem}>角色详情</div>
        </div>
      </div>
      <div className={style.detail}>
        {isCreate && <RoleMessageTip>若企业成员无任何角色，将无法操作相关功能模块。</RoleMessageTip>}
        <div className={style.row}>
          <RoleName
            roleName={roleName}
            onChange={setRoleName}
            readonly={readonly || readonlyRoleName}
            onSave={onSaveRoleName}
            onEditStateChange={isEdit => setEditState(isEdit ? editState | 1 : editState & 6)}
          />
        </div>
        <div>
          <EditableTreeSelect
            members={data?.members}
            readonly={readonly}
            onSave={saveMembers}
            onEditStateChange={isEdit => setEditState(isEdit ? editState | 2 : editState & 5)}
          />
        </div>

        <div>
          <EditablePrivilegeSelect
            privilegeList={privilegeList}
            accessList={data?.privileges}
            readonly={readonly || readonlyPrivilege}
            onSave={savePrivileges}
            onEditStateChange={isEdit => setEditState(isEdit ? editState | 4 : editState & 3)}
          />
        </div>
      </div>
      {loading && <PageLoading />}
    </div>
  );
};

export interface EditableRoleNameProps {
  readonly?: boolean;
  roleName: string;
  onChange: (value: string) => void;
  onSave?: () => Promise<boolean>;
  onEditStateChange?: (isEdit: boolean) => void;
}

export const RoleName = (props: EditableRoleNameProps) => {
  const [isEdit, setIsEdit] = useState(false);
  const [lastVal, setLastVal] = useState(props.roleName);
  const { readonly } = props;

  useEffect(() => {
    props.onEditStateChange && props.onEditStateChange(isEdit);
  }, [isEdit]);

  const handleEdit = () => {
    setLastVal(props.roleName);
    setIsEdit(true);
  };

  const onCancel = () => {
    props.onChange(lastVal);
    setIsEdit(false);
  };
  const onSave = () => {
    if (props.onSave) {
      props.onSave().then(success => setIsEdit(!success));
    } else {
      setIsEdit(false);
    }
  };
  return (
    <div className={classnames([style.flexContainer, style.editableRoleName])}>
      <label className={style.detailLabel}>角色名称：</label>
      <div className={classnames([style.flex1, { [style.isEdit]: isEdit }])}>
        {!isEdit ? (
          <div className={style.roleNameText} onClick={readonly ? undefined : handleEdit}>
            {props.roleName}
          </div>
        ) : (
          <Input
            className={style.roleNameInput}
            value={props.roleName}
            onChange={e => props.onChange(e.target.value)}
            maxLength={20}
            // onBlur={onExit}
            onPressEnter={onSave}
            readOnly={readonly}
            autoFocus
          />
        )}
      </div>
      <div className={style.actionWrap}>
        {!isEdit && !readonly && (
          <a className={style.rowAction} onClick={handleEdit}>
            编辑
          </a>
        )}
        {isEdit && !readonly && (
          <>
            <Button type="default" className={style.rowAction} onClick={onCancel}>
              取消
            </Button>
            <Button type="primary" ghost className={style.rowAction} onClick={onSave}>
              保存
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

interface EditableTreeSelectProps {
  members?: AdminAccountInfo[];
  readonly?: boolean;
  onSave?: (members: AdminAccountInfo[]) => Promise<boolean>;
  onEditStateChange?: (isEdit: boolean) => void;
}
interface EditableTreeSelectHandle {
  getValue: () => AdminAccountInfo[];
}
export const EditableTreeSelect = React.forwardRef<EditableTreeSelectHandle, EditableTreeSelectProps>((props, ref) => {
  const [isEdit, setIsEdit] = useState(false);
  const [selectedContact, setSelectContact] = useState<ContactModel[]>([]);
  const [selectedOrg, setSelectOrg] = useState<EntityOrg[]>([]);

  const [cacheVal, setCacheVal] = useState({
    contact: selectedContact,
    org: selectedOrg,
  });

  useEffect(() => {
    props.onEditStateChange && props.onEditStateChange(isEdit);
  }, [isEdit]);

  const { readonly, onSave, members } = props;

  const getValue = useCallback(() => {
    const contactMember = selectedContact.map(i => ({
      memberAccId: i.contact.accountOriginId!,
      memberType: MEMBER_TYPE.ACC,
    }));
    const orgMember = selectedOrg.map(i => ({
      memberType: MEMBER_TYPE.ORG,
      memberAccId: i.originId,
    }));
    return [...orgMember, ...contactMember];
  }, [selectedContact, selectedOrg]);

  useImperativeHandle(
    ref,
    () => ({
      getValue: () => getValue(),
    }),
    [selectedContact, selectedOrg]
  );

  useEffect(() => {
    if (members) {
      const orgIds = members.filter(i => i.memberType === MEMBER_TYPE.ORG).map(i => i.memberAccId);
      const contactIds = members.filter(i => i.memberType === MEMBER_TYPE.ACC).map(i => i.memberAccId);
      if (orgIds.length > 0) {
        contactApi
          .doGetOrgList({
            idList: orgIds,
          })
          .then(setSelectOrg);
      } else {
        setSelectOrg([]);
      }
      if (contactIds.length) {
        contactApi.doGetContactById(contactIds).then(setSelectContact);
      } else {
        setSelectContact([]);
      }
    } else {
      setSelectOrg([]);
      setSelectContact([]);
    }
  }, [members]);

  const handleEdit = () => {
    setCacheVal({
      contact: selectedContact,
      org: selectedOrg,
    });
    setIsEdit(true);
  };

  const handleCancel = () => {
    setSelectContact(cacheVal.contact);
    setSelectOrg(cacheVal.org);
    setIsEdit(false);
  };

  const handleSave = async () => {
    const members = getValue();
    if (onSave) {
      onSave(members).then(success => {
        setIsEdit(!success);
      });
    } else {
      setIsEdit(false);
    }
  };

  if (isEdit) {
    return (
      <div className={style.editTreeSelect}>
        <div className={style.selectContactHeader}>
          <span onClick={e => e.stopPropagation()} className={style.detailLabel}>
            添加成员：
          </span>
          <div className={style.actionWrap}>
            <Button type="default" className={style.rowAction} onClick={handleCancel}>
              取消
            </Button>
            <Button type="primary" ghost className={style.rowAction} onClick={handleSave}>
              保存
            </Button>
          </div>
        </div>
        <TreeSelect
          selectedContact={selectedContact}
          selectedOrg={selectedOrg}
          onChange={(contacts, orgs) => {
            setSelectContact(contacts);
            setSelectOrg(orgs);
          }}
        />
      </div>
    );
  }
  const orgItems = selectedOrg.map(i => <MiniMemberItem key={i.id} item={i} />);
  const contactItems = selectedContact.map(i => <MiniMemberItem key={i.contact.accountId} item={i} />);
  const allItems = orgItems.concat(contactItems);

  return (
    <div className={classnames([style.row, style.flexContainer])}>
      <label className={style.detailLabel}>添加成员：</label>
      <div className={style.members} onClick={readonly ? undefined : handleEdit}>
        <EllipsisMore
          renderEllipsisDropdown={count => <>{allItems.slice(allItems.length - count)}</>}
          dropdownStyle={{ maxWidth: '60%', maxHeight: 600, overflow: 'hidden auto' }}
        >
          {allItems}
        </EllipsisMore>
      </div>
      <div className={style.actionWrap}>
        {!readonly && (
          <a className={style.rowAction} onClick={handleEdit}>
            添加
          </a>
        )}
      </div>
    </div>
  );
});

export const MiniMemberItem = ({ item, className }: { item: ContactModel | EntityOrg; className?: string }) => {
  const title = 'contact' in item ? item.contact.contactName : item.orgName;
  return (
    <div className={classnames([style.miniMemberItemWrap, className])}>
      <span className={style.avatar}>
        {'contact' in item ? (
          <AvatarTag size={20} user={{ name: item.contact.accountName, avatar: item.contact.avatar, color: item.contact.color }} />
        ) : (
          <AvatarTag size={20} user={{ name: item.orgName }} />
        )}
      </span>
      <span>{title}</span>
    </div>
  );
};
