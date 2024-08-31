import React from 'react';
import { Tooltip, message } from 'antd';
import classNames from 'classnames';
import { apiHolder, apis, inWindow, MailApi, MailConfApi } from 'api';
import CopyToClipboard from 'react-copy-to-clipboard';
import { ContactDetailInfoProps, RenderItemsProps } from './data';
import styles from '@web-contact/component/Detail/detail_info.module.scss';
import cardStyles from '@web-im/common/usercard/userCard.module.scss';
import ContactTrackerIns from '@web-contact/tracker';
import { ReactComponent as CheckedCircleIcon } from '@/images/icons/checked_circle.svg';
import { ReactComponent as CloseCircleIcon } from '@/images/icons/close_circle.svg';
import { CopyIcon } from '@web-common/components/UI/Icons/icons';
import ScheduleModal from '@web-schedule/components/ScheduleModal/ScheduleModal';
import MemberList from '@web-contact/component/MemberList/MemberList';
import { api } from 'api';
import { getIn18Text } from 'api';
const sysApi = api.getSystemApi();
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const ContactDetailInfo: React.FC<ContactDetailInfoProps> = props => {
  const { emailList, phoneList, contact, branch, directSend, visibleSchedule = true, customItems, onNotifyParent } = props;
  const contactData = contact.contact;
  const tooltipContainer = () => document.getElementById(contactData.id) || document.body;
  const sendMail = (email: string[]) => {
    if (directSend && email.length) {
      mailApi.doWriteMailToContact(email);
    }
  };
  // 查看往来邮件
  const checkMailRelated = (data: ContactModel) => {
    mailConfApi.doOpenRelatedPage(data);
  };
  const renderItems = (renderItemsProps: RenderItemsProps) => {
    const { items, label, enableSend = false, showCopy = true, showPoint = false, toSchedule = false, toNumber = false, visibleMailRelated = false } = renderItemsProps;
    return (
      <div className={`${styles.infoRows} ${showCopy && styles.infoSingleRow}`}>
        <div className={styles.infoLabel}>{label}</div>
        <div className={styles.infoContent}>
          {items.map(cell => (
            <div className={styles.infoLine} key={cell}>
              <span
                className={classNames(cardStyles.infoText, styles.infoText, {
                  [styles.infoLink]: enableSend || toSchedule || visibleMailRelated || toNumber,
                  // [styles.infoTextEllipsis]: showCopy
                })}
                onClick={() => {
                  onNotifyParent && onNotifyParent();
                  if (enableSend) {
                    sendMail([cell]);
                    ContactTrackerIns.tracker_contact_detail_click(getIn18Text('DIANJIYOUXIANGJINRUXIEXIN'));
                  }
                  if (visibleMailRelated) {
                    checkMailRelated(contact);
                  }
                }}
              >
                {showPoint ? <span className={styles.infoPoint} /> : <></>}
                {toSchedule && <ScheduleModal user={contactData.accountName} />}
                {toNumber && <MemberList user={contactData.accountName} contactName={contactData.contactName} />}
                {!toSchedule && !toNumber && cell}
              </span>

              {showCopy && (
                <Tooltip getPopupContainer={tooltipContainer} overlayClassName={styles.tooltipOverlay} title={getIn18Text('FUZHI')} placement="right">
                  <div className={classNames(styles.copyIcon)}>
                    <CopyToClipboard
                      onCopy={(_, result) => {
                        message.success({
                          icon: result ? <CheckedCircleIcon /> : <CloseCircleIcon />,
                          content: (
                            <span
                              style={{
                                marginLeft: 8,
                              }}
                            >
                              {result ? getIn18Text('FUZHICHENGGONG') : getIn18Text('FUZHISHIBAI')}
                            </span>
                          ),
                        });
                        enableSend && ContactTrackerIns.tracker_contact_detail_click(getIn18Text('FUZHIYOUXIANGDEZHI'));
                      }}
                      text={cell}
                    >
                      <CopyIcon />
                    </CopyToClipboard>
                  </div>
                </Tooltip>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
  const visiblePhone = phoneList.length > 0;
  const visiblePosition = branch && contactData.type === 'enterprise' && Array.isArray(contactData.position) && contactData.position.length > 0;
  const visibleRemark = !!contactData.remark;
  const currentUser = sysApi.getCurrentUser()?.id;
  const inMainPage = inWindow() && window.location.pathname === '/';
  const visibleNumber = Array.isArray(contactData.position) && contactData.position.length === 1 && contactData.position[0].toString() === getIn18Text('YOUJIANLIEBIAO');
  const showSchedule = visibleSchedule && inMainPage && contactData.enableIM && contactData.type === 'enterprise' && contactData.accountName !== currentUser;
  const visibleMailRelated = contactData.accountName && contactData.accountName.length > 0;
  return (
    <div className={styles.infoWrapper}>
      {customItems}
      {renderItems({
        items: emailList,
        label: getIn18Text('YOUXIANG'),
        enableSend: true,
      })}
      {showSchedule &&
        renderItems({
          items: [getIn18Text('CHAKANRICHENG')],
          label: getIn18Text('RILI'),
          showCopy: false,
          toSchedule: true,
        })}
      {visibleMailRelated &&
        renderItems({
          items: [getIn18Text('CHAKANWANGLAIYOUJIAN')],
          label: getIn18Text('YOUJIAN'),
          showCopy: false,
          visibleMailRelated: true,
        })}
      {visiblePhone &&
        renderItems({
          items: phoneList,
          label: getIn18Text('DIANHUA'),
        })}
      {visiblePosition &&
        renderItems({
          items: contactData.position!.map(item => item.join('/')),
          label: getIn18Text('BUMEN'),
          showCopy: false,
          showPoint: contactData.position!.length > 1,
        })}
      {visibleNumber &&
        renderItems({
          items: [getIn18Text('CHAKAN')],
          label: getIn18Text('CHENGYUAN'),
          showCopy: false,
          toNumber: true,
          // showPoint: contactData.position!.length > 1
        })}
      {visibleRemark &&
        renderItems({
          items: [contactData.remark!],
          label: getIn18Text('BEIZHU'),
          showCopy: false,
        })}
    </div>
  );
};
export default ContactDetailInfo;
