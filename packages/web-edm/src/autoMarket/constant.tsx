import React from 'react';
import {
  apiHolder,
  EdmSendBoxApi,
  apis,
  AutoMarketTaskType,
  AutoMarketTaskDetail,
  AutoMarketOpenStatus,
  AutoMarketTaskObjectType,
  AutoMarketTaskObjectTypeName,
  AutoMarketTaskObjectContent,
  AutoMarketTaskAction,
  AutoMarketTaskActionContent,
  AutoMarketTaskActionType,
  AutoMarketTaskActionTypeName,
  AutoMarketTaskTriggerConditionType,
  AutoMarketTaskTriggerConditionTypeName,
  AutoMarketTaskExcludeConditionType,
  AutoMarketTaskExcludeConditionTypeName,
  AutoMarketCustomerTagOpType,
  AutoMarketContactType,
  AutoMarketContactTypeName,
  AutoMarketTaskTriggerCondition,
  AutoMarketEmailOpType,
  AutoMarketEmailOpTypeName,
  AutoMarketObjectEmailType,
  AutoMarketCustomerUpdateField,
  AutoMarketTaskTruckAction,
} from 'api';
import CustomerIcon from '@/images/icons/edm/autoMarket/customer.svg';
import ClueIcon from '@/images/icons/edm/autoMarket/clue.svg';
import DateIcon from '@/images/icons/edm/autoMarket/date.svg';
import EmailIcon from '@/images/icons/edm/autoMarket/email.svg';
import EdmIcon from '@/images/icons/edm/autoMarket/edmObj.svg';
import AddressBookIcon from '@/images/icons/edm/autoMarket/addressbook.svg';
import { timeZoneMap, getWeekdayWithTimeZoneOffset } from '@web-common/utils/constant';
import { AddressRuleDetail } from './components/addressRuleDetail';
import { getPlainTextFromHtml } from '../utils';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';

