import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Button, Divider, Form } from 'antd';
import cloneDeep from 'lodash/cloneDeep';
import lodashGet from 'lodash/get';
import {
  MailConfApi,
  apis,
  apiHolder as api,
  SystemApi,
  MailApi,
  MailBoxModel,
  ResponseMailClassify,
  MailClassifyRuleBehavior,
  MailClassifyRuleConditionNormal,
  MailClassifyRuleCondition,
  MailClassifyRuleFlags,
  DataTrackerApi,
  resultObject,
  AccountApi,
  util,
} from 'api';
import ErrorBoundary from '@web-common/hooks/ErrorBoundary';
import classnames from 'classnames';
import moment from 'moment';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { useActions, useAppSelector, MailClassifyActions } from '@web-common/state/createStore';
import ArrowLeftIcon from '@web-common/components/UI/Icons/svgs/disk/ArrowLeft';
import { safeDecodeURIComponent } from '@web-common/utils/utils';
import { ReactComponent as DeleteIcon } from '@/images/icons/modal_close_temp.svg';
import styles from './classify-content.module.scss';
import { CancelPopover } from './cancel-popover';
import { EnableAction } from './enableAction';
import { ConditionAction } from './conditionAction';
import { MailAction } from './mailAction';
import { ApplyAction } from './applyAction';
import ClassifyList from './ClassifyList/ClassifyList';
import { getIn18Text } from 'api';

const MailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
interface ClassifyContentModalProps {}
const defaultRule: ResponseMailClassify = {
  disabled: false,
  condictions: [],
  actions: [],
};
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const systemApi: SystemApi = api.api.getSystemApi();
export const ClassifyContentModal = (props: ClassifyContentModalProps) => {
  const [form] = Form.useForm();
  const optionsList = (systemApi.getCurrentUser()?.prop?.accountAlias || []) as string[];
  const { showMailClassifyModal, mailFolderId, mailSender, mailTitle, mailTag } = useAppSelector(state => state.mailClassifyReducer);

  // 弹窗类型
  const [modalType, setModalType] = useState<'list' | 'edit'>('list');
  const { changeShowClassifyModal, setMailFolderId, setMailTitle, setMailSender, setMailTag } = useActions(MailClassifyActions);
  const [loading, setLoading] = useState<boolean>(false);
  const [closeAfterEdit, setCloseAfterEdit] = useState<boolean>(false);
  const [showCancelPopover, setShowCancelPopover] = useState<boolean>(false);
  const [isFirst, setIsFirst] = useState<boolean>(true); // 是否第一次进入
  // 从入口打开
  const [isEntrance, setIsEntrance] = useState<boolean>(false);
  useEffect(() => {
    setIsFirst(showMailClassifyModal);
  }, [showMailClassifyModal]);
  // 编辑弹窗的数据整理
  const [editData, setEditData] = useState<ResponseMailClassify>(defaultRule);
  // 编辑弹窗的条件规则
  const [conditionData, setConditionData] = useState<MailClassifyRuleCondition[]>([]);
  // 编辑弹窗的账号规则单独整理出来
  const [accountData, setAccountData] = useState<string[]>([]);
  // 选择拒收后不可选中保存且对历史邮件生效
  const [enableReject, setEnableReject] = useState<boolean>(false);
  // 子窗口弹出 父窗口临时隐藏
  const [tempVisible, setTempVisible] = useState<boolean>(true);
  // 文件夹扁平结构
  const [mailBoxs, setmailBoxs] = useState<MailBoxModel[]>([]);
  // 文件夹/标签名称（文件夹和标签入口进入需要展示某文件夹/标签的分类规则）
  const [titleName, setTitleName] = useState<string>('');
  // 返回列表
  const closeModal = (values?: Record<string, any>) => {
    // 数据打点
    if (values) {
      const logParams: resultObject = {};
      // 页面来源
      if (mailFolderId || mailSender || mailTitle || mailTag) {
        if (mailFolderId) {
          // 文件夹操作
          logParams.page_sorce = 'folder';
        } else if (mailTag) {
          // 标签操作
          logParams.page_sorce = 'tags';
        } else {
          // 单封邮件操作
          logParams.page_sorce = 'singleMail';
        }
      } else {
        // 邮箱设置
        logParams.page_sorce = 'setting';
      }
      // 生效模式
      logParams.effect_mode = values.enable;
      // rules_mode 条件模式
      logParams.rules_mode = values.operator;
      // rules_type 条件类型
      logParams.rules_type = Array.from(new Set(values.condictions.map((item: MailClassifyRuleConditionNormal) => item.field))).join(',');
      // action_type 动作类型
      if (values.action_type === 'reject') {
        logParams.action_type = values.action_type;
      } else {
        const { action_type_flags, action_type_move, action_type_read, action_type_reply, action_type_tags, action_type_top } = values;
        const actions = [];
        if (action_type_flags) {
          actions.push('red_flag');
        }
        if (action_type_top) {
          actions.push('top');
        }
        if (action_type_read) {
          actions.push('read');
        }
        if (action_type_tags) {
          actions.push('tags');
        }
        if (action_type_move) {
          actions.push('move');
        }
        if (action_type_reply) {
          actions.push('reply');
        }
        logParams.action_type = actions.join(',');
      }
      // past_email_effect_mode 是否对历史生效
      logParams.past_email_effect_mode = values?.enable?.includes('effectHistoryMail') ? 1 : 0;
      trackApi.track('pcMail_click_savebutton_mailClassificationNewPage', logParams);
    }
    setModalType('list');
    if (closeAfterEdit) {
      onClose();
    }
  };
  // 如果有内容更改，弹出关闭挽留弹窗
  const beforeCloseModal = () => {
    if (!showCancelPopover) {
      closeModal();
    }
  };
  const fillSubmitConditionData = (values: Record<string, any>) => {
    let conditions: MailClassifyRuleCondition[] = [];
    const defaultOperandList = optionsList.length > 0 ? optionsList : [systemApi.getCurrentUser()?.id];
    conditions = values.condictions.map((item: MailClassifyRuleConditionNormal) => {
      if (Array.isArray(item.operand)) {
        return {
          ...item,
          flagOperatorOr: values.operator === 'or',
          operand: item.operand.map(itm => (typeof itm === 'string' ? itm.trim() : itm.email)),
          ignoreCase: !['accounts'].includes(item.field),
        };
      }
      return { ...item };
    });
    conditions.push({
      field: 'accounts',
      ignoreCase: true,
      operator: '',
      operand: values?.accounts ? [...values.accounts] : defaultOperandList,
    });
    return conditions;
  };
  const fillSubmitActionData = (values: Record<string, any>) => {
    const {
      action_type,
      action_type_flags,
      action_type_move,
      action_type_read,
      action_type_reply,
      action_reply,
      action_choose_folder,
      action_type_tags,
      action_type_top,
      action_tags,
      action_forward,
    } = values;
    const actions: MailClassifyRuleBehavior[] = [];
    if (action_type === 'normal') {
      // 设置标记
      if (action_type_flags || action_type_top || action_type_read) {
        const flagsVal: MailClassifyRuleFlags = {};
        if (action_type_flags) {
          flagsVal.label0 = 1;
        }
        if (action_type_top) {
          flagsVal.top = !!action_type_top;
        }
        if (action_type_read) {
          flagsVal.read = !!action_type_read;
        }
        actions.push({
          disabled: false,
          type: 'flags',
          value: flagsVal,
        });
      }
      if (action_type_tags) {
        actions.push({
          type: 'tags',
          value: action_tags,
        });
      }
      if (action_type_move) {
        actions.push({
          disabled: false,
          type: 'move',
          target: action_choose_folder,
        });
      }
      if (action_type_reply) {
        actions.push({
          type: 'reply',
          content: action_reply.trim(),
        });
      }
    } else if (action_type === 'forward') {
      const forwardTarget = action_forward ? action_forward[0]?.email : '';
      actions.push({ type: 'forward', target: forwardTarget, keepLocal: true });
    } else {
      actions.push({ type: 'reject', content: 'Reject' });
    }
    if (values.enable.includes('effectHistoryMail')) {
      actions.push({ disabled: false, type: 'history' });
    }
    return actions;
  };
  const forwardValidation = async (values: Record<string, any>) => {
    if (!values.action_forward || !values.action_forward[0].email || !values.action_forward_validation) {
      return true;
    }
    const res = await accountApi.doCheckVerificationCode(values.action_forward_validation);
    if (!res.success) {
      form.setFields([
        {
          name: 'action_forward_validation',
          errors: ['验证码错误'],
        },
      ]);
    }
    return res.success;
  };
  // 历史邮件生效
  const handleEffectHistoryMail = (id: number, values: Record<string, any>) => {
    MailConfApi.effectHistoryMail(id).then(res => {
      if (res?.success) {
        closeModal(values);
        SiriusMessage.success({ content: getIn18Text('GUIZEBAOCUNCHENG11') });
      } else {
        SiriusMessage.error({ content: `规则保存成功！${res.title}` });
      }
      setLoading(false);
    });
  };
  // 点击保存
  const saveEditData = async (values: Record<string, any>) => {
    if (loading || !showCancelPopover) {
      return;
    }
    setLoading(true);
    // 如果选中了转发其他邮箱，先进行验证码验证
    const forwardValidationSuccess = await forwardValidation(values);
    if (!forwardValidationSuccess) {
      setLoading(false);
      return;
    }
    // 整理保存接口参数
    const reqData: ResponseMailClassify = {
      name: editData.name || `sirius ${moment().format('YYYY-MM-DD HH:mm:ss')}`,
      continue: editData.continue || true,
      // 立即启用
      disabled: !values.enable.includes('effectMail'),
    };
    // id、_id、name、continue编辑时才有
    editData.id && (reqData.id = editData.id);
    editData._id && (reqData._id = editData._id);
    // 条件规则及执行规则
    reqData.condictions = fillSubmitConditionData(values);
    reqData.actions = fillSubmitActionData(values);
    const interfaceName = editData.id ? 'editMailClassifyRule' : 'addMailClassifyRule';
    // 接口调用
    MailConfApi[interfaceName]([reqData]).then(response => {
      if (response?.success) {
        const id = editData?.id || lodashGet(response, 'data.0', '');
        if (id && values?.enable?.includes('effectHistoryMail') && !enableReject) {
          handleEffectHistoryMail(id, values);
        } else {
          closeModal(values);
          setLoading(false);
          SiriusMessage.success({ content: response?.title });
        }
      } else {
        setLoading(false);
        SiriusMessage.error({ content: response?.title });
      }
    });
  };
  // 新建时判断是否是文件夹入口进入，是的话需要回填文件夹
  const createRule = () => {
    const rule = cloneDeep(defaultRule);
    if (mailFolderId) {
      rule.actions?.push({
        disabled: false,
        type: 'move',
        target: mailFolderId,
      });
    }
    if (mailTag) {
      rule.actions?.push({
        type: 'tags',
        value: [mailTag],
      });
    }
    editRule(rule);
  };
  /**
   * 列表编辑、新建、入口跳转统一使用这个方法
   * @param initRule
   * @param _needClose 编辑/新增弹窗 在 提交成功或取消后是否直接关闭弹窗，用于入口跳转进入
   */
  const editRule = (initRule: ResponseMailClassify = defaultRule, _needClose: boolean = false) => {
    setEditData(initRule);
    const condition = initRule?.condictions?.filter(item => item.field !== 'accounts') || [];
    const operand = initRule.condictions?.find(item => item?.field === 'accounts')?.operand || [];
    setAccountData(operand as string[]);
    setConditionData(condition);
    setCloseAfterEdit(_needClose && !mailFolderId && !mailTag);
    const existReject = initRule?.actions?.some(item => item.type === 'reject');
    setEnableReject(!!existReject);
    // 文件夹入口进入，需要在列表判断存在则展示列表，不存在则展示新建
    if ((mailFolderId || mailTag) && _needClose) {
      return;
    }
    setModalType('edit');
  };
  useEffect(() => {
    // 跳转编辑页面三种方式，数据优先级为 列表编辑 > 新建 > 入口跳转
    // const type = getParameterByName('type') || '';
    const title = mailTitle; // getParameterByName('title') || '';
    const senderEmail = mailSender; // getParameterByName('senderEmail') || '';
    const fid = mailFolderId; // getParameterByName('fid') || '';
    // const fromEntrance = ['classifiedSetting', 'classifiedFolderSetting'].includes(type);
    if (!title && !senderEmail && !fid && !mailTag) {
      return;
    }
    const initRule: ResponseMailClassify = {};
    if (senderEmail) {
      initRule.condictions = initRule.condictions || [];
      initRule.condictions.push({
        field: 'from',
        flagOperatorOr: false,
        operator: 'contains',
        operand: [senderEmail],
      });
    }
    if (title) {
      initRule.condictions = initRule.condictions || [];
      initRule.condictions.push({
        field: 'subject',
        flagOperatorOr: false,
        operator: 'contains',
        operand: [safeDecodeURIComponent(title)],
      });
      setIsEntrance(true);
    }
    if (fid) {
      initRule.actions = initRule.actions || [];
      initRule.actions.push({
        disabled: false,
        type: 'move',
        target: fid,
      });
    }
    if (mailTag) {
      initRule.actions = initRule.actions || [];
      initRule.actions.push({
        type: 'tags',
        value: [mailTag],
      });
    }
    editRule(initRule, true);
    changeShowClassifyModal(true);
  }, [mailFolderId, mailSender, mailTitle, mailTag]);
  const getMailBox = async () => {
    const res = await mailApi.doListMailBox(true);
    // 树状结构 扁平化一下
    const data = [...res];
    const resFlat: MailBoxModel[] = [];
    while (data.length) {
      const cur = data.shift();
      if (!cur) continue;
      if (cur.children?.length) {
        data.push(...cur.children);
      }
      resFlat.push(cur);
    }
    // 取到后，如果从文件夹入口进入，modal头部展示相应文案
    const folderName = resFlat.find(item => item.entry.mailBoxId === mailFolderId)?.entry?.mailBoxName;
    setTitleName(folderName || mailTag);
    setmailBoxs(resFlat);
  };
  useEffect(() => {
    if (!showMailClassifyModal) {
      return;
    }
    if (modalType === 'list') {
      setShowCancelPopover(false);
      // 获取文件夹树的扁平结构，用于列表展示文件夹名称
      getMailBox();
    }
  }, [modalType, showMailClassifyModal]);
  const onSubModalVisible = useCallback(visible => {
    setTempVisible(!visible);
  }, []);
  const onClose = useCallback(() => {
    setMailFolderId('');
    setMailSender('');
    setMailTitle('');
    setMailTag('');
    setEditData(defaultRule);
    setConditionData([]);
    setAccountData([]);
    setEnableReject(false);
    changeShowClassifyModal(false);
  }, []);
  const onActionSelect = useCallback(() => {
    if (!showCancelPopover) {
      setShowCancelPopover(true);
    }
  }, []);
  const ClassifyListMemo = useMemo(() => ClassifyList, [editRule, mailBoxs]);
  const enableList = [];
  !editData?.disabled && enableList.push('effectMail');
  editData?.actions?.find(item => item.type === 'history') && enableList.push('effectHistoryMail');
  return (
    <Modal
      wrapClassName={classnames(styles.classifyContent, { [styles.hide]: showMailClassifyModal ? !tempVisible : false })}
      bodyStyle={{ padding: 0, height: '100%', overflow: 'hidden' }}
      visible={showMailClassifyModal}
      footer={null}
      destroyOnClose
      maskClosable={false}
      closeIcon={<DeleteIcon className="dark-invert" />}
      onCancel={onClose}
      // TODO 点击右上角关闭没有回调hooks 目前清不了状态
      closable={modalType === 'list' || closeAfterEdit}
      afterClose={closeModal}
      // className="ant-allow-dark"
    >
      <ErrorBoundary
        name="classify-content-modal"
        onReset={() => {
          util.reload();
          return false;
        }}
      >
        {loading && <div className={styles.classifyContentLoading} />}
        {modalType === 'edit' ? (
          <Form
            form={form}
            onFinish={saveEditData}
            onValuesChange={(changedValues, allValues) => {
              if (changedValues.action_type === 'reject') {
                setEnableReject(true);
              } else if (changedValues.action_type === 'normal') {
                setEnableReject(false);
              }
              !showCancelPopover && setShowCancelPopover(true);
            }}
          >
            <div className={styles.classifyContentHead}>
              <CancelPopover disable={closeAfterEdit || !showCancelPopover} onConfirm={() => closeModal()} placement="bottomLeft">
                <div
                  className={classnames(styles.classifyContentBack, { [styles.classifyContentNoCursor]: closeAfterEdit })}
                  onClick={() => {
                    if (!closeAfterEdit) {
                      beforeCloseModal();
                    }
                  }}
                >
                  {!closeAfterEdit ? <ArrowLeftIcon className="dark-invert" /> : ''}
                  <span className={styles.classifyContentTitle}>
                    {editData.id ? getIn18Text('BIANJI') : getIn18Text('XINJIAN')}
                    {getIn18Text('FENLEIGUIZE')}
                  </span>
                </div>
              </CancelPopover>
            </div>
            <div className={classnames(styles.classifyContentDetail, styles.classifyContentEditDetail)}>
              {optionsList.length > 1 && (
                <>
                  <ApplyAction form={form} operand={accountData} optionsList={optionsList} />
                  <Divider className={styles.classifyContentDetailDivider} />
                </>
              )}
              <ConditionAction
                form={form}
                operator={editData.condictions?.some(item => item?.flagOperatorOr) ? 'or' : 'and'}
                rules={conditionData}
                // 入口进入
                isEntrance={isEntrance}
              />
              <MailAction actions={editData?.actions} onSubModalVisible={onSubModalVisible} onActionSelect={onActionSelect} form={form} />
            </div>
            <Divider />
            <div className={styles.classifyContentEditFoot}>
              <EnableAction form={form} enable={enableList} isDisable={enableReject} />
              <div className={styles.classifyContentBtns}>
                <CancelPopover disable={!showCancelPopover} onConfirm={() => closeModal()} placement="bottomLeft">
                  <Button onClick={() => beforeCloseModal()}>{getIn18Text('QUXIAO')}</Button>
                </CancelPopover>
                <Form.Item>
                  <Button disabled={!showCancelPopover} type="primary" htmlType="submit" loading={loading}>
                    {getIn18Text('BAOCUN')}
                  </Button>
                </Form.Item>
              </div>
            </div>
          </Form>
        ) : (
          <>
            <div className={styles.classifyContentHead}>
              <p className={styles.classifyContentTitle}>
                {titleName ? (
                  <span className={styles.classifyContentTitleFolder}>
                    <span>{titleName}</span>
                    <span>的分类规则</span>
                  </span>
                ) : (
                  getIn18Text('FENLEIGUIZE')
                )}
              </p>
              <p className={styles.classifyContentDesc}>{getIn18Text('GUIZEJIANGCONGXIA')}</p>
            </div>
            <div className={styles.classifyContentDetail}>
              <ClassifyListMemo
                setListShow={show => {
                  setModalType(show ? 'list' : 'edit');
                  setIsFirst(false);
                }}
                editRule={editRule}
                mailBoxs={mailBoxs}
                isFirst={isFirst}
              />
            </div>
            <Divider />
            <div className={styles.classifyContentCreateFoot}>
              <Button type="primary" onClick={() => createRule()}>
                {getIn18Text('XINJIANFENLEIGUI')}
              </Button>
            </div>
          </>
        )}
      </ErrorBoundary>
    </Modal>
  );
};
