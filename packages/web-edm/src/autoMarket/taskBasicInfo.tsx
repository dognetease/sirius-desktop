import React, { useState, useEffect, useMemo } from 'react';
import { Popover, Divider, Descriptions, Dropdown, Menu, Tag } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { createGlobalState, useHash } from 'react-use';
import { navigate, useLocation } from '@reach/router';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import ShowConfirm from '@/components/Layout/Customer/components/confirm/makeSureConfirm';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import {
  apiHolder,
  apis,
  AutoMarketApi,
  AutoMarketTaskCondition,
  PeriodicityType,
  ObjectEmailTypeList,
  EmailOpTypeList,
  CustomerTagOpType,
  AutoMarketContactTypeName,
  AutoMarketOpenStatusName,
  AutoMarketTaskAction,
  AutoMarketTaskDetail,
  AutoMarketTaskObjectType,
  AutoMarketTaskActionContent,
} from 'api';
import moreIcon from '@/images/icons/edm/autoMarket/more.svg';
import { getTransText } from '@/components/util/translate';
import style from './taskBasicInfo.module.scss';
import classNames from 'classnames';
import { CLUE_STATUS } from '@/components/Layout/Customer/Clue/components/ClueDetail/clueDetail';
import { autoMarketTracker } from './tracker';
import { AddressRuleDetail } from './components/addressRuleDetail';
import { ActionDetail } from './components/actionDetail';
import { LabelType } from './taskEdit';
import { getIn18Text } from 'api';

