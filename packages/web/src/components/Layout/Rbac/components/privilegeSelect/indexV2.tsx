/* eslint-disable @typescript-eslint/no-shadow */
/*/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useCallback, useImperativeHandle, useEffect, useMemo, SetStateAction, Dispatch } from 'react';
import { ModulePrivilege, PrivilegeDetailItem, PrivilegeItem } from 'api';
import { Button, Table } from 'antd';
import classnames from 'classnames';
// import { PrivilegeSelectList } from './privilegeSelect';
import { PrivilegeSelectListV2 } from './privilegeSelectV2';

import style from '../../roleManager/detail.module.scss';
import editStyle from './privilegeSelect.module.scss';
import v2Style from './v2.module.scss';
import { getIn18Text } from 'api';
import qs from 'querystring';
import { TongyongBianji, TongyongTianjia } from '@sirius/icons';

export interface EditablePrivilegeSelectProps {
  readonly?: boolean;
  privilegeList: ModulePrivilege[];
  openEditDrawer: Dispatch<SetStateAction<boolean>>;
  accessList?: PrivilegeDetailItem[];
  onSave?: (privileges: PrivilegeItem[]) => Promise<boolean>;
  onEditStateChange?: (isEdit: boolean) => void;
}

export interface PrivilegeSelectListHandle {
  getValue: () => PrivilegeItem[];
}

const accessRangeMap: Record<string, string> = {
  ORG: getIn18Text('QIYE'),
  DEP: getIn18Text('BENTUANDUI'),
  OWNER: getIn18Text('GEREN'),
  CUSTOM: getIn18Text('ZIDINGYI'),
};

export const EditablePrivilegeSelectV2 = React.forwardRef<PrivilegeSelectListHandle, EditablePrivilegeSelectProps>((props, ref) => {
  const { readonly, privilegeList } = props;
  const [isEdit, setIsEdit] = useState(false);
  const [dataAccess, setDataAccess] = useState<{ [key: string]: PrivilegeItem }>({});
  const [checkedKeys, setCheckedKeys] = useState<{ [key: string]: string[] }>({});
  const [privilegeDesc, setPrivilegeDesc] = useState<string[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  // 用于取消按钮，恢复上一次数据
  const [cacheVal, setCacheVal] = useState({
    dataAccess,
    checkedKeys,
  });
  const params = qs.parse(location.hash.split('?')[1]);
  const isCreate = params.action === 'create';

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
    props.onEditStateChange && props.onEditStateChange(isEdit);
  }, [isEdit]);

  useImperativeHandle(
    ref,
    () => ({
      getValue,
    }),
    [checkedKeys, dataAccess]
  );

  useEffect(() => {
    if (props.accessList) {
      const keys: { [key: string]: string[] } = {};
      const dataItems: { [key: string]: PrivilegeItem } = {};
      props.accessList.forEach(resource => {
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
  }, [props.accessList]);

  useEffect(() => {
    if (!isEdit) {
      const labelToName: Record<string, string> = {};
      const resourceIdToName: Record<string, string> = {};
      const dataPrivileges: string[] = [];

      props.privilegeList.forEach(res => {
        resourceIdToName[res.resourceId] = res.resourceName;
        res.accessList.forEach(item => {
          labelToName[item.accessLabel] = item.accessName;
        });
      });
      Object.keys(dataAccess).forEach(resourceId => {
        const access = dataAccess[resourceId];
        const resourceName = resourceIdToName[resourceId];
        if (!resourceName) {
          return; // 模块权限可能因为订单消失
        }
        dataPrivileges.push(accessRangeMap[access.accessRange || ''] + '-' + resourceIdToName[resourceId]);
      });
      Object.keys(checkedKeys).forEach(resourceId => {
        const labels = checkedKeys[resourceId];
        const resourceName = resourceIdToName[resourceId];
        if (!resourceName) {
          return; // 模块
        }
        labels.forEach(label => {
          dataPrivileges.push(labelToName[label] + '-' + resourceName);
        });
      });
      setPrivilegeDesc(dataPrivileges);
    }
  }, [props.privilegeList, isEdit, dataAccess, checkedKeys]);

  const handleEdit = useCallback(() => {
    setCacheVal({
      dataAccess: { ...dataAccess },
      checkedKeys: { ...checkedKeys },
    });
    setIsEdit(true);
  }, [dataAccess, checkedKeys]);

  const handleEditV2 = useCallback(() => {
    props.openEditDrawer(true);
  }, [dataAccess, checkedKeys]);

  const handlePreview = useCallback(() => {
    setIsPreview(true);
  }, []);

  const handleChange = (checkedKeys: Record<string, string[]>, dataAccess: { [key: string]: PrivilegeItem }) => {
    setCheckedKeys(checkedKeys);
    setDataAccess(dataAccess);
  };
  const handleCancel = () => {
    setCheckedKeys(cacheVal.checkedKeys);
    setDataAccess(cacheVal.dataAccess);
    console.log('roleDetail', cacheVal);
    setIsEdit(false);
  };

  const handleSave = useCallback(() => {
    const privileges = getValue();
    if (props.onSave) {
      props.onSave(privileges).then(success => setIsEdit(!success));
    } else {
      setIsEdit(false);
    }
  }, [checkedKeys, dataAccess, props.onSave]);

  if (isEdit) {
    return (
      <div className={classnames([editStyle.isEditing, editStyle.privilegeSelector])}>
        <div style={{ marginBottom: 10, padding: '12px 24px 0' }}>
          <label className={style.detailLabel}>{getIn18Text('QUANXIANGUANLI\uFF1A')}</label>
          <div className={style.actionWrap}>
            <Button className={style.rowAction} type="default" onClick={handleCancel}>
              {getIn18Text('QUXIAO')}
            </Button>
            <Button className={style.rowAction} type="primary" ghost onClick={handleSave}>
              {getIn18Text('BAOCUN')}
            </Button>
          </div>
        </div>
        <PrivilegeSelectListV2 data={privilegeList} dataAccess={dataAccess} checkedKeys={checkedKeys} onChange={handleChange} />
      </div>
    );
  }
  // if (isPreview) {
  //   return (
  //     <div className={classnames([editStyle.isEditing, editStyle.privilegeSelector])}>
  //       <div style={{ marginBottom: 10, padding: '12px 24px 0' }}>
  //         <label className={style.detailLabel}>{getIn18Text('QUANXIANGUANLI\uFF1A')}</label>
  //         <div className={style.actionWrap}>
  //           <Button className={style.rowAction} type="default" onClick={() => setIsPreview(false)}>
  //             {getIn18Text('SHOUQI')}
  //           </Button>
  //         </div>
  //       </div>
  //       <PrivilegeSelectListV2 data={privilegeList} dataAccess={dataAccess} checkedKeys={checkedKeys} onChange={handleChange} readonly />
  //     </div>
  //   );
  // }

  let dataV2 = groupBy(privilegeList);

  return (
    <>
      <div className={classnames([style.row, v2Style.noMargin])}>
        <label className={style.detailLabel}>{getIn18Text('QUANXIANGUANLI\uFF1A')}</label>
        <div className={style.actionWrap}>
          {!readonly && (
            <a className={style.rowAction} onClick={handleEditV2}>
              <TongyongBianji />
              {getIn18Text('BIANJI')}
            </a>
          )}
        </div>
      </div>
      {isCreate ? null : (
        <div className={v2Style.table}>
          {dataV2.map(e => {
            let obj = [];
            for (let i = 0; i < e.children.length; i++) {
              let funcAccessItem =
                checkedKeys[e?.children[i]?.resourceId]
                  ?.map(ee => funcOptions[ee])
                  ?.filter(Boolean)
                  ?.join('/') || '-';
              let dataAccessItem = dataOptions[dataAccess[e?.children[i]?.resourceId]?.accessRange || '-'];

              obj.push({
                key: 2 * i,
                resourceName: e.children[i].resourceName,
                funcAndData: '功能权限',
                labelOrRange: funcAccessItem,
              });
              obj.push({
                key: 2 * i + 1,
                resourceName: e.children[i].resourceName,
                funcAndData: '数据权限',
                labelOrRange: dataAccessItem,
              });
            }

            return (
              <div className={v2Style.item}>
                <h3>{e.resourceCategoryName}</h3>
                <Table columns={columns} dataSource={obj} bordered pagination={false} showHeader={false} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
});

const columns = [
  {
    title: 'group',
    width: 213,
    dataIndex: 'resourceName',
    render(value, row, index: number) {
      const obj = {
        children: value,
        props: {},
      };
      if (index % 2 === 0) {
        obj.props.rowSpan = 2;
      }
      // These two are merged into above cell
      if (index % 2 === 1) {
        obj.props.rowSpan = 0;
      }

      return obj;
    },
  },
  {
    title: 'funcAndData',
    width: 213,
    dataIndex: 'funcAndData',
  },
  {
    title: 'labelOrRange',
    dataIndex: 'labelOrRange',
    render(val) {
      return {
        children: val || '-',
      };
    },
  },
];

const funcOptions: Record<string, string> = {
  VIEW: '查看权限',
  DATA: '数据权限',
  OP: '操作权限',
  DELETE: '删除权限',
  CONTACT_GRANT_EMAIL_SETTING: '授权管理',
  AUTO_RECOMMEND: '自动筛选',
  CUSTOM_RECOMMEND: '手动筛选',
  VIEW_MY_CONTACT_EMAIL: '查看我的客户邮件',
  VIEW_MY_EDM_EMAIL: '查看我的邮件营销',
  VIEW_ALL_EDM_EMAIL: '查看全部邮件营销',
  VIEW_RECENTLY_SCHEDULE: '查看最近日程',
  VIEW_MY_CONTACT_BOARD: '查看我的客户看板',
  VIEW_ALL_CONTACT_BOARD: '查看全部客户看板',
  VIEW_MY_CONTACT_STATE: '查看我的客户动态',
  VIEW_ALL_CONTACT_STATE: '查看全部客户动态',
  VIEW_STAFF_PK_LIST: '查看员工PK榜',
  VIEW_MY_CONTACT_STAGE: '查看我的客户阶段',
  VIEW_ALL_CONTACT_STAGE: '查看全部客户阶段',
  EDM_TMPL_VARIABLE_SETTING: '邮件营销模版变量',
  EDM_QUOTA_SETTING: '邮件营销配额',
  CONTACT_AI_TAG_SETTING: '邮件智能标签',
  WHATSAPP_PEER_SETTING: 'WhatsApp对接',
  NOTIFY_SETTING: '通知设置',
  PREVIOUS_CONTACT_WHITELIST_SETTING: '往来邮件-授权白名单',
  TASK_CENTER_RULE_SETTING: '任务规则设置',
  EDM_EMAIL_SEND_QUOTA_SETTING: '邮件营销发件限制',
  EXPORT: '导出',
  CLAIM: '认领权限',
  ALLOT: '分配权限',
  IMPORT: '导入',
  UNBIND: '解绑权限',
  VIEW_MESSAGE_RECORD: '查看聊天记录',
  MANAGE: '管理',
  REGISTER: '注册账号',
  CHAT_TRANSFER: '会话转接',
  GROUP_SEND: '群发',
  WHATSAPP_LOGIN: 'WhatsApp登录',
  BATCH_TRANSFER: '离职转接',
};

const dataOptions: Record<string, string> = {
  ORG: getIn18Text('GONGSI'),
  DEP: getIn18Text('BENTUANDUI'),
  OWNER: getIn18Text('GEREN'),
  CUSTOM: getIn18Text('ZIDINGYI'),
  '-': '-',
};

function groupBy(arr: ModulePrivilege[]) {
  const map: Record<string, ModulePrivilege[]> = {};
  arr.forEach(obj => {
    if (map[obj.resourceCategoryLabel]) {
      map[obj.resourceCategoryLabel].push(obj);
    } else {
      map[obj.resourceCategoryLabel] = [obj];
    }
  });
  return Object.keys(map).map(k => ({
    resourceCategoryLabel: k,
    resourceCategoryName: map[k][0].resourceCategoryName,
    children: map[k],
  }));
}
