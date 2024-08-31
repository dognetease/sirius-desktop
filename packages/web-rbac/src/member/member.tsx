import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { HotKeys } from 'react-hotkeys';
import { FixedSizeList as VirtualList } from 'react-window';
import { apiHolder, apis, EdmRoleApi, MEMBER_TYPE, OrgModel, ResAdminAccount, RoleModel } from 'api';

import SideContentLayout from '@/layouts/Main/sideContentLayout';
import { SEC_SIDE } from '@web-common/utils/constant';
import styles from './member.module.scss';
import treeStyles from '../index.module.scss';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import { Checkbox, Dropdown, Input, InputProps, List, Tooltip, Tree } from 'antd';
import classnames from 'classnames';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';

import ContactDetail from '../../Contacts/component/Detail/detail';
import { getContact, getSearchContact } from '@web-contact/_mock_';
import { UIContactModel } from '@web-contact/data';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { getMyRolesAsync } from '@web-common/state/reducer/privilegeReducer';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { ReactComponent as AddRoleIcon } from '@/images/icons/edm/add-role.svg';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import { getEdmUserTreeAsync } from '@web-common/state/reducer/edmUserReducer';
import { DataNode, TreeProps } from 'antd/lib/tree';
import { SearchGroupKey } from '@web-common/utils/contact_util';
import debounce from 'lodash/debounce';

const ITEM_SIZE = 72;

const roleApi = apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
const eventApi = apiHolder.api.getEventApi();

const data2tree = (data: OrgModel) => {
  const treeNode: DataNode = {
    key: data.org.id,
    title: data.org.orgName,
    isLeaf: data.children.length === 0,
  };
  if (!treeNode.isLeaf && data.children && data.children.length > 0) {
    treeNode.children = data.children.map(data2tree);
  }
  return treeNode;
};

const renderTitle: TreeProps['titleRender'] = node => (
  <span
    className={classnames({
      [styles.leafNode]: node.children?.length,
    })}
  >
    {node.title}
  </span>
);

export interface RoleMember extends UIContactModel {
  roles?: string[];
}

export interface RoleMembersProps {}

