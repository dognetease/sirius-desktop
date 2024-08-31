import React, { useEffect } from 'react';
import { Tooltip } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classNames from 'classnames';
import { apiHolder, apis, inWindow, ContactModel, MailApi, MailConfApi, locationHelper, ContactAndOrgApi } from 'api';
import CopyToClipboard from 'react-copy-to-clipboard';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { ContactDetailInfoProps, RenderItemsProps } from './data';
import styles from './detail_info.module.scss';
import cardStyles from '@web-im/common/usercard/userCard.module.scss';
import ContactTrackerIns from '../../tracker';
import { ReactComponent as CheckedCircleIcon } from '@/images/icons/checked_circle.svg';
import { ReactComponent as CloseCircleIcon } from '@/images/icons/close_circle.svg';
import { CopyIcon } from '@web-common/components/UI/Icons/icons';
import ScheduleModal from '@web-schedule/components/ScheduleModal/ScheduleModal';
import MemberList from '@web-contact/component/MemberList/MemberList';
import { api } from 'api';
import { useContactPersonalOrg } from '@web-common/hooks/useContactModel';
import { doGetContactData } from '@web-common/state/selector/contact';
import { getIn18Text } from 'api';
import dayjs from 'dayjs';
const sysApi = api.getSystemApi();
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;