const autoMarketApi = apiHolder.api.requireLogicalApi(apis.autoMarketApiImpl) as unknown as AutoMarketApi;
const getClueStatus = (clueStatus: number[]) => {
  if (Array.isArray(clueStatus) && clueStatus.length) {
    const found = CLUE_STATUS.find(item => Number(item.id) === clueStatus[0]);
    if (found) {
      return found.name;
    }
  }
};
const getUniClueStatus = (clueStatus: number[], CLUE_STATUS: LabelType[]) => {
  if (Array.isArray(clueStatus) && clueStatus.length) {
    const findName = () => {
      let names: (string | undefined)[] = [];
      clueStatus.forEach(clueStatusItem => {
        names.push(CLUE_STATUS.find(item => item.value === clueStatusItem)?.label);
      });
      return names;
    };
    return findName().join('，');
  }
  return '-';
};
export const useGlobalState = createGlobalState<AutoMarketTaskDetail | null>(null);
const TaskBasicInfo = () => {
  const [taskDetail, setTaskDetail] = useGlobalState();
  const location = useLocation();
  const [uniClueStatuses, setUniClueStatuses] = useState<LabelType[]>([]);
  // const [hash] = useHash();
  const taskId = useMemo(() => {
    return new URLSearchParams(location.hash).get('taskId');
  }, [location.hash]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const showModal = () => {
    setIsModalVisible(true);
  };
  const handleOk = () => {
    setIsModalVisible(false);
  };
  const handleCancel = () => {
    setIsModalVisible(false);
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
  const getTaskDetail = async () => {
    if (!taskId) return;
    try {
      const data = await autoMarketApi.getTaskDetail({ taskId });
      setTaskDetail(data);
      if (data.taskObjectInfo.objectType === AutoMarketTaskObjectType.UNI_CLUE) {
        handelUniCustomerFollowStatus();
      }
    } catch (error) {
      //
    }
  };
  const deleteConfirm = (taskId: string) => {
    ShowConfirm({
      title: getIn18Text('QUEDINGSHANCHU\uFF1F'),
      type: 'danger',
      okText: getIn18Text('SHANCHU'),
      cancelText: getIn18Text('QUXIAO'),
      makeSure: () => deleteTask(taskId),
    });
  };
  const deleteTask = async (taskId: string) => {
    await autoMarketApi.deleteTaskDetail({ taskId });
    Toast.success({ content: `删除成功` });
    navigate('#edm?page=autoMarketTask');
  };
  useEffect(() => {
    getTaskDetail();
    return () => {
      setTaskDetail(null);
    };
  }, [taskId]);
  if (!taskDetail) {
    return <div className={style.container}></div>;
  }
  const renderObjectContent = (data: AutoMarketTaskDetail) => {
    const { objectType, objectContent } = data.taskObjectInfo;
    switch (objectType) {
      case 'CUSTOMER':
        return (
          <>
            {Array.isArray(objectContent.customerTags) && objectContent.customerTags.length && (
              <>
                <Descriptions.Item label={getIn18Text('KEHUBIAOQIAN')}>{CustomerTagOpType[objectContent.customerTagOpType]}</Descriptions.Item>
                <Descriptions.Item label={getIn18Text('KEHUBIAOQIANLIEBIAO')}>{objectContent.customerTags.join(' | ')}</Descriptions.Item>
              </>
            )}
            <Descriptions.Item label={getIn18Text('LIANXIREN')}>{AutoMarketContactTypeName[objectContent.contactType] || '-'}</Descriptions.Item>
            {objectContent.continent && <Descriptions.Item label={getIn18Text('ZHOUJI')}>{objectContent.continent}</Descriptions.Item>}
            {objectContent.country && <Descriptions.Item label={getIn18Text('GUOJIA')}>{objectContent.country}</Descriptions.Item>}
          </>
        );
      case 'CLUE':
        return (
          <>
            {getClueStatus(objectContent.clueStatus) && (
              <Descriptions.Item label={getIn18Text('XIANSUOZHUANGTAI')}>{getClueStatus(objectContent.clueStatus)}</Descriptions.Item>
            )}
            {objectContent.continent && <Descriptions.Item label={getIn18Text('ZHOUJI')}>{objectContent.continent}</Descriptions.Item>}
            {objectContent.country && <Descriptions.Item label={getIn18Text('GUOJIA')}>{objectContent.country}</Descriptions.Item>}
          </>
        );

      case 'UNI_CLUE':
        return (
          <>
            {getUniClueStatus(objectContent.followStatus, uniClueStatuses) && (
              <Descriptions.Item label={getIn18Text('KEHUGENJINZHUANGTAI')}>{getUniClueStatus(objectContent.followStatus, uniClueStatuses)}</Descriptions.Item>
            )}
            {objectContent.continent && <Descriptions.Item label={getIn18Text('ZHOUJI')}>{objectContent.continent}</Descriptions.Item>}
            {objectContent.country && <Descriptions.Item label={getIn18Text('GUOJIA')}>{objectContent.country}</Descriptions.Item>}
          </>
        );
      case 'ADDRESS':
        let ids: number[];
        let type: string;
        if (objectContent.importIdList && objectContent.importIdList.length) {
          ids = objectContent.importIdList;
          type = 'list';
        } else if (objectContent.groupIdList && objectContent.groupIdList.length) {
          ids = objectContent.groupIdList;
          type = 'group';
        } else {
          ids = [];
          type = '';
        }
        return (
          <>
            <Descriptions.Item label={getTransText('LEIXING')}>{type === 'group' ? getTransText('SelectByGroup') : getTransText('SelectByList')}</Descriptions.Item>
            <Descriptions.Item label=""> </Descriptions.Item>
            <Descriptions.Item label={getTransText('YIXUANZE')}>
              <AddressRuleDetail ids={ids} type={type} />
            </Descriptions.Item>
            <Descriptions.Item label=""> </Descriptions.Item>
            <Descriptions.Item label="">{objectContent?.contactInfos?.length ? <div>{`共 ${objectContent.contactInfos.length} 个联系人`}</div> : ''}</Descriptions.Item>
          </>
        );

      case 'EDM':
        return (
          <>
            <Descriptions.Item label="">{objectContent?.edmTaskName || ''}</Descriptions.Item>
            <Descriptions.Item label=""> </Descriptions.Item>
            <Descriptions.Item label="">{`共 ${objectContent.contactInfos.length} 个联系人`}</Descriptions.Item>
          </>
        );
      default:
        return null;
    }
  };
  const renderTriggerCondition = (data: AutoMarketTaskCondition[]) => {
    if (data.length > 0) {
      const [condition] = data;
      switch (condition.conditionType) {
        case 'EMAIL':
          return (
            <Popover
              placement="bottomRight"
              content={
                <Descriptions className={style.popoverContent} title={getIn18Text('CHUFATIAOJIAN')} style={{ width: 370 }} layout="vertical">
                  <Descriptions.Item label={getIn18Text('TIAOJIANMINGCHENG')}>{condition.conditionContent.conditionName}</Descriptions.Item>
                  <Descriptions.Item label={getIn18Text('MUBIAOYOUJIAN')}>{ObjectEmailTypeList[condition.conditionContent.objectEmailType]}</Descriptions.Item>
                  <Descriptions.Item label={getIn18Text('YOUJIANDONGZUO-TIANSHU')}>{condition.conditionContent.emailOpDays}</Descriptions.Item>
                  <Descriptions.Item label={getIn18Text('YOUJIANDONGZUO-CAOZUO')}>{EmailOpTypeList[condition.conditionContent.emailOpType]}</Descriptions.Item>
                </Descriptions>
              }
            >
              <span className={style.btnLink}>{condition.conditionContent.conditionName}</span>
            </Popover>
          );
        case 'NO':
          return <span>{condition.conditionContent.conditionName}</span>;
        case 'DATE':
          return (
            <Popover
              placement="bottomRight"
              content={
                <Descriptions className={style.popoverContent} title={getIn18Text('CHUFATIAOJIAN')} style={{ width: 370 }} layout="vertical">
                  {condition.conditionContent.triggerTimes ? (
                    <Descriptions.Item className={style.taskMultiTime} label={getIn18Text('ANZHAORIQI')}>
                      {condition.conditionContent.triggerTimes.map(triggerTime => (
                        <div className={style.taskMultiTimeItem}>
                          <span>{triggerTime}</span>
                          <Divider type="vertical" />
                          <span>{PeriodicityType[condition.conditionContent.periodicityType]}</span>
                        </div>
                      ))}
                    </Descriptions.Item>
                  ) : (
                    <Descriptions.Item label={getIn18Text('ANZHAORIQI')}>
                      <span>{condition.conditionContent.triggerTime}</span>
                      <Divider type="vertical" />
                      <span>{PeriodicityType[condition.conditionContent.periodicityType]}</span>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              }
            >
              <span className={style.btnLink}>{condition.conditionContent.conditionName}</span>
            </Popover>
          );
        default:
          break;
      }
    }
    return '-';
  };

  let showQuoteTag = false;
  let showAIContentTag = false;
  const actionLayerList = [
    {
      truckAction: taskDetail.execAction,
      branchAction: null as unknown as AutoMarketTaskAction,
    },
    ...taskDetail.additionalActionLayerList.filter(action => Boolean(action?.truckAction?.actionType)),
  ];

  if (taskDetail?.execAction) {
    actionLayerList.forEach(actionLayer => {
      const truckActionContent = actionLayer?.truckAction?.actionContent?.sendEdmEmailAction || ({} as AutoMarketTaskActionContent.SEND_EDM);
      if (truckActionContent?.replyEdmEmail) {
        showQuoteTag = true;
      }

      if (truckActionContent?.multipleContentInfo) {
        showAIContentTag = true;
      }
    });
  }

  return (
    <div className={style.container}>
      <div className={style.head}>
        <div>
          <span className={style.title}>{taskDetail.taskName}</span>
          <span className={style.status}>{AutoMarketOpenStatusName[taskDetail.taskStatus]}</span>
        </div>
        {taskDetail.taskDesc && <p className={style.desc}>{taskDetail.taskDesc}</p>}
      </div>
      <Divider className={style.divider} />
      <div className={style.body}>
        <Dropdown
          placement="bottomRight"
          overlayStyle={{
            width: 102,
          }}
          overlay={
            <Menu className={style.menuMore}>
              {taskDetail.taskObjectInfo.objectType === AutoMarketTaskObjectType.CLUE ? null : (
                <PrivilegeCheck resourceLabel="EDM" accessLabel="OP">
                  <Menu.Item key="edit" disabled={taskDetail.taskStatus !== 'NEW'} onClick={() => navigate(`#edm?page=autoMarketTaskEdit&taskId=${taskDetail.taskId}`)}>
                    {getIn18Text('BIANJI')}
                  </Menu.Item>
                  <Menu.Item
                    key="copy"
                    onClick={() => {
                      navigate(`#edm?page=autoMarketTaskEdit&copyTaskId=${taskDetail.taskId}`);
                      autoMarketTracker.copyClick();
                    }}
                  >
                    {getIn18Text('FUZHI')}
                  </Menu.Item>
                </PrivilegeCheck>
              )}
              <PrivilegeCheck resourceLabel="EDM" accessLabel="DELETE">
                <Menu.Item key="delete" onClick={() => deleteConfirm(taskDetail.taskId)}>
                  {getIn18Text('SHANCHU')}
                </Menu.Item>
              </PrivilegeCheck>
            </Menu>
          }
        >
          <img className={style.btnMore} src={moreIcon} />
        </Dropdown>
        <Descriptions title={getIn18Text('JICHUTIAOJIAN')}>
          <Descriptions.Item label={getIn18Text('MUBIAO')}>
            {taskDetail.taskObjectInfo.objectType ? (
              <Popover
                placement="bottomLeft"
                content={
                  <Descriptions
                    className={style.popoverContent}
                    title={taskDetail.taskObjectInfo.objectName}
                    style={{ width: 368, maxHeight: '100vh', overflowY: 'auto' }}
                    column={2}
                    layout="vertical"
                  >
                    {renderObjectContent(taskDetail)}
                  </Descriptions>
                }
              >
                <span className={style.btnLink}>{taskDetail.taskObjectInfo.objectName}</span>
              </Popover>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label={getIn18Text('PANDUANTIAOJIAN')}>
            {renderTriggerCondition(taskDetail.execAction.triggerConditionVo.triggerConditionList)}
          </Descriptions.Item>
          <Descriptions.Item label={getIn18Text('DONGZUO')}>
            {taskDetail.execAction.actionContent && taskDetail.execAction.actionContent.sendEdmEmailAction ? (
              // <Popover placement='bottomLeft' content={<Descriptions className={style.popoverContent} title={getIn18Text("DONGZUO")} style={{ width: 368 }} column={2} layout="vertical">
              //   <Descriptions.Item label={getIn18Text("YOUJIANZHUTI")}>{taskDetail.execAction.actionContent.sendEdmEmailAction.edmEmailSubjects.join('') || '-'}</Descriptions.Item>
              //   <Descriptions.Item label={getIn18Text("FAJIANREN")}>{taskDetail.execAction.actionContent.sendEdmEmailAction.edmEmailSender || '-'}</Descriptions.Item>
              //   <Descriptions.Item label={getIn18Text("HUIFUYOUXIANG")} span={2}>{taskDetail.execAction.actionContent.sendEdmEmailAction.replyEmail || '-'}</Descriptions.Item>
              //   <Descriptions.Item span={2}>
              //     <span className={classNames(style.btnLink, style.openEmailContent)} onClick={showModal}>{getIn18Text("CHAKANYOUJIANNEIRONG")}</span>
              //   </Descriptions.Item>
              // </Descriptions>}>
              //   <span className={style.btnLink}>{taskDetail.execAction.actionName}</span>
              // </Popover>
              <ActionDetail detail={taskDetail}>
                <span className={style.btnLink}>{taskDetail.execAction.actionName}</span>
                {showQuoteTag && <Tag className={style.tag}>{getTransText('QuoteFromoOiginal')}</Tag>}
                {showAIContentTag && <Tag className={classNames(style.tag, style.aiTag)}>{getTransText('MultipleVersionsEmail')}</Tag>}
              </ActionDetail>
            ) : (
              taskDetail.execAction.actionName || '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label={getIn18Text('YIZHIXINGDONGZUO')}>{taskDetail.execAction.actionType ? `${taskDetail.execCount}次` : '-'}</Descriptions.Item>
        </Descriptions>
        <Descriptions title={getIn18Text('RENWUSHIJIAN')}>
          <Descriptions.Item label={getIn18Text('CHUANGJIANSHIJIAN')}>{taskDetail.createTime || '-'}</Descriptions.Item>
          <Descriptions.Item label={getIn18Text('GENGXINSHIJIAN')}>{taskDetail.recentlyUpdateTime || '-'}</Descriptions.Item>
          <Descriptions.Item label={getIn18Text('ZUIJINZHIXINGSHIJIAN')}>{taskDetail.recentlyExecTime || '-'}</Descriptions.Item>
        </Descriptions>
      </div>
      <Modal title={getIn18Text('YOUJIANNEIRONG')} zIndex={9999} footer={null} visible={isModalVisible} centered onOk={handleOk} onCancel={handleCancel}>
        <div style={{ pointerEvents: 'none', cursor: 'default' }}>
          {taskDetail ? (
            <>
              <div className={style.previewEmailSubject}>{taskDetail.execAction.actionContent?.sendEdmEmailAction?.edmEmailSubjects[0] || getIn18Text('WUZHUTI')}</div>
              <div
                dangerouslySetInnerHTML={{
                  __html: taskDetail.execAction.actionContent?.sendEdmEmailAction?.emailContent || '-',
                }}
              />
            </>
          ) : (
            '-'
          )}
        </div>
      </Modal>
    </div>
  );
};
export default TaskBasicInfo;