interface LabelType {
  label: string;
  value: string | number;
}
export const FORM_INITIAL_VALUE = {
  edmPicker: {},
  addressPicker: {
    groupIdList: [],
    importIdList: [],
  },
  customerPicker: {
    customerTagOpType: AutoMarketCustomerTagOpType.SOME,
    customerTags: [],
    continent: undefined,
    country: undefined,
    contactType: AutoMarketContactType.MAIN,
  },
  cluePicker: {
    // recentlyRelationEmailDays: undefined,
    // recentlyRelationEmailType: undefined,
    // clueStatus: [],
    // clueSources: [],
    followStatus: [],
    continent: undefined,
    country: undefined,
  },
  noCondition: {
    conditionName: AutoMarketTaskTriggerConditionTypeName[AutoMarketTaskTriggerConditionType.NO],
  },
  dateCondition: {
    conditionName: AutoMarketTaskTriggerConditionTypeName[AutoMarketTaskTriggerConditionType.DATE],
    triggerTime: '',
    triggerTimes: [],
    periodicityType: 0,
  },
  emailCondition: {
    conditionName: AutoMarketTaskTriggerConditionTypeName[AutoMarketTaskTriggerConditionType.EMAIL],
    emailOpDays: undefined as unknown as number,
    emailOpType: undefined as unknown as AutoMarketEmailOpType,
    objectEmailType: AutoMarketObjectEmailType.EDM,
  },
  edmSetting: {
    edmEmailSubjects: [''],
    edmEmailSender: '',
    replyEmail: '',
    emailContent: '',
    emailAttachment: '',
  },
  updateCustomer: {
    triggerConditionVo: {
      triggerConditionList: [
        {
          conditionType: AutoMarketTaskTriggerConditionType.EMAIL,
          conditionContent: {
            conditionName: AutoMarketTaskTriggerConditionTypeName.EMAIL,
            emailOpDays: undefined,
            emailOpType: undefined,
            objectEmailType: AutoMarketObjectEmailType.AUTO_MARKET,
          },
        },
      ],
    },
    actionName: AutoMarketTaskActionTypeName[AutoMarketTaskActionType.UPDATE_CUSTOMER],
    actionType: AutoMarketTaskActionType.UPDATE_CUSTOMER,
    actionContent: {
      updateCustomerInfoActionList: [],
    },
    excludeConditionVo: {
      excludeConditionList: [
        {
          conditionType: AutoMarketTaskExcludeConditionType.EDM,
          conditionContent: {
            conditionName: AutoMarketTaskExcludeConditionTypeName.EDM,
            inBlacklist: true,
            inUnsubscribeList: true,
            invalidList: true,
          },
        },
        {
          conditionType: AutoMarketTaskExcludeConditionType.REPEAT,
          conditionContent: {
            conditionName: AutoMarketTaskExcludeConditionTypeName.REPEAT,
            repeat: true,
          },
        },
      ],
    },
  },
  additionalEdmSetting: {
    triggerConditionVo: {
      triggerConditionList: [
        {
          conditionType: AutoMarketTaskTriggerConditionType.EMAIL,
          conditionContent: {
            conditionName: AutoMarketTaskTriggerConditionTypeName.EMAIL,
            emailOpDays: undefined,
            emailOpType: undefined,
            objectEmailType: AutoMarketObjectEmailType.AUTO_MARKET,
          },
        },
      ],
    },
    actionName: AutoMarketTaskActionTypeName[AutoMarketTaskActionType.SEND_EDM],
    actionType: AutoMarketTaskActionType.SEND_EDM,
    actionContent: {
      sendEdmEmailAction: {
        edmEmailSubjects: [''],
        edmEmailSender: '',
        replyEmail: '',
        emailContent: '',
        emailAttachment: '',
        // senderEmail: '',
      },
    },
    excludeConditionVo: {
      excludeConditionList: [
        {
          conditionType: AutoMarketTaskExcludeConditionType.EDM,
          conditionContent: {
            conditionName: AutoMarketTaskExcludeConditionTypeName.EDM,
            inBlacklist: true,
            inUnsubscribeList: true,
            invalidList: true,
          },
        },
        {
          conditionType: AutoMarketTaskExcludeConditionType.REPEAT,
          conditionContent: {
            conditionName: AutoMarketTaskExcludeConditionTypeName.REPEAT,
            repeat: true,
          },
        },
      ],
    },
  },
  additionalEdmAndGroupSetting: {
    truckAction: {
      triggerConditionVo: {
        triggerConditionList: [
          {
            conditionType: AutoMarketTaskTriggerConditionType.EMAIL,
            conditionContent: {
              conditionName: AutoMarketTaskTriggerConditionTypeName.EMAIL,
              emailOpDays: undefined,
              emailOpType: undefined,
              objectEmailType: AutoMarketObjectEmailType.AUTO_MARKET,
            },
          },
        ],
      },
      actionName: AutoMarketTaskActionTypeName[AutoMarketTaskActionType.SEND_EDM],
      actionType: AutoMarketTaskActionType.SEND_EDM,
      actionContent: {
        sendEdmEmailAction: {
          edmEmailSubjects: [''],
          edmEmailSender: '',
          replyEmail: '',
          emailContent: '',
          emailAttachment: '',
          // senderEmail: '',
        },
      },
      excludeConditionVo: {
        excludeConditionList: [
          {
            conditionType: AutoMarketTaskExcludeConditionType.EDM,
            conditionContent: {
              conditionName: AutoMarketTaskExcludeConditionTypeName.EDM,
              inBlacklist: true,
              inUnsubscribeList: true,
              invalidList: true,
            },
          },
          {
            conditionType: AutoMarketTaskExcludeConditionType.REPEAT,
            conditionContent: {
              conditionName: AutoMarketTaskExcludeConditionTypeName.REPEAT,
              repeat: true,
            },
          },
        ],
      },
    },
    branchAction: {
      triggerConditionVo: {
        triggerConditionList: [
          {
            conditionType: AutoMarketTaskTriggerConditionType.EMAIL,
            conditionContent: {
              conditionName: AutoMarketTaskTriggerConditionTypeName.EMAIL,
              emailOpDays: undefined,
              emailOpType: undefined,
              objectEmailType: AutoMarketObjectEmailType.AUTO_MARKET,
            },
          },
        ],
      },
      actionName: AutoMarketTaskActionTypeName[AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP],
      actionType: '',
      actionContent: {
        updateContactGroupInfoActionList: [
          {
            opType: 0,
            groupIds: [],
          },
        ],
      },
    },
  },
  additionalGroupSetting: {
    triggerConditionVo: {
      triggerConditionList: [
        {
          conditionType: AutoMarketTaskTriggerConditionType.EMAIL,
          conditionContent: {
            conditionName: AutoMarketTaskTriggerConditionTypeName.EMAIL,
            emailOpDays: undefined,
            emailOpType: undefined,
            objectEmailType: AutoMarketObjectEmailType.AUTO_MARKET,
          },
        },
      ],
    },
    actionName: AutoMarketTaskActionTypeName[AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP],
    actionType: AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP,
    actionContent: {
      updateContactGroupInfoActionList: [
        {
          opType: 0,
          groupIds: [],
        },
      ],
    },
  },
  additionalGroupSettingNoTrigger: {
    actionName: AutoMarketTaskActionTypeName[AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP],
    actionType: AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP,
    actionContent: {
      updateContactGroupInfoActionList: [
        {
          opType: 0,
          groupIds: [],
        },
      ],
    },
  },
};
export const getTaskObjectPanelInfo = (
  taskDetail: AutoMarketTaskDetail,
  payload: {
    clueStatuses: LabelType[];
    uniClueStatuses: LabelType[];
  }
) => {
  const infos = [];
  const objectType = taskDetail.taskObjectInfo.objectType;
  if (objectType === AutoMarketTaskObjectType.CUSTOMER) {
    const objectContent = taskDetail.taskObjectInfo.objectContent as AutoMarketTaskObjectContent.Customer;
    infos.push(`客户列表：我的客户`);
    if (objectContent.customerTagOpType !== undefined && objectContent.customerTagOpType !== null && objectContent.customerTags?.length) {
      infos.push(`标签：${objectContent.customerTags.join('、')}`);
    }
    if (objectContent.continent || objectContent.country) {
      infos.push(`地区：${[objectContent.continent, objectContent.country].filter(item => item).join('、')}`);
    }
    if (objectContent.contactType !== undefined && objectContent.contactType !== null) {
      infos.push(`联系人：${AutoMarketContactTypeName[objectContent.contactType]}`);
    }
  }
  if (objectType === AutoMarketTaskObjectType.WEBSITE) {
    infos.push(`客户列表：询盘客户`);
  }
  if (objectType === AutoMarketTaskObjectType.CLUE) {
    const objectContent = taskDetail.taskObjectInfo.objectContent as AutoMarketTaskObjectContent.Clue;
    if (Array.isArray(objectContent.clueStatus) && objectContent.clueStatus.length && payload.clueStatuses.length) {
      infos.push(`状态：${objectContent.clueStatus.map(status => payload.clueStatuses.find(item => item.value === status)?.label).join('、')}`);
    }
    if (objectContent.continent || objectContent.country) {
      infos.push(`地区：${[objectContent.continent, objectContent.country].filter(item => item).join('、')}`);
    }
  }
  if (objectType === AutoMarketTaskObjectType.UNI_CLUE) {
    const objectContent = taskDetail.taskObjectInfo.objectContent as AutoMarketTaskObjectContent.UNI_CLUE;
    if (Array.isArray(objectContent.followStatus) && objectContent.followStatus.length && payload.uniClueStatuses.length) {
      infos.push(`状态：${objectContent.followStatus.map(status => payload.uniClueStatuses.find(item => item.value === status)?.label).join('、')}`);
    }
    if (objectContent.continent || objectContent.country) {
      infos.push(`地区：${[objectContent.continent, objectContent.country].filter(item => item).join('、')}`);
    }
  }

  if (objectType === AutoMarketTaskObjectType.ADDRESS) {
    const objectContent = taskDetail.taskObjectInfo.objectContent as AutoMarketTaskObjectContent.Address;
    const groupIdList = objectContent?.groupIdList || [];
    const importIdList = objectContent?.importIdList || [];
    if (importIdList.length || groupIdList.length) {
      infos.push(importIdList.length ? getTransText('SelectByList') : getTransText('SelectByGroup'));
      infos.push(<AddressRuleDetail type="group" ids={objectContent?.groupIdList || []} />);
    }
    if (objectContent?.contactInfos?.length) {
      infos.push(`${objectContent.contactInfos.length}个联系人`);
    }
  }

  if (objectType === AutoMarketTaskObjectType.EDM) {
    const objectContent = taskDetail.taskObjectInfo.objectContent as AutoMarketTaskObjectContent.Edm;
    infos.push(`${objectContent.edmTaskName} ${objectContent?.contactInfos?.length}个联系人`);
  }

  return infos;
};
export const getTaskTriggerConditionInfo = (taskDetail: AutoMarketTaskDetail) => {
  const infos = [];
  const condition = taskDetail.execAction.triggerConditionVo.triggerConditionList[0];
  const conditionType = condition.conditionType;
  if (conditionType === AutoMarketTaskTriggerConditionType.NO) {
    infos.push(getIn18Text('WUCHUFATIAOJIAN'));
  }
  if (conditionType === AutoMarketTaskTriggerConditionType.DATE) {
    const conditionContent = condition.conditionContent as AutoMarketTaskTriggerCondition.DATE;
    if (conditionContent.triggerTimes && conditionContent.triggerTimes.length) {
      conditionContent.triggerTimes.forEach((time, index) => {
        infos.push(`日期${index + 1}：${time}`);
      });
    }
  }

  if (conditionType === AutoMarketTaskTriggerConditionType.EMAIL) {
    const conditionContent = condition.conditionContent as AutoMarketTaskTriggerCondition.EMAIL;
    const { emailOpDays, emailOpType } = conditionContent;
    if (emailOpType !== undefined && emailOpType !== null) {
      if (!emailOpDays) {
        infos.push(`触发条件：${AutoMarketEmailOpTypeName[emailOpType]}营销邮件`);
      } else {
        infos.push(`触发条件：${conditionContent.emailOpDays}天后${AutoMarketEmailOpTypeName[emailOpType]}营销邮件`);
      }
    }
  }
  return infos;
};
export const getTaskExecActionInfo = (taskDetail: AutoMarketTaskDetail) => {
  const infos = [];
  const actionType = taskDetail.execAction.actionType;
  if (actionType === AutoMarketTaskActionType.SEND_EDM) {
    const sendEdmEmailAction = taskDetail.execAction.actionContent.sendEdmEmailAction as AutoMarketTaskActionContent.SEND_EDM;
    if (Array.isArray(sendEdmEmailAction.edmEmailSubjects) && sendEdmEmailAction.edmEmailSubjects.filter(item => item).length) {
      infos.push(`邮件主题：${sendEdmEmailAction.edmEmailSubjects.join('、')}`);
    }
    if (sendEdmEmailAction.senderEmail) {
      infos.push(`发件地址：${sendEdmEmailAction.senderEmail}`);
    }

    if (sendEdmEmailAction.edmEmailSender) {
      infos.push(`发件人昵称：${sendEdmEmailAction.edmEmailSender}`);
    }
    if (sendEdmEmailAction.replyEmail) {
      infos.push(`回复邮箱：${sendEdmEmailAction.replyEmail}`);
    }
    if (sendEdmEmailAction.emailContent) {
      infos.push(`邮件内容：${getPlainTextFromHtml(sendEdmEmailAction.emailContent)}`);
    }
  }

  if (actionType === AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP) {
    if (taskDetail?.execAction?.actionContent?.updateContactGroupInfoActionList?.[0]?.opType === 0) {
      infos.push(getIn18Text('TIANJIAFENZU'));
    } else {
      infos.push(getIn18Text('ZHUANYIDAOFENZU'));
    }
  }

  return infos;
};

