import React, { useEffect, useState, useRef } from 'react';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import MultiSelectContent from '../multiSelectContent/multiSelectContentNew';
import { EmptyContactType } from '../../send/edmWriteContext';
import { Tabs, Radio, Tooltip } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { api, apiHolder, apis, FieldSettingApi, DataStoreApi } from 'api';
import style from './insertVariable.module.scss';
import { edmDataTracker } from '../../tracker/tracker';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
// import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import classname from 'classnames';
import { ReactComponent as SelectedRightSvg } from '@/images/icons/edm/yingxiao/selected-right.svg';
import { ReactComponent as EmptyCompanySvg } from '@/images/icons/edm/yingxiao/empty-company.svg';
import { ReactComponent as ExplanationIcon } from '@/images/icons/edm/yingxiao/explanation-gray16px.svg';
import { ReactComponent as ExplanationIconBlue } from '@/images/icons/edm/yingxiao/explanation-blue16px.svg';
import { getIn18Text } from 'api';

interface VariableModel {
  show: string;
  code: string;
  autoScanCode?: string;
}

interface VariableNameModel {
  code: string;
  picture: string;
  pictureValue: string;
  autoScanCode: string;
}

interface OptionItem {
  id: string;
  name: string;
  autoScanVariableName?: string;
}
const fieldSettingApi = apiHolder.api.requireLogicalApi(apis.fieldSettingApiImpl) as FieldSettingApi;

const CreateGroupId = 'createId';
const VARIABLE_KEY = 'variableSystemListData';
const dataStoreApi = api.getDataStoreApi() as DataStoreApi;

