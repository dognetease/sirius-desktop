import React, { useState, useMemo } from 'react';
import { Popover, PopoverProps, Tag, Skeleton } from 'antd';
import {
  apiHolder,
  apis,
  AutoMarketApi,
  AutoMarketTaskDetail,
  AutoMarketTaskAction,
  AutoMarketTaskActionType,
  AutoMarketTaskCondition,
  AutoMarketTaskTriggerConditionType,
  AutoMarketTaskTriggerCondition,
  AutoMarketEmailOpTypeName,
  AutoMarketEmailOpType,
  AutoMarketTaskActionContent,
  AutoMarketTaskTruckAction,
} from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { getTransText } from '@/components/util/translate';
import classnames from 'classnames';
import { AddressRuleDetail } from '../addressRuleDetail';
import { UpdateCustomerInfo } from './updateCustomerInfo';
import style from './style.module.scss';
import { getIn18Text } from 'api';

/**
 * 传入detail和taskId都可以，优先使用detail
 * 只传入taskId时 自动调用详情接口
 */
interface ActionDetailProps extends PopoverProps {
  detail?: AutoMarketTaskDetail;
  taskId?: string | number | null;
}

const autoMarketApi = apiHolder.api.requireLogicalApi(apis.autoMarketApiImpl) as unknown as AutoMarketApi;
export const ActionDetail: React.FC<ActionDetailProps> = props => {
  const { detail, taskId, ...otherProps } = props;
  const [detailData, setDetailData] = useState<AutoMarketTaskDetail>();
  const [loading, setLoading] = useState(false);
  const [emailPreview, setEmailPreview] = useState<{ visible: boolean; action: AutoMarketTaskAction | null }>({ visible: false, action: null });

  function onVisibleChange(visible: boolean) {
    if (visible && taskId && !detail && !detailData) {
      getTaskDetail(taskId as string);
    }
  }

  const getTaskDetail = async (taskId: string) => {
    try {
      setLoading(true);
      const data = await autoMarketApi.getTaskDetail({ taskId });
      setDetailData(data);
    } finally {
      setLoading(false);
    }
  };

  const taskDetail = useMemo(() => {
    if (detail) {
      return detail;
    }

    return detailData;
  }, [detail, detailData]);

  function getHtmlText(htmlStr: string): string {
    const div = document.createElement('div');
    div.innerHTML = htmlStr;
    return div?.innerText || '';
  }

  function getRule(triggerCondition: AutoMarketTaskCondition): string {
    if (!triggerCondition) {
      return '';
    }
    const conditionContent = triggerCondition?.conditionContent || {};
    switch (triggerCondition.conditionType) {
      case AutoMarketTaskTriggerConditionType.NO:
        return '';
      case AutoMarketTaskTriggerConditionType.EMAIL:
        const { emailOpDays, emailOpType } = conditionContent as AutoMarketTaskTriggerCondition.EMAIL;
        switch (emailOpType) {
          case AutoMarketEmailOpType.NO_CONDICTION:
            return `${emailOpDays || '1'}天后${AutoMarketEmailOpTypeName[emailOpType]}，`;
          case AutoMarketEmailOpType.OPEN:
            return `${AutoMarketEmailOpTypeName[emailOpType]}，`;
          case AutoMarketEmailOpType.REPLY:
            if (emailOpDays) {
              return `${emailOpDays}天内${AutoMarketEmailOpTypeName[emailOpType]}，`;
            }
            return `${AutoMarketEmailOpTypeName[emailOpType]}，`;
          case AutoMarketEmailOpType.NOT_REPLY:
            return `${emailOpDays}天内${AutoMarketEmailOpTypeName[emailOpType]}，`;
          case AutoMarketEmailOpType.NOT_OPEN:
            return `${emailOpDays}天内${AutoMarketEmailOpTypeName[emailOpType]}，`;
          default:
            return '';
        }
      case AutoMarketTaskTriggerConditionType.DATE:
      default:
        return '';
    }
  }

  function getActionInfo(action: AutoMarketTaskAction) {
    const { actionName, actionType } = action || {};
    const triggerCondition = action?.triggerConditionVo.triggerConditionList?.[0] || {};
    let actionRuleName = '';
    let actionRuleDesc: any = '';
    let showQuoteTag = false;
    let showAIContentTag = false;
    const triggerRule = getRule(triggerCondition);
    switch (actionType) {
      case AutoMarketTaskActionType.SEND_EDM:
        const actionContent = action?.actionContent?.sendEdmEmailAction || ({} as AutoMarketTaskActionContent.SEND_EDM);
        if (actionContent.replyEdmEmail) {
          showQuoteTag = true;
        }

        if (actionContent.multipleContentInfo) {
          showAIContentTag = true;
        }
        actionRuleName = actionContent?.edmEmailSubjects?.[0] || '';
        actionRuleDesc = getHtmlText(actionContent?.emailContent || '');
        break;
      case AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP:
        const groupActionContent = action?.actionContent?.updateContactGroupInfoActionList || ([] as AutoMarketTaskActionContent.UPDATE_ADDRESS_GROUP);
        const updateRule = groupActionContent?.[0] || {};
        actionRuleName = String(updateRule.opType) === '0' ? getTransText('TIANJIAFENZU') : getTransText('ZHUANYIFENZU');
        actionRuleDesc = <AddressRuleDetail type="group" ids={updateRule.groupIds as number[]} />;
        break;

      case AutoMarketTaskActionType.UPDATE_CLUE:
        actionRuleDesc = '--';
        break;

      case AutoMarketTaskActionType.UPDATE_CUSTOMER:
        const updateCustomerContent = action?.actionContent?.updateCustomerInfoActionList || ([] as AutoMarketTaskActionContent.UPDATE_CUSTOMER);
        actionRuleDesc = <UpdateCustomerInfo rules={updateCustomerContent} />;
        break;
    }

    return {
      actionName,
      actionRuleName,
      actionRuleDesc,
      showQuoteTag,
      triggerRule,
      showAIContentTag,
      actionType,
    };
  }

  function renderAction(actionLayer: AutoMarketTaskTruckAction, index: number) {
    const { truckAction, branchAction } = actionLayer || {};

    const truckActionInfo = getActionInfo(truckAction);
    const branchActionInfo = getActionInfo(branchAction);
    const hasBranch = Boolean(branchAction?.actionType);

    return (
      <div className={style.action}>
        <div className={style.stepMark}>
          <div className={style.stepMarkIndex}>{index}</div>
        </div>
        <div className={style.actionContent}>
          <div className={classnames(style.actionName)}>{index === 1 ? getTransText('ZHIXINGDONGZUO') : getTransText('ZHUIJIADONGZUO')}</div>

          {/* 主线动做 */}
          <div className={style.actionRule}>
            <div className={style.actionTriggerName}>
              {hasBranch && <Tag className={classnames(style.tag, style.actionTag)}>{getTransText('DONGZUO')}1</Tag>}
              {truckActionInfo.triggerRule}
              {truckActionInfo.actionName || '--'}
            </div>
            <div className={classnames(style.actionRuleNameWrapper)}>
              <div title={truckActionInfo.actionRuleName} className={classnames(style.actionRuleName, style.ellipsis, style.bold)}>
                {truckActionInfo.actionRuleName}
              </div>
              <div className={classnames(style.actionRuleTags)}>
                {truckActionInfo.showQuoteTag && <Tag className={style.tag}>{getTransText('QuoteFromoOiginal')}</Tag>}
                {truckActionInfo.showAIContentTag && <Tag className={classnames(style.tag, style.aiTag)}>{getTransText('MultipleVersionsEmail')}</Tag>}
              </div>
              {truckActionInfo.actionType === AutoMarketTaskActionType.SEND_EDM ? (
                <span className={style.btnLink} onClick={() => setEmailPreview({ visible: true, action: truckAction })}>
                  {getTransText('CHAKAN')}
                </span>
              ) : (
                ''
              )}
            </div>
            <div className={classnames(style.actionRuleDesc, style.ellipsis)}>{truckActionInfo.actionRuleDesc}</div>
          </div>

          {/* 分支动作 */}
          {hasBranch ? (
            <div className={style.actionRule}>
              <div className={style.actionTriggerName}>
                {hasBranch && <Tag className={classnames(style.tag, style.actionTag)}>{getTransText('DONGZUO')}2</Tag>}
                {branchActionInfo.triggerRule}
                {branchActionInfo.actionName || '--'}
              </div>
              <div className={classnames(style.actionRuleNameWrapper)}>
                <div title={branchActionInfo.actionRuleName} className={classnames(style.actionRuleName, style.ellipsis, style.bold)}>
                  {branchActionInfo.actionRuleName}
                </div>
                <div className={classnames(style.actionRuleTags)}>
                  {branchActionInfo.showQuoteTag && <Tag className={style.tag}>{getTransText('QuoteFromoOiginal')}</Tag>}
                  {branchActionInfo.showAIContentTag && <Tag className={classnames(style.tag, style.aiTag)}>{getTransText('MultipleVersionsEmail')}</Tag>}
                </div>
                {branchActionInfo.actionType === AutoMarketTaskActionType.SEND_EDM ? (
                  <span className={style.btnLink} onClick={() => setEmailPreview({ visible: true, action: branchAction })}>
                    {getTransText('CHAKAN')}
                  </span>
                ) : (
                  ''
                )}
              </div>
              <div className={classnames(style.actionRuleDesc, style.ellipsis)}>{branchActionInfo.actionRuleDesc}</div>
            </div>
          ) : (
            ''
          )}
        </div>
      </div>
    );
  }

  function renderEmailPreview() {
    const { action } = emailPreview || {};
    if (!action) {
      return '';
    }

    return (
      <>
        <div className={style.previewEmailSubject}>{action?.actionContent?.sendEdmEmailAction?.edmEmailSubjects[0] || getTransText('WUZHUTI')}</div>
        <div
          dangerouslySetInnerHTML={{
            __html: action?.actionContent?.sendEdmEmailAction?.emailContent || '-',
          }}
        />
      </>
    );
  }

  function renderContent() {
    if (!taskDetail) {
      return null;
    }

    const actionList = [
      {
        truckAction: taskDetail.execAction,
        branchAction: null as unknown as AutoMarketTaskAction,
      },
      ...taskDetail.additionalActionLayerList.filter(action => Boolean(action?.truckAction?.actionType)),
    ];

    return (
      <>
        <div className={style.actionList}>
          <Skeleton loading={loading}>
            <div className={style.title}>{getIn18Text('DONGZUO')}</div>
            {actionList.map((action, index) => renderAction(action, index + 1))}
          </Skeleton>
        </div>
        <Modal
          title={getTransText('YOUJIANNEIRONG')}
          zIndex={9999}
          footer={null}
          visible={emailPreview.visible}
          centered
          onOk={() => setEmailPreview({ visible: false, action: null })}
          onCancel={() => setEmailPreview({ visible: false, action: null })}
        >
          <div style={{ pointerEvents: 'none', cursor: 'default' }}>{renderEmailPreview()}</div>
        </Modal>
      </>
    );
  }

  return (
    <Popover
      // visible={true}
      {...otherProps}
      content={renderContent()}
      onVisibleChange={onVisibleChange}
    >
      {props.children}
    </Popover>
  );
};
