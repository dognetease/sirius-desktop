/*
 * @Author: your name
 * @Date: 2022-03-21 16:42:40
 * @LastEditTime: 2022-03-24 15:16:25
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web-setting/src/Mail/components/CustomMailClassify/ClassifyList/ClassifyItem.tsx
 */
import React, { useState, useEffect, useRef, ReactNode, useMemo } from 'react';
import { Tooltip, Popover, Modal } from 'antd';
import classnames from 'classnames';
import SiriusModal, { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
import {
  MailConfApi,
  apis,
  apiHolder as api,
  ResponseMailClassify,
  MailClassifyRuleConditionAccounts,
  MailClassifyRuleConditionNormal,
  MailClassifyRuleFlags,
  MailBoxModel,
  MailClassifyRuleBehavior,
  ContactApi,
  OrgApi,
  reDefinedColorListNew,
} from 'api';
import IconCard from '@web-common/components/UI/IconCard/index';
import ErrorIcon from '@web-common/components/UI/Icons/svgs/ErrorSvg';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import update from 'immutability-helper';
import { useAppSelector } from '@web-common/state/createStore';
import listStyle from './classifyList.module.scss';
import { getIn18Text } from 'api';
import { getTreeStatesByAccount } from '@web-mail/util';

export interface commonProps {
  forwardedRef?: React.LegacyRef<HTMLDivElement>;
  data: ResponseMailClassify;
  editRule: (initRule: ResponseMailClassify) => void;
  getListData: () => void;
  deleteClassifyItem: () => void;
  mailBoxs: MailBoxModel[];
  emailContactMap: {
    [key: string]: string;
  };
}
const MailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
const ClassifyItem: React.FC<commonProps> = props => {
  const { emailContactMap, data, editRule, getListData, mailBoxs, deleteClassifyItem } = props;
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [ruleDisabledText, setRuleDisabledText] = useState('');
  // const mailTagList = useAppSelector(state => state.mailReducer.mailTagList);
  const mailTreeStateMap = useAppSelector(state => state.mailReducer.mailTreeStateMap);
  const mailTagList = useMemo(() => {
    const folderState = getTreeStatesByAccount(mailTreeStateMap, '');
    if (folderState && folderState?.mailTagList) {
      return folderState?.mailTagList;
    }
    return [];
  }, [mailTreeStateMap]);

  const popClickRef = useRef(null);
  const editorBtnRef = useRef(null);
  const [tagColors, setTagColors] = useState<string[]>([]);
  const [tagFontColors, setTagFontColors] = useState<string[]>([]);
  const [actionFail, setActionFail] = useState(false);
  const { actions = [], condictions = [], disabled: unStarted } = data;
  const accounts = condictions.find(item => item.field === 'accounts') as MailClassifyRuleConditionAccounts;
  const from = condictions.filter(item => item.field === 'from' && item.operator === 'contains') as MailClassifyRuleConditionNormal[];
  const fromExcludes = condictions.filter(item => item.field === 'from' && item.operator === 'excludes') as MailClassifyRuleConditionNormal[];
  const recipients = condictions.filter(item => item.field === 'recipients' && item.operator === 'contains') as MailClassifyRuleConditionNormal[];
  const recipientsExcludes = condictions.filter(item => item.field === 'recipients' && item.operator === 'excludes') as MailClassifyRuleConditionNormal[];
  const to = condictions.filter(item => item.field === 'to' && item.operator === 'contains') as MailClassifyRuleConditionNormal[];
  const toExcludes = condictions.filter(item => item.field === 'to' && item.operator === 'excludes') as MailClassifyRuleConditionNormal[];
  const subject = condictions.filter(item => item.field === 'subject' && item.operator === 'contains') as MailClassifyRuleConditionNormal[];
  const subjectExcludes = condictions.filter(item => item.field === 'subject' && item.operator === 'excludes') as MailClassifyRuleConditionNormal[];
  const attachmentName = condictions.filter(item => item.field === 'attachmentName' && item.operator === 'contains') as MailClassifyRuleConditionNormal[];
  const attachmentNameExcludes = condictions.filter(item => item.field === 'attachmentName' && item.operator === 'excludes') as MailClassifyRuleConditionNormal[];
  const cc = condictions.filter(item => item.field === 'cc' && item.operator === 'contains') as MailClassifyRuleConditionNormal[];
  const ccExcludes = condictions.filter(item => item.field === 'cc' && item.operator === 'excludes') as MailClassifyRuleConditionNormal[];
  const flagOperatorOr = condictions.some(item => item.flagOperatorOr) ? getIn18Text('HUO') : getIn18Text('QIE');
  const ruleContent = [
    { data: from, title: '[发件人] 包含', className: 'contact' },
    { data: fromExcludes, title: '[发件人] 不包含', className: 'contact' },
    { data: recipients, title: getIn18Text('[SHOUJIANRENHUO11'), className: 'contact' },
    { data: recipientsExcludes, title: getIn18Text('[SHOUJIANRENHUO'), className: 'contact' },
    { data: to, title: '[收件人] 包含', className: 'contact' },
    { data: toExcludes, title: '[收件人] 不包含', className: 'contact' },
    { data: cc, title: '[抄送人] 包含', className: 'contact' },
    { data: ccExcludes, title: '[抄送人] 不包含', className: 'contact' },
    { data: subject, title: '[主题] 包含', className: 'subject' },
    { data: subjectExcludes, title: '[主题] 不包含', className: 'subject' },
    { data: attachmentName, title: '[附件名称] 包含', className: 'attachmentName' },
    { data: attachmentNameExcludes, title: '[附件名称] 不包含', className: 'attachmentName' },
  ]
    .filter(i => i.data.length)
    .reduce((prev, { data, title, className }) => {
      const list = data.map(item => ({ value: item.operand, title, className }));
      return [...prev, ...list];
    }, []);
  const tags = actions.find(item => item.type === 'tags');
  const reply = actions.find(item => item.type === 'reply');
  const flags = actions.find(item => item.type === 'flags');
  const move = actions.find(item => item.type === 'move');
  const forward = actions.find(item => item.type === 'forward');
  const reject = actions.find(item => item.type === 'reject');
  const rulePhase = [
    {
      data: tags,
      title: '[添加标签]',
      className: 'tag',
      id: 'tags',
    },
    {
      data: forward,
      title: getIn18Text('[ZHUANFADAOQI'),
      className: 'contact',
      id: 'forward',
    },
    {
      data: reply,
      title: '[自动回复] ',
      className: '',
      id: 'reply',
    },
    {
      data: move,
      title: '[移动到] ',
      className: '',
      id: 'move',
    },
    {
      data: reject,
      title: '[拒收]',
      className: '',
      id: 'reject',
    },
    {
      data: (flags?.value as MailClassifyRuleFlags)?.label0,
      title: '[添加红旗]',
      className: '',
      id: 'label0',
    },
    {
      data: (flags?.value as MailClassifyRuleFlags)?.read,
      title: '[标为已读]',
      className: '',
      id: 'read',
    },
    {
      data: (flags?.value as MailClassifyRuleFlags)?.top,
      title: getIn18Text('[SHEWEIZHIDING'),
      className: '',
      id: 'top',
    },
  ]
    .filter(i => i.data)
    .map(({ data, title, className, id }) => {
      let res: ReactNode = title;
      if (id === 'move') {
        const targetId = (data as MailClassifyRuleBehavior).target;
        const targetName = mailBoxs.find(item => item.entry.mailBoxId === +(targetId as string))?.entry?.mailBoxName;
        res = (
          <>
            {title}
            {targetName}
          </>
        );
      }
      if (id === 'forward') {
        res = (
          <>
            {title}
            <span className={classnames(listStyle.contact)}>
              <Tooltip title={data?.target}>{emailContactMap[data?.target] || data?.target}</Tooltip>
            </span>
          </>
        );
      }
      if (id === 'reply') {
        res = (
          <>
            {title}
            {`“${(data as MailClassifyRuleBehavior).content}”`}
          </>
        );
      }
      if (id === 'tags') {
        res = (
          <>
            {title}
            {((data as MailClassifyRuleBehavior).value as string[])?.map((val, index) => (
              <span className={classnames(listStyle.tag)} style={{ color: tagFontColors[index], backgroundColor: tagColors[index] }}>
                {val}
              </span>
            ))}
          </>
        );
      }
      return res;
    });
  useEffect(() => {
    if (move && move.target && mailBoxs.length) {
      const mailBoxsIds = mailBoxs.map(item => item.entry.mailBoxId);
      const targetId = +move.target;
      if (!mailBoxsIds.includes(targetId)) {
        setRuleDisabledText(getIn18Text('JIANCEDAOWENJIAN'));
        setActionFail(true);
      }
    }
  }, [move, mailBoxs]);
  useEffect(() => {
    if (tags && tags.value) {
      const tagNames = mailTagList.map(tag => tag[0]);
      const tagValues = tags.value as string[];
      // reDefinedColorList
      if (!tagValues.length || !tagValues.every(tag => tagNames.includes(tag))) {
        setRuleDisabledText(getIn18Text('JIANCEDAOBIAOQIAN'));
        setActionFail(true);
        return;
      }
      const fontColors: string[] = [];
      const tagColors = tagValues.map((item, idx) => {
        const itemD = mailTagList.find(tag => tag[0] === item);
        const itemDColorNums = itemD ? itemD[1].color : -1;
        const colorNum = reDefinedColorListNew.find(colorNum => colorNum.nums.includes(itemDColorNums));
        fontColors[idx] = colorNum ? colorNum.fontColor : '';
        return colorNum ? colorNum.color : '';
      });
      setTagFontColors(fontColors);
      setTagColors(tagColors);
    }
  }, [tags, mailTagList]);
  const hidePopoverVisible = (e: Event) => {
    const parent = (e.target as HTMLElement).parentElement;
    let grdParent = null;
    if (parent) grdParent = parent.parentElement;
    if (popClickRef.current === grdParent || popClickRef.current === parent) return;
    if (editorBtnRef.current === e.target && forward) return;
    setPopoverVisible(false);
  };
  useEffect(() => {
    document.body.addEventListener('click', hidePopoverVisible);
    return () => {
      document.body.removeEventListener('click', hidePopoverVisible);
    };
  }, []);
  const disabledRule = e => {
    const res = update(data, { $merge: { disabled: !unStarted } });
    e.nativeEvent.stopImmediatePropagation();
    e.stopPropagation();
    MailConfApi.editMailClassifyRule([res]).then(() => {
      getListData();
      setPopoverVisible(false);
    });
  };
  const effectHistoryMail = e => {
    e.nativeEvent.stopImmediatePropagation();
    e.stopPropagation();
    MailConfApi.effectHistoryMail(data.id as number).then(res => {
      if (res?.success) {
        getListData();
        setPopoverVisible(false);
        SiriusMessage.success({ content: getIn18Text('LISHIYOUJIANYI') });
      } else {
        SiriusMessage.error({ content: res?.title });
      }
    });
  };
  const deleteMailClassifyRule = e => {
    e.nativeEvent.stopImmediatePropagation();
    e.stopPropagation();
    setPopoverVisible(false);
    SiriusModal.confirm({
      title: getIn18Text('SHANCHUGUIZEDUI'),
      hideCancel: true,
      okText: getIn18Text('SHANCHU'),
      okButtonProps: { danger: true, type: 'default' },
      onOk: () => {
        deleteClassifyItem();
      },
      onCancel: () => {},
    });
  };
  const clickOperator = e => {
    e.nativeEvent.stopImmediatePropagation();
    e.stopPropagation();
    setPopoverVisible(val => !val);
  };
  const editRuleAction = e => {
    e.nativeEvent.stopImmediatePropagation();
    e.stopPropagation();
    editRule(data);
  };
  const operatorContent = (
    <div className={classnames(listStyle.operatorPopover)}>
      {!ruleDisabledText && (
        <div className={classnames(listStyle.item)} onClick={disabledRule}>
          {unStarted ? getIn18Text('LIJIQIYONG') : getIn18Text('LIJIJINYONG')}
        </div>
      )}
      {!ruleDisabledText && (
        <div className={classnames(listStyle.item)} onClick={effectHistoryMail}>
          {getIn18Text('ZHIXINGGUIZE')}
        </div>
      )}
      {!ruleDisabledText && <div className={classnames(listStyle.splitLine)} />}
      <div className={classnames(listStyle.item)} ref={editorBtnRef} onClick={editRuleAction}>
        {getIn18Text('BIANJI')}
      </div>
      <div className={classnames(listStyle.item)} onClick={deleteMailClassifyRule}>
        {getIn18Text('SHANCHU')}
      </div>
    </div>
  );
  return (
    <div className={classnames(listStyle.classifyItem)}>
      <div className={classnames(listStyle.move)}>
        <IconCard type="allipseGroup" />
      </div>
      <div className={classnames(listStyle.content)}>
        <div className={classnames(listStyle.rule)}>
          <div className={classnames(listStyle.ruleContainer)}>
            <div className={classnames(listStyle.ruleDetail)}>
              <div className={classnames(listStyle.rulePhase)}>{getIn18Text('TIAOJIAN:')}</div>
              <div className={classnames(listStyle.ruleContent)}>
                {ruleContent.map((item, index) => (
                  <div className={classnames(listStyle.ruleItem)}>
                    {index !== 0 && <span className={classnames(listStyle.prep)}>{flagOperatorOr}</span>}
                    <div>{item.title}</div>
                    <div className={classnames(listStyle.ruleItemContent)}>
                      {item.value.map(i => {
                        const quotes = ['subject', 'attachmentName'].includes(item.className);
                        return (
                          <Tooltip title={i}>
                            <span className={classnames(listStyle[item.className])}>
                              <span className={classnames(listStyle.wholeName)}>
                                {quotes ? '“' : ''}
                                {emailContactMap[i] || i}
                                {quotes ? '”' : ''}
                              </span>
                            </span>
                          </Tooltip>
                        );
                      })}
                      {index !== ruleContent.length - 1 && '；'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={classnames(listStyle.splitLine, listStyle.ruleLine)} />
            <div className={classnames(listStyle.ruleDetail, listStyle.ruleDetailPhase)}>
              <div className={classnames(listStyle.rulePhase)}>{getIn18Text('ZHIXING:')}</div>
              {actionFail ? (
                <div>
                  <span className={classnames(listStyle.actionFail)}>
                    [
                    <IconCard type="info" />
                    {getIn18Text('ZHIXINGCAOZUOSHI')}
                  </span>
                </div>
              ) : (
                <div className={classnames(listStyle.ruleContent)}>
                  {rulePhase.map((item, index) => (
                    <>
                      {item}
                      {index !== rulePhase.length - 1 && '；'}
                    </>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className={classnames(listStyle.operator)}>
            {unStarted && !ruleDisabledText && <span className={classnames(listStyle.unstart)}>{getIn18Text('WEIQIYONG')}</span>}
            {ruleDisabledText && (
              <Tooltip title={ruleDisabledText} overlayStyle={{ maxWidth: 'fit-content' }}>
                <span className={classnames(listStyle.unstart, listStyle.unable)}>
                  <span className={classnames(listStyle.iconWord)}>{getIn18Text('SHIXIAO')}</span>
                  <IconCard type="info" stroke="#F74F4F" width="12" />
                </span>
              </Tooltip>
            )}
            <span className={classnames('dark-svg-invert', listStyle.operatorIcon)} onClick={clickOperator} ref={popClickRef}>
              <Popover content={operatorContent} placement="bottomRight" visible={popoverVisible} overlayClassName={classnames(listStyle.operatorContent)}>
                <IconCard type="more" />
              </Popover>
            </span>
          </div>
        </div>
      </div>
      {(unStarted || ruleDisabledText) && <div className={classnames(listStyle.layer)} />}
    </div>
  );
};
export default ClassifyItem;
