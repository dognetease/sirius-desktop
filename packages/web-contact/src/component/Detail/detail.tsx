import React, { useEffect, useState, useCallback, useImperativeHandle, useRef } from 'react';
import { Divider, Skeleton, Tooltip } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import lodashGet from 'lodash/get';
import {
  apiHolder,
  apis,
  ContactModel,
  inWindow,
  MailConfApi,
  EntityContactItem,
  ContactAndOrgApi,
  locationHelper,
  NIMApi,
  SystemApi,
  AccountApi,
  DataTrackerApi,
  apiHolder as api,
  ProductAuthApi,
  util,
  getIn18Text,
} from 'api';
import classNames from 'classnames';
import SendMailPop from './SendMailPop';
import CustomerDetail from './detail_edm';
import styles from './detail.module.scss';
import { openSession } from '@web-im/common/navigate';
import ContactTrackerIns from '../../tracker';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { useActions, ContactActions, useAppSelector, useAppDispatch } from '@web-common/state/createStore';
import { ContactDetailProps } from './data';
import ContactDetailInfo from './detail_info';
import MedalInfo from './medal_info';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import { buildContactModel, getDisplayEmailInfo, transAvatarSize } from '@web-common/utils/contact_util';
// import { SenderPrioritySelect } from '@web-mail/components/SenderPriority/sender_priority';
import { useContactModel } from '@web-common/hooks/useContactModel';
import { PersonalModal } from '@web-common/components/UI/SiriusContact/personal/personalModal';
// import ExtraOpMenu from "@web-contact/component/ExtraOpMenu/ExtraOpMenu";
// import { createNewCustomerModal } from '@/components/Layout/Customer/NewClient/components/CreateNewClientModal/customsToNewClientModal';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
// import { addToExistedCustomerModal } from '@/components/Layout/Customer/NewClient/components/CreateNewClientModal/addToExistedCustomerModal';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { MailListModal } from '@web-common/components/UI/SiriusContact/mailListModal/mailListModal';
import PersonalMark from '@web-common/components/UI/SiriusContact/personalMark/mark';
import { PrivilegeCheckForMailPlus } from '@/components/UI/PrivilegeEnhance';
import { refreshContactDataByEmails } from '@web-common/state/reducer/contactReducer';
import { scenes } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawerLeads2';
import { PublicMailDomainList } from '@web-edm/utils/utils';
import { UniDrawerModuleId, showUniDrawer } from '@lxunit/app-l2c-crm';
import type { BusinessContactVO } from '@lxunit/app-l2c-crm/models';

const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const nimApi = apiHolder.api.requireLogicalApi('NIM') as NIMApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
// const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const productApi = apiHolder.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;

interface LxLxContactDetailRef {
  handleAddContact: () => void;
}

interface LxContactDetailProps extends ContactDetailProps {
  setPersonalModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setIsEditPersonalModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleAddContact: () => void;
}
const ContactDetail: React.FC<ContactDetailProps> = props => {
  const { contactId, email, showClose, originName, _account, onNotifyParent, onOperateSuccess } = props;
  const contactModel = useContactModel({ email, name: originName, contactId, needFull: false, _account });
  const [personalModalVisible, setPersonalModalVisible] = useState<boolean>(false);
  const [isEditPersonalModal, setIsEditPersonalModal] = useState<boolean>(false);
  const contactActions = useActions(ContactActions);
  // 操作个人信息成功
  const onPersonalOperateSuccess = useCallback(() => {
    setPersonalModalVisible(false);
    onOperateSuccess && onOperateSuccess();
  }, []);

  // 添加联系人
  const handleAddContact = useCallback(() => {
    setPersonalModalVisible(true);
    setIsEditPersonalModal(false);
    contactActions.doCreateFormExternal(contactModel);
  }, [contactModel]);
  if (!contactModel) {
    return null;
  }
  // const isOpenSeaCustomer = lodashGet(contactModel, 'customerOrgModel.role', '') === 'openSeaCustomer';
  const customerEmail = email || contactApi.doGetModelDisplayEmail(contactModel) || '';
  const id = contactId || contactModel?.contact.id;
  const waimaoContent = (
    <CustomerDetail
      originName={originName}
      _account={_account}
      email={customerEmail}
      contactId={contactId}
      handleAddContact={() => handleAddContact()}
      showClose={showClose}
      onNotifyParent={onNotifyParent}
    />
  );
  const lxContent = (
    <LxDetail {...props} setPersonalModalVisible={setPersonalModalVisible} setIsEditPersonalModal={setIsEditPersonalModal} handleAddContact={handleAddContact} />
  );

  const visibleWaimao = contactModel?.customerOrgModel?.companyId && id && customerEmail && customerEmail !== _account;
  return (
    <>
      {visibleWaimao ? waimaoContent : lxContent}
      {/* 添加联系人modal */}
      {personalModalVisible && (
        <PersonalModal
          contactId={id}
          _account={_account}
          contact={contactModel}
          isEdit={isEditPersonalModal}
          onCancel={() => setPersonalModalVisible(false)}
          onSuccess={() => onPersonalOperateSuccess()}
        />
      )}
    </>
  );
};

