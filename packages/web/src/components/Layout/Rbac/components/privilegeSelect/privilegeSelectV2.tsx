/* eslint-disable react/destructuring-assignment */
import React, { useState, useEffect, useMemo } from 'react';
import { Checkbox, Radio, RadioChangeEvent, Popover } from 'antd';
import classNames from 'classnames';
import { AccessModel, AdminAccountInfo, api, apis, ModulePrivilege, PrivilegeItem, ProductAuthApi, getIn18Text } from 'api';

import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import style from './v2privilegeSelect.module.scss';
import { TreeSelectMini } from '../selectContact/mini';
import { DependencyConfig, ReversedDependency } from './dependency';
import { ReactComponent as QuestionIcon } from '@/images/icons/edm/question.svg';
import { getTransText } from '@/components/util/translate';

const dataOptions = [
  {
    value: 'ORG',
    label: getIn18Text('GONGSI'),
  },
  {
    value: 'DEP',
    label: getIn18Text('BENTUANDUI'),
  },
  {
    value: 'OWNER',
    label: getIn18Text('GEREN'),
  },
  {
    value: 'CUSTOM',
    label: getIn18Text('ZIDINGYI'),
  },
];

export interface ISelectPrivilegeProps {
  data: ModulePrivilege[];
  dataAccess?: { [key: string]: PrivilegeItem };
  checkedKeys?: Record<string, string[]>;
  onChange?: (checkedKeys: Record<string, string[]>, dataAccess: { [key: string]: PrivilegeItem }) => void;
  readonly?: boolean;
}

const productApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;

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
// 屏蔽部分功能权限
const InvisibleAccessList = ['WHATSAPP_PEER_SETTING']; // "WhatsApp对接"
function filterAccessList(item: AccessModel) {
  return !InvisibleAccessList.includes(item.accessLabel);
}
export const PrivilegeSelectListV2 = (props: ISelectPrivilegeProps) => {
  const { readonly } = props;
  const [funAccessList, setFunctionAccessList] = useState<{ [key: string]: AccessModel[] }>({});
  const [dataAccessModel, setDataAccessModel] = useState<{ [key: string]: AccessModel }>({});
  const [dataAccess, setDataAccess] = useState<{ [key: string]: PrivilegeItem }>(props.dataAccess || {});
  const [checkedKeys, setCheckedKeys] = useState<{ [key: string]: string[] }>(props.checkedKeys || {});
  // const showWa = productApi.getABSwitchSync('ws_personal');

  const menus = useMemo(() => {
    // const data = props.data.filter(v => +v.resourceId !== 32 || showWa);
    // return groupBy(data);
    return groupBy(props.data);
  }, [props.data]);
  const [activeModule, setActiveModule] = useState<ModulePrivilege>();

  useEffect(() => {
    const obj: { [key: string]: AccessModel[] } = {};
    const data: { [key: string]: AccessModel } = {};
    props.data
      // .filter(v => +v.resourceId !== 32 || showWa)
      .forEach(item => {
        obj[item.resourceId] = item.accessList.filter(i => i.accessType !== 'DATA');
        const dataItem = item.accessList.find(i => i.accessType === 'DATA');
        if (dataItem) {
          data[item.resourceId] = dataItem;
        }
      });
    setFunctionAccessList(obj);
    setDataAccessModel(data);
  }, [props.data]);

  useEffect(() => {
    setDataAccess(props.dataAccess || {});
  }, [props.dataAccess]);

  useEffect(() => {
    setCheckedKeys(props.checkedKeys || {});
  }, [props.checkedKeys]);

  const onFuncCheck = (resource: ModulePrivilege, accessLabel: string, e: CheckboxChangeEvent) => {
    const { resourceId, resourceLabel } = resource;
    const { checked } = e.target;
    const keys = checkedKeys[resourceId] ? [...checkedKeys[resourceId]] : [];
    if (checked) {
      // 选中时，检测依赖项
      let addKeys = [accessLabel];
      const dependencies = DependencyConfig[resourceLabel] && DependencyConfig[resourceLabel][accessLabel];
      if (dependencies?.length) {
        addKeys = [...addKeys, ...dependencies];
      }
      addKeys.forEach(key => {
        if (keys.indexOf(key) === -1) {
          keys.push(key);
        }
      });
    } else {
      // 不选中时，取消依赖此项的值
      let removeKeys = [accessLabel];
      const dependencies = ReversedDependency[resourceLabel] && ReversedDependency[resourceLabel][accessLabel];
      if (dependencies?.length) {
        removeKeys = [...removeKeys, ...dependencies];
      }
      removeKeys.forEach(key => {
        const idx = keys.indexOf(key);
        if (idx !== -1) {
          keys.splice(idx, 1);
        }
      });
    }
    // update
    checkedKeys[resourceId] = keys;
    const newKeys = { ...checkedKeys };
    setCheckedKeys(newKeys);
    let dataKeys = dataAccess;
    // update dataAccess
    if (checked && !dataAccess[resourceId] && dataAccessModel[resourceId]) {
      dataKeys[resourceId] = {
        resourceId,
        resourceLabel,
        accessLabel: dataAccessModel[resourceId].accessLabel,
        accessType: 'DATA',
        accessRange: 'OWNER',
      };
      dataKeys = { ...dataKeys };
    }
    props.onChange && props.onChange(checkedKeys, dataKeys);
  };

  const onDataAccessChange = (resource: ModulePrivilege, item: AccessModel, e: RadioChangeEvent) => {
    const { resourceId, resourceLabel } = resource;
    dataAccess[resourceId] = {
      resourceId,
      resourceLabel,
      accessLabel: item.accessLabel,
      accessType: 'DATA',
      accessRange: e.target.value,
    };
    const newDataAccess = { ...dataAccess };
    setDataAccess(newDataAccess);
    props.onChange && props.onChange(checkedKeys, newDataAccess);
  };

  const onMemberChange = (item: PrivilegeItem, members: AdminAccountInfo[]) => {
    item.members = members;
    dataAccess[item.resourceId] = { ...item };
    const newDataAccess = { ...dataAccess };
    setDataAccess(newDataAccess);
    props.onChange && props.onChange(checkedKeys, newDataAccess);
  };

  return (
    <div className={style.roleListWrapper}>
      <div className={style.groupList}>
        <div className={style.groupLeft}>
          {menus.map(m => (
            <div className={style.resourceGroup}>
              <div className={style.groupName}>{m.resourceCategoryName}</div>
              {m.children.map(module => {
                const isEmpty = !checkedKeys[module.resourceId] || checkedKeys[module.resourceId].length === 0;
                return (
                  <div
                    className={classNames(style.resourceName, module.resourceId === activeModule?.resourceId ? style.active : '')}
                    onClick={() => setActiveModule(module)}
                  >
                    {module.resourceName}
                    {isEmpty && <span className={style.subText}>{getIn18Text('\uFF08WEIPEIZHI\uFF09')}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className={style.groupRight}>
          <div className={classNames(style.flexContainer, style.flexColumn)}>
            {activeModule !== undefined && (
              <>
                <div className={style.mainSetting} style={{ paddingLeft: 24 }}>
                  <div className={style.moduleName}>{activeModule.resourceName}</div>
                  <div className={style.fnsList}>
                    <div className={style.title}>{getTransText('GONGNENGQUANXIAN')}</div>
                    <Checkbox.Group value={checkedKeys[activeModule.resourceId]} disabled={readonly}>
                      {funAccessList[activeModule.resourceId]?.filter(filterAccessList).map(fn => (
                        <Checkbox
                          value={fn.accessLabel}
                          key={fn.accessLabel}
                          onChange={e => onFuncCheck(activeModule, fn.accessLabel, e)}
                          className={fn.accessLabel === 'FORCE_DELETE' && activeModule.resourceLabel === 'CHANNEL' ? style.hide : undefined}
                        >
                          {fn.accessName}
                          {/* {fn.accessLabel === 'FORCE_DELETE' && activeModule.resourceLabel === 'CHANNEL' ? (
                            <Popover overlayClassName={style.forceInfo} content={getIn18Text('KAIQIHOUKEQIANGZHISHANCHU\u201CZHUANKEHU\u201DDEXIANSUO')} trigger="hover">
                              <span className={style.forceIcon}>
                                <QuestionIcon />
                              </span>
                            </Popover>
                          ) : (
                            ''
                          )} */}
                        </Checkbox>
                      ))}
                    </Checkbox.Group>
                  </div>
                  {dataAccessModel[activeModule.resourceId] && (
                    <div className={style.dataOptions}>
                      <div className={style.title}>{getIn18Text('SHUJUQUANXIAN')}</div>
                      <Radio.Group
                        value={dataAccess[activeModule.resourceId]?.accessRange}
                        onChange={e => onDataAccessChange(activeModule, dataAccessModel[activeModule.resourceId], e)}
                        disabled={readonly}
                      >
                        {dataOptions.map(option => (
                          <Radio key={option.value} value={option.value}>
                            {option.label}
                          </Radio>
                        ))}
                      </Radio.Group>
                    </div>
                  )}
                </div>

                {dataAccess[activeModule.resourceId]?.accessRange === 'CUSTOM' && (
                  <TreeSelectMini
                    className={style.rightSide}
                    selectedClass={style.selected}
                    members={dataAccess[activeModule.resourceId].members || []}
                    onChange={members => onMemberChange(dataAccess[activeModule.resourceId], members)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
