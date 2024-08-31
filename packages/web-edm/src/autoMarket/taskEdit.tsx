import React, { useState, useReducer, useEffect, useMemo, useRef } from 'react';
import { Button, Spin, Checkbox, Tooltip } from 'antd';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import classNames from 'classnames';
import {
  apis,
  apiHolder,
  DataStoreApi,
  FieldSettingApi,
  CustomerApi,
  EdmSendBoxApi,
  AutoMarketApi,
  AutoMarketOpenStatus,
  AutoMarketTaskType,
  AutoMarketTaskDetail,
  AutoMarketTaskObjectType,
  AutoMarketTaskObjectTypeName,
  AutoMarketTaskTriggerCondition,
  AutoMarketTaskTriggerConditionType,
  AutoMarketTaskTriggerConditionTypeName,
  AutoMarketTaskTruckAction,
  AutoMarketTaskActionType,
  AutoMarketTaskActionTypeName,
  AutoMarketTaskActionContent,
  AutoMarketCustomerUpdateField,
  AutoMarketTaskObjectContent,
} from 'api';
import {
  FORM_INITIAL_VALUE,
  initialTaskDetailMap,
  taskDetailLayoutMap,
  getTaskObjectPanelInfo,
  getTaskTriggerConditionInfo,
  getTaskExecActionInfo,
  getTaskAdditionalActionInfo,
  getTaskAdditionalActionPanelInfo,
  getEdmSendTime,
} from './constant';
import { edmWriteContext, EmptyContactType, IEdmWriteState, writeContextReducer } from '../send/edmWriteContext';
import Step from './components/step';
import Panel from './components/panel';
import CustomerPicker from './components/customerPicker';
import CluePicker from './components/cluePicker';
import AddressPicker from './components/addressPicker';
import DateCondition from './components/dateCondition';
import EmailCondition from './components/emailCondition';
import EdmSetting from './components/edmSetting';
import UpdateCustomer from './components/updateCustomer';
import AdditionalEdmSettingNew from './components/additionalEdmSettingNew';

import Toast from '@web-common/components/UI/Message/SiriusMessage';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import WarnIcon from '@web-common/components/UI/Icons/svgs/WarnSvg';
import { ReactComponent as ArrowLeft } from '@/images/icons/edm/autoMarket/arrowLeft.svg';
import { ReactComponent as EditIcon } from '@/images/icons/edm/autoMarket/editIcon.svg';
import horizontal from '@/images/icons/edm/autoMarket/horizontal.svg';
import vertical from '@/images/icons/edm/autoMarket/vertical.svg';
import ShowConfirm from '@/components/Layout/Customer/components/confirm/makeSureConfirm';
import { getTransText } from '@/components/util/translate';
import TaskCreateModal from './taskCreateModal';
import { navigate } from '@reach/router';
import { cloneDeep } from 'lodash';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import useLocalStorage from '@/hooks/useLocalStorage';
import { autoMarketTracker } from './tracker';
import { AddressGroupContactPicker } from './components/addressGroupContactPicker';
import { AdditionalGroupSetting } from './components/AdditionalGroupSetting';
import { EdmEmailPicker } from './components/edmEmailPicker/edmEmailPicker';
import Badge from './badge';
import style from './taskEdit.module.scss';
import DeleteIcon from '@/images/icons/edm/autoMarket/delete.svg';
import { getIn18Text } from 'api';