export const getTaskAdditionalActionPanelInfo = (currentAdditionalAction: AutoMarketTaskTruckAction, branchType: 'truck' | 'branch') => {
  let branchActionType = currentAdditionalAction?.branchAction?.actionType;
  let desc = getTransText('RUODANGQIANDONGZUOBUMANZUYINGXIAOXUQIU\uFF0CGOUXUANHOUKETIANJIAEWAIZHIXINGDONGZUO');
  if (branchActionType) {
    // let actionKey = branchType === 'truck' ? 'truckAction' : 'branchAction';
    const triggerCondition = currentAdditionalAction.truckAction.triggerConditionVo.triggerConditionList[0];
    if (triggerCondition?.conditionType === AutoMarketTaskTriggerConditionType.EMAIL) {
      const conditionContent = triggerCondition.conditionContent as AutoMarketTaskTriggerCondition.EMAIL;
      if (conditionContent.emailOpDays && conditionContent.emailOpType !== undefined && conditionContent.emailOpType !== null) {
        if (branchType === 'truck') {
          const textType = conditionContent.emailOpType === 100 ? getIn18Text('HOU') : getIn18Text('NEI');
          desc = `若${conditionContent.emailOpDays}天${textType}${AutoMarketEmailOpTypeName[conditionContent.emailOpType]}上封邮件, 则：`;
        } else {
          desc = `若${conditionContent.emailOpDays}天内回复上封邮件, 则：`;
        }
      }
    }
    if (branchType === 'truck') {
      return {
        name: getTransText('ZHUIJIADONGZUO') + '1',
        desc,
      };
    }
    if (branchType === 'branch') {
      return {
        name: getTransText('ZHUIJIADONGZUO') + '2',
        desc,
      };
    }
  }
  return {
    name: getTransText('ZHUIJIADONGZUO'),
    desc,
  };
};

