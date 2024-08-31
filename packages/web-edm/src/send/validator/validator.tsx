import React, { useState, useEffect, useContext, useCallback } from 'react';
import { RequestSaveDraft, SendBoxSender, SenderListV2Resp, SenderRotateList, apiHolder, GetDiagnosisDetailRes } from 'api';
import { Tooltip } from 'antd';
import classnames from 'classnames';
import style from './validator.module.scss';
import { usePermissionCheck } from '@/components/UI/PrivilegeEnhance';
import { EDMAPI } from '../../utils';
import { DOMAIN_MATCH_REGEX, PublicMailDomainList } from '../../utils/utils';
import { showDNSErrorDialog } from '../../senderRotate/emailSenderList';
import { InvalidStatusMap } from '../../send/validEmailAddress/util';
import { ReactComponent as TongyongJiantouXia } from '@web-common/images/newIcon/tongyong_jiantou_xia.svg';
import { ReactComponent as TongyongJiantouShang } from '@web-common/images/newIcon/tongyong_jiantou_shang1.svg';
import { ReactComponent as AlertIcon } from '@/images/icons/edm/alert-mark.svg';
import { ReactComponent as SuccessIcon } from '@/images/icons/edm/success-icon.svg';
import {
  ValidatorContext,
  SensitiveState,
  ValidatorSpamAssassin,
  ValidatorBadLinks,
  ValidatorMailContentCheck,
  ValidatorSmartSend,
  ValidatorMultiVersion,
  ValidatorSmartSendAction,
  ValidatorMultiVersionAction,
  FailedState,
} from './validator-context';
import { ValidatorItem } from './validator-item';
import { CollapsibleWrap } from './CollapsibleWrap';

interface Result {
  id: ValidatorType;
  success: boolean;
  UI: JSX.Element;
}

const PRESENT = 'ntesmail.com';

enum ValidatorType {
  SenderEmails = 'SenderEmails',
  SingleSendCount = 'SingleSendCount',
  SameCompanyReceivers = 'SameCompanyReceivers',
  ExceptionReceviers = 'ExceptionReceviers',
  Subjects = 'Subjects',
  Sensitive = 'Sensitive',
  spamAssassin = 'spamAssassin',
  badLinks = 'badLinks',
  smartSend = 'smartSend',
  multiVersion = 'multiVersion',
}
const ValidatorTypeIndex = [
  'SenderEmails',
  'SingleSendCount',
  'SameCompanyReceivers',
  'ExceptionReceviers',
  'Subjects',
  'Sensitive',
  'badLinks',
  'spamAssassin',
  'smartSend',
  'multiVersion',
] as const;
type ValidatorTypeKeys = keyof typeof ValidatorType;
type ValidatorTypeUIs = Array<{
  id: ValidatorTypeKeys;
  UI: JSX.Element;
}>;

export interface Props {
  param?: RequestSaveDraft;
  sendType?: number;

  clearExceptionEmail?: () => void;
  clearBeyondLimitEmails?: () => void;
  handleAddSubject?: () => void;
  handleAddSender?: () => void;
  showRecommend?: boolean;
  limitData?: GetDiagnosisDetailRes;
}

const systemApi = apiHolder.api.getSystemApi();
// 总共有10个检测项目，写死的
const needCheckCount = 10;
let failedCount = 0;