const LxDetail: React.FC<LxContactDetailProps> = props => {
  const {
    from = 'other',
    contactId,
    email,
    contact: propContact,
    branch = false,
    dividerLine = true,
    directSend = true,
    containerClassName = '',
    containerStyle = {},
    onNavigate,
    visibleSchedule = true,
    onNotifyParent,
    onOperateSuccess,
    _account = systemApi.getCurrentUser()?.id || '',
    originName,
    showClose,
    isMailList,
    isDeleteManageMailList,
    isEditManageMailList,
    isSelectedPersoanlMark,
    setIsEditPersonalModal,
    setPersonalModalVisible,
    handleAddContact,
  } = props;
  // 多账号逻辑，是否为主账号
  // const dispatch = useAppDispatch();
  const isMainAccount = systemApi.getCurrentUser()?.id === _account;
  const [bigAvatar, setBigAvatar] = useState<string>('');
  const [updateMailListModalVisible, setUpdateMailListModalVisible] = useState<boolean>(false);
  const contactActions = useActions(ContactActions);
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  const contact = useContactModel({
    email,
    contactId,
    name: propContact?.contact?.contactName,
    _account,
    needFull: true,
    needCompleteContact: true,
    watchParams: ['contactId'],
  });

  // uni弹窗
  // const [, setUniCustomerParam] = useState2RM('uniCustomerParam');
  // uni添加到原有客户
  const [, setUniToCustomerOrClueParam] = useState2RM('uniToCustomerOrClueParam');

  const detailInfoStyle: React.CSSProperties = from === 'contact' ? { maxWidth: '100%' } : { maxWidth: 320, maxHeight: 200, overflowY: 'auto' };

  const inMainPage = inWindow() && locationHelper.testPathMatch('/');

  useEffect(() => {
    let avatar = contact?.contact?.avatar;
    if (avatar) {
      // corpmail的头像，不支持该规则
      if (!isCorpMail) {
        avatar = transAvatarSize(avatar, 'big');
      }
      setBigAvatar(avatar);
    }
  }, [lodashGet(contact, 'contact.avatar', '')]);
  useEffect(() => {
    ContactTrackerIns.tracker_contact_view_detail();
  }, []);

  // 编辑邮件列表成功
  const mailListEditSuc = useCallback(() => {
    setUpdateMailListModalVisible(false);
    onOperateSuccess && onOperateSuccess();
  }, []);

  if (!contact) {
    return null;
  }
  const {
    contactName,
    avatar,
    id,
    enableIM,
    accountName,
    color = util.getColor(accountName),
    type,
    visibleCode,
    // accountType,
    // priority: defaultPriority,
  } = contact.contact || {};

  const getTelOrgMobiles = (contactInfo: EntityContactItem[]) => {
    const list = contactInfo.filter(e => e.contactItemType === 'MOBILE' || e.contactItemType === 'TEL');
    const telSet = new Set<string>();
    list.forEach(e => {
      if (e?.contactItemVal && e?.contactItemVal?.trim()) {
        telSet.add(e?.contactItemVal);
      }
    });
    return [...telSet];
  };

  const getEmailList = (contactInfo: EntityContactItem[], accountName: string) => {
    const list = getDisplayEmailInfo(contactInfo);
    const emailSet = new Set<string>();
    emailSet.add(accountName);
    list.forEach(e => {
      if (e?.contactItemVal && e?.contactItemVal?.trim()) {
        emailSet.add(e?.contactItemVal);
      }
    });
    return [...emailSet];
  };
  // 公海客户按陌生人显示
  const isOpenSeaCustomer = lodashGet(contact, 'customerOrgModel.role', '') === 'openSeaCustomer';
  const contactInfo = contact.contactInfo || [];
  const visibleIM = enableIM && !isSelectedPersoanlMark && inMainPage && isMainAccount && nimApi.getIMAuthConfig();

  // 是否展示 编辑联系人（个人通讯录）
  const isPersonal = type === 'personal';
  // 是否展示 添加到通讯录
  const visAddToContact = !isSelectedPersoanlMark && (type === 'external' || isOpenSeaCustomer);
  // 是否展示 新建客户 （个人通讯录/陌生人）
  const visAddCustomer = isMainAccount && (['personal', 'external'].includes(type) || isOpenSeaCustomer);
  // 是否展示 添加到已存在的客户（个人通讯录/陌生人）
  const visAddToExistedCustomer = isMainAccount && (['personal', 'external'].includes(type) || isOpenSeaCustomer);
  // 往来邮件调整到下面显示，此处隐藏
  // const visibleMailRelated = accountName && accountName.length > 0;
  const visibleMailRelated = false;
  // 编辑/删除
  // 来自通讯录 个人通讯录 或 企业通讯录下邮件列表
  const visibleEdit = (type === 'personal' && !isSelectedPersoanlMark) || (type === 'enterprise' && (isDeleteManageMailList || isEditManageMailList));
  const visibleDelete = (type === 'personal' && !isSelectedPersoanlMark) || (type === 'enterprise' && isDeleteManageMailList);
  const visibleExtraOp = from === 'contact' && (visibleEdit || visibleDelete);
  const displayEmail = contactApi.doGetModelDisplayEmail(contact);
  const tooltipContainer = () => document.getElementById(id) || document.body;
  const telOrMobiles = getTelOrgMobiles(contactInfo);
  // 类型是邮箱且（个人 + 企业主显示账号的邮箱）
  const emailList = getEmailList(contactInfo, accountName);

  // 添加客户
  const handleAddCustomer = () => {
    onNotifyParent && onNotifyParent();
    trackApi.track('waimao_mail_view_contactsDetailPage​_action', { action: 'addCustomer' });
    const emailDomain = email?.split('@')[1] || '';
    const webapp = PublicMailDomainList.includes(emailDomain) ? '' : emailDomain;
    // setUniCustomerParam({
    //   visible: true,
    //   source: 'mailListStranger',
    //   customerData: {
    //     company_name: '',
    //     website: webapp,
    //     contact_list: [
    //       {
    //         condition: 'company',
    //         contact_name: contactName,
    //         email: accountName,
    //       },
    //     ],
    //   }, // 打开详情页的预置数据(录入客户场景和添加联系人到已有客户场景都需要传预置数据)
    //   onSuccess: () => {
    //     console.log('添加客户成功');
    //     refreshContactDataByEmails(
    //       {
    //         [_account]: [accountName],
    //       },
    //       new Map([[accountName, contactName]])
    //     );
    //     setUniCustomerParam({ visible: false, source: 'mailListStranger' });
    //   },
    //   onClose: () => {
    //     console.log('添加客户关闭');
    //     setUniCustomerParam({ visible: false, source: 'mailListStranger' });
    //   },
    // });
    showUniDrawer({
      moduleId: UniDrawerModuleId.CustomerDetail,
      moduleProps: {
        visible: true,
        onClose: () => {},
        onSuccess: () => {
          refreshContactDataByEmails(
            {
              [_account]: [accountName],
            },
            new Map([[accountName, contactName]])
          );
        },
        customerData: {
          company_name: '',
          website: webapp,
          contact_list: [
            {
              condition: 'company',
              contact_name: contactName,
              email: accountName,
            } as unknown as BusinessContactVO,
          ],
        },
        source: 'mailListStranger',
      },
    });
  };

  // 添加到已有的客户
  const addToExistedCustomers = () => {
    trackApi.track('waimao_mail_view_contactsDetailPage​_action', { action: 'existingCustomer' });
    onNotifyParent && onNotifyParent();
    // addToExistedCustomerModal(contact, undefined, 'card', _account);
    const { contact: contactObj } = contact;
    const { contactName, accountName, displayEmail } = contactObj;
    const email = displayEmail || accountName;
    setUniToCustomerOrClueParam({
      visible: true,
      type: 'customer',
      way: scenes.Email_stranger_card,
      contacts: [
        {
          email,
          contact_name: contactName || email,
        },
      ],
      onOk: () => {
        refreshContactDataByEmails(
          {
            [_account]: [email],
          },
          new Map([[email, contactName]])
        );
      },
    });
  };

  // 发送聊天消息 @autor:guochao
  const sendMsg = async (contactInfo: EntityContactItem[]) => {
    const toAccount = contactInfo.find(item => item.contactItemType === 'yunxin')?.contactItemVal || '';
    if (onNavigate) {
      onNavigate();
    }
    // 创建新会话 then 跳转
    openSession(
      {
        sessionId: `p2p-${toAccount}`,
        mode: 'normal',
      },
      {
        createSession: true,
        validateTeam: false,
      }
    );
  };

  const checkMailRelated = (data: ContactModel) => {
    mailConfApi.doOpenRelatedPage(data);
  };

  const imgPreview = (url: string) => {
    ImgPreview.preview({
      data: [
        {
          downloadUrl: url,
          previewUrl: url,
          OriginUrl: url,
          size: 480,
        },
      ],
      startIndex: 0,
    });
  };

  /**
   * 个人通讯录删除联系人
   */
  const handleDel = async () => {
    // 个人通讯录
    if (type === 'personal') {
      SiriusModal.error({
        title: getIn18Text('QUEDINGYAOSHANCHU11'),
        content: getIn18Text('LIANXIRENHUIZAI'),
        onOk: async () => {
          ContactTrackerIns.tracker_contact_detail_click(getIn18Text('SHANCHU'), '联系人详情页');
          // if (_account) {
          //   accountApi.setCurrentAccount({ email: _account });
          // }
          const success = await contactApi.doDeleteContact({
            accountIdList: [contact.contact.id],
            _account,
          });
          if (success) {
            onOperateSuccess && onOperateSuccess();
            message.success(getIn18Text('SHANCHUCHENGGONG'));
          } else {
            message.error(getIn18Text('SHANCHUSHIBAI'));
          }
        },
      });
      return;
    }

    // 企业通讯录 邮件列表
    if (type === 'enterprise' && isDeleteManageMailList) {
      SiriusModal.error({
        title: (
          <div className={styles.delMailListTitle}>
            {getIn18Text('QUERENSHANCHU“')}
            <span className={styles.contactNameTitle}>{contactName}</span>
            {getIn18Text('”YOUJIANLIEBIAOMA？')}
          </div>
        ),
        content: '',
        onOk: async () => {
          ContactTrackerIns.tracker_contact_detail_click(getIn18Text('SHANCHU'), '联系人详情页');
          // if (_account) {
          //   accountApi.setCurrentAccount({ email: _account });
          // }
          // TODO guochao 待确认
          const accountArr = accountName.split('@');
          if (!accountArr?.length) return;
          const delRes = await contactApi.deleteMaillist({
            account_name: accountArr[0],
            domain: accountArr[1],
            id,
          });
          console.log('delresdelres', delRes);
          const { success, message: msg, code } = delRes;
          if (success) {
            message.success(getIn18Text('SHANCHUCHENGGONG'));
          } else {
            // 没有删除权限
            if (code === 400) {
              message.error('您没有删除该邮件列表的权限');
            } else {
              message.error(msg || getIn18Text('SHANCHUSHIBAI'));
            }
          }
        },
      });
    }
  };

  // 编辑联系人
  const handleEdit = (fromType?: string) => {
    // 个人通讯录
    if (type === 'personal') {
      setPersonalModalVisible(true);
      setIsEditPersonalModal(true);
      // 编辑联系人入口有两个：通讯录详情页/用户卡片
      fromType === 'detail' && ContactTrackerIns.tracker_contact_detail_click(getIn18Text('BIANJI'), '联系人详情页');
      return;
    }
    // 企业通讯录 邮件列表
    if (visibleEdit || visibleDelete) {
      setUpdateMailListModalVisible(true);
      ContactTrackerIns.tracker_contact_detail_click(getIn18Text('BIANJI'), '邮件列表详情页');
    }
  };

  // 联系人 点击发送邮件
  const sendMailBuryPoint = () => {
    // 个人通讯录
    if (type === 'personal') {
      ContactTrackerIns.tracker_contact_detail_click(getIn18Text('FAYOUJIAN'), '联系人详情页');
      return;
    }
    // 企业通讯录
    if (type === 'enterprise') {
      // 邮件列表
      if (isMailList) {
        ContactTrackerIns.tracker_contact_detail_click(getIn18Text('FAYOUJIAN'), '邮件列表详情页');
      } else {
        ContactTrackerIns.tracker_contact_detail_click(getIn18Text('FAYOUJIAN'), '联系人详情页');
      }
      return;
    }
    ContactTrackerIns.tracker_contact_detail_click(getIn18Text('FAYOUJIAN'), '');
  };

  const sendIcon = (
    <Tooltip getPopupContainer={tooltipContainer} overlayClassName={styles.tooltipOverlay} title={getIn18Text('FAYOUJIAN')} placement="bottom">
      <i className={classNames(styles.icon, styles.iconSendEmail)} onClick={sendMailBuryPoint} />
    </Tooltip>
  );

  // 联系人详情
  const renderContactAvatarWrap = (
    <div className={styles.contactAvatarWrap}>
      <div className={styles.contactAvatar}>
        <AvatarTag
          size={120}
          contactId={id}
          showPendant={type === 'enterprise'}
          user={{
            name: contactName,
            avatar,
            email: id,
            color,
          }}
        />
      </div>
      <div className={styles.contactAvatarInfo}>
        <div className={styles.contactAvatarInfoName}>
          <span>{contactName || lodashGet(displayEmail.split('@'), '[0]', displayEmail)}</span>
          {/* 智能模式下线，不再标注优先级 */}
          {/* {isMainAccount && (
          <SenderPrioritySelect
            key={accountName}
            defaultPriority={defaultPriority}
            sender={{
              email: accountName,
              name: contactName,
              type: type
            }}
          />
        )} */}
        </div>
        <div className={styles.contactIconGroup}>
          <SendMailPop mailList={emailList} testId="contact_detail_btn_mail">
            <div className={styles.btnWrap}>{getIn18Text('FAYOUJIAN')}</div>
          </SendMailPop>
          {visibleMailRelated && (
            <>
              <Tooltip
                getPopupContainer={tooltipContainer}
                overlayClassName={styles.tooltipOverlay}
                title={<span>{getIn18Text('WANGLAIYOUJIAN')}</span>}
                placement="bottom"
              >
                <i
                  className={classNames(styles.icon, styles.iconMailRelated)}
                  data-test-id="contact_detail_btn_related"
                  onClick={() => {
                    checkMailRelated(contact);
                    onNotifyParent && onNotifyParent();
                  }}
                />
              </Tooltip>
            </>
          )}
          {visibleIM && (
            <>
              <div
                className={styles.btnWrap}
                data-test-id="contact_detail_btn_im"
                onClick={() => {
                  sendMsg(contactInfo);
                  onNotifyParent && onNotifyParent();
                  ContactTrackerIns.tracker_contact_detail_click(getIn18Text('FAXIAOXI'));
                }}
              >
                {getIn18Text('FAXIAOXI')}
              </div>
            </>
          )}
          {visAddToContact && (
            <>
              <div
                className={styles.btnWrap}
                data-test-id="contact_detail_btn_add"
                onClick={() => {
                  contactActions.doCreateFormExternal(contact);
                }}
              >
                {getIn18Text('TIANJIATONGXUNLU')}
              </div>
            </>
          )}
          {visibleExtraOp && (
            <>
              {visibleEdit && (
                <div className={styles.btnWrap} data-test-id="contact_detail_btn_edit" onClick={() => handleEdit('detail')}>
                  {getIn18Text('BIANJI')}
                </div>
              )}
              {visibleDelete && (
                <div className={styles.btnWrap} data-test-id="contact_detail_btn_delete" onClick={handleDel}>
                  {getIn18Text('SHANCHU')}
                </div>
              )}
            </>
          )}
          {isPersonal && (
            <PersonalMark
              size={20}
              useId
              contactId={id}
              testId="contact_detail_btn_mark"
              email={displayEmail || accountName}
              visibleToolTip={false}
              useText
              visibleHover={false}
              canOperate={type === 'personal'}
              onMarked={(marked: boolean) => {
                ContactTrackerIns.tracker_contact_personal_mark_startIcon_click('通讯录-个人联系人详情页标星', marked);
              }}
              className={styles.btnWrap}
            />
          )}
        </div>
      </div>
      {dividerLine && <Divider />}
    </div>
  );

  // 联系人卡片
  const renderAvatarWrap = (
    <div
      className={styles.avatarContainer}
      onClick={() => {
        bigAvatar && imgPreview(bigAvatar);
      }}
      style={avatar ? { cursor: 'zoom-in' } : {}}
    >
      <div className={styles.avatar}>
        {avatar ? (
          <img
            src={bigAvatar}
            onError={() => {
              setBigAvatar(old => old.replace('480x480', '180x180'));
            }}
            className={styles.avatarImg}
            alt=""
          />
        ) : (
          <div className={styles.avatarColor} style={{ backgroundColor: color }} />
        )}
      </div>
      <div className={styles.avatarMask} />
      {showClose && (
        <div
          className={styles.closeIcon}
          onClick={e => {
            onNotifyParent && onNotifyParent();
            e.stopPropagation();
          }}
        />
      )}
      <div className={styles.avatarInfoWrap}>
        <div className={styles.contactName}>
          <div className={styles.contactNameLabel}>{contactName || accountName} </div>
          <PersonalMark
            size={24}
            contactId={id}
            email={displayEmail || accountName}
            canOperate={type === 'personal'}
            testId="contact_detail_btn_mark"
            onMarked={(marked: boolean) => {
              const source = type === 'personal' ? '个人通讯录联系人卡片' : '企业通讯录联系人卡片';
              ContactTrackerIns.tracker_contact_personal_mark_startIcon_click(source, marked);
            }}
            visibleHover={false}
            visibleToolTip={type !== 'personal' ? getIn18Text('toPersonalCancel') : true}
            useCardIcon
            noMarkedHidden={type !== 'personal'}
            style={{ marginLeft: 8, width: 32, height: 32 }}
          />
          {visibleCode === 4 && <div className={styles.contactDisabled}>{getIn18Text('TINGYONG')}</div>}
        </div>
        {/* 智能模式下线，不再标注优先级 */}
        {/* <div className={styles.contactrPriority}>
        <SenderPrioritySelect key={accountName} defaultPriority={defaultPriority} onClick={e => e.stopPropagation()}
                              type="tooltip" sender={{
          email: accountName,
          name: contactName,
          type: type
        }}/>
      </div> */}
        <div className={styles.iconGroup}>
          <div
            className={styles.iconWrap}
            onClick={e => {
              onNotifyParent && onNotifyParent();
              e.stopPropagation();
            }}
          >
            <SendMailPop mailList={emailList} testId="contact_detail_btn_mail">
              <i className={classNames(styles.icon, styles.iconSendEmail)} />
            </SendMailPop>
            <div className={styles.iconTxt}>{getIn18Text('FAYOUJIAN')}</div>
          </div>
          {visibleMailRelated && (
            <div className={styles.iconWrap}>
              <i
                className={classNames(styles.icon, styles.iconMailRelated)}
                data-test-id="contact_detail_btn_related"
                onClick={e => {
                  e.stopPropagation();
                  onNotifyParent && onNotifyParent();
                  checkMailRelated(contact);
                }}
              />
              <div className={styles.iconTxt}>{getIn18Text('WANGLAIYOUJIAN')}</div>
            </div>
          )}
          {/* 发消息 */}
          {visibleIM && (
            <div className={styles.iconWrap}>
              <i
                className={classNames(styles.icon, styles.iconSendMessage)}
                data-test-id="contact_detail_btn_im"
                onClick={e => {
                  e.stopPropagation();
                  sendMsg(contactInfo);
                  onNotifyParent && onNotifyParent();
                  ContactTrackerIns.tracker_contact_detail_click(getIn18Text('FAXIAOXI'));
                }}
              />
              <div className={styles.iconTxt}>{getIn18Text('FAXIAOXI')}</div>
            </div>
          )}
          {visibleEdit && (
            <div className={styles.iconWrap}>
              <i
                className={classNames(styles.icon, styles.editContactLight)}
                data-test-id="contact_detail_btn_edit"
                onClick={e => {
                  e.stopPropagation();
                  handleEdit('card');
                }}
              />
              <div className={styles.iconTxt}>{getIn18Text('BIANJILIANXIREN')}</div>
            </div>
          )}
          {/* 添加通讯录 */}
          {visAddToContact && (
            <div className={styles.iconWrap}>
              <i
                onClick={e => {
                  e.stopPropagation();
                  handleAddContact();
                }}
                className={classNames(styles.icon, styles.iconAddContact)}
                data-test-id="contact_detail_btn_add"
              />
              <div className={styles.iconTxt}>{getIn18Text('TIANJIATONGXUNLU')}</div>
            </div>
          )}
          {/* 新建客户 */}
          {visAddCustomer && systemApi.inEdm() && productApi.getABSwitchSync('edm_mail') && (
            <div className={styles.iconWrap}>
              <PrivilegeCheckForMailPlus accessLabel="OP" resourceLabel="CONTACT">
                <i
                  onClick={e => {
                    e.stopPropagation();
                    handleAddCustomer();
                  }}
                  className={classNames(styles.icon, styles.iconCreateCustomer)}
                  data-test-id="contact_detail_btn_addCustomer"
                />
              </PrivilegeCheckForMailPlus>
              <div className={styles.iconTxt}>{getIn18Text('addCustomer')}</div>
            </div>
          )}
          {/* 添加到已有客户 */}
          {visAddToExistedCustomer && systemApi.inEdm() && productApi.getABSwitchSync('edm_mail') && (
            <div className={styles.iconWrap}>
              <PrivilegeCheckForMailPlus accessLabel="OP" resourceLabel="CONTACT">
                <i
                  onClick={e => {
                    e.stopPropagation();
                    addToExistedCustomers();
                  }}
                  className={classNames(styles.icon, styles.iconAddToContact)}
                  data-test-id="contact_detail_btn_addToCustomer"
                />
              </PrivilegeCheckForMailPlus>
              <div className={styles.iconTxt}>{getIn18Text('TIANJIADAOYIYOUKEHU')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  const normalContent = (
    <div
      data-test-id={from === 'contact' ? 'contac_detail_content' : 'contac_detail_content_card'}
      id={id}
      style={containerStyle}
      className={classNames(styles.detailContainer, containerClassName)}
    >
      {/* 顶部头像区域 */}
      {from === 'contact' ? renderContactAvatarWrap : renderAvatarWrap}
      {/* 企业 勋章 */}
      {type === 'enterprise' && !isMailList && enableIM && <MedalInfo {...{ from, contact }} />}
      {/* 邮箱 日历 这些详情... */}
      <div style={detailInfoStyle}>
        <ContactDetailInfo
          contact={contact}
          branch={branch}
          isMainAccount={isMainAccount}
          directSend={directSend}
          emailList={emailList}
          phoneList={telOrMobiles}
          // visibleSchedule={visibleSchedule}
          visibleSchedule={!isMailList && visibleSchedule}
          onNotifyParent={onNotifyParent}
          _account={_account}
        />
      </div>
    </div>
  );

  return (
    <Skeleton active avatar loading={accountName === ''} paragraph={{ rows: 4 }}>
      <div
        data-test-id="contac_detail"
        className={styles.contactDetailWrap}
        onClick={e => {
          e.stopPropagation();
        }}
      >
        {normalContent}
        {updateMailListModalVisible && (
          <MailListModal id={id} purpose="update" email={accountName} onCancel={() => setUpdateMailListModalVisible(false)} onSuccess={() => mailListEditSuc()} />
        )}
      </div>
    </Skeleton>
  );
};

export default ContactDetail;