export const getTaskAdditionalActionInfo = (
  taskDetail: AutoMarketTaskDetail,
  fieldIndex: 'truckAction' | 'branchAction',
  payload: {
    additionalIndex: number;
    updateCustomerFields: AutoMarketCustomerUpdateField[];
    optionType: AutoMarketTaskActionType;
  }
) => {
  const infos = [];
  const action = taskDetail.additionalActionLayerList[payload.additionalIndex][fieldIndex];
  if (payload.optionType !== action?.actionType) {
    return [];
  }
  if (action && action.actionType === AutoMarketTaskActionType.UPDATE_CUSTOMER) {
    const triggerCondition = action.triggerConditionVo.triggerConditionList[0];
    if (triggerCondition.conditionType === AutoMarketTaskTriggerConditionType.EMAIL) {
      const conditionContent = triggerCondition.conditionContent as AutoMarketTaskTriggerCondition.EMAIL;
      if (conditionContent.emailOpType !== undefined && conditionContent.emailOpType !== null) {
        const textType = conditionContent?.emailOpType === 100 ? getIn18Text('HOU') : getIn18Text('NEI');
        const daysText = conditionContent?.emailOpDays ? `${conditionContent.emailOpDays}天${textType}` : '';
        infos.push(`触发条件：${daysText}${AutoMarketEmailOpTypeName[conditionContent.emailOpType]}上封邮件, 则执行以下动作`);
      }
    }
    const updateCustomerInfoActionList = action.actionContent.updateCustomerInfoActionList || [];
    updateCustomerInfoActionList.map(item => {
      if (item.fieldName && item.updateValue) {
        const updateField = payload.updateCustomerFields.find(field => field.fieldName === item.fieldName);
        if (updateField) {
          let fieldShowValue = item.updateValue;
          // 下拉框
          if (updateField.fieldShowType === 2) {
            const option = updateField.fieldValues.find(option => option.value === item.updateValue);
            if (option) {
              fieldShowValue = option.label;
            }
          }
          infos.push(`信息修改：将“${updateField.fieldShowName}”添加“${fieldShowValue}”`);
        }
      }
    });
  }
  if (action && action.actionType === AutoMarketTaskActionType.SEND_EDM) {
    const triggerCondition = action.triggerConditionVo.triggerConditionList[0];
    if (triggerCondition?.conditionType === AutoMarketTaskTriggerConditionType.EMAIL) {
      const conditionContent = triggerCondition.conditionContent as AutoMarketTaskTriggerCondition.EMAIL;
      if (conditionContent.emailOpDays && conditionContent.emailOpType !== undefined && conditionContent.emailOpType !== null) {
        const textType = conditionContent.emailOpType === 100 ? getIn18Text('HOU') : getIn18Text('NEI');
        infos.push(`触发条件：${conditionContent.emailOpDays}天${textType}${AutoMarketEmailOpTypeName[conditionContent.emailOpType]}上封邮件, 则执行以下动作`);
      }
    }
    const sendEdmEmailAction = action.actionContent.sendEdmEmailAction as AutoMarketTaskActionContent.SEND_EDM;
    if (Array.isArray(sendEdmEmailAction.edmEmailSubjects) && sendEdmEmailAction.edmEmailSubjects.filter(item => item).length) {
      infos.push(`邮件主题：${sendEdmEmailAction.edmEmailSubjects.join('、')}`);
    }

    if (sendEdmEmailAction.senderEmail) {
      infos.push(`发件地址：${sendEdmEmailAction.senderEmail}`);
    }

    if (sendEdmEmailAction.edmEmailSender) {
      infos.push(`发件人昵称：${sendEdmEmailAction.edmEmailSender}`);
    }
    if (sendEdmEmailAction.replyEmail) {
      infos.push(`回复邮箱：${sendEdmEmailAction.replyEmail}`);
    }
    if (sendEdmEmailAction.emailContent) {
      infos.push(`邮件内容：${getPlainTextFromHtml(sendEdmEmailAction.emailContent)}`);
    }
  }

  if (action.actionType === AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP) {
    if (action.actionContent?.updateContactGroupInfoActionList?.[0]?.opType === 0) {
      infos.push(getIn18Text('TIANJIAFENZU'));
    } else {
      infos.push(getIn18Text('ZHUANYIDAOFENZU'));
    }
  }
  return infos;
};

