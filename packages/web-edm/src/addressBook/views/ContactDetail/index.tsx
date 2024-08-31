import React, { useState, useEffect } from 'react';
import { ModalHeader } from '../../components/ModalHeader/index';
import styles from './index.module.scss';
import { Button, Col, Row, Divider, Tabs, Dropdown, Menu, Tooltip } from 'antd';
import { IBaseModalType } from '../baseType';
import { ReactComponent as EmailIcon } from '../../assets/emailIcon.svg';
import { apiHolder, apis, AddressBookApi, MailApi } from 'api';
import ReturnOpenSea from '../../components/ReturnToOpenSea/index';
import { EmailList } from '../../components/emailList';

import { DeleteContacts } from '../DeleteContacts';
import { TransferGroup } from '../TransferGroup';
import { EditContact } from './EditContact';
import MarketHistory from '../../components/MarketHistory';
import NationFlag from '@/components/Layout/CustomsData/components/NationalFlag/index';
import classnames from 'classnames';
import EllipsisLabels from '@/components/Layout/Customer/components/ellipsisLabels/ellipsisLabels';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { useAppSelector } from '@web-common/state/createStore';
import { ReactComponent as SkypeIcon } from '@/components/Layout/globalSearch/assets/skype.svg';
import { ReactComponent as FacebookIcon } from '@/components/Layout/globalSearch/assets/facebook.svg';
import { ReactComponent as LinkedinIcon } from '@/components/Layout/globalSearch/assets/linkedin.svg';
import { ReactComponent as YoutubeIcon } from '@/components/Layout/globalSearch/assets/youtube.svg';
import { ReactComponent as TwitterIcon } from '@/components/Layout/globalSearch/assets/twitter.svg';
import { ReactComponent as InstagramIcon } from '@/components/Layout/globalSearch/assets/instagram.svg';
import { ReactComponent as ZaloIcon } from '@/components/Layout/globalSearch/assets/zalo.svg';
import { ReactComponent as ViberIcon } from '@/components/Layout/globalSearch/assets/viber.svg';
import { ReactComponent as WeChatIcon } from '@/components/Layout/globalSearch/assets/wechat.svg';
import { ReactComponent as QQIcon } from '@/components/Layout/globalSearch/assets/qq.svg';
import { ReactComponent as WangwangIcon } from '@/components/Layout/globalSearch/assets/wangwang.svg';
import { ReactComponent as DingdingIcon } from '@/components/Layout/globalSearch/assets/dingding.svg';
import { ReactComponent as UnknownIcon } from '@/components/Layout/globalSearch/assets/unknown.svg';
import { DisplayGlobalSearchedData } from '../../components/SearchedGlobalData';
import { navigate } from '@reach/router';
import { edmDataTracker } from '../../../tracker/tracker';
import { getIn18Text } from 'api';
import { getLinkFromStr } from '../../utils';

const trackDetailAction = (action: string) => {
  edmDataTracker.track('waimao_address_book_detail', {
    action,
  });
};

const COUNTRY_MAP = require('./countryMap.json');
const ORIGIN_LIST: {
  label: string;
  value: number;
}[] = require('../originMap.json');
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
export interface IContactDetailProps extends IBaseModalType {
  addressId: number;
  contactId?: number;
  hasContactPart?: boolean;
  onWriteEmail?: () => any;
}
const socialIconMap: Record<number, React.FC> = {
  1: SkypeIcon,
  2: FacebookIcon,
  3: LinkedinIcon,
  4: YoutubeIcon,
  5: TwitterIcon,
  6: InstagramIcon,
  7: ZaloIcon,
  8: ViberIcon,
  9: WeChatIcon,
  10: QQIcon,
  11: WangwangIcon,
  12: DingdingIcon,
};

interface SocialItem {
  str: string;
  link: string | null;
  icon: React.FC<any>;
}