const LoadingIcon = () => (
  <div className="sirius-spin" style={{ width: 24, height: 24 }}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        opacity="0.27"
        d="M20.8884 11.9998C20.8884 7.09059 16.9087 3.11089 11.9995 3.11089C7.09029 3.11089 3.1106 7.09059 3.1106 11.9998C3.1106 16.909 7.09029 20.8887 11.9995 20.8887C16.9087 20.8887 20.8884 16.909 20.8884 11.9998Z"
        stroke="#386EE7"
        strokeWidth="3"
      />
      <path
        d="M3.11133 12.0005C3.11133 7.09129 7.09102 3.1116 12.0002 3.1116C14.993 3.1116 17.6403 4.59063 19.2512 6.85763"
        stroke="#386EE7"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  </div>
);
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const fieldSettingApi = apiHolder.api.requireLogicalApi(apis.fieldSettingApiImpl) as FieldSettingApi;
const autoMarketApi = apiHolder.api.requireLogicalApi(apis.autoMarketApiImpl) as unknown as AutoMarketApi;
interface TaskEditProps {
  qs: Record<string, string>;
}
type Step = 'OBJECT' | 'TRIGGER_CONDITION' | 'EXEC_ACTION' | 'ADDITIONAL_ACTION';
type Option = AutoMarketTaskObjectType | AutoMarketTaskTriggerConditionType | AutoMarketTaskActionType;
export interface LabelType {
  label: string;
  value: string | number;
}
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const PermissionWrapper: React.FC<{
  children: React.ReactChild;
}> = props => (
  <PermissionCheckPage
    resourceLabel="EDM"
    accessLabel="OP"
    menu="EDM_SENDBOX"
    customContent={
      <div style={{ marginTop: 12 }}>
        <Button onClick={() => navigate('#edm?page=autoMarketTask')}>{getIn18Text('FANHUI')}</Button>
      </div>
    }
  >
    {props.children}
  </PermissionCheckPage>
);
const TaskEdit: React.FC<TaskEditProps> = props => {
  const { qs } = props;
  const [taskCreateModalVisible, setTaskCreateModalVisible] = useState<boolean>(false);
  const [cancelTaskModalVisible, setCancelTaskModalVisible] = useState<boolean>(false);
  const [template, setTemplate] = useLocalStorage<boolean>('auto-market-save-as-template', false);
  const [clueStatuses, setClueStatuses] = useState<LabelType[]>([]);
  const [uniClueStatuses, setUniClueStatuses] = useState<LabelType[]>([]);
  const [updateCustomerFields, setUpdateCustomerFields] = useState<AutoMarketCustomerUpdateField[]>([]);
  const handleClueDictionaryFetch = () => {
    customerApi.getBaseInfo().then((baseInfo: any) => {
      setClueStatuses(baseInfo.clue_status);
    });
  };

  const handelUniCustomerFollowStatus = () => {
    autoMarketApi.getUniCustomerFollowStatus().then(res => {
      let customerStatus = res.followStatusList.map(item => ({
        label: item.followStatusName,
        value: item.followStatus,
      }));
      setUniClueStatuses(customerStatus);
    });
  };
  const handleUpdateCustomerFieldsFetch = () => {
    autoMarketApi.getCustomerUpdateFields().then(data => {
      setUpdateCustomerFields(data.customerUpdateActionItems);
    });
  };
  useEffect(() => {
    handleClueDictionaryFetch();
    handleUpdateCustomerFieldsFetch();
    handelUniCustomerFollowStatus();
  }, []);
  const [state, dispatch] = useReducer(writeContextReducer, {
    emptyContactType: dataStoreApi.getSync('EmptyContactSetting').data || EmptyContactType.Email,
  } as IEdmWriteState);
  const handleVariableListFetch = () => {
    fieldSettingApi.getVariableList().then(data => {
      dispatch({
        type: 'setState',
        payload: {
          variableList: data,
        },
      });
    });
  };
  useEffect(() => {
    handleVariableListFetch();
  }, []);
  const [taskType, setTaskType] = useState<AutoMarketTaskType | null>(null);
  const [taskDetail, setTaskDetail] = useState<AutoMarketTaskDetail | null>(null);
  const hasUpdate = useRef<boolean>(false);
  useEffect(() => {
    return () => {
      hasUpdate.current = true;
    };
  }, [taskDetail]);
  const [step, setStep] = useState<Step | null>(null);
  const [option, setOption] = useState<Option | null>(null);
  const [additionalIndex, setAdditionalIndex] = useState<number | null>(null);
  const [fetching, setFetching] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [starting, setStarting] = useState<boolean>(false);

  const additionalActionAddable = useMemo(() => {
    const taskDetailChecked = checkDetailData(taskDetail as AutoMarketTaskDetail, true);
    if (
      taskDetailChecked?.execAction?.actionType === AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP ||
      taskDetailChecked?.additionalActionLayerList?.some(action => action?.truckAction?.actionType === AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP)
    ) {
      return false;
    }
    if (taskDetailChecked && taskType) {
      const maxCount = taskDetailLayoutMap[taskType].additionalActionMaxCount;
      return maxCount - (taskDetailChecked?.additionalActionLayerList?.length || 0) > 0;
    }
    return false;
  }, [taskDetail, taskType]);
  const addAdditionAction = () => {
    if (taskDetail && taskType) {
      const nextTaskDetail = { ...taskDetail };
      let isFillIn = nextTaskDetail.additionalActionLayerList.every(action => !!action?.truckAction?.actionType);
      if (isFillIn) {
        nextTaskDetail.additionalActionLayerList = [
          ...nextTaskDetail.additionalActionLayerList,
          initialTaskDetailMap.POTENTIAL_CONTACT.additionalActionLayerList[0],
          // {} as unknown as AutoMarketTaskTruckAction
        ];
        setTaskDetail(nextTaskDetail);
      } else {
        Toast.warning({ content: getTransText('QINGXIANWANCHENGSHANGYIBUDEZHUIJIADONGZUO') });
      }
    }
  };

  const handleAdditionalActionDelete = (deleteIndex: number, mainBranch?: boolean, isHaveBranch?: boolean) => {
    if (taskDetail && taskType) {
      const nextTaskDetail = { ...taskDetail };
      if (mainBranch) {
        const deleteHander = () => {
          nextTaskDetail.additionalActionLayerList = nextTaskDetail.additionalActionLayerList.filter((_, index) => index !== deleteIndex);
          setTaskDetail(nextTaskDetail);
          handleDrawerClose();
          Toast.success({ content: getIn18Text('SHANCHUCHENGGONG') });
        };
        isHaveBranch
          ? ShowConfirm({
              title: getTransText('RUOSHANCHUZHUIJIADONGZUO'),
              type: 'danger',
              okText: getTransText('QUEDING'),
              cancelText: getTransText('QUXIAO'),
              makeSure: () => deleteHander(),
            })
          : deleteHander();
      } else {
        nextTaskDetail.additionalActionLayerList = nextTaskDetail.additionalActionLayerList.map((item, index) => {
          if (index === deleteIndex) {
            item.branchAction = null;
          }
          return item;
        });
        setTaskDetail(nextTaskDetail);
        handleDrawerClose();
        Toast.success({ content: getIn18Text('SHANCHUCHENGGONG') });
      }
    }
  };
  const handleDrawerClose = () => {
    setStep(null);
    setOption(null);
    setAdditionalIndex(null);
  };

  const handleSave = async () => {
    if (taskDetail) {
      // 检查数据  个别模块会有隐藏/展示的逻辑，但是数据会有残留 在这里统一处理
      setTaskDetail(checkDetailData(taskDetail, true));
      if (!taskDetail.taskName) {
        Toast.error({ content: getIn18Text('QINGSHURURENWUMINGCHENG') });
        return Promise.reject();
      }
      autoMarketTracker.saveClick();
      if (template) {
        Modal.confirm({
          title: getTransText('QINGQUERENSHIFOUJINBAOCUNDANGQIANRENWU'),
          content: getTransText('BAOCUNCAOZUO'),
          type: 'warn',
          okText: getTransText('BAOCUN'),
          cancelText: getTransText('GUANBI'),
          closable: true,
          className: style.modal,
          onOk: () => {
            setSaving(true);
            autoMarketApi
              .editTask({
                ...taskDetail,
                template: false,
              })
              .then(({ taskId }) => {
                setTaskDetail({ ...taskDetail, taskId });
                Toast.info({ content: getIn18Text('BAOCUNCHENGGONG') });
                hasUpdate.current = false;
              })
              .finally(() => {
                setSaving(false);
              });
          },
        });
      } else {
        setSaving(true);
        return autoMarketApi
          .editTask({
            ...taskDetail,
          })
          .then(({ taskId }) => {
            setTaskDetail({ ...taskDetail, taskId });
            Toast.info({ content: getIn18Text('BAOCUNCHENGGONG') });
            hasUpdate.current = false;
          })
          .finally(() => {
            setSaving(false);
          });
      }
    }
    return Promise.resolve();
  };

  const handleStart = () => {
    if (taskDetail) {
      // 检查数据  个别模块会有隐藏/展示的逻辑，但是数据会有残留 在这里统一处理
      setTaskDetail(checkDetailData(taskDetail, true));
      if (!taskDetail.taskName) {
        return Toast.error({ content: getIn18Text('QINGSHURURENWUMINGCHENG') });
      }
      if (!taskDetail.taskObjectInfo.objectType) {
        return Toast.error({ content: getIn18Text('QINGXUANZEXUANDINGMUBIAO') });
      }
      const { triggerConditionList } = taskDetail.execAction.triggerConditionVo;
      if (!Array.isArray(triggerConditionList) || !triggerConditionList.length) {
        return Toast.error({ content: getIn18Text('QINGXUANZECHUFATIAOJIAN') });
      }
      if (!taskDetail.execAction.actionType) {
        return Toast.error({ content: getIn18Text('QINGXUANZEZHIXINGDONGZUO') });
      }
      const additionalInvalidIndex = taskDetail.additionalActionLayerList.findIndex(action => !action.truckAction.actionType);
      if (additionalInvalidIndex !== -1) {
        return Toast.error({ content: `请选择第${additionalInvalidIndex + 1}个追加动作` });
      }
      setStarting(true);
      autoMarketApi
        .editTask({
          ...taskDetail,
          taskStatus: AutoMarketOpenStatus.OPEN,
          template,
        })
        .then(() => {
          Toast.info({ content: getIn18Text('QIDONGCHENGGONG') });
          navigate('#edm?page=autoMarketTask');
        })
        .finally(() => {
          setStarting(false);
        });
      autoMarketTracker.startClick();
      handleDetailTracker(taskDetail);
    }
  };

  const handleDetailTracker = (taskDetail: AutoMarketTaskDetail) => {
    const objectTypeTrackerMap = {
      [AutoMarketTaskObjectType.CLUE]: 'clue',
      [AutoMarketTaskObjectType.CUSTOMER]: 'customer',
      [AutoMarketTaskObjectType.ADDRESS]: 'address',
      [AutoMarketTaskObjectType.EDM]: 'edm',
      [AutoMarketTaskObjectType.WEBSITE]: 'website',
      [AutoMarketTaskObjectType.UNI_CLUE]: 'uniClue',
    };
    const objectType = objectTypeTrackerMap[taskDetail.taskObjectInfo.objectType] || '';
    autoMarketTracker.objectTypeSubmit(objectType as any);
    const conditionTypeTrackerMap = {
      [AutoMarketTaskTriggerConditionType.NO]: 'Unconditional',
      [AutoMarketTaskTriggerConditionType.DATE]: 'Date',
      [AutoMarketTaskTriggerConditionType.EMAIL]: 'Mail behavior',
    };
    const condition = taskDetail.execAction.triggerConditionVo.triggerConditionList[0];
    const conditionType = conditionTypeTrackerMap[condition.conditionType as AutoMarketTaskTriggerConditionType] || '';
    autoMarketTracker.conditionTypeSubmit(conditionType as any);
    const actionTypeTrackerMap = {
      [AutoMarketTaskActionType.SEND_EDM]: 'sendmail',
      [AutoMarketTaskActionType.UPDATE_CLUE]: 'clue_Information',
      [AutoMarketTaskActionType.UPDATE_CUSTOMER]: 'customer_Information',
      [AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP]: 'address_Information',
    };
    const execActionType = actionTypeTrackerMap[taskDetail.execAction.actionType] || '';
    const additionalActionTypes = taskDetail.additionalActionLayerList.map(action => actionTypeTrackerMap[action.truckAction.actionType] || '');
    autoMarketTracker.actionTypeSubmit({
      execAction: execActionType,
      additionalAction: additionalActionTypes,
    });
  };

  /**
   * 过滤旧状态（在复制、编辑一个旧的任务时）
   * 比如 新获客 - 选择邮件行为 已经作废，需要过滤掉这个触发条件
   * 节日新增triggerTimes: string[]  兼容triggerTime
   * AI多文本不支持编辑，需要去掉
   */
  function filterOldSate(detail: AutoMarketTaskDetail): AutoMarketTaskDetail {
    if (qs?.taskType === AutoMarketTaskType.POTENTIAL_CONTACT) {
      if (detail?.execAction) {
        if (detail?.execAction?.triggerConditionVo?.triggerConditionList?.length) {
          detail.execAction.triggerConditionVo.triggerConditionList = detail?.execAction?.triggerConditionVo?.triggerConditionList.filter(triger => {
            return triger.conditionType !== AutoMarketTaskTriggerConditionType.EMAIL;
          });
        }
      }
    }
    if (detail?.taskType === AutoMarketTaskType.HOLIDAY_GREETING) {
      if (detail?.execAction) {
        if (detail?.execAction?.triggerConditionVo?.triggerConditionList?.length) {
          detail.execAction.triggerConditionVo.triggerConditionList = detail?.execAction?.triggerConditionVo?.triggerConditionList.map(triger => {
            if (triger.conditionType === AutoMarketTaskTriggerConditionType.DATE) {
              if (
                (triger.conditionContent as AutoMarketTaskTriggerCondition.DATE).triggerTime &&
                !(triger.conditionContent as AutoMarketTaskTriggerCondition.DATE).triggerTimes
              ) {
                (triger.conditionContent as AutoMarketTaskTriggerCondition.DATE).triggerTimes = [
                  (triger.conditionContent as AutoMarketTaskTriggerCondition.DATE).triggerTime,
                ];
              }
            }
            return triger;
          });
        }
      }
    }
    // if (detail.taskObjectInfo.objectType === AutoMarketTaskObjectType.CLUE) {
    //   detail.taskObjectInfo.objectType = AutoMarketTaskObjectType.UNI_CLUE;
    //   let objectContent = detail?.taskObjectInfo?.objectContent as AutoMarketTaskObjectContent.UNI_CLUE;
    //   if (Array.isArray(objectContent.clueStatus)) {
    //   }
    // }

    // 复制，编辑不支持回显AI多文本 需要去掉
    if (detail?.execAction?.actionContent?.sendEdmEmailAction) {
      detail.execAction.actionContent.sendEdmEmailAction.multipleContentInfo = null;
    }

    if (detail?.additionalActionLayerList?.length) {
      detail.additionalActionLayerList.forEach(actionLayer => {
        if (actionLayer?.truckAction?.actionContent?.sendEdmEmailAction) {
          actionLayer.truckAction.actionContent.sendEdmEmailAction.multipleContentInfo = null;
        }
      });
    }

    return detail;
  }

  /**
   * 个别模块会有隐藏/展示的逻辑，但是数据会有残留 在这里统一处理
   * @param detail
   * @returns
   */
  function checkDetailData(detail: AutoMarketTaskDetail, notCheckAddList?: boolean): AutoMarketTaskDetail {
    const objectType = taskDetail?.taskObjectInfo?.objectType;
    const execActionType = taskDetail?.execAction?.actionType;
    // taskType

    // 目标选择为营销邮件时，触发条件不展示邮件行为，要去掉
    if (objectType === AutoMarketTaskObjectType.ADDRESS) {
      if (detail?.execAction?.triggerConditionVo?.triggerConditionList) {
        detail.execAction.triggerConditionVo.triggerConditionList = detail.execAction.triggerConditionVo.triggerConditionList.filter(
          trigger => trigger.conditionType !== AutoMarketTaskTriggerConditionType.EMAIL
        );
      }
    }

    // 目标不是营销任务  则动作不展示分组管理
    if (objectType !== AutoMarketTaskObjectType.EDM) {
      // execAction
      if (detail?.execAction?.actionType === AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP) {
        detail.execAction.actionContent = {};
        // @ts-ignore
        detail.execAction.actionName = '';
        // @ts-ignore
        detail.execAction.actionType = '';
      }
    }

    if (objectType === AutoMarketTaskObjectType.EDM) {
      // 触发器里增加两个参数
      const objectContent = taskDetail?.taskObjectInfo?.objectContent as AutoMarketTaskObjectContent.Edm;
      if (detail?.execAction?.triggerConditionVo?.triggerConditionList?.length) {
        detail.execAction.triggerConditionVo.triggerConditionList.forEach(trigger => {
          if (trigger.conditionType === AutoMarketTaskTriggerConditionType.EMAIL && trigger.conditionContent) {
            (trigger.conditionContent as any) = {
              ...trigger.conditionContent,
              edmEmailId: objectContent?.edmEmailId,
              edmEmailSendTime: objectContent?.edmEmailSendTime,
            };
          }
        });
      }

      // 兼容数据主线路，分支 todo ?
      if (detail?.additionalActionLayerList?.length) {
        detail.additionalActionLayerList.forEach(action => {
          ['truckAction', 'branchAction'].forEach(key => {
            let addtion = action && action[key as 'truckAction' | 'branchAction'];
            if (addtion?.triggerConditionVo?.triggerConditionList?.length) {
              addtion.triggerConditionVo.triggerConditionList.forEach(trigger => {
                if (trigger.conditionType === AutoMarketTaskTriggerConditionType.EMAIL && trigger.conditionContent) {
                  (trigger.conditionContent as any) = {
                    ...trigger.conditionContent,
                    edmEmailId: objectContent?.edmEmailId,
                    edmEmailSendTime: objectContent?.edmEmailSendTime,
                  };
                }
              });
            }
          });
        });
      }
    }

    // 当执行动作选择为 分组管理 时，不展示附加动作
    if (execActionType === AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP) {
      detail.additionalActionLayerList = [];
    }

    // 当目标不是地址簿或固定名单时  附加动作不展示分组管理，需要去掉
    if (objectType !== AutoMarketTaskObjectType.ADDRESS && objectType !== AutoMarketTaskObjectType.EDM) {
      if (detail?.additionalActionLayerList) {
        detail.additionalActionLayerList = detail.additionalActionLayerList
          .filter(Action => Action.truckAction?.actionType !== AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP) //去掉主干
          .map(Action => {
            // 去掉分支
            let ActionItem = { ...Action };
            if (Action.branchAction?.actionType === AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP) {
              ActionItem.branchAction = null;
            }
            return ActionItem;
          });
        // .filter(additionalAction => additionalAction.actionType !== AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP);
      }
    }

    // HOLIDAY_GREETING 由于增加了节假日多选，所以repeat 统一修改为false
    if (detail?.taskType === AutoMarketTaskType.HOLIDAY_GREETING) {
      if (detail?.execAction) {
        if (detail?.execAction?.excludeConditionVo?.excludeConditionList?.length) {
          detail.execAction.excludeConditionVo.excludeConditionList = detail.execAction.excludeConditionVo.excludeConditionList.map(item => {
            if (item.conditionType === 'REPEAT') {
              item.conditionContent.repeat = false;
            }
            return item;
          });
        }
      }
    }
    if (Array.isArray(detail?.additionalActionLayerList) && !notCheckAddList) {
      detail.additionalActionLayerList = detail.additionalActionLayerList.filter(action => action?.truckAction?.actionType);
    }

    if (detail?.additionalActionList) {
      detail.additionalActionList = [];
    }
    return detail;
  }

  async function createInit() {
    if (!qs.taskType || !AutoMarketTaskType[qs.taskType as AutoMarketTaskType]) {
      Toast.error({ content: getIn18Text('CUOWUDERENWULEIXING') });
      return;
    }

    const initialTaskDetail = initialTaskDetailMap[qs.taskType as AutoMarketTaskType];
    const nextTaskDetail = cloneDeep(initialTaskDetail);
    try {
      const taskCreateInfo = JSON.parse(localStorage.getItem('task_create_info') as string);
      nextTaskDetail.taskName = taskCreateInfo?.taskName || '';
      nextTaskDetail.taskDesc = taskCreateInfo?.taskDesc || '';
      await initTaskObjectInfo(nextTaskDetail);
    } finally {
      localStorage.removeItem('task_create_info');
      setTaskType(qs.taskType as AutoMarketTaskType);
      setTaskDetail(nextTaskDetail);
    }
    console.log('xxx-init-task-detail', nextTaskDetail);
  }

  /**
   * 初始化目标 如果参数里有相关参数，需要初始化为对应的目标
   * @param taskDetail
   */
  async function initTaskObjectInfo(taskDetail: AutoMarketTaskDetail) {
    if (qs?.groupId) {
      // 如果带groupId 则默认选中
      taskDetail.taskObjectInfo.objectType = AutoMarketTaskObjectType.ADDRESS;
      taskDetail.taskObjectInfo.objectName = AutoMarketTaskObjectTypeName[AutoMarketTaskObjectType.ADDRESS];
      taskDetail.taskObjectInfo.objectContent = { groupIdList: [Number(qs.groupId)] };
    } else if (qs.edmEmailId) {
      const res = await edmApi.getSendBoxDetail({ edmEmailId: qs.edmEmailId });
      taskDetail.taskObjectInfo.objectType = AutoMarketTaskObjectType.EDM;
      taskDetail.taskObjectInfo.objectName = AutoMarketTaskObjectTypeName[AutoMarketTaskObjectType.EDM];
      taskDetail.taskObjectInfo.objectContent = {
        edmEmailId: res?.edmSendboxEmailInfo?.edmEmailId,
        edmTaskName: res?.edmSendboxEmailInfo?.edmSubject,
        edmSendTime: getEdmSendTime(res?.edmSendboxEmailInfo?.sendTime, res?.edmSendboxEmailInfo?.sendTimeZone),
        contactInfos: res?.receiverList,
      };
    } else if (qs.from === 'WEBSITE') {
      taskDetail.taskObjectInfo.objectName = AutoMarketTaskObjectTypeName.WEBSITE;
      taskDetail.taskObjectInfo.objectType = AutoMarketTaskObjectType.WEBSITE;
    }
    return taskDetail;
  }

  /**
   * 初始化目标 如果参数里有相关参数，需要初始化为对应的目标
   * @param taskDetail
   */
  async function initTaskObjectInfo(taskDetail: AutoMarketTaskDetail) {
    if (qs?.groupId) {
      // 如果带groupId 则默认选中
      taskDetail.taskObjectInfo.objectType = AutoMarketTaskObjectType.ADDRESS;
      taskDetail.taskObjectInfo.objectName = AutoMarketTaskObjectTypeName[AutoMarketTaskObjectType.ADDRESS];
      taskDetail.taskObjectInfo.objectContent = { groupIdList: [Number(qs.groupId)] };
    } else if (qs.edmEmailId) {
      const res = await edmApi.getSendBoxDetail({ edmEmailId: qs.edmEmailId });
      taskDetail.taskObjectInfo.objectType = AutoMarketTaskObjectType.EDM;
      taskDetail.taskObjectInfo.objectName = AutoMarketTaskObjectTypeName[AutoMarketTaskObjectType.EDM];
      taskDetail.taskObjectInfo.objectContent = {
        edmEmailId: res?.edmSendboxEmailInfo?.edmEmailId,
        edmTaskName: res?.edmSendboxEmailInfo?.edmSubject,
        edmSendTime: getEdmSendTime(res?.edmSendboxEmailInfo?.sendTime, res?.edmSendboxEmailInfo?.sendTimeZone),
        contactInfos: res?.receiverList,
      };
    } else if (qs.from === 'WEBSITE') {
      taskDetail.taskObjectInfo.objectName = AutoMarketTaskObjectTypeName.WEBSITE;
      taskDetail.taskObjectInfo.objectType = AutoMarketTaskObjectType.WEBSITE;
    }
    return taskDetail;
  }

  useEffect(() => {
    if (qs.taskId) {
      setFetching(true);
      autoMarketApi
        .getTaskDetail({ taskId: qs.taskId })
        .then(nextTaskDetail => {
          setTaskDetail(filterOldSate(nextTaskDetail));
          setTaskType(nextTaskDetail.taskType);
        })
        .finally(() => {
          setFetching(false);
        });
      return;
    }

    if (qs.copyTaskId) {
      setFetching(true);
      autoMarketApi
        .getTaskDetail({ taskId: qs.copyTaskId })
        .then(nextTaskDetail => {
          const { taskId, ...restTaskDetail } = nextTaskDetail;
          restTaskDetail.taskStatus = AutoMarketOpenStatus.NEW;
          if (qs.taskName) {
            // 从模版创建的情况
            restTaskDetail.taskName = qs.taskName || '';
            restTaskDetail.taskDesc = qs.taskDesc || '';
            restTaskDetail.taskObjectInfo = {
              objectType: '' as unknown as AutoMarketTaskObjectType,
              objectName: '' as unknown as AutoMarketTaskObjectTypeName,
              objectContent: {} as AutoMarketTaskObjectContent.Clue,
            };
          }
          setTaskType(restTaskDetail.taskType);
          return initTaskObjectInfo(restTaskDetail).then(() => {
            setTaskDetail(filterOldSate(restTaskDetail));
          });
        })
        .finally(() => {
          setFetching(false);
        });
      return;
    }

    // 新建任务初始化
    createInit();
  }, [qs.taskId, qs.taskType]);

  const showSaveAsTemplate = useMemo(() => {
    if (taskType === AutoMarketTaskType.PREVIOUS_CONTACT) {
      setTemplate(false);
      return false;
    }
    return true;
  }, [taskType]);

  if (fetching) {
    return (
      <PermissionWrapper>
        <div className={style.taskEdit}>
          <div className={style.pageLoading}>
            <Spin tip={getIn18Text('ZHENGZAIJIAZAIZHONG...')} indicator={<LoadingIcon />} />
          </div>
        </div>
      </PermissionWrapper>
    );
  }

  return (
    <PermissionWrapper>
      <edmWriteContext.Provider value={{ value: { state, dispatch } }}>
        <div className={style.taskEdit}>
          <div className={style.header}>
            <div className={style.nameWrapper}>
              <ArrowLeft
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  if (hasUpdate.current) {
                    setCancelTaskModalVisible(true);
                  } else {
                    navigate('#edm?page=autoMarketTask');
                  }
                  autoMarketTracker.cancelClick();
                }}
              ></ArrowLeft>
              {taskType && taskDetail && (
                <>
                  <div className={style.taskName} onClick={() => setTaskCreateModalVisible(true)}>
                    {taskDetail.taskName?.trim() ? taskDetail.taskName : getIn18Text('QINGSHURURENWUMINGCHENG')}
                    {template ? (
                      <span style={{ marginLeft: 10 }}>
                        <Badge colorType="blue2" text={getTransText('AutoMarketTemplate')} />
                      </span>
                    ) : (
                      ''
                    )}
                    <EditIcon style={{ marginLeft: 8 }}></EditIcon>
                  </div>
                  {/* <div className={style.taskDesc} onClick={() => setTaskCreateModalVisible(true)}>
              {taskDetail.taskDesc?.trim()
                ? taskDetail.taskDesc
                : (getIn18Text("QINGSHURURENWUMIAOSHU"))}
            </div> */}
                </>
              )}
            </div>
            {taskDetail?.taskDesc?.trim() ? (
              <div className={style.taskDesc} onClick={() => setTaskCreateModalVisible(true)}>
                {taskDetail.taskDesc}
              </div>
            ) : (
              ''
            )}
          </div>
          <div className={style.body}>
            <div
              className={classNames(style.bodyContent, {
                [style.bodyContentOpen]: step,
              })}
            >
              {taskType && taskDetail && (
                <>
                  <Step index={1} name={getIn18Text('XUANDINGMUBIAO')} active={step === 'OBJECT'}>
                    <Panel
                      name={getIn18Text('XUANDINGMUBIAO')}
                      desc={getIn18Text('QINGXUANZEGAIRENWUDUIYINGDEMUBIAODUIXIANG')}
                      options={taskDetailLayoutMap[taskType].objectTypes.map(objectType => ({
                        icon: objectType.icon,
                        name: AutoMarketTaskObjectTypeName[objectType.type],
                        value: objectType.type,
                        infos:
                          taskDetail.taskObjectInfo.objectType === objectType.type ||
                          (objectType.type === AutoMarketTaskObjectType.CUSTOMER && taskDetail.taskObjectInfo.objectType === AutoMarketTaskObjectType.WEBSITE)
                            ? getTaskObjectPanelInfo(taskDetail, { clueStatuses, uniClueStatuses })
                            : [],
                        active:
                          (step === 'OBJECT' && option === objectType.type) ||
                          (objectType.type === AutoMarketTaskObjectType.CUSTOMER && taskDetail.taskObjectInfo.objectType === AutoMarketTaskObjectType.WEBSITE),
                      }))}
                      onOptionClick={value => {
                        setStep('OBJECT');
                        setOption(value as AutoMarketTaskObjectType);
                      }}
                    />
                  </Step>
                  <Step index={2} name={getIn18Text('CHUFATIAOJIAN')} active={step === 'TRIGGER_CONDITION'}>
                    <Panel
                      name={getIn18Text('CHUFATIAOJIAN')}
                      desc={getIn18Text('QINGXUANZEZIDONGHUARENWUSHIFOUCHUFASHIDEPANDUANTIAOJIAN')}
                      options={taskDetailLayoutMap[taskType].triggerConditionTypes
                        .filter(triggerCondition => {
                          const objectType = taskDetail?.taskObjectInfo?.objectType;
                          if (triggerCondition.type === AutoMarketTaskTriggerConditionType.EMAIL) {
                            // 目标选 营销地址簿或未选择 不展示此项
                            if (objectType === AutoMarketTaskObjectType.ADDRESS || !objectType) {
                              return false;
                            }
                          }
                          return true;
                        })
                        .map(triggerConditionType => ({
                          icon: triggerConditionType.icon,
                          name: AutoMarketTaskTriggerConditionTypeName[triggerConditionType.type],
                          value: triggerConditionType.type,
                          infos:
                            taskDetail.execAction.triggerConditionVo.triggerConditionList[0]?.conditionType === triggerConditionType.type
                              ? getTaskTriggerConditionInfo(taskDetail)
                              : [],
                          active: step === 'TRIGGER_CONDITION' && option === triggerConditionType.type,
                        }))}
                      onChange={value => {
                        if (value === AutoMarketTaskTriggerConditionType.NO) {
                          const nextTaskDetail = { ...taskDetail };
                          const triggerCondition = {
                            conditionType: AutoMarketTaskTriggerConditionType.NO,
                            conditionContent: FORM_INITIAL_VALUE.noCondition,
                          };
                          nextTaskDetail.execAction.triggerConditionVo.triggerConditionList[0] = triggerCondition;
                          setTaskDetail(nextTaskDetail);
                          Toast.info({ content: getIn18Text('WUCHUFATIAOJIAN') });
                        }
                      }}
                      onOptionClick={value => {
                        if (value !== AutoMarketTaskTriggerConditionType.NO) {
                          setStep('TRIGGER_CONDITION');
                          setOption(value as AutoMarketTaskTriggerConditionType);
                        }
                      }}
                    />
                  </Step>
                  <Step
                    index={3}
                    name={getIn18Text('ZHIXINGDONGZUO')}
                    active={step === 'EXEC_ACTION'}
                    isLast={taskDetail.additionalActionLayerList?.length === 0 || taskDetail?.execAction?.actionType === AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP}
                  >
                    <Panel
                      name={getIn18Text('ZHIXINGDONGZUO')}
                      desc={getIn18Text('QINGXUANZEZIDONGHUATIAOJIANSHENGXIAOSHI\uFF0CCHUFADEDONGZUO')}
                      options={taskDetailLayoutMap[taskType].execActionTypes
                        .filter(execAction => {
                          const objectType = taskDetail?.taskObjectInfo?.objectType;
                          if (execAction.type === AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP) {
                            // 目标不是营销任务 不展示此项
                            if (objectType !== AutoMarketTaskObjectType.EDM) {
                              return false;
                            }
                          }
                          return true;
                        })
                        .map(actionType => ({
                          icon: actionType.icon,
                          name: AutoMarketTaskActionTypeName[actionType.type],
                          value: actionType.type,
                          infos: taskDetail.execAction.actionType === actionType.type ? getTaskExecActionInfo(taskDetail) : [],
                          active: step === 'EXEC_ACTION' && option === actionType.type,
                          hasAIContent:
                            actionType.type === AutoMarketTaskActionType.SEND_EDM
                              ? Boolean(taskDetail?.execAction?.actionContent?.sendEdmEmailAction?.multipleContentInfo)
                              : false,
                        }))}
                      onOptionClick={value => {
                        setStep('EXEC_ACTION');
                        setOption(value as AutoMarketTaskActionType);
                      }}
                    />
                  </Step>
                  {taskDetail?.execAction?.actionType !== AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP
                    ? (taskDetail.additionalActionLayerList || []).map((currentAdditionalAction, index) => {
                        // 主分支
                        let truckActionType = currentAdditionalAction?.truckAction?.actionType;
                        let branchActionType = currentAdditionalAction?.branchAction?.actionType;
                        // 追加动作 邮件营销 + 更新客户信息
                        if (truckActionType || taskType === AutoMarketTaskType.PREVIOUS_CONTACT) {
                          return (
                            <Step
                              index={3 + index + 1}
                              name={getIn18Text('ZHUIJIADONGZUO')}
                              active={step === 'ADDITIONAL_ACTION' && additionalIndex === index}
                              isLast={taskDetail.additionalActionLayerList.length === index + 1}
                              isDash={!taskDetail.additionalActionLayerList[index + 1]?.truckAction?.actionType}
                            >
                              <div className={style.taskEditBranchWrap}>
                                <img className={style.vertical} src={vertical} alt="line" />
                                {branchActionType ? <img className={style.horizontal} src={horizontal} alt="line" /> : null}
                                <Panel
                                  name={getTaskAdditionalActionPanelInfo(currentAdditionalAction, 'truck').name}
                                  desc={getTaskAdditionalActionPanelInfo(currentAdditionalAction, 'truck').desc}
                                  deletable
                                  options={taskDetailLayoutMap[taskType].additionalActionTypes
                                    .filter(actionType => {
                                      if (actionType.type !== AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP) {
                                        return true;
                                      }
                                      const objectType = taskDetail?.taskObjectInfo?.objectType;
                                      const execAction = taskDetail?.execAction?.actionType;
                                      const additionalAction = taskDetail?.additionalActionLayerList || [];
                                      if (
                                        (objectType !== AutoMarketTaskObjectType.ADDRESS && objectType !== AutoMarketTaskObjectType.EDM) ||
                                        execAction === AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP ||
                                        additionalAction.some((addition, additonIndex) => {
                                          return additonIndex !== index && addition?.truckAction?.actionType === AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP;
                                        })
                                      ) {
                                        return false;
                                      }
                                      return true;
                                    })
                                    .map(actionType => ({
                                      icon: actionType.icon,
                                      name: AutoMarketTaskActionTypeName[actionType.type],
                                      hasQuote:
                                        actionType.type === AutoMarketTaskActionType.SEND_EDM
                                          ? currentAdditionalAction?.truckAction?.actionContent?.sendEdmEmailAction?.replyEdmEmail
                                          : '',
                                      hasAIContent:
                                        actionType.type === AutoMarketTaskActionType.SEND_EDM
                                          ? Boolean(currentAdditionalAction?.truckAction?.actionContent?.sendEdmEmailAction?.multipleContentInfo)
                                          : false,
                                      value: actionType.type,
                                      infos: getTaskAdditionalActionInfo(taskDetail, 'truckAction', {
                                        additionalIndex: index,
                                        updateCustomerFields,
                                        optionType: actionType.type,
                                      }),
                                      active: step === 'ADDITIONAL_ACTION' && option === actionType.type,
                                    }))}
                                  onOptionClick={value => {
                                    setStep('ADDITIONAL_ACTION');
                                    setAdditionalIndex(index);
                                    setOption(value as AutoMarketTaskActionType);
                                  }}
                                  onDelete={() => handleAdditionalActionDelete(index, true, !!branchActionType)}
                                />
                                {branchActionType ? (
                                  <Panel
                                    name={getTaskAdditionalActionPanelInfo(currentAdditionalAction, 'branch').name}
                                    desc={getTaskAdditionalActionPanelInfo(currentAdditionalAction, 'branch').desc}
                                    deletable
                                    options={taskDetailLayoutMap[taskType].additionalBranchActionTypes.map(actionType => ({
                                      icon: actionType.icon,
                                      name: AutoMarketTaskActionTypeName[actionType.type],
                                      value: actionType.type,
                                      infos: getTaskAdditionalActionInfo(taskDetail, 'branchAction', {
                                        additionalIndex: index,
                                        updateCustomerFields,
                                        optionType: actionType.type,
                                      }),
                                      active: step === 'ADDITIONAL_ACTION' && option === actionType.type,
                                    }))}
                                    onOptionClick={value => {
                                      setStep('ADDITIONAL_ACTION');
                                      setAdditionalIndex(index);
                                      setOption(value as AutoMarketTaskActionType);
                                    }}
                                    onDelete={() => handleAdditionalActionDelete(index)}
                                    hasEndIcon={true}
                                  />
                                ) : null}
                              </div>
                            </Step>
                          );
                        } else {
                          return (
                            <>
                              {/* 模拟样式 */}
                              <div className={style.addAdditionWrap}>
                                <div
                                  className={style.addAdditionalActionTrigger}
                                  onClick={() => {
                                    setStep('ADDITIONAL_ACTION');
                                    setAdditionalIndex(index);
                                    setOption(AutoMarketTaskActionType.SEND_EDM as AutoMarketTaskActionType);
                                  }}
                                >
                                  <div className={style.handleTitle}>
                                    {' '}
                                    {getTransText('ZHUIJIADONGZUO')}
                                    <img
                                      src={DeleteIcon}
                                      onClick={e => {
                                        handleAdditionalActionDelete(index, true, false);
                                        e.stopPropagation();
                                      }}
                                      className={style.handleTitleIcon}
                                      alt="delete"
                                    />
                                  </div>
                                  <div className={style.handleContent}> {`+ ${getTransText('SHEZHIZHUIJIADONGZUO')}`} </div>
                                </div>
                                <div className={style.dashedLine}></div>
                              </div>
                            </>
                          );
                        }
                      })
                    : ''}
                  {additionalActionAddable && (
                    <div className={style.addAdditionalAction}>
                      <div className={style.addAdditionalActionTrigger} onClick={addAdditionAction}>
                        {`+ ${getTransText('ZHUIJIADONGZUO')}`}
                      </div>
                      {/* <div className={style.dashedLine} /> */}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {taskType && taskDetail && (
            <>
              <EdmEmailPicker
                visible={step === 'OBJECT' && option === AutoMarketTaskObjectType.EDM}
                values={taskDetail.taskObjectInfo.objectType === AutoMarketTaskObjectType.EDM ? taskDetail.taskObjectInfo.objectContent : FORM_INITIAL_VALUE.edmPicker}
                resetValues={FORM_INITIAL_VALUE.edmPicker}
                onSave={values => {
                  const nextTaskDetail = { ...taskDetail };
                  nextTaskDetail.taskObjectInfo.objectType = AutoMarketTaskObjectType.EDM;
                  nextTaskDetail.taskObjectInfo.objectName = AutoMarketTaskObjectTypeName[AutoMarketTaskObjectType.EDM];
                  nextTaskDetail.taskObjectInfo.objectContent = values;
                  setTaskDetail(nextTaskDetail);
                  handleDrawerClose();
                }}
                onClose={handleDrawerClose}
              />

              <AddressGroupContactPicker
                visible={step === 'OBJECT' && option === AutoMarketTaskObjectType.ADDRESS && taskType === AutoMarketTaskType.FIXED_CONTACT}
                values={
                  taskDetail.taskObjectInfo.objectType === AutoMarketTaskObjectType.ADDRESS ? taskDetail.taskObjectInfo.objectContent : FORM_INITIAL_VALUE.addressPicker
                }
                resetValues={FORM_INITIAL_VALUE.addressPicker}
                onSave={values => {
                  const nextTaskDetail = { ...taskDetail };
                  nextTaskDetail.taskObjectInfo.objectType = AutoMarketTaskObjectType.ADDRESS;
                  nextTaskDetail.taskObjectInfo.objectName = AutoMarketTaskObjectTypeName[AutoMarketTaskObjectType.ADDRESS];
                  nextTaskDetail.taskObjectInfo.objectContent = {
                    ...values,
                    addressType: 1,
                  };
                  setTaskDetail(nextTaskDetail);
                  handleDrawerClose();
                }}
                onClose={handleDrawerClose}
              />

              <AddressPicker
                visible={step === 'OBJECT' && option === AutoMarketTaskObjectType.ADDRESS && taskType !== AutoMarketTaskType.FIXED_CONTACT}
                values={
                  taskDetail.taskObjectInfo.objectType === AutoMarketTaskObjectType.ADDRESS ? taskDetail.taskObjectInfo.objectContent : FORM_INITIAL_VALUE.addressPicker
                }
                resetValues={FORM_INITIAL_VALUE.addressPicker}
                onSave={values => {
                  const nextTaskDetail = { ...taskDetail };
                  nextTaskDetail.taskObjectInfo.objectType = AutoMarketTaskObjectType.ADDRESS;
                  nextTaskDetail.taskObjectInfo.objectName = AutoMarketTaskObjectTypeName[AutoMarketTaskObjectType.ADDRESS];
                  nextTaskDetail.taskObjectInfo.objectContent = {
                    ...values,
                    addressType: 0,
                    contactInfos: [],
                  };
                  setTaskDetail(nextTaskDetail);
                  handleDrawerClose();
                }}
                onClose={handleDrawerClose}
              />
              <CustomerPicker
                visible={step === 'OBJECT' && (option === AutoMarketTaskObjectType.CUSTOMER || option === AutoMarketTaskObjectType.WEBSITE)}
                values={
                  taskDetail.taskObjectInfo.objectType === AutoMarketTaskObjectType.CUSTOMER || taskDetail.taskObjectInfo.objectType === AutoMarketTaskObjectType.WEBSITE
                    ? taskDetail.taskObjectInfo.objectContent
                    : FORM_INITIAL_VALUE.customerPicker
                }
                objectType={taskDetail.taskObjectInfo.objectType}
                resetValues={FORM_INITIAL_VALUE.customerPicker}
                onSave={(values, objectType) => {
                  const nextTaskDetail = { ...taskDetail };
                  setOption(objectType);
                  nextTaskDetail.taskObjectInfo.objectType =
                    objectType === AutoMarketTaskObjectType.CUSTOMER ? AutoMarketTaskObjectType.CUSTOMER : AutoMarketTaskObjectType.WEBSITE;
                  nextTaskDetail.taskObjectInfo.objectName =
                    AutoMarketTaskObjectTypeName[objectType === AutoMarketTaskObjectType.CUSTOMER ? AutoMarketTaskObjectType.CUSTOMER : AutoMarketTaskObjectType.WEBSITE];
                  nextTaskDetail.taskObjectInfo.objectContent = {
                    ...nextTaskDetail.taskObjectInfo.objectContent,
                    ...values,
                  };
                  setTaskDetail(nextTaskDetail);
                  handleDrawerClose();
                }}
                onClose={handleDrawerClose}
              />
              <CluePicker
                visible={step === 'OBJECT' && option === AutoMarketTaskObjectType.UNI_CLUE}
                values={
                  taskDetail.taskObjectInfo.objectType === AutoMarketTaskObjectType.UNI_CLUE ? taskDetail.taskObjectInfo.objectContent : FORM_INITIAL_VALUE.cluePicker
                }
                resetValues={FORM_INITIAL_VALUE.cluePicker}
                clueStatuses={uniClueStatuses}
                onSave={values => {
                  const nextTaskDetail = { ...taskDetail };
                  nextTaskDetail.taskObjectInfo.objectType = AutoMarketTaskObjectType.UNI_CLUE;
                  nextTaskDetail.taskObjectInfo.objectName = AutoMarketTaskObjectTypeName[AutoMarketTaskObjectType.UNI_CLUE];
                  nextTaskDetail.taskObjectInfo.objectContent = {
                    ...nextTaskDetail.taskObjectInfo.objectContent,
                    ...values,
                  };
                  setTaskDetail(nextTaskDetail);
                  handleDrawerClose();
                }}
                onClose={handleDrawerClose}
              />
              <DateCondition
                visible={step === 'TRIGGER_CONDITION' && option === AutoMarketTaskTriggerConditionType.DATE}
                values={
                  taskDetail.execAction.triggerConditionVo.triggerConditionList[0]?.conditionType === AutoMarketTaskTriggerConditionType.DATE
                    ? (taskDetail.execAction.triggerConditionVo.triggerConditionList[0]?.conditionContent as AutoMarketTaskTriggerCondition.DATE)
                    : FORM_INITIAL_VALUE.dateCondition
                }
                resetValues={FORM_INITIAL_VALUE.dateCondition}
                onSave={values => {
                  const nextTaskDetail = { ...taskDetail };
                  const triggerCondition = {
                    conditionType: AutoMarketTaskTriggerConditionType.DATE,
                    conditionContent: {
                      ...FORM_INITIAL_VALUE.dateCondition,
                      ...values,
                    },
                  };
                  nextTaskDetail.execAction.triggerConditionVo.triggerConditionList[0] = triggerCondition;
                  setTaskDetail(nextTaskDetail);
                  handleDrawerClose();
                }}
                onClose={handleDrawerClose}
              />
              <EmailCondition
                taskDetail={taskDetail}
                visible={step === 'TRIGGER_CONDITION' && option === AutoMarketTaskTriggerConditionType.EMAIL}
                values={
                  taskDetail.execAction.triggerConditionVo.triggerConditionList[0]?.conditionType === AutoMarketTaskTriggerConditionType.EMAIL
                    ? (taskDetail.execAction.triggerConditionVo.triggerConditionList[0]?.conditionContent as AutoMarketTaskTriggerCondition.EMAIL)
                    : FORM_INITIAL_VALUE.emailCondition
                }
                resetValues={FORM_INITIAL_VALUE.emailCondition}
                onSave={values => {
                  const nextTaskDetail = { ...taskDetail };
                  const triggerCondition = {
                    conditionType: AutoMarketTaskTriggerConditionType.EMAIL,
                    conditionContent: {
                      ...FORM_INITIAL_VALUE.emailCondition,
                      ...values,
                    },
                  };
                  nextTaskDetail.execAction.triggerConditionVo.triggerConditionList[0] = triggerCondition;
                  setTaskDetail(nextTaskDetail);
                  handleDrawerClose();
                }}
                onClose={handleDrawerClose}
              />
              <EdmSetting
                visible={step === 'EXEC_ACTION' && option === AutoMarketTaskActionType.SEND_EDM}
                values={
                  taskDetail.execAction.actionType === AutoMarketTaskActionType.SEND_EDM
                    ? (taskDetail.execAction.actionContent?.sendEdmEmailAction as AutoMarketTaskActionContent.SEND_EDM)
                    : FORM_INITIAL_VALUE.edmSetting
                }
                resetValues={FORM_INITIAL_VALUE.edmSetting}
                qs={qs}
                onSave={values => {
                  const nextTaskDetail = { ...taskDetail };
                  nextTaskDetail.execAction = {
                    ...nextTaskDetail.execAction,
                    actionType: AutoMarketTaskActionType.SEND_EDM,
                    actionName: AutoMarketTaskActionTypeName[AutoMarketTaskActionType.SEND_EDM],
                    actionContent: {
                      sendEdmEmailAction: values,
                    },
                  };
                  setTaskDetail(nextTaskDetail);
                  handleDrawerClose();
                }}
                onClose={handleDrawerClose}
                taskDetail={taskDetail}
              />

              <AdditionalGroupSetting
                // key={+new Date()}
                taskDetail={taskDetail}
                noTrigger={true}
                visible={step === 'EXEC_ACTION' && option === AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP}
                values={
                  taskDetail.execAction.actionType === AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP ? taskDetail.execAction : FORM_INITIAL_VALUE.additionalGroupSetting
                }
                resetValues={FORM_INITIAL_VALUE.additionalGroupSetting}
                onSave={values => {
                  const nextTaskDetail = { ...taskDetail };
                  nextTaskDetail.execAction = {
                    ...nextTaskDetail.execAction,
                    actionType: AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP,
                    actionName: AutoMarketTaskActionTypeName[AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP],
                    actionContent: values?.actionContent || {},
                  };
                  setTaskDetail(nextTaskDetail);
                  handleDrawerClose();
                }}
                onClose={handleDrawerClose}
              />

              {(taskDetail.additionalActionLayerList || []).map((item, index) => (
                <>
                  <UpdateCustomer
                    taskDetail={taskDetail}
                    key={index}
                    visible={step === 'ADDITIONAL_ACTION' && option === AutoMarketTaskActionType.UPDATE_CUSTOMER && additionalIndex === index}
                    values={item?.truckAction?.actionType === AutoMarketTaskActionType.UPDATE_CUSTOMER ? item.truckAction : FORM_INITIAL_VALUE.updateCustomer}
                    resetValues={FORM_INITIAL_VALUE.updateCustomer}
                    updateFields={updateCustomerFields}
                    onSave={values => {
                      const nextTaskDetail = { ...taskDetail };
                      nextTaskDetail.additionalActionLayerList[index] = {
                        truckAction: {
                          ...values,
                          actionType: AutoMarketTaskActionType.UPDATE_CUSTOMER,
                          actionName: AutoMarketTaskActionTypeName[AutoMarketTaskActionType.UPDATE_CUSTOMER],
                        },
                        branchAction: null,
                      };
                      setTaskDetail(nextTaskDetail);
                      handleDrawerClose();
                    }}
                    onClose={handleDrawerClose}
                  />
                  <AdditionalEdmSettingNew
                    taskDetail={taskDetail}
                    key={index}
                    qs={qs}
                    visible={
                      step === 'ADDITIONAL_ACTION' &&
                      (option === AutoMarketTaskActionType.SEND_EDM || option === AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP) &&
                      additionalIndex === index
                    }
                    values={
                      item?.truckAction?.actionType === AutoMarketTaskActionType.SEND_EDM ||
                      item?.truckAction?.actionType === AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP
                        ? item
                        : FORM_INITIAL_VALUE.additionalEdmAndGroupSetting
                    }
                    resetValues={FORM_INITIAL_VALUE.additionalEdmAndGroupSetting}
                    currentItem={item}
                    onSave={values => {
                      if (values.truckAction.actionType) {
                        const nextTaskDetail = { ...taskDetail };
                        nextTaskDetail.additionalActionLayerList[index] = {
                          ...values,
                          // actionType: values.actionType,
                          // actionName: AutoMarketTaskActionTypeName[values.actionType],
                        };
                        console.log('xxx-save-data', nextTaskDetail);
                        setTaskDetail(nextTaskDetail);
                      }
                      handleDrawerClose();
                    }}
                    onClose={handleDrawerClose}
                  />
                </>
              ))}
            </>
          )}
          <TaskCreateModal
            title={getIn18Text('XIUGAIRENWU')}
            visible={taskCreateModalVisible}
            initialValue={
              taskDetail
                ? {
                    taskName: taskDetail.taskName,
                    taskDesc: taskDetail.taskDesc,
                  }
                : undefined
            }
            onCancel={() => {
              setTaskCreateModalVisible(false);
            }}
            onOk={(payload: any) => {
              setTaskDetail({ ...taskDetail, ...payload });
              setTaskCreateModalVisible(false);
            }}
          />
          <div className={style.footer}>
            {/* <Button onClick={() => {
            if (hasUpdate.current) {
              setCancelTaskModalVisible(true);
            }
            else {
              navigate('#edm?page=autoMarketTask');
            }
            autoMarketTracker.cancelClick();
          }}>{getIn18Text("FANHUI")}</Button> */}
            {showSaveAsTemplate && (
              <Checkbox className={style.templateCheck} checked={template} onChange={({ target: { checked } }) => setTemplate(checked)}>
                {getTransText('SetAutoMarketTemplate')}
                <Tooltip title={getTransText('SetAutoMarketTemplateTip')}>
                  <QuestionCircleOutlined style={{ marginLeft: 6, color: '#272E47' }} />
                </Tooltip>
              </Checkbox>
            )}
            <Button loading={saving} disabled={starting} onClick={handleSave}>
              {getIn18Text('BAOCUN')}
            </Button>
            <Button type="primary" loading={starting} disabled={saving} onClick={handleStart}>
              {getIn18Text('QIDONG')}
            </Button>
          </div>
          <Modal className={style.cancelTaskModal} width={400} visible={cancelTaskModalVisible} closable={false} footer={null}>
            <div className={style.cancelTaskModalHeader}>
              <WarnIcon className={style.cancelTaskModalHeaderIcon} />
              {getIn18Text('SHIFOUBAOCUNRENWU?')}
            </div>
            <div className={style.cancelTaskModalBody}>{getIn18Text('BUBAOCUNJIANGDIUSHIGENGGAINEIRONG')}</div>
            <div className={style.cancelTaskModalFooter}>
              <Button onClick={() => setCancelTaskModalVisible(false)}>{getIn18Text('QUXIAO')}</Button>
              <Button onClick={() => navigate('#edm?page=autoMarketTask')}>{getIn18Text('BUBAOCUN')}</Button>
              <Button
                type="primary"
                loading={saving}
                onClick={() => {
                  handleSave().then(() => {
                    navigate('#edm?page=autoMarketTask');
                  });
                }}
              >
                {getIn18Text('BAOCUN')}
              </Button>
            </div>
          </Modal>
          <div id="edm-write-root" />
        </div>
      </edmWriteContext.Provider>
    </PermissionWrapper>
  );
};
export default TaskEdit;
