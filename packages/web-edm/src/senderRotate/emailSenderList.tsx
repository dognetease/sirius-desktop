import React, { useEffect, useState, useImperativeHandle, useRef } from 'react';
import { Skeleton } from 'antd';
import style from './emailSenderList.module.scss';
import EmptySvg from '@/images/icons/edm/yingxiao/edm-sender-rotate-empty.svg';
import { EDMAPI } from '../utils';
// import Divider from '@web-common/components/UI/Divider';
import Divider from '@lingxi-common-component/sirius-ui/Divider';

import {
  SendBoxSender,
  SenderRotateList,
  WarmUpData,
  apiHolder,
  SenderListV2Resp,
  getIn18Text,
  apis,
  AccountApi,
  MailConfApi,
  CheckEmailAddressInfo,
  DataStoreApi,
} from 'api';
import { DOMAIN_MATCH_REGEX } from '../utils/utils';
// import SiriusCheckbox from '@web-common/components/UI/Checkbox/siriusCheckbox';
import SiriusCheckbox from '@lingxi-common-component/sirius-ui/Checkbox';
import ExplanationIcon from '@/images/icons/edm/yingxiao/explanation-gray16px.svg';
import ExplanationRedIcon from '@/images/icons/edm/yingxiao/explanation-red16px.svg';
import HollowOutGuide from '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide';
import { useAppSelector } from '@web-common/state/createStore';

// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import { usePermissionCheck } from '@/components/UI/PrivilegeEnhance';
const PRESENT = 'ntesmail.com';
// import SiriusModal from '@web-common/components/UI/SiriusModal';
import SiriusModal from '@lingxi-common-component/sirius-ui/SiriusModal';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as AnxinfaIcon } from '@/images/icons/edm/yingxiao/anxinfa.svg';
import { availableEmailbyDNS } from '../send/validator/validator';
export interface Props {
  displayOnly?: boolean;
  preCheckList?: string[];
  valueChanged?: () => void;
  // 组件调用来源，有针对性文案展示
  source?: string;
  // 上次选择邮箱列表，优先级最高，没有则使用接口返回邮箱列表
  recentEmails?: string[];
  /**
   * 改区域展示了
   */
  visible?: boolean;
  /**
   * 控制 containerRef 滚动
   */
  containerScroll?: () => void;
}

export const STATUS_LIST = [getIn18Text('YANZHENGZHONG...'), getIn18Text('YANZHENGCHENGGONG'), getIn18Text('YANZHENGSHIBAI')];
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;

export const showDNSErrorDialog = (item: SendBoxSender) => {
  SiriusModal.info({
    width: 400,
    content: (
      <div className={style.senderEmailPopoverContent}>
        <p className={style.popoverTitle}>验证域名认证 (基础认证完善有助于提升送达率) ：</p>
        <p className={style.popoverDesc}>SPF: {STATUS_LIST[item.spf1Status]}</p>
        <p className={style.popoverDesc}>DKIM: {STATUS_LIST[item.dkimStatus]}</p>
        <p className={style.popoverDesc}>DMARC: {STATUS_LIST[item.dmarcStatus]}</p>
        <Divider margin={12} />
        <p className={style.popoverSubTitle}>配置方式（可在微信群中联系服务助手，获取人工服务）：</p>
        <p className={style.popoverDesc}>企业管理员 &gt; 网易邮箱管理后台 &gt; 域名管理模块 &gt; 查询配置项 &gt; 域名设置后台进行配置</p>
      </div>
    ),
    okText: '知道了',
    okCancel: false,
    icon: null,
  });
};

export interface Interface {
  getSenderList: () => CheckEmailAddressInfo[];
}

const edmApi = EDMAPI();
const maxPersonalSenderCount = 2;
const ANXINFAEMAIL = 'ANXINFAEMAIL';

const systemApi = apiHolder.api.getSystemApi();
const mailConfigApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

