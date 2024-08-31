import React, { useEffect, useState, useRef } from 'react';
import { Cascader, Divider, Tabs, Alert } from 'antd';
import style from './insertVariable.module.scss';
import { EmptyContactType } from '../../send/edmWriteContext';
import MultiSelectManage from '../multiSelectManage/multiSelectManage';
import MultiSelectContent from '../multiSelectContent/multiSelectContent';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { apiHolder, apis, FieldSettingApi } from 'api';
import { edmDataTracker } from '../../tracker/tracker';
import { ReactComponent as AskIcon } from '@/images/icons/alert/ask.svg';
import { ReactComponent as CloseIcon } from '@/images/icons/close_icon_mini.svg';
import { ReactComponent as ArrowRightIcon } from '@/images/icons/edm/arrow_right.svg';
import classname from 'classnames';
import { randomString } from '@web-common/components/util/ics';
import { getIn18Text } from 'api';
const CreateGroupId = 'createId';
const systemItems = [
  {
    value: 'name',
    label: getIn18Text('LIANXIRENXINGMING'),
    children: [
      {
        value: '',
        label: (
          <Alert
            icon={<AskIcon className={style.variableTipAsk} />}
            closeText={<CloseIcon className={style.variableTipClose} />}
            className={style.variableTip}
            message={getIn18Text('ANKEHUMOKUAIDELIAN')}
            type="info"
            showIcon
            closable
          />
        ),
        disabled: true,
      },
      {
        value: 'name_0',
        label: getIn18Text('XIANSHIKONG'),
      },
      {
        value: 'name_1',
        label: getIn18Text('XIANSHI"friend"'),
      },
      {
        value: 'name_2',
        label: getIn18Text('XIANSHIYOUXIANGQIANZHUI'),
      },
    ],
  },
  {
    value: 'company',
    label: getIn18Text('GONGSIMINGCHENG'),
  },
];