export const RoleMembers = (props: RoleMembersProps) => {
  const [contactList, setContactList] = useState<RoleMember[]>([]);
  const [searchContactList, setSearchContactList] = useState<RoleMember[]>([]);
  const [activeMenuKey, setActiveMenuKey] = useState('-1');
  const [accountList, setAccountList] = useState<ResAdminAccount>();
  const [listLoading, setListLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<RoleMember>();
  const listRef = useRef<VirtualList>(null);
  const [enterpriseData, setEnterpriseData] = useState<DataNode[]>([]);
  const [searchValue, setSearchValue] = useState('');

  const edmUserIds = useAppSelector(state => state.edmUserReducer.contactIds);
  const edmOrgData = useAppSelector(state => state.edmUserReducer.orgData);
  const appDispatch = useAppDispatch();

  const getAccountList = useCallback(() => {
    if (accountList) {
      return Promise.resolve(accountList);
    }
    return roleApi.getEdmAccount().then(data => {
      setAccountList(data);
      return data;
    });
  }, [accountList]);

  useEffect(() => {
    appDispatch(getEdmUserTreeAsync());

    // 监听通讯录变化
    const OBSERVE_SYNC_ID = eventApi.registerSysEventObserver('contactNotify', {
      name: 'contact.tsxRbacNotifyOb',
      func: () => {
        appDispatch(getEdmUserTreeAsync());
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('contactNotify', OBSERVE_SYNC_ID);
    };
  }, []);

  useEffect(() => {
    if (edmOrgData != null) {
      setEnterpriseData([data2tree(edmOrgData)]);
    }
  }, [edmOrgData]);

  useEffect(() => {
    if (activeMenuKey) {
      setListLoading(true);
      Promise.all([getAccountList(), getContact(activeMenuKey)])
        .then(([accountList, res]) => {
          const members = accountList.members;
          const isOrgPermission = members.find(i => i.memberType === MEMBER_TYPE.ORG && i.memberAccId === activeMenuKey);
          if (isOrgPermission) {
            setContactList(res);
          } else {
            const filterContact = res.filter(i => edmUserIds[i.contact.accountOriginId as string]);
            setContactList(filterContact);
          }
        })
        .finally(() => setListLoading(false));
    }
  }, [activeMenuKey]);

  const handleMenuClick: TreeProps['onSelect'] = (_, { node }) => {
    const key = node.key;
    setActiveMenuKey(key as string);
  };

  const handleListMove = (direction: number) => {
    return function (e?: KeyboardEvent) {
      e && e.preventDefault();
      if (displayContactList && selectedContact) {
        const idx = displayContactList.indexOf(selectedContact);
        const target = idx + direction;
        if (target >= 0 && target < displayContactList.length) {
          setSelectedContact(displayContactList[target]);
          listRef.current?.scrollToItem(target);
        }
      }
    };
  };

  const handleSearch: InputProps['onChange'] = e => {
    const v = e.target.value;
    setSearchValue(v);
    if (v) {
      doSearch(e.target.value);
    }
  };

  const doSearch = debounce((query: string) => {
    Promise.all([getAccountList(), searchContact(query)]).then(([accountList, res]) => {
      if (!res) return setSearchContactList([]);
      const members = accountList.members;
      const isOrgPermission = members.find(i => i.memberType === MEMBER_TYPE.ORG && i.memberAccId === activeMenuKey);
      if (isOrgPermission) {
        setSearchContactList(res);
      } else {
        const filterContact = res.filter(i => edmUserIds[i.contact.accountOriginId as string]);
        setSearchContactList(filterContact);
      }
    });
  }, 600);

  const searchContact = (query: string) => {
    return getSearchContact(query).then(list => {
      return list ? list[SearchGroupKey.CORP] : null;
    });
  };
  const keyMap = {
    1: 'up',
    2: 'down',
  };
  const hotKeyHandlers = {
    1: handleListMove(-1),
    2: handleListMove(1),
  };
  const displayContactList = searchValue ? searchContactList : contactList;

  const ItemRenderer = ({ style, index }: { style: React.CSSProperties; index: number }) => {
    const item = displayContactList[index];
    const className = item.contact.id === selectedContact?.contact?.id ? styles.itemSelected : '';

    return (
      <div
        style={{
          ...style,
          top: `${parseFloat(String(style.top)) + 12}px`,
        }}
      >
        <MemberItem onSelect={setSelectedContact} item={item} className={className} />
      </div>
    );
  };

  const innerElementType = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    (
      // eslint-disable-next-line react/prop-types
      { style, ...rest },
      ref
    ) => (
      <div
        ref={ref}
        style={{
          ...style,
          // eslint-disable-next-line react/prop-types
          height: `${parseFloat(String(style?.height)) + 24}px`,
        }}
        {...rest}
      />
    )
  );

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        height: '100%',
      }}
    >
      <SideContentLayout minWidth={192} defaultWidth={192} borderRight>
        <div style={{ padding: '8px 8px 0' }}>
          <Input
            maxLength={100}
            className="sirius-no-drag"
            max={100}
            placeholder="搜索企业成员"
            onChange={handleSearch}
            prefix={<div className={styles.searchIcon} />}
            allowClear
          />
        </div>
        <div className={treeStyles.treeContainer}>
          <Tree blockNode onSelect={handleMenuClick} titleRender={renderTitle} selectedKeys={[activeMenuKey]} treeData={enterpriseData} className="sirius-no-drag" />
        </div>
      </SideContentLayout>
      {displayContactList.length === 0 && (
        <div className={styles.emptyContainer}>
          <div className="sirius-empty"></div>
          <div>暂无联系人</div>
        </div>
      )}
      {displayContactList.length !== 0 && (
        <>
          <SideContentLayout minWidth={SEC_SIDE} borderRight className={styles.listLayout} defaultWidth={324}>
            <AutoSizer>
              {({ height, width }) => (
                <HotKeys keyMap={keyMap} handlers={hotKeyHandlers} allowChanges>
                  <VirtualList innerElementType={innerElementType} ref={listRef} itemSize={ITEM_SIZE} itemCount={displayContactList.length} height={height} width={width}>
                    {ItemRenderer}
                  </VirtualList>
                </HotKeys>
              )}
            </AutoSizer>
          </SideContentLayout>
          {selectedContact && (
            <ContactDetail
              from="contact"
              branch
              containerStyle={{ paddingTop: 120, width: 430 }}
              contact={selectedContact}
              customDetailInfo={
                <RoleInfoForContact
                  orgId={selectedContact.contact.enterpriseId as unknown as string}
                  accId={selectedContact.contact.accountOriginId as unknown as string}
                />
              }
            />
          )}
        </>
      )}
    </div>
  );
};