const SocialList: React.FC<{ className: string; list: SocialItem[] }> = props => {
  const { className, list } = props;

  return (
    <div className={classnames(styles.social, className)}>
      {list.map(item => {
        const Icon = item.icon;

        return (
          <div className={styles.socialItem}>
            <Icon className={styles.socialIcon} />
            {item.link ? (
              <a className={styles.socialLink} href={item.link} target="_blank">
                {getIn18Text('CHAKAN')}
              </a>
            ) : (
              <span className={styles.socialStr}>{item.str}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export function ContactDetail(props: IContactDetailProps) {
  const hasOp = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'ADDRESS_BOOK', 'OP'));
  const hasDelete = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'ADDRESS_BOOK', 'DELETE'));
  const { visible, contactId, onClose, id, addressId, hasContactPart = true.valueOf, onWriteEmail } = props;
  const [activeTab, setActiveTab] = useState<'marketing' | 'email'>('marketing');
  const [avatarInfo, setAvatarInfo] = useState<{
    name: string;
    mail: string;
    groups: string[];
    groupIds: number[];
  }>({
    name: '',
    mail: '',
    groups: [],
    groupIds: [],
  });
  const [baseInfo, setBaseInfo] = useState<{
    socials: SocialItem[];
    mobile: string;
    origin: string;
    country: string;
    companyName: string;
    companySite: string;
    remark: string;
    continent: string;
    id: number;
    jobTitle: string;
    personalSocials: SocialItem[];
  }>({
    socials: [],
    mobile: '',
    origin: '',
    country: '',
    companyName: '',
    companySite: '',
    remark: '',
    continent: '',
    id: -1,
    jobTitle: '',
    personalSocials: [],
  });
  const [returnOpenSeaVisible, setReturnOpenSeaVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [delContactsVisible, setDelContactsVisible] = useState(false);
  const [transferVisible, setTransferVisible] = useState(false);
  const [isTransfer, setIsTransfer] = useState(true);
  const [transferTitle, setTransferTitle] = useState('');
  const [globalSearchResult, setGlobalSearchResult] = useState({
    country: '',
    count: -1,
    email: '',
    id: '',
    name: '',
  });
  const [outerModalVisible, setOuterModalVisible] = useState(false);

  useEffect(() => {
    setOuterModalVisible(visible);
  }, [visible, addressId]);

  const editContact = () => {
    trackDetailAction('edit');
    setEditVisible(true);
    setOuterModalVisible(false);
  };
  const writeEmail = () => {
    if (avatarInfo.mail && avatarInfo.mail !== '-') {
      const contacts = [avatarInfo.mail];
      mailApi.doWriteMailToContact(contacts);
      trackDetailAction('mail_click');
      onWriteEmail && onWriteEmail();
      onClose && onClose(id);
    }
  };
  const getContactDetail = () => {
    addressBookApi
      .addressBookGetContactById({
        id: addressId,
      })
      .then(resp => {
        const { addressInfo, contactInfo, groupInfos, globalSearchCompanyInfo } = resp;
        setAvatarInfo({
          name: contactInfo.contactName,
          groups: groupInfos.map(each => each.groupName).filter(el => el !== undefined),
          groupIds: groupInfos.map(el => el.groupId).filter(el => el !== undefined),
          mail: addressInfo.contactAddressType === 1 ? addressInfo.contactAddressInfo : '-',
        });
        const { snsInfos = [], tels = [], remark, country, companyName, companySite, continent, jobTitle, personalSnsInfos = [] } = contactInfo;
        const { contactSourceType } = addressInfo;
        const origin = ORIGIN_LIST.find(el => el.value === contactSourceType)?.label;

        const formatSocials = (
          data: {
            accountId: string;
            type: number;
          }[]
        ) => {
          data = data ?? [];
          return data
            .filter(el => el.accountId && el.accountId.length > 0)
            .map(el => {
              return {
                str: el.accountId,
                link: getLinkFromStr(el.accountId),
                icon: socialIconMap[el.type] || UnknownIcon,
              };
            });
        };
        setBaseInfo({
          socials: formatSocials(snsInfos),
          mobile: tels.length ? tels[0] : '',
          origin: origin || '',
          companyName,
          companySite,
          country,
          remark,
          continent,
          id: contactId!,
          jobTitle,
          personalSocials: formatSocials(personalSnsInfos),
        });

        if (globalSearchCompanyInfo) {
          const { id, count, name, email, country } = globalSearchCompanyInfo;
          setGlobalSearchResult({
            country,
            email,
            id,
            name,
            count,
          });
        }
      });
  };
  const transferGroup = () => {
    setTransferVisible(true);
    setIsTransfer(true);
    setOuterModalVisible(false);
    setTransferTitle(`将${avatarInfo.mail}转移至分组`);
  };
  const addGroup = () => {
    setTransferVisible(true);
    setIsTransfer(false);
    setOuterModalVisible(false);
    setTransferTitle(`将${avatarInfo.mail}添加至分组`);
  };
  useEffect(() => {
    getContactDetail();
  }, [addressId]);
  const dropdownMenu = (
    <Menu>
      <PrivilegeCheck accessLabel="OP" resourceLabel="ADDRESS_BOOK">
        <Menu.Item
          onClick={() => {
            setOuterModalVisible(false);
            setReturnOpenSeaVisible(true);
          }}
        >
          {getIn18Text('TUIHUIGONGHAI')}
        </Menu.Item>
      </PrivilegeCheck>
      <PrivilegeCheck accessLabel="DELETE" resourceLabel="ADDRESS_BOOK">
        <Menu.Item
          danger
          onClick={() => {
            setOuterModalVisible(false);
            setDelContactsVisible(true);
          }}
        >
          {getIn18Text('SHANCHULIANXIREN')}
        </Menu.Item>
      </PrivilegeCheck>
    </Menu>
  );
  const countryInEnglish: string | undefined = COUNTRY_MAP[baseInfo.country];

  const gotoGlobalSearchPage = () => {
    const { email, id } = globalSearchResult;
    if (id && id.length > 0) {
      const [_, key] = email.split('@');
      navigate(`#wmData?page=globalSearch&type=domain&keywords=${key}&id=${id}`);
    }
  };

  return (
    <div>
      <Modal
        visible={outerModalVisible}
        title={<ModalHeader title={getIn18Text('LIANXIRENXIANGQING')} onClick={() => onClose(id)} />}
        closable={false}
        maskClosable={false}
        footer={null}
        width={813}
        className={styles.detail}
        onCancel={() => onClose(id)}
      >
        {globalSearchResult.id && globalSearchResult.id.length > 0 && (
          <div className={styles.detailGlobal}>
            <DisplayGlobalSearchedData onGoDetail={gotoGlobalSearchPage} />
          </div>
        )}
        <div className={styles.detailHeader}>
          <div className={styles.detailHeaderBasic}>
            <div className={styles.email}>
              <div className={styles.emailInfo}>{avatarInfo.mail}</div>
              <div
                className={styles.emailIcon}
                onClick={writeEmail}
                style={{
                  width: 16,
                  height: 16,
                }}
              >
                <Tooltip title={getIn18Text('XIEYOUJIAN')} placement="topLeft">
                  <EmailIcon />
                </Tooltip>
              </div>
            </div>
            <div className={styles.base}>
              <div className={styles.baseName}>
                <EllipsisTooltip>{avatarInfo.name.length > 0 ? avatarInfo.name : '-'}</EllipsisTooltip>
              </div>
              <Divider type="vertical" style={{ height: 20, color: '#F0F3F5', margin: '0 16px' }} />
              <div className={styles.baseGroup}>
                <EllipsisLabels
                  list={avatarInfo.groups.map(label => {
                    return {
                      label_id: label,
                      label_name: label,
                    } as any;
                  })}
                  // randomColor
                />
              </div>
            </div>
          </div>
          {hasContactPart && (
            <div className={styles.detailHeaderBtn}>
              {(hasOp || hasDelete) && (
                <Dropdown placement="bottomLeft" overlay={dropdownMenu} overlayClassName="address_contact_dropdown" className={styles.dropdown}>
                  <Button>···</Button>
                </Dropdown>
              )}
              <PrivilegeCheck accessLabel="OP" resourceLabel="ADDRESS_BOOK">
                <Button className={styles.edit} onClick={editContact}>
                  {getIn18Text('BIANJI')}
                </Button>
                <Button className={styles.transfer} onClick={transferGroup}>
                  {getIn18Text('ZHUANYIFENZU')}
                </Button>
                <Button type="primary" className={styles.add} onClick={addGroup}>
                  {getIn18Text('TIANJIAFENZU')}
                </Button>
              </PrivilegeCheck>
            </div>
          )}
        </div>
        <div className={styles.detailBody}>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <div className={styles.detailBodyItem}>
                <div className={styles.label}>{getIn18Text('LIANXIDIANHUA\uFF1A')}</div>
                <div className={styles.value}>{baseInfo.mobile.length ? baseInfo.mobile : '-'}</div>
              </div>
            </Col>
            <Col span={8}>
              <div className={styles.detailBodyItem}>
                <div className={styles.label}>{getIn18Text('ZHIWEI')}：</div>
                <div className={styles.value}>{baseInfo.jobTitle.length ? baseInfo.jobTitle : '-'}</div>
              </div>
            </Col>
            <Col span={8}>
              <div className={styles.detailBodyItem}>
                <div className={styles.label}>{getIn18Text('personalSocials')}：</div>
                <SocialList className={styles.value} list={baseInfo.personalSocials || []} />
              </div>
            </Col>
            <Col span={8}>
              <div className={styles.detailBodyItem}>
                <div className={styles.label}>{getIn18Text('CHUANGJIANFANGSHI\uFF1A')}</div>
                <div className={styles.value}>{baseInfo.origin}</div>
              </div>
            </Col>
            <Col span={8}>
              <div className={styles.detailBodyItem}>
                <div className={styles.label}>{getIn18Text('GUOJIA\uFF1A')}</div>
                <div className={styles.value}>
                  {countryInEnglish && countryInEnglish.length > 0 ? <NationFlag name={countryInEnglish} /> : <span>{baseInfo.country}</span>}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div className={styles.detailBodyItem}>
                <div className={styles.label}>{getIn18Text('GONGSIMINGCHENG\uFF1A')}</div>
                <div className={styles.value}>{baseInfo.companyName}</div>
              </div>
            </Col>
            <Col span={8}>
              <div className={styles.detailBodyItem}>
                <div className={styles.label}>{getIn18Text('GONGSIGUANWANG\uFF1A')}</div>
                <div className={styles.value}>
                  {baseInfo.companySite.length > 0 ? (
                    <a target="_blank" href={baseInfo.companySite.startsWith('http') ? baseInfo.companySite : 'http://' + baseInfo.companySite}>
                      {baseInfo.companySite}
                    </a>
                  ) : (
                    baseInfo.companySite
                  )}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div className={styles.detailBodyItem}>
                <div className={styles.label}>{getIn18Text('SHEJIAOPINGTAI\uFF1A')}</div>
                <SocialList className={styles.value} list={baseInfo.socials || []} />
              </div>
            </Col>
            <Col span={8}>
              <div className={styles.detailBodyItem}>
                <div className={styles.label}>{getIn18Text('BEIZHU\uFF1A')}</div>
                <div className={styles.value}>{baseInfo.remark}</div>
              </div>
            </Col>
          </Row>
        </div>
        <Divider style={{ color: '#F0F3F5' }} />
        <div className={styles.detailRemark}>
          <Tabs
            activeKey={activeTab}
            onChange={key => {
              setActiveTab(key as 'marketing' | 'email');
              if (key === 'marketing') {
                trackDetailAction('marketing_statistics');
              } else if (key === 'email') {
                trackDetailAction('to_and_fro_mail');
              }
            }}
            destroyInactiveTabPane
          >
            <Tabs.TabPane tab={getIn18Text('YINGXIAOTONGJI')} key="marketing">
              <MarketHistory style={{ paddingTop: 13, height: 313 }} contactEmail={avatarInfo.mail} />
            </Tabs.TabPane>
            <Tabs.TabPane tab={getIn18Text('WANGLAIYOUJIAN')} key="email">
              <div
                style={{
                  paddingTop: 13,
                }}
              >
                <EmailList addressId={addressId} />
              </div>
            </Tabs.TabPane>
          </Tabs>
        </div>
      </Modal>
      {hasContactPart && (
        <>
          <EditContact
            visible={editVisible}
            onClose={() => {
              setEditVisible(false);
              setOuterModalVisible(true);
            }}
            contactInfo={{
              companyName: baseInfo.companyName,
              companySite: baseInfo.companySite,
              country: [baseInfo.continent, baseInfo.country],
              groupIds: avatarInfo.groupIds,
              name: avatarInfo.name,
              remark: baseInfo.remark,
              mobile: baseInfo.mobile,
              jobPosition: baseInfo.jobTitle,
            }}
            addressId={addressId}
            contactId={contactId!}
            onSuccess={() => {
              setEditVisible(false);
              getContactDetail();
              setOuterModalVisible(true);
            }}
          />
          <ReturnOpenSea
            title={`将${avatarInfo.mail}退回公海`}
            visible={returnOpenSeaVisible}
            ids={[addressId!]}
            onSuccess={() => {
              setReturnOpenSeaVisible(false);
              trackDetailAction('backto_sea');
              onClose && onClose(id);
            }}
            onClose={() => {
              setReturnOpenSeaVisible(false);
              setOuterModalVisible(true);
            }}
            onError={() => {}}
          />
          <DeleteContacts
            visible={delContactsVisible}
            id={1}
            contacts={[addressId!]}
            onClose={() => {
              setDelContactsVisible(false);
              setOuterModalVisible(true);
            }}
            onSuccess={() => {
              setDelContactsVisible(false);
              trackDetailAction('delete_contact');
              onClose(id);
            }}
            onError={() => {}}
          />
          <TransferGroup
            id={1}
            onClose={() => {
              setTransferVisible(false);
              setOuterModalVisible(true);
            }}
            onError={() => {}}
            onSuccess={() => {
              setTransferVisible(false);
              if (isTransfer) {
                trackDetailAction('transferto_group');
              } else {
                trackDetailAction('addto_group');
              }
              onClose(id);
            }}
            addressIds={[addressId]}
            visible={transferVisible}
            sourceGroup={avatarInfo.groups}
            isTransfer={isTransfer}
            title={transferTitle}
            checkedIds={isTransfer ? avatarInfo.groupIds : []}
          />
        </>
      )}
    </div>
  );
}