export const excludeConditionVo = {
  excludeConditionList: [
    {
      conditionType: AutoMarketTaskExcludeConditionType.EDM,
      conditionContent: {
        conditionName: AutoMarketTaskExcludeConditionTypeName.EDM,
        inBlacklist: true,
        inUnsubscribeList: true,
        invalidList: true,
      },
    },
    {
      conditionType: AutoMarketTaskExcludeConditionType.REPEAT,
      conditionContent: {
        conditionName: AutoMarketTaskExcludeConditionTypeName.REPEAT,
        repeat: true,
      },
    },
  ],
};

export const initialTaskDetailMap: Record<AutoMarketTaskType, AutoMarketTaskDetail> = {
  HOLIDAY_GREETING: {
    taskName: '',
    taskDesc: '',
    taskType: AutoMarketTaskType.HOLIDAY_GREETING,
    taskStatus: AutoMarketOpenStatus.NEW,
    taskNotifyStatus: AutoMarketOpenStatus.CLOSED,
    taskObjectInfo: {
      objectType: '' as unknown as AutoMarketTaskObjectType,
      objectName: '' as unknown as AutoMarketTaskObjectTypeName,
      objectContent: {} as AutoMarketTaskObjectContent.Customer,
    },
    execAction: {
      triggerConditionVo: {
        triggerConditionList: [],
      },
      actionName: '' as AutoMarketTaskActionTypeName,
      actionType: '' as AutoMarketTaskActionType,
      actionContent: {},
      excludeConditionVo: {
        excludeConditionList: [
          {
            conditionType: AutoMarketTaskExcludeConditionType.EDM,
            conditionContent: {
              conditionName: AutoMarketTaskExcludeConditionTypeName.EDM,
              inBlacklist: true,
              inUnsubscribeList: true,
              invalidList: true,
            },
          },
          {
            conditionType: AutoMarketTaskExcludeConditionType.REPEAT,
            conditionContent: {
              conditionName: AutoMarketTaskExcludeConditionTypeName.REPEAT,
              repeat: false,
            },
          },
        ],
      },
    },
    additionalActionLayerList: [],
  },
  PREVIOUS_CONTACT: {
    taskName: '',
    taskDesc: '',
    taskType: AutoMarketTaskType.PREVIOUS_CONTACT,
    taskStatus: AutoMarketOpenStatus.NEW,
    taskNotifyStatus: AutoMarketOpenStatus.CLOSED,
    taskObjectInfo: {
      objectType: '' as unknown as AutoMarketTaskObjectType,
      objectName: '' as unknown as AutoMarketTaskObjectTypeName,
      objectContent: {} as AutoMarketTaskObjectContent.Customer,
    },
    execAction: {
      triggerConditionVo: {
        triggerConditionList: [],
      },
      actionName: '' as AutoMarketTaskActionTypeName,
      actionType: '' as AutoMarketTaskActionType,
      actionContent: {},
      excludeConditionVo: {
        excludeConditionList: [
          {
            conditionType: AutoMarketTaskExcludeConditionType.EDM,
            conditionContent: {
              conditionName: AutoMarketTaskExcludeConditionTypeName.EDM,
              inBlacklist: true,
              inUnsubscribeList: true,
              invalidList: true,
            },
          },
          {
            conditionType: AutoMarketTaskExcludeConditionType.REPEAT,
            conditionContent: {
              conditionName: AutoMarketTaskExcludeConditionTypeName.REPEAT,
              repeat: true,
            },
          },
        ],
      },
    },
    additionalActionLayerList: [
      {
        truckAction: {
          actionType: '',
          excludeConditionVo: {
            excludeConditionList: [
              {
                conditionType: AutoMarketTaskExcludeConditionType.EDM,
                conditionContent: {
                  conditionName: AutoMarketTaskExcludeConditionTypeName.EDM,
                  inBlacklist: true,
                  inUnsubscribeList: true,
                  invalidList: true,
                },
              },
              {
                conditionType: AutoMarketTaskExcludeConditionType.REPEAT,
                conditionContent: {
                  conditionName: AutoMarketTaskExcludeConditionTypeName.REPEAT,
                  repeat: true,
                },
              },
            ],
          },
        } as unknown as AutoMarketTaskAction,
        branchAction: null,
      },
    ],
  },
  POTENTIAL_CONTACT: {
    taskName: '',
    taskDesc: '',
    taskType: AutoMarketTaskType.POTENTIAL_CONTACT,
    taskStatus: AutoMarketOpenStatus.NEW,
    taskNotifyStatus: AutoMarketOpenStatus.CLOSED,
    taskObjectInfo: {
      objectType: '' as unknown as AutoMarketTaskObjectType,
      objectName: '' as unknown as AutoMarketTaskObjectTypeName,
      objectContent: {} as AutoMarketTaskObjectContent.Clue,
    },
    execAction: {
      triggerConditionVo: {
        triggerConditionList: [],
      },
      actionName: '' as AutoMarketTaskActionTypeName,
      actionType: '' as AutoMarketTaskActionType,
      actionContent: {},
      excludeConditionVo: {
        excludeConditionList: [
          {
            conditionType: AutoMarketTaskExcludeConditionType.EDM,
            conditionContent: {
              conditionName: AutoMarketTaskExcludeConditionTypeName.EDM,
              inBlacklist: true,
              inUnsubscribeList: true,
              invalidList: true,
            },
          },
          {
            conditionType: AutoMarketTaskExcludeConditionType.REPEAT,
            conditionContent: {
              conditionName: AutoMarketTaskExcludeConditionTypeName.REPEAT,
              repeat: true,
            },
          },
        ],
      },
    },
    additionalActionLayerList: [
      {
        truckAction: {
          actionType: '',
          excludeConditionVo: {
            excludeConditionList: [
              {
                conditionType: AutoMarketTaskExcludeConditionType.EDM,
                conditionContent: {
                  conditionName: AutoMarketTaskExcludeConditionTypeName.EDM,
                  inBlacklist: true,
                  inUnsubscribeList: true,
                  invalidList: true,
                },
              },
              {
                conditionType: AutoMarketTaskExcludeConditionType.REPEAT,
                conditionContent: {
                  conditionName: AutoMarketTaskExcludeConditionTypeName.REPEAT,
                  repeat: true,
                },
              },
            ],
          },
        } as unknown as AutoMarketTaskAction,
        branchAction: {} as unknown as AutoMarketTaskAction,
      },
    ],
  },
  FIXED_CONTACT: {
    taskName: '',
    taskDesc: '',
    taskType: AutoMarketTaskType.FIXED_CONTACT,
    taskStatus: AutoMarketOpenStatus.NEW,
    taskNotifyStatus: AutoMarketOpenStatus.CLOSED,
    taskObjectInfo: {
      objectType: '' as unknown as AutoMarketTaskObjectType,
      objectName: '' as unknown as AutoMarketTaskObjectTypeName,
      objectContent: {} as AutoMarketTaskObjectContent.Edm,
    },
    execAction: {
      triggerConditionVo: {
        triggerConditionList: [],
      },
      actionName: '' as AutoMarketTaskActionTypeName,
      actionType: '' as AutoMarketTaskActionType,
      actionContent: {},
      excludeConditionVo: {
        excludeConditionList: [
          {
            conditionType: AutoMarketTaskExcludeConditionType.EDM,
            conditionContent: {
              conditionName: AutoMarketTaskExcludeConditionTypeName.EDM,
              inBlacklist: true,
              inUnsubscribeList: true,
              invalidList: true,
            },
          },
          {
            conditionType: AutoMarketTaskExcludeConditionType.REPEAT,
            conditionContent: {
              conditionName: AutoMarketTaskExcludeConditionTypeName.REPEAT,
              repeat: true,
            },
          },
        ],
      },
    },
    additionalActionLayerList: [
      {
        truckAction: {
          actionType: '',
          excludeConditionVo: {
            excludeConditionList: [
              {
                conditionType: AutoMarketTaskExcludeConditionType.EDM,
                conditionContent: {
                  conditionName: AutoMarketTaskExcludeConditionTypeName.EDM,
                  inBlacklist: true,
                  inUnsubscribeList: true,
                  invalidList: true,
                },
              },
              {
                conditionType: AutoMarketTaskExcludeConditionType.REPEAT,
                conditionContent: {
                  conditionName: AutoMarketTaskExcludeConditionTypeName.REPEAT,
                  repeat: true,
                },
              },
            ],
          },
        } as unknown as AutoMarketTaskAction,
        branchAction: {} as unknown as AutoMarketTaskAction,
      },
    ],
  },
};

