import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Checkbox, Modal, Popover, Select, Tooltip, Divider, Input, Anchor, Radio } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import ExclamationCircleFilled from '@ant-design/icons/ExclamationCircleFilled';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import {
  apiHolder as api,
  apis,
  DataTrackerApi,
  MailConfApi as MailConfApiType,
  AccountApi,
  SystemApi,
  SignDetail,
  MailAliasAccountModel,
  SubAccountServerModel,
  MultAccountsLoginInfo,
  CloseMultAccountLoginInfo,
  EntityContact,
  inWindow,
  DataStoreApi,
} from 'api';
import { navigate } from 'gatsby';
import classnames from 'classnames';
import classnamesBind from 'classnames/bind';
import moment from 'moment';
import throttle from 'lodash/throttle';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { TemplateListModalWaimao } from '@web-setting/Mail/components/CustomTemplate/template_list_modal_waimao';
import { TemplateListModal } from './components/CustomTemplate/template_list_modal';
import { TemplateAddModal } from './components/CustomTemplate/template_add_modal';
import { useActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { getSignListAsync, getSignListOtherAsync, getSignTemplatesAsync } from '@web-common/state/reducer/mailConfigReducer';
import { MailConfigActions, MailTemplateActions, MailClassifyActions } from '@web-common/state/reducer';
import { RiskReminderTips } from '@web-mail/components/RiskReminder/risk-reminder-tips';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import LightGuide from '@web-common/components/UI/LightGuide/index';
import TriangleDownIcon from '@web-common/components/UI/Icons/svgs/TriangleDown';
import MailSenderSetting, { SenderSettingType } from '@web-common/components/MailSenderDialog/mailSenderSetting';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import MultAccountsLoginModal from '@web-common/components/UI/MultAccountsLoginModal/index';
import DefaultCCModal from '@web-setting/Mail/components/DefaultCCModal/DefaultCCModal';
import BlackListModal from '@web-setting/Mail/components/BlackListModal/BlackListModal';
import SignEdit from './components/CustomSignForm/sign_edit_modal/index';
import SignListItem from './components/CustomSignForm/sign_list_item/index';
import SignListModal from './components/CustomSignForm/sign_list_modal/index';
import { useNiceModal, createNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import styles from './index.module.scss';
import { ReactComponent as IconWarn } from '@/images/icons/icon-warn.svg';
import MailReplyPrefix from './components/MailReplyPrefix/MailReplyPrefix';
import AutoReplyModal from './components/AutoReplyModal/index';
import MailAutoMarkRead from './components/MailAutoMarkRead/mailAutoMarkRead';
import SeparateLine from './components/SeparateLine/separateLine';
import ReplyForwardClose from './components/ReplyForwardClose/replyForwardClose';
import MailLayout from './components/MailLayout/MailLayout';
import defaultUserIcon from '@/images/icons/customerDetail/default-user.png';
// 邮箱摘要和附件展示设置
import MailDescAndAttachment from './components/MailDescAndAttachment/MailDescAndAttachment';
import MailModeMergeOrAI from './components/MailModeMergeOrAI/MailModeMergeOrAI';
import MailTightness from './components/MailTightness/MailTightness';
import RevocationImg from '@/images/revocation-popover.png';
import IconCard from '@web-common/components/UI/IconCard';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { webMailSettingConfig, ANCHOR_ID_MAP, ANCHOR_LIST } from './components/MailSetting/DefaultMailSettingConfig';
import MailEncoding from './components/MailEncoding/MailEncoding';
import { getIn18Text } from 'api';
import { Thunks } from '@web-common/state/reducer/mailReducer';
const SignEditModal = createNiceModal('signEditOnSetting', SignEdit);
const isWebWmEntry = api.api.getSystemApi().isWebWmEntry();
const storeApi: DataStoreApi = api.api.getDataStoreApi();
// 多账号登陆

const { Link } = Anchor;
const { Option } = Select;
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApiType;
const eventApi = api.api.getEventApi();
const systemApi = api.api.getSystemApi() as SystemApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as unknown as AccountApi;
const realStyle = classnamesBind.bind(styles);
const inElectron = systemApi.isElectron();
const isEnLang = inWindow() && window.systemLang === 'en';

const MailConfig: React.FC<{
  isVisible?: boolean;
}> = ({ isVisible }) => {
  // 第三方账号列表
  const [bindAccounts, setBindAccounts] = useState<SubAccountServerModel[]>([]);
  // 第三方账号选中的账号信息
  const [defaultAccountInfo, setDefaultAccountInfo] = useState<any>({});
  // 当前要操作的账号是主账号还是第三方账号（主要针对签名和模版-进入设置）
  const [operationType, setOperationType] = useState<string>(ANCHOR_ID_MAP.MAIN);
  // 第三方账号选中的账号昵称
  const [nickname, setNickname] = useState<string>('');
  // 第三方账号选中的别名
  const [aliasName, setAliasname] = useState<string>('');
  // 滚动的容器
  const anchorRef = useRef(null);
  // 右侧锚点的一级目录
  const commonRef = useRef(null);
  const mainRef = useRef(null);
  const otherRef = useRef(null);
  const refObj = {
    [ANCHOR_ID_MAP.COMMON]: commonRef,
    [ANCHOR_ID_MAP.MAIN]: mainRef,
    [ANCHOR_ID_MAP.OTHER]: otherRef,
  };
  // 从路由获取邮箱设置默认的tab，跳转至此（用于第三方账号失效后弹窗跳转到设置页面重新验证）
  const mailConfigTab = inWindow() ? history?.state?.mailConfigTab : '';

  const userInfo = systemApi.getCurrentUser();
  const avatarParams: EntityContact = useMemo(() => {
    return userInfo?.contact?.contact || ({} as EntityContact);
  }, [userInfo]);

  useEffect(() => {
    if (mailConfigTab === ANCHOR_ID_MAP.OTHER) {
      setTimeout(() => otherRef.current?.click(), 0);
    }
  }, [mailConfigTab]);

  const { doChangeContent, doSetCurrentMail, doSetNickname, doSetDisplayMail } = useActions(MailConfigActions);
  const { changeShowTemplateList } = useActions(MailTemplateActions);
  const { changeShowClassifyModal, setModalType, setIsClassifyList } = useActions(MailClassifyActions);
  const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
  // 主账号默认签名
  const [defaultSign, setDefaultSign] = useState<SignDetail[]>([]);
  // 第三方账号默认签名
  const [defaultSignOther, setDefaultSignOther] = useState<SignDetail[]>([]);
  const [defaultSenderId, setDefaultSenderId] = useState<string>('');
  const [defaultSenderName, setDefaultSenderName] = useState<string>('');
  const { signList, signListOther, currentMail } = useAppSelector(state => state.mailConfigReducer);
  const autoReplyDetail = useAppSelector(state => state.autoReplyReducer.autoReplyDetail);
  const mailAccountAliasMap = useAppSelector(state => state.mailReducer.mailAccountAliasMap);

  const signListModalState = useNiceModal('signList');
  const signEditModalState = useNiceModal('signEditOnSetting');

  // 当前版本信息
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();
  const [mailAliasAccount, setMailAliasAccount] = useState<MailAliasAccountModel[]>([]);
  const [mailAutoAddContact, setMailAutoAddContact] = useState<boolean>(true);
  const [enableRiskReminder, setEnableRiskReminder] = useState<boolean>(true);
  const [showRiskReminder, setShowRiskReminder] = useState<boolean>(false);
  const [autoReplyModalVisible, setAutoReplyModalVisible] = useState<boolean>(false);
  const [forwarddes, setForwarddes] = useState<string>(''); // 自动转发邮箱地址
  const [showSenderSettingDialog, setShowSenderSettingDialog] = useState<boolean>(false);
  const [multAccountsLoginVisible, setMultAccountsLoginVisible] = useState<boolean>(false);
  const [multAccountsLoginInfo, setMultAccountsLoginInfo] = useState<MultAccountsLoginInfo>({ type: 'bind', way: 'mailSetting' });
  // 第三方账号有效数量
  const [validAccountNumber, setValidAccountNumber] = useState<number>(0);
  // 发信后撤销
  const [revocationCheckbox, setRevocationCheckbox] = useState(false);
  // 企业外邮件阅读状态追踪
  const [stateTrackCheckbox, setStateTrackCheckbox] = useState(false);
  const [revocationLimit, setRevocationLimit] = useState(15);
  // 是否是公共账号
  const [isSharedAccount, setIsSharedAccount] = useState<boolean>(false);
  // 是否展示默认抄送密送设置弹窗
  const [showDefaultCcBccModal, setShowDefaultCCModal] = useState<boolean>(false);
  // 是否已经设置过了默认抄送密送
  const [hasSetDefaultCcBcc, setHasSetDefaultCcBcc] = useState<boolean>(false);
  // 是否已经设置过了黑白名单
  const [hasSetDefaultBlacklist, setHasSetDefaultBlacklist] = useState<boolean>(false);
  // 是否展示黑白名单弹窗
  const [showBlacklistModal, setShowBlacklistModal] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  const mainAccount = useMemo(() => systemApi.getCurrentUser()?.id || '', []);
  // 展示状态跟踪
  const stateTrackAble = useMemo(() => {
    return productVersionId === 'sirius';
  }, [productVersionId]);
  const handleNicknameDialogVisible = useCallback((val: boolean) => {
    setShowSenderSettingDialog(val);
  }, []);
  // 因为签名列表外漏默认的签名，所以这里获取签名列表
  const getSignRelated = useCallback(
    (account: string) => {
      if (!account) {
        return;
      }
      doSetCurrentMail(account);
      if (account === mainAccount) {
        dispatch(getSignListAsync({ email: account }));
      } else if (Object.keys(defaultAccountInfo).length > 0 && !defaultAccountInfo.expired) {
        dispatch(getSignListOtherAsync({ email: account }));
      }
      dispatch(getSignTemplatesAsync({ email: account }));
    },
    [defaultAccountInfo]
  );
  // 绑定的第三方账号更新
  useEffect(() => {
    if (bindAccounts.length > 0) {
      // 当前默认账户更新
      const defaultAccountIdx = bindAccounts.findIndex(account => account.accountEmail === defaultAccountInfo?.accountEmail);
      let accountInfo;
      if (defaultAccountIdx >= 0) {
        accountInfo = bindAccounts[defaultAccountIdx];
      } else {
        accountInfo = bindAccounts[0];
      }
      setDefaultAccountInfo(accountInfo);
      getSignRelated(accountInfo.accountEmail || '');
    }
  }, [validAccountNumber, bindAccounts.length]);
  // 个人账号nickname直接取，企业账号另外取
  const getEmailNickName = async () => {
    const { agentNickname, accountName, agentEmail = '', accountEmail } = defaultAccountInfo;
    let nickname = agentNickname || accountName || '';
    // 企业邮箱
    if (defaultAccountInfo?.accountType === 'qyEmail') {
      const res = await accountApi.getQiyeMailSubAccountNickName({ email: accountEmail });
      nickname = res?.data?.nickName || nickname || '';
    }
    // doSetNickname(nickname);
    doSetDisplayMail(agentEmail);
    // 展示用
    setNickname(nickname);
  };
  useEffect(() => {
    setAliasname(mailAccountAliasMap[defaultAccountInfo?.agentEmail] || defaultAccountInfo?.agentEmail);
  }, [defaultAccountInfo?.agentEmail]);
  // 选中的第三方账号更新
  useEffect(() => {
    getEmailNickName();
    // 由于默认签名是直接展示的，所以需要切换就重新获取
    getSignRelated(defaultAccountInfo.accountEmail);
  }, [JSON.stringify(defaultAccountInfo)]);
  // 获取默认签名
  useEffect(() => {
    const _defaultSign = signList.filter(item => item?.signInfoDTO.defaultItem?.control) || [];
    setDefaultSign(_defaultSign);
  }, [signList]);
  useEffect(() => {
    const _defaultSign = signListOther.filter(item => item?.signInfoDTO.defaultItem?.control) || [];
    setDefaultSignOther(_defaultSign);
  }, [signListOther]);
  // 无签名下添加签名
  const handleAddSign = (_nickname: string) => {
    // 关闭当前弹窗
    signListModalState.hide();
    doSetNickname(_nickname);
    signEditModalState.show({ _account: currentMail });
    doChangeContent('');
  };
  // 样例弹窗
  const handleExample = () => {
    Modal.info({
      zIndex: 1040,
      className: 'u-sign-dialog',
      title: getIn18Text('QIANMINGSHILI'),
      width: 680,
      okText: getIn18Text('WOZHIDAOLE'),
      closable: true,
      maskClosable: true,
      content: <div className={styles.configExample} />,
    });
  };
  const onChangeSwitch = (checked: boolean) => {
    setMailAutoAddContact(checked);
    mailConfApi.setMailAutoAddContact(checked);
  };
  useEffect(() => {
    if (isVisible) {
      mailConfApi.getMailAutoAddContact().then(res => setMailAutoAddContact(res?.toString() === '1'));
    }
  }, [isVisible]);
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  useEffect(() => {
    if (isCorpMail) return;
    // 进入页面获取第三方账号列表
    getAllBindAccounts();
    // 获取主账号签名
    getSignRelated(mainAccount);
    // 公共账号不展示第三方邮箱
    accountApi.getIsSharedAccountAsync().then(res => {
      setIsSharedAccount(res);
    });
    mailConfApi.getRiskReminderStatus().then((res: any) => {
      setEnableRiskReminder(res === 0 || res === 2);
    });
    // 是否存在来信分类列表
    mailConfApi.getMailClassifyRule().then(res => {
      if (res.length > 0) {
        // 存在列表
        setIsClassifyList(true);
        setModalType('list');
      } else {
        setModalType('edit');
      }
    });
    getMailAliasAccountList();
    // 是否设置自动转发
    mailConfApi.doGetUserAttr(['forwarddes']).then(rs => {
      setForwarddes(rs.forwarddes);
    });
    // 监听多账号删除
    const subAccountDeletedOb = eventApi.registerSysEventObserver('SubAccountDeleted', {
      name: 'SubAccountDeleted_MailSetting',
      func: () => {
        getAllBindAccounts();
      },
    });
    // 监听多账号过期
    const subAccountExpiredOb = eventApi.registerSysEventObserver('SubAccountLoginExpired', {
      name: 'SubAccountLoginExpired_MailSetting',
      func: () => {
        getAllBindAccounts();
      },
    });
    // 监听多账号新增
    const subAccountAddOb = eventApi.registerSysEventObserver('SubAccountWindowReady', {
      name: 'SubAccountWindowReady_MailSetting',
      func: () => {
        getAllBindAccounts();
      },
    });
    return () => {
      doSetCurrentMail('');
      eventApi.unregisterSysEventObserver('SubAccountDeleted', subAccountDeletedOb);
      eventApi.unregisterSysEventObserver('SubAccountLoginExpired', subAccountExpiredOb);
      eventApi.unregisterSysEventObserver('SubAccountWindowReady', subAccountAddOb);
    };
  }, []);
  const getAllBindAccounts = () => {
    !isCorpMail && getBindAccounts();
  };
  const getMailAliasAccountList = () => {
    mailConfApi.getMailSenderInfo().then(async (rs: MailAliasAccountModel[]) => {
      if (rs && rs.length > 0) {
        setMailAliasAccount(rs);
        const defaultSender = rs.find(item => item?.isDefault);
        if (defaultSender) {
          setDefaultSenderId(defaultSender.id);
          setDefaultSenderName(defaultSender.senderName || '');
        }
      }
    });
  };

  const getBindAccounts = async () => {
    const accounts = await accountApi.getAllSubAccounts();
    setBindAccounts(accounts);
    // 设置有效账号数
    setValidAccountNumber(accounts.reduce((p, c) => p + Number(!c.expired), 0));
  };
  useEffect(() => {
    setShowRiskReminder(
      ['sirius'].includes(productVersionId) // 尊享版读取接口数据
        ? enableRiskReminder
        : false // 其他版本默认不开启，不可设置
    );
  }, [productVersionId, enableRiskReminder]);
  /*
      function handleTmpUrl(url: string | undefined) {
        if (url) {
          const re = /c=([^&]+)/i.exec(url);
          if (re) {
            url = url.replace(/c=([^&]+)/i, 'c=' + encodeURIComponent(re[1]));
          }
          const re2 = /u=([^&]+)/i.exec(url);
          if (re2) {
            url = url.replace(/u=([^&]+)/i, 'u=' + encodeURIComponent(re2[1]));
          }
          return url;
        }
        return undefined;
      }
    */
  // https://mailhz.qiye.163.com/redirect.jsp?c=fbN5vnu4G1ZxBq8*0ZIriFz062odr5-uKpfZ14oRx*oOVfO04kKpNzn17cmTLgW0VFqLZOexmcFPhrAuuGOoq9tayDX4ozyp-u09VDXisuA1o67-M*yyG70XWUhWiBf36Tu76Yb*WqVbHnxL3E3Mse22GHvlJcdSZH6vKlL47Yc%7C%25wm-9-hz&u=shisheng%40qy.163.com&s=1oHJvbUWja3mDEA3uTDu0Siy3X4_ueGtMVrc1IzqouAcv.gXFoSNZLmLu.75FDmbPigRi1l1F.dJaB3Eaykcm7z2TwnxHv1AOgGN4o6L9uSTD.Zoat_uZoYSFJ1nMaVflG.I5VPgR9_QC1g8ARP3g5D9VrtIbJfIcMasO9kbzyS&l=https%3A%2F%2Fmailhz.qiye.163.com%2Fjs6%2Fmain.jsp%3Fsid%3D60OAhCW87Da9D9p8fbDzARcXqRJ1njFC%26hl%3DZH%26module%3Doptions.FolderTagModule&hl=ZH
  const handleToMailSetting = async (
    name: string,
    inLocal: boolean,
    urlType: {
      params?: {
        [k: string]: string;
      };
      url?: string;
    },
    haveJquery?: boolean
  ) => {
    const url = await mailConfApi.getSettingUrlCommon({
      name,
      inLocal,
      urlType,
      isCorpMail,
    });
    if (url && url.length > 0) {
      systemApi.openNewWindow(url, true, undefined, undefined, haveJquery);
    } else {
      Toast.warn({
        content: getIn18Text('WUFADAKAIZHI'),
        duration: 3,
      });
    }
  };
  const handleEnableRiskReminder = async (e: any) => {
    // const conf = getAuthConfig(ProductAuthorityFeature.STRANGER_NOTIFY_SETTING_PAGE_VIEW);
    // if (conf != null && !conf.show) { // 尊享版可以开启
    if (!['sirius'].includes(productVersionId)) {
      e.preventDefault();
      Toast.warn({
        content: getIn18Text('QINGXIANSHENGJIDAO'),
      });
      return;
    }
    const result = await mailConfApi.updateRiskReminderStatus(e.target.checked);
    if (result) {
      setEnableRiskReminder(e.target.checked);
    } else {
      setEnableRiskReminder(true);
      message.warn(getIn18Text('GUANLIYUANYISHE'));
    }
  };
  const handleSenderSettingSubmit = useCallback(
    hasChanged => {
      if (hasChanged) {
        getMailAliasAccountList();
      }
    },
    [getMailAliasAccountList]
  );
  const handleSenderSelectChange = useCallback(val => {
    setDefaultSenderId(val);
    mailConfApi.setDefaultSender(val);
  }, []);

  const revocationPopover = (
    <div className={classnames(styles.revocationPopover)}>
      <div className={classnames(styles.revocationTitle)}>{getIn18Text('FAXINHOUCHEXIAO')}</div>
      <div className={classnames(styles.revocationContent)}>
        <div className={classnames(styles.revocationTitle)}>{getIn18Text('SMSFXHCX')}</div>
        <div className={classnames(styles.revocationDesc)}>{getIn18Text('FXHCXDESC')} </div>
        <div>
          <img src={RevocationImg} />
        </div>
        <div className={classnames(styles.revocationTitle)}>{getIn18Text('CXFSHCHYJQB')}</div>
        <div className={classnames(styles.revocationDesc)}>{getIn18Text('CXFSQB1')}</div>
        <div className={classnames(styles.revocationDesc)}>{getIn18Text('CXFSQB2')}</div>
      </div>
    </div>
  );

  /**
   * 提示窗-写信添加默认抄送人,密送人
   */
  const defaultCCPopover = useMemo(() => {
    return (
      <div className={classnames(styles.revocationPopover)}>
        <div className={classnames(styles.revocationTitle)}>{getIn18Text('SHENMESHIXIEXINMRCSR/MSR')}</div>
        <div className={classnames(styles.revocationContent)}>
          <div className={classnames(styles.revocationDesc)}>{getIn18Text('SHEZHIMORENCHAOSRMSRHMCXXHFHZFDHJSZDCSR/MSRZDTR')}</div>
          <div className={classnames(styles.revocationDesc)}>{getIn18Text('ZHUZAIDUXINYSYKJHFSBHDRMRCSR/MSR')}</div>
        </div>
      </div>
    );
  }, []);

  const handleRevocation = (value: number) => {
    setRevocationLimit(value);
    storeApi.putSync('sendRevokeIn', String(value));
    mailConfApi.setMailConfig();
  };

  const handleRevocationControl = (e: CheckboxChangeEvent) => {
    const checked = e.target?.checked;
    setRevocationCheckbox(checked);
    storeApi.putSync('sendRevoke', checked ? 'ON' : 'OFF');
    mailConfApi.setMailConfig();
  };

  const handleStateTrack = (e: CheckboxChangeEvent) => {
    const checked = e.target?.checked;
    setStateTrackCheckbox(checked);
    storeApi.putSync('stateTrack', checked ? 'ON' : 'OFF');
    mailConfApi.setMailConfig();
  };

  const getSign = (signId: string, isVisible: boolean, _nickName: string) => {
    if (!isVisible) {
      return <></>;
    }
    return (
      <>
        {/* 邮件签名 */}
        <div className={realStyle('configModuleItem')}>
          <div id={signId} className={realStyle('configModuleItemTitle')}>
            {getIn18Text('YOUJIANQIANMING')}
            <Popover
              placement="rightTop"
              content={
                <div className={realStyle('popoverWrapper')}>
                  <div className={realStyle('mailPopoverTitle')}>{getIn18Text('YOUJIANQIANMING')}</div>
                  <div className={realStyle('mailPopoverInfo')}>{getIn18Text('SHEZHIDEQIANMING11')}</div>
                  <div className={realStyle('mailPopoverExample')} />
                </div>
              }
            >
              <span className={realStyle('titleIcon')}>
                <IconWarn style={{ cursor: 'pointer', marginLeft: '5px' }} />
              </span>
            </Popover>
          </div>
          <div className={styles.configContentNote}>
            <span>{getIn18Text('SHEZHIDEQIANMING')}</span>
            {/* <span className={styles.configContentNoteCusor} onClick={handleExample}>查看示例</span> */}
            {(signId === ANCHOR_ID_MAP.MAIN_MAIL_SIGN ? signList : signListOther).length > 0 && (
              <div className={styles.configContentNoteReset} onClick={() => beforeShowList('sign', signId, _nickName)}>
                {getIn18Text('JINRUSHEZHI')}
              </div>
            )}
          </div>
          {/* 无签名 */}
          {(signId === ANCHOR_ID_MAP.MAIN_MAIL_SIGN ? signList : signListOther).length === 0 && (
            <div className={styles.configContentSignEmpty}>
              {getIn18Text('ZANWUQIANMING\uFF0C')}
              <div className={styles.configContentSignEmptyAdd} onClick={() => handleAddSign(_nickName)}>
                {getIn18Text('QUXINJIANQIANMING')}
              </div>
            </div>
          )}
        </div>
        {/* 只展示默认签名 */}
        <div style={{ width: '632px' }}>
          {(signId === ANCHOR_ID_MAP.MAIN_MAIL_SIGN ? defaultSign : defaultSignOther).map(_ => (
            <div key={_.signId} style={{ marginBottom: '10px' }}>
              <SignListItem signEditId="signEditOnSetting" isSingle signDetail={_} />
            </div>
          ))}
        </div>
      </>
    );
  };

  const getTemplate = (templateId: string, isVisible?: boolean) => {
    if (!isVisible) {
      return <></>;
    }
    return (
      <>
        {/* 邮件模板 */}
        <div className={realStyle('configModuleItem')}>
          <div id={templateId} className={realStyle('configModuleItemTitle')}>
            {getIn18Text('YOUJIANMOBAN')}
          </div>
          <div className={styles.configContentNote}>
            <span>{getIn18Text('XUANZE\u3001ZIDING')}</span>
            <div className={styles.configContentNoteReset} onClick={() => beforeShowList('template', templateId)}>
              {getIn18Text('JINRUSHEZHI')}
            </div>
          </div>
        </div>
      </>
    );
  };

  // 绑定更多邮箱账号
  const bindMoreAccount = () => {
    if (bindAccounts.length >= 4) {
      SiriusMessage.error({ content: '最多支持绑定四个其它邮箱' });
      return;
    }
    setMultAccountsLoginVisible(true);
    setMultAccountsLoginInfo({ type: 'bind', way: 'mailSetting' });
  };

  const closeMultAccountsModal = (info: CloseMultAccountLoginInfo) => {
    console.log('bind=success', info.refresh, info.email);
    setMultAccountsLoginVisible(false);
  };
  // 保存昵称
  const updateAccountNickname = async (email: string) => {
    const item = bindAccounts.find(item => item?.agentEmail === email);
    let res = null;
    if (item?.accountType === 'qyEmail') {
      res = await accountApi.setQiyeMailSubAccoutNickName({
        email,
        nickName: nickname,
      });
    } else {
      const lastestAccountInfo = {
        ...item,
        agentNickname: nickname,
      };
      res = await accountApi.editSubAccount(lastestAccountInfo);
      setDefaultAccountInfo(lastestAccountInfo);
      setBindAccounts(_accounts => {
        const list = [..._accounts];
        return list.map((item: SubAccountServerModel) => {
          if (item.accountEmail === lastestAccountInfo.accountEmail) {
            item.agentNickname = nickname;
          }
          return item;
        });
      });
    }
    // 失败弹出错误信息
    if (!res.success) {
      SiriusMessage.error({ content: res.errMsg || '昵称保存失败' });
    }
  };

  // 保存邮件别名
  const updateAccountAliasName = async (email: string) => {
    dispatch(Thunks.updateUserFolderAlias({ account: email, name: aliasName }));
  };

  // 更新选中账号信息
  const updateDefaultAccountInfo = (email: string) => {
    const item = bindAccounts.find(item => item?.agentEmail === email);
    item && setDefaultAccountInfo(item);
  };

  // 移除账号
  const removeAccount = (e: Event, email: string) => {
    e.preventDefault();
    Modal.confirm({
      title: `是否确认移除邮箱“${email}”？`,
      okText: getIn18Text('SHANCHU'),
      cancelText: getIn18Text('QUXIAO'),
      width: '448px',
      centered: true,
      onOk: async () => {
        const item = bindAccounts.find(item => item?.agentEmail === email);
        let res = null;
        if (item && item?.accountEmail && item?.agentEmail) {
          res = await accountApi.deleteBindAccount({
            email: item?.accountEmail,
            agentEmail: item?.agentEmail,
            accountType: item?.accountType,
          });
        }
        if (res?.success) {
          SiriusMessage.success({ content: '移除成功' });
          // 重新获取绑定账号
          getAllBindAccounts();
        } else {
          SiriusMessage.error({ content: res.errMsg || '移除失败' });
        }
      },
      onCancel(close) {
        close();
      },
    });
  };

  // 邮件签名/模版进入设置之前，判断是否失效
  const beforeShowList = (showType: string, typeId: string, _nickname?: string) => {
    if ([ANCHOR_ID_MAP.OTHER_MAIL_TEMPLATE, ANCHOR_ID_MAP.OTHER_MAIL_SIGN].includes(typeId) && defaultAccountInfo?.expired) {
      SiriusMessage.error('邮箱账号已失效，请重新验证后启用');
      return;
    }
    const type = typeId.split('_')[0];
    // 进入设置之前更新当前操作类型，用于确定弹窗内操作主账号还是第三方账号的数据
    setOperationType(type);
    if (showType === 'sign') {
      if (type === ANCHOR_ID_MAP.MAIN) {
        getSignRelated(mainAccount);
        doSetDisplayMail('');
      } else if (type === ANCHOR_ID_MAP.OTHER) {
        getSignRelated(defaultAccountInfo?.accountEmail);
        doSetDisplayMail(defaultAccountInfo?.agentEmail);
      }
      doSetNickname(_nickname || '');
      signListModalState.show();
    } else if (showType === 'template') {
      changeShowTemplateList({ isShow: true });
    }
  };

  // 账号失效后重新验证密码
  const reValidatePassword = () => {
    setMultAccountsLoginVisible(true);
    setMultAccountsLoginInfo({
      type: 'rebind',
      way: 'mailSetting',
      accountType: defaultAccountInfo?.accountType === 'qyEmail' ? 'NeteaseQiYeMail' : defaultAccountInfo.emailType || 'Others',
      agentEmail: defaultAccountInfo?.agentEmail,
      agentNickname: nickname,
    });
  };

  // 锚点点击取消默认事件
  const handleAnchorClick = e => {
    e.preventDefault();
  };

  // 左侧滚动到某一锚点，右侧如果遮挡要滚动到相应位置
  const handleAnchorScroll = throttle(link => {
    if (link.indexOf(ANCHOR_ID_MAP.COMMON) === 1) {
      refObj[ANCHOR_ID_MAP.COMMON]?.current?.scrollIntoView();
    } else if (link.indexOf(ANCHOR_ID_MAP.MAIN) === 1) {
      refObj[ANCHOR_ID_MAP.MAIN]?.current?.scrollIntoView();
    } else if (link.indexOf(ANCHOR_ID_MAP.OTHER) === 1) {
      refObj[ANCHOR_ID_MAP.OTHER]?.current?.scrollIntoView();
    }
  }, 500);

  useEffect(() => {
    const sendRevokeIn = Number(storeApi.getSync('sendRevokeIn').data) || 15;
    const sendRevoke = storeApi.getSync('sendRevoke').data;
    setRevocationLimit(+sendRevokeIn);
    setRevocationCheckbox(sendRevoke === 'ON');
  }, []);

  // 状态初始化
  useEffect(() => {
    // 尊享版默认开启
    if (productVersionId === 'sirius') {
      const stateTrack = storeApi.getSync('stateTrack').data;
      setStateTrackCheckbox(stateTrack !== 'OFF');
    }
  }, [productVersionId]);

  return (
    <>
      <div className={classnames('ant-allow-dark', { [styles.webWmEntry]: isWebWmEntry })}>
        <div className={classnames(styles.settingMenu, { [styles.settingMenuWeb]: !systemApi.isElectron() })} hidden={!isVisible}>
          <div className={styles.configTitle}>
            <div className={styles.configTitleName}>{getIn18Text('YOUXIANGSHEZHI')}</div>
            {!isWebWmEntry && (
              <div
                className={`dark-invert ${styles.configTitleIcon}`}
                onClick={() => {
                  navigate(-2);
                }}
              />
            )}
          </div>
          <div className={styles.configContent}>
            <div ref={anchorRef} className={styles.configContentWrap}>
              <div style={{ minWidth: '632px' }}>
                {/* 通用 */}
                <div id={ANCHOR_ID_MAP.COMMON} className={realStyle('configModuleTitle')}>
                  {getIn18Text('TONGYONG')}
                </div>
                {/* 展示模式 */}
                <div className={realStyle('configModuleItem')}>
                  <div id={ANCHOR_ID_MAP.COMMON_DISPLAY_MODE} className={realStyle('configModuleItemTitle')}>
                    {getIn18Text('ZHANSHIMOSHI')}
                  </div>
                  <MailModeMergeOrAI isVisible={isVisible} />
                  {/* 邮件视图   */}
                  <div id={ANCHOR_ID_MAP.COMMON_MAIL_VIEW} className={realStyle('configModuleItemTitle')}>
                    <LightGuide guideId="mailViewTip" title={getIn18Text('XINZENGSHITUSHE')} width={318} enable={isVisible}>
                      {getIn18Text('YOUJIANSHITU')}
                    </LightGuide>
                  </div>
                  <MailLayout />
                  {/* 列表密度 */}
                  <div id={ANCHOR_ID_MAP.COMMON_LIST_DENSITY} className={realStyle('configModuleItemTitle')}>
                    {getIn18Text('mailTightness')}
                  </div>
                  <MailTightness />
                  <div id={ANCHOR_ID_MAP.COMMON_MAIL_DISPLAY} className={realStyle('configModuleItemTitle')} style={{ marginTop: '16px' }}>
                    <LightGuide guideId="mailListTip" title={getIn18Text('ANXUZHANSHIYOU')} enable={isVisible}>
                      {getIn18Text('YOUJIANLIEBIAOZHAN')}
                    </LightGuide>
                  </div>
                  <MailDescAndAttachment />
                </div>
                {/* 安全提醒模块 */}
                {isCorpMail ? null : (
                  <div className={realStyle('configModuleItem')}>
                    <div id={ANCHOR_ID_MAP.COMMON_SAFE_REMIND} className={realStyle('configModuleItemTitle')}>
                      {getIn18Text('MOSHENGRENLAIXIN11')}
                      <Popover overlayClassName={styles.configContentTips} title="" placement="rightBottom" content={<RiskReminderTips />}>
                        <IconWarn style={{ cursor: 'pointer', marginLeft: '5px' }} />
                      </Popover>
                    </div>

                    <div className={styles.configContentCheckbox}>
                      <Checkbox checked={showRiskReminder} onChange={handleEnableRiskReminder} defaultChecked={showRiskReminder}>
                        <span className={classnames(styles.checkboxLabel)}>{getIn18Text('KAIQI')}</span>
                      </Checkbox>
                    </div>
                  </div>
                )}
                {/* 自动添加联系人 */}
                <div className={realStyle('configModuleItem')}>
                  <div id={ANCHOR_ID_MAP.COMMON_AUTOMATIC_ADD} className={realStyle('configModuleItemTitle')}>
                    {getIn18Text('FAXINHOUZIDONG')}
                  </div>
                  <div className={styles.configContentCheckbox}>
                    <Checkbox
                      checked={mailAutoAddContact}
                      defaultChecked
                      onChange={evt => {
                        onChangeSwitch(evt.target.checked);
                      }}
                    >
                      <span className={classnames(styles.checkboxLabel)}>{getIn18Text('KAIQI')}</span>
                    </Checkbox>
                  </div>
                </div>

                {/* 阅读邮件后是否标为已读 */}
                <MailAutoMarkRead />
                {/* 回复/转发主题前缀 */}
                <div className={realStyle('configModuleItem')}>
                  <div id={ANCHOR_ID_MAP.COMMON_SUBJECT_PREFIX} className={realStyle('configModuleItemTitle')}>
                    {getIn18Text('HUIFU/ZHUANFA')}
                  </div>
                  <div
                    className={styles.configContentPrefixRadio}
                    onClick={() => {
                      // trackApi?.track('pcMineCenter_click_setMailClassify_mailSettingPage');
                      // trackApi?.track('pcMail_view_mailClassificationNewPage', { type: 'setting' });
                      // changeShowClassifyModal(true);
                      // handleToMailSetting('options.MailFilterModule');
                    }}
                  >
                    <MailReplyPrefix />
                  </div>
                </div>
                {/* 回复 转发邮件时引文是否带分割线 */}
                <SeparateLine />
                {/* 回复/转发邮件时是否关闭原读信页 */}
                <ReplyForwardClose />
                <div id={ANCHOR_ID_MAP.MAIN} className={realStyle('configModuleTitle')}>
                  {getIn18Text('ZHUYOUXIANG')}
                </div>
                {/* 发件人管理 */}
                <div className={realStyle('configModuleItem')}>
                  <div className={realStyle('configContentSender')}>
                    <div className={realStyle('configContentSenderInfo')}>
                      <AvatarTag
                        size={40}
                        hasHover={false}
                        user={{
                          name: avatarParams.contactName,
                          avatar: avatarParams.avatar || avatarParams.contactName || defaultUserIcon,
                          email: avatarParams.displayEmail,
                        }}
                      />
                      <div className={realStyle('configContentSenderMsg')}>
                        <p className={realStyle('configContentSenderName')}>{defaultSenderName}</p>
                        <p className={realStyle('configContentSenderId')}>{defaultSenderId}</p>
                      </div>
                    </div>
                    <Divider className={realStyle('configContentSenderDivider')} />
                    <div className={styles.configContentNote}>
                      <span>{getIn18Text('MORENFAJIANREN')}</span>
                      <Select
                        value={defaultSenderId}
                        dropdownClassName={styles.selectDropdown}
                        suffixIcon={<TriangleDownIcon />}
                        className={styles.mailSenderSelect}
                        onChange={handleSenderSelectChange}
                      >
                        {mailAliasAccount.map(item => (
                          <Option default={item?.isDefault} value={item?.id}>
                            {item?.id}
                          </Option>
                        ))}
                      </Select>
                      <div
                        className={styles.configContentNoteReset}
                        onClick={() => {
                          setShowSenderSettingDialog(true);
                        }}
                      >
                        {getIn18Text('XIUGAIFAJIANREN')}
                      </div>
                    </div>
                  </div>
                </div>
                {/* 来信分类 */}
                <div className={realStyle('configModuleItem')}>
                  <div id={ANCHOR_ID_MAP.MAIN_MAIL_CLASSIFY} className={realStyle('configModuleItemTitle')}>
                    {getIn18Text('LAIXINFENLEI')}
                  </div>
                  {userInfo?.prop?.authAccountType != '0' ? (
                    <div className={styles.configContentNote}>
                      <span>{getIn18Text('SANFANGYOUXIQQWYYXDWYDJXSZ。')}</span>
                    </div>
                  ) : (
                    <div className={styles.configContentNote}>
                      <span>{getIn18Text('KELINGHUOSHEZHI')}</span>
                      <div
                        className={styles.configContentNoteReset}
                        onClick={() => {
                          trackApi?.track('pcMineCenter_click_setMailClassify_mailSettingPage');
                          trackApi?.track('pcMail_view_mailClassificationNewPage', { type: 'setting' });
                          changeShowClassifyModal(true);
                          // handleToMailSetting('options.MailFilterModule');
                        }}
                      >
                        {getIn18Text('JINRUSHEZHI')}
                      </div>
                    </div>
                  )}
                </div>
                {/* 邮件签名 */}
                {getSign(ANCHOR_ID_MAP.MAIN_MAIL_SIGN, !!isVisible, defaultSenderName || '')}
                {/* 写信默认抄送人/密送人 */}
                <div className={realStyle('configModuleItem')}>
                  <div id={ANCHOR_ID_MAP.MAIN_MAIL_DEFAULT_CC} className={realStyle('configModuleItemTitle')}>
                    {getIn18Text('XIEXINMORENCHAOSR/MSR')}
                    <Popover content={defaultCCPopover} placement="rightTop">
                      <IconWarn style={{ cursor: 'pointer', marginLeft: '4px' }} />
                    </Popover>
                  </div>
                  <div className={styles.configContentNote}>
                    <span>{hasSetDefaultCcBcc ? getIn18Text('YISHEZHI') : getIn18Text('WEISHEZHI')}</span>
                    <div
                      className={styles.configContentNoteReset}
                      onClick={() => {
                        // 弹出设置弹窗
                        setShowDefaultCCModal(true);
                      }}
                    >
                      {getIn18Text('JINRUSHEZHI')}
                    </div>
                  </div>
                </div>
                {/* 撤销设置 */}
                <div className={realStyle('configModuleItem')}>
                  <div id={ANCHOR_ID_MAP.MAIN_MAIL_REVOCATION} className={realStyle('configModuleItemTitle')}>
                    {getIn18Text('FAXINHOUCHEXIAO')}
                    <Popover content={revocationPopover} placement="rightTop">
                      <IconWarn style={{ cursor: 'pointer', marginLeft: '4px' }} />
                    </Popover>
                  </div>
                  <div className={styles.revocationControl}>
                    {/* <input type="checkbox" className={styles.revocationCheckbox} checked={revocationCheckbox} onChange={handleRevocationControl} />
                {getIn18Text('ZAICISHIJIANNEICHEXIAOFASONG')} */}
                    <Checkbox className={styles.revocationCheckbox} checked={revocationCheckbox} onChange={handleRevocationControl}>
                      <span className={classnames(styles.checkboxLabel)}>{getIn18Text('ZAICISHIJIANNEICHEXIAOFASONG')}</span>
                    </Checkbox>
                  </div>
                  <div className={styles.configContentNote} hidden={!revocationCheckbox}>
                    <Select
                      value={revocationLimit}
                      style={{ width: 260 }}
                      onChange={handleRevocation}
                      dropdownRender={node => <div className={styles.revocationSelect}>{node}</div>}
                      suffixIcon={<IconCard type="downTriangle" />}
                      options={[
                        { value: 5, label: '5秒' },
                        { value: 10, label: '10秒' },
                        { value: 15, label: '15秒' },
                        { value: 30, label: '30秒' },
                        { value: 60, label: '60秒' },
                      ]}
                    />
                  </div>
                </div>
                {/* 企业外邮件阅读状态追踪 */}
                <div className={realStyle('configModuleItem')}>
                  <div id={ANCHOR_ID_MAP.MAIN_MAIL_STATE_TRACK} className={realStyle('configModuleItemTitle')}>
                    {getIn18Text('YOUJIANZHUANGTAIZUIZONG')}
                    <Tooltip overlayStyle={{ maxWidth: '350px' }} placement="right" title={getIn18Text('KAIQIHOUKEZUIZONG')}>
                      <IconWarn style={{ cursor: 'pointer', marginLeft: '4px' }} />
                    </Tooltip>
                  </div>
                  <div className={styles.stateTrack}>
                    {/* <input type="checkbox" className={styles.stateTrackCheckbox} checked={stateTrackCheckbox} onChange={handleStateTrack} />
                {getIn18Text('KAIQI')} */}
                    <Checkbox className={styles.stateTrackCheckbox} checked={stateTrackCheckbox} onChange={handleStateTrack} disabled={!stateTrackAble}>
                      <span className={classnames(styles.checkboxLabel)}>{getIn18Text('KAIQI')}</span>
                    </Checkbox>
                  </div>
                </div>
                {/* 邮件模版 */}
                {getTemplate(ANCHOR_ID_MAP.MAIN_MAIL_TEMPLATE, isVisible)}
                {/* 自动回复 */}
                <div className={realStyle('configModuleItem')}>
                  <div id={ANCHOR_ID_MAP.MAIN_AUTO_REPLY} className={realStyle('configModuleItemTitle')} style={{ marginBottom: '8px' }}>
                    {getIn18Text('ZIDONGHUIFU')}
                    <Tooltip overlayStyle={{ maxWidth: '350px' }} placement="right" title={getIn18Text('SHOUDAOLAIXINSHI')}>
                      <span className={realStyle('titleIcon')}>
                        <IconWarn style={{ cursor: 'pointer', marginLeft: '4px' }} />
                      </span>
                    </Tooltip>
                  </div>
                  <div className={styles.configContentNote} style={{ marginBottom: '8px' }}>
                    <span>{Object.keys(autoReplyDetail).length > 0 && !autoReplyDetail.disabled ? getIn18Text('YIKAIQI') : getIn18Text('YIGUANBI')}</span>
                    <div
                      className={styles.configContentNoteReset}
                      onClick={() => {
                        setAutoReplyModalVisible(true);
                      }}
                    >
                      {getIn18Text('JINRUSHEZHI')}
                    </div>
                  </div>
                  {Object.keys(autoReplyDetail).length > 0 && !autoReplyDetail.disabled ? (
                    <div>
                      {getIn18Text('KAISHISHIJIAN\uFF1A')}
                      {autoReplyDetail?.moments?.startTime ? moment(autoReplyDetail?.moments?.startTime).format('YYYY-MM-DD HH:mm') : null}
                      <span style={{ marginLeft: '12px' }}>
                        {getIn18Text('JIESHUSHIJIAN:')}
                        {autoReplyDetail?.moments?.endTime ? moment(autoReplyDetail?.moments?.endTime).format('YYYY-MM-DD HH:mm') : getIn18Text('WEISHEZHIJIESHU')}
                      </span>
                    </div>
                  ) : null}
                </div>
                {/* 自动转发 */}
                {isCorpMail ? null : (
                  <div className={realStyle('configModuleItem')}>
                    <div id={ANCHOR_ID_MAP.MAIN_AUTO_FORWARD} className={realStyle('configModuleItemTitle')} style={{ marginBottom: '8px' }}>
                      {getIn18Text('ZIDONGZHUANFA')}
                    </div>
                    <div className={styles.configContentNote} style={{ marginBottom: '8px' }}>
                      <span>{forwarddes ? getIn18Text('YISHEZHILAIXIN') + forwarddes : getIn18Text('WEIKAIQI')}</span>
                      <div
                        className={styles.configContentNoteReset}
                        onClick={() => {
                          handleToMailSetting('', true, webMailSettingConfig.forwarding, true);
                        }}
                      >
                        {getIn18Text('JINRUSHEZHI')}
                      </div>
                    </div>
                  </div>
                )}
                {/* 邮件编码 */}
                <div className={realStyle('configModuleItem')}>
                  <div id={ANCHOR_ID_MAP.MAIL_ENCODING} className={realStyle('configModuleItemTitle')}>
                    {getIn18Text('YOUJIANBIANMA')}
                    <Tooltip title={getIn18Text('XUANZELESHIDANGDBM，YJCNZCXS。ZCQKXXTHZDXZHSDBM，RGCXLM，QCSUNICODE(UTF-8)BM')} placement="rightTop">
                      <IconWarn style={{ cursor: 'pointer', marginLeft: '4px' }} />
                    </Tooltip>
                  </div>
                  <MailEncoding />
                </div>
                {/* 反垃圾*/}
                <div className={realStyle('configModuleItem')}>
                  <div id={ANCHOR_ID_MAP.MAIN_FANLANJI} className={realStyle('configModuleItemTitle')}>
                    {getIn18Text('FANLAJI')}
                  </div>
                  <div className={styles.configContentNote}>
                    <div
                      className={styles.configContentNoteReset}
                      onClick={() => {
                        trackApi?.track('pcMineCenter_click_setBlackAndWhiteList_mailSettingPage');
                        handleToMailSetting('options.AntiSpamModule', false, {});
                      }}
                    >
                      {getIn18Text('JINRUSHEZHI')}
                    </div>
                  </div>
                </div>
                {/* 黑白名单 */}
                <div className={realStyle('configModuleItem')}>
                  <div id={ANCHOR_ID_MAP.MAIN_BLACKLIST} className={realStyle('configModuleItemTitle')}>
                    {getIn18Text('HEIBAIMINGDAN')}
                    {/* <Popover content={defaultCCPopover} placement="rightTop">
                    <IconWarn style={{ cursor: 'pointer', marginLeft: '4px' }} />
                  </Popover> */}
                  </div>
                  <div className={styles.configContentNote}>
                    <span>{hasSetDefaultBlacklist ? getIn18Text('YISHEZHI') : getIn18Text('WEISHEZHI')}</span>
                    <div
                      className={styles.configContentNoteReset}
                      onClick={() => {
                        // 弹出设置弹窗
                        setShowBlacklistModal(true);
                        trackApi?.track('pcMineCenter_click_setBlackAndWhiteList_mailSettingPage');
                      }}
                    >
                      {getIn18Text('JINRUSHEZHI')}
                    </div>
                  </div>
                </div>
                {/* 邮件恢复 */}
                {isCorpMail ? null : (
                  <div className={realStyle('configModuleItem')}>
                    <div id={ANCHOR_ID_MAP.MAIN_MAIL_RECOVER} className={realStyle('configModuleItemTitle')}>
                      {getIn18Text('YOUJIANHUIFU')}
                      <Tooltip overlayStyle={{ maxWidth: '350px' }} placement="right" title={getIn18Text('HUIFUYISHANCHU')}>
                        <span className={realStyle('titleIcon')}>
                          <IconWarn style={{ cursor: 'pointer', marginLeft: '4px' }} />
                        </span>
                      </Tooltip>
                    </div>
                    <div className={styles.configContentNote}>
                      <div
                        className={styles.configContentNoteReset}
                        onClick={() => {
                          handleToMailSetting('options.LinkModule', true, webMailSettingConfig.recover, true);
                        }}
                      >
                        {getIn18Text('JINRUSHEZHI')}
                      </div>
                    </div>
                  </div>
                )}
                {/* 自助查询 */}
                {isCorpMail || isEnLang ? null : (
                  <div className={realStyle('configModuleItem')}>
                    <div id={ANCHOR_ID_MAP.MAIN_SELF_QUERY} className={realStyle('configModuleItemTitle')} style={{ marginBottom: '8px' }}>
                      {getIn18Text('ZIZHUCHAXUN')}
                    </div>
                    <div className={styles.configContentNote} style={{ marginBottom: '8px' }}>
                      <span>{getIn18Text('ZIZHUCHAXUNZHANG')}</span>
                      <div
                        className={styles.configContentNoteReset}
                        onClick={() => {
                          handleToMailSetting('', true, webMailSettingConfig.inquire);
                        }}
                      >
                        {getIn18Text('JINRUCHAXUN')}
                      </div>
                    </div>
                  </div>
                )}
                {!isCorpMail && !isSharedAccount && (
                  <>
                    <div id={ANCHOR_ID_MAP.OTHER} className={realStyle('configModuleTitle')}>
                      {getIn18Text('QITAYOUXIANG')}
                    </div>
                    <div className={realStyle('configModuleItem')}>
                      <div id={ANCHOR_ID_MAP.OTHER_MAIL_CHECK} className={realStyle('configModuleItemTitle')}>
                        {getIn18Text('XUANZEYOUXIANG')}
                      </div>
                      {bindAccounts.length === 0 ? (
                        <div className={styles.configContentNote}>
                          <div className={styles.configContentNoteReset} onClick={() => bindMoreAccount()}>
                            {getIn18Text('BANGDINGYOUXIANGZHANG')}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.configContentRadio}>
                          <Radio.Group onChange={e => updateDefaultAccountInfo(e.target.value)} value={defaultAccountInfo?.agentEmail}>
                            {bindAccounts.map((item, index) => {
                              const { length } = bindAccounts;
                              return (
                                <Radio
                                  className={classnames(
                                    styles.configContentRadioItem,
                                    item?.expired ? styles.configContentRadioExpired : {},
                                    length % 2 === 1 && index === length - 1 ? styles.configContentRadioBorder : {}
                                  )}
                                  value={item?.agentEmail}
                                >
                                  <span className={styles.configContentRadioItemEmail}>{item?.agentEmail}</span>
                                  <span className={styles.configContentRadioItemRemove} onClick={e => removeAccount(e, item?.agentEmail)}>
                                    {getIn18Text('YICHU')}
                                  </span>
                                </Radio>
                              );
                            })}
                            <Radio value="" className={styles.configContentRadioSpecial}>
                              <div
                                className={classnames(styles.configContentRadioBind, bindAccounts.length >= 4 ? styles.configContentRadioBindDisable : {})}
                                onClick={() => bindMoreAccount()}
                              >
                                <PlusOutlined className={styles.configContentRadioIcon} />
                                {getIn18Text('BANGDINGGENGDUOYOU')}
                              </div>
                            </Radio>
                          </Radio.Group>
                        </div>
                      )}
                    </div>
                    {bindAccounts.length > 0 && (
                      <>
                        <div className={realStyle('configModuleItem')}>
                          <div id={ANCHOR_ID_MAP.OTHER_MAIL_ALIASNAME} className={realStyle('configModuleItemTitle')}>
                            {getIn18Text('YOUXIANGMINGCHENG')}
                          </div>
                          <Input
                            className={realStyle('configModuleItemInput')}
                            value={aliasName}
                            maxLength={30}
                            onChange={e => setAliasname(e.target.value.trim())}
                            onBlur={() => updateAccountAliasName(defaultAccountInfo?.agentEmail)}
                          />
                        </div>
                        <div className={realStyle('configModuleItem')}>
                          <div id={ANCHOR_ID_MAP.OTHER_MAIL_NICKNAME} className={realStyle('configModuleItemTitle')}>
                            {getIn18Text('FAXINNICHENG')}
                          </div>
                          <Input
                            disabled={defaultAccountInfo?.expired}
                            className={realStyle('configModuleItemInput')}
                            value={nickname}
                            maxLength={12}
                            onChange={e => setNickname(e.target.value)}
                            onBlur={() => updateAccountNickname(defaultAccountInfo?.agentEmail)}
                          />
                        </div>
                        <div className={realStyle('configModuleItem')}>
                          <div id={ANCHOR_ID_MAP.OTHER_MAIL_PROTOCOL} className={realStyle('configModuleItemTitle')}>
                            {getIn18Text('YOUXIANGXIEYI')}
                          </div>
                          <div className={styles.configContentNote}>
                            <span>{defaultAccountInfo?.accountType === 'qyEmail' ? '专有协议' : defaultAccountInfo?.receiveProtocol === 1 ? 'POP3' : 'IMAP'}</span>
                            {defaultAccountInfo?.expired && (
                              <>
                                <div className={styles.configContentNoteReset} onClick={() => reValidatePassword()}>
                                  {getIn18Text('CHONGXINYANZHENGMI')}
                                </div>
                                <span className={styles.configContentNoteWarn}>
                                  <ExclamationCircleFilled className={styles.configContentNoteWarnIcon} />
                                  邮箱账号已失效，请重新验证后启用
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {/* 邮件签名 */}
                        {getSign(ANCHOR_ID_MAP.OTHER_MAIL_SIGN, !!isVisible, nickname)}
                        {/* 邮件模版 */}
                        {getTemplate(ANCHOR_ID_MAP.OTHER_MAIL_TEMPLATE, isVisible)}
                      </>
                    )}
                  </>
                )}
                {/* 设置默认抄送人密送人弹窗 */}
                <DefaultCCModal
                  visible={showDefaultCcBccModal}
                  onDataChange={({ cc, bcc }) => {
                    setHasSetDefaultCcBcc(!!((cc && cc.length) || (bcc && bcc.length)));
                  }}
                  onModelClose={() => setShowDefaultCCModal(false)}
                />
                {/* 设置黑白名单弹窗 */}
                <BlackListModal
                  visible={showBlacklistModal}
                  onDataChange={({ blackList, whiteList }) => {
                    setHasSetDefaultBlacklist(!!((blackList && blackList.length) || (whiteList && whiteList.length)));
                  }}
                  onModelClose={() => setShowBlacklistModal(false)}
                />
                {/* 签名列表 */}
                <SignListModal signEditId="signEditOnSetting" mainAccount={operationType === ANCHOR_ID_MAP.MAIN} />
                {/* 新建签名 modal */}
                <SignEditModal signEditId="signEditOnSetting" mainAccount={operationType === ANCHOR_ID_MAP.MAIN} />
                {/* 修改发件人昵称 */}
                <MailSenderSetting
                  isShow={showSenderSettingDialog}
                  handleSubmit={handleSenderSettingSubmit}
                  type={SenderSettingType.NICKNAME_SETTING}
                  setVisible={handleNicknameDialogVisible}
                />
                {/* 邮件模版列表 */}
                {process.env.BUILD_ISEDM ? (
                  <TemplateListModalWaimao />
                ) : (
                  <TemplateListModal operateMail={operationType === ANCHOR_ID_MAP.OTHER ? defaultAccountInfo?.agentEmail : ''} />
                )}
                {/* 新增邮件模版 */}
                <TemplateAddModal operateMail={operationType === ANCHOR_ID_MAP.OTHER ? defaultAccountInfo?.agentEmail : ''} />
              </div>
            </div>
            {/* 右侧锚点列表 */}
            <div className={styles.configContentAnchor}>
              <Anchor offsetTop={0} onClick={handleAnchorClick} getContainer={() => anchorRef.current} onChange={handleAnchorScroll}>
                {ANCHOR_LIST.map(item =>
                  item.show && !item.show(!isCorpMail && !isSharedAccount) ? (
                    <></>
                  ) : (
                    <Link key={item.id} href={`#${item.id}`} title={<div ref={refObj[item.id]}>{item.title}</div>}>
                      {item.items?.map(itm => (itm.show(bindAccounts) ? <Link key={itm.id} href={`#${itm.id}`} title={itm.title} /> : <></>))}
                    </Link>
                  )
                )}
              </Anchor>
            </div>
          </div>
          {/* 自动回复 */}
          {autoReplyModalVisible && (
            <AutoReplyModal
              visible={autoReplyModalVisible}
              closeModel={() => {
                setAutoReplyModalVisible(false);
              }}
            />
          )}
          {/* 多账号登陆 */}
          <MultAccountsLoginModal visible={multAccountsLoginVisible} loginInfo={multAccountsLoginInfo} closeModel={closeMultAccountsModal} />
        </div>
      </div>
    </>
  );
};
export default MailConfig;
