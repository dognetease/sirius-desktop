/* eslint-disable react/destructuring-assignment */
import React, { useState, useEffect, useMemo } from 'react';
import { Checkbox, Radio, RadioChangeEvent, Tabs, Popover } from 'antd';
import classNames from 'classnames';
import { AccessModel, AdminAccountInfo, ModulePrivilege, PrivilegeItem } from 'api';

import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import style from './privilegeSelect.module.scss';
import { TreeSelectMini } from '../selectContact/mini';
import { DependencyConfig, ReversedDependency } from './dependency';
import { ReactComponent as QuestionIcon } from '@/images/icons/edm/question.svg';
import { getTransText } from '@/components/util/translate';

const { TabPane } = Tabs;

const dataOptions = [
  {
    value: 'ORG',
    label: '公司',
  },
  {
    value: 'DEP',
    label: '本团队',
  },
  {
    value: 'OWNER',
    label: '个人',
  },
  {
    value: 'CUSTOM',
    label: '自定义',
  },
];

export interface ISelectPrivilegeProps {
  data: ModulePrivilege[];
  dataAccess?: { [key: string]: PrivilegeItem };
  checkedKeys?: Record<string, string[]>;
  onChange?: (checkedKeys: Record<string, string[]>, dataAccess: { [key: string]: PrivilegeItem }) => void;
  readonly?: boolean;
}

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

export const PrivilegeSelectList = (props: ISelectPrivilegeProps) => {
  const { readonly } = props;
  const [funAccessList, setFunctionAccessList] = useState<{ [key: string]: AccessModel[] }>({});
  const [dataAccessModel, setDataAccessModel] = useState<{ [key: string]: AccessModel }>({});
  const [dataAccess, setDataAccess] = useState<{ [key: string]: PrivilegeItem }>(props.dataAccess || {});
  const [checkedKeys, setCheckedKeys] = useState<{ [key: string]: string[] }>(props.checkedKeys || {});

  const menus = useMemo(() => groupBy(props.data), [props.data]);
  const [activeModule, setActiveModule] = useState<ModulePrivilege>();

  useEffect(() => {
    const obj: { [key: string]: AccessModel[] } = {};
    const data: { [key: string]: AccessModel } = {};
    props.data.forEach(item => {
      obj[item.resourceLabel] = item.accessList.filter(i => i.accessType !== 'DATA');
      const dataItem = item.accessList.find(i => i.accessType === 'DATA');
      if (dataItem) {
        data[item.resourceLabel] = dataItem;
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

  const onFuncCheck = (resourceLabel: string, accessLabel: string, e: CheckboxChangeEvent) => {
    const { checked } = e.target;
    const keys = checkedKeys[resourceLabel] ? [...checkedKeys[resourceLabel]] : [];
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
    checkedKeys[resourceLabel] = keys;
    const newKeys = { ...checkedKeys };
    setCheckedKeys(newKeys);
    let dataKeys = dataAccess;
    // update dataAccess
    if (checked && !dataAccess[resourceLabel] && dataAccessModel[resourceLabel]) {
      dataKeys[resourceLabel] = {
        resourceLabel,
        accessLabel: dataAccessModel[resourceLabel].accessLabel,
        accessType: 'DATA',
        accessRange: 'OWNER',
      };
      dataKeys = { ...dataKeys };
    }
    props.onChange && props.onChange(checkedKeys, dataKeys);
  };

  const onDataAccessChange = (resourceLabel: string, item: AccessModel, e: RadioChangeEvent) => {
    dataAccess[resourceLabel] = {
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
    dataAccess[item.resourceLabel] = { ...item };
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
                const isEmpty = !checkedKeys[module.resourceLabel] || checkedKeys[module.resourceLabel].length === 0;
                return (
                  <div
                    className={classNames(style.resourceName, module.resourceLabel === activeModule?.resourceLabel ? style.active : '')}
                    onClick={() => setActiveModule(module)}
                  >
                    {module.resourceName}
                    {isEmpty && <span className={style.subText}>（未配置）</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className={style.groupRight}>
          <div className={style.flexContainer}>
            {activeModule !== undefined && (
              <>
                <div className={style.mainSetting} style={{ paddingLeft: 24 }}>
                  <div className={style.moduleName}>{activeModule.resourceName}</div>
                  <div className={style.fnsList}>
                    <div className={style.title}>{getTransText('GONGNENGQUANXIAN')}</div>
                    <Checkbox.Group value={checkedKeys[activeModule.resourceLabel]} disabled={readonly}>
                      {funAccessList[activeModule.resourceLabel]?.map(fn => (
                        <Checkbox
                          value={fn.accessLabel}
                          key={fn.accessLabel}
                          onChange={e => onFuncCheck(activeModule.resourceLabel, fn.accessLabel, e)}
                          // 隐藏，不支持强制删除配置
                          className={fn.accessLabel === 'FORCE_DELETE' && activeModule.resourceLabel === 'CHANNEL' ? style.hide : undefined}
                        >
                          {fn.accessName}
                          {/* 隐藏，展示不需要这个功能 */}
                          {/* {fn.accessLabel === 'FORCE_DELETE' && activeModule.resourceLabel === 'CHANNEL' ? (
                            <Popover overlayClassName={style.forceInfo} content="开启后可强制删除“转客户”的线索" trigger="hover">
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
                  {dataAccessModel[activeModule.resourceLabel] && (
                    <div className={style.dataOptions}>
                      <div className={style.title}>数据权限</div>
                      <Radio.Group
                        value={dataAccess[activeModule.resourceLabel]?.accessRange}
                        onChange={e => onDataAccessChange(activeModule.resourceLabel, dataAccessModel[activeModule.resourceLabel], e)}
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

                {dataAccess[activeModule.resourceLabel]?.accessRange === 'CUSTOM' && (
                  <TreeSelectMini
                    className={style.rightSide}
                    selectedClass={style.selected}
                    members={dataAccess[activeModule.resourceLabel].members || []}
                    onChange={members => onMemberChange(dataAccess[activeModule.resourceLabel], members)}
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