const ContactDetailInfo: React.FC<ContactDetailInfoProps> = props => {
  const { emailList, phoneList, contact, branch, directSend, visibleSchedule = true, onNotifyParent, isMainAccount = true, _account } = props;
  const contactData = contact.contact;
  const personalOrg = contactData?.personalOrg;
  const { personalOrgNameList, hasDataOrgIds } = useContactPersonalOrg(personalOrg);
  const [selectedKeys] = useState2RM('selectedKeys');
  useEffect(() => {
    const personalOrgCount = personalOrg?.length || 0;
    const personalOrgNameListCount = personalOrgNameList?.length || 0;
    let hasDiff = false;
    if (!personalOrgCount) {
      hasDiff = false;
    } else if (!personalOrgNameListCount) {
      hasDiff = true;
    } else if (personalOrgCount !== hasDataOrgIds.length) {
      hasDiff = true;
    } else if (personalOrgCount === hasDataOrgIds.length) {
      hasDiff = personalOrg!.some(orgId => !hasDataOrgIds.includes(orgId));
    }
    if (hasDiff) {
      doGetContactData({ personalOrg, _account });
    }
  }, [personalOrg]);
  const tooltipContainer = () => document.getElementById(contactData.id) || document.body;
  const sendMail = (email: string[]) => {
    if (directSend && email.length) {
      mailApi.doWriteMailToContact(email);
    }
  };
  // 查看往来邮件
  const checkMailRelated = (relatedContact: ContactModel) => {
    const fromAccount = selectedKeys?.accountId || '';
    mailConfApi.doOpenRelatedPage(relatedContact, fromAccount);
  };
  const renderItems = (renderItemsProps: RenderItemsProps) => {
    const {
      items,
      label,
      enableSend = false,
      enableVisit = false,
      showCopy = true,
      showPoint = false,
      toSchedule = false,
      toNumber = false,
      visibleMailRelated = false,
    } = renderItemsProps;
    return (
      <div className={`${styles.infoRows} ${showCopy && styles.infoSingleRow}`}>
        <div className={styles.infoLabel}>{label}</div>
        <div className={styles.infoContent}>
          {items.map(cell => (
            <div className={styles.infoLine} key={cell}>
              <span
                className={classNames(cardStyles.infoText, styles.infoText, {
                  [styles.infoLink]: enableSend || toSchedule || visibleMailRelated || toNumber || enableVisit,
                  // [styles.infoTextEllipsis]: showCopy
                })}
                onClick={() => {
                  onNotifyParent && onNotifyParent();
                  if (enableSend) {
                    sendMail([cell]);
                    ContactTrackerIns.tracker_contact_detail_click(getIn18Text('DIANJIYOUXIANGJIN'));
                  }
                  if (visibleMailRelated) {
                    checkMailRelated(contact);
                  }

                  if (enableVisit) {
                    sysApi.handleJumpUrl(0, cell);
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
                        enableSend && ContactTrackerIns.tracker_contact_detail_click(getIn18Text('FUZHIYOUXIANGDE'));
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
  const inMainPage = inWindow() && locationHelper.testPathMatch('/');
  const visibleNumber = contactApi.isMailListByAccountType(contactData.accountType);
  const showSchedule =
    visibleSchedule && isMainAccount && inMainPage && contactData.enableIM && contactData.type === 'enterprise' && contactData.accountName !== currentUser;
  const visibleMailRelated = contactData.accountName && contactData.accountName.length > 0;

  // const visibleJob=contactData.type==='enterprise' && typeof  contactData.job==='string'
  const visibleJob = contactData.type === 'enterprise' && contactData.job && contactData.job.length;

  const visibleAdrList =
    contactData.type === 'personal' &&
    contactData.adrList &&
    contactData.adrList.filter(item => {
      return item.trim().length > 0;
    }).length;
  const visibleBirthday = contactData.type === 'personal' && contactData.birthday;
  const visiblePref = contactData.type === 'personal' && contactData.pref;
  const visibleRole = contactData.type === 'personal' && contactData.role;
  const visibleTitle = contactData.type === 'personal' && contactData.title;
  const visibleOrg = contactData.type === 'personal' && contactData.org;
  const visibleOrgname = contactData.type === 'personal' && contactData.orgname;

  return (
    <div className={styles.infoWrapper}>
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
          items: [getIn18Text('CHAKANWANGLAIYOU')],
          label: getIn18Text('YOUJIAN'),
          showCopy: false,
          visibleMailRelated: true,
        })}
      {visiblePhone &&
        renderItems({
          items: phoneList,
          label: getIn18Text('DIANHUA'),
        })}
      {visibleJob &&
        renderItems({
          items: [contactData?.job || ''],
          // label:getIn18Text("ZHIWEI")
          label: '职位',
          showCopy: false,
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

      {Boolean(personalOrgNameList.length) && (
        <div className={styles.infoRows}>
          <div className={styles.infoLabel}>{getIn18Text('FENZU')}</div>
          <div className={styles.infoContent}>
            <div className={styles.personalOrgWrap}>
              {personalOrgNameList.map(item => (
                <div className={styles.personalOrgLabel} key={item}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {visibleAdrList
        ? renderItems({
            items: contactData
              .adrList!.filter(item => {
                return item.trim().length > 0;
              })
              .map(item => {
                return item.replace(/;/g, '');
              }),
            label: getIn18Text('LIANXIDIZHI'),
            showCopy: false,
          })
        : null}
      {visibleBirthday
        ? renderItems({
            items: [dayjs(contactData.birthday!).format('YYYY/MM/DD')],
            label: getIn18Text('SHENGRI'),
            showCopy: false,
          })
        : null}
      {visiblePref
        ? renderItems({
            items: [contactData.pref!],
            label: getIn18Text('GERENZHUYE'),
            showCopy: true,
          })
        : null}
      {visibleOrgname
        ? renderItems({
            items: [contactData.orgname!],
            label: getIn18Text('GONGSI/ZUZHI'),
            showCopy: false,
          })
        : null}
      {visibleOrg
        ? renderItems({
            items: [contactData.org!],
            label: getIn18Text('BUMEN'),
            showCopy: false,
          })
        : null}
      {visibleTitle
        ? renderItems({
            items: [contactData.title!],
            label: getIn18Text('ZHIWEI'),
            showCopy: false,
          })
        : null}
      {visibleRole
        ? renderItems({
            items: [contactData.role!],
            label: getIn18Text('JUESE'),
            showCopy: false,
          })
        : null}
    </div>
  );
};
export default ContactDetailInfo;