export const InsertVariablModal = ({
  onChange,
  emptyContactType,
  onVisible,
  defaultOpen,
  expandPosition,
  trackSource = 'unKnown',
  variableVisible,
}: {
  emptyContactType?: EmptyContactType;
  onVisible?: (visible: boolean) => any;
  onChange: (value: Array<string | number>) => void;
  defaultOpen?: boolean;
  expandPosition?: string;
  trackSource?: '主题' | '正文' | '源代码' | 'unKnown';
  variableVisible: boolean;
}) => {
  const hasPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'ORG_SETTINGS', 'EDM_TMPL_VARIABLE_SETTING'));
  const menuKeys = useAppSelector(state => state.privilegeReducer.visibleMenuLabels);
  const [activeKey, setActiveKey] = useState<'system' | 'company'>('system');

  const [errMsg, setErrMsg] = useState<string>('');
  const [companyItems, setCompanyItems] = useState<OptionItem[]>([]);
  const [status, setStatus] = useState<'create' | 'edit'>('create');
  const [editId, setEditId] = useState<string>();
  const [editName, setEditName] = useState('');

  const [variable, setVariable] = useState('crm_name');
  const [variableList, setVariableList] = useState<VariableModel[]>([]);
  const [variableNameList, setVariableNameList] = useState<VariableNameModel[]>([]);
  const [contactNameShowCode, setContactNameShowCode] = useState<string>('');
  const [contactNameServerCode, setContactNameServerCode] = useState<string>('');

  const varibaleRef = useRef<any>(null);
  const companyKeyRef = useRef<string>('');

  const setCodeByVariable = () => {
    let values = varibaleRef.current.crm.name.value;
    if (values.length > 0) {
      setContactNameShowCode(values[0].code);
      setContactNameServerCode(values[0].autoScanCode);
    }
  };

  const onVariableChange = (e: RadioChangeEvent) => {
    setVariable(e.target.value);
  };

  const getVarList = () => {
    fieldSettingApi.getVariableList().then(vars => {
      const newOptions: OptionItem[] = vars.map(item => ({
        id: item.variableId,
        name: item.variableName,
        autoScanVariableName: item.autoScanVariableName,
      }));
      setCompanyItems(newOptions);
    });
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
  //
  const handleChange = (value: (string | number)[]) => {
    const key = value[value.length - 1] as string;
    companyKeyRef.current = key;
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

  const editItem = (item: any) => {
    if (editId) {
      return;
    }
    setEditId(item.id);
    setEditName(item.name);
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

  const saveAllEdit = () => {
    setStatus('create');
    onManageCancel();
  };

  const setListByVar = () => {
    const tempList = varibaleRef.current.crm;
    if (!tempList) return;
    setVariableList([{ show: tempList.name.show, autoScanCode: 'crm_name' }, ...tempList.other]);
    setVariableNameList(tempList.name.value);
  };

  const getVariableSystemList = () => {
    fieldSettingApi.getVariableSystemList().then(res => {
      varibaleRef.current = res;
      setListByVar();
      setCodeByVariable();

      dataStoreApi.putSync(VARIABLE_KEY, JSON.stringify(res), {
        noneUserRelated: false,
      });
    });
  };

  const onConfirm = () => {
    if (activeKey === 'system') {
      let key = '';
      if (variable === 'crm_name') {
        key = contactNameServerCode;
      } else {
        key = variable;
      }
      onChange([key]);
      edmDataTracker.track('pc_markting_edm_variable_click', {
        variable_type: getIn18Text('XITONGBIANLIANG'),
        variable_content: key,
        variable_insert: trackSource === 'unKnown' ? null : trackSource,
      });
    } else if (activeKey === 'company') {
      const key = companyKeyRef.current;
      let val = companyItems.find(item => item.id === key)?.autoScanVariableName;
      val && onChange([val]);
      // 主要针对企业变量选中后关闭弹窗
      // setHideCascader(true);
      onVisible && onVisible(false);
      edmDataTracker.track('pc_markting_edm_variable_click', {
        variable_type: getIn18Text('QIYEBIANLIANG'),
        variable_content: val,
        variable_insert: trackSource === 'unKnown' ? null : trackSource,
      });
    }
  };

  useEffect(() => {
    const variableListData = dataStoreApi.getSync(VARIABLE_KEY).data;
    if (!!variableListData) {
      varibaleRef.current = JSON.parse(variableListData);
      setListByVar();
    }
    getVariableSystemList();
    getVarList();
  }, []);
  return (
    <SiriusModal
      visible={variableVisible}
      width={494}
      title={getIn18Text('CHARUBIANLIANG')}
      onCancel={() => {
        onVisible && onVisible(false);
      }}
      maskClosable={false}
      destroyOnClose={true}
      closable={true}
      centered={true}
      className={style.insertVariableModal}
      onOk={onConfirm}
      getContainer={() => document.body}
    >
      <Tabs size="small" className={style.tableFilterTabs} activeKey={activeKey} onChange={active => setActiveKey(active)}>
        <Tabs.TabPane
          id="tab-system"
          tab={
            <>
              <Tooltip title={getIn18Text('XITONGBIANLIANGKEZIDONG')}>
                {getIn18Text('XITONGBIANLIANG')}
                {activeKey === 'system' ? (
                  <ExplanationIconBlue style={{ marginLeft: 6, marginBottom: -3 }} />
                ) : (
                  <ExplanationIcon style={{ marginLeft: 6, marginBottom: -3 }} />
                )}
              </Tooltip>
            </>
          }
          key="system"
        >
          <div className={style.tabContainer}>
            <div className={style.sysVarSouceTip}>{getIn18Text('SYS_VAR_SOURCE_TIP')}</div>
            <Radio.Group onChange={onVariableChange} value={variable}>
              {variableList.map(item => {
                return <Radio value={item.autoScanCode}>{item.show}</Radio>;
              })}
            </Radio.Group>
            <div className={style.contactName}>
              {'crm_name' === variable && (
                <>
                  <div className={style.contactNameTitle}>{getIn18Text('RUOGAILIANXIRENMEIYOU')}</div>
                  <div className={style.contactNameList}>
                    {variableNameList.map(contact => {
                      return (
                        <div
                          className={style.contactNameItem}
                          onClick={() => {
                            setContactNameShowCode(contact.code);
                            setContactNameServerCode(contact.autoScanCode);
                          }}
                        >
                          <div className={classname(style.contactNameContent, contact.code === contactNameShowCode ? style.contactNameSelect : '')}>
                            <div className={style.contactNameName}>{contact.picture}</div>
                            <div className={style.contactNameBar} style={{ marginBottom: '6px' }}></div>
                            <div className={style.contactNameBar}></div>
                            {contact.code === contactNameShowCode && <SelectedRightSvg className={style.contactNameSelectIcon} />}
                          </div>
                          <div className={style.contactNameFooter}>{contact.pictureValue}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane
          id="tab-company"
          tab={
            <>
              <Tooltip title={getIn18Text('QIYEKEZIDINGYIBIAN')}>
                {getIn18Text('QIYEBIANLIANG')}
                {activeKey === 'company' ? (
                  <ExplanationIconBlue style={{ marginLeft: 6, marginBottom: -3 }} />
                ) : (
                  <ExplanationIcon style={{ marginLeft: 6, marginBottom: -3 }} />
                )}
              </Tooltip>
            </>
          }
          key="company"
        >
          <div className={style.tabContainer}>
            {companyItems.length > 0 ? (
              <MultiSelectContent
                dataList={companyItems}
                selectedIds={[]}
                isShow={activeKey === 'company'}
                onCheckedChange={handleChange}
                createItems={addGroup}
                manageItems={() => {
                  setErrMsg('');
                  edmDataTracker.track('pc_markting_edm_variable_manage');
                  onCancel();
                  setStatus('edit');
                  // setManageVisible(true);
                }}
                addCancel={onCancel}
                addItems={onCreate}
                errorMessage={errMsg}
                createGroupId={CreateGroupId}
                hideCheckbox
                permisson={hasPermisson && menuKeys['ORG_SETTINGS_TMPL_VARIABLE_SETTING'] !== false}
                maxLength={20}
                typePinyin="BIANLIANG"
                status={status}
                saveAllEdit={saveAllEdit}
                deleteItem={deleteItem}
                editItem={editItem}
                editId={editId}
                editName={editName}
                saveItem={saveItem}
                onCancel={onManageCancel}
                onNameChange={onNameChange}
              />
            ) : (
              <div className={style.emptyContainer}>
                <EmptyCompanySvg />
                <div className={style.emptyText}>
                  {getIn18Text('ZANWUBIANLIANGXINXI，')}
                  <span
                    className={style.emptyBtn}
                    onClick={e => {
                      setStatus('create');
                      addGroup(e);
                    }}
                  >
                    {getIn18Text('LIJIXINZENG')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Tabs.TabPane>
      </Tabs>
    </SiriusModal>
  );
};