const MemberItem = (props: any) => {
  const { item } = props;

  return (
    <List.Item className={classnames([styles.item, props.className])} onClick={() => props.onSelect && props.onSelect(item)}>
      <List.Item.Meta
        avatar={
          <AvatarTag
            className={styles.itemAvatar}
            user={{
              name: item.contact.contactName,
              avatar: item.contact.avatar,
              color: item.contact.color,
            }}
          />
        }
        title={
          <Tooltip placement="top" overlayClassName={styles.tooltipOverlay} title={item.contact.contactName}>
            <span>{item.contact.contactName}</span>
          </Tooltip>
        }
        description={
          <Tooltip placement="top" overlayClassName={styles.tooltipOverlay} title={item.contact.defaultEmail}>
            <span className={styles.emailList}>{item.contact.defaultEmail}</span>
          </Tooltip>
        }
      />
    </List.Item>
  );
};

const RoleInfoForContact: React.FC<{ orgId: string; accId: string }> = props => {
  const appDispatch = useAppDispatch();
  const [roles, setRoles] = useState<RoleModel[]>([]);
  const roleList = useAppSelector(state => state.privilegeReducer.roleList);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const fetchRole = () => {
    roleApi
      .getCurrentRoleInfo({
        orgId: props.orgId,
        accId: props.accId,
      })
      .then(myRoles => {
        setRoles(myRoles);
        setSelectedRoleIds(myRoles.map(i => i.roleId));
      });
  };

  useEffect(() => {
    fetchRole();
  }, [props.orgId, props.accId]);

  useEffect(() => {
    appDispatch(getMyRolesAsync());
  }, []);

  const handleCheck = (id: string, e: CheckboxChangeEvent) => {
    roleApi
      .addOrRemoveRoleToAccount({
        orgId: props.orgId,
        accId: props.accId,
        roles: [id],
        op: e.target.checked ? 1 : 2,
      })
      .then(() => {
        fetchRole();
        toast.success({ content: (e.target.checked ? '添加' : '删除') + '角色成功' });
      });
  };

  const overlay = useMemo(
    () => (
      <div className={styles.checkboxWrapper}>
        <Checkbox.Group value={selectedRoleIds} onChange={v => setSelectedRoleIds(v as string[])}>
          {roleList.map(i => (
            <div key={i.roleId} className={styles.overlayRow}>
              <div style={{ flex: 1 }} className={styles.overlayRoleName}>
                {i.roleName}
              </div>
              <Checkbox value={i.roleId} onChange={e => handleCheck(i.roleId, e)} disabled={i.roleType === 'ADMIN'} />
            </div>
          ))}
        </Checkbox.Group>
      </div>
    ),
    [roleList, selectedRoleIds]
  );
  return (
    <div className={styles.roleInfoRow}>
      <div className={styles.roleInfoLabel}>角色</div>
      <div className={styles.roleInfoContent}>
        {roles.length > 0 ? (
          <div>
            {roles.map(i => (
              <span className={styles.roleItem} key={i.roleId}>
                {i.roleName}
              </span>
            ))}
          </div>
        ) : (
          <div>请添加角色</div>
        )}
      </div>
      <Dropdown overlay={overlay} overlayClassName={styles.overlay} placement="bottomRight">
        <div className={styles.roleInfoAction}>
          <AddRoleIcon />
        </div>
      </Dropdown>
    </div>
  );
};
