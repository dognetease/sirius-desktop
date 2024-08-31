import React, { useEffect, useState } from 'react';
import { Divider, Dropdown, Skeleton, Tooltip } from 'antd';
import { apiHolder, apis, ContactModel, inWindow, MailConfApi } from 'api';
import classNames from 'classnames';
import { navigate } from 'gatsby';
import SendMailPop from '@web-contact/component/Detail/SendMailPop';
import styles from '@web-contact/component/Detail/detail.module.scss';
import { openSession } from '@web-im/common/navigate';
import ContactTrackerIns from '@web-contact/tracker';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { ContactActions, useActions, useAppSelector } from '@web-common/state/createStore';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import { transAvatarSize } from '@web-common/utils/contact_util';
import { ContactDetailProps } from './data';
import ContactDetailInfo from './detail_info';
import { getIn18Text } from 'api';

const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const ContactDetail: React.FC<ContactDetailProps> = props => {
  const {
    from = 'other',
    extraOpMenu,
    contact: propContact,
    branch = false,
    dividerLine = true,
    directSend = true,
    containerClassName = '',
    containerStyle = {},
    onNavigate,
    visibleSchedule = true,
    onNotifyParent,
  } = props;
  const [contact, setContact] = useState<ContactDetailProps['contact']>(propContact);
  const contactActions = useActions(ContactActions);
  const [bigAvatar, setBigAvatar] = useState<string>('');
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  useEffect(() => {
    setContact(propContact);
    let avatar = propContact?.contact?.avatar;
    if (avatar) {
      // corpmail的头像，不支持该规则
      if (!isCorpMail) {
        avatar = transAvatarSize(avatar, 'big');
      }
      setBigAvatar(avatar);
    }
  }, [propContact]);
  useEffect(() => {
    ContactTrackerIns.tracker_contact_view_detail();
  }, []);
  if (!contact) {
    return null;
  }
  const { contactName, avatar, id, enableIM, accountName, color, type, visibleCode, hitQueryEmail } = contact.contact;
  const tooltipContainer = () => document.getElementById(contact.contact.id) || document.body;
  const telOrMobiles = Array.from(new Set(contact.contactInfo.filter(e => e.contactItemType === 'MOBILE' || e.contactItemType === 'TEL').map(e => e.contactItemVal)));
  const emailList = Array.from(new Set(contact.contactInfo.filter(e => e.contactItemType === 'EMAIL').map(e => e.contactItemVal)));
  if (emailList.length === 0) {
    emailList.push(accountName);
  }
  // 发送聊天消息 @autor:guochao
  const sendMsg = async contactInfo => {
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
  const inMainPage = inWindow() && window.location.pathname === '/';
  const visibleIM = enableIM && inMainPage;
  const visibleAddToContact = type === 'external' && inMainPage;
  // 往来邮件调整到下面显示，此处隐藏
  // const visibleMailRelated = accountName && accountName.length > 0;
  const visibleMailRelated = false;
  const visibleExtraOp = from === 'contact' && extraOpMenu !== undefined && type === 'personal';
  const renderContactAvatarWrap = (
    <div className={styles.contactAvatarWrap}>
      <div className={styles.contactAvatar}>
        <AvatarTag
          size={120}
          user={{
            name: contactName,
            avatar,
            email: id,
            color,
          }}
        />
      </div>
      <div className={styles.contactAvatarInfo}>
        <div className={styles.contactAvatarInfoName}>{contactName || hitQueryEmail || accountName}</div>
        <div className={styles.contactIconGroup}>
          <SendMailPop mailList={emailList}>
            <Tooltip getPopupContainer={tooltipContainer} overlayClassName={styles.tooltipOverlay} title={getIn18Text('FAYOUJIAN')} placement="bottom">
              <i className={classNames(styles.icon, styles.iconSendEmail)} />
            </Tooltip>
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
              <Tooltip getPopupContainer={tooltipContainer} overlayClassName={styles.tooltipOverlay} title={getIn18Text('FAXIAOXI')} placement="bottom">
                <i
                  className={classNames(styles.icon, styles.iconSendMessage)}
                  onClick={() => {
                    sendMsg(contact.contactInfo);
                    onNotifyParent && onNotifyParent();
                    ContactTrackerIns.tracker_contact_detail_click(getIn18Text('FAXIAOXI'));
                  }}
                />
              </Tooltip>
            </>
          )}
          {visibleAddToContact && (
            <>
              <Tooltip getPopupContainer={tooltipContainer} overlayClassName={styles.tooltipOverlay} title={getIn18Text('TIANJIATONGXUNLU')} placement="bottom">
                <i
                  onClick={() => {
                    contactActions.doCreateFormExternal(contact);
                    if (onNavigate) {
                      onNavigate();
                    }
                    navigate('#contact');
                  }}
                  className={classNames(styles.icon, styles.iconAddContact)}
                />
              </Tooltip>
            </>
          )}
          {visibleExtraOp && (
            <>
              <Dropdown overlayStyle={{ zIndex: 1020 }} overlayClassName={styles.dropDownOverlay} trigger={['click']} overlay={extraOpMenu!}>
                <Tooltip getPopupContainer={tooltipContainer} overlayClassName={styles.tooltipOverlay} title={getIn18Text('GENGDUO')} placement="right">
                  <i className={classNames(styles.icon, styles.iconEllipsis)} />
                </Tooltip>
              </Dropdown>
            </>
          )}
        </div>
      </div>
      {dividerLine && <Divider />}
    </div>
  );
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
      <div className={styles.avatarInfoWrap}>
        <div className={styles.contactName}>
          <div className={styles.contactNameLabel}>{contactName || accountName}</div>
          {visibleCode === 4 && <div className={styles.contactDisabled}>{getIn18Text('TINGYONG')}</div>}
        </div>
        <div className={styles.iconGroup}>
          <div
            className={styles.iconWrap}
            onClick={e => {
              onNotifyParent && onNotifyParent();
              e.stopPropagation();
            }}
          >
            <SendMailPop mailList={emailList}>
              <i className={classNames(styles.icon, styles.iconSendEmail)} />
            </SendMailPop>
            <div className={styles.iconTxt}>{getIn18Text('FAYOUJIAN')}</div>
          </div>
          {visibleMailRelated && (
            <div className={styles.iconWrap}>
              <i
                className={classNames(styles.icon, styles.iconMailRelated)}
                onClick={e => {
                  e.stopPropagation();
                  onNotifyParent && onNotifyParent();
                  checkMailRelated(contact);
                }}
              />
              <div className={styles.iconTxt}>{getIn18Text('WANGLAIYOUJIAN')}</div>
            </div>
          )}
          {visibleIM && (
            <div className={styles.iconWrap}>
              <i
                className={classNames(styles.icon, styles.iconSendMessage)}
                onClick={e => {
                  e.stopPropagation();
                  sendMsg(contact.contactInfo);
                  onNotifyParent && onNotifyParent();
                  ContactTrackerIns.tracker_contact_detail_click(getIn18Text('FAXIAOXI'));
                }}
              />
              <div className={styles.iconTxt}>{getIn18Text('FAXIAOXI')}</div>
            </div>
          )}
          {visibleAddToContact && (
            <div className={styles.iconWrap}>
              <i
                onClick={e => {
                  e.stopPropagation();
                  contactActions.doCreateFormExternal(contact);
                  if (onNavigate) {
                    onNavigate();
                  }
                  navigate('#contact');
                }}
                className={classNames(styles.icon, styles.iconAddContact)}
              />
              <div className={styles.iconTxt}>{getIn18Text('TIANJIATONGXUNLU')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  const detailInfoStyle: React.CSSProperties =
    from === 'contact'
      ? {
          maxWidth: '100%',
        }
      : {
          maxWidth: 320,
          maxHeight: 200,
          overflowY: 'auto',
        };
  return (
    <Skeleton active loading={accountName === ''} avatar paragraph={{ rows: 4 }}>
      <div id={id} style={containerStyle} className={classNames(styles.detailContainer, containerClassName)}>
        {from === 'contact' ? renderContactAvatarWrap : renderAvatarWrap}
        <div style={detailInfoStyle}>
          <ContactDetailInfo
            contact={contact}
            branch={branch}
            directSend={directSend}
            emailList={emailList}
            phoneList={telOrMobiles}
            visibleSchedule={visibleSchedule}
            customItems={props.customDetailInfo}
            onNotifyParent={onNotifyParent}
          />
        </div>
      </div>
    </Skeleton>
  );
};
export default ContactDetail;