export const Validator = (props: Props) => {
  const hasMultiDomainPermission = usePermissionCheck('VIEW', 'EDM', 'EDM_MULTI_ACCOUNT_INFO');

  const { param, clearExceptionEmail, clearBeyondLimitEmails, sendType, handleAddSubject, handleAddSender, showRecommend = false, limitData } = props;

  const [expandType, setExpandType] = useState<ValidatorType | undefined>(ValidatorType.SenderEmails);

  const [domainKV, setDomainKV] = useState<Record<string, any[]>>({});
  const [invalidRecvs, setInvalidRecvs] = useState<any[]>([]);

  const [personalSenderList, setPersonalSenderList] = useState<SendBoxSender[]>();
  const [multiDomainList, setMultiDomainList] = useState<SenderRotateList>();
  // 敏感词检测相关
  const [sensitiveState, setSensitiveState] = useState<SensitiveState>();
  const [toSensitive, setToSensitive] = useState<Array<() => any>>();
  // spamAssassin 相关
  const [spamAssassinInfo, setSpamAssassinInfo] = useState<ReturnType<ValidatorSpamAssassin['validate']>>();
  // 坏链检测相关
  const [badLinksInfo, setBadLinksInfo] = useState<ReturnType<ValidatorBadLinks['validate']>>();
  const [mailContentCheck, setMailContentCheck] = useState<Array<() => any>>();
  const [mailContentReCheck, setMailContentReCheck] = useState<Array<() => any>>();
  // 安全发信相关
  const [smartSend, setSmartSend] = useState(false);
  // 千邮千面相关
  const [multiVersionInfo, setMultiVersionInfo] = useState<ValidatorMultiVersion['data']>();

  const provider = useContext(ValidatorContext);

  // 检测配置
  const GetValidatorUi = (
    id: ValidatorType,
    type: 'empty' | 'success' | 'failed',
    external?: {
      renderResult?: () => JSX.Element;
      renderFailedInfo?: string | number;
    }
  ): JSX.Element => {
    switch (id) {
      case ValidatorType.SenderEmails: {
        const checkTitle = '发件地址-基础认证';
        if (type === 'empty') {
          return <></>;
        }
        if (type === 'success') {
          return (
            <ValidatorItem
              onOpen={() => setExpandType(ValidatorType.SenderEmails)}
              defaultOpen={expandType === ValidatorType.SenderEmails}
              checkTitle={checkTitle}
              needOpen
              checkResult={external?.renderResult}
            />
          );
        }
        if (type === 'failed') {
          return (
            <ValidatorItem
              onOpen={() => setExpandType(ValidatorType.SenderEmails)}
              defaultOpen={expandType === ValidatorType.SenderEmails}
              checkTitle={checkTitle}
              needOpen
              checkResult={external?.renderResult}
              renderFailedInfo={external?.renderFailedInfo}
            />
          );
        }
      }
      // 敏感词没有空状态
      case ValidatorType.Sensitive: {
        if (type === 'empty') {
          return <></>;
        }
        if (type === 'success') {
          return (
            <ValidatorItem
              onOpen={() => setExpandType(ValidatorType.Sensitive)}
              defaultOpen={expandType === ValidatorType.Sensitive}
              needOpen
              checkResult={() => <div className={style.successResult}>暂未发现敏感词</div>}
              checkTitle="邮件内容-敏感词"
            />
          );
        }
        if (type === 'failed') {
          return (
            <ValidatorItem
              onOpen={() => setExpandType(ValidatorType.Sensitive)}
              defaultOpen={expandType === ValidatorType.Sensitive}
              needOpen
              checkResult={() => (
                <div className={style.sensitiveResult}>
                  <div className={style.sensitiveResultInfo}>可能涉及广告信息等，容易被判为垃圾邮件，建议进行替换</div>
                  <div className={classnames(style.sensitiveResultWords, style.ellipsis)}>
                    {sensitiveState?.failedWords.map((word, index) => (
                      <React.Fragment key={index}>{`${index + 1}. ${word}；`}</React.Fragment>
                    ))}
                  </div>
                  <a className={style.actionLink} onClick={() => toSensitive?.forEach(item => item())} style={{ marginTop: 4 }}>
                    去修改
                  </a>
                </div>
              )}
              checkTitle="邮件内容-敏感词"
              renderFailedInfo={sensitiveState?.failedCount || 0}
            />
          );
        }
      }
      case ValidatorType.spamAssassin: {
        const checkTitle = '邮件内容-SpamAssassin 垃圾邮件评定';
        if (type === 'empty') {
          return (
            <ValidatorItem
              onOpen={() => setExpandType(ValidatorType.spamAssassin)}
              defaultOpen={expandType === ValidatorType.spamAssassin}
              checkTitle={checkTitle}
              renderFailedInfo="未检测"
              needOpen
              checkResult={() => (
                <div>
                  <div className={style.successResult}>SpamAssassin 垃圾邮件评定检测，整个过程需要几分钟，期间可继续操作其他内容。</div>
                  <a className={style.actionLink} onClick={handleMailContentCheck} style={{ marginTop: 4 }}>
                    去检测
                  </a>
                </div>
              )}
            />
          );
        }
        if (type === 'failed') {
          return (
            <ValidatorItem
              onOpen={() => setExpandType(ValidatorType.spamAssassin)}
              defaultOpen={expandType === ValidatorType.spamAssassin}
              checkTitle={checkTitle}
              renderFailedInfo={spamAssassinInfo?.score}
              needOpen
              checkResult={() => (
                <div>
                  <div className={style.openableBox}>
                    <CollapsibleWrap
                      UI={spamAssassinInfo?.data.map((item, index) => (
                        <div className={style.openableItem} key={index}>
                          {index + 1}. {item.description}
                          <span className={style.mark}>{item.mark}</span>
                        </div>
                      ))}
                    />
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <a
                      className={style.actionLink}
                      onClick={handleMailContentCheck}
                      style={{
                        marginRight: 8,
                      }}
                    >
                      去查看
                    </a>
                    <a className={style.actionLink} onClick={handleMailContentReCheck}>
                      再次检测
                    </a>
                  </div>
                </div>
              )}
            />
          );
        }
        if (type === 'success') {
          return (
            <ValidatorItem
              onOpen={() => setExpandType(ValidatorType.spamAssassin)}
              defaultOpen={expandType === ValidatorType.spamAssassin}
              checkTitle={checkTitle}
              needOpen
              checkResult={() => <div className={style.successResult}>SpamAssassin 垃圾邮件评定暂未发现问题</div>}
            />
          );
        }
      }
      case ValidatorType.badLinks: {
        const checkTitle = '邮件内容-坏链接';
        if (type === 'empty') {
          return (
            <ValidatorItem
              onOpen={() => setExpandType(ValidatorType.badLinks)}
              defaultOpen={expandType === ValidatorType.badLinks}
              checkTitle={checkTitle}
              renderFailedInfo="未检测"
              needOpen
              checkResult={() => (
                <div>
                  <div className={style.successResult}>坏链接检测，整个过程需要几分钟，期间可继续操作其他内容。</div>
                  <a className={style.actionLink} onClick={handleMailContentCheck} style={{ marginTop: 4 }}>
                    去检测
                  </a>
                </div>
              )}
            />
          );
        }
        if (type === 'failed') {
          return (
            <ValidatorItem
              onOpen={() => setExpandType(ValidatorType.badLinks)}
              defaultOpen={expandType === ValidatorType.badLinks}
              checkTitle={checkTitle}
              renderFailedInfo={badLinksInfo?.count}
              needOpen
              checkResult={() => (
                <div>
                  <div className={style.openableBox}>
                    <div key={-1} className={style.openableItem}>
                      您的邮件内容中包含{badLinksInfo?.count}个坏链接
                    </div>
                    <CollapsibleWrap
                      UI={badLinksInfo?.data.map((item, index) => (
                        <Tooltip key={index} title={item.description}>
                          <div className={style.openableItem + ' ' + style.ellipsis}>
                            {index + 1}. {item.description}
                          </div>
                        </Tooltip>
                      ))}
                    />
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <a
                      className={style.actionLink}
                      style={{
                        marginRight: 8,
                      }}
                      onClick={handleMailContentCheck}
                    >
                      去查看
                    </a>
                    <a className={style.actionLink} onClick={handleMailContentReCheck}>
                      再次检测
                    </a>
                  </div>
                </div>
              )}
            />
          );
        }
        if (type === 'success') {
          return (
            <ValidatorItem
              onOpen={() => setExpandType(ValidatorType.badLinks)}
              defaultOpen={expandType === ValidatorType.badLinks}
              checkTitle={checkTitle}
              needOpen
              checkResult={() => <div className={style.successResult}>您的邮件内容中有0个坏链接</div>}
            />
          );
        }
      }
      case ValidatorType.smartSend: {
        const checkTitle = '发送设置-安全发信';
        if (type === 'empty') {
          return <></>;
        }
        if (type === 'failed') {
          return (
            <ValidatorItem
              onOpen={() => setExpandType(ValidatorType.smartSend)}
              defaultOpen={expandType === ValidatorType.smartSend}
              checkTitle={checkTitle}
              renderFailedInfo="未开启"
              needOpen={!!param?.receiverInfo?.contacts?.length}
              checkResult={() => (
                <div>
                  <div className={style.successResult}>建议开启安全发信功能，系统将自动为您优化发送时间</div>
                  <a
                    className={style.actionLink}
                    onClick={() => {
                      const actions = provider?.state.find(item => item.id === 'smartSend:action') as ValidatorSmartSendAction;
                      actions?.actions.forEach(item => item());
                    }}
                    style={{ marginTop: 4 }}
                  >
                    开启
                  </a>
                </div>
              )}
            />
          );
        }
        if (type === 'success') {
          return (
            <ValidatorItem
              onOpen={() => setExpandType(ValidatorType.smartSend)}
              defaultOpen={expandType === ValidatorType.smartSend}
              checkTitle={checkTitle}
              needOpen={!!param?.receiverInfo?.contacts?.length}
              checkResult={() => (
                <div>
                  <div className={style.successResult}>此任务已开启安全发信功能，系统将自动为您优化发送时间</div>
                </div>
              )}
            />
          );
        }
      }
      case ValidatorType.multiVersion: {
        const checkTitle = '发送设置-千邮千面';
        if (type === 'empty') {
          return <></>;
        }
        if (type === 'failed') {
          return (
            <ValidatorItem
              onOpen={() => setExpandType(ValidatorType.multiVersion)}
              defaultOpen={expandType === ValidatorType.multiVersion}
              checkTitle={checkTitle}
              renderFailedInfo="未生成"
              needOpen={!!param?.receiverInfo?.contacts?.length}
              checkResult={() => (
                <div>
                  <div className={style.successResult}>建议通过AI生成多版本的邮件正文，系统随机发送给收件人，以提升送达率</div>
                  <a
                    className={style.actionLink}
                    onClick={() => {
                      const actions = provider?.state.find(item => item.id === 'multiVersion:action') as ValidatorMultiVersionAction;
                      actions?.actions.forEach(item => item());
                    }}
                    style={{ marginTop: 4 }}
                  >
                    生成
                  </a>
                </div>
              )}
            />
          );
        }
        if (type === 'success') {
          return (
            <ValidatorItem
              onOpen={() => setExpandType(ValidatorType.multiVersion)}
              defaultOpen={expandType === ValidatorType.multiVersion}
              checkTitle={checkTitle}
              needOpen={!!param?.receiverInfo?.contacts?.length}
              checkResult={() => (
                <div>
                  <div className={style.successResult}>AI已智能生成多版本邮件正文随机发送给收件人，以提升送达率</div>
                </div>
              )}
            />
          );
        }
      }
    }
    // todoloading
    return <div>loading</div>;
  };

  // 检测成功和失败数组
  const [checkResultSuc, setCheckResultSuc] = useState<ValidatorTypeUIs>([]);
  const [checkResultFailed, setCheckResultFailed] = useState<ValidatorTypeUIs>([]);

  useEffect(() => {
    // 第一次检测成功，需要添加新旧值，然后计算动画
    const failedState = provider?.state.find(item => item.id === 'failedState') as FailedState;
    const checkCount = showRecommend ? needCheckCount - 2 : needCheckCount;
    if (checkResultFailed.length + checkResultSuc.length === checkCount && failedState?.data?.count !== checkResultFailed.length) {
      provider?.dispatch({
        type: 'setFailed',
        payload: {
          count: checkResultFailed.length,
        },
      });
      provider?.dispatch({
        type: 'setValidatorResult',
        payload: {
          id: 'ValidatorResult',
          firstCount: checkResultFailed.length,
          lastCount: checkResultFailed.length,
        },
      });
    }

    // 新值实时的
    // provider?.dispatch({
    //   type: 'setFailed',
    //   payload: {
    //     count: checkResultFailed.length,
    //   },
    // });
    failedCount = checkResultFailed.length;
  }, [checkResultSuc, checkResultFailed]);

  useEffect(() => {
    return () => {
      provider?.dispatch({
        type: 'setFailed',
        payload: {
          old: failedCount,
        },
      });
    };
  }, []);

  // 一个简单的插入当前数组，并且覆盖原id的方法
  const insertCurArray = (id: ValidatorType, UI: JSX.Element, curArray: ValidatorTypeUIs) => {
    const curUI = curArray.find(item => item.id === id);
    if (curUI) {
      curUI.UI = UI;
    } else {
      curArray.push({
        id,
        UI,
      });
    }
    return [...curArray.sort((first, second) => ValidatorTypeIndex.findIndex(type => type === first.id) - ValidatorTypeIndex.findIndex(type => type === second.id))];
  };
  // 删除原来的UI
  const deleteCurArray = (id: ValidatorType, curArray: ValidatorTypeUIs) => {
    const curUIIndex = curArray.findIndex(item => item.id === id);
    if (curUIIndex > -1) {
      curArray.splice(curUIIndex, 1);
    }
    return [...curArray.sort((first, second) => ValidatorTypeIndex.findIndex(type => type === first.id) - ValidatorTypeIndex.findIndex(type => type === second.id))];
  };
  // 某个项UI变化
  const resultArrayChange = (id: ValidatorType, UI: JSX.Element, success: boolean) => {
    // 给相应的数组添加
    const setFn = success ? setCheckResultSuc : setCheckResultFailed;
    const curArray = success ? checkResultSuc : checkResultFailed;
    setFn(insertCurArray(id, UI, curArray));
    // 给相应的数组删除
    const deleteFn = !success ? setCheckResultSuc : setCheckResultFailed;
    const curDeleteArray = !success ? checkResultSuc : checkResultFailed;
    deleteFn(deleteCurArray(id, curDeleteArray));
  };

  const sensitiveCheck = () => {
    // 敏感词检测
    const curSensitiveState = provider?.state?.find(item => item.id === 'sensitive');
    if (curSensitiveState) {
      const { success, failedInfo } = curSensitiveState.validate();
      setSensitiveState(failedInfo);
      setToSensitive(curSensitiveState.failedActionState);
    }
  };

  // 敏感词UI变化
  useEffect(() => {
    // 添加到对应的数组
    if (!!sensitiveState?.failedCount) {
      const UI = GetValidatorUi(ValidatorType.Sensitive, 'failed');
      resultArrayChange(ValidatorType.Sensitive, UI, false);
    } else {
      const UI = GetValidatorUi(ValidatorType.Sensitive, 'success');
      resultArrayChange(ValidatorType.Sensitive, UI, true);
    }
  }, [toSensitive, sensitiveState, expandType]);

  // 添加联系人UI
  // useEffect(() => {
  //   if (param?.receiverInfo?.contacts?.length) {
  //     const UI = GetValidatorUi(ValidatorType.noContact, 'success');
  //     resultArrayChange(ValidatorType.noContact, UI, true);
  //   } else {
  //     const UI = GetValidatorUi(ValidatorType.noContact, 'failed');
  //     resultArrayChange(ValidatorType.noContact, UI, false);
  //   }
  // }, [param?.receiverInfo, expandType]);

  // 内容检测，包含SpamAssassin和坏链检测
  const emailContentCheck = (spamAssassinState?: ValidatorSpamAssassin) => {
    // const spamAssassinState = provider?.state?.find(item => item.id === 'spamAssassin') as ValidatorSpamAssassin;
    // spamAssassin 检测
    if (spamAssassinState) {
      const spamAssassinInfo = spamAssassinState.validate();
      setSpamAssassinInfo(spamAssassinInfo);
    }

    const badLinksState = provider?.state?.find(item => item.id === 'badLinks') as ValidatorBadLinks;
    if (badLinksState) {
      setBadLinksInfo(badLinksState.validate());
    }

    const mailContentCheckState = provider?.state?.find(item => item.id === 'mailContentCheckAction') as ValidatorMailContentCheck;
    if (mailContentCheckState) {
      setMailContentCheck(mailContentCheckState.actions);
    }
    const mailContentCheckReState = provider?.state?.find(item => item.id === 'mailContentReCheck') as ValidatorMailContentCheck;
    if (mailContentCheckReState) {
      setMailContentReCheck(mailContentCheckReState.actions);
    }
  };
  // spamAssassin UI变化
  useEffect(() => {
    if (spamAssassinInfo == null) {
      const UI = GetValidatorUi(ValidatorType.spamAssassin, 'empty');
      resultArrayChange(ValidatorType.spamAssassin, UI, false);
    } else if (spamAssassinInfo.score < 0) {
      const UI = GetValidatorUi(ValidatorType.spamAssassin, 'failed');
      resultArrayChange(ValidatorType.spamAssassin, UI, false);
    } else {
      const UI = GetValidatorUi(ValidatorType.spamAssassin, 'success');
      resultArrayChange(ValidatorType.spamAssassin, UI, true);
    }
  }, [spamAssassinInfo, mailContentCheck, expandType]);

  // 坏链接UI变化
  useEffect(() => {
    if (badLinksInfo == null) {
      const UI = GetValidatorUi(ValidatorType.badLinks, 'empty');
      resultArrayChange(ValidatorType.badLinks, UI, false);
    } else if (badLinksInfo.count > 0) {
      const UI = GetValidatorUi(ValidatorType.badLinks, 'failed');
      resultArrayChange(ValidatorType.badLinks, UI, false);
    } else {
      const UI = GetValidatorUi(ValidatorType.badLinks, 'success');
      resultArrayChange(ValidatorType.badLinks, UI, true);
    }
  }, [badLinksInfo, mailContentCheck, expandType]);

  // 安全发送UI变化
  useEffect(() => {
    // 只有俩状态
    if (smartSend && (param?.receiverInfo.contacts?.length || 0) > 0) {
      const UI = GetValidatorUi(ValidatorType.smartSend, 'success');
      resultArrayChange(ValidatorType.smartSend, UI, true);
    } else {
      const UI = GetValidatorUi(ValidatorType.smartSend, 'failed');
      resultArrayChange(ValidatorType.smartSend, UI, false);
    }
  }, [smartSend, param?.receiverInfo, expandType]);

  // 安全发送检测
  const smartSendState = provider?.state?.find(item => item.id === 'smartSend') as ValidatorSmartSend;
  useEffect(() => {
    if (smartSendState) {
      setSmartSend(smartSendState.selected);
    }
  }, [smartSendState]);

  // 千邮千面检测
  const multiVersionState = provider?.state?.find(item => item.id === 'multiVersion') as ValidatorMultiVersion;
  // 千邮千面UI变化
  useEffect(() => {
    if (multiVersionState != null && multiVersionState.data.aiRewrite && multiVersionState.data.open && (param?.receiverInfo.contacts?.length || 0) > 0) {
      const UI = GetValidatorUi(ValidatorType.multiVersion, 'success');
      resultArrayChange(ValidatorType.multiVersion, UI, true);
    } else {
      const UI = GetValidatorUi(ValidatorType.multiVersion, 'failed');
      resultArrayChange(ValidatorType.multiVersion, UI, false);
    }
  }, [multiVersionState, param?.receiverInfo, expandType]);

  useEffect(() => {
    fetchSenderList();
    sensitiveCheck();
    // smartSendCheck();
    // multiVersionCheck();
  }, []);

  // 检测内容发生了变化，要更新内容检测相关UI
  const spamAssassinState = provider?.state?.find(item => item.id === 'spamAssassin') as ValidatorSpamAssassin;
  useEffect(() => {
    emailContentCheck(spamAssassinState);
  }, [spamAssassinState]);

  const fetchSenderList = async () => {
    let myEmail = systemApi.getCurrentUser()?.id;

    let checkDefault = true;
    try {
      let resp: SenderListV2Resp = await EDMAPI().fetchSenderListV2();

      const list = (resp?.belongSenders || []).filter(item => {
        if (item.email) {
          // 默认勾选登录账号
          if (checkDefault && myEmail && item.email === myEmail) {
            item.check = true;
          }
          const regexRes = item.email.match(DOMAIN_MATCH_REGEX);
          if (item.email.includes(PRESENT)) {
            item.giftDomain = true;
            item.check = false;
            item.unavailable = true;
          }
          return regexRes && regexRes.length > 0;
        }
        return false;
      });
      setPersonalSenderList(list);
      hasMultiDomainPermission &&
        setMultiDomainList({
          accounts: resp.assignSenders,
        });
    } catch (e) {
    } finally {
    }
  };

  let ConstructRecvKV = useCallback(() => {
    let invalidRecvs: any[] = [];
    let recvs = param?.receiverInfo?.contacts || [];
    if (recvs.length > 0) {
      let kv: Record<string, any[]> = {};
      recvs.forEach(i => {
        let code = parseInt(i.verifyStatus) + 100;
        if (code === InvalidStatusMap[103].id || code === InvalidStatusMap[100].id) {
          invalidRecvs.push(i);
        }
        let domain = i.email.split('@')[1] || '';
        if (PublicMailDomainList.includes(domain.toLowerCase())) {
          return;
        }
        if (domain.length > 0) {
          let valueMap = kv[domain] || [];
          valueMap.push(i);
          kv[domain] = valueMap;
        }
      });
      setDomainKV(kv);
      setInvalidRecvs(invalidRecvs);
    } else {
      setDomainKV({});
      setInvalidRecvs([]);
    }
  }, [param?.receiverInfo, sendType]);

  useEffect(() => {
    ConstructRecvKV();
  }, [param?.receiverInfo]);

  const SenderEmailUI = (): Result => {
    let passArr: SendBoxSender[] = [];
    let unPassArr: SendBoxSender[] = [];
    let hasInput = (param?.sendSettingInfo?.senderEmails?.length || 0) > 0;

    let checkedEmails = param?.sendSettingInfo?.senderEmails || [];
    personalSenderList?.forEach(i => {
      if (checkedEmails.includes(i.email)) {
        availableEmailbyDNS(i) ? passArr.push(i) : unPassArr.push(i);
      }
    });
    multiDomainList?.accounts?.forEach(i => {
      if (checkedEmails.includes(i.email || '')) {
        passArr.push(i as SendBoxSender);
      }
    });

    let pass = passArr.length > 0 && unPassArr.length === 0;
    let expand = hasInput && expandType === ValidatorType.SenderEmails;

    let ui = (
      <div className={style.border}>
        <div
          className={style.borderHeader}
          onClick={() => {
            handleClickExpand(ValidatorType.SenderEmails);
          }}
        >
          <div className={style.left}>发件地址-基础认证</div>
          {hasInput && (
            <div className={style.right}>
              {unPassArr.length > 0 && <div className={style.number}>{unPassArr.length}</div>}
              {getExpandIcon(expand)}
            </div>
          )}
        </div>
        {expand && (
          <div className={style.body}>
            <CollapsibleWrap
              UI={unPassArr
                .map(i => {
                  return (
                    <div className={style.dialog}>
                      <Tooltip title={i.email}>
                        <div className={style.title}>{i.email}</div>
                      </Tooltip>
                      <div
                        className={style.action}
                        onClick={() => {
                          showDNSErrorDialog(i);
                        }}
                      >
                        详情
                      </div>
                    </div>
                  );
                })
                .concat(
                  passArr.map(i => {
                    return (
                      <div className={style.domain} style={{ justifyContent: 'flex-start', gap: '8px' }}>
                        <Tooltip title={i.email}>
                          <div className={style.do}>{i.email}</div>
                        </Tooltip>
                        <div className={style.person}>验证成功</div>
                      </div>
                    );
                  })
                )}
            />
          </div>
        )}
      </div>
    );
    return {
      id: ValidatorType.SenderEmails,
      success: hasInput ? pass : false,
      UI: ui,
    };
  };

  // SingleSenderCount UI 变化 // todo
  useEffect(() => {}, [param?.receiverInfo, personalSenderList]);

  useEffect(() => {
    if (limitData == null) {
      return;
    }
    let result0 = SenderEmailUI();
    if (result0.success) {
      resultArrayChange(ValidatorType.SenderEmails, result0.UI, true);
    } else {
      resultArrayChange(ValidatorType.SenderEmails, result0.UI, false);
    }

    if (!showRecommend) {
      let result1 = SingleSenderCountUI();
      if (result1.success) {
        resultArrayChange(ValidatorType.SingleSendCount, result1.UI, true);
      } else {
        resultArrayChange(ValidatorType.SingleSendCount, result1.UI, false);
      }
    }

    if (!showRecommend) {
      let result2 = CompanyContactCountUI();
      if (result2.success) {
        resultArrayChange(ValidatorType.SameCompanyReceivers, result2.UI, true);
      } else {
        resultArrayChange(ValidatorType.SameCompanyReceivers, result2.UI, false);
      }
    }

    let result4 = ExceptionReceiverUI();
    if (result4.success) {
      resultArrayChange(ValidatorType.ExceptionReceviers, result4.UI, true);
    } else {
      resultArrayChange(ValidatorType.ExceptionReceviers, result4.UI, false);
    }

    let result3 = EmailSubjectsUI();
    if (result3.success) {
      resultArrayChange(ValidatorType.Subjects, result3.UI, true);
    } else {
      resultArrayChange(ValidatorType.Subjects, result3.UI, false);
    }
  }, [param, expandType, domainKV, invalidRecvs, personalSenderList, multiDomainList, showRecommend, limitData]);

  const SingleSenderCountUI = (): Result => {
    let contactCount = param?.receiverInfo?.contacts?.length || 0;
    let senderEmailCount = param?.sendSettingInfo?.senderEmails?.length || 0;
    let limitCountPerEmail = limitData?.singleEmailSendCountLimit ?? 500;
    let hasInput = contactCount > 0;

    let pass = true;
    if (senderEmailCount === 0 || !hasInput) {
      pass = false;
    } else {
      pass = contactCount / senderEmailCount <= limitCountPerEmail;
    }

    let personalLimitSelectedCount = 2;
    let personalAvailableEmailCount = personalSenderList?.filter(i => !i.unavailable).length || 0;
    let multiAvailableEmailCount = multiDomainList?.accounts?.filter(i => !i.unavailable).length || 0;
    let bodyText = '';
    // 外层业务保证至少有一个发件地址, 如果传进来的没有发件地址, 那就确实没有地址
    if (senderEmailCount === 0) {
      bodyText = '当前无可用发件地址，请联系公司管理员添加';
    } else if (pass) {
      bodyText = `共添加${contactCount}收件人，单发件地址单次发送数量建议小于${limitCountPerEmail}人`;
    } else if (!pass) {
      // 1. 没有多账号营销
      if (!hasMultiDomainPermission) {
        if (personalAvailableEmailCount === 1) {
          // 1.0 如果只有一个账号
          bodyText = `共添加${contactCount}收件人，单发件地址单次发送数量建议小于${limitCountPerEmail}人，可新增发件地址，以提升送效果`;
        } else if (senderEmailCount < personalLimitSelectedCount && personalAvailableEmailCount >= personalLimitSelectedCount) {
          // 1.1 如果还能选普通账号
          bodyText = `建议添加发件地址，以提升送效果，单发件地址单次发送数量建议小于${limitCountPerEmail}人`;
        } else if (senderEmailCount >= personalLimitSelectedCount) {
          // 1.2 没有可用的普通账号
          bodyText = `共添加${contactCount}收件人，单发件地址单次发送数量建议小于${limitCountPerEmail}人，可以开通多域名营销功能，提升发件地址数量`;
        }
        // 2. 有多账号营销
      } else {
        if (personalAvailableEmailCount + multiAvailableEmailCount === senderEmailCount) {
          // 2.1 所有账号都选完了
          bodyText = `共添加${contactCount}收件人，单发件地址单次发送数量建议小于${limitCountPerEmail}人，可新增发件地址，以提升送效果`;
        } else {
          // 2.1 如果还有能选的账号
          bodyText = `共添加${contactCount}收件人，单发件地址单次发送数量建议小于${limitCountPerEmail}人，添加发件地址，以提升送效果`;
        }
      }
    }
    let expand = expandType === ValidatorType.SingleSendCount;

    let ui = (
      <div className={style.border}>
        <div
          className={style.borderHeader}
          onClick={() => {
            handleClickExpand(ValidatorType.SingleSendCount);
          }}
        >
          <div className={style.left}>发件地址-单发件地址发送数量</div>
          <div className={style.right}>
            {!pass && <div className={style.number}>1</div>}
            {getExpandIcon(expand)}
          </div>
        </div>
        {expand && hasInput && (
          <div className={style.body}>
            {bodyText}
            {!pass && senderEmailCount > 0 && (
              <div
                className={style.action}
                onClick={() => {
                  handleAddSender && handleAddSender();
                }}
              >
                去添加
              </div>
            )}
          </div>
        )}
        {expand && !hasInput && AddContactComp()}
      </div>
    );

    return {
      id: ValidatorType.SingleSendCount,
      success: hasInput ? pass : false,
      UI: ui,
    };
  };

  const AddContactComp = () => {
    return <div className={style.body}>请先添加收件人</div>;
  };

  const handleClickExpand = (type: ValidatorType) => {
    let expand = type === expandType;
    if (expand) {
      setExpandType(undefined);
    } else {
      setExpandType(type);
    }
  };

  const CompanyContactCountUI = (): Result => {
    let hasInput = (param?.receiverInfo?.contacts?.length || 0) > 0;
    let beyondLimit: any[] = [];
    let limitCount = limitData?.sameDomainLimit ?? 20;
    Object.keys(domainKV).forEach(k => {
      let values = domainKV[k] || {};
      if (values.length > limitCount) {
        beyondLimit.push(k);
      }
    });
    let pass = hasInput && beyondLimit.length === 0;
    let expand = expandType === ValidatorType.SameCompanyReceivers;
    let ui = (
      <div className={style.border}>
        <div
          className={style.borderHeader}
          onClick={() => {
            handleClickExpand(ValidatorType.SameCompanyReceivers);
          }}
        >
          <div className={style.left}>收件人-同企业收件人超过{limitCount}</div>
          <div className={style.right}>
            {!pass && <div className={style.number}>{beyondLimit.length || 1}</div>}
            {getExpandIcon(expand)}
          </div>
        </div>
        {expand && beyondLimit.length > 0 && (
          <div className={style.body}>
            <div className={style.notice}>单任务建议将同企业的收件人数量控制在{limitCount}以下</div>
            <div className={style.inner}>
              <CollapsibleWrap
                UI={beyondLimit.map(i => {
                  return (
                    <div className={style.domain}>
                      <Tooltip title={i}>
                        <div className={style.do}>域名：{i}</div>
                      </Tooltip>
                      <div className={style.person}>收件人：{domainKV[i]?.length || 0}</div>
                    </div>
                  );
                })}
              />
            </div>
            <div
              className={style.action}
              onClick={() => {
                clearBeyondLimitEmails && clearBeyondLimitEmails();
              }}
            >
              {'去清除'}
            </div>
          </div>
        )}
        {expand && beyondLimit.length === 0 && hasInput && <div className={style.body}>此任务不存在同企业收件人超过{limitCount}的域名</div>}
        {expand && !hasInput && AddContactComp()}
      </div>
    );
    return {
      id: ValidatorType.SameCompanyReceivers,
      success: hasInput ? pass : false,
      UI: ui,
    };
  };

  const EmailSubjectsUI = (): Result => {
    let contactsCount = param?.receiverInfo?.contacts?.length || 0;
    let subjects = param?.sendSettingInfo?.emailSubjects?.length || 0;
    let hasInput = contactsCount > 0;
    let subjectsMaxCount = 5;
    let limitCount = limitData?.singleSubjectSendCountLimit ?? 500;
    let pass = false;
    if (contactsCount / subjects < limitCount) {
      pass = true;
    }
    if (subjects === subjectsMaxCount) {
      pass = true;
    }
    let cLeft = Math.min(contactsCount / limitCount, subjectsMaxCount);
    let stillNeedCount = Math.ceil(cLeft - subjects);

    let bodyText = '';
    if (pass) {
      bodyText = `收件人${contactsCount}，添加主题${subjects}个，单任务${subjects === subjectsMaxCount ? '建议' : '平均'}一个主题发送小于${limitCount}人`;
    } else {
      bodyText = `收件人${contactsCount}人，还可以添加主题${stillNeedCount}个，单任务建议平均一个主题发送小于${limitCount}人`;
    }
    let expand = expandType === ValidatorType.Subjects;

    let showCount = stillNeedCount > 0 ? stillNeedCount : 0;
    if (!hasInput) {
      showCount = 1;
    }

    let ui = (
      <div className={style.border}>
        <div
          className={style.borderHeader}
          onClick={() => {
            handleClickExpand(ValidatorType.Subjects);
          }}
        >
          <div className={style.left}>邮件内容-邮件主题</div>
          <div className={style.right}>
            {showCount > 0 && <div className={style.number}>{showCount}</div>}
            {getExpandIcon(expand)}
          </div>
        </div>
        {expand && hasInput && (
          <div className={style.body}>
            {bodyText}
            {!pass && (
              <div
                className={style.action}
                onClick={() => {
                  handleAddSubject && handleAddSubject();
                }}
              >
                去添加
              </div>
            )}
          </div>
        )}
        {expand && !hasInput && AddContactComp()}
      </div>
    );
    return {
      id: ValidatorType.SenderEmails,
      success: hasInput ? pass : false,
      UI: ui,
    };
  };

  const ExceptionReceiverUI = (): Result => {
    let contactsCount = param?.receiverInfo?.contacts?.length || 0;
    let hasInput = contactsCount > 0;
    let isConvenientSend = sendType !== 1;
    let pass = hasInput && invalidRecvs.length === 0 && !isConvenientSend;

    let bodyText = '';
    if (pass) {
      bodyText = '此任务收件人过滤后没有异常收件地址';
    } else {
      bodyText = `无效地址 ${invalidRecvs.length}`;
    }

    if (isConvenientSend) {
      bodyText = '';
    }
    let expand = expandType === ValidatorType.ExceptionReceviers;
    let showCount = invalidRecvs.length;
    if (!hasInput) {
      showCount = 1;
    }
    let ui = (
      <div className={style.border}>
        <div
          className={style.borderHeader}
          onClick={() => {
            handleClickExpand(ValidatorType.ExceptionReceviers);
          }}
        >
          <div className={style.left}>收件人-异常收件地址</div>
          <div className={style.right}>
            {isConvenientSend && <span className={style.warning}>未过滤</span>}
            {!isConvenientSend && !pass && <div className={style.number}>{showCount > 9999 ? '9999+' : showCount}</div>}
            {getExpandIcon(expand)}
          </div>
        </div>
        {expand && hasInput && (
          <div className={style.body}>
            {bodyText}
            {!pass && (
              <div
                className={style.action}
                onClick={() => {
                  clearExceptionEmail && clearExceptionEmail();
                }}
              >
                {isConvenientSend ? '过滤地址' : '清除异常地址'}
              </div>
            )}
          </div>
        )}
        {expand && !hasInput && AddContactComp()}
      </div>
    );
    return {
      id: ValidatorType.ExceptionReceviers,
      success: hasInput ? pass : false,
      UI: ui,
    };
  };

  const handleMailContentCheck = () => {
    mailContentCheck && mailContentCheck.forEach(action => action());
  };
  const handleMailContentReCheck = () => {
    mailContentCheck && mailContentCheck.forEach(action => action());
    mailContentReCheck && mailContentReCheck.forEach(action => action());
  };

  const getExpandIcon = (expand: boolean) => {
    return expand ? <TongyongJiantouShang className={style.openIcon} /> : <TongyongJiantouXia className={style.openIcon} />;
  };

  return (
    <div className={style.root}>
      {checkResultFailed.length > 0 && (
        <div className={style.resultWrap}>
          <div className={style.resultTitle}>
            <AlertIcon className={style.resultIcon} />
            建议汇总
          </div>
          {(param?.receiverInfo?.contacts?.length || 0) === 0 && <div className={style.noContact}>请先添加收件人</div>}
          {checkResultFailed.map(result => result.UI)}
        </div>
      )}
      {checkResultSuc.length > 0 && (
        <div className={style.resultWrap}>
          <div className={style.resultTitle}>
            <SuccessIcon className={style.resultIcon} />
            通过诊断
          </div>
          {checkResultSuc.map(result => result.UI)}
        </div>
      )}
    </div>
  );
};

export const availableEmailbyDNS = (s: SendBoxSender) => {
  if ([s.spf1Status, s.dkimStatus, s.dmarcStatus].includes(2)) {
    return false;
  }
  return true;
};
