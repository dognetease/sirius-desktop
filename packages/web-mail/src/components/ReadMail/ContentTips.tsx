/**
 *  邮件正如的tips
 *  例如：钓鱼邮件提示
 *  定时邮件提示，邮件点赞提示等
 */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MailStatus, OpenRecordData } from '../../util';
import {
  MailEntryModel,
  MailEmoticonInfoModel,
  apis,
  apiHolder,
  apiHolder as api,
  MailConfApi,
  DataStoreApi,
  TranslatStatusInfo,
  AccountApi,
  StoreData,
  DataTrackerApi,
  DeliveryDetail,
  MailApi,
  SystemApi,
  ContactApi,
  ProductAuthApi,
} from 'api';
import { FLOLDER, FolderId2NameChineseMap } from '@web-mail/common/constant';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import SpamAlertIcon from '@/images/icons/alert/spam-alert-icon.svg';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import Sticky from '../Sticky';
import OpenRecords from '../OpenRecords/OpenRecords';
import TranslateTips from '../TranslateTips';
import ScheduleDate from './component/ScheduleDate';
import { useAppSelector } from '@web-common/state/createStore';
import { SenderPriority } from '../SenderPriority/sender_priority';
import TodoMailTip from '../TodoMail/TodoMailTip';
import ThumbUp from '../ThumbUp';
import { setCurrentAccount } from '../../util';
import { FeatureConfig } from '@web-mail/types';
import get from 'lodash/get';
import RevokeTip from './RevokeTip';
import { Collapse } from 'antd';
import { ReactComponent as TranslateSuccess } from '@/images/translate_success.svg';
import { ReactComponent as ArrowExpandGray } from '@/images/icons/arrow_expand_gray.svg';
import { ReactComponent as ArrowDown } from '@/images/icons/arrow-down.svg';
import moment from 'moment';
// import lodashGet from 'lodash/get';
import RequestReadReceipt from '../RequestReadReceipt/RequestReadReceipt';
import variables from '@web-common/styles/export.module.scss';
import ErrorBoundary from '@web-common/hooks/ErrorBoundary';
import useGetUniqueFn from '@web-mail/hooks/useGetUniqueFn';
import { getIn18Text } from 'api';
import Unlock from '../Unlock/Unlock';
import { useContactModel } from '@web-common/hooks/useContactModel';
import EdmReplyMark from './EdmReplyMark';
import MailContentHeader from './component/MailContentHeader/MailContentHeader';

const { Panel } = Collapse;
// 中英文文案

interface Props {
  style: React.CSSProperties;
  content: MailEntryModel;
  // todo: listData 需要切换为最新的名称，老名字词不达意
  listData?: MailStatus;
  openRecordData?: OpenRecordData;
  getMailReadDetail?: (content: MailEntryModel) => void;
  // todo: 刷新等功能迁移完毕后需要删除掉，逐层传递实在太蛋疼
  refreshData?(): void;
  emoticonInfo: MailEmoticonInfoModel | undefined;
  handleEmoticon(data: MailEmoticonInfoModel, mid: string): void;
  translateInfo?: TranslatStatusInfo;
  handleTranslateLang?: (value: string) => void;
  featureConfig?: FeatureConfig;
  forceUpdate: number;
  unlockMail?: (unlockCont: MailEntryModel) => void;
  showMailHead?: boolean;
  onShowMailHeadChange?: (value: boolean) => void;
}
// Track结尾用于埋点上报，不做中英文替换
const SUSPICIOUS_MAP = new Map([
  ['hitMailboxWhite', '邮箱地址白名单'],
  ['hitMailboxWhiteTrack', '可疑-个人白名单漏入'],
  ['hitDomainWhite', '域白名单'],
  ['hitDomainWhiteTrack', '可疑-企业白名单漏入'],
  ['hitUserRuleTrack', '可疑-来信分类漏入'],
  ['hitUserRule', '来信分类规则'],
]);
// 本地模拟的邮件分发数据，联调后删除
const mockDeliveryData = {
  distributeCount: 0,
  distributeList: [],
};