interface OptionItem {
  id: string;
  name: string;
}
const fieldSettingApi = apiHolder.api.requireLogicalApi(apis.fieldSettingApiImpl) as FieldSettingApi;
export const InsertVariable = ({
  onChange,
  emptyContactType,
  onVisible,
  defaultOpen,
  expandPosition,
  trackSource = 'unKnown',
}: {
  emptyContactType?: EmptyContactType;
  onVisible?: (visible: boolean) => any;
  onChange: (value: Array<string | number>) => void;
  defaultOpen?: boolean;
  expandPosition?: string;
  trackSource?: '主题' | '正文' | '源代码' | 'unKnown';
}) => {
  const hasPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'ORG_SETTINGS', 'EDM_TMPL_VARIABLE_SETTING'));
  const menuKeys = useAppSelector(state => state.privilegeReducer.visibleMenuLabels);
  const [companyItems, setCompanyItems] = useState<OptionItem[]>([]);
  const [errMsg, setErrMsg] = useState<string>('');
  const [manageVisible, setManageVisible] = useState<boolean>(false);
  const [editId, setEditId] = useState<string>();
  const [editName, setEditName] = useState('');
  const [hideCascader, setHideCascader] = useState<boolean>(false);
  const [activeKey, setActiveKey] = useState<string>('system');
  const [ramdonStr, setRamdonStr] = useState<string>(randomString());

  const addMouseEnterFunc = () => {
    // if (trigger !== 'hover') { return }

    const tabKey = getIdBySource() + '-tab-system';
    const tabSys = document.getElementById(tabKey);
    if (tabSys) {
      tabSys.onmouseenter = () => setActiveKey('system');
    }

    const compKey = getIdBySource() + '-tab-company';
    const tabCompany = document.getElementById(compKey);
    if (tabCompany) {
      tabCompany.onmouseenter = () => setActiveKey('company');
    }
  };

  useEffect(() => {
    addMouseEnterFunc();
  }, [companyItems, activeKey]);

  useEffect(() => {
    !defaultOpen && setHideCascader(false);
    defaultOpen && getVarList();
  }, [defaultOpen]);

  const editItem = (item: any) => {
    if (editId) {
      return;
    }
    setEditId(item.id);
    setEditName(item.name);
  };

  const deleteItem = async (item: any) => {
    const res = await fieldSettingApi.delVariable(item.id);
    if (res) {
      setErrMsg('');
      setCompanyItems(
        companyItems.filter(itm => {
          return itm.id !== item.id;
        }) || []
      );
      edmDataTracker.track('pc_markting_edm_variable_manage_action', {
        action: getIn18Text('SHANCHU'),
      });
      return;
    }
    setErrMsg(getIn18Text('SHANCHUSHIBAI'));
  };

  const saveItem = async (item: any) => {
    const createName = editName.trim();
    const isRepeat = companyItems.some(v => v.name === createName);
    if (isRepeat) {
      setErrMsg(getIn18Text('BIANLIANGMINGCHENGBUNENGZHONG'));
      return;
    }
    const res = await fieldSettingApi.editVariable(item.id, createName);
    if (res) {
      setErrMsg('');
      onManageCancel();
      getVarList();
      edmDataTracker.track('pc_markting_edm_variable_manage_action', {
        action: getIn18Text('BIANJI'),
      });
      return;
    }
    setErrMsg(getIn18Text('BIANJISHIBAI'));
  };

  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditName(event.target.value || '');
  };

  const onManageCancel = () => {
    setEditId(undefined);
    setEditName('');
    setErrMsg('');
  };

  const getVarList = () => {
    fieldSettingApi.getVariableList().then(vars => {
      const newOptions = vars.map(item => ({
        id: item.variableId,
        name: item.variableName,
      }));
      setCompanyItems(newOptions);
    });
  };

  const handleChange = (value: (string | number)[]) => {
    const key = value[value.length - 1] as string;
    if (key.indexOf('name') === 0 || key === 'company') {
      onChange([key]);
      edmDataTracker.track('pc_markting_edm_variable_click', {
        variable_type: getIn18Text('XITONGBIANLIANG'),
        variable_content: key,
        variable_insert: trackSource === 'unKnown' ? null : trackSource,
      });
    } else if (key) {
      let val = companyItems.find(item => item.id === key)?.name;
      val && onChange([val]);
      // 主要针对企业变量选中后关闭弹窗
      setHideCascader(true);
      edmDataTracker.track('pc_markting_edm_variable_click', {
        variable_type: getIn18Text('QIYEBIANLIANG'),
        variable_content: val,
        variable_insert: trackSource === 'unKnown' ? null : trackSource,
      });
    }
  };

  const resetErr = () => {
    setErrMsg('');
  };

  const onCancel = () => {
    const list = companyItems.filter(item => {
      return item?.id !== CreateGroupId;
    });
    setCompanyItems(list);
    resetErr();
  };

  const addGroup = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (companyItems.length > 0 && companyItems[companyItems.length - 1].id === CreateGroupId) {
      return;
    }
    edmDataTracker.track('pc_markting_edm_variable_add');
    setCompanyItems([
      ...companyItems,
      {
        id: CreateGroupId,
        name: getIn18Text('XINJIANDEFENZUMINGCHENG'),
      },
    ]);
  };

  const onCreate = async (name: string) => {
    const createName = name.trim();
    if (createName) {
      const isRepeat = companyItems.some(v => v.name === createName);
      if (isRepeat) {
        setErrMsg(getIn18Text('BIANLIANGMINGCHENGBUNENGZHONG'));
      } else {
        fieldSettingApi
          .addVariable(createName)
          .then(res => {
            getVarList();
            resetErr();
          })
          .catch(() => {
            setErrMsg(getIn18Text('BIANLIANGTIANJIASHIBAI'));
          });
      }
    } else {
      setErrMsg(getIn18Text('BIANLIANGMINGCHENGBUNENGWEI'));
    }
  };

  // 因为业务可能存在多个组件. 所以通过随机数作为key来区分对应的组件, 用来动态添加 hover 方法
  const getIdBySource = () => {
    return ramdonStr + 'variable-tabs';
  };

  const dropdownRender = (menus: React.ReactNode) => (
    <div
      className={classname(
        style.variableWrapper,
        activeKey === 'system' ? style.variableWrapperHeight : {},
        expandPosition === 'rightTop' ? style.variableWrapperExpandRt : {},
        expandPosition === 'leftBottom' ? style.variableWrapperExpandLb : {}
      )}
    >
      <Tabs id={getIdBySource()} activeKey={activeKey} onChange={active => setActiveKey(active)}>
        <Tabs.TabPane id="tab-system" tab={getIn18Text('XITONGBIANLIANG')} key="system">
          <Alert
            icon={<AskIcon className={style.variableTipAsk} />}
            closeText={<CloseIcon className={style.variableTipClose} />}
            className={style.variableTip}
            message={getIn18Text('XITONGBIANLIANGKEZIDONG')}
            type="info"
            showIcon
            closable
          />
          {menus}
        </Tabs.TabPane>
        <Tabs.TabPane id="tab-company" tab={getIn18Text('QIYEBIANLIANG')} key="company">
          <Alert
            icon={<AskIcon className={style.variableTipAsk} />}
            closeText={<CloseIcon className={style.variableTipClose} />}
            className={style.variableTip}
            message={getIn18Text('QIYEKEZIDINGYIBIAN')}
            type="info"
            showIcon
            closable
          />
          <MultiSelectContent
            dataList={companyItems}
            selectedIds={[]}
            onCheckedChange={handleChange}
            createItems={addGroup}
            manageItems={() => {
              setErrMsg('');
              edmDataTracker.track('pc_markting_edm_variable_manage');
              setManageVisible(true);
            }}
            addCancel={onCancel}
            addItems={onCreate}
            errorMessage={errMsg}
            createGroupId={CreateGroupId}
            hideCheckbox
            permisson={hasPermisson && menuKeys['ORG_SETTINGS_TMPL_VARIABLE_SETTING'] !== false}
            maxLength={20}
            typePinyin="BIANLIANG"
          />
        </Tabs.TabPane>
      </Tabs>
      <Divider style={{ margin: 0 }} />
    </div>
  );

  setTimeout(() => {
    addMouseEnterFunc();
  }, 300);

  return (
    <>
      <Cascader
        options={systemItems}
        onChange={value => handleChange(value)}
        popupClassName={style.insertVariable}
        onPopupVisibleChange={visible => {
          onCancel();
          defaultOpen && setHideCascader(true);
          onVisible && onVisible(visible);
          visible && getVarList();
        }}
        expandTrigger="hover"
        dropdownRender={dropdownRender}
        expandIcon={<ArrowRightIcon />}
        {...(manageVisible ? { popupVisible: false } : defaultOpen ? { popupVisible: true } : hideCascader ? { popupVisible: false } : {})}
        getPopupContainer={_ => document.body}
      >
        <div
          className={classname(style.insertBtn, defaultOpen ? style.insertBtnHide : '')}
          onMouseDown={e => {
            setHideCascader(false);
            e.stopPropagation();
          }}
        >
          {/* <VariableIcon className={style.insertIcon} /> */}
          {getIn18Text('CHARUBIANLIANG')}
        </div>
      </Cascader>
      <MultiSelectManage
        visible={manageVisible}
        editId={editId}
        editName={editName}
        dataList={companyItems.filter(item => {
          return item?.id !== CreateGroupId;
        })}
        editItem={editItem}
        saveItem={saveItem}
        deleteItem={deleteItem}
        closeModal={() => setManageVisible(false)}
        onNameChange={onNameChange}
        onCancel={onManageCancel}
        errorMessage={errMsg}
        maxLength={20}
        typePinyin="BIANLIANG"
      />
    </>
  );
};