export const EmailSenderList = React.forwardRef<Interface, Props>((props, ref) => {
  const { displayOnly, valueChanged, source, preCheckList, recentEmails, visible, containerScroll } = props;
  const fromAiHosting = source === 'aiHosting';
  const [personalSenderList, setPersonalSenderList] = useState<SendBoxSender[]>();
  const [multiDomainList, setMultiDomainList] = useState<SenderRotateList>();
  const [pickHistory, setPickHistory] = useState<string[]>();
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(false);
  const [historyFilled, setHistoryFilled] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [emptySender, setEmptySender] = useState(false);
  const [senderListData, setSenderListData] = useState<SenderListV2Resp>();
  // 是否存在安心发
  const [hasAnxinfa, setHasAnxinfa] = useState(false);
  const [showAnxinfaTips, setShowAnxinfaTips] = useState(false);
  const anxinfaWrap = useRef<HTMLDivElement | null>(null);

  const refresh = () => {
    setRefreshKey(!refreshKey);
  };
  const hasMultiDomainPermission = usePermissionCheck('VIEW', 'EDM', 'EDM_MULTI_ACCOUNT_INFO');
  // 是否为旗舰版，旗舰版不展示
  const ultimateVersion = useAppSelector(state => state.privilegeReducer.ultimateVersion);

  useImperativeHandle(ref, () => ({
    getSenderList: (): CheckEmailAddressInfo[] => {
      let myEmail = systemApi.getCurrentUser()?.id;

      let p = personalSenderList
        ?.filter(i => i.check)
        .flatMap(i => {
          return {
            email: i.email || '',
            type: i.email === myEmail ? 0 : 1,
            id: 1,
          };
        });
      let m = multiDomainList?.accounts
        ?.filter(i => i.check)
        .flatMap(i => {
          return {
            email: i.email || '',
            type: 2,
            id: i.userType === 1 ? 3 : 2,
          };
        });
      let resp = p?.concat(m || []) || [];
      if (resp.length === 0) {
        setEmptySender(true);
      } else {
        setEmptySender(false);
      }
      return resp;
    },
  }));

  useEffect(() => {
    setLoading(true);
    edmApi.fetchSenderListV2().then(res => {
      setSenderListData(res);
    });
    accountApi.doGetAccountIsAdmin().then(res => setIsAdmin(res));
  }, []);

  useEffect(() => {
    updateSenderList();
  }, [preCheckList?.length, recentEmails?.length, senderListData]);

  // 无权限的话 回填个人邮箱以及上次选择时只回填前maxPersonalSenderCount个
  useEffect(() => {
    let realPreCheckList = preCheckList ? [...preCheckList] : [];
    if (!hasMultiDomainPermission) {
      realPreCheckList = realPreCheckList.slice(0, maxPersonalSenderCount);
    }
    if (realPreCheckList?.length || 0 > 0) {
      realPreCheckList?.forEach(i => {
        personalSenderList?.forEach(e => {
          if (i === e.email && !e.unavailable) {
            e.check = true;
          }
        });
        multiDomainList?.accounts?.forEach(e => {
          if (i === e.email) {
            e.check = true;
          }
        });
      });
    }
    refresh();
    // 如果默认勾选了登录账号需要同步
    valueChanged && valueChanged();
  }, [preCheckList?.length, personalSenderList, multiDomainList]);

  // 是否存在安心发账号
  useEffect(() => {
    const hasAnxinfa = multiDomainList?.accounts?.some(item => item.userType === 1) ?? false;
    setHasAnxinfa(hasAnxinfa);
  }, [multiDomainList]);

  // 存在安心发，让容器滚动到底部，漏出popover
  useEffect(() => {
    if (hasAnxinfa && anxinfaWrap.current && visible) {
      const data = dataStoreApi.getSync(ANXINFAEMAIL);
      if (!data.suc) {
        anxinfaWrap.current.scrollTo({
          top: 1000,
        });
        setShowAnxinfaTips(true);
        // 针对小屏要让任务设置页面滚动的最下面
        // containerScroll && containerScroll();
      }
    }
  }, [hasAnxinfa, anxinfaWrap, visible]);

  const updateSenderList = async (data?: SenderListV2Resp) => {
    const resp = data || senderListData;
    if (!resp) {
      return;
    }
    let myEmail = systemApi.getCurrentUser()?.id;

    let checkDefault = true;
    // 外面传进来了邮箱, 就不默认选中当前登录邮箱了
    if ((preCheckList?.length || 0) > 0 && myEmail && !preCheckList?.includes(myEmail)) {
      checkDefault = false;
    }

    try {
      const list = (resp?.belongSenders || []).filter(item => {
        if (item.email) {
          // 默认勾选登录账号
          if (checkDefault && myEmail && item.email === myEmail) {
            item.check = true;
          } else {
            item.check = false;
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
      // 只有明确有权限的情况下, 才展示这个
      // 旗舰版固定展示
      (ultimateVersion || hasMultiDomainPermission) &&
        setMultiDomainList({
          accounts: resp?.assignSenders,
        });
      const historyEmails = recentEmails || resp?.recentEmails || [];
      setPickHistory(hasMultiDomainPermission ? historyEmails : historyEmails.slice(0, maxPersonalSenderCount));
      setLoading(false);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const HeaderComp = () => {
    return (
      <div className={style.header}>
        <div className={style.title}>勾选多个地址可有效提升送达效果{fromAiHosting ? '，每一个收件人会按同一个地址进行多轮发信' : ''}</div>
      </div>
    );
  };

  const isEmptySender = (): boolean => {
    if ((personalSenderList?.length || 0) + (multiDomainList?.accounts?.length || 0) === 0) {
      return true;
    }
    return false;
  };

  const showEmptyToast = () => {
    toast.error({ content: fromAiHosting ? '需至少选中一个个人邮箱' : '至少选择一个发件地址' });
  };

  const multiHasSelected = () => {
    return (multiDomainList?.accounts?.filter(i => i.check).length || 0) > 0;
  };
  const personalHasSelected = () => {
    return (personalSenderList?.filter(i => i.check).length || 0) > 0;
  };

  const hasSelectedBut = (e: string) => {
    for (let p of personalSenderList || []) {
      if (p.check && p.email !== e) {
        return true;
      }
    }
    for (let m of multiDomainList?.accounts || []) {
      if (m.check && m.email !== e) {
        return true;
      }
    }
    return false;
  };

  const personalHasSelectedBut = (e: string) => {
    for (let p of personalSenderList || []) {
      if (p.check && p.email !== e) {
        return true;
      }
    }
    return false;
  };

  const handlePersonalEmailClick = (check: boolean, s?: SendBoxSender, all?: boolean) => {
    if (check) {
      setEmptySender(false);
    }
    const showToast = () => {
      toast.error({ content: `未开通多域名营销，最多支持选择${maxPersonalSenderCount}个发件地址` });
    };

    if (all) {
      if (check && (personalSenderList?.length || 0) > maxPersonalSenderCount && !hasMultiDomainPermission) {
        showToast();
        return;
      }
      // 营销托管来源如果取消个人邮箱所有选中
      if (!check && fromAiHosting) {
        showEmptyToast();
        return;
      }
      if (!check && !multiHasSelected()) {
        showEmptyToast();
        return;
      }
      personalSenderList?.forEach(i => {
        if (!i.unavailable) {
          i.check = check;
        }
      });
      refresh();
      valueChanged && valueChanged();
      return;
    }

    let checkedCount = personalSenderList?.filter(i => i.check).length || 0;
    if (check && checkedCount + 1 > maxPersonalSenderCount && !hasMultiDomainPermission) {
      showToast();
      return;
    }
    if (s) {
      // 营销托管来源如果取消当前邮箱选中且没有其他个人邮箱选中
      if (!check && fromAiHosting && !personalHasSelectedBut(s.email)) {
        showEmptyToast();
        return;
      }
      if (!check && !hasSelectedBut(s.email)) {
        showEmptyToast();
        return;
      }
      s.check = check;
      valueChanged && valueChanged();
    }
  };

  const handleMultiDomainClick = (check: boolean, s?: WarmUpData, all?: boolean) => {
    if (check) {
      setEmptySender(false);
    }
    if (all) {
      if (!check && !personalHasSelected()) {
        showEmptyToast();
        return;
      }

      multiDomainList?.accounts?.forEach(i => {
        i.check = check;
      });
      valueChanged && valueChanged();
      return;
    }
    if (s) {
      if (!check && !hasSelectedBut(s.email || '')) {
        showEmptyToast();
        return;
      }
      s.check = check;
      valueChanged && valueChanged();
    }
  };

  const PersonalSenderListComp = () => {
    if ((personalSenderList?.length || 0) === 0) {
      return undefined;
    }
    let indeterminate = false;
    let checkAll = false;

    let hasDisableEmail = (personalSenderList?.filter(i => i.unavailable).length || 0) > 0;

    let checkedCount = personalSenderList?.filter(i => i.check).length || 0;

    if (checkedCount > 0) {
      indeterminate = true;
      if (checkedCount === personalSenderList?.length) {
        checkAll = true;
        indeterminate = false;
      }
    }
    return (
      <div className={style.content}>
        <SiriusCheckbox
          className={style.checkAll}
          disabled={displayOnly}
          checked={checkAll}
          indeterminate={indeterminate}
          onChange={e => {
            if (hasDisableEmail) {
              let hasUnCheckedEmail = (personalSenderList?.filter(i => !i.unavailable && !i.check).length || 0) > 0;
              if (indeterminate) {
                handlePersonalEmailClick(hasUnCheckedEmail, undefined, true);
              } else {
                handlePersonalEmailClick(e.target.checked, undefined, true);
              }
            } else {
              handlePersonalEmailClick(e.target.checked, undefined, true);
            }
            refresh();
          }}
        >
          <div className={style.title}>个人邮箱发件地址：</div>
        </SiriusCheckbox>
        <div className={style.emails}>
          {personalSenderList?.map(i => {
            return generalItem(i, 'personal');
          })}
        </div>
      </div>
    );
  };
  const SenderRotateListComp = () => {
    if ((multiDomainList?.accounts?.length || 0) === 0) {
      return undefined;
    }
    let indeterminate = false;
    let checkAll = false;

    let checkedCount = multiDomainList?.accounts?.filter(i => i.check).length || 0;
    let hasDisableEmail = false; // (multiDomainList?.accounts?.filter(i => i.unavailable).length || 0) > 0;

    if (checkedCount > 0) {
      indeterminate = true;
      if (checkedCount === multiDomainList?.accounts?.length) {
        checkAll = true;
        indeterminate = false;
      }
    }
    return (
      <div className={style.content}>
        <SiriusCheckbox
          className={style.checkAll}
          checked={checkAll}
          disabled={displayOnly}
          indeterminate={indeterminate}
          onChange={e => {
            handleMultiDomainClick(e.target.checked, undefined, true);
            refresh();
          }}
        >
          <div className={style.multiTitle}>
            多域名邮箱发件地址
            <Tooltip title={'为保证送达效果，每个多域名营销地址建议当日发信量上限 500 封'}>
              <img src={ExplanationIcon} className={style.multiImg} />
            </Tooltip>
            ：
          </div>
        </SiriusCheckbox>
        <div className={style.emails}>
          {multiDomainList?.accounts?.map(i => {
            return generalItem(i, 'multiDomain');
          })}
        </div>
      </div>
    );
  };

  const generalItem = (item: WarmUpData | SendBoxSender, type: 'personal' | 'multiDomain') => {
    let shouldShowUnunavailableTag = item.unavailable;
    if (type === 'personal' && (item as SendBoxSender).giftDomain) {
      shouldShowUnunavailableTag = false;
    }

    let shouldShowDNSError = type === 'personal' && !availableEmailbyDNS(item as SendBoxSender);
    if (type === 'personal' && (item as SendBoxSender).giftDomain) {
      shouldShowDNSError = false;
    }

    const isAnxinfa = (item as SendBoxSender).userType === 1;

    return (
      <div className={style.item}>
        <SiriusCheckbox
          className={style.checkBox}
          disabled={displayOnly ? true : type === 'personal' ? item.unavailable : false}
          checked={item.check}
          onChange={i => {
            if (type === 'personal') {
              handlePersonalEmailClick(i.target.checked, item as SendBoxSender, false);
            }
            if (type === 'multiDomain') {
              handleMultiDomainClick(i.target.checked, item as WarmUpData, false);
            }
            refresh();
          }}
        >
          <Tooltip title={item.email} placement="top">
            <div className={style.title}>{item.email}</div>
          </Tooltip>
        </SiriusCheckbox>
        {shouldShowUnunavailableTag && (
          <div style={{ flexShrink: '0' }}>
            <Tooltip title={'此邮箱地址当日发信已触达500封上限。若继续发信将影响后续送达效果'}>
              <img src={ExplanationIcon} style={{ width: '16px', height: '16px' }} />
            </Tooltip>
          </div>
        )}
        {isAnxinfa && (
          <HollowOutGuide
            guideId={ANXINFAEMAIL}
            title=""
            intro="旗舰版用户获赠一个优质发信账号，专享”安心发“服务。发信时使用多域名发件地址，能避免企业域名账号因频繁发信被降低信誉度，有效提升送达效果"
            placement="rightBottom"
            okText="知道了"
            type="1"
            enable={showAnxinfaTips}
          >
            <div className={style.iconWrap}>
              <Tooltip placement="top" title={'旗舰版获赠一个优质发信账号，专享”安心发“服务'}>
                {/* <img src={ExplanationIcon} style={{ width: '16px', height: '16px' }} /> */}
                <AnxinfaIcon />
              </Tooltip>
            </div>
          </HollowOutGuide>
        )}
        {shouldShowDNSError && (
          <Tooltip
            title={
              <span>
                此域名基础认证待完善，请在域名设置后台进行配置。
                <span
                  style={{ color: '#4C6AFF', cursor: 'pointer', marginRight: '0px' }}
                  onClick={() => {
                    showDNSErrorDialog(item as SendBoxSender);
                  }}
                >
                  详情
                </span>
              </span>
            }
          >
            <img src={ExplanationRedIcon} style={{ width: '16px', height: '16px' }} />
          </Tooltip>
        )}
        {type === 'personal' && (item as SendBoxSender).giftDomain && (
          <Tooltip
            title={
              <span>
                赠送域名无法发送邮件营销，可进入管理后台绑定三方域名
                {isAdmin && (
                  <span style={{ color: '#4C6AFF', cursor: 'pointer', marginRight: '0px' }} onClick={handleBackEnd}>
                    去配置
                  </span>
                )}
              </span>
            }
          >
            <img src={ExplanationRedIcon} style={{ width: '16px', height: '16px' }} />
          </Tooltip>
        )}
      </div>
    );
  };

  const handleBackEnd = async () => {
    const redirectUrl =
      mailConfigApi.getWebMailHost(true) + '/admin/login.do?anchor=/domainManage/domainManage&hl=zh_CN&uid=' + systemApi.getCurrentUser()?.id + '&app=admin&all_secure=1';
    const url: string | undefined = await mailConfigApi.getWebSettingUrlInLocal('', { url: redirectUrl });
    if (url && url.length > 0) {
      systemApi.openNewWindow(url, false, undefined, undefined, true);
    } else {
      toast.warn({
        content: getIn18Text('WUFADAKAIZHI'),
        duration: 3,
      });
    }
  };

  const backFillHistory = () => {
    personalSenderList?.forEach(i => (i.check = false));
    multiDomainList?.accounts?.forEach(i => (i.check = false));
    pickHistory?.forEach(i => {
      personalSenderList?.forEach(s => {
        if (i === s.email) {
          s.check = true;
        }
      });
      multiDomainList?.accounts?.forEach(s => {
        if (i === s.email) {
          s.check = true;
        }
      });
    });
    setHistoryFilled(true);
  };

  const HistoryComp = () => {
    if ((pickHistory?.length || 0) === 0) {
      return undefined;
    }
    if (historyFilled || displayOnly) {
      return undefined;
    }
    let title = '上次选择：' + pickHistory?.join('; ');
    return (
      <Tooltip title={title}>
        <div className={style.history} onClick={backFillHistory}>
          {title}
        </div>
      </Tooltip>
    );
  };

  const ErrorComp = () => {
    if (emptySender && !fromAiHosting) {
      return <div className={style.error}>请选择发件地址</div>;
    }
    return undefined;
  };

  const EmptyListComp = () => {
    return (
      <div className={style.empty}>
        <img src={EmptySvg} />
        <div className={style.title}>暂无数据</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={style.root}>
        <Skeleton />
      </div>
    );
  }

  return (
    <>
      <div className={style.root} ref={anxinfaWrap} style={emptySender ? { border: '1px solid #fe5b4c' } : { border: '1px solid #e1e3e8' }}>
        {HeaderComp()}
        {HistoryComp()}
        {PersonalSenderListComp()}
        {SenderRotateListComp()}
        {isEmptySender() && EmptyListComp()}
      </div>
      {ErrorComp()}
      <div className={style.sendTips}>当您的发件地址触发相同邮件服务商的发送限制后，网易外贸通将替您代发邮件，以增加邮件的覆盖率。</div>
    </>
  );
});