export interface TaskDetailLayout {
  objectTypes: {
    icon: React.ReactSVGElement;
    type: AutoMarketTaskObjectType;
  }[];
  triggerConditionTypes: {
    icon: React.ReactSVGElement;
    type: AutoMarketTaskTriggerConditionType;
  }[];
  execActionTypes: {
    icon: React.ReactSVGElement;
    type: AutoMarketTaskActionType;
  }[];
  additionalActionTypes: {
    icon: React.ReactSVGElement;
    type: AutoMarketTaskActionType;
  }[];
  additionalBranchActionTypes: {
    icon: React.ReactSVGElement;
    type: AutoMarketTaskActionType;
  }[];
  additionalActionMaxCount: number;
}
export const taskDetailLayoutMap: Record<AutoMarketTaskType, TaskDetailLayout> = {
  HOLIDAY_GREETING: {
    objectTypes: [
      { icon: CustomerIcon, type: AutoMarketTaskObjectType.CUSTOMER },
      { icon: ClueIcon, type: AutoMarketTaskObjectType.UNI_CLUE },
      { icon: AddressBookIcon, type: AutoMarketTaskObjectType.ADDRESS },
    ],
    triggerConditionTypes: [{ icon: DateIcon, type: AutoMarketTaskTriggerConditionType.DATE }],
    execActionTypes: [{ icon: EmailIcon, type: AutoMarketTaskActionType.SEND_EDM }],
    additionalActionTypes: [],
    additionalBranchActionTypes: [],
    additionalActionMaxCount: 0,
  },
  PREVIOUS_CONTACT: {
    objectTypes: [
      { icon: CustomerIcon, type: AutoMarketTaskObjectType.CUSTOMER },
      { icon: ClueIcon, type: AutoMarketTaskObjectType.UNI_CLUE },
    ],
    triggerConditionTypes: [
      { icon: DateIcon, type: AutoMarketTaskTriggerConditionType.NO },
      { icon: EmailIcon, type: AutoMarketTaskTriggerConditionType.EMAIL },
    ],
    execActionTypes: [{ icon: EmailIcon, type: AutoMarketTaskActionType.SEND_EDM }],
    additionalActionTypes: [
      // { icon: CustomerIcon, type: AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP },
      { icon: CustomerIcon, type: AutoMarketTaskActionType.UPDATE_CUSTOMER },
    ],
    additionalBranchActionTypes: [],
    additionalActionMaxCount: 1,
  },
  POTENTIAL_CONTACT: {
    objectTypes: [
      { icon: CustomerIcon, type: AutoMarketTaskObjectType.CUSTOMER },
      { icon: ClueIcon, type: AutoMarketTaskObjectType.UNI_CLUE },
      { icon: AddressBookIcon, type: AutoMarketTaskObjectType.ADDRESS },
    ],
    triggerConditionTypes: [
      { icon: DateIcon, type: AutoMarketTaskTriggerConditionType.NO },
      // { icon: EmailIcon, type: AutoMarketTaskTriggerConditionType.EMAIL },
    ],
    execActionTypes: [{ icon: EmailIcon, type: AutoMarketTaskActionType.SEND_EDM }],
    additionalActionTypes: [
      // { icon: CustomerIcon, type: AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP },
      { icon: EmailIcon, type: AutoMarketTaskActionType.SEND_EDM },
    ],
    additionalBranchActionTypes: [
      // { icon: CustomerIcon, type: AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP }
    ],
    additionalActionMaxCount: 10,
  },
  FIXED_CONTACT: {
    objectTypes: [
      // { icon: CustomerIcon, type: AutoMarketTaskObjectType.CUSTOMER },
      { icon: AddressBookIcon, type: AutoMarketTaskObjectType.ADDRESS },
      { icon: EdmIcon, type: AutoMarketTaskObjectType.EDM },
    ],
    triggerConditionTypes: [
      { icon: DateIcon, type: AutoMarketTaskTriggerConditionType.NO },
      { icon: EmailIcon, type: AutoMarketTaskTriggerConditionType.EMAIL },
    ],
    execActionTypes: [
      { icon: EmailIcon, type: AutoMarketTaskActionType.SEND_EDM },
      // { icon: CustomerIcon, type: AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP },
    ],
    additionalActionTypes: [
      // { icon: CustomerIcon, type: AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP },
      { icon: EmailIcon, type: AutoMarketTaskActionType.SEND_EDM },
    ],
    additionalBranchActionTypes: [
      // { icon: CustomerIcon, type: AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP }
    ],
    additionalActionMaxCount: 10,
  },
};