const nsSettingPrefix = 'notShowSpamTipsForMail-';
const mailManagerApi = apiHolder.api.requireLogicalApi('mailConfApiImpl') as unknown as MailConfApi;
const storeApi: DataStoreApi = api.api.getDataStoreApi();
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as unknown as AccountApi;
const eventApi = apiHolder.api.getEventApi();
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const productAuthApi = api.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as ContactApi;

const ContentTips: React.FC<Props> = ({
  content,
  forceUpdate,
  listData,
  openRecordData,
  getMailReadDetail,
  refreshData,
  emoticonInfo,
  handleEmoticon,
  translateInfo,
  handleTranslateLang,
  featureConfig,
  unlockMail,
  style,
  showMailHead,
  onShowMailHeadChange,
}) => {
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  const { sendingMails } = useAppSelector(state => state.mailReducer);

  // 邮件翻译错误捕获ref
  const translateEbRef = useRef<{ reset: () => void } | null>(null);
  // 当前页签
  const tabList = useAppSelector(state => state.mailTabReducer.tabList);
  // 当前页签是否未关闭 -- 由于页面被缓存，可疑邮件tip期望点击关闭按钮后重新进入能再次展示，所以使用这种方案解决
  const tabUnClose = useMemo(() => {
    return !!tabList.find(item => item?.id === content?.id);
  }, [tabList, content?.id]);
  const [riskReminderOpen, setRiskReminderOpen] = useState<boolean>(false); // 风险提醒是否开启
  // 邮件分发数据
  const [deliveryData, setDeliveryData] = useState<DeliveryDetail | null>(mockDeliveryData);
  // 是否显示邮件分发详情
  const [deliveryDetailKey, setDeliveryDetailKey] = useState<string>('');
  // 默认展示第一个
  const [deliveryDetailActiveKey, setDeliveryDetailActiveKey] = useState<string[]>([]);

  // const [alwaysShowReminder, setAlwaysShowReminder] = useState<boolean>(false);
  const [neverShow, setNeverShow] = useState(false);
  const [spam, setSpam] = useState(false);
  const [refuselist, setRefuselist] = useState<string[]>([]);
  const folder = useMemo(() => {
    return content?.entry?.folder;
  }, [content]);
  const [showPhishing, setShowPhishing] = useState(false);
  const [showSuspicious, setShowSuspicious] = useState(false);
  // 是否钓鱼邮件
  const isPhishing = useMemo(() => {
    return content.entry.suspiciousSpam === true && content.antispamInfo?.asMailType === 'phishing';
  }, [content]);
  // 其他的可疑邮件
  const isDubious = useMemo(() => {
    return content.entry.suspiciousSpam === true && content.antispamInfo?.asMailType != null && content.antispamInfo?.asMailType !== 'phishing';
  }, [content]);
  // 可疑邮件进入非垃圾邮件文件夹的具体原因，展示优先级最高
  const suspiciousIgnoreReason = useMemo(() => {
    return content.antispamInfo?.asIgnoreReason || '';
  }, [content]);
  useEffect(() => {
    if ((isPhishing || isDubious) && suspiciousIgnoreReason && folder !== 5 && !showSuspicious) {
      setShowSuspicious(true);
      setTrackData();
    } else if ((isPhishing || isDubious) && !showPhishing && !showSuspicious) {
      setShowPhishing(true);
    }
  }, [isPhishing, isDubious, suspiciousIgnoreReason, tabUnClose]);

  // 当前版本信息
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();

  const senderContactModel = useContactModel({
    email: content?.sender?.contact?.contact?.accountName || '',
  });

  // 顶部提示是否展示
  const promptShow = useMemo(() => {
    const isSpam = content?.entry?.suspiciousSpam;
    const isSenderInContactBook = senderContactModel?.contact.type && senderContactModel?.contact.type !== 'external';
    const isSystem = content?.entry?.system;
    const inSpecbox = [1, 5, 4].includes(folder) || folder >= 100;
    const senderEmail = content?.sender?.contact?.contact?.accountName || '';

    return (
      content?.entry &&
      !isSenderInContactBook && // 不在通讯录
      inSpecbox && // 位于指定文件夹
      !isSystem && // 非系统账号
      !isSpam && // 非钓鱼
      !isCorpMail && //非corp
      ['sirius'].includes(productVersionId) && // 尊享版
      !accountApi.doGetEmailInCurrentDomain(senderEmail) && // 非同域账号
      !refuselist.includes(senderEmail)
    );
  }, [content, folder, isCorpMail, productVersionId, refuselist, senderContactModel?.contact.type]);

  const getRefuselist = useCallback(() => {
    // setCurrentAccount(content?._account);
    storeApi.get('refuselist', { _account: content?._account }).then((res: StoreData) => {
      const { suc, data } = res;
      if (!suc || !data) return;
      try {
        const refuselist = JSON.parse(data);
        if (Array.isArray(refuselist)) {
          setRefuselist(refuselist);
        }
      } catch (error) {
        console.log('获取黑名单失败', error);
      }
    });
  }, []);

  /**
   * 获取处理邮件分发的请求，根据邮件id唯一执行
   */
  const handleDoGetContactByEmailsAdvance = useGetUniqueFn(
    (mapRes, res, result) => {
      res.distributeList.forEach(i => {
        i.distributeMember.forEach(c => {
          c.contactName = mapRes[c.email as string][0]?.contact?.contactName || '';
        });
      });
      const distributeListCp = res.distributeList.sort((a, b) => +b.distributeTime - +a.distributeTime);
      result.distributeList = distributeListCp;
      return result;
    },
    [content?.id]
  );

  // 邮件分发详情数据整理
  const transformData = (res: DeliveryDetail): Promise<DeliveryDetail> => {
    let result: DeliveryDetail = {
      distributeCount: res.distributeCount,
      distributeList: res.distributeList,
    };
    const emailArr: string[] = [];
    res.distributeList.forEach(i => {
      i.distributeMember.forEach(c => {
        emailArr.push(c.email);
      });
    });
    // const { mapRes } = await contactApi.doGetContactByEmailsAdvance({
    return contactApi
      .doGetContactByEmailsAdvance({
        emails: [...new Set(emailArr)],
        useEdm: systemApi.inEdm(),
        needGroup: true,
      })
      .then(({ mapRes }) => {
        return handleDoGetContactByEmailsAdvance(mapRes, res, result);
      });
    // res.distributeList.forEach(i => {
    //   i.distributeMember.forEach(c => {
    //     c.contactName = mapRes[c.email as string][0]?.contact?.contactName || '';
    //   });
    // });
    // const distributeListCp = res.distributeList.sort((a, b) => +b.distributeTime - +a.distributeTime);
    // result.distributeList = distributeListCp;
    // return result;
  };

  // 邮件分发详情请求的mid，防止返回详情和当前邮件不一致造成的展示错误
  // const requestMid = useStateRef(content?.id);

  /**
   * 获取根据邮件id执行的方法
   * 如果有useCallback,一定要添加到依赖中
   */
  const handleMailDeliveryDetailChange = useGetUniqueFn(
    async res => {
      if (res && res.distributeCount) {
        const result = await transformData(res);
        setDeliveryData(result);
      } else {
        setDeliveryData({
          distributeCount: 0,
          distributeList: [],
        });
      }
    },
    [content?.id]
  );

  /**
   * 处理邮件分发获取失败
   * 如果有useCallback,一定要添加到依赖中
   */
  const handleMailDeliveryDetailError = useGetUniqueFn(
    err => {
      setDeliveryData({
        distributeCount: 0,
        distributeList: [],
      });
      console.log('获取邮件分发详情失败:', err);
    },
    [content?.id]
  );

  // 获取邮件分发详情
  const getDeliveryDetail = (mid: string) => {
    // 此处现根据forwarded字段，来判断是否需要请求分发详情。
    if (content.entry?.directForwarded) {
      // setDeliveryDetailKey(''); // 先收起折叠
      setDeliveryDetailActiveKey(['0']); // 选中第一个
      document.getElementsByClassName('delivery-tip-content')[0]?.scrollTo({ top: 0 }); // 滚动到顶部
      // requestMid.current = mid;
      // setCurrentAccount(content._account);
      mailApi
        .getMailDeliveryDetail(mid, content._account || '')
        .then(async res => {
          handleMailDeliveryDetailChange(res);
          // if (res && res.distributeCount && requestMid.current === mid) {
          //   const result = await transformData(res);
          //   setDeliveryData(result);
          // } else {
          //   setDeliveryData({
          //     distributeCount: 0,
          //     distributeList: [],
          //   });
          // }
        })
        .catch(err => {
          handleMailDeliveryDetailError(err);
          // setDeliveryData({
          //   distributeCount: 0,
          //   distributeList: [],
          // });
          // console.log('获取邮件分发详情失败:', err);
        });
    } else {
      // 没有转发过，则直接置空即可，不在发请求
      setDeliveryData({
        distributeCount: 0,
        distributeList: [],
      });
    }
  };
  // 切换邮件或者directForwarded字段变化（邮件分发）之后，触发一次
  useEffect(() => {
    // 获取一次邮件分发详情
    getDeliveryDetail(content?.id);
  }, [content?.id, content.entry?.directForwarded]);

  /**
   * 获取根据邮件id执行的方法
   */
  const riskReminderStatusChange = useGetUniqueFn(
    res => {
      setRiskReminderOpen([0, 2].includes(res));
    },
    [content?.id]
  );

  // 获取提醒设置开关
  useEffect(() => {
    // corpMail暂不支持该功能
    if (isCorpMail) return;
    // setCurrentAccount(content?._account);
    /**
     * 对请求进行唯一性包装可以解决一部分问题，但是对于非关键业务逻辑，请求并不总是发出。
     * 依靠请求的前后顺序来保证请求的唯一性并不是什么靠谱的事情。
     * 所以对请求的处理函数进行处理。无效的请求处理直接转空调用。
     *
     */
    mailManagerApi.getRiskReminderStatus(undefined, content?._account).then((res: any) => {
      // res === 2 ? setAlwaysShowReminder(true) : setAlwaysShowReminder(false);
      riskReminderStatusChange(res);
    });
    getRefuselist();
  }, [content?.id, riskReminderStatusChange]);

  useEffect(() => {
    if (content && content.id) {
      // setCurrentAccount(content?._account);
      storeApi.get(nsSettingPrefix + content.id, { _account: content?._account }).then(rs => {
        setNeverShow(!!rs && rs.suc && !!rs.data && rs.data === 'true');
      });
      // 这里先注释，与其他可疑邮件冲突，根本展示不到SpamElement
      // if (content?.entry) {
      //   setSpam(!!content?.entry?.suspiciousSpam);
      // }
    }
  }, [content?.id]);

  // 在某些id切换的时候，重置某些崩溃的额tip业务
  useEffect(() => {
    translateEbRef.current && translateEbRef.current.reset();
  }, [content?.id]);

  /**
   * 邮件撤销
   */
  const RevokeElement = useMemo(() => {
    const sendingMail = sendingMails.find(item => item.id === content?.id);
    if (sendingMail) {
      return <RevokeTip sendingMail={sendingMail} />;
    }
    return <></>;
  }, [sendingMails.length, content?.id]);

  /**
   * 定时邮件
   */
  const ScheduleDateElement = useMemo(() => {
    return <ScheduleDate content={content} />;
  }, [content]);

  /**
   * 风险提示
   */
  const promptShowElement = useMemo(() => {
    const senderEmail = content?.sender?.contact?.contact?.accountName || '';
    const senderName = content?.sender?.contact?.contact?.contactName || '';

    return (
      <div style={{ padding: ' 0 16px' }}>
        <SenderPriority
          defaultPriority={content?.sender?.contact?.contact?.priority}
          key={content?.entry?.id}
          riskMinderOpen={riskReminderOpen}
          _account={content?._account}
          contactId={''}
          email={senderEmail}
          contact={content?.sender?.contact}
          sender={{
            email: senderEmail,
            name: senderName,
            type: content?.sender?.contact?.contact?.type,
          }}
        />
      </div>
    );
  }, [content, riskReminderOpen]);

  /**
   * 邮件阅读状态
   */
  const MailStatusElement = useMemo(() => {
    // 发信箱（不仅仅是发件箱，只要是自己发送的都需要放开） 存在数据 非corp 此账号开关打开
    // 尊享版 内外域名（状态+记录）
    // 旗舰版 内域 （状态+记录）
    const accountAlias = systemApi.getCurrentUser(content?._account)?.prop?.accountAlias || [];
    const accountAliasArray = Array.isArray(accountAlias) ? accountAlias : [accountAlias];
    const senderEmail = content?.sender?.contact?.contact?.accountName || '';
    // 在发件箱 || 别名邮箱里面包含发件人 || 发件人 == 归属账号， 认为是自己发出的
    const isSend =
      content?.entry?.folder === FLOLDER.SENT ||
      accountAliasArray.some(account => accountApi.getIsSameSubAccountSync(account, senderEmail)) ||
      accountApi.getIsSameSubAccountSync(senderEmail, content._account);
    if (
      isSend &&
      listData &&
      !isCorpMail &&
      // && featureConfig?.readStatus
      (!content.authAccountType || content.authAccountType === '0')
    ) {
      return <Sticky mid={content?.entry?.id} tid={content?.entry?.tid} fid={content?.entry?.folder} dataList={listData} refreshData={refreshData} content={content} />;
    }
    return <></>;
  }, [content, listData, refreshData, isCorpMail, featureConfig]);

  // 打开记录
  const OpenRecordsElement = useMemo(() => {
    const versionId = productAuthApi.doGetProductVersionId();
    const accountAlias = systemApi.getCurrentUser(content?._account)?.prop?.accountAlias || [];
    const accountAliasArray = Array.isArray(accountAlias) ? accountAlias : [accountAlias];
    const senderEmail = content?.sender?.contact?.contact?.accountName || '';
    // 在发件箱 || 别名邮箱里面包含发件人 || 发件人 == 归属账号， 认为是自己发出的
    const isSend =
      content?.entry?.folder === FLOLDER.SENT ||
      accountAliasArray.some(account => accountApi.getIsSameSubAccountSync(account, senderEmail)) ||
      accountApi.getIsSameSubAccountSync(senderEmail, content._account);
    // 仅限 尊享版
    if (versionId === 'sirius' && isSend && content.authAccountType && content.authAccountType !== '0') {
      return <OpenRecords content={content} openRecordData={openRecordData} getMailReadDetail={getMailReadDetail} />;
    }
    return <></>;
  }, [content, openRecordData, featureConfig]);

  /**
   * 加密解密
   */
  const UnlockElement = useMemo(() => {
    const { isEncryptedMail } = content;
    if (isEncryptedMail) return <Unlock content={content} unlockMail={unlockMail} />;
    return <></>;
  }, [content]);

  /**
   * 邮件点赞
   */
  const ThumbUpElement = useMemo(() => {
    if (!isCorpMail && emoticonInfo && emoticonInfo.involvedRecords && emoticonInfo?.involvedRecords.length > 0) {
      return <ThumbUp mid={content.entry.id} content={content} emoticonInfo={emoticonInfo} handleEmoticon={handleEmoticon} />;
    }
    return <></>;
  }, [isCorpMail, emoticonInfo, content, handleEmoticon]);

  const closeAndNeverShow = useCallback(() => {
    setNeverShow(true);
    // setCurrentAccount();
    storeApi.put(nsSettingPrefix + content?.id, 'true');
  }, [content]);

  /**
   * 钓鱼邮件
   */
  const SpamElement = useMemo(() => {
    if (!neverShow && spam) {
      return (
        <>
          <div className="spam-alert-style">
            <span>{getIn18Text('GAIYOUJIANKENENG')}</span>
            <a
              onClick={() => {
                const senderEmail = get(content, ['sender', 'contactItem', 'contactItemVal'], '');
                // 参考：DefaultMailMenuConfig.tsx
                eventApi.sendSysEvent({
                  eventName: 'mailMenuOper',
                  eventData: {
                    mailId: content.entry.id,
                    hasReport: false,
                    senderEmail,
                  },
                  eventStrData: 'report',
                  _account: content._account,
                });
              }}
            >
              去举报
            </a>
            <span className="span-alert-Warn">
              <ReadListIcons.WarnSvg />
            </span>
            <span className="spam-alert-style-close" onClick={closeAndNeverShow}>
              <ReadListIcons.SimpCloseSvg />
            </span>
          </div>
        </>
      );
    }
    return <></>;
  }, [neverShow, spam, closeAndNeverShow]);

  // 控制是否显示邮件分发详情
  const handleDeliveryTipShow = useCallback(() => {
    if (deliveryDetailKey) {
      setDeliveryDetailKey('');
    } else {
      setDeliveryDetailKey('0');
    }
  }, [deliveryDetailKey]);

  const handleDeliveryChange = useCallback((key: any) => {
    setDeliveryDetailActiveKey(key);
  }, []);

  // 邮件分发详情，异步请求服务端
  const DeliveryTipElement = useMemo(() => {
    // 如果有分发过，才展示
    if (deliveryData?.distributeCount) {
      const header = (
        <>
          <TranslateSuccess />
          <span className="delivery-tip-title">邮件已经分发{deliveryData.distributeCount}次</span>
          <span className="delivery-tip-btn" onClick={handleDeliveryTipShow}>
            {deliveryDetailKey ? getIn18Text('SHOUQI') : getIn18Text('XIANGQING')}
          </span>
        </>
      );
      return (
        <Collapse activeKey={deliveryDetailKey} bordered={false} className="delivery-outer">
          <Panel showArrow={false} header={header} key="0" className="delivery-tip-header">
            <Collapse
              bordered={false}
              onChange={handleDeliveryChange}
              activeKey={deliveryDetailActiveKey}
              expandIcon={({ isActive }) => (isActive ? <ArrowDown width={8} height={8} /> : <ArrowExpandGray width={8} height={8} />)}
              className="delivery-tip-content"
              ghost
            >
              {deliveryData.distributeList &&
                deliveryData.distributeList.map((data, index) => {
                  return (
                    <Panel
                      header={<span className="delivery-tip-time">{moment(data.distributeTime).format('YYYY-MM-DD HH:mm')}</span>}
                      key={index}
                      style={{ border: 'none', margin: 0, backgroundColor: 'transparent' }}
                    >
                      <div className="delivery-tip-email">
                        {data.distributeMember.map((i, idx) => {
                          if (i.contactName) {
                            // return <span key={idx}>{`${idx === 0 ? '' : '、'}${i.contactName} `}<span style={{ color: `${variables.text3}` }}>{`(${i.email})`}</span></span>
                            return (
                              <span key={idx}>
                                {`${idx === 0 ? '' : '、'}${i.contactName} `}
                                <span style={{ color: `${variables.text3}` }}>{`(${i.email})`}</span>
                              </span>
                            );
                          } else {
                            return `${idx === 0 ? '' : '、'}${i.email}`;
                          }
                        })}
                      </div>
                    </Panel>
                  );
                })}
            </Collapse>
          </Panel>
        </Collapse>
      );
    } else {
      return null;
    }
  }, [deliveryData, deliveryDetailKey, handleDeliveryTipShow, handleDeliveryChange, deliveryDetailActiveKey]);

  const EdmReplyMarkElement = useMemo(() => {
    if (content.id) {
      return <EdmReplyMark content={content} />;
    } else {
      return null;
    }
  }, [content.id]);

  const isThread = mailManagerApi.getMailMergeSettings() === 'true';

  // 可疑邮件漏入普通文件夹
  const SpamLeakage = useMemo(() => {
    if (!showSuspicious) {
      return <></>;
    }
    return (
      <>
        <div className={`spam-leakage${isThread ? ' spam-leakage-mg' : ''}`}>
          <span>该邮件疑似诈骗或钓鱼邮件，通过{SUSPICIOUS_MAP.get(suspiciousIgnoreReason)}漏入此文件夹。</span>
          <div className="spam-leakage-btn">
            <a
              onClick={() => {
                const result = new Map();
                result.set(content?.id, { suspiciousSpam: false });
                eventApi.sendSysEvent({
                  eventName: 'mailMenuOper',
                  eventData: {
                    mailId: content?.id,
                    result,
                  },
                  eventStrData: 'completeTrust',
                  _account: content?._account,
                });
                setShowSuspicious(false);
              }}
            >
              信任邮件
            </a>
            <a
              onClick={() => {
                const senderEmail = get(content, ['sender', 'contactItem', 'contactItemVal'], '');
                // 参考：DefaultMailMenuConfig.tsx
                eventApi.sendSysEvent({
                  eventName: 'mailMenuOper',
                  eventData: {
                    mailId: content.entry.id,
                    hasReport: false,
                    senderEmail,
                  },
                  eventStrData: 'report',
                  _account: content._account,
                });
              }}
            >
              举报邮件
            </a>
          </div>
          <img className="spam-leakage-warn" src={SpamAlertIcon} alt="" />
          <span className="spam-leakage-close" onClick={() => setShowSuspicious(false)}>
            <ReadListIcons.SimpCloseSvg />
          </span>
        </div>
      </>
    );
  }, [showSuspicious, suspiciousIgnoreReason]);

  // 新版钓鱼邮件
  const PhishingMail = useMemo(() => {
    return (
      <>
        <div className="new-spam-alert-style">
          <div
            style={{
              marginBottom: 4,
            }}
          >
            {isPhishing ? '该邮件可能为钓鱼邮件，请核对信息，谨防受骗！' : '该邮件可能为异常的垃圾邮件，请谨慎识别，万勿轻信！'}
          </div>
          <div
            style={{
              marginLeft: '-20px',
            }}
          >
            {isPhishing && (
              <a
                style={{
                  marginLeft: 20,
                }}
                href="/static_html/phishing_mail_intro.html"
                target="_blank"
              >
                如何识别钓鱼邮件
              </a>
            )}
            <a
              style={{
                marginLeft: 20,
              }}
              onClick={() => {
                const senderEmail = get(content, ['sender', 'contactItem', 'contactItemVal'], '');
                // 参考：DefaultMailMenuConfig.tsx
                eventApi.sendSysEvent({
                  eventName: 'mailMenuOper',
                  eventData: {
                    mailId: content.entry.id,
                    hasReport: false,
                    senderEmail,
                  },
                  eventStrData: 'report',
                  _account: content._account,
                });
              }}
            >
              去举报
            </a>
          </div>
          {/* <span className="span-alert-Warn">
            <ReadListIcons.WarnSvg />
          </span> */}
          <img className="span-alert-Warn" src={SpamAlertIcon} alt="" />
          <span className="spam-alert-style-close" onClick={() => setShowPhishing(false)}>
            <ReadListIcons.SimpCloseSvg />
          </span>
        </div>
      </>
    );
  }, [showPhishing, isPhishing, isDubious, suspiciousIgnoreReason]);

  // 邮件待办
  const TodoMailTipElement = useMemo(() => {
    return content.entry.isDefer ? (
      <TodoMailTip content={content} isDefer={content.entry.isDefer} deferTime={content.entry.deferTime} deferNotice={content.entry.deferNotice} />
    ) : (
      <></>
    );
  }, [content]);

  // 邮件翻译
  const TranslateTipElement = useMemo(() => {
    const showMailTranslate = !isCorpMail;
    return showMailTranslate && handleTranslateLang ? (
      <ErrorBoundary
        ref={r => (translateEbRef.current = r)}
        name="ContentTip-TranslateTip"
        extraInfo={{
          translateInfo: translateInfo,
        }}
        errorVisiable={false}
      >
        <TranslateTips
          content={content}
          translateInfo={
            translateInfo || {
              status: '',
            }
          }
          handleTranslateLang={handleTranslateLang}
        />
      </ErrorBoundary>
    ) : (
      <></>
    );
  }, [isCorpMail, translateInfo, handleTranslateLang, content]);

  // 已读回执
  const RequestReadReceiptTipElement = useMemo(() => {
    const receiptDoneIds = storeApi.getSync('receiptDoneIds').data;
    const done = receiptDoneIds ? receiptDoneIds.includes(content?.id) : false;
    return (
      <>
        {content.entry.requestReadReceiptLocal &&
          // 操作过不显示
          !done &&
          // 之前为了密送不展示，现在和老版同步，密送也展示
          // content.receiver?.some(i => i.contact?.contact?.accountName === content._account) &&
          // 草稿箱 发件箱不显示
          ![2, 3].includes(content?.entry?.folder) && <RequestReadReceipt id={content?.id} account={content?._account} />}
      </>
    );
  }, [content.entry.requestReadReceiptLocal, content?.id]);

  const setTrackData = useCallback(() => {
    const folderName = FolderId2NameChineseMap[folder + ''] || '自定义文件夹';
    if (showSuspicious) {
      // 可疑-个人白名单漏入、可疑-企业白名单漏入、可疑-来信分类漏入
      trackApi.track('show_suspiciousMailRemind_mailDetailPage', {
        remindType: SUSPICIOUS_MAP.get(`${suspiciousIgnoreReason}Track`),
        folder: folderName,
      });
    } else if (showPhishing) {
      // 异常垃圾邮件、钓鱼邮件
      trackApi.track('show_suspiciousMailRemind_mailDetailPage', {
        remindType: isPhishing ? '钓鱼邮件' : '异常垃圾邮件',
        folder: folderName,
      });
    }
  }, [showSuspicious, showPhishing, isPhishing, suspiciousIgnoreReason, folder]);

  /**
   * 查看邮件信头
   */
  const MailHeadrElement = useMemo(() => {
    return <MailContentHeader visiable={showMailHead} onVisiableChange={onShowMailHeadChange} mid={content?.entry?.id} account={content?._account}></MailContentHeader>;
  }, [showMailHead, onShowMailHeadChange, content?.entry?.id]);

  // 可疑邮件漏入普通文件夹提示优先级最高, 钓鱼邮件其次
  if (isDubious || isPhishing) {
    if (showSuspicious) {
      return SpamLeakage;
    }
    if (showPhishing) {
      return PhishingMail;
    }
    return null; // 可疑邮件不能展示后面的提示内容
  }

  return (
    <div style={style}>
      {RevokeElement}
      {ScheduleDateElement}
      {promptShow && promptShowElement}
      {MailStatusElement}
      {OpenRecordsElement}
      {ThumbUpElement}
      {SpamElement}
      {DeliveryTipElement}
      {process.env.BUILD_ISEDM && EdmReplyMarkElement}
      {TranslateTipElement}
      {TodoMailTipElement}
      {RequestReadReceiptTipElement}
      {MailHeadrElement}

      {/* 邮件解密窗请保持在末尾 */}
      {UnlockElement}
    </div>
  );
};
export default ContentTips;
