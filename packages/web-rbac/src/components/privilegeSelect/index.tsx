/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useCallback, useImperativeHandle, useEffect } from 'react';
import { ModulePrivilege, PrivilegeDetailItem, PrivilegeItem } from 'api';
import { Button } from 'antd';
import classnames from 'classnames';
import { PrivilegeSelectList } from './privilegeSelect';

import style from '../../roleManager/detail.module.scss';
import editStyle from './privilegeSelect.module.scss';

export interface EditablePrivilegeSelectProps {
  readonly?: boolean;
  privilegeList: ModulePrivilege[];
  accessList?: PrivilegeDetailItem[];
  onSave?: (privileges: PrivilegeItem[]) => Promise<boolean>;
  onEditStateChange?: (isEdit: boolean) => void;
}

export interface PrivilegeSelectListHandle {
  getValue: () => PrivilegeItem[];
}

const accessRangeMap: Record<string, string> = {
  ORG: '企业',
  DEP: '本团队',
  OWNER: '个人',
  CUSTOM: '自定义',
};

export const EditablePrivilegeSelect = React.forwardRef<PrivilegeSelectListHandle, EditablePrivilegeSelectProps>((props, ref) => {
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

  const getValue = () => {
    const privileges: PrivilegeItem[] = [];
    Object.keys(checkedKeys).forEach(resourceLabel => {
      const keys = checkedKeys[resourceLabel];
      keys.forEach(key => {
        privileges.push({
          resourceLabel,
          accessLabel: key,
          accessType: 'FUNC',
        });
      });
    });
    Object.keys(dataAccess).forEach(resourceLabel => {
      privileges.push({
        ...dataAccess[resourceLabel],
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
        keys[resource.resourceLabel] = tmp;
        if (dataItem) {
          dataItems[resource.resourceLabel] = {
            resourceLabel: resource.resourceLabel,
            accessLabel: dataItem.accessLabel,
            accessType: dataItem.accessType,
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
      const resourceLabelToName: Record<string, string> = {};
      const dataPrivileges: string[] = [];

      props.privilegeList.forEach(res => {
        resourceLabelToName[res.resourceLabel] = res.resourceName;
        res.accessList.forEach(item => {
          labelToName[item.accessLabel] = item.accessName;
        });
      });
      Object.keys(dataAccess).forEach(resourceLabel => {
        const access = dataAccess[resourceLabel];
        const resourceName = resourceLabelToName[resourceLabel];
        if (!resourceName) {
          return; // 模块权限可能因为订单消失
        }
        dataPrivileges.push(accessRangeMap[access.accessRange || ''] + '-' + resourceLabelToName[resourceLabel]);
      });
      Object.keys(checkedKeys).forEach(resourceLabel => {
        const labels = checkedKeys[resourceLabel];
        const resourceName = resourceLabelToName[resourceLabel];
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
          <label className={style.detailLabel}>权限管理：</label>
          <div className={style.actionWrap}>
            <Button className={style.rowAction} type="default" onClick={handleCancel}>
              取消
            </Button>
            <Button className={style.rowAction} type="primary" ghost onClick={handleSave}>
              保存
            </Button>
          </div>
        </div>
        <PrivilegeSelectList data={privilegeList} dataAccess={dataAccess} checkedKeys={checkedKeys} onChange={handleChange} />
      </div>
    );
  }
  if (isPreview) {
    return (
      <div className={classnames([editStyle.isEditing, editStyle.privilegeSelector])}>
        <div style={{ marginBottom: 10, padding: '12px 24px 0' }}>
          <label className={style.detailLabel}>权限管理：</label>
          <div className={style.actionWrap}>
            <Button className={style.rowAction} type="default" onClick={() => setIsPreview(false)}>
              收起
            </Button>
          </div>
        </div>
        <PrivilegeSelectList data={privilegeList} dataAccess={dataAccess} checkedKeys={checkedKeys} onChange={handleChange} readonly />
      </div>
    );
  }
  return (
    <div className={classnames([style.row, style.flexContainer])}>
      <label className={style.detailLabel}>权限管理：</label>
      <div className={classnames([style.flex1, style.ellipsis])} onClick={readonly ? undefined : handleEdit}>
        {
          // eslint-disable-next-line react/no-array-index-key
          privilegeDesc.map((item, index) => (
            <span className={style.privilegeMini} key={index}>
              {item}
            </span>
          ))
        }
      </div>
      <div className={style.actionWrap}>
        {!readonly ? (
          <a className={style.rowAction} onClick={handleEdit}>
            编辑
          </a>
        ) : (
          <a className={style.rowAction} onClick={handlePreview}>
            查看
          </a>
        )}
      </div>
    </div>
  );
});
