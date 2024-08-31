/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-bitwise */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/destructuring-assignment */
import classnames from 'classnames';
import React, { useCallback, useState, useEffect, useImperativeHandle, useMemo } from 'react';
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
  getIn18Text,
} from 'api';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import ArrowRight from '@web-common/components/UI/Icons/svgs/disk/ArrowRight';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { AlertErrorIcon } from '@web-common/components/UI/Icons/icons';
import { TongyongBianji, TongyongTianjia } from '@sirius/icons';
import { TreeSelect } from './selectContact/index';
import EllipsisMore from '../../Customer/components/ellipsisMore/ellipsisMore';
import { EdmPageProps } from '../../EDM/pageProps';
// import { EditablePrivilegeSelect } from '../components/privilegeSelect';
import { EditablePrivilegeSelectV2 } from '../components/privilegeSelect/indexV2';
import { PageLoading } from '@/components/UI/Loading';
import { listenToNaviate, navigateTo } from '@/components/util/blockableNavigate';
import { RoleMessageTip } from './tip';
import style from './v2detail.module.scss';
// import SiriusDrawer from '@web-common/components/UI/SiriusDrawer';
import SiriusDrawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
import { PrivilegeSelectListV2 } from '../components/privilegeSelect/privilegeSelectV2';

const roleApi = apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
const backWithConfirm = () =>
  new Promise(resolve => {
    SiriusModal.confirm({
      title: getIn18Text('HAIWEIBAOCUNSHEZHI\uFF0CQUEDINGTUICHU\uFF1F'),
      className: 'no-content-confirm',
      icon: <AlertErrorIcon />,
      okType: 'danger',
      okText: getIn18Text('TUICHU'),
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
export const RoleDetailV2: React.FC<EdmPageProps> = props => {
  const [roleId, setRoleId] = useState(props.qs.id || '');
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
    if (props.qs.id) {
      fetchData(props.qs.id);
    }
  }, [props.qs.id]);
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
      toast.success({ content: getIn18Text('QINGSHURUJIAOSEMINGCHENG') });
      return false;
    }
    if (isCreate && !roleId) {
      const id = (await createRole(roleName)).roleId;
      setRoleId(id);
    } else {
      await roleApi.addOrRemoveRole({
        op: 3,
        roleId,
        roleName,
      });
    }
    toast.success({ content: getIn18Text('BAOCUNCHENGGONG') });
    return true;
  };
  const saveMembers = async (members: AdminAccountInfo[]) => {
    if (!roleId) {
      toast.error({ content: getIn18Text('QINGXIANBAOCUNJIAOSEMINGCHENG') });
      return false;
    }
    return roleApi.saveMembersToRole({ roleId, members }).then(() => {
      toast.success({ content: getIn18Text('BAOCUNCHENGGONG') });
      return true;
    });
  };
  const savePrivileges = async (privileges: PrivilegeItem[]) => {
    if (!roleId) {
      toast.error({ content: getIn18Text('QINGXIANBAOCUNJIAOSEMINGCHENG') });
      return false;
    }
    return roleApi
      .savePrivilege({
        roleId,
        privileges: privileges || [],
      })
      .then(() => {
        toast.success({ content: getIn18Text('BAOCUNCHENGGONG') });
        return true;
      });
  };

  const [open, setOpen] = useState(false);
  const onClose = () => {
    setOpen(false);
  };

  const [dataAccess, setDataAccess] = useState<{ [key: string]: PrivilegeItem }>({});
  const [checkedKeys, setCheckedKeys] = useState<{ [key: string]: string[] }>({});
  const handleChange = (checkedKeys: Record<string, string[]>, dataAccess: { [key: string]: PrivilegeItem }) => {
    setCheckedKeys(checkedKeys);
    setDataAccess(dataAccess);
  };

  const handleSave = useCallback(() => {
    const privileges = getValue();
    savePrivileges(privileges).then(success => {
      setOpen(!success);
      if (props.qs.id) {
        fetchData(props.qs.id);
      }
    });
  }, [checkedKeys, dataAccess, roleId]);

  const resourceMap: Record<string, Omit<ModulePrivilege, 'accessList'>> = useMemo(() => {
    const obj: Record<string, Omit<ModulePrivilege, 'accessList'>> = {};
    privilegeList.forEach(r => {
      const item = { ...r, accessList: undefined };
      obj[r.resourceId] = item;
    });
    return obj;
  }, [privilegeList]);

  const getValue = () => {
    const privileges: PrivilegeItem[] = [];
    Object.keys(checkedKeys).forEach(resourceId => {
      const keys = checkedKeys[resourceId];
      const resource = resourceMap[resourceId];
      if (!resource) {
        // 权限被屏蔽
        return;
      }
      keys.forEach(key => {
        privileges.push({
          ...resource,
          resourceId,
          accessLabel: key,
          accessType: 'FUNC',
        });
      });
    });
    Object.keys(dataAccess).forEach(resourceId => {
      const resource = resourceMap[resourceId];
      if (!resource) {
        // 权限被屏蔽
        return;
      }
      privileges.push({
        ...resource,
        ...dataAccess[resourceId],
      });
    });
    return privileges;
  };

  useEffect(() => {
    if (data?.privileges) {
      const keys: { [key: string]: string[] } = {};
      const dataItems: { [key: string]: PrivilegeItem } = {};
      data?.privileges.forEach(resource => {
        const tmp = resource.accessList.filter(i => i.accessType !== 'DATA').map(i => i.accessLabel);
        const dataItem = resource.accessList.find(i => i.accessType === 'DATA');
        keys[resource.resourceId] = tmp;
        if (dataItem) {
          dataItems[resource.resourceId] = {
            resourceId: resource.resourceId,
            accessLabel: dataItem.accessLabel,
            accessType: dataItem.accessType,
            // accessName: dataItem.accessName,
            accessRange: dataItem.accessRange,
            members: dataItem.members,
          };
        }
      });
      setDataAccess(dataItems);
      setCheckedKeys(keys);
    } else {
      setDataAccess({});
      setCheckedKeys({});
    }
  }, [data]);

  return (
    <div className={style.roleDetailPage}>
      <div className={style.pageHead}>
        <div className={style.breadCrumb}>
          <div className={classnames([style.breadCrumbItem, style.clickableCrumb])} onClick={() => navigateTo('#rbac?page=rolePermissions')}>
            {getIn18Text('JIAOSELIEBIAO')}
          </div>
          <ArrowRight stroke="#51555C" />
          <div className={style.breadCrumbItem}>{getIn18Text('JIAOSEXIANGQING')}</div>
        </div>
      </div>
      <div className={style.detail}>
        {isCreate && <RoleMessageTip>{getIn18Text('RUOQIYECHENGYUANWURENHEJIAOSE\uFF0CJIANGWUFACAOZUOXIANGGUANGONGNENGMOKUAI\u3002')}</RoleMessageTip>}
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
          <EditablePrivilegeSelectV2
            privilegeList={privilegeList}
            accessList={data?.privileges}
            openEditDrawer={setOpen}
            readonly={readonly || readonlyPrivilege}
            onSave={savePrivileges}
            onEditStateChange={isEdit => setEditState(isEdit ? editState | 4 : editState & 3)}
          />
        </div>
      </div>
      <SiriusDrawer
        title={`编辑权限`}
        onClose={onClose}
        mask={false}
        // closable={false}
        width={555}
        visible={open}
        getContainer={false}
        footer={
          <>
            <Button btnType="minorGray" onClick={onClose}>
              {getIn18Text('QUXIAO')}
            </Button>
            <Button onClick={handleSave} loading={loading} btnType="primary">
              {getIn18Text('QUEDING')}
            </Button>
          </>
        }
        style={{ position: 'absolute' }}
        footerStyle={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 24px 0 0',
        }}
      >
        <PrivilegeSelectListV2 data={privilegeList} dataAccess={dataAccess} checkedKeys={checkedKeys} onChange={handleChange} />
      </SiriusDrawer>
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
      <label className={style.panelLabel}>{getIn18Text('JIAOSEMINGCHENG\uFF1A')}</label>
      <div className={classnames([style.flex1, { [style.isEdit]: isEdit }])}>
        <div className={style.roleNameText}>{props.roleName}</div>
      </div>
      <div className={style.actionWrap}>
        {!readonly && (
          <a className={style.rowAction} onClick={handleEdit}>
            <TongyongBianji />
            {getIn18Text('BIANJI')}
          </a>
        )}
      </div>

      <SiriusModal title="修改名称" visible={isEdit} onCancel={onCancel} onOk={onSave}>
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
      </SiriusModal>
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

  const orgItems = selectedOrg.map(i => <MiniMemberItem key={i.id} item={i} />);
  const contactItems = selectedContact.map(i => <MiniMemberItem key={i.contact.accountId} item={i} />);
  const allItems = orgItems.concat(contactItems);
  return (
    <div className={classnames([style.row])}>
      <div>
        <label className={style.panelLabel}>{getIn18Text('TIANJIACHENGYUAN\uFF1A')}</label>
        <div className={style.actionWrap}>
          {!readonly && (
            <a className={style.rowAction} onClick={handleEdit}>
              <TongyongTianjia />
              {getIn18Text('TIANJIA')}
            </a>
          )}
        </div>
      </div>

      <div className={style.allMembers}>
        <EllipsisMore
          renderEllipsisDropdown={count => <>{allItems.slice(allItems.length - count)}</>}
          dropdownStyle={{ maxWidth: '80%', maxHeight: 600, overflow: 'hidden auto' }}
        >
          {allItems}
        </EllipsisMore>
      </div>

      <SiriusDrawer
        title={getIn18Text('TIANJIACHENGYUAN')}
        onClose={handleCancel}
        visible={isEdit}
        getContainer={false}
        mask={false}
        width={556}
        style={{ position: 'absolute' }}
        footerStyle={{ padding: 0, height: 'auto' }}
        bodyStyle={{ position: 'relative' }}
        footer={
          <div className={style.contactDrawerFooter}>
            <div className={style.contactDrawerTip}>已选 {selectedContact.length} 个</div>
            <Button btnType="default" className={style.contactDrawerbtn} onClick={handleCancel}>
              {getIn18Text('QUXIAO')}
            </Button>
            <Button btnType="primary" className={style.contactDrawerbtn} onClick={handleSave}>
              {getIn18Text('BAOCUN')}
            </Button>
          </div>
        }
      >
        <div className={style.contactTreeSelect}>
          <TreeSelect
            selectedContact={selectedContact}
            selectedOrg={selectedOrg}
            onChange={(contacts, orgs) => {
              setSelectContact(contacts);
              setSelectOrg(orgs);
            }}
          />
        </div>
      </SiriusDrawer>
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