export function getEdmSendTime(sendTime: string, timeZone: string) {
  const timeZoneDesc = timeZoneMap[timeZone]?.split('：')[0];
  const extInfo = getWeekdayWithTimeZoneOffset(moment(String(sendTime).replace(' ', 'T') + timeZone), timeZone);
  return `${timeZoneDesc} ${sendTime} (${extInfo})`;
}

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const systemApi = apiHolder.api.getSystemApi();
/**
 * 针对任务目标是 “邮件营销任务(AutoMarketTaskObjectType.EDM) 的，发送营销邮件时自动带入默认值”
 * 针对其他类型的任务 默认填入账号信息
 * @param taskDetail
 * @param form
 */
export async function getDefaultEmailVal(taskDetail: AutoMarketTaskDetail) {
  const objectType = taskDetail?.taskObjectInfo?.objectType;
  const currentUser = systemApi.getCurrentUser();

  // if (!objectType) {
  //   // 未选择目标 或者 已经有值 直接跳过
  //   return null;
  // }
  // 默认是账号信息
  let defaultReplyEmail = currentUser?.loginAccount;
  let defaultEdmEmailSender = currentUser?.accountName;

  const objectContent = taskDetail?.taskObjectInfo?.objectContent as AutoMarketTaskObjectContent.Edm;
  if (objectType === AutoMarketTaskObjectType.EDM && objectContent?.edmEmailId) {
    // 如果选择的是营销任务 则去获取任务信息
    try {
      const edmDetail = await edmApi.copyFromSendBox({
        edmEmailId: objectContent.edmEmailId,
      });

      const { sendSettingInfo } = edmDetail || {};
      const edmReplyEmail = sendSettingInfo?.replyEmail;
      const sender = sendSettingInfo?.sender || '';
      if (edmReplyEmail) {
        defaultReplyEmail = edmReplyEmail;
      }
      if (sender) {
        defaultEdmEmailSender = sender;
      }
    } catch (e) {}
  }

  return {
    defaultReplyEmail,
    defaultEdmEmailSender,
  };
}
