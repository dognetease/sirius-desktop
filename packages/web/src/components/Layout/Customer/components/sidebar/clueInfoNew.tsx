/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useMemo, useRef, useState, useImperativeHandle } from 'react';
import { Dropdown, Menu, Tabs, Tooltip } from 'antd';
import moment from 'moment';
import lodashGet from 'lodash/get';
import {
  apiHolder,
  apis,
  CustomerAuthDataType,
  CustomerDetail,
  FollowsType,
  SystemApi,
  ContactItem,
  CustomerApi,
  getIn18Text,
  MailPlusCustomerApi,
  EmailRoles,
  IGetContactListParams,
  ContactDetail,
  ContactModel,
} from 'api';
import classnames from 'classnames';
import CreateScheduleBox from '@web-schedule/components/CreateBox/CreateBox';
import { initDefaultMoment, getContanctObjs } from '@web-schedule/components/CreateBox/util';
import { ScheduleSyncObInitiator } from '@web-schedule/data';
import { ScheduleActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { SchedulePageEventData } from '@web-schedule/components/CreateBox/EventBody';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { transServerCustomerContactModel2ContactDetail } from '@web-common/components/util/contact';
import outerStyle from './index.module.scss';
import style from './header.module.scss';
import * as defaultLogo from '@/images/icons/customerDetail/default-logo.png';
import { CustomerBaseInfo } from './component/baseInfo';
import { MailSidebarFollows } from './component/follows/follows';
import { createShiftManagerModal } from '../ShiftModal/shiftManager';
import { EmailList } from './component/emailList/list';
import { ContactList } from './component/contactList/customerContactList';
import { CardType, MailSidebarTracker, SideBarActions, TabNameMap } from './tracker';

import SalesPitchPageHoc from '@/components/Layout/EnterpriseSetting/salesPitch';
// import SalesPitchGuideHoc from '@/components/Layout/EnterpriseSetting/salesPitch/components/salesPitchGuide';
import { salesPitchManageTrack } from '@/components/Layout/EnterpriseSetting/salesPitch/utils/util';
import { PrivilegeCheckForMailPlus } from '@/components/UI/PrivilegeEnhance';
import { ReactComponent as More } from '@/images/icons/more.svg';
import { clueBackToOpenseaModal, openseaLeadsReceiveModal } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawerLeads2';
import { ClueBaseInfo } from './component/clueBaseInfo';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
import { UniDrawerModuleId, showUniDrawer } from '@lxunit/app-l2c-crm';
import { BusinessContactVO } from '@lxunit/app-l2c-crm/models';

// 操作类型，编辑客户，新建日程，写跟进，添加负责人，新建商机，退回公海，认领线索
export type actionKeyString = 'edit' | 'newSchedule' | 'newFollow' | 'toCustomer' | 'returnOpenSea' | 'getClue';

interface SidebarClueInfoProps {
  info?: CustomerDetail;
  onEdit?: () => void;
  onEditContact?: (contactId: string, email?: string) => void;
  actionKeys: actionKeyString[];
  hasBusiness?: boolean; // 是否有商机模块，uni替换后可能没有商机
  onAddManagerSuccess?: () => void;
  refresh?: () => void; // tab切换要求重新请求数据
  isOpenSea?: boolean; // 是否是公海客户
  // customerRole?: EmailRoles; // 客户角色
  contactModel?: ContactModel; // email和account换来的ContactModel
  originName?: string; // 备用的昵称
  hideAddOpportunity?: boolean; // 是否隐藏新建商机按钮，默认false
}

const { TabPane } = Tabs;
// 现在只展示为按钮，icon目前是无意义的
const actions: Array<{
  key: actionKeyString;
  label: string;
  resourceLabel?: string;
  accessLabel?: string;
}> = [
  {
    key: 'edit',
    label: getIn18Text('BIANJIXIANSUO'),
  },
  {
    key: 'newFollow',
    label: getIn18Text('XIEGENJIN'),
  },
  {
    key: 'toCustomer',
    label: getIn18Text('ZHUANKEHU'),
  },
  {
    key: 'newSchedule',
    label: getIn18Text('XINJIANRICHENG'),
  },
  {
    key: 'returnOpenSea',
    label: getIn18Text('TUIHUIGONGHAI'),
  },
  {
    key: 'getClue',
    label: getIn18Text('RENLINGWEIWODEXS'),
    resourceLabel: 'CHANNEL_OPEN_SEA',
    accessLabel: 'CLAIM',
  },
];
const actionMap: Record<string, SideBarActions> = {
  edit: SideBarActions.Edit,
  newSchedule: SideBarActions.AddSchedule,
  newFollow: SideBarActions.AddFollowup,
  toCustomer: SideBarActions.ClueToCustomer,
  returnOpenSea: SideBarActions.BackToOpenSea, // 退回公海
};

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const mailPlusCustomerApi = apiHolder.api.requireLogicalApi(apis.mailPlusCustomerApiImpl) as MailPlusCustomerApi;

// 联系人分页请求，页码大小
const contactListPageSize = 100;

// 邮件+线索侧边栏详情组件
export const SidebarClueInfo = React.forwardRef((props: SidebarClueInfoProps, ref) => {
  const SalesPitchPage = useMemo(() => SalesPitchPageHoc('readMailAside'), []);
  // const SalesPitchGuide = useMemo(() => SalesPitchGuideHoc('1'), []);

  const {
    info,
    onEdit,
    onEditContact,
    actionKeys,
    hasBusiness = true,
    onAddManagerSuccess,
    refresh,
    isOpenSea = false,
    contactModel,
    originName,
    hideAddOpportunity = false,
  } = props;
  const [activeTab, setActiveTab] = useState('0');
  const [isEditFollow, setIsEditFollow] = useState(false);
  const followsRef = useRef<any>(null);
  // web是否新建日程
  const [showBox, setShowbox] = useState(false);
  const scheduleActions = useActions(ScheduleActions);
  const { catalogList, unSelectedCatalogIds } = useAppSelector(state => state.scheduleReducer);
  // 新建日程的contactItem[]
  const [scheduleContactItemList, setScheduleContactItemList] = useState<ContactItem[]>([]);
  // 联系人数据
  const [contactInfo, setContactInfo] = useState<{ list: ContactDetail[]; total: number; page: number }>({ list: [], total: 0, page: 1 });
  // 客户角色
  const customerRole = useMemo(() => contactModel && contactModel.customerOrgModel?.role, [contactModel]);
  // 线索状态映射
  const [statusObj, setStatusObj] = useState<Record<number, string>>();
  // 线索来源映射
  const [sourceObj, setSourceObj] = useState<Record<number, string>>();
  // 线索星级映射
  const [starLevelObj, setStarLevelObj] = useState<Record<number, string>>();
  // uni客户弹窗
  // const [, setUniCustomerParam] = useState2RM('uniCustomerParam');

  // 是否是无权限的同事客户
  const isNoAuth = useMemo(() => customerRole && customerRole === 'colleagueClueNoAuth', [customerRole]);
  // 获取联系人数据
  const getContactInfo = async (page: number) => {
    if (customerRole && info?.origin_company_id && ['myClue', 'colleagueClue', 'openSeaClue'].includes(customerRole)) {
      const params = {
        id: info.origin_company_id,
        emailRole: customerRole,
        page,
        pageSize: contactListPageSize,
      } as IGetContactListParams;
      const res = await mailPlusCustomerApi.doGetContactListByCompanyId(params);
      const { totalSize, page: pageNum, data, success } = res;
      if (success) {
        const contactList = transServerCustomerContactModel2ContactDetail(data);
        const contactInfoList = pageNum === 1 ? contactList : [...contactInfo.list, ...contactList];
        setContactInfo({ list: contactInfoList, total: totalSize, page });
      } else {
        setContactInfo({ list: [], total: 0, page: 1 });
        console.log('客户侧边栏获取联系人数据失败');
      }
    }
  };
  // 分页获取更多联系人
  const getMoreContactInfo = () => {
    getContactInfo(contactInfo.page + 1);
  };
  // 刷新联系人数据，编辑联系人成功后刷新,认领客户成功，退回公海成功后
  const refreshContactList = () => {
    getContactInfo(1);
  };
  // 获取线索状态映射表
  const getClueStatusInfo = () => {
    mailPlusCustomerApi.doGetClueStatus('leads').then(res => {
      const objStatus: Record<number, string> = {};
      const objSource: Record<number, string> = {};
      const objStarLevel: Record<number, string> = {};
      res?.status?.forEach(i => {
        objStatus[i.id] = i.value as string;
      });
      res?.source?.forEach(i => {
        objSource[i.id] = i.value as string;
      });
      res?.star_level?.forEach(i => {
        objStarLevel[i.id] = i.value as string;
      });
      setStatusObj(objStatus);
      setSourceObj(objSource);
      setStarLevelObj(objStarLevel);
    });
  };
  // info变化,重新获取联系人
  useEffect(() => {
    getContactInfo(1); // 联系人
    getClueStatusInfo(); // 线索字典映射表
  }, [info?.company_id]);

  // 话术库展示打点
  useEffect(() => {
    if (info?.company_id && activeTab === '3') {
      salesPitchManageTrack({ opera: 'SHOW' });
    }
  }, [activeTab, info?.company_id]);

  const managers = info ? info.manager_list?.map(item => item.manager_name || '-').join('，') : '-';

  // 获取新建日程需要的结构
  useEffect(() => {
    // 默认联系人
    const currentUser = systemApi.getCurrentUser()?.id || '';
    const emailList = info?.contact_list?.filter(item => item.main_contact).map(item => item.email) || [];
    const users = [...new Set([...emailList, currentUser])];
    getContanctObjs(users).then(contactLists => setScheduleContactItemList(contactLists));
  }, [info?.contact_list]);

  // 新建日程
  const createSchedule = async () => {
    const defaultMoment = initDefaultMoment();
    const creatDirectStartTime = defaultMoment.startTime;
    const creatDirectEndTime = defaultMoment.endTime;
    // 获取日历
    if (systemApi.isElectron()) {
      const initData: SchedulePageEventData = {
        catalogList,
        unSelectedCatalogIds,
        creatDirectStartTimeStr: creatDirectStartTime.format('YYYY-MM-DD HH:mm'),
        creatDirectEndTimeStr: creatDirectEndTime.format('YYYY-MM-DD HH:mm'),
        defaultContactList: scheduleContactItemList,
        source: ScheduleSyncObInitiator.MAIL_MODULE,
        belongIdStr: 'customerSideBar',
      };
      systemApi.createWindowWithInitData('scheduleOpPage', { eventName: 'initPage', eventData: initData });
      return;
    }
    scheduleActions.setCreatDirectStartTime(creatDirectStartTime);
    scheduleActions.setCreatDirectEndTime(creatDirectEndTime);
    setShowbox(true);
  };

  const handleScheduleClose = (data: any) => {
    if (data) {
      const params = {
        start: data.startDate || moment(lodashGet(data, 'data.moments.startDate', moment())).format('YYYY-MM-DD HH:mm:ss'),
        subject: data.summary || lodashGet(data, 'data.summary', ''),
        company_id: info?.company_id,
      };
      customerApi.createCustomerSchedule(params).then(() => {
        followsRef.current?.refresh();
      });
    }
    setShowbox(false);
  };

  useImperativeHandle(ref, () => ({
    setActiveTab,
    refreshContactList,
  }));

  // 认领
  const getClue = () => {
    if (info?.company_id) {
      openseaLeadsReceiveModal(info.company_id, () => {
        // 更新一下redux
        refresh && refresh();
      });
    }
  };
  // 退回公海
  const returnOpenSea = () => {
    if (info?.company_id) {
      clueBackToOpenseaModal(info.company_id, () => {
        // 更新一下redux
        refresh && refresh();
      });
    }
  };
  // 转客户，就是新建客户
  const toCustomer = () => {
    if (info?.company_id) {
      // setUniCustomerParam({
      //   visible: true,
      //   source: 'mailListStrangerSideBar',
      //   scenario: 'leadConvertCustomer',
      //   customerId: +info?.company_id,
      //   customerData: {
      //     company_name: info.company_name,
      //     company_domain: info.company_domain,
      //     area: info.area,
      //     contact_list: info.contact_list?.map(i => ({
      //       condition: 'company',
      //       contact_name: i.contact_name,
      //       email: i.email,
      //     })),
      //   },
      //   onSuccess: () => {
      //     refresh && refresh();
      //   },
      // });
      showUniDrawer({
        moduleId: UniDrawerModuleId.CustomerDetail,
        moduleProps: {
          visible: true,
          onClose: () => {},
          onSuccess: () => {
            refresh && refresh();
          },
          customerId: +info?.company_id,
          customerData: {
            company_name: info.company_name,
            company_domain: info.company_domain,
            area: info.area,
            contact_list: info.contact_list?.map(
              i =>
                ({
                  condition: 'company',
                  contact_name: i.contact_name,
                  email: i.email,
                } as unknown as BusinessContactVO)
            ),
          },
          source: 'mailListStrangerSideBar',
          scenario: 'leadConvertCustomer',
        },
      });
    }
  };

  // 监听electron中日程创建成功
  useMsgRenderCallback('syncScheduleState', e => {
    if (e.eventStrData === 'customerSideBar') {
      handleScheduleClose(e.eventData);
    }
  });

  // 点击按钮
  const handleActionClick = (key: actionKeyString) => {
    if (!info) return;
    switch (key) {
      case 'edit':
        onEdit && onEdit();
        break;
      case 'newFollow':
        setActiveTab('1');
        setIsEditFollow(true);
        break;
      case 'newSchedule':
        createSchedule();
        break;
      case 'returnOpenSea':
        returnOpenSea();
        break;
      case 'getClue':
        getClue();
        break;
      case 'toCustomer':
        toCustomer();
        break;
      default:
        break;
    }
    // 缺少认领为我的线索打点
    MailSidebarTracker.trackAction(CardType.Customer, actionMap[key]);
  };

  // 依赖项去掉isOpenSea，可以取到最新值，又不至于多次刷新
  const resource = useMemo(
    () => ({
      id: info ? info.company_id : '',
      customerType: (isOpenSea ? 'openSea' : 'clue') as FollowsType,
    }),
    [info?.company_id]
  );

  const website = useMemo(() => {
    const href = info?.website || info?.company_domain;
    if (href) {
      const link = href.startsWith('https://') || href.startsWith('http://') ? href : 'http://' + href;
      return (
        <a href={link} target="_blank" rel="noreferrer">
          {href}
        </a>
      );
    }
    return '-';
  }, [info?.website, info?.company_domain]);

  const displayActions = useMemo(() => {
    if (!actionKeys) return actions;
    const map: Record<string, number> = {};
    actionKeys?.forEach(k => {
      map[k] = 1;
    });
    return actions.filter(item => map[item.key] === 1);
  }, [actionKeys]);

  // 更多下来中点击tab
  const selectTab = (val: string) => {
    setActiveTab(val);
    setTimeout(() => {
      const activeTabs = document.querySelectorAll('.waimao-tabs .ant-tabs-tab-active');
      if (activeTabs && activeTabs.length) {
        activeTabs.forEach(activeTab => {
          activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' });
        });
      }
    }, 100);
  };

  // 话术库title
  // const salesPitchTabTitle = useMemo(
  //   () => (
  //     <SalesPitchGuide>
  //       <span>{getIn18Text('HUASHUKU')}</span>
  //     </SalesPitchGuide>
  //   ),
  //   []
  // );
  const salesPitchTabTitle = getIn18Text('HUASHUKU');

  // 渲染操作，如果操作数，小于等于4则正常展示，否则折叠起来
  const maxButtonNum = 4; // 最多展示多少个按钮
  const renderActions = (
    _displayActions: {
      accessLabel?: string;
      resourceLabel?: string;
      key: actionKeyString;
      label: string;
    }[]
  ) => {
    if (_displayActions.length > maxButtonNum) {
      return (
        <>
          {/* 前三个正常展示 */}
          {_displayActions.slice(0, maxButtonNum - 1).map(i => (
            <PrivilegeCheckForMailPlus resourceLabel={i.resourceLabel || 'CHANNEL'} accessLabel={i.accessLabel || 'OP'}>
              <Button key={i.key} onClick={() => handleActionClick(i.key)} className={style.actionbtn} btnType="minorGray" inline>
                {i.label}
              </Button>
            </PrivilegeCheckForMailPlus>
          ))}
          <Dropdown
            overlayClassName="u-tree-dropmenu"
            overlayStyle={{ width: 'auto' }}
            placement="bottomLeft"
            overlay={
              <Menu>
                {_displayActions.slice(maxButtonNum - 1).map(i => (
                  <Menu.Item key={i.key}>
                    <PrivilegeCheckForMailPlus resourceLabel={i.resourceLabel || 'CHANNEL'} accessLabel={i.accessLabel || 'OP'}>
                      <span onClick={() => handleActionClick(i.key)}>{i.label}</span>
                    </PrivilegeCheckForMailPlus>
                  </Menu.Item>
                ))}
              </Menu>
            }
          >
            <div className={classnames(style.moreBtn, style.actionbtn)}>
              <More />
            </div>
          </Dropdown>
        </>
      );
    }
    return _displayActions.map(i => (
      <PrivilegeCheckForMailPlus resourceLabel={i.resourceLabel || 'CHANNEL'} accessLabel={i.accessLabel || 'OP'}>
        <Button key={i.key} onClick={() => handleActionClick(i.key)} className={style.actionbtn} btnType="minorGray" inline>
          {i.label}
        </Button>
      </PrivilegeCheckForMailPlus>
    ));
  };

  // 渲染tab
  const renderTabList = () => {
    let TabPaneList: {
      title: React.ReactElement | string;
      key: string;
      children: React.ReactElement | undefined;
      show?: boolean;
    }[] = [];
    // 无权限的同事客户，仅仅展示话术库
    if (isNoAuth) {
      TabPaneList = [{ title: salesPitchTabTitle, key: '0', children: <SalesPitchPage /> }];
    } else {
      // tab配置提取出来
      TabPaneList = [
        {
          title: salesPitchTabTitle,
          key: '0',
          children: <SalesPitchPage />,
        },
        {
          title: getIn18Text('DONGTAI'),
          key: '1',
          children: info && (
            <MailSidebarFollows
              ref={followsRef}
              visible={activeTab === '1'}
              resource={resource}
              onEditorClose={() => setIsEditFollow(false)}
              isEdit={isEditFollow}
              disabled={!!isOpenSea}
            />
          ),
        },
        {
          title: getIn18Text('JICHUXINXI'),
          key: '2',
          children: (
            <ClueBaseInfo
              data={
                {
                  ...info,
                  source: (sourceObj && info?.source && sourceObj[+info?.source]) || info?.source,
                  star_level: (starLevelObj && info?.star_level && starLevelObj[+info?.star_level]) || info?.star_level,
                } as CustomerDetail
              }
              emailRole={customerRole}
            />
          ),
        },
        {
          title: `${getIn18Text('LIANXIREN')}${+contactInfo.total ? '(' + (contactInfo.total > 99 ? '99+' : contactInfo.total) + ')' : ''}`,
          key: '3',
          children: <ContactList readonly={!!isOpenSea} list={contactInfo.list} totalSize={contactInfo.total} onEdit={onEditContact} loadMore={getMoreContactInfo} />,
        },
        {
          title: getIn18Text('WANGLAIYOUJIAN'),
          key: '4',
          children: info && <EmailList resourceId={info.origin_company_id} condition={CustomerAuthDataType.Clue} />,
        },
      ];
    }
    return (
      <Tabs
        className={classnames('waimao-tabs', style.flexTabs)}
        activeKey={activeTab}
        onChange={val => selectTab(val)}
        tabBarGutter={16}
        animated={{ tabPane: true }}
        tabBarExtraContent={
          TabPaneList.length > 4 && {
            right: (
              <Dropdown
                overlayClassName="u-tree-dropmenu"
                overlayStyle={{ width: 'auto' }}
                placement="bottomLeft"
                overlay={
                  <Menu>
                    {TabPaneList.map(tabItem => (
                      <Menu.Item
                        key={tabItem.key}
                        onClick={() => {
                          selectTab(tabItem.key);
                        }}
                      >
                        {tabItem.title}
                      </Menu.Item>
                    ))}
                  </Menu>
                }
              >
                <div className={classnames(style.moreBtn, style.actionbtn, style.moreTabBtn)}>
                  <More />
                </div>
              </Dropdown>
            ),
          }
        }
      >
        {TabPaneList.map(tabItem => (
          <TabPane tab={tabItem.title} key={tabItem.key}>
            {tabItem.children}
          </TabPane>
        ))}
      </Tabs>
    );
  };
  const showEmail = contactModel?.contact.displayEmail || contactModel?.contact.accountName;
  // 展示的名称
  const showContactName = contactModel?.contact.contactName || originName || showEmail;

  return (
    <>
      <div className={classnames(style.infoContainer, outerStyle.columnFlexContainer)}>
        <div className={style.header}>
          <div className={style.headerInfo}>
            {
              // 是否是无权限的同事线索
              !isNoAuth ? (
                <div className={style.headerInfoMain}>
                  <div className={style.flexRow}>
                    <img alt="logo" className={style.companyLogo} src={info?.company_logo || defaultLogo} />
                    <span className={style.companyName} title={info?.company_name}>
                      {info?.company_name}
                    </span>
                  </div>
                  <div className={style.row} style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}>
                    <span>{getIn18Text('XIANSUOZHUANGTAI')}:</span>
                    <span>
                      {statusObj && info?.status && statusObj[+info?.status] ? (
                        <Tag type="label-6-1" hideBorder={true}>
                          {statusObj[+info?.status]}
                        </Tag>
                      ) : (
                        '-'
                      )}
                    </span>
                  </div>
                  <div className={style.row}>
                    <span>{getIn18Text('GONGSIGUANWANG')}:</span>
                    <span>{website}</span>
                  </div>
                  <div className={style.row}>
                    <span>{getIn18Text('FUZEREN')}:</span>
                    <Tooltip title={managers}>{managers}</Tooltip>
                  </div>
                </div>
              ) : (
                <div className={style.headerInfoMain}>
                  <div className={style.flexRow}>
                    <span className={style.companyName} title={showContactName}>
                      {showContactName}
                    </span>
                  </div>
                  <div className={style.row} style={{ marginTop: 16 }}>
                    <span>
                      {getIn18Text('YOUXIANG')}: {showEmail || '-'}
                    </span>
                  </div>
                </div>
              )
            }
          </div>
          {!isNoAuth && (
            <div className={style.actions}>
              {/* 渲染操作 */}
              {renderActions(displayActions)}
            </div>
          )}
        </div>
        <div className={style.body}>{renderTabList()}</div>
      </div>
      {showBox && (
        <div className={style.schedule}>
          <CreateScheduleBox
            source={ScheduleSyncObInitiator.MAIL_MODULE}
            defaultContactList={scheduleContactItemList}
            onCancel={data => handleScheduleClose(data)}
            getReferenceElement={() => null}
          />
        </div>
      )}
    </>
  );
});
